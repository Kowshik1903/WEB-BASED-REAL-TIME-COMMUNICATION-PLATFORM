import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "../emojiData";
import { loadJSON, saveJSON } from "../utils";
import Icon from "./Icons.jsx";

const RECENT_KEY = "chat_recent_emojis";

export default function EmojiPicker({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(() => loadJSON(RECENT_KEY, []));
  const [active, setActive] = useState(recent.length ? "recent" : "smileys");
  const rootRef = useRef(null);
  const bodyRef = useRef(null);

  // Close on outside click / Escape (Escape is captured so it doesn't also close the chat)
  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-emoji-toggle]")) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  const tabs = useMemo(
    () => [...(recent.length ? [{ id: "recent", label: "Recent", icon: "🕑" }] : []), ...CATEGORIES],
    [recent.length]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return CATEGORIES.flatMap((c) => c.items).filter((it) => it.n.toLowerCase().includes(q));
  }, [query]);

  function pick(emoji) {
    onPick(emoji);
    const next = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 24);
    setRecent(next);
    saveJSON(RECENT_KEY, next);
  }

  function goTo(id) {
    setActive(id);
    setQuery("");
    requestAnimationFrame(() => {
      const el = bodyRef.current?.querySelector(`[data-cat="${id}"]`);
      if (el) bodyRef.current.scrollTo({ top: el.offsetTop - 4 });
    });
  }

  function onScroll() {
    if (results) return;
    const body = bodyRef.current;
    const sections = [...body.querySelectorAll("[data-cat]")];
    let current = sections[0]?.dataset.cat;
    for (const s of sections) if (s.offsetTop - 12 <= body.scrollTop) current = s.dataset.cat;
    if (current && current !== active) setActive(current);
  }

  const grid = (list) => (
    <div className="emoji-grid">
      {list.map((it, i) => (
        <button
          key={it.e + i}
          type="button"
          className="emoji-btn"
          title={it.n}
          onClick={() => pick(it.e)}
        >
          {it.e}
        </button>
      ))}
    </div>
  );

  return (
    <div className="emoji-picker" ref={rootRef} role="dialog" aria-label="Emoji picker">
      <div className="emoji-search">
        <Icon name="search" size={18} />
        <input
          type="text"
          placeholder="Search emoji"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={window.matchMedia?.("(hover: hover)").matches}
        />
        {query && (
          <button type="button" className="icon-btn tiny" onClick={() => setQuery("")} aria-label="Clear search">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {!results && (
        <div className="emoji-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              className={`emoji-tab ${active === t.id ? "active" : ""}`}
              title={t.label}
              onClick={() => goTo(t.id)}
            >
              {t.icon}
            </button>
          ))}
        </div>
      )}

      <div className="emoji-body" ref={bodyRef} onScroll={onScroll}>
        {results ? (
          results.length ? (
            grid(results)
          ) : (
            <div className="emoji-empty">No emoji found</div>
          )
        ) : (
          <>
            {recent.length > 0 && (
              <section data-cat="recent">
                <h4>Recent</h4>
                {grid(recent.map((e) => ({ e, n: "recent" })))}
              </section>
            )}
            {CATEGORIES.map((c) => (
              <section key={c.id} data-cat={c.id}>
                <h4>{c.label}</h4>
                {grid(c.items)}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
