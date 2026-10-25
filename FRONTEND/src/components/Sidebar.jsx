import { useEffect, useMemo, useRef, useState } from "react";
import { formatListTime, messagePreview } from "../utils";
import Avatar from "./Avatar.jsx";
import Icon from "./Icons.jsx";
import Ticks from "./Ticks.jsx";

const FILTERS = [
  ["all", "All Chats"],
  ["unread", "Unread"],
  ["online", "Online"],
];
const THEME_LABEL = { system: "System", light: "Light", dark: "Dark" };
const NEXT_THEME = { system: "light", light: "dark", dark: "system" };

export default function Sidebar({
  username, users, loaded, onlineUsers, unread, last, typing, activeUser, connected,
  onSelect, onLogout, theme, setTheme, sound, setSound,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target) && !e.target.closest("[data-menu-toggle]")) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.toLowerCase().includes(q))
      .filter((u) => (filter === "unread" ? unread[u] > 0 : filter === "online" ? onlineUsers.includes(u) : true))
      .sort((a, b) => {
        const at = last[a]?.createdAt ? Date.parse(last[a].createdAt) : 0;
        const bt = last[b]?.createdAt ? Date.parse(last[b].createdAt) : 0;
        if (at !== bt) return bt - at;
        const ao = onlineUsers.includes(a) ? 0 : 1;
        const bo = onlineUsers.includes(b) ? 0 : 1;
        return ao - bo || a.localeCompare(b);
      });
  }, [users, onlineUsers, unread, last, query, filter]);

  const emptyText = !loaded
    ? null
    : users.length === 0
    ? "No other users yet. Register another account to start chatting!"
    : filter === "unread"
    ? "No unread chats"
    : filter === "online"
    ? "Nobody else is online right now"
    : "No chats found";

  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <div className="me greeting">
          <span>Hello,</span>
          <strong>{username}</strong>
        </div>
        <div className="menu-wrap">
          <button
            data-menu-toggle
            className={`icon-btn ${menu ? "active" : ""}`}
            onClick={() => setMenu((v) => !v)}
            aria-label="Menu"
            aria-expanded={menu}
          >
            <Icon name="more" />
          </button>
          {menu && (
            <div className="menu" ref={menuRef} role="menu">
              <button role="menuitem" onClick={() => setTheme(NEXT_THEME[theme])}>
                <Icon name={theme === "dark" ? "moon" : "sun"} size={20} />
                Theme: {THEME_LABEL[theme]}
              </button>
              <button role="menuitem" onClick={() => setSound(!sound)}>
                <Icon name={sound ? "volume" : "volumeOff"} size={20} />
                Sound: {sound ? "On" : "Off"}
              </button>
              <hr />
              <button role="menuitem" onClick={onLogout}>
                <Icon name="logout" size={20} />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {!connected && <div className="conn-bar">Connecting to server…</div>}

      <div className="search">
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder="Search or start a new chat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search chats"
        />
      </div>

      <div className="filters" role="tablist">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={filter === id}
            className={`chip ${filter === id ? "active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="user-list">
        {!loaded &&
          Array.from({ length: 7 }).map((_, i) => (
            <li key={i} className="skel-row" aria-hidden="true">
              <div className="skel-circle" />
              <div className="skel-lines">
                <div style={{ width: `${40 + ((i * 13) % 35)}%` }} />
                <div style={{ width: `${55 + ((i * 17) % 30)}%` }} />
              </div>
            </li>
          ))}

        {emptyText && list.length === 0 && <li className="empty-list">{emptyText}</li>}

        {list.map((u) => {
          const online = onlineUsers.includes(u);
          const lm = last[u];
          const mine = lm && lm.sender === username;
          const count = unread[u] || 0;
          return (
            <li key={u}>
              <button className={`user-item ${activeUser === u ? "active" : ""}`} onClick={() => onSelect(u)}>
                <Avatar name={u} size={49} online={online} />
                <div className="user-meta">
                  <div className="row-top">
                    <span className="user-name">{u}</span>
                    {lm?.createdAt && (
                      <time className={count ? "time unread-time" : "time"}>{formatListTime(lm.createdAt)}</time>
                    )}
                  </div>
                  <div className="row-bottom">
                    <span className="preview">
                      {typing[u] ? (
                        <span className="typing-text">typing…</span>
                      ) : lm ? (
                        <>
                          {mine && <Ticks status={lm.status} delivered={online} size={16} />}
                          <span className="preview-text">{messagePreview(lm)}</span>
                        </>
                      ) : (
                        <span className="preview-text">{online ? "online" : "Tap to start chatting"}</span>
                      )}
                    </span>
                    {count > 0 && <span className="badge">{count > 99 ? "99+" : count}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
