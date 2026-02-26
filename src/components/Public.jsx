import React from "react";
import { FILTERS } from "../data/playbook-data";
import { PatternChips } from "./PatternLens";
import HeroBg from "./HeroBg";
import NetworkGraph from "./NetworkGraph";

export default function Public({ items, allItems, filter, setFilter, relFilter, onRelation, theme, nowState, onOpen, lens }) {
  const isHome = filter === "All" && !relFilter;

  return (
    <>
      {/* Hero + network only on home (All) view */}
      {isHome && (
        <>
          <div className="hero en">
            <div className="hero-text">
              <div className="hero-pre en d1">Field of Action</div>
              <h1 className="hero-h en d2">Applied awareness<br/>in live systems</h1>
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
            <div className="hero-window">
              <HeroBg theme={theme} />
            </div>
          </div>

          {/* Network diagram — interactive connections map */}
          <div className="ng-section reveal">
            <NetworkGraph items={allItems} onRelation={onRelation} activeNode={relFilter} />
          </div>
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
        const essays = items.filter(i => i.section === "writing" && !i.short);
        const notes = items.filter(i => i.section === "writing" && i.short);
        const exploration = items.filter(i => i.section === "exploration");
        const artifacts = items.filter(i => i.section === "artifacts");
        const showAll = filter === "All" && !relFilter;

        return (
          <>
            {/* Practice — Cinematic horizontal carousel */}
            {(showAll || filter === "Practice" || relFilter) && practice.length > 0 && (
              <div className="work-section reveal">
                <div className="work-section-h">Selected Work</div>
                <div className="work-carousel">
                  {practice.map((item, i) => (
                    <div key={item.id} className="work-card en" onClick={() => onOpen(item)} style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                      <div className="work-card-visual" style={{ background: `linear-gradient(135deg, ${theme.ac1}22, ${theme.ac2}18)` }}>
                        <span className="work-card-year">{item.year}</span>
                      </div>
                      <div className="work-card-body">
                        <div className="work-card-role">{item.role}</div>
                        <div className="work-card-title">{item.title}</div>
                        <div className="work-card-desc">{item.subtitle}</div>
                        {lens && <PatternChips itemTitle={item.title} active={lens} compact />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing — Editorial contents grid (5 rows, multi-column) */}
            {(showAll || filter === "Writing" || relFilter) && (essays.length > 0 || notes.length > 0) && (
              <div className="wr-section reveal">
                <div className="wr-section-h">Writing</div>
                <div className="wr-toc-grid">
                  {(() => {
                    const all = [...essays, ...notes];
                    const rows = 5;
                    const cols = Math.ceil(all.length / rows);
                    const columns = [];
                    for (let c = 0; c < cols; c++) {
                      columns.push(all.slice(c * rows, c * rows + rows));
                    }
                    return columns.map((col, ci) => (
                      <div key={ci} className="wr-toc-col">
                        {col.map((item, ri) => {
                          const i = ci * rows + ri;
                          const isMemo = item.writeType === "memo";
                          return (
                            <div key={item.id} className="wr-toc-row en" style={{animationDelay:`${0.03+i*0.03}s`}} onClick={()=>onOpen(item)}>
                              <div className="wr-toc-num">{String(i+1).padStart(2,"0")}</div>
                              <div className="wr-toc-body">
                                <div className="wr-toc-type">
                                  {isMemo && item.memoNum ? `Memo ${item.memoNum}` : "Field Note"}
                                </div>
                                <div className="wr-toc-title">{item.title}</div>
                              </div>
                              <div className="wr-toc-meta">
                                {item.readMin && <span>{item.readMin}m</span>}
                                {item.audioDur && <span className="wr-toc-audio">▶</span>}
                              </div>
                              <PatternChips itemTitle={item.title} active={lens} compact />
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Exploration — Research Threads */}
            {(showAll || filter === "Exploration" || relFilter) && exploration.length > 0 && (
              <div className="ex-section reveal">
                <div className="ex-section-h">Exploration</div>
                <div className="ex-list">
                  {exploration.map((item, i) => (
                    <div key={item.id} className="ex-row en" style={{animationDelay:`${0.05+i*0.04}s`}} onClick={()=>onOpen(item)}>
                      <div className="ex-row-left">
                        <span className={`ex-row-dot ${item.status}`} />
                        <span className="ex-row-status">{item.status === "wip" ? "In Progress" : item.status}</span>
                      </div>
                      <div className="ex-row-body">
                        <div className="ex-row-t">{item.title}</div>
                        <div className="ex-row-sub">{item.subtitle}</div>
                        <div className="ex-row-d">{item.desc}</div>
                        <PatternChips itemTitle={item.title} active={lens} compact />
                      </div>
                      <div className="ex-row-right">
                        <div className="ex-row-tags">
                          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
                          {item.relations?.map(r => <span key={r} className="card-tg rel" onClick={(e)=>{e.stopPropagation();onRelation(r)}} style={{cursor:"pointer"}}>→ {r}</span>)}
                        </div>
                        <span className="ex-row-arrow">↗</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts — Index Rows */}
            {(showAll || filter === "Artifacts" || relFilter) && artifacts.length > 0 && (
              <div className="af-section reveal">
                <div className="af-section-h">Artifacts</div>
                <div className="af-list">
                  {artifacts.map((item, i) => (
                    <div key={item.id} className="af-row en" style={{animationDelay:`${0.05+i*0.04}s`}} onClick={()=>onOpen(item)}>
                      <div className="af-row-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          {item.tags?.includes("Visual")
                            ? <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/></>
                            : <><path d="M4 4h16v16H4z"/><path d="M9 4v16"/><path d="M4 9h16"/></>
                          }
                        </svg>
                      </div>
                      <div className="af-row-body">
                        <div className="af-row-t">{item.title}</div>
                        <div className="af-row-d">{item.desc}</div>
                        <PatternChips itemTitle={item.title} active={lens} compact />
                      </div>
                      <div className="af-row-status">{item.status}</div>
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
