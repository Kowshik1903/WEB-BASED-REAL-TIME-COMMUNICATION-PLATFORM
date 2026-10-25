export const loadJSON = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
export const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / blocked – ignore */
  }
};

const timeFmt = new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" });
export const formatTime = (d) => timeFmt.format(new Date(d));

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysAgo = (d) => Math.round((startOfDay(new Date()) - startOfDay(new Date(d))) / 86400000);

export function dayLabel(d) {
  const n = daysAgo(d);
  if (n === 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return new Date(d).toLocaleDateString([], { weekday: "long" });
  return new Date(d).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

export function formatListTime(d) {
  const n = daysAgo(d);
  if (n === 0) return formatTime(d);
  if (n === 1) return "Yesterday";
  if (n < 7) return new Date(d).toLocaleDateString([], { weekday: "long" });
  return new Date(d).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function messagePreview(message) {
  if (message?.text) return message.text;
  const attachment = message?.attachments?.[0];
  if (!attachment) return "";
  if (attachment.type === "image") return "📷 Photo";
  if (attachment.type === "gif") return "GIF";
  if (attachment.type === "location") return "📍 Location";
  return `📎 ${attachment.name || "Document"}`;
}

export const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Split text into [text, link, text, link, …] (odd indexes are links)
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/;
export const splitLinks = (text) => text.split(URL_RE);

// Returns the number of emoji if the message is ONLY emoji, else 0.
const EMOJI_RE =
  /^(?:(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}[\uFE0F\u{1F3FB}-\u{1F3FF}]?(?:\u200D\p{Extended_Pictographic}[\uFE0F\u{1F3FB}-\u{1F3FF}]?)*)\s*)+$/u;
export function emojiCount(text) {
  const t = (text || "").trim();
  if (!t || !EMOJI_RE.test(t)) return 0;
  const bare = t.replace(/\s/g, "");
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(bare)].length;
  }
  return [...bare].length;
}

// Soft two-tone notification sound (no audio file needed)
let audioCtx;
export function playPing() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const s = t + i * 0.09;
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.15, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.18);
      o.connect(g).connect(audioCtx.destination);
      o.start(s);
      o.stop(s + 0.2);
    });
  } catch {
    /* autoplay blocked – ignore */
  }
}
