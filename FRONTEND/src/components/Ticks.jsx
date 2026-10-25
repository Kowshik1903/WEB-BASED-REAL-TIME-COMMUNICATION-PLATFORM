import Icon from "./Icons.jsx";

// sending → clock · failed → red alert · sent → ✓ · delivered (recipient online) → ✓✓
export default function Ticks({ status, delivered, size = 16 }) {
  if (status === "sending") return <Icon name="clock" size={size - 2} className="tick tick-pending" />;
  if (status === "failed") return <Icon name="alert" size={size} className="tick tick-failed" />;
  return <Icon name={delivered ? "checkAll" : "check"} size={size} className="tick" />;
}
