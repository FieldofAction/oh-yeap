import React, { useMemo } from "react";
import { VIS } from "../../data/seed";

export default function PracticeRow({ item, delay, fg, onOpen }) {
  const vi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  return (
    <div className="prow en" style={{ animationDelay: `${0.1+delay*0.08}s` }} onClick={()=>onOpen(item)}>
      <div className="prow-title">{item.title}</div>
      <div className="prow-desc">{item.desc}</div>
      <div className="prow-meta">
        {item.tags?.slice(0,2).map(t => <span key={t} className="prow-tag">{t}</span>)}
      </div>
      <div className="prow-yr">{item.year}</div>
      <span className="prow-arrow">→</span>
      {item.hasVisual && (
        <div className="prow-preview">
          <div dangerouslySetInnerHTML={{ __html: vi }} style={{ width:"100%", height:"100%" }} />
          <div className="prow-glow" />
        </div>
      )}
    </div>
  );
}
