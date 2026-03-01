import React, { useCallback } from "react";
import { VIS } from "../../data/seed";
import { PatternChipsDetail, AlexanderChipsDetail } from "../PatternLens";

export default function SketchbookDetail({ item, allItems, closing, onClose, onOpen, fg, lens, patternLens }) {
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i) % VIS.length](fg), [item.title, fg]);

  return (
    <div className={`sk-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>← Back</button>
      <div className="sk-inner">
        <div className="sk-status dc dc1">
          <span className={`ex-pin-dot ${item.status}`} />
          {item.status === "wip" ? "In Progress" : item.status}
        </div>
        <h1 className="sk-title dc dc1">{item.title}</h1>
        <div className="sk-sub dc dc2">{item.subtitle} · {item.year}</div>
        {item.sketch?.hypothesis && (
          <div className="sk-hyp dc dc3">
            <div className="sk-hyp-label">Hypothesis</div>
            <div className="sk-hyp-text">{item.sketch.hypothesis}</div>
          </div>
        )}
        {item.sketch?.fragments?.length > 0 && (
          <div className="sk-frag-section dc dc4">
            <div className="sk-frag-label">Fragments</div>
            <div className="sk-fragments">
              {item.sketch.fragments.map((frag, i) => {
                if (frag.type === "visual") {
                  return (
                    <React.Fragment key={i}>
                      <div className="sk-frag-visual img-reveal" style={{animationDelay:`${0.3 + i * 0.08}s`}}>
                        {frag.src ? (
                          <img src={frag.src} alt={frag.caption || `${item.title} fragment ${i}`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: artVi(i) }} style={{ width:"100%", height:"100%" }} />
                        )}
                        <div className="sk-frag-visual-glow" />
                      </div>
                      {frag.caption && <div className="sk-frag-cap">{frag.caption}</div>}
                    </React.Fragment>
                  );
                }
                if (frag.type === "note") {
                  return (
                    <div key={i} className="sk-frag-note">
                      {frag.date && <div className="sk-frag-note-date">{frag.date}</div>}
                      <div className="sk-frag-note-text">{frag.content}</div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
        {item.sketch?.openQuestions?.length > 0 && (
          <div className="sk-oq dc dc6">
            <div className="sk-oq-label">Open Questions</div>
            {item.sketch.openQuestions.map((q, i) => (
              <div key={i} className="sk-oq-item">{q}</div>
            ))}
          </div>
        )}
        {item.sketch?.connections?.length > 0 && (
          <div className="sk-conn dc dc7">
            <div className="sk-conn-label">Connections</div>
            {item.sketch.connections.map((c, i) => {
              const linked = allItems.find(a => a.title === c.title);
              return (
                <div key={i} className="sk-conn-item" onClick={() => { if(linked && (linked.body || linked.caseStudy || linked.sketch)){onOpen(linked);window.scrollTo(0,0)} }}>
                  <div className="sk-conn-title">{c.title} →</div>
                  <div className="sk-conn-why">{c.why}</div>
                </div>
              );
            })}
          </div>
        )}
        <PatternChipsDetail itemTitle={item.title} active={lens} />
        <AlexanderChipsDetail itemTitle={item.title} active={patternLens} />
        <div className="rd-tags dc dc8">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel">→ {r}</span>)}
        </div>
      </div>
    </div>
  );
}
