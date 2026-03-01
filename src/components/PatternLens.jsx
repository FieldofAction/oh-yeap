import React, { useMemo, useState, useCallback } from "react";
import { MODELS, VOLUMES } from "../data/models";

/**
 * Reverse-lookup: given a SEED item title, find all models that reference it in appliedIn.
 * Returns array of { id, num, title, alias, discipline, volume, desc }
 */
export function modelsForItem(itemTitle) {
  if (!itemTitle) return [];
  return MODELS.filter(m => m.appliedIn?.includes(itemTitle));
}

/**
 * PatternChips — renders a row of subtle model annotation chips for a given content item.
 * Only visible when `active` (the model lens is on).
 * Clicking a chip opens a small tooltip with the model description.
 */
export function PatternChips({ itemTitle, active, compact }) {
  const [openId, setOpenId] = useState(null);
  const models = useMemo(() => modelsForItem(itemTitle), [itemTitle]);

  if (!active || models.length === 0) return null;

  const maxShow = compact ? 3 : models.length;
  const shown = models.slice(0, maxShow);
  const remaining = models.length - maxShow;

  return (
    <div className={`pl-chips${compact ? " compact" : ""}`} onClick={e => e.stopPropagation()}>
      {shown.map(m => (
        <span
          key={m.id}
          className={`pl-chip${openId === m.id ? " open" : ""}`}
          onClick={(e) => { e.stopPropagation(); setOpenId(openId === m.id ? null : m.id); }}
          title={m.title}
        >
          <span className="pl-chip-num">{m.num}</span>
          <span className="pl-chip-label">{m.alias || m.title}</span>
          {openId === m.id && (
            <span className="pl-chip-tip" onClick={e => e.stopPropagation()}>
              <span className="pl-tip-title">{m.title}</span>
              <span className="pl-tip-disc">{m.discipline} · Vol. {m.volume}</span>
              <span className="pl-tip-desc">{m.desc}</span>
            </span>
          )}
        </span>
      ))}
      {remaining > 0 && <span className="pl-chip pl-chip-more">+{remaining}</span>}
    </div>
  );
}

/**
 * PatternLensToggle — small floating button to toggle the model lens on/off.
 * Shows in bottom-right corner when models view is not active.
 */
export function PatternLensToggle({ active, onToggle }) {
  return (
    <button
      className={`pl-toggle${active ? " on" : ""}`}
      onClick={onToggle}
      title={active ? "Hide model lens (M)" : "Show model lens (M)"}
      aria-label="Toggle model lens"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <span className="pl-toggle-count">{MODELS.length}</span>
    </button>
  );
}

/**
 * PatternLensBar — a small indicator bar when the model lens is active.
 * Shows at the top of the page, very subtle.
 */
export function PatternLensBar({ active, onToggle, onOpenModels }) {
  if (!active) return null;
  return (
    <div className="pl-bar en">
      <span className="pl-bar-dot" />
      <span className="pl-bar-label">Model Lens Active</span>
      <span className="pl-bar-count">{MODELS.length} models</span>
      <button className="pl-bar-link" onClick={onOpenModels}>Browse all →</button>
      <button className="pl-bar-close" onClick={onToggle}>×</button>
    </div>
  );
}

/**
 * PatternChipsDetail — richer version for detail overlays.
 * Shows models grouped with full descriptions visible.
 */
export function PatternChipsDetail({ itemTitle, active }) {
  const models = useMemo(() => modelsForItem(itemTitle), [itemTitle]);

  if (!active || models.length === 0) return null;

  return (
    <div className="pl-detail en">
      <div className="pl-detail-header">
        <span className="pl-detail-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </span>
        <span className="pl-detail-label">Patterns at Play</span>
        <span className="pl-detail-count">{models.length}</span>
      </div>
      <div className="pl-detail-list">
        {models.map(m => (
          <div key={m.id} className="pl-detail-item">
            <div className="pl-detail-num">{String(m.num).padStart(2, "0")}</div>
            <div className="pl-detail-body">
              <div className="pl-detail-title">{m.title}</div>
              <div className="pl-detail-desc">{m.desc}</div>
              <div className="pl-detail-meta">
                {m.discipline} · Vol. {m.volume}
                {m.tags?.slice(0, 3).map(t => <span key={t} className="pl-detail-tag">{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
