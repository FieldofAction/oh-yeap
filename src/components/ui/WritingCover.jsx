import React, { useMemo } from "react";
import { VIS } from "../../data/seed";

export default function WritingCover({ item, delay, fg, onOpen }) {
  const vi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const isMemo = item.writeType === "memo";
  return (
    <div className="wr-cover en" style={{animationDelay:`${0.1+delay*0.08}s`}} onClick={()=>onOpen(item)}>
      <div className="wr-cover-art">
        <div className={`wr-cover-stripe ${isMemo?"memo":"fn"}`} />
        {item.coverImg ? (
          <img src={item.coverImg} alt={item.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: vi }} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
        )}
        <div className="wr-cover-grad" />
        <div className="wr-cover-glow" />
        <div className="wr-cover-type">
          {isMemo && item.memoNum && <span className="wr-cover-memo-num">Memo {item.memoNum} · </span>}
          {item.subtitle || "Essay"}
        </div>
        {item.audioDur && item.substackUrl && (
          <div className="wr-cover-audio" onClick={(e) => { e.stopPropagation(); window.open(item.substackUrl, "_blank", "noopener"); }}>
            ▶ {item.audioDur}
          </div>
        )}
        <div className="wr-cover-inner">
          <div className="wr-cover-title">{item.title}</div>
          <div className="wr-cover-desc">{item.desc}</div>
          <div className="wr-cover-meta">
            <span>{item.year}</span>
            {item.readMin && <><span>·</span><span>{item.readMin} min read</span></>}
            <span>·</span>
            <span style={{textTransform:"capitalize"}}>{item.status}</span>
          </div>
          <div className="wr-cover-tags">
            {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
            {item.relations?.map(r => <span key={r} className="card-tg rel">→ {r}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
