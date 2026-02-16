import React from "react";

export default function SmallCard({ item, delay, onRelation, onOpen }) {
  return (
    <div className="csm en" style={{ animationDelay: `${0.1+delay*0.06}s` }} onClick={()=>onOpen(item)}>
      <div className="csm-t">{item.title}</div>
      {item.desc && <div className="csm-d">{item.desc}</div>}
      <div className="csm-m">
        <span>{item.subtitle||"Note"}</span><span>{item.year}</span>
        {item.relations?.map(r => <span key={r} onClick={(e)=>{e.stopPropagation();onRelation(r)}} style={{cursor:"pointer",borderBottom:"1px solid var(--bd)",transition:"color .2s"}} onMouseOver={e=>e.target.style.color="var(--fg)"} onMouseOut={e=>e.target.style.color=""}>→ {r}</span>)}
      </div>
    </div>
  );
}
