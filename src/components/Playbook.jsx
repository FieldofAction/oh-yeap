import React, { useState, useMemo } from "react";
import { PILLARS, EMOTIONS, REFS, STEPS, EMO_MAP } from "../data/playbook-data";

export default function Playbook({ asu }) {
  const project = asu.get_project_brief();
  const pillars = asu.get_pillar_targets();
  const emotion = asu.get_emotional_system().emotion;
  const app = asu.store.playbook.application;
  const dominant = asu.get_dominant_pillar();
  const [steps, setSteps] = useState(() => STEPS.map(()=>false));
  const [showExport, setShowExport] = useState(false);

  const exportText = useMemo(() => {
    const lines = [
      `PROJECT BRIEF — ${project.name || "Untitled"}`,
      `Client: ${project.client || "—"}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `THE ASU METHOD`,
      `Framework: System, Scenography, Soul, Relational Intelligence`,
      `"Blending systematic clarity, scenographic spectacle, soulful atmosphere,`,
      `and relational intelligence to build worlds that are both disciplined and alive."`,
      ``,
      `BRIEF`,
      project.brief || "—",
      ``,
      `PILLAR TARGETS`,
      ...PILLARS.map(p => `  ${p.label}: ${pillars[p.key]}/100`),
      `  Dominant: ${dominant.label} — ${dominant.desc}`,
      ``,
      `EMOTIONAL SYSTEM: ${emotion || "—"}`,
      ``,
      `APPLICATION`,
      `  Big Move: ${app.bigMove || "—"}`,
      `  Whimsy: ${app.whimsy || "—"}`,
      `  Connection: ${app.connection || "—"}`,
      ``,
      `CHECKLIST`,
      ...STEPS.map((s,i)=>`  [${steps[i]?"✓":" "}] ${s.title}: ${s.desc}`),
      ``,
      `REFERENCE MATRIX`,
      ...REFS.map(r => `  ${r.name} — ${r.principle}`),
      ``,
      `— Action Systems Universal`,
    ];
    return lines.join("\n");
  }, [project, pillars, emotion, app, steps, dominant]);

  return (
    <div className="pb en">
      <div className="pb-h">Playbook</div>
      <div className="pb-sub">The ASU Method — a living framework for designing worlds through systematic clarity, scenographic spectacle, soulful atmosphere, and relational intelligence.</div>

      {/* The ASU Method */}
      <div className="pb-method">
        <div className="pb-method-h">The ASU Method</div>
        <div className="pb-method-d">A framework for designing worlds through System, Scenography, Soul, and Relational Intelligence. Each part acts like a pavilion in a world expo — distinct but unified by shared vision.</div>
        <div className="pb-mpillars">
          <div className="pb-mpill"><div className="pb-mpill-bar" style={{background:"#6b8fa3"}} /><div className="pb-mpill-n">System</div><div className="pb-mpill-d">Clarity of structure, proportion, and function.</div></div>
          <div className="pb-mpill"><div className="pb-mpill-bar" style={{background:"#a3896b"}} /><div className="pb-mpill-n">Scenography</div><div className="pb-mpill-d">Immersive staging and monumental spectacle.</div></div>
          <div className="pb-mpill"><div className="pb-mpill-bar" style={{background:"#8c6ba3"}} /><div className="pb-mpill-n">Soul</div><div className="pb-mpill-d">Emotional registers that create atmosphere and resonance.</div></div>
          <div className="pb-mpill"><div className="pb-mpill-bar" style={{background:"#6ba37a"}} /><div className="pb-mpill-n">Relational</div><div className="pb-mpill-d">Choreography of connection — how people, agents, and environments interact.</div></div>
        </div>
        <div className="pb-method-sentence">"The ASU Method is my approach to design — blending systematic clarity, scenographic spectacle, soulful atmosphere, and relational intelligence to build worlds that are both disciplined and alive."</div>
      </div>

      {/* Agents as Action Systems */}
      <div className="pb-section">
        <div className="pb-sl">Agents as Action Systems</div>
        <div className="pb-card">
          <div style={{fontSize:11,color:"var(--fm)",lineHeight:1.6,marginBottom:16}}>Each agent is a pavilion inside the larger ecosystem. They don't just hold an identity — they act on inputs and expand them. Inputs are never static — they are constantly acted upon, reframed, and elevated.</div>
          <div className="pb-agents-h">Agent → Input → Action</div>
          {[
            {name:"Action",input:"Raw ideas, briefs",action:"Transforms into bold, dramatic design expressions"},
            {name:"Cache",input:"Documentation, narrative",action:"Reframes as publishing, memory, or cultural artifact"},
            {name:"Hotel",input:"Lifestyle cues, objects",action:"Expands into spaces of sensuality and play"},
            {name:"A.R.T.",input:"Concepts, provocations",action:"Challenges and reframes through artistic intervention"},
            {name:"CLSSM",input:"Chaos, complexity",action:"Provides structure, cadence, and classical proportion"},
            {name:"Freedom Embassy",input:"Proposals, outputs",action:"Arbitrates, governs, ensures alignment with values"},
            {name:"ASU Master",input:"All agent outputs",action:"Synthesizes into unified expression and direction"},
          ].map((a,i) => (
            <div key={i} className="pb-agent-row">
              <div className="pb-agent-name">{a.name}</div>
              <div className="pb-agent-io">{a.input}</div>
              <div className="pb-agent-arrow">→</div>
              <div className="pb-agent-io">{a.action}</div>
            </div>
          ))}
          <div className="pb-loops">
            <div className="pb-agents-h" style={{marginTop:0}}>Relational Expansion</div>
            <div className="pb-loop"><span>Action</span> sparks → <span>Cache</span> records</div>
            <div className="pb-loop"><span>CLSSM</span> provides structure → <span>Freedom Embassy</span> arbitrates</div>
            <div className="pb-loop"><span>A.R.T.</span> provokes → <span>Hotel</span> makes it livable and tactile</div>
            <div className="pb-loop"><span>ASU Master</span> synthesizes → the loop begins again</div>
          </div>
        </div>
      </div>

      {/* Project Brief */}
      <div className="pb-section">
        <div className="pb-sl">Project Brief</div>
        <div className="pb-card">
          <div className="pb-row" style={{marginBottom:6}}>
            <input className="pb-input" placeholder="Project name" value={project.name} onChange={e=>asu.set_project_brief({name:e.target.value})} />
            <input className="pb-input" placeholder="Client" value={project.client} onChange={e=>asu.set_project_brief({client:e.target.value})} />
          </div>
          <textarea className="pb-input pb-ta" placeholder="Brief — what's the ask, what are the constraints, what does success look like?" value={project.brief} onChange={e=>asu.set_project_brief({brief:e.target.value})} />
        </div>
      </div>

      {/* Four-Pillar Targets */}
      <div className="pb-section">
        <div className="pb-sl">Pillar Targets</div>
        <div className="pb-card">
          <div style={{fontSize:10,color:"var(--fm)",marginBottom:12,lineHeight:1.5}}>Set where this project should sit across the four pillars.</div>
          <div className="diag">
            {PILLARS.map(p => (
              <div key={p.key} className="diag-pill">
                <div className="diag-pill-label">{p.label}</div>
                <div className="diag-pill-bar"><div className="diag-pill-fill" style={{width:`${pillars[p.key]}%`,background:p.color}} /></div>
                <input type="range" className="diag-range" min="0" max="100" value={pillars[p.key]} onChange={e=>asu.set_pillar_targets({[p.key]:parseInt(e.target.value)})} />
                <div className="diag-pill-val">{pillars[p.key]}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:10,color:"var(--ff)"}}>
            Dominant: <strong style={{color:dominant.color}}>{dominant.label}</strong> — {dominant.desc}
          </div>
        </div>
      </div>

      {/* Emotional System */}
      <div className="pb-section">
        <div className="pb-sl">Emotional System</div>
        <div className="pb-card">
          <div style={{fontSize:10,color:"var(--fm)",marginBottom:10}}>What emotional register should this project carry?</div>
          <div className="pb-emo">
            {EMOTIONS.map(e => (
              <button key={e} className={`pb-emo-btn ${emotion===e?"on":""}`} onClick={()=>asu.set_emotional_system(emotion===e?"":e)}>{e}</button>
            ))}
          </div>
          {emotion && <div style={{marginTop:10,fontSize:11,color:"var(--fm)",fontWeight:300}}>
            {EMO_MAP[emotion]}
          </div>}
        </div>
      </div>

      {/* Seven-Step Application Guide */}
      <div className="pb-section">
        <div className="pb-sl">Application Guide</div>
        <div className="pb-card">
          {STEPS.map((s,i) => (
            <div key={i} className="pb-step">
              <div className={`pb-step-check ${steps[i]?"done":""}`} onClick={()=>setSteps(p=>{const n=[...p];n[i]=!n[i];return n})}>{steps[i]?"✓":""}</div>
              <div className="pb-step-n">{i+1}</div>
              <div className="pb-step-content">
                <div className="pb-step-title">{s.title}</div>
                <div className="pb-step-desc">{s.desc}</div>
                {i===3 && <input className="pb-input" placeholder="What's the big move?" value={app.bigMove} onChange={e=>asu.set_application({bigMove:e.target.value})} style={{marginTop:6}} />}
                {i===4 && <input className="pb-input" placeholder="What's the whimsy detail?" value={app.whimsy} onChange={e=>asu.set_application({whimsy:e.target.value})} style={{marginTop:6}} />}
                {i===5 && <input className="pb-input" placeholder="How does this foster connection?" value={app.connection} onChange={e=>asu.set_application({connection:e.target.value})} style={{marginTop:6}} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reference Matrix */}
      <div className="pb-section">
        <div className="pb-sl">Reference Matrix</div>
        <div className="pb-ref">
          {REFS.map((r,i) => (
            <div key={i} className="pb-ref-item">
              <div className="pb-ref-name">{r.name}</div>
              <div className="pb-ref-principle">{r.principle}</div>
              <div className="pb-ref-tactic">{r.tactic}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="pb-section">
        <div className="pb-sl">Export</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          <button className="btn" onClick={()=>setShowExport(p=>!p)}>{showExport?"Hide":"Preview"} Summary</button>
          <button className="btn gh" onClick={()=>navigator.clipboard?.writeText(exportText)}>Copy to Clipboard</button>
          <button className="btn gh" onClick={()=>{const b=new Blob([exportText],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${(project.name||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-brief.txt`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}}>Download .txt</button>
        </div>
        {showExport && <div className="pb-export">{exportText}</div>}
      </div>
    </div>
  );
}
