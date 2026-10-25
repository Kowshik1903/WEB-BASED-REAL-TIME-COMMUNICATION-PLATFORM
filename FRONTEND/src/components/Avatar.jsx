const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b"];

function colorFor(name = "") {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function Avatar({ name, size = 40, online }) {
  return (
    <div className="avatar-wrap" style={{ width: size, height: size }}>
      <div
        className="avatar"
        style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.44 }}
        aria-hidden="true"
      >
        {(name || "?").charAt(0).toUpperCase()}
      </div>
      {online && <span className="dot" title="Online" />}
    </div>
  );
}
