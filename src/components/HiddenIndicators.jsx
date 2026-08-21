import React from "react";
import { isHidden } from "../data/seed";
import { DEV_MODE } from "../lib/devMode";

/**
 * Visual indicators for items hidden from the public site.
 * They render only in dev mode (`npm run dev`, or `?dev` on the deployed site);
 * a normal visitor never sees the elements because they never see the items.
 *
 * Hidden = either `item.hidden === true` OR an unpublished `section === "practice"`
 * entry (Wave-1 gate). See HIDDEN-ITEMS.md for the full list and rationale.
 */

export const HiddenChip = ({ item }) =>
  DEV_MODE && isHidden(item)
    ? <span className="hidden-chip" title="Not visible to the public">Hidden</span>
    : null;

export const HiddenStrip = ({ item }) =>
  DEV_MODE && isHidden(item)
    ? (
      <div className="hidden-strip" role="status">
        <span className="hidden-strip-dot" aria-hidden="true" />
        <span className="hidden-strip-label">Hidden · visible in dev mode only</span>
        <span className="hidden-strip-detail">
          {item.hidden ? "flagged hidden in seed.js" : "Wave-1 practice gate"}
        </span>
      </div>
    )
    : null;

export const HiddenCountSuffix = ({ section, hiddenCounts }) => {
  if (!DEV_MODE) return null;
  const n = hiddenCounts?.[section];
  if (!n) return null;
  return <span className="content-section-h-hidden"> · {n} hidden</span>;
};
