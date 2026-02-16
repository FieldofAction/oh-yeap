import React from "react";
import { FILTERS } from "../data/playbook-data";
import PracticeRow from "./ui/PracticeRow";

export default function Public({ items, filter, setFilter, relFilter, onRelation, theme, nowState, onOpen }) {
  return (
    <>
      <div className="hero en" style={{position:"relative"}}>
        {/* Presence of Light — subtle radial glow behind hero */}
        <div style={{position:"absolute",top:"30%",left:"20%",width:"50vw",height:"50vw",borderRadius:"50%",background:`radial-gradient(circle,${theme.bg === "#0a0a09" ? "rgba(200,180,140,0.03)" : "rgba(0,0,0,0.02)"} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}} />
        <div style={{position:"relative",zIndex:1}}>
          <div className="hero-pre en d1">Field Intelligence</div>
          <h1 className="hero-h en d2">Applied intelligence<br/>in live <em>systems</em></h1>
          <p className="hero-sub en d3">Translating complexity into coherent action — through design leadership, systems thinking, and relational infrastructure. Building conditions under which alignment can appear.</p>
        </div>
      </div>
      <div className="nowbar en d4">
        <span>Currently at <em>{nowState.working}</em></span><span>·</span>
        <span>Reading <em>{nowState.reading}</em></span><span>·</span>
        <span>Building <em>{nowState.building}</em></span>
      </div>

      {/* Connection filter indicator */}
      {relFilter && (
        <div className="rel-banner en" style={{maxWidth:1200,margin:"0 auto",padding:"12px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--bd)"}}>
          <span style={{fontSize:11,color:"var(--fm)"}}>Showing connections to <strong style={{color:"var(--fg)"}}>{relFilter}</strong></span>
          <button onClick={() => onRelation(null)} style={{fontSize:10,color:"var(--ff)",background:"none",border:"1px solid var(--bd)",padding:"4px 12px",cursor:"pointer",fontFamily:"var(--sans)",letterSpacing:".06em",textTransform:"uppercase",transition:"all .2s"}} onMouseOver={e=>e.target.style.color="var(--fg)"} onMouseOut={e=>e.target.style.color="var(--ff)"}>Clear ×</button>
        </div>
      )}

      <div className="filters en d5">
        {FILTERS.map(f => <button key={f} className={`fc ${!relFilter && filter===f?"on":""}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
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
            {/* Practice — Metalab rows */}
            {(showAll || filter === "Practice" || relFilter) && practice.length > 0 && (
              <div className="prow-section en d5">
                <div className="prow-section-h">Selected Work</div>
                {practice.map((item, i) => (
                  <PracticeRow key={item.id} item={item} delay={i} fg={theme.fg} onOpen={onOpen} />
                ))}
              </div>
            )}

            {/* Writing — Editorial contents grid (5 rows, multi-column) */}
            {(showAll || filter === "Writing" || relFilter) && (essays.length > 0 || notes.length > 0) && (
              <div className="wr-section en">
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
              <div className="ex-section en">
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
              <div className="af-section en">
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
                      </div>
                      <div className="af-row-status">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && <div style={{maxWidth:1200,margin:"0 auto",padding:"80px 40px",textAlign:"center",fontSize:13,color:"var(--ff)",fontStyle:"italic"}}>No items in this view.</div>}
          </>
        );
      })()}

      {/* Ethos — minimal position for hiring managers */}
      <div className="ethos en" style={{maxWidth:1200,margin:"80px auto 0",padding:"60px 40px",borderTop:"1px solid var(--bd)"}}>
        <div style={{fontSize:9,fontWeight:500,letterSpacing:".14em",textTransform:"uppercase",color:"var(--ff)",marginBottom:16}}>Position</div>
        <p style={{fontFamily:"var(--display)",fontSize:"clamp(22px,3vw,32px)",fontWeight:400,lineHeight:1.4,letterSpacing:"-0.02em",maxWidth:700}}>
          A creative director working at the intersection of design systems, relational theory, and emerging technology — building conditions for coherence across brand, product, and culture.
        </p>
        <p style={{fontSize:13,fontWeight:300,lineHeight:1.7,color:"var(--fm)",maxWidth:520,marginTop:20}}>
          The work moves between applied design leadership and theoretical research. Current focus: how relational intelligence reshapes what design can be — from outputs to field conditions.
        </p>
      </div>

      <div className="canon en">
        <div className="canon-h">Relational Design</div>
        <p className="canon-p">A practice of designing conditions — not outcomes. Orientation and shared language for work that holds complexity without collapsing it.</p>
        <div className="canon-ax">
          <span className="canon-al">Governing Principle</span>
          <p className="canon-at">Embodied action precedes alignment. You do not act to become aligned. You act because alignment has already taken form.</p>
        </div>
        <div className="canon-ax">
          <span className="canon-al">System Invariant</span>
          <p className="canon-at">Practice precedes documentation. Documentation never leads offerings. Silence is allowed.</p>
        </div>
        <div className="canon-ax">
          <span className="canon-al">Aliveness</span>
          <p className="canon-at">The system demonstrates aliveness through responsiveness, not performance. State is visible. Change is legible. Stillness and motion are both evidence of attention.</p>
        </div>
      </div>
      <div className="cta">
        <p className="cta-p">Field Intelligence engages where a real system exists, a real constraint is present, and responsibility is held.</p>
        <a href="#" className="cta-a">Begin a conversation →</a>
      </div>
      <footer className="foot"><span>Field Intelligence</span><span>2025</span></footer>
    </>
  );
}
