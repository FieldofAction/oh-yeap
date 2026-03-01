import React, { useMemo, useState, useCallback } from "react";
import { MODELS, VOLUMES } from "../data/models";
import { PATTERNS, GROUPS } from "../data/patterns";

/* ── Model Lens (Parrish's 71 mental models) ── */

/**
 * Reverse-lookup: given a SEED item title, find all models that reference it in appliedIn.
 */
export function modelsForItem(itemTitle) {
  if (!itemTitle) return [];
  return MODELS.filter(m => m.appliedIn?.includes(itemTitle));
}

/**
 * PatternChips — renders model annotation chips for a given content item.
 * Only visible when `active` (the model lens is on).
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
 * PatternChipsDetail — richer version for detail overlays.
 * Shows models with full descriptions visible.
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
        <span className="pl-detail-label">Models at Play</span>
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

/* ── Pattern Lens (Alexander's 253 patterns) ── */

const groupLabelMap = Object.fromEntries(GROUPS.map(g => [g.key, g.label]));

/**
 * Reverse-lookup: given a SEED item title, find all Alexander patterns that reference it.
 */
export function alexanderForItem(itemTitle) {
  if (!itemTitle) return [];
  return PATTERNS.filter(p => p.appliedIn?.includes(itemTitle));
}

/**
 * AlexanderChips — renders Alexander pattern annotation chips.
 * Outlined/hollow style to distinguish from model chips.
 * Only visible when `active` (the pattern lens is on).
 */
export function AlexanderChips({ itemTitle, active, compact }) {
  const [openId, setOpenId] = useState(null);
  const patterns = useMemo(() => alexanderForItem(itemTitle), [itemTitle]);

  if (!active || patterns.length === 0) return null;

  const maxShow = compact ? 3 : patterns.length;
  const shown = patterns.slice(0, maxShow);
  const remaining = patterns.length - maxShow;

  return (
    <div className={`al-chips${compact ? " compact" : ""}`} onClick={e => e.stopPropagation()}>
      {shown.map(p => (
        <span
          key={p.id}
          className={`al-chip${openId === p.id ? " open" : ""}`}
          onClick={(e) => { e.stopPropagation(); setOpenId(openId === p.id ? null : p.id); }}
          title={p.title}
        >
          <span className="al-chip-num">{p.num}</span>
          <span className="al-chip-label">{p.title}</span>
          {openId === p.id && (
            <span className="al-chip-tip" onClick={e => e.stopPropagation()}>
              <span className="al-tip-title">{p.title}</span>
              <span className="al-tip-meta">{groupLabelMap[p.group] || p.group} · {p.scale}</span>
              {p.notes && <span className="al-tip-notes">{p.notes}</span>}
            </span>
          )}
        </span>
      ))}
      {remaining > 0 && <span className="al-chip al-chip-more">+{remaining}</span>}
    </div>
  );
}

/**
 * AlexanderChipsDetail — richer version for detail overlays.
 * Shows Alexander patterns with group context and notes.
 */
export function AlexanderChipsDetail({ itemTitle, active }) {
  const patterns = useMemo(() => alexanderForItem(itemTitle), [itemTitle]);

  if (!active || patterns.length === 0) return null;

  return (
    <div className="al-detail en">
      <div className="al-detail-header">
        <span className="al-detail-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <path d="M4 4h16v16H4z" />
            <path d="M4 12h16M12 4v16" />
          </svg>
        </span>
        <span className="al-detail-label">Patterns at Play</span>
        <span className="al-detail-count">{patterns.length}</span>
      </div>
      <div className="al-detail-list">
        {patterns.map(p => (
          <div key={p.id} className="al-detail-item">
            <div className="al-detail-num">{String(p.num).padStart(3, "0")}</div>
            <div className="al-detail-body">
              <div className="al-detail-title">{p.title}</div>
              {p.notes && <div className="al-detail-notes">{p.notes}</div>}
              <div className="al-detail-meta">
                {groupLabelMap[p.group] || p.group} · {p.scale}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Dual Toggle + Bar ── */

/**
 * DualLensToggle — floating button pair in bottom-right corner.
 * Left half = Model Lens (M), right half = Pattern Lens (P).
 * Each independently toggleable.
 */
export function DualLensToggle({ modelActive, patternActive, onToggleModel, onTogglePattern }) {
  return (
    <div className="dl-toggle">
      <button
        className={`dl-btn dl-btn-model${modelActive ? " on" : ""}`}
        onClick={onToggleModel}
        title={modelActive ? "Hide model lens (M)" : "Show model lens (M)"}
        aria-label="Toggle model lens"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <span className="dl-btn-count">{MODELS.length}</span>
      </button>
      <button
        className={`dl-btn dl-btn-pattern${patternActive ? " on" : ""}`}
        onClick={onTogglePattern}
        title={patternActive ? "Hide pattern lens (P)" : "Show pattern lens (P)"}
        aria-label="Toggle pattern lens"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
          <path d="M4 4h16v16H4z" />
          <path d="M4 12h16M12 4v16" />
        </svg>
        <span className="dl-btn-count">{PATTERNS.length}</span>
      </button>
    </div>
  );
}

/**
 * DualLensBar — indicator bar when either or both lenses are active.
 */
export function DualLensBar({ modelActive, patternActive, onToggleModel, onTogglePattern, onOpenModels, onOpenPatterns }) {
  if (!modelActive && !patternActive) return null;

  const label = modelActive && patternActive
    ? "Model + Pattern Lens"
    : modelActive ? "Model Lens" : "Pattern Lens";

  return (
    <div className="pl-bar en">
      <span className="pl-bar-dot" />
      <span className="pl-bar-label">{label}</span>
      {modelActive && (
        <span className="pl-bar-count">{MODELS.length} models</span>
      )}
      {patternActive && (
        <span className="pl-bar-count">{PATTERNS.length} patterns</span>
      )}
      {modelActive && (
        <button className="pl-bar-link" onClick={onOpenModels}>Models &rarr;</button>
      )}
      {patternActive && (
        <button className="pl-bar-link" onClick={onOpenPatterns}>Patterns &rarr;</button>
      )}
      <button
        className="pl-bar-close"
        onClick={() => { if (modelActive) onToggleModel(); if (patternActive) onTogglePattern(); }}
        title="Close all lenses"
      >
        &times;
      </button>
    </div>
  );
}

/* ── Legacy exports (kept for backward compat if needed) ── */
export const PatternLensToggle = DualLensToggle;
export const PatternLensBar = DualLensBar;
