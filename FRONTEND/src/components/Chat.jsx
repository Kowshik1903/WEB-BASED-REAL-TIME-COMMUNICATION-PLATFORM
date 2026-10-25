import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL, api } from "../api";
import { loadJSON, playPing, saveJSON } from "../utils";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";

const isMobile = () => window.matchMedia?.("(max-width: 760px)").matches;
const newLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const dedupe = (list) => {
  const seen = new Set();
  return list.filter((m) => {
    if (!m._id) return true;
    if (seen.has(m._id)) return false;
    seen.add(m._id);
    return true;
  });
};

export default function Chat({ token, username, onLogout, theme, setTheme, sound, setSound }) {
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [last, setLast] = useState({}); // username -> last message
  const [unread, setUnread] = useState({}); // username -> count
  const [typing, setTyping] = useState({}); // username -> true
  const [unreadInfo, setUnreadInfo] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const activeRef = useRef(null);
  const soundRef = useRef(sound);
  const knownUsersRef = useRef(new Set());
  const loadedConvosRef = useRef(new Set());
  const typingTimers = useRef({});
  const lastTypingEmit = useRef(0);
  const readKey = `chat_lastread_${username}`;
  const readMapRef = useRef(null);
  if (!readMapRef.current) readMapRef.current = loadJSON(readKey, {});

  useEffect(() => {
    activeRef.current = activeUser;
  }, [activeUser]);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Auto-dismiss errors
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(id);
  }, [error]);

  /* ---------- contacts + conversation previews ---------- */
  const loadConversations = useCallback(
    async (names) => {
      const todo = names.filter((n) => !loadedConvosRef.current.has(n));
      todo.forEach((n) => loadedConvosRef.current.add(n));
      if (!todo.length) return;

      const results = await Promise.allSettled(todo.map((n) => api.messages(token, n)));
      const lastPatch = {};
      const unreadPatch = {};
      const readMap = readMapRef.current;

      results.forEach((r, i) => {
        const name = todo[i];
        if (r.status !== "fulfilled") {
          loadedConvosRef.current.delete(name);
          return;
        }
        const msgs = r.value;
        const lm = msgs[msgs.length - 1];
        if (lm) lastPatch[name] = lm;
        if (!readMap[name]) readMap[name] = lm?.createdAt || new Date().toISOString();
        const lr = Date.parse(readMap[name]);
        unreadPatch[name] = msgs.filter((m) => m.sender === name && Date.parse(m.createdAt) > lr).length;
      });

      saveJSON(readKey, readMap);
      setLast((prev) => {
        const next = { ...prev };
        for (const [n, m] of Object.entries(lastPatch)) {
          if (!next[n] || Date.parse(next[n].createdAt) < Date.parse(m.createdAt)) next[n] = m;
        }
        return next;
      });
      setUnread((prev) => {
        const next = { ...prev };
        for (const [n, c] of Object.entries(unreadPatch)) if (next[n] === undefined) next[n] = c;
        return next;
      });
    },
    [token, readKey]
  );

  const loadUsers = useCallback(async () => {
    try {
      const { users } = await api.users(token);
      const names = users.map((u) => u.username).sort((a, b) => a.localeCompare(b));
      knownUsersRef.current = new Set(names);
      setUsers(names);
      setUsersLoaded(true);
      loadConversations(names);
    } catch (err) {
      setError(err.message);
      setUsersLoaded(true);
    }
  }, [token, loadConversations]);

  useEffect(() => {
    loadUsers();
    const id = setInterval(loadUsers, 20000);
    return () => clearInterval(id);
  }, [loadUsers]);

  /* ---------- socket ---------- */
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("userOnline", username);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Live updates are reconnecting. Your saved messages are still safe.");
    });
    socket.on("onlineUsers", (list) => setOnlineUsers(list));

    // Optional: needs the small "typing" relay in server.js (see README). Ignored otherwise.
    socket.on("typing", ({ sender } = {}) => {
      if (!sender) return;
      setTyping((p) => ({ ...p, [sender]: true }));
      clearTimeout(typingTimers.current[sender]);
      typingTimers.current[sender] = setTimeout(
        () =>
          setTyping((p) => {
            const { [sender]: _x, ...rest } = p;
            return rest;
          }),
        3500
      );
    });

    socket.on("receiveMessage", (msg) => {
      if (!msg || (msg.sender !== username && msg.receiver !== username)) return;
      const other = msg.sender === username ? msg.receiver : msg.sender;
      const incoming = msg.sender !== username;

      setLast((prev) => ({ ...prev, [other]: msg }));
      if (incoming) setTyping((p) => (p[other] ? { ...p, [other]: false } : p));

      if (activeRef.current === other) {
        setMessages((prev) => (prev.some((m) => m._id && m._id === msg._id) ? prev : [...prev, msg]));
      } else if (incoming) {
        setUnread((prev) => ({ ...prev, [other]: (prev[other] || 0) + 1 }));
        if (!knownUsersRef.current.has(other)) loadUsers();
      }

      if (incoming && soundRef.current && (document.hidden || activeRef.current !== other)) playPing();
    });

    return () => {
      Object.values(typingTimers.current).forEach(clearTimeout);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [username, token, loadUsers]);

  /* ---------- open a conversation ---------- */
  useEffect(() => {
    if (!activeUser) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);
    api
      .messages(token, activeUser)
      .then((data) => !cancelled && setMessages(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadingMessages(false));
    return () => {
      cancelled = true;
    };
  }, [activeUser, token]);

  // Keep read-marker + chat-list preview in sync with the open conversation
  useEffect(() => {
    if (!activeUser || loadingMessages || !messages.length) return;
    const saved = [...messages].reverse().find((m) => !m.status && m.createdAt);
    if (saved) {
      readMapRef.current[activeUser] = saved.createdAt;
      saveJSON(readKey, readMapRef.current);
    }
    const lm = messages[messages.length - 1];
    setLast((prev) => (prev[activeUser] === lm ? prev : { ...prev, [activeUser]: lm }));
  }, [messages, activeUser, loadingMessages, readKey]);

  /* ---------- selection + browser/mobile back button ---------- */
  const selectUser = useCallback((name) => {
    const count = unread[name] || 0;
    setUnreadInfo(count ? { after: readMapRef.current[name], count } : null);
    setUnread((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _x, ...rest } = prev;
      return rest;
    });
    setError("");
    if (isMobile() && !window.history.state?.chat) window.history.pushState({ chat: true }, "");
    if (name !== activeRef.current) {
      setMessages([]); // don't flash the previous conversation
      setLoadingMessages(true);
    }
    setActiveUser(name);
  }, [unread]);

  const closeChat = useCallback(() => {
    if (isMobile() && window.history.state?.chat) window.history.back();
    else setActiveUser(null);
  }, []);

  useEffect(() => {
    const onPop = () => setActiveUser(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented && activeRef.current) closeChat();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeChat]);

  // Tab title: (3) Chat Portal
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
  useEffect(() => {
    document.title = totalUnread ? `(${totalUnread}) Chat Portal` : "Chat Portal";
    return () => {
      document.title = "Chat Portal";
    };
  }, [totalUnread]);

  /* ---------- sending (optimistic, with retry) ---------- */
  async function deliver(localId, receiver, payload) {
    try {
      const saved = await api.sendMessage(token, receiver, payload);
      setMessages((prev) => dedupe(prev.map((m) => (m.localId === localId ? saved : m))));
      setLast((prev) => ({ ...prev, [receiver]: saved }));
      socketRef.current?.emit("sendMessage", saved);
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.localId === localId ? { ...m, status: "failed" } : m)));
      setError(err.message);
    }
  }

  function sendMessage({ text = "", attachments = [] }) {
    if (!activeUser) return;
    const localId = newLocalId();
    const pending = {
      localId,
      sender: username,
      receiver: activeUser,
      text,
      attachments,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    setMessages((prev) => [...prev, pending]);
    deliver(localId, activeUser, { text, attachments });
  }

  function retryMessage(localId) {
    const m = messages.find((x) => x.localId === localId);
    if (!m) return;
    setMessages((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "sending" } : x)));
    deliver(localId, m.receiver, { text: m.text, attachments: m.attachments || [] });
  }

  function deleteMessage(localId) {
    setMessages((prev) => prev.filter((m) => m.localId !== localId));
  }

  function handleTyping() {
    const now = Date.now();
    if (now - lastTypingEmit.current < 2000 || !activeRef.current) return;
    lastTypingEmit.current = now;
    socketRef.current?.emit("typing", { sender: username, receiver: activeRef.current });
  }

  return (
    <div className={`app ${activeUser ? "chat-open" : ""}`}>
      <Sidebar
        username={username}
        users={users}
        loaded={usersLoaded}
        onlineUsers={onlineUsers}
        unread={unread}
        last={last}
        typing={typing}
        activeUser={activeUser}
        connected={connected}
        onSelect={selectUser}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
        sound={sound}
        setSound={setSound}
      />
      <ChatWindow
        username={username}
        activeUser={activeUser}
        online={activeUser ? onlineUsers.includes(activeUser) : false}
        typing={activeUser ? !!typing[activeUser] : false}
        messages={messages}
        loading={loadingMessages}
        unreadInfo={unreadInfo}
        error={error}
        onDismissError={() => setError("")}
        onSend={sendMessage}
        onTyping={handleTyping}
        onRetry={retryMessage}
        onDelete={deleteMessage}
        onBack={closeChat}
      />
    </div>
  );
}
