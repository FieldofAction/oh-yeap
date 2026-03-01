import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MODELS, VOLUMES } from "../data/models";

export default function Models({ content, onOpen, fg }) {
  const [volumeFilter, setVolumeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  /* close expanded card on Escape */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && expandedId) setExpandedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expandedId]);

  const filtered = useMemo(() => {
    let items = MODELS;
    if (volumeFilter !== "All") {
      items = items.filter(m => m.volume === parseInt(volumeFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.alias?.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [volumeFilter, search]);

  /* group filtered models by volume */
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      if (!map[m.volume]) map[m.volume] = [];
      map[m.volume].push(m);
    });
    return VOLUMES.filter(v => map[v.num]).map(v => ({
      ...v,
      models: map[v.num],
    }));
  }, [filtered]);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const findSeedItem = useCallback((title) => content.find(c => c.title === title), [content]);

  const findModel = useCallback((num) => MODELS.find(m => m.num === num), []);

  const jumpToModel = useCallback((num) => {
    const rel = MODELS.find(m => m.num === num);
    if (!rel) return;
    setExpandedId(rel.id);
    setTimeout(() => {
      document.getElementById(rel.id)?.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 60);
  }, []);

  return (
    <div className="mm en">
      {/* Header */}
      <div className="mm-header en d1">
        <div className="mm-pre">Pattern Database</div>
        <h2 className="mm-h">Mental Models</h2>
        <p className="mm-sub">
          A numbered index of thinking tools from The Great Mental Models series.
          Each pattern links to applied examples across the work.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mm-controls en d2">
        <input
          className="mm-search"
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="mm-filters">
          <button className={`fc ${volumeFilter === "All" ? "on" : ""}`} onClick={() => setVolumeFilter("All")}>All</button>
          {VOLUMES.map(v => (
            <button key={v.key} className={`fc ${volumeFilter === String(v.num) ? "on" : ""}`} onClick={() => setVolumeFilter(String(v.num))}>
              Vol {v.num}
            </button>
          ))}
        </div>
      </div>

      {/* Volume sections */}
      {grouped.map(vol => (
        <div key={vol.key} className="mm-vol-section en">
          <div className="mm-vol-h">
            <span className="mm-vol-num">Volume {vol.num}</span>
            <span className="mm-vol-title">{vol.title}</span>
            <span className="mm-vol-count">{vol.models.length}</span>
          </div>

          <div className="mm-grid">
            {vol.models.map((model, i) => {
              const isExpanded = expandedId === model.id;
              return (
                <div
                  key={model.id}
                  id={model.id}
                  className={`mm-card en${isExpanded ? " expanded" : ""}`}
                  style={{ animationDelay:`${0.03 + i * 0.02}s` }}
                >
                  {/* Card head — always visible */}
                  <div className="mm-card-head" onClick={() => toggleExpand(model.id)}>
                    <div className="mm-card-num">{String(model.num).padStart(2,"0")}</div>
                    <div className="mm-card-body">
                      <div className="mm-card-title">{model.title}</div>
                      {model.alias && <div className="mm-card-alias">{model.alias}</div>}
                    </div>
                    <div className="mm-card-disc">{model.discipline}</div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mm-card-detail">
                      <p className="mm-card-desc">{model.desc}</p>

                      <div className="mm-card-tags">
                        {model.tags.map(t => <span key={t} className="card-tg">{t}</span>)}
                      </div>

                      {/* Applied In — cross-links to SEED */}
                      {model.appliedIn?.length > 0 && (
                        <div className="mm-card-applied">
                          <div className="mm-card-section-label">Applied In</div>
                          {model.appliedIn.map(title => {
                            const seedItem = findSeedItem(title);
                            return (
                              <div
                                key={title}
                                className={`mm-card-link${seedItem ? " active" : ""}`}
                                onClick={() => seedItem && onOpen(seedItem)}
                              >
                                <span>{title}</span>
                                {seedItem && <span className="mm-card-link-arrow">&rarr;</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Related Models */}
                      {model.related?.length > 0 && (
                        <div className="mm-card-related">
                          <div className="mm-card-section-label">Related Models</div>
                          <div className="mm-card-related-list">
                            {model.related.map(num => {
                              const rel = findModel(num);
                              if (!rel) return null;
                              return (
                                <span
                                  key={num}
                                  className="mm-card-rel-chip"
                                  onClick={e => { e.stopPropagation(); jumpToModel(num); }}
                                >
                                  {String(rel.num).padStart(2,"0")} {rel.title}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mm-card-vol-badge">Vol {model.volume} &middot; {model.discipline}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mm-empty">No models match &ldquo;{search}&rdquo;</div>
      )}

      {/* Footer */}
      <div className="mm-footer">
        <div className="mm-footer-cite">
          <div className="mm-footer-title">The Great Mental Models</div>
          <div className="mm-footer-subtitle">Volumes 1&ndash;{VOLUMES.length}</div>
        </div>
        <div className="mm-footer-authors">Shane Parrish &amp; Rhiannon Beaubien</div>
        <div className="mm-footer-pub">Latticework Publishing, Ottawa</div>
        <div className="mm-footer-meta">{MODELS.length} models &middot; {VOLUMES.length} volumes</div>
        <div className="mm-footer-link">
          <a href="https://fs.blog/tgmm/" target="_blank" rel="noopener noreferrer">
            fs.blog/tgmm <span className="mm-footer-ext">&nearr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
