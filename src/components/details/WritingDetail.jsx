import React, { useMemo, useCallback } from "react";
import { VIS } from "../../data/seed";

export default function WritingDetail({ item, allItems, closing, onClose, onRelation, onOpen, fg }) {
  const writings = useMemo(() => allItems.filter(c => c.body && c.status !== "draft"), [allItems]);
  const idx = writings.findIndex(w => w.id === item.id);
  const prev = idx > 0 ? writings[idx - 1] : null;
  const next = idx < writings.length - 1 ? writings[idx + 1] : null;

  const related = useMemo(() => {
    return allItems.filter(c => {
      if (c.id === item.id || c.status === "draft") return false;
      if (item.relations?.some(r => c.title === r || c.relations?.includes(r))) return true;
      if (item.tags?.some(t => c.tags?.includes(t))) return true;
      return false;
    }).slice(0, 4);
  }, [item, allItems]);

  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artworkVi = useCallback((i) => {
    return VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg);
  }, [item.title, fg]);

  const isMemo = item.writeType === "memo";
  const fn = !isMemo ? " fn" : "";

  return (
    <div className={`rd-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>← Back</button>
      <div className="rd-inner">
        <h1 className={`rd-title${fn}`}>{item.title}</h1>
        {item.subtitle && <div className={`rd-subtitle${fn}`}>{item.subtitle}</div>}
        <div className="rd-meta">
          {isMemo && item.memoNum && <span>Memo {item.memoNum}</span>}
          {isMemo && item.memoNum && <div className="rd-meta-sep" />}
          <span>{item.year}</span>
          {item.readMin && <><div className="rd-meta-sep" /><span>{item.readMin} min read</span></>}
        </div>
        <p className={`rd-desc${fn}`}>{item.desc}</p>
        {item.audioDur && item.substackUrl && (
          <a href={item.substackUrl} target="_blank" rel="noopener noreferrer" className="rd-audio-bar" style={{textDecoration:"none",color:"inherit",cursor:"pointer"}}>
            <div className="rd-audio-dot" />
            <div className="rd-audio-wave">
              {[4,7,10,6,9,5,8,11,7,4,6,9,5,8,10,6].map((h,i) => <span key={i} style={{height:h}} />)}
            </div>
            <span>Listen on Substack · {item.audioDur}</span>
          </a>
        )}
        <div className="rd-hr" />
        <div className="rd-hero-art">
          {item.coverImg ? (
            <img src={item.coverImg} alt={item.title} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width:"100%", aspectRatio:"16/9" }} />
          )}
          <div className="rd-hero-art-glow" />
        </div>
        <div className="rd-caption">
          {item.subtitle || item.section} — {item.title}
        </div>
        {item.body?.map((block, i) => {
          if (block.type === "text") {
            return (
              <div key={i} className={`rd-body-text${fn}`}>
                {block.content.split("\n\n").map((para, j) => <p key={j}>{para}</p>)}
              </div>
            );
          }
          if (block.type === "artwork") {
            return (
              <div key={i} className="rd-artwork">
                <div className="rd-artwork-frame">
                  {block.src ? (
                    <img src={block.src} alt={block.alt || block.caption || ""} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: artworkVi(i) }} style={{ width:"100%", aspectRatio:"16/9" }} />
                  )}
                  <div className="rd-artwork-glow" />
                  {!block.src && <div className="rd-artwork-label">Artwork {i}</div>}
                </div>
                {block.caption && <div className="rd-artwork-cap">{block.caption}</div>}
              </div>
            );
          }
          if (block.type === "credit") {
            const autoLines = block.lines || [
              `From <em>${isMemo ? "Art of Memos" : "Field Notes"}</em> <strong>${item.title}</strong> by Daniel Dickson`,
              `Published via <em>Field of Action</em> / Action Systems Universal`,
              `© ${item.year} Daniel Dickson · Distributed by Cache`
            ];
            return (
              <div key={i} className="rd-credit">
                {block.thesis && <div className="rd-credit-thesis">{block.thesis}</div>}
                {autoLines.map((ln, j) => <div key={j} className="rd-credit-line" dangerouslySetInnerHTML={{ __html: ln }} />)}
              </div>
            );
          }
          if (block.type === "citations") {
            return (
              <div key={i} className="rd-citations">
                <div className="rd-citations-h">Works Cited</div>
                <div className="rd-citations-list">
                  {block.items?.map((c, j) => <div key={j} className="rd-cite" dangerouslySetInnerHTML={{ __html: c }} />)}
                </div>
              </div>
            );
          }
          return null;
        })}
        <div className="rd-tags">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel" onClick={()=>{onClose();setTimeout(()=>onRelation(r),350)}} style={{cursor:"pointer"}}>→ {r}</span>)}
        </div>
        {related.length > 0 && (
          <div className="rd-related">
            <div className="rd-related-h">Connected Work</div>
            {related.map(r => (
              <div key={r.id} className="rd-related-item" onClick={() => { if(r.body){onOpen(r);window.scrollTo(0,0)} else {onClose();setTimeout(()=>onRelation(r.title),350)} }}>
                <div>
                  <div className="rd-related-title">{r.title}</div>
                  <div className="rd-related-sub">{r.subtitle || r.section} · {r.year}</div>
                </div>
                <span style={{color:"var(--ff)",fontSize:16}}>→</span>
              </div>
            ))}
          </div>
        )}
        <div className="rd-nav">
          {prev ? (
            <button className="rd-nav-btn" onClick={() => { onOpen(prev); window.scrollTo(0,0); }}>
              <span className="rd-nav-label">← Previous</span>
              <span className="rd-nav-title">{prev.title}</span>
            </button>
          ) : <div />}
          {next ? (
            <button className="rd-nav-btn next" onClick={() => { onOpen(next); window.scrollTo(0,0); }}>
              <span className="rd-nav-label">Next →</span>
              <span className="rd-nav-title">{next.title}</span>
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
