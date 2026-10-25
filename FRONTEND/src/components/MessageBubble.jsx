import { memo, useEffect, useRef, useState } from "react";
import { emojiCount, formatTime, splitLinks } from "../utils";
import Icon from "./Icons.jsx";
import Ticks from "./Ticks.jsx";

function Linkified({ text }) {
  return splitLinks(text).map((part, index) => index % 2 ? <a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part);
}

function mapUrl(attachment) {
  const { latitude, longitude } = attachment.location || {};
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function MessageAttachments({ attachments }) {
  if (!attachments?.length) return null;
  return <div className="message-attachments">
    {attachments.map((attachment, index) => {
      if (attachment.type === "image" || attachment.type === "gif") return <a className="media-attachment" href={attachment.url} target="_blank" rel="noopener noreferrer" key={`${attachment.url}-${index}`}><img src={attachment.url} alt={attachment.name || (attachment.type === "gif" ? "GIF" : "Shared image")} loading="lazy" />{attachment.type === "gif" && <span>GIF</span>}</a>;
      if (attachment.type === "location") return <a className="location-card" href={mapUrl(attachment)} target="_blank" rel="noopener noreferrer" key={`location-${index}`}><span className="attachment-icon"><Icon name="location" size={22} /></span><span><strong>{attachment.name || "Current location"}</strong><small>{Number(attachment.location?.latitude).toFixed(5)}, {Number(attachment.location?.longitude).toFixed(5)}</small></span><Icon name="location" size={18} /></a>;
      return <a className="document-card" href={attachment.url} download={attachment.name || "attachment"} target="_blank" rel="noopener noreferrer" key={`${attachment.url}-${index}`}><span className="attachment-icon"><Icon name="document" size={23} /></span><span><strong>{attachment.name || "Document"}</strong><small>{attachment.mimeType || "File"}{attachment.size ? ` · ${Math.max(1, Math.round(attachment.size / 1024))} KB` : ""}</small></span><span className="download-mark">↓</span></a>;
    })}
  </div>;
}

function MessageBubble({ m, mine, tail, first, delivered, onRetry, onDelete }) {
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const attachments = Array.isArray(m.attachments) ? m.attachments : [];
  const count = emojiCount(m.text);
  const emojiOnly = attachments.length === 0 && count >= 1 && count <= 3;
  const failed = m.status === "failed";

  useEffect(() => {
    if (!menu) return;
    const close = (event) => { if (!menuRef.current?.contains(event.target)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  async function copy() {
    const attachment = attachments[0];
    const value = m.text || (attachment?.type === "location" ? mapUrl(attachment) : attachment?.url);
    if (!value) return setMenu(false);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => { setCopied(false); setMenu(false); }, 700);
    } catch { setMenu(false); }
  }

  return <div className={`msg-row ${mine ? "mine" : "theirs"} ${first ? "first" : ""}`}>
    <div className="msg-col">
      <div className={`bubble ${tail && !emojiOnly ? "tail" : ""} ${emojiOnly ? "emoji-only" : ""} ${failed ? "failed" : ""}`}>
        {!emojiOnly && <button className="bubble-chevron" onClick={() => setMenu((value) => !value)} aria-label="Message options"><Icon name="chevron" size={20} /></button>}
        {menu && <div className="menu bubble-menu" ref={menuRef}><button onClick={copy}><Icon name="copy" size={18} /> {copied ? "Copied!" : "Copy"}</button>{failed && <button onClick={() => onDelete(m.localId)}><Icon name="trash" size={18} /> Delete</button>}</div>}
        <MessageAttachments attachments={attachments} />
        {m.text && <span className="msg-text" style={emojiOnly ? { fontSize: count === 1 ? "3.1rem" : count === 2 ? "2.6rem" : "2.1rem" } : undefined}><Linkified text={m.text} /></span>}
        <span className="meta">{m.createdAt && <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>}{mine && <Ticks status={m.status} delivered={delivered} />}</span>
      </div>
      {failed && <div className="failed-row">Not sent · <button className="link" onClick={() => onRetry(m.localId)}>Retry</button> · <button className="link" onClick={() => onDelete(m.localId)}>Delete</button></div>}
    </div>
  </div>;
}

export default memo(MessageBubble);
