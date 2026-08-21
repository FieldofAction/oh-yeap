import React, { useMemo, useState } from "react";
import { DEV_MODE, setDevMode } from "../lib/devMode";

/**
 * Dev-mode status bar. Renders only when dev mode is on (see src/lib/devMode.js).
 *
 * Reports how much hidden material the current page is revealing, lists it by
 * section so every hidden item is reachable in one click, and offers a way back
 * to the public view. Exit and the `dev` shortcut do the same thing.
 */

const SECTION_LABEL = {
  practice: "Selected Work",
  writing: "Writing",
  exploration: "Exploration",
  artifacts: "Artifacts",
};

const SECTION_ORDER = ["practice", "writing", "exploration", "artifacts"];

export default function DevModeBar({ items = [], onOpen }) {
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => {
    const bySection = items.reduce((acc, item) => {
      (acc[item.section] ||= []).push(item);
      return acc;
    }, {});
    return Object.entries(bySection).sort(
      ([a], [b]) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b)
    );
  }, [items]);

  if (!DEV_MODE) return null;

  return (
    <div className="devbar">
      {open && (
        <div className="devbar-panel">
          <div className="devbar-list">
          {groups.map(([section, list]) => (
            <div className="devbar-group" key={section}>
              <div className="devbar-group-h">
                {SECTION_LABEL[section] || section}
                <span className="devbar-group-n">{list.length}</span>
              </div>
              {list.map(item => (
                <button
                  type="button"
                  className="devbar-item"
                  key={item.id}
                  onClick={() => { onOpen?.(item); setOpen(false); }}
                >
                  <span className="devbar-item-t">{item.title}</span>
                  <span className="devbar-item-w">
                    {item.hidden ? "hidden flag" : "unpublished"}
                  </span>
                </button>
              ))}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="devbar-empty">Everything in the seed is public.</div>
          )}
          </div>
          <div className="devbar-hint">Type <b>dev</b> anywhere to toggle this mode.</div>
        </div>
      )}

      <div className="devbar-bar">
        <span className="devbar-dot" aria-hidden="true" />
        <span className="devbar-label">Dev mode</span>
        <button
          type="button"
          className="devbar-count"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          title={open ? "Hide the list" : "List the hidden items"}
        >
          {items.length} hidden
        </button>
        <button
          type="button"
          className="devbar-exit"
          onClick={() => setDevMode(false)}
          title="Return to the public view (or type dev)"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
