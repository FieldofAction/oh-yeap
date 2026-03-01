import React from "react";
import { FILTERS } from "../data/playbook-data";
import { PatternChips } from "./PatternLens";
import NetworkGraph from "./NetworkGraph";

/* ── Hero mode: 1 = Threshold Strip, 2 = Signal Bar, 3 = Ambient Dashboard ── */
const HERO_MODE = 3;

export default function Public({ items, allItems, filter, setFilter, relFilter, onRelation, theme, nowState, onOpen, lens, showGraph }) {
  const isHome = filter === "All" && !relFilter;

  return (
    <>
      {/* Hero + network only on home (All) view */}
      {isHome && (
        <>
          {HERO_MODE === 1 && (
            <div className="hero hero--strip en">
              <h1 className="hero-h en d1">Designing Structure<br/>for Living Systems</h1>
              <div className="hero-strip-row en d2">
                <div className="nowbar">
                  <span>Currently at <em>{nowState.working}</em></span><span>/</span>
                  <span>Reading <em>{nowState.reading}</em></span><span>/</span>
                  <span>Building <em>{nowState.building}</em></span>
                </div>
                <div className="hero-links">
                  <a href="https://fieldofaction.substack.com" target="_blank" rel="noopener noreferrer" className="hero-link">Substack ↗</a>
                  <a href="https://linkedin.com/in/danieldickson" target="_blank" rel="noopener noreferrer" className="hero-link">LinkedIn ↗</a>
                </div>
              </div>
            </div>
          )}

          {HERO_MODE === 2 && (
            <div className="hero hero--signal en">
              <div className="hero-pre en d1">Field of Action</div>
              <h1 className="hero-h en d2">Designing Structure<br/>for Living Systems</h1>
              <p className="hero-signal-line en d3">Design leader and systems thinker. Structure, culture, and infrastructure. Currently at Apple Music.</p>
              <div className="hero-strip-row en d4">
                <div className="hero-links">
                  <a href="https://fieldofaction.substack.com" target="_blank" rel="noopener noreferrer" className="hero-link">Substack ↗</a>
                  <a href="https://linkedin.com/in/danieldickson" target="_blank" rel="noopener noreferrer" className="hero-link">LinkedIn ↗</a>
                </div>
                <div className="nowbar">
                  <span>Currently at <em>{nowState.working}</em></span><span>/</span>
                  <span>Reading <em>{nowState.reading}</em></span><span>/</span>
                  <span>Building <em>{nowState.building}</em></span>
                </div>
              </div>
            </div>
          )}

          {HERO_MODE === 3 && (
            <div className="hero hero--dash en">
              <div className="hero-dash-grid en d1">
                <div className="hero-dash-cell">
                  <div className="hero-dash-label">Practice</div>
                  <div className="hero-dash-val">Relational Design</div>
                </div>
                <div className="hero-dash-cell">
                  <div className="hero-dash-label">Position</div>
                  <div className="hero-dash-val">Design Leader<br/>at Apple TV</div>
                </div>
                <div className="hero-dash-cell">
                  <div className="hero-dash-label">Attention</div>
                  <div className="hero-dash-val">Consolidation → Application</div>
                </div>
                <div className="hero-dash-cell">
                  <div className="hero-dash-label">Building</div>
                  <div className="hero-dash-val">Energetic Fields</div>
                </div>
                <div className="hero-dash-cell">
                  <div className="hero-dash-label">Writing</div>
                  <div className="hero-dash-val">Themes of Authoring</div>
                </div>
                <div className="hero-dash-cell">
                  <div className="hero-dash-label">Links</div>
                  <div className="hero-dash-val hero-links">
                    <a href="https://fieldofaction.substack.com" target="_blank" rel="noopener noreferrer" className="hero-link">Substack ↗</a>
                    <a href="https://linkedin.com/in/danieldickson" target="_blank" rel="noopener noreferrer" className="hero-link">LinkedIn ↗</a>
                  </div>
                </div>
              </div>
              <div className="hero-threshold">
                <div className="hero-threshold-arc" />
                <h1 className="hero-h hero-dash-h en d2">Designing Structure<br/>for Living Systems</h1>
              </div>
            </div>
          )}

          {/* Network diagram — easter egg, press G to toggle */}
          {showGraph && (
            <div className="ng-section en">
              <NetworkGraph items={allItems} onRelation={onRelation} activeNode={relFilter} />
            </div>
          )}
        </>
      )}

      {/* Section header when filtered */}
      {!isHome && !relFilter && (
        <div className="section-header en">
          <h1 className="section-header-h">{filter}</h1>
        </div>
      )}

      {/* Connection filter indicator */}
      {relFilter && (
        <div className="rel-banner en" style={{maxWidth:1200,margin:"0 auto",padding:"12px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--bd)"}}>
          <span style={{fontSize:11,color:"var(--fm)"}}>Showing connections to <strong style={{color:"var(--fg)"}}>{relFilter}</strong></span>
          <button onClick={() => onRelation(null)} style={{fontSize:10,color:"var(--ff)",background:"none",border:"1px solid var(--bd)",padding:"4px 12px",cursor:"pointer",fontFamily:"var(--sans)",letterSpacing:".06em",textTransform:"uppercase",transition:"all .2s"}} onMouseOver={e=>e.target.style.color="var(--fg)"} onMouseOut={e=>e.target.style.color="var(--ff)"}>Clear ×</button>
        </div>
      )}

      {(filter !== "All" || relFilter) && (
        <div className="filters en d5">
          {FILTERS.map(f => <button key={f} className={`fc ${!relFilter && filter===f?"on":""}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
      )}
      {/* ── Differentiated Sections ── */}
      {(() => {
        const practice = items.filter(i => i.section === "practice");
        const allWriting = items.filter(i => i.section === "writing");
        const exploration = items.filter(i => i.section === "exploration");
        const artifacts = items.filter(i => i.section === "artifacts");
        const showAll = filter === "All" && !relFilter;

        return (
          <>
            {/* Practice — index rows with hover artwork */}
            {(showAll || filter === "Practice" || relFilter) && practice.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Selected Work</div>}
                <div className="ix">
                  {practice.map((item, i) => (
                    <div key={item.id} className={`ix-row${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.05+i*0.06}s`} : undefined}>
                      <div className="ix-main">
                        <div className="ix-pre">{item.role}</div>
                        <div className="ix-title">{item.title}</div>
                        <div className="ix-sub">{item.subtitle}</div>
                      </div>
                      <div className="ix-right">
                        <div className="ix-tags">
                          {item.tags?.map(t => <span key={t} className="ix-tag">{t}</span>)}
                        </div>
                        <div className="ix-year">{item.year}</div>
                      </div>
                      <div className="ix-preview" style={{background:`linear-gradient(135deg, ${theme.ac1}30, ${theme.ac2}20)`}} />
                      {lens && <PatternChips itemTitle={item.title} active={lens} compact />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing — featured tiles + index grid */}
            {(showAll || filter === "Writing" || relFilter) && allWriting.length > 0 && (() => {
              const featured = allWriting.filter(i => i.featured);
              const rest = allWriting.filter(i => !i.featured);
              return (
                <div className={`content-section${showAll ? " reveal" : ""}`}>
                  {showAll && <div className="content-section-h">Writing</div>}
                  {featured.length > 0 && (
                    <div className="ix-wr-feat">
                      {featured.map((item, i) => (
                        <div key={item.id} className={`ix-wr-feat-card${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.03+i*0.05}s`} : undefined}>
                          <div className="ix-wr-feat-img" />
                          <div className="ix-wr-feat-body">
                            <div className="ix-wr-pre">{item.memoNum ? `Memo ${item.memoNum}` : "Field Note"}</div>
                            <div className="ix-wr-feat-title">{item.title}</div>
                            <div className="ix-wr-feat-sub">{item.subtitle}</div>
                            <div className="ix-wr-meta">
                              {item.readMin && <span>{item.readMin}m</span>}
                              {item.audioDur && <span>▶</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {rest.length > 0 && (
                    <div className="ix-wr">
                      {rest.map((item, i) => {
                        const isMemo = item.writeType === "memo";
                        return (
                          <div key={item.id} className={`ix-wr-item${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.02+i*0.03}s`} : undefined}>
                            <div className="ix-wr-head">
                              <span className="ix-wr-pre">{isMemo && item.memoNum ? `Memo ${item.memoNum}` : "Field Note"}</span>
                              <span className="ix-wr-meta">
                                {item.readMin && <span>{item.readMin}m</span>}
                                {item.audioDur && <span>▶</span>}
                              </span>
                            </div>
                            <div className="ix-wr-title">{item.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Exploration — 2-col compact (matches Artifacts) */}
            {(showAll || filter === "Exploration" || relFilter) && exploration.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Exploration</div>}
                <div className="ix-art">
                  {exploration.map((item, i) => (
                    <div key={item.id} className={`ix-art-item${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.05+i*0.04}s`} : undefined}>
                      <div className="ix-art-head">
                        <span className="ix-art-type">{item.status === "wip" ? "In Progress" : item.status}</span>
                        <span className={`ix-dot ${item.status}`} />
                      </div>
                      <div className="ix-art-title">{item.title}</div>
                      <div className="ix-art-desc">{item.desc}</div>
                      <div className="ix-art-tags">
                        {item.tags?.map(t => <span key={t} className="ix-tag">{t}</span>)}
                        {item.relations?.map(r => <span key={r} className="ix-tag ix-tag-rel" onClick={(e)=>{e.stopPropagation();onRelation(r)}}>→ {r}</span>)}
                      </div>
                      {lens && <PatternChips itemTitle={item.title} active={lens} compact />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts — 2-col index */}
            {(showAll || filter === "Artifacts" || relFilter) && artifacts.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Artifacts</div>}
                <div className="ix-art">
                  {artifacts.map((item, i) => (
                    <div key={item.id} className={`ix-art-item${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.05+i*0.04}s`} : undefined}>
                      <div className="ix-art-head">
                        <span className="ix-art-type">{item.artifactType || "Artifact"}</span>
                        <span className="ix-art-ver">{item.version}</span>
                        <span className={`ix-dot ${item.status}`} />
                      </div>
                      <div className="ix-art-title">{item.title}</div>
                      <div className="ix-art-desc">{item.desc}</div>
                      {lens && <PatternChips itemTitle={item.title} active={lens} compact />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && <div style={{maxWidth:1200,margin:"0 auto",padding:"80px 40px",textAlign:"center",fontSize:13,color:"var(--ff)",fontWeight:300}}>No items in this view.</div>}
          </>
        );
      })()}

    </>
  );
}
