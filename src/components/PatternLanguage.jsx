import React, { useState, useMemo } from "react";
import { MODELS, VOLUMES } from "../data/models";
import { SEED } from "../data/seed";

/**
 * PatternLanguage — editorial reading page for the full pattern language.
 * Presents all 71 models as a curated index with volume groupings,
 * cross-references to practice work, and a narrative framing.
 * Distinct from Models.jsx (searchable database grid) — this is a
 * long-form reading experience.
 */
export default function PatternLanguage({ content, onOpen, fg }) {
  const [expandedId, setExpandedId] = useState(null);

  /* group all models by volume */
  const grouped = useMemo(() => {
    const map = {};
    MODELS.forEach(m => {
      if (!map[m.volume]) map[m.volume] = [];
      map[m.volume].push(m);
    });
    return VOLUMES.map(v => ({
      ...v,
      models: map[v.num] || [],
    }));
  }, []);

  /* stats */
  const totalModels = MODELS.length;
  const totalApplied = useMemo(() => {
    const set = new Set();
    MODELS.forEach(m => m.appliedIn?.forEach(t => set.add(t)));
    return set.size;
  }, []);
  const disciplines = useMemo(() => {
    const set = new Set();
    MODELS.forEach(m => set.add(m.discipline));
    return [...set];
  }, []);

  const findSeedItem = (title) => (content || SEED).find(c => c.title === title);

  return (
    <div className="pa en">
      {/* Header */}
      <div className="pa-header en d1">
        <div className="pa-pre">Index</div>
        <h1 className="pa-h">Pattern Language</h1>
        <p className="pa-sub">
          A numbered index of {totalModels} thinking tools drawn from
          The Great Mental Models series &mdash; organized into {VOLUMES.length} volumes
          and applied across {totalApplied} works in this practice.
        </p>
      </div>

      {/* Overview */}
      <div className="pa-overview en d2">
        <div className="pa-sl">Overview</div>
        <p className="pa-body">
          Patterns are reusable lenses for thinking. Each model is a distilled principle from
          physics, biology, mathematics, economics, or art &mdash; translated into a tool
          for design and decision-making. Together they form a shared vocabulary
          that connects theoretical awareness to applied practice.
        </p>
        <div className="pa-stats">
          <div className="pa-stat">
            <div className="pa-stat-num">{totalModels}</div>
            <div className="pa-stat-label">Models</div>
          </div>
          <div className="pa-stat">
            <div className="pa-stat-num">{VOLUMES.length}</div>
            <div className="pa-stat-label">Volumes</div>
          </div>
          <div className="pa-stat">
            <div className="pa-stat-num">{totalApplied}</div>
            <div className="pa-stat-label">Applied Works</div>
          </div>
          <div className="pa-stat">
            <div className="pa-stat-num">{disciplines.length}</div>
            <div className="pa-stat-label">Disciplines</div>
          </div>
        </div>
      </div>

      {/* Discipline overview */}
      <div className="pa-disciplines en d3">
        <div className="pa-sl">Disciplines</div>
        <div className="pa-disc-row">
          {disciplines.map(d => (
            <span key={d} className="pa-disc-chip">{d}</span>
          ))}
        </div>
      </div>

      {/* Volume sections */}
      {grouped.map((vol, vi) => (
        <div key={vol.key} className="pa-volume en">
          <div className="pa-vol-head">
            <div className="pa-vol-num">Volume {vol.num}</div>
            <div className="pa-vol-title">{vol.title}</div>
            <div className="pa-vol-count">{vol.models.length} models</div>
          </div>

          <div className="pa-model-list">
            {vol.models.map((model, i) => {
              const isOpen = expandedId === model.id;
              return (
                <div
                  key={model.id}
                  className={`pa-model${isOpen ? " open" : ""}`}
                  style={{ animationDelay: `${0.02 + i * 0.015}s` }}
                >
                  <div className="pa-model-row" onClick={() => setExpandedId(isOpen ? null : model.id)}>
                    <div className="pa-model-num">{String(model.num).padStart(2, "0")}</div>
                    <div className="pa-model-info">
                      <div className="pa-model-title">{model.title}</div>
                      {model.alias && <div className="pa-model-alias">{model.alias}</div>}
                    </div>
                    <div className="pa-model-disc">{model.discipline}</div>
                    <div className="pa-model-arrow">{isOpen ? "−" : "+"}</div>
                  </div>

                  {isOpen && (
                    <div className="pa-model-detail en">
                      <p className="pa-model-desc">{model.desc}</p>

                      <div className="pa-model-tags">
                        {model.tags.map(t => <span key={t} className="card-tg">{t}</span>)}
                      </div>

                      {model.appliedIn?.length > 0 && (
                        <div className="pa-model-applied">
                          <div className="pa-model-section-label">Applied In</div>
                          <div className="pa-model-applied-list">
                            {model.appliedIn.map(title => {
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

                      {model.related?.length > 0 && (
                        <div className="pa-model-related">
                          <div className="pa-model-section-label">Related</div>
                          <div className="pa-model-related-list">
                            {model.related.map(num => {
                              const rel = MODELS.find(m => m.num === num);
                              if (!rel) return null;
                              return (
                                <span
                                  key={num}
                                  className="pa-model-rel-chip"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedId(rel.id);
                                    setTimeout(() => {
                                      document.getElementById(`pa-${rel.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    }, 60);
                                  }}
                                >
                                  {String(rel.num).padStart(2, "0")} {rel.title}
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

      {/* Source */}
      <div className="pa-source en">
        <div className="pa-source-text">Organized from The Great Mental Models by Shane Parrish</div>
        <div className="pa-source-note">{totalModels} patterns &middot; {VOLUMES.length} volumes &middot; {disciplines.length} disciplines</div>
      </div>
    </div>
  );
}
