import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { dayLabel, isSameDay } from "../utils";
import Avatar from "./Avatar.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import Icon from "./Icons.jsx";
import MessageBubble from "./MessageBubble.jsx";

const GROUP_GAP_MS = 5 * 60 * 1000;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 8 * 1024 * 1024;

const FEATURED_GIFS = [
  { label: "Celebrate", url: "https://media.giphy.com/media/3o7TKsQ8UQfH7xR0uY/giphy.gif" },
  { label: "Love it", url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" },
  { label: "Nice", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
  { label: "Hello", url: "https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif" },
];

function toFileAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => resolve({
      type: file.type.startsWith("image/") ? "image" : "document",
      name: file.name || "Attachment",
      url: reader.result,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    });
    reader.readAsDataURL(file);
  });
}

function GifPicker({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const visible = FEATURED_GIFS.filter((gif) => gif.label.toLowerCase().includes(query.trim().toLowerCase()));

  function addUrl(event) {
    event.preventDefault();
    if (!/^https:\/\/.+/i.test(url.trim())) return setError("Paste a secure https:// GIF link.");
    onPick({ label: "GIF", url: url.trim() });
  }

  return <section className="gif-picker" aria-label="GIF picker">
    <div className="picker-head"><strong>Choose a GIF</strong><button type="button" className="icon-btn tiny" onClick={onClose} aria-label="Close GIF picker"><Icon name="close" size={18} /></button></div>
    <input className="picker-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter featured GIFs" aria-label="Filter featured GIFs" />
    <div className="gif-grid">{visible.map((gif) => <button type="button" key={gif.url} className="gif-card" onClick={() => onPick(gif)}><img src={gif.url} alt={gif.label} loading="lazy" /><span>{gif.label}</span></button>)}</div>
    <form className="gif-link-form" onSubmit={addUrl}><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Or paste a GIF link" aria-label="GIF link" /><button type="submit">Add</button></form>
    {error && <p className="picker-error" role="alert">{error}</p>}
  </section>;
}

function CameraDialog({ onClose, onCapture, onError }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not supported by this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch (err) {
        onError(err.message || "Camera permission was not granted.");
        onClose();
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onClose, onError]);

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return onError("The camera is still starting. Please try again.");
    const scale = Math.min(1, 1600 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", 0.86);
    const size = Math.ceil((url.length - url.indexOf(",") - 1) * 0.75);
    if (size > MAX_FILE_BYTES) return onError("This photo is too large. Try a lower-resolution camera setting.");
    onCapture({ type: "image", name: `Camera photo ${new Date().toLocaleString()}.jpg`, url, mimeType: "image/jpeg", size });
  }

  return <div className="camera-backdrop" role="dialog" aria-modal="true" aria-label="Take a photo">
    <section className="camera-dialog">
      <div className="picker-head"><div><strong>Take a photo</strong><span>Review it before you send.</span></div><button type="button" className="icon-btn tiny" onClick={onClose} aria-label="Close camera"><Icon name="close" size={18} /></button></div>
      <video ref={videoRef} autoPlay playsInline muted />
      <div className="camera-controls"><button type="button" className="camera-cancel" onClick={onClose}>Cancel</button><button type="button" className="camera-shutter" onClick={capture} aria-label="Capture photo"><span /></button><span className="camera-spacer" aria-hidden="true" /></div>
    </section>
  </div>;
}

function AttachmentTray({ attachments, onRemove }) {
  if (!attachments.length) return null;
  return <div className="attachment-tray" aria-label={`${attachments.length} pending attachment${attachments.length > 1 ? "s" : ""}`}>
    {attachments.map((attachment, index) => <div className={`attachment-draft ${attachment.type}`} key={`${attachment.name}-${index}`}>
      {attachment.type === "image" || attachment.type === "gif" ? <img src={attachment.url} alt="Attachment preview" /> : <Icon name={attachment.type === "location" ? "location" : "document"} size={22} />}
      <span>{attachment.type === "location" ? "Current location" : attachment.name}</span>
      <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${attachment.name || "attachment"}`}><Icon name="close" size={14} /></button>
    </div>)}
  </div>;
}

export default function ChatWindow({ username, activeUser, online, typing, messages, loading, unreadInfo, error, onDismissError, onSend, onTyping, onRetry, onDelete, onBack }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [composerError, setComposerError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const atBottomRef = useRef(true);
  const prevLenRef = useRef(0);
  const drafts = useRef({});

  const closeEmoji = useCallback(() => setShowEmoji(false), []);
  const dismissComposerMenus = useCallback(() => { setShowEmoji(false); setShowActions(false); setShowGif(false); }, []);

  useEffect(() => {
    setText(drafts.current[activeUser] || "");
    setAttachments([]);
    dismissComposerMenus();
    setComposerError("");
    setNewCount(0);
    setShowJump(false);
    atBottomRef.current = true;
    prevLenRef.current = 0;
    if (activeUser && window.matchMedia?.("(hover: hover)").matches) inputRef.current?.focus();
  }, [activeUser, dismissComposerMenus]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }, [text, activeUser]);

  const scrollToBottom = useCallback((smooth) => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" }), []);
  useLayoutEffect(() => { if (!loading) scrollToBottom(false); }, [loading, activeUser, scrollToBottom]);
  useEffect(() => {
    const added = messages.length - prevLenRef.current;
    const wasEmpty = prevLenRef.current === 0;
    prevLenRef.current = messages.length;
    if (added <= 0 || wasEmpty) return;
    if (messages.at(-1)?.sender === username || atBottomRef.current) scrollToBottom(true);
    else setNewCount((count) => count + added);
  }, [messages, username, scrollToBottom]);

  function onScroll() {
    const scroller = scrollerRef.current;
    const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
    if (atBottom) setNewCount(0);
  }
  function changeText(value) {
    setText(value);
    drafts.current[activeUser] = value;
    if (value.trim()) onTyping();
  }
  function insertEmoji(emoji) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    changeText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      if (!input) return;
      if (window.matchMedia?.("(hover: hover)").matches) input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }
  const addAttachments = useCallback((next) => {
    setAttachments((current) => {
      const room = Math.max(0, 5 - current.length);
      if (!room) { setComposerError("You can send up to 5 attachments in one message."); return current; }
      let total = current.reduce((sum, attachment) => sum + (attachment.size || 0), 0);
      const accepted = [];
      for (const attachment of next.slice(0, room)) {
        if (total + (attachment.size || 0) > MAX_TOTAL_ATTACHMENT_BYTES) break;
        total += attachment.size || 0;
        accepted.push(attachment);
      }
      if (accepted.length !== next.length) setComposerError("Attachments in one message can total up to 8 MB.");
      return [...current, ...accepted];
    });
  }, []);
  async function addFiles(event) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) return setComposerError(`${oversized.name} is larger than 6 MB.`);
    try {
      addAttachments(await Promise.all(files.map(toFileAttachment)));
      dismissComposerMenus();
    } catch (err) { setComposerError(err.message || "That attachment could not be added."); }
  }
  function addGif(gif) {
    addAttachments([{ type: "gif", name: gif.label || "GIF", url: gif.url, mimeType: "image/gif", size: 0 }]);
    setShowGif(false);
    setShowActions(false);
  }
  function shareLocation() {
    if (!navigator.geolocation) return setComposerError("Location sharing is not supported by this browser.");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        addAttachments([{ type: "location", name: "Current location", location: { latitude: position.coords.latitude, longitude: position.coords.longitude, label: "Current location" } }]);
        setLocationLoading(false); setShowActions(false);
      },
      () => { setLocationLoading(false); setComposerError("Location permission was not granted. Check your browser settings and try again."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }
  function submit(event) {
    event?.preventDefault();
    const value = text.trim();
    if (!value && !attachments.length) return;
    onSend({ text: value, attachments });
    setText(""); setAttachments([]); drafts.current[activeUser] = ""; dismissComposerMenus(); inputRef.current?.focus();
  }
  function onKeyDown(event) { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event); }

  if (!activeUser) return <main className="chat empty-chat"><div className="empty-art"><Icon name="chat" size={72} /></div><h2>Chat Portal</h2><p>Send and receive messages in real time.<br />Select a conversation from the list to get started.</p></main>;

  const unreadIdx = unreadInfo ? messages.findIndex((message) => message.sender !== username && message.createdAt && Date.parse(message.createdAt) > Date.parse(unreadInfo.after)) : -1;
  return <main className="chat">
    <header className="chat-head"><button className="icon-btn back" onClick={onBack} aria-label="Back to chats"><Icon name="back" /></button><Avatar name={activeUser} size={40} /><div className="head-meta"><strong>{activeUser}</strong><span className={`small ${typing || online ? "status-on" : "muted"}`}>{typing ? "typing…" : online ? "online" : "offline"}</span></div><div className="chat-tools"><button type="button" className="chat-tool" onClick={() => setComposerError("Video calls are not configured yet.")} aria-label="Start video call"><Icon name="video" size={19} /></button><button type="button" className="chat-tool" onClick={() => setComposerError("Voice calls are not configured yet.")} aria-label="Start voice call"><Icon name="phone" size={19} /></button></div></header>
    <div className="chat-body">
      <div className="doodle" aria-hidden="true" />
      {error && <div className="toast" role="alert"><span>{error}</span><button className="icon-btn tiny" onClick={onDismissError} aria-label="Dismiss"><Icon name="close" size={18} /></button></div>}
      <div className="messages" ref={scrollerRef} onScroll={onScroll}>
        {loading && <div className="msg-skeletons">{[60, 40, 70, 35, 55].map((width, index) => <div key={index} className={`skel-bubble ${index % 2 ? "r" : "l"}`} style={{ width: `${width}%` }} />)}</div>}
        {!loading && messages.length === 0 && <div className="empty-hint"><span>No messages yet</span><button className="chip" onClick={() => onSend({ text: "Hi 👋" })}>Say hi 👋</button></div>}
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const newDay = message.createdAt && (!previous || !isSameDay(previous.createdAt, message.createdAt));
          const first = !previous || newDay || previous.sender !== message.sender || Date.parse(message.createdAt) - Date.parse(previous.createdAt) > GROUP_GAP_MS;
          return <div key={message._id || message.localId || index}>{newDay && <div className="day-sep"><span>{dayLabel(message.createdAt)}</span></div>}{index === unreadIdx && <div className="unread-sep"><span>{unreadInfo.count} unread message{unreadInfo.count > 1 ? "s" : ""}</span></div>}<MessageBubble m={message} mine={message.sender === username} tail={first} first={first} delivered={online} onRetry={onRetry} onDelete={onDelete} /></div>;
        })}
        {typing && <div className="msg-row theirs first"><div className="bubble tail typing-bubble" aria-label={`${activeUser} is typing`}><span /><span /><span /></div></div>}
      </div>
      {showJump && <button className="jump-btn" onClick={() => { scrollToBottom(true); setNewCount(0); }} aria-label="Scroll to latest message">{newCount > 0 && <span className="badge">{newCount}</span>}<Icon name="chevron" size={28} /></button>}
    </div>
    <form className="composer" onSubmit={submit}>
      <input ref={fileInputRef} className="visually-hidden" type="file" multiple onChange={addFiles} accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
      <input ref={photoInputRef} className="visually-hidden" type="file" onChange={addFiles} accept="image/*" capture="environment" />
      <AttachmentTray attachments={attachments} onRemove={(index) => setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))} />
      {showEmoji && <EmojiPicker onPick={insertEmoji} onClose={closeEmoji} />}
      {showGif && <GifPicker onPick={addGif} onClose={() => setShowGif(false)} />}
      {showActions && <div className="attachment-menu" role="menu"><button type="button" role="menuitem" onClick={() => photoInputRef.current?.click()}><Icon name="photo" size={20} /><span>Photo</span></button><button type="button" role="menuitem" onClick={() => { setCameraOpen(true); setShowActions(false); }}><Icon name="camera" size={20} /><span>Camera</span></button><button type="button" role="menuitem" onClick={() => { setShowGif(true); setShowActions(false); }}><Icon name="gif" size={20} /><span>GIF</span></button><button type="button" role="menuitem" disabled={locationLoading} onClick={shareLocation}><Icon name="location" size={20} /><span>{locationLoading ? "Finding location…" : "Location"}</span></button><button type="button" role="menuitem" onClick={() => fileInputRef.current?.click()}><Icon name="document" size={20} /><span>Document</span></button></div>}
      <div className="composer-row"><button type="button" className={`icon-btn ${showActions ? "active" : ""}`} onClick={() => { setShowActions((value) => !value); setShowEmoji(false); setShowGif(false); }} aria-label="Add photo, camera, GIF, location, or document" aria-expanded={showActions}><Icon name="attach" size={25} /></button><button type="button" data-emoji-toggle className={`icon-btn ${showEmoji ? "active" : ""}`} onClick={() => { setShowEmoji((value) => !value); setShowActions(false); setShowGif(false); }} aria-label="Emoji" aria-expanded={showEmoji}><Icon name={showEmoji ? "close" : "emoji"} size={26} /></button><textarea ref={inputRef} rows={1} value={text} onChange={(event) => changeText(event.target.value)} onKeyDown={onKeyDown} placeholder="Write a message" maxLength={2000} aria-label="Message" /><button className="send-btn" type="submit" disabled={!text.trim() && !attachments.length} aria-label="Send message"><Icon name="send" size={22} /></button></div>
      {composerError && <div className="composer-error" role="alert"><span>{composerError}</span><button type="button" onClick={() => setComposerError("")} aria-label="Dismiss"><Icon name="close" size={15} /></button></div>}
    </form>
    {cameraOpen && <CameraDialog onClose={() => setCameraOpen(false)} onCapture={(attachment) => { addAttachments([attachment]); setCameraOpen(false); }} onError={setComposerError} />}
  </main>;
}
