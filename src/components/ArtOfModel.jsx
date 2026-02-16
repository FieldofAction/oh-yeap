import React, { useState, useMemo, useCallback } from "react";
import { AOM_VERSIONS } from "../data/aom-versions";
import { PILLARS } from "../data/playbook-data";

export default function ArtOfModel({ asu }) {
  const settings = asu.get_settings();
  const aomState = asu.get_art_of_model();
  const ver = aomState.activeVersion || "v3";
  const responses = aomState.responses;
  const model = AOM_VERSIONS[ver];
  const [synthesizing, setSynthesizing] = useState(false);

  const r = responses[ver] || {};
  const inputSteps = model.steps.filter(s => s.ph);
  const filledSteps = inputSteps.filter(s => r[s.n]?.trim());
  const allFilled = inputSteps.every(s => r[s.n]?.trim());
  const synthesis = aomState.synthesis[ver];

  const isUnlocked = useCallback((idx) => {
    if (idx === 0) return true;
    const prev = model.steps[idx - 1];
    return prev.ph ? !!(r[prev.n]?.trim()) : true;
  }, [model, r]);

  const runSynthesis = useCallback(async () => {
    if (!allFilled || synthesizing) return;
    setSynthesizing(true);
    const stepsText = inputSteps.filter(s => r[s.n]).map(s => `${s.title} (${s.layer}): ${r[s.n]}`).join("\n");
    const prompt = `You are analyzing responses to The Art of Model (${ver}) — "${model.subtitle}"${model.shift ? ` (${model.shift})` : ""}.

The user has completed all steps:
${stepsText}

Write a synthesis that:
1. Identifies the throughline across all their answers
2. Names the core tension or opportunity
3. Suggests what this means for their next move
4. Connects their thinking to a concrete direction

Be direct, specific to their answers, and avoid generic advice. Write 3-4 sentences. Do not use bullet points.

Respond with ONLY the synthesis text, no preamble.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json","x-api-key":settings.apiKey,"anthropic-version":settings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({ model:settings.model, max_tokens:500, messages:[{role:"user",content:prompt}] }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      const text = d.content?.map(b => b.text||"").join("") || "";
      asu.set_aom_synthesis(ver, text);
    } catch(err) {
      asu.set_aom_synthesis(ver, `Synthesis unavailable — ${err.message}. Your completed model is still stored and feeding into the Playbook and Backstage.`);
    }
    setSynthesizing(false);
  }, [allFilled, synthesizing, model, ver, r, asu, inputSteps]);

  const exportText = useMemo(() => {
    const lines = [
      `THE ART OF MODEL — ${ver.toUpperCase()}`, model.subtitle,
      model.shift ? `(${model.shift})` : "", `Date: ${new Date().toLocaleDateString()}`, ``,
      ...model.steps.flatMap(s => [`${s.n}. ${s.title}`, s.question ? `   Q: ${s.question}` : "", r[s.n] ? `   A: ${r[s.n]}` : `   A: —`, `   Layer: ${s.layer}`, ``]),
      `Flow: ${model.flow.join(" → ")}`, ``,
      synthesis ? `SYNTHESIS\n${synthesis}\n` : "", `— Action Systems Universal`,
    ];
    return lines.filter(l => l !== "").join("\n");
  }, [ver, r, model, synthesis]);

  return (
    <div className="aom en">
      <div className="aom-h">{model.title}</div>
      <div className="aom-subtitle">{model.subtitle}</div>
      {model.shift ? <div className="aom-shift">{model.shift}</div> : <div style={{marginBottom:32}} />}

      <div className="aom-vtoggle">
        {Object.entries(AOM_VERSIONS).map(([k,v]) => (
          <button key={k} className={`aom-vbtn ${ver===k?"on":""}`} onClick={()=>asu.set_aom_version(k)}>
            {v.label} — {k==="v1"?"Intervention":k==="v2"?"Authorship":"Infrastructure"}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{display:"flex",gap:0,marginBottom:32}}>
        {model.steps.map((s,i) => {
          const filled = s.ph ? !!(r[s.n]?.trim()) : true;
          const unlocked = isUnlocked(i);
          return <div key={`${ver}-prog-${s.n}`} style={{flex:1,height:3,background:filled?"var(--fg)":unlocked?"var(--bd)":"var(--sf)",transition:"background .3s",borderRadius:i===0?"2px 0 0 2px":i===model.steps.length-1?"0 2px 2px 0":""}} />;
        })}
      </div>

      {model.steps.map((s, idx) => {
        const unlocked = isUnlocked(idx);
        const filled = s.ph ? !!(r[s.n]?.trim()) : true;
        return (
          <div key={`${ver}-${s.n}`} className="aom-step" style={{opacity:unlocked?1:0.3,pointerEvents:unlocked?"auto":"none",transition:"opacity .3s"}}>
            <div className="aom-step-head">
              <div className="aom-step-n" style={{color:filled?"var(--fg)":"var(--ff)"}}>{s.n}</div>
              <div className="aom-step-title">{s.title}</div>
              {filled && s.ph && <span style={{fontSize:9,color:"var(--fg)",marginLeft:8}}>✓</span>}
              {!unlocked && <span style={{fontSize:9,color:"var(--ff)",marginLeft:8,fontStyle:"italic"}}>Complete previous step to unlock</span>}
            </div>
            {s.question && <div className="aom-step-q">{s.question}</div>}
            <div className="aom-step-body">{s.body}</div>
            <div className="aom-step-layer">{s.layer}</div>
            {s.mapped && <div className="aom-step-mapped">Mapped to: {s.mapped}</div>}
            {s.ph && unlocked && (
              <textarea className="aom-step-input" placeholder={s.ph} value={r[s.n] || ""} onChange={e => asu.set_aom_response(ver, s.n, e.target.value)} />
            )}
          </div>
        );
      })}

      {/* Flow */}
      <div className="aom-flow">
        {model.flow.map((f,i) => {
          const step = model.steps[i];
          const filled = step?.ph ? !!(r[step.n]?.trim()) : true;
          return (
            <React.Fragment key={i}>
              <span className="aom-flow-step" style={{color:filled?"var(--fg)":"var(--ff)"}}>{f}</span>
              {i < model.flow.length-1 && <span className="aom-flow-arrow">→</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Synthesis */}
      {allFilled && (
        <div style={{marginTop:32,padding:24,background:"var(--sf)",borderRadius:8,border:"1px solid var(--bd)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:500,letterSpacing:".14em",textTransform:"uppercase",color:"var(--ff)"}}>Synthesis</div>
            <button className="btn" onClick={runSynthesis} disabled={synthesizing} style={{fontSize:10}}>
              {synthesizing ? "Generating…" : synthesis ? "Regenerate" : "Generate Synthesis"}
            </button>
          </div>
          {synthesizing && <div style={{fontSize:12,color:"var(--fm)",fontStyle:"italic"}}>Running your answers through the model…</div>}
          {synthesis && !synthesizing && <div style={{fontSize:13,fontWeight:300,color:"var(--fg)",lineHeight:1.7,fontFamily:"var(--display)",letterSpacing:"-0.01em"}}>{synthesis}</div>}
          {!synthesis && !synthesizing && <div style={{fontSize:11,color:"var(--ff)",fontStyle:"italic"}}>All steps complete. Generate a synthesis to see how your answers connect.</div>}
          {synthesis && <div style={{marginTop:12,fontSize:9,color:"var(--ff)"}}>This synthesis + your step responses are now feeding into the Playbook and Backstage agent context.</div>}
        </div>
      )}

      {/* Comparison */}
      <div className="aom-compare">
        <div className="aom-compare-h">The Core Difference</div>
        <div className="aom-compare-grid">
          <div className="aom-compare-cell" style={{borderLeft:ver==="v1"?"2px solid var(--fg)":"none"}}><h5>v1 — Intervention</h5><p>Artifact-focused. Responsible act. Make something.</p></div>
          <div className="aom-compare-cell" style={{borderLeft:ver==="v2"?"2px solid var(--fg)":"none"}}><h5>v2 — Authorship</h5><p>Field-focused. Sustainable signal. Become something.</p></div>
          <div className="aom-compare-cell" style={{borderLeft:ver==="v3"?"2px solid var(--fg)":"none"}}><h5>v3 — Infrastructure</h5><p>Identity-focused. Recursive system. Run something.</p></div>
        </div>
      </div>

      {/* Export */}
      <div className="pb-section" style={{marginTop:40}}>
        <div className="pb-sl">Export</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          <button className="btn" onClick={()=>navigator.clipboard?.writeText(exportText)}>Copy</button>
          <button className="btn gh" onClick={()=>{const b=new Blob([exportText],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`art-of-model-${ver}.txt`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}}>Download .txt</button>
        </div>
      </div>

      {/* Status */}
      <div style={{marginTop:24,padding:12,background:"var(--bg)",borderRadius:6,border:"1px solid var(--bd)"}}>
        <div style={{fontSize:9,fontWeight:500,letterSpacing:".12em",textTransform:"uppercase",color:"var(--ff)",marginBottom:6}}>System Status</div>
        <div style={{fontSize:10,color:"var(--fm)"}}>{filledSteps.length}/{inputSteps.length} steps completed · {synthesis?"Synthesis generated":"No synthesis yet"} · {filledSteps.length > 0 ? "Feeding into agent context" : "Not yet active"}</div>
      </div>
    </div>
  );
}
