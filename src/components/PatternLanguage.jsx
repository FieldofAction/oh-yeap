import React, { useState, useMemo, useCallback } from "react";
import { PATTERNS, SCALES, GROUPS } from "../data/patterns";
import { SEED } from "../data/seed";

/**
 * PatternLanguage — editorial reading page for Alexander's 253 patterns.
 * Organized by scale (Towns, Buildings, Construction) with sub-groups.
 * Each pattern can cross-reference practice work via `appliedIn` and
 * carry the user's own contextual `notes`.
 *
 * Source: Christopher Alexander, Sara Ishikawa, Murray Silverstein,
 * Max Jacobson, Ingrid Fiksdahl-King, and Shlomo Angel.
 * A Pattern Language: Towns, Buildings, Construction (1977)
 */
export default function PatternLanguage({ content, onOpen, fg }) {
  const [expandedId, setExpandedId] = useState(null);
  const [scaleFilter, setScaleFilter] = useState("all");

  /* group patterns by scale, then by group within each scale */
  const grouped = useMemo(() => {
    return SCALES.map(scale => {
      const scalePatterns = PATTERNS.filter(p => p.scale === scale.key);
      const scaleGroups = GROUPS.filter(g => g.scale === scale.key);

      const sections = scaleGroups.map(g => ({
        ...g,
        patterns: scalePatterns.filter(p => p.group === g.key),
      })).filter(g => g.patterns.length > 0);

      return { ...scale, sections, total: scalePatterns.length };
    });
  }, []);

  /* apply scale filter */
  const visible = useMemo(() => {
    if (scaleFilter === "all") return grouped;
    return grouped.filter(s => s.key === scaleFilter);
  }, [grouped, scaleFilter]);

  /* stats */
  const totalPatterns = PATTERNS.length;
  const totalGroups = GROUPS.length;
  const totalApplied = useMemo(() => {
    const set = new Set();
    PATTERNS.forEach(p => p.appliedIn?.forEach(t => set.add(t)));
    return set.size;
  }, []);

  const findSeedItem = useCallback(
    (title) => (content || SEED).find(c => c.title === title),
    [content]
  );

  const jumpToPattern = useCallback((id) => {
    setExpandedId(id);
    setTimeout(() => {
      document.getElementById(`pa-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }, []);

  return (
    <div className="pa en">
      {/* Header */}
      <div className="pa-header en d1">
        <div className="pa-pre">Reference</div>
        <h1 className="pa-h">Pattern Language</h1>
        <p className="pa-sub">
          A numbered index of {totalPatterns} architectural patterns from
          Christopher Alexander et al. &mdash; organized across {SCALES.length} scales
          from towns to construction details.
        </p>
      </div>

      {/* Overview */}
      <div className="pa-overview en d2">
        <div className="pa-sl">Overview</div>
        <p className="pa-body">
          Each pattern describes a problem which occurs over and over again in our
          environment, and then describes the core of the solution to that problem.
          Together the 253 patterns form a language &mdash; a network of connected
          ideas that move from the largest scales of region and town, through
          buildings and rooms, down to the smallest details of construction.
        </p>
        <div className="pa-stats">
          <div className="pa-stat">
            <div className="pa-stat-num">{totalPatterns}</div>
            <div className="pa-stat-label">Patterns</div>
          </div>
          <div className="pa-stat">
            <div className="pa-stat-num">{SCALES.length}</div>
            <div className="pa-stat-label">Scales</div>
          </div>
          <div className="pa-stat">
            <div className="pa-stat-num">{totalGroups}</div>
            <div className="pa-stat-label">Groups</div>
          </div>
          <div className="pa-stat">
            <div className="pa-stat-num">{totalApplied || "\u2014"}</div>
            <div className="pa-stat-label">Applied Works</div>
          </div>
        </div>
      </div>

      {/* Scale filter */}
      <div className="pa-disciplines en d3">
        <div className="pa-sl">Scales</div>
        <div className="pa-disc-row">
          <span
            className={`pa-disc-chip${scaleFilter === "all" ? " on" : ""}`}
            onClick={() => setScaleFilter("all")}
            style={{ cursor: "pointer" }}
          >
            All
          </span>
          {SCALES.map(s => (
            <span
              key={s.key}
              className={`pa-disc-chip${scaleFilter === s.key ? " on" : ""}`}
              onClick={() => setScaleFilter(s.key)}
              style={{ cursor: "pointer" }}
            >
              {s.label} ({s.range})
            </span>
          ))}
        </div>
      </div>

      {/* Scale sections */}
      {visible.map(scale => (
        <div key={scale.key} className="pa-volume en">
          <div className="pa-vol-head">
            <div className="pa-vol-num">{scale.label}</div>
            <div className="pa-vol-title">Patterns {scale.range}</div>
            <div className="pa-vol-count">{scale.total} patterns</div>
          </div>

          {scale.sections.map(group => (
            <div key={group.key} className="pa-group">
              <div className="pa-group-h">{group.label}</div>

              <div className="pa-model-list">
                {group.patterns.map((pattern, i) => {
                  const isOpen = expandedId === pattern.id;
                  const hasApplied = pattern.appliedIn?.length > 0;
                  const hasNotes = pattern.notes?.trim().length > 0;
                  return (
                    <div
                      key={pattern.id}
                      id={`pa-${pattern.id}`}
                      className={`pa-model${isOpen ? " open" : ""}`}
                      style={{ animationDelay: `${0.02 + i * 0.015}s` }}
                    >
                      <div
                        className="pa-model-row"
                        onClick={() => setExpandedId(isOpen ? null : pattern.id)}
                      >
                        <div className="pa-model-num">{String(pattern.num).padStart(3, "0")}</div>
                        <div className="pa-model-info">
                          <div className="pa-model-title">{pattern.title}</div>
                        </div>
                        <div className="pa-model-disc">{group.label}</div>
                        <div className="pa-model-arrow">
                          {isOpen ? "\u2212" : (hasApplied || hasNotes) ? "\u25CB" : "+"}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="pa-model-detail en">
                          {hasNotes && (
                            <p className="pa-model-desc">{pattern.notes}</p>
                          )}

                          {!hasNotes && !hasApplied && (
                            <p className="pa-model-desc pa-model-desc-empty">
                              No practice notes yet.
                            </p>
                          )}

                          {/* Applied In — cross-links to SEED */}
                          {hasApplied && (
                            <div className="pa-model-applied">
                              <div className="pa-model-section-label">Applied In</div>
                              <div className="pa-model-applied-list">
                                {pattern.appliedIn.map(title => {
                                  const seedItem = findSeedItem(title);
                                  return (
                                    <span
                                      key={title}
                                      className={`pa-model-ref${seedItem ? " active" : ""}`}
                                      onClick={(e) => { e.stopPropagation(); if (seedItem) onOpen?.(seedItem); }}
                                    >
                                      {title}{seedItem && <span className="pa-model-ref-arrow">&rarr;</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Source */}
      <div className="pa-source en">
        <div className="pa-source-text">
          From <em>A Pattern Language</em> by Christopher Alexander, Sara Ishikawa,
          Murray Silverstein, Max Jacobson, Ingrid Fiksdahl-King &amp; Shlomo Angel (1977)
        </div>
        <div className="pa-source-note">
          {totalPatterns} patterns &middot; {SCALES.length} scales &middot; {totalGroups} groups
        </div>
      </div>
    </div>
  );
}
