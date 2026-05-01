import { useEffect, useRef, useState } from "react";

/**
 * Inline editable label. Renders as a static span until the user double-clicks
 * (or focuses + presses F2) — then becomes an input. Commits on Enter/blur,
 * cancels on Escape. Used in rail rows for instant rename.
 */
export default function InlineEditableLabel({
  value,
  onCommit,
  className = "",
  inputClassName = "",
  testid,
  placeholder = "Untitled",
  /** Stop click events from bubbling to a parent <Link>. */
  stopClickBubbling = true,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) setDraft(value || "");
  }, [editing, value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
          // Don't let drag/sort/route handlers intercept typing.
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        data-testid={testid ? `${testid}-input` : undefined}
        placeholder={placeholder}
        className={`w-full bg-white text-slate-900 px-1.5 py-0.5 rounded-sm text-xs font-medium leading-tight outline-none ring-1 ring-[#E01839] ${inputClassName}`}
      />
    );
  }

  return (
    <span
      className={className}
      data-testid={testid}
      onDoubleClick={(e) => {
        if (stopClickBubbling) {
          e.preventDefault();
          e.stopPropagation();
        }
        setEditing(true);
      }}
      title="Double-click to rename"
    >
      {value || placeholder}
    </span>
  );
}
