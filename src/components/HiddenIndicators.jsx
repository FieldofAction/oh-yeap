import React from "react";
import { isHidden } from "../data/seed";

/**
 * Dev-only visual indicators for items hidden from production.
 * In production builds (`import.meta.env.DEV === false`), these render nothing.
 *
 * Hidden = either `item.hidden === true` OR `item.section === "practice"` (Wave-1 gate).
 * See HIDDEN-ITEMS.md for the full list and rationale.
 */

export const HiddenChip = ({ item }) =>
  import.meta.env.DEV && isHidden(item)
    ? <span className="hidden-chip" title="Not visible in production">Hidden</span>
    : null;

export const HiddenStrip = ({ item }) =>
  import.meta.env.DEV && isHidden(item)
    ? (
      <div className="hidden-strip" role="status">
        <span className="hidden-strip-dot" aria-hidden="true" />
        <span className="hidden-strip-label">Hidden — visible in dev only</span>
        <span className="hidden-strip-detail">
          {item.hidden ? "flagged hidden in seed.js" : "Wave-1 practice gate"}
        </span>
      </div>
    )
    : null;

export const HiddenCountSuffix = ({ section, hiddenCounts }) => {
  if (!import.meta.env.DEV) return null;
  const n = hiddenCounts?.[section];
  if (!n) return null;
  return <span className="content-section-h-hidden"> · {n} hidden</span>;
};
