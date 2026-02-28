import React from "react";
import { FILTERS } from "../data/playbook-data";
import { PatternChips } from "./PatternLens";
import NetworkGraph from "./NetworkGraph";

export default function Public({ items, allItems, filter, setFilter, relFilter, onRelation, theme, nowState, onOpen, lens, showGraph }) {
  const isHome = filter === "All" && !relFilter;

  return (
    <>
      {/* Hero + network only on home (All) view */}
      {isHome && (
        <>
          <div className="hero en">
            <div className="hero-text">
              <div className="hero-pre en d1">Field of Action</div>
              <h1 className="hero-h en d2">Designing Structure<br/>for Living Systems</h1>
              <p className="hero-bio en d3">Daniel is a design leader and systems thinker who builds at the intersection of product, culture, and infrastructure. Currently leading design at Apple Music, he brings over a decade of creative direction across platforms like Google Cloud, Vevo, and the Tribeca Film Festival. His work lives at the edge of structure and intuition — where frameworks become adaptive, and clarity becomes emotional. He writes, explores, builds tools, and publishes through Field of Action — a living studio of applied awareness.</p>
              <div className="hero-links en d4">
                <a href="https://fieldofaction.substack.com" target="_blank" rel="noopener noreferrer" className="hero-link">Substack ↗</a>
                <a href="https://linkedin.com/in/danieldickson" target="_blank" rel="noopener noreferrer" className="hero-link">LinkedIn ↗</a>
              </div>
              <div className="nowbar en d5">
                <span>Currently at <em>{nowState.working}</em></span><span>/</span>
                <span>Reading <em>{nowState.reading}</em></span><span>/</span>
                <span>Building <em>{nowState.building}</em></span>
              </div>
            </div>
          </div>

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
            {/* Practice — 4-column grid cards */}
            {(showAll || filter === "Practice" || relFilter) && practice.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Selected Work</div>}
                <div className="grid-4">
                  {practice.map((item, i) => (
                    <div key={item.id} className={`g-card${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? { animationDelay: `${0.05 + i * 0.06}s` } : undefined}>
                      <div className="g-card-visual" style={{ background: `linear-gradient(135deg, ${theme.ac1}22, ${theme.ac2}18)` }}>
                        <span className="g-card-year">{item.year}</span>
                      </div>
                      <div className="g-card-body">
                        <div className="g-card-pre">{item.role}</div>
                        <div className="g-card-title">{item.title}</div>
                        <div className="g-card-desc">{item.subtitle}</div>
                        {lens && <PatternChips itemTitle={item.title} active={lens} compact />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing — 4-column grid cards */}
            {(showAll || filter === "Writing" || relFilter) && allWriting.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Writing</div>}
                <div className="grid-4">
                  {allWriting.map((item, i) => {
                    const isMemo = item.writeType === "memo";
                    return (
                      <div key={item.id} className={`g-card g-card-compact${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.03+i*0.04}s`} : undefined}>
                        <div className="g-card-body">
                          <div className="g-card-pre">
                            {isMemo && item.memoNum ? `Memo ${item.memoNum}` : "Field Note"}
                          </div>
                          <div className="g-card-title">{item.title}</div>
                          {item.subtitle && <div className="g-card-desc">{item.subtitle}</div>}
                          <div className="g-card-meta">
                            {item.readMin && <span>{item.readMin} min read</span>}
                            {item.audioDur && <span>▶ Audio</span>}
                          </div>
                          <PatternChips itemTitle={item.title} active={lens} compact />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exploration — 4-column grid cards */}
            {(showAll || filter === "Exploration" || relFilter) && exploration.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Exploration</div>}
                <div className="grid-4">
                  {exploration.map((item, i) => (
                    <div key={item.id} className={`g-card${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.05+i*0.04}s`} : undefined}>
                      <div className="g-card-body">
                        <div className="g-card-pre">
                          <span className={`g-card-dot ${item.status}`} />
                          {item.status === "wip" ? "In Progress" : item.status}
                        </div>
                        <div className="g-card-title">{item.title}</div>
                        <div className="g-card-desc">{item.subtitle}</div>
                        <p className="g-card-summary">{item.desc}</p>
                        <div className="g-card-tags">
                          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
                          {item.relations?.map(r => <span key={r} className="card-tg rel" onClick={(e)=>{e.stopPropagation();onRelation(r)}} style={{cursor:"pointer"}}>→ {r}</span>)}
                        </div>
                        <PatternChips itemTitle={item.title} active={lens} compact />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts — 4-column grid cards */}
            {(showAll || filter === "Artifacts" || relFilter) && artifacts.length > 0 && (
              <div className={`content-section${showAll ? " reveal" : ""}`}>
                {showAll && <div className="content-section-h">Artifacts</div>}
                <div className="grid-4">
                  {artifacts.map((item, i) => (
                    <div key={item.id} className={`g-card g-card-compact${showAll ? " en" : ""}`} onClick={() => onOpen(item)} style={showAll ? {animationDelay:`${0.05+i*0.04}s`} : undefined}>
                      <div className="g-card-body">
                        <div className="g-card-pre">{item.artifactType || "Artifact"} · {item.version}</div>
                        <div className="g-card-title">{item.title}</div>
                        <div className="g-card-desc">{item.desc}</div>
                        <div className="g-card-status">{item.status}</div>
                        <PatternChips itemTitle={item.title} active={lens} compact />
                      </div>
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
