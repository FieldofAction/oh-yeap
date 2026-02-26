import React, { useState, useMemo } from "react";
import { VIS } from "../../data/seed";

export default function Card({ item, delay, fg, onRelation, onOpen }) {
  const [hov, setHov] = useState(false);
  const vi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  return (
    <div className="card en" style={{ animationDelay: `${0.1+delay*0.06}s` }} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onOpen(item)}>
      {(item.hasVisual || item.coverImg) && (
        <div className="card-v" style={{position:"relative"}}>
          {item.coverImg ? (
            <img src={item.coverImg} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: vi }} style={{ width:"100%", height:"100%" }} />
          )}
          <div className="card-vo" />
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 60%, rgba(59,74,63,0.06) 0%, transparent 60%)",opacity:hov?1:0,transition:"opacity .6s",pointerEvents:"none"}} />
        </div>
      )}
      <div className="card-b">
        <div className="card-ey">
          <span className="card-tp">{item.subtitle || item.section}</span>
          <span className="card-yr">{item.year}</span>
        </div>
        <div className="card-t">{item.title}</div>
        <div className="card-d">{item.desc}</div>
        <div style={{maxHeight:hov?40:0,opacity:hov?1:0,overflow:"hidden",transition:"all .4s ease",marginTop:hov?8:0}}>
          <span style={{fontSize:11,fontWeight:300,color:"var(--ff)"}}>
            {item.section === "practice" ? "Applied intervention" : item.section === "writing" ? "Evolving document" : item.section === "exploration" ? "Active experiment" : "System artifact"} · {item.status}
          </span>
        </div>
        <div className="card-tags">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel" onClick={(e)=>{e.stopPropagation();onRelation(r)}} style={{cursor:"pointer"}}>→ {r}</span>)}
        </div>
      </div>
      <span className="card-ar">→</span>
    </div>
  );
}
