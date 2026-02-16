import React, { useMemo, useCallback } from "react";
import { VIS } from "../../data/seed";

export default function CaseStudyDetail({ item, closing, onClose, fg }) {
  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg), [item.title, fg]);

  return (
    <div className={`cs-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>← Back</button>
      <div className="cs-inner">
        <h1 className="cs-title">{item.title}</h1>
        <div className="cs-meta-row">
          {item.role && <div className="cs-meta-col"><span className="cs-meta-label">Role</span><span className="cs-meta-val">{item.role}</span></div>}
          <div className="cs-meta-col"><span className="cs-meta-label">Type</span><span className="cs-meta-val">{item.subtitle}</span></div>
          <div className="cs-meta-col"><span className="cs-meta-label">Year</span><span className="cs-meta-val">{item.year}</span></div>
          <div className="cs-meta-col"><span className="cs-meta-label">Status</span><span className="cs-meta-val" style={{textTransform:"capitalize"}}>{item.status}</span></div>
        </div>
        <p className="cs-desc">{item.desc}</p>
        {item.caseStudy?.map((block, i) => {
          if (block.type === "hero") {
            return (
              <div key={i} className="cs-hero">
                <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width:"100%", height:"100%" }} />
                <div className="cs-hero-glow" />
              </div>
            );
          }
          if (block.type === "text") {
            return (
              <div key={i} className="cs-text">
                {block.content.split("\n\n").map((p, j) => <p key={j}>{p}</p>)}
              </div>
            );
          }
          if (block.type === "image") {
            return (
              <React.Fragment key={i}>
                <div className="cs-full-img">
                  <div dangerouslySetInnerHTML={{ __html: artVi(i) }} style={{ width:"100%", height:"100%" }} />
                  <div className="cs-full-img-glow" />
                  <div className="cs-full-img-label">Figure {Math.ceil(i/2)}</div>
                </div>
                {block.caption && <div className="cs-img-cap">{block.caption}</div>}
              </React.Fragment>
            );
          }
          return null;
        })}
        {item.deliverables?.length > 0 && (
          <div className="cs-deliv">
            <div className="cs-deliv-h">Deliverables</div>
            <div className="cs-deliv-list">
              {item.deliverables.map(d => <span key={d} className="prow-tag">{d}</span>)}
            </div>
          </div>
        )}
        <div className="rd-tags" style={{maxWidth:640,margin:"48px auto 0"}}>
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel" style={{cursor:"pointer"}}>→ {r}</span>)}
        </div>
      </div>
    </div>
  );
}
