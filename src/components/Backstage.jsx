import React, { useState, useMemo, useCallback } from "react";
import { AGENTS } from "../data/agents";
import { THEMES } from "../data/themes";
import { PILLARS } from "../data/playbook-data";
import { uid } from "../data/seed";

function mkMd(idea, run) {
  const l = [`# ${idea.title}`, ""];
  if (idea.desc) l.push(idea.desc, "");
  for (const ak of run.selection) {
    const o = run.outputs[ak]; const ag = AGENTS.find(a => a.key === ak);
    if (!o || !ag) continue;
    l.push(`## ${ag.name}`, "", o.expansion || "", "");
    if (o.steps?.length) { l.push("**Plan**"); o.steps.forEach(s => l.push(`- ${s}`)); l.push("") }
    if (o.tasks?.length) { l.push("**Tasks**"); o.tasks.forEach(t => l.push(`- [${t.status === "done" ? "x" : " "}] ${t.label}`)); l.push("") }
  }
  return l.join("\n");
}

function Composer({ onAdd }) {
  const [t, setT] = useState(""); const [d, setD] = useState("");
  const [ti, setTi] = useState(""); const [tags, setTags] = useState([]);
  const addT = () => { const v = ti.trim(); if (v && !tags.includes(v)) setTags(p => [...p, v]); setTi("") };
  const go = () => { if (!t.trim()) return; onAdd(t.trim(), d.trim(), tags); setT(""); setD(""); setTags([]) };
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input className="bsi" placeholder="Title" value={t} onChange={e => setT(e.target.value)} />
      <textarea className="bsi bsta" placeholder="Intention…" value={d} onChange={e => setD(e.target.value)} />
      <div style={{ display: "flex", gap: 4 }}>
        <input className="bsi" placeholder="Tag ↵" value={ti} onChange={e => setTi(e.target.value)} onKeyDown={e => e.key === "Enter" && addT()} style={{ flex: 1 }} />
        <button className="btn gh" onClick={addT}>+</button>
      </div>
      {tags.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{tags.map(t => <span key={t} className="chip">{t}</span>)}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
        <button className="btn gh" onClick={() => { setT(""); setD(""); setTags([]) }}>Clear</button>
        <button className="btn" onClick={go}>Add</button>
      </div>
    </div>
  );
}

function PillarDiagnostic() {
  const [vals, setVals] = useState({ system: 70, scenography: 30, soul: 50, relational: 80 });
  const set = (k, v) => setVals(p => ({ ...p, [k]: parseInt(v) }));
  const dominant = PILLARS.reduce((a, b) => vals[a.key] >= vals[b.key] ? a : b, PILLARS[0]);

  return (
    <div className="bsc">
      <h4>Aesthetic Diagnostic</h4>
      <div style={{ fontSize: 10, color: "var(--fm)", marginBottom: 10, lineHeight: 1.5 }}>
        Evaluate current work against the four pillars. Adjust sliders to map where a piece sits.
      </div>
      <div className="diag">
        {PILLARS.map(p => (
          <div key={p.key} className="diag-pill">
            <div className="diag-pill-label">{p.label}</div>
            <div className="diag-pill-bar">
              <div className="diag-pill-fill" style={{ width: `${vals[p.key]}%`, background: p.color }} />
            </div>
            <input type="range" className="diag-range" min="0" max="100" value={vals[p.key]} onChange={e => set(p.key, e.target.value)} />
            <div className="diag-pill-val">{vals[p.key]}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: 8, background: "var(--bg)", fontSize: 10, lineHeight: 1.6 }}>
        <div style={{ color: "var(--ff)", marginBottom: 2 }}>
          <strong style={{ color: dominant.color }}>Primary: {dominant.label}</strong>
        </div>
        <div style={{ color: "var(--ff)", fontStyle: "italic" }}>{dominant.desc}</div>
        <div style={{ marginTop: 6, color: "var(--ff)", fontSize: 9 }}>
          {vals.system > 60 && vals.soul > 60 && "⚡ High System + Soul = infrastructure with atmosphere"}
          {vals.scenography > 60 && vals.relational > 60 && "⚡ High Scenography + Relational = choreographed spectacle"}
          {vals.system > 60 && vals.relational > 60 && vals.scenography < 40 && "⚡ System + Relational without Scenography = quiet coherence"}
          {vals.soul > 60 && vals.scenography > 60 && vals.system < 40 && "⚡ Soul + Scenography without System = expressive but fragile"}
        </div>
      </div>
    </div>
  );
}

const MODELS = [
  { value:"claude-sonnet-4-5-20250929", label:"Sonnet 4.5" },
  { value:"claude-haiku-4-5-20251001", label:"Haiku 4.5" },
  { value:"claude-opus-4-5-20251101", label:"Opus 4.5" },
];

const SEQ_PROMPTS = {
  v1: `ASU — Deterministic Sequence
Treat the following as a live signal.
Run agents in this exact order:
1. Field Intelligence — sense and clarify the signal.
2. Works in Progress — structure it into a model or framework.
3. Cache — name it (title + thesis).
4. Field of Action — translate it into a system or interface.
5. Hotel — embody it as ritual or object.
6. Art Practice — express its emotional or visual form.
7. CLSSM — distill the governing principle.
8. Freedom Embassy — decide one clear next move.
Rules:
• Each agent must build on the previous layer.
• Keep outputs concise and non-redundant.
• Do not skip stages.
• End with exactly one recommended action.
Signal:`,
  v2: `ASU — Deterministic Sequence 2.0
Treat the following as a live signal inside a dynamic field.
Phase 0 — Field Intelligence
• Clarify the signal.
• Identify environmental, personal, and systemic context.
• Surface hidden tensions or weak signals.
• Define the real question underneath the signal.
Then run agents in this exact order:
1. Works in Progress
   Structure the signal into a model, map, or index.
2. Cache
   Name it: title + thesis + 3 claims.
3. Field of Action
   Translate it into a system, interface, or behavioral pattern.
4. Hotel
   Embody it as a ritual, object, or practice.
5. Art Practice
   Express its emotional or visual resonance.
6. CLSSM
   Distill the governing principle or law.
7. Freedom Embassy
   Decide:
   • What moves forward?
   • What pauses?
   • What archives?
   End with exactly one recommended next action.
Rules:
• Each layer must build on the previous one.
• No repetition across agents.
• Be concise but not shallow.
• Prefer structural clarity over poetic excess.
• Close the loop with a clear move.
Signal:`,
  v3: `ASU — Deterministic Sequence 3.0
Treat the following as a live signal inside a dynamic field.
Phase -1 — Necessity Check
Before creating anything:
• Is this signal worthy of generation?
• Is it noise, avoidance, repetition, or real movement?
• Does it require action, reflection, or release?
If the signal does not require generation, say so clearly and stop.
If it does, continue.
Phase 0 — Field Intelligence
• Clarify the signal.
• Identify context (personal, environmental, systemic).
• Surface hidden tension.
• Define the real underlying question.
Then run agents in order:
1. Works in Progress
   Structure into model / index / map.
2. Cache
   Name it: title + thesis + 3 claims.
3. Field of Action
   Translate into system or interface pattern.
4. Hotel
   Embody as ritual, object, or behavioral practice.
5. Art Practice
   Express emotional / visual dimension.
6. CLSSM
   Distill governing law.
7. Freedom Embassy
   Decide:
   • Move forward
   • Pause
   • Archive
   • Re-run at deeper level
End with exactly ONE:
• concrete action OR
• deliberate non-action
Rules:
• Build layer by layer.
• No redundancy.
• Prefer clarity over volume.
• Stop if momentum becomes performative.
• If tension remains unresolved, optionally trigger one recursive cycle.
Signal:`,
};

export default function Backstage({ content, themeKey, onThemeChange, onPublish, asu }) {
  const ideas = asu.get_ideas();
  const am = asu.get_agent_mask();
  const settings = asu.get_settings();
  const [aid, setAid] = useState(ideas[0]?.id);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const idea = useMemo(() => ideas.find(i => i.id === aid) || ideas[0], [ideas, aid]);
  const lastRun = idea?.runs?.length ? idea.runs[idea.runs.length - 1] : null;
  const nowState = asu.get_system_condition();
  const pbProject = asu.get_project_brief();
  const pbEmotion = asu.get_emotional_system().emotion;
  const [bsSynthesis, setBsSynthesis] = useState(null);
  const [bsSyncing, setBsSyncing] = useState(false);
  const [pipeMode, setPipeMode] = useState("v1");
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const PIPE_MODES = useMemo(() => ({
    v1: { label:"v1.0", desc:"Linear pipeline with signal clarity check",
      sequence:["field-intelligence","works-in-progress","cache","field-of-action","hotel","art-practice","clssm","freedom-embassy"],
      system:`ASU Deterministic Sequence 1.0 — Treat the input as a live signal. Run agents in strict order. Each agent builds on the previous layer.

RULES: Keep outputs concise and non-redundant. Do not skip stages. Build layer by layer.`,
      agentInstructions:{
        "field-intelligence":"Phase 1: Assess signal clarity (clear / needs sharpening / compound signal), then sense and clarify the signal. Define what it actually is.",
        "works-in-progress":"Phase 2: Structure the clarified signal into a model, map, or framework. Build on Field Intelligence's assessment.",
        "cache":"Phase 3: Name it — title + thesis. This is the signal's identity. Build on the structure from Works in Progress.",
        "field-of-action":"Phase 4: Translate into a system, interface, or applied design pattern. Build on Cache's naming.",
        "hotel":"Phase 5: Embody as ritual, object, or material practice. Build on Field of Action's system. If no material dimension exists, say so clearly.",
        "art-practice":"Phase 6: Express the emotional or visual form. Build on all previous layers.",
        "clssm":"Phase 7: Distill the governing principle or law that holds the entire sequence together.",
        "freedom-embassy":"Phase 8: Decide — move forward, pause, or archive. End with exactly one recommended action.",
      }
    },
    v2: { label:"v2.0", desc:"Contextual pipeline with Phase 0 framing",
      sequence:["field-intelligence","works-in-progress","cache","field-of-action","hotel","art-practice","clssm","freedom-embassy"],
      system:`ASU Deterministic Sequence 2.0 — Treat the input as a live signal inside a dynamic field. Field Intelligence runs as Phase 0 to frame the entire pipeline.

RULES: Each layer must build on the previous one. No repetition across agents. Be concise but not shallow. Prefer structural clarity over poetic excess. Close the loop with a clear move.`,
      agentInstructions:{
        "field-intelligence":"Phase 0 — FRAMING LAYER: Clarify the signal. Identify environmental, personal, and systemic context. Surface hidden tensions or weak signals. Define the real question underneath the signal. Your output frames everything that follows.",
        "works-in-progress":"Phase 1: Structure the signal into a model, map, or index. Build on Field Intelligence's framing.",
        "cache":"Phase 2: Name it — title + thesis + 3 claims. Build on the structure.",
        "field-of-action":"Phase 3: Translate into a system, interface, or behavioral pattern. Build on Cache's naming.",
        "hotel":"Phase 4: Embody as a ritual, object, or practice. Build on the system.",
        "art-practice":"Phase 5: Express its emotional or visual resonance. Build on all previous layers.",
        "clssm":"Phase 6: Distill the governing principle or law.",
        "freedom-embassy":"Phase 7 — DECISION: What moves forward? What pauses? What archives? End with exactly one recommended next action.",
      }
    },
    v3: { label:"v3.0", desc:"Gated recursive pipeline with necessity check",
      sequence:["field-intelligence","works-in-progress","cache","field-of-action","hotel","art-practice","clssm","freedom-embassy"],
      system:`ASU Deterministic Sequence 3.0 — Treat the input as a live signal inside a dynamic field. CRITICAL: Field Intelligence must first run a Necessity Check before anything else.

RULES: Build layer by layer. No redundancy. Prefer clarity over volume. Stop if momentum becomes performative. If tension remains unresolved, the final agent may recommend a recursive cycle.`,
      agentInstructions:{
        "field-intelligence":"Phase -1 NECESSITY CHECK + Phase 0 FRAMING: FIRST — Is this signal worthy of generation? Is it noise, avoidance, repetition, or real movement? Does it require action, reflection, or release? If the signal does not require generation, say so clearly in your expansion and recommend stopping. If it does require generation: clarify the signal, identify context (personal, environmental, systemic), surface hidden tension, define the real underlying question.",
        "works-in-progress":"Phase 1: Structure into model / index / map. Build on the framing. If Field Intelligence recommended stopping, acknowledge and provide only a minimal structural note.",
        "cache":"Phase 2: Name it — title + thesis + 3 claims.",
        "field-of-action":"Phase 3: Translate into system or interface pattern.",
        "hotel":"Phase 4: Embody as ritual, object, or behavioral practice.",
        "art-practice":"Phase 5: Express emotional / visual dimension.",
        "clssm":"Phase 6: Distill governing law.",
        "freedom-embassy":"Phase 7 — DECISION: Move forward, pause, archive, OR re-run at deeper level. End with exactly ONE: concrete action OR deliberate non-action. If tension remains unresolved, you may recommend one recursive cycle through the pipeline.",
      }
    },
    free: { label:"Free", desc:"Manual agent selection, no sequence",
      sequence:null, system:null, agentInstructions:null
    },
  }), []);

  const activePipe = PIPE_MODES[pipeMode];

  const addIdea = useCallback((t, d, tg) => {
    const n = asu.add_idea(t, d, tg); setAid(n.id);
  }, [asu]);

  const callAgent = useCallback(async (agent, data, seqCtx) => {
    const pbCtx = asu.build_agent_context();
    const seqSystem = seqCtx?.system ? `\n\n${seqCtx.system}` : "";
    const seqInstruction = seqCtx?.instruction ? `\n\nYOUR ROLE IN THIS SEQUENCE: ${seqCtx.instruction}` : "";
    const prevOutputs = seqCtx?.previousOutputs ? `\n\nPREVIOUS AGENT OUTPUTS (build on these, do not repeat):\n${seqCtx.previousOutputs}` : "";
    const msg = `Idea: "${data.title}"${data.desc?`\n\nDescription: ${data.desc}`:""}${data.tags?.length?`\n\nTags: ${data.tags.join(", ")}`:""}\n${pbCtx}${seqSystem}${seqInstruction}${prevOutputs}\n\nRespond in this exact JSON format only, no markdown fences, no preamble:\n{"expansion":"your 2-3 sentence expansion","steps":["step 1","step 2","step 3"],"tasks":[{"label":"task description","status":"todo"},{"label":"task description","status":"todo"}]}`;
    const currentSettings = asu.get_settings();
    try {
      const reqBody = { model:currentSettings.model, max_tokens:1000, system:agent.prompt, messages:[{role:"user",content:msg}] };
      console.log("[Backstage] callAgent →", agent.name, "model:", currentSettings.model, "key:", currentSettings.apiKey ? `${currentSettings.apiKey.slice(0,10)}...` : "MISSING");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json","x-api-key":currentSettings.apiKey,"anthropic-version":currentSettings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify(reqBody),
      });
      if (!res.ok) { const errBody = await res.text(); console.error("[Backstage] API error:", res.status, errBody); throw new Error(`${res.status}: ${errBody.slice(0,200)}`); }
      const d = await res.json();
      const text = d.content?.map(b => b.text||"").join("")||"";
      console.log("[Backstage] response text:", text.slice(0,200));
      try { const p=JSON.parse(text.replace(/```json|```/g,"").trim()); return {expansion:p.expansion||text,steps:Array.isArray(p.steps)?p.steps:[],tasks:Array.isArray(p.tasks)?p.tasks:[]}; }
      catch { return {expansion:text.slice(0,500),steps:[],tasks:[]}; }
    } catch(err) {
      console.error("[Backstage] callAgent failed:", err);
      return {expansion:`${agent.name}: unavailable — ${err.message}`,steps:[`Define intent for ${agent.name}`,"Map constraints","Draft artifact"],tasks:[{label:"Review",status:"todo"}]};
    }
  }, [asu]);

  const run = useCallback(async () => {
    if (running||!idea) return;
    setRunning(true); setProgress(0); setBsSynthesis(null);
    const rid = uid(); const outs = {};

    const isSequence = pipeMode !== "free" && activePipe.sequence;
    const sel = isSequence
      ? activePipe.sequence.map(k => AGENTS.find(a => a.key === k)).filter(Boolean)
      : AGENTS.filter(a => am[a.key]);

    asu.update_idea(idea.id, i => ({...i,runs:[...i.runs,{id:rid,status:"running",mode:pipeMode,selection:sel.map(a=>a.key),outputs:{}}]}));

    let prevOutputs = "";
    for (let i=0;i<sel.length;i++) {
      setProgress(Math.round((i/sel.length)*100));

      const seqCtx = isSequence ? {
        system: activePipe.system,
        instruction: activePipe.agentInstructions?.[sel[i].key] || "",
        previousOutputs: prevOutputs || null,
      } : null;

      const r = await callAgent(sel[i], idea, seqCtx);
      outs[sel[i].key] = r;

      if (isSequence && r.expansion) {
        prevOutputs += `${sel[i].name}: ${r.expansion}\n`;
      }

      asu.update_idea(idea.id, it => ({...it,runs:it.runs.map(rn => rn.id!==rid?rn:{...rn,outputs:{...rn.outputs,[sel[i].key]:r}})}));
    }
    setProgress(100);
    asu.update_idea(idea.id, it => ({...it,runs:it.runs.map(rn => rn.id===rid?{...rn,status:"complete",outputs:outs}:rn)}));
    setRunning(false);
  }, [running, idea, am, callAgent, asu, pipeMode, activePipe]);

  const pub = useCallback((ak, rn) => {
    const ag=AGENTS.find(a=>a.key===ak);
    if(!ag||!rn.outputs[ak]) return;
    const map={"field-of-action":"practice","cache":"writing","works-in-progress":"exploration","field-intelligence":"writing"};
    onPublish({section:map[ak]||"exploration",title:`${idea.title} — ${ag.name}`,subtitle:ag.name,year:new Date().getFullYear().toString(),status:"draft",desc:rn.outputs[ak].expansion,tags:idea.tags||[],relations:[]});
  }, [idea, onPublish]);

  return (
    <div className="bs en">
      <div style={{marginBottom:40}}>
        <span className="bsl">System Condition</span>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
          <div style={{maxWidth:400,display:"grid",gap:6}}>
            {[["condition","Condition"],["reading","Reading"],["building","Building"],["working","At"]].map(([k,l])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:"var(--ff)",width:60,textTransform:"uppercase",letterSpacing:".08em"}}>{l}</span>
                <input className="bsi" value={nowState[k]} onChange={e=>asu.set_system_condition({[k]:e.target.value})} style={{flex:1,fontSize:11,padding:"4px 8px"}} />
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:"var(--ff)",marginBottom:6}}>Posture</div>
            <div className="thr">
              {Object.entries(THEMES).map(([k,t])=>(
                <div key={k} style={{textAlign:"center"}}>
                  <div className={`thsw ${themeKey===k?"on":""}`} style={{background:t.bg}} onClick={()=>onThemeChange(k)}/>
                  <div className="thl">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bsg">
        <div>
          <div className="bsc"><h4>New Idea</h4><Composer onAdd={addIdea}/></div>
          <div className="bsc">
            <h4>Ideas</h4>
            {ideas.map(i=><div key={i.id} className="bsid"><span className={`bsinm ${i.id===aid?"on":""}`} onClick={()=>setAid(i.id)}>{i.title}</span><span style={{fontSize:9,color:"var(--ff)"}}>{i.runs.length}</span></div>)}
          </div>
          <div className="bsc">
            <h4>Pipeline Mode</h4>
            <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
              {Object.entries(PIPE_MODES).map(([k,v]) => (
                <button key={k} className={`pb-emo-btn ${pipeMode===k?"on":""}`} onClick={()=>setPipeMode(k)} style={{fontSize:8,padding:"4px 10px"}}>
                  {v.label}
                </button>
              ))}
            </div>
            <div style={{fontSize:9,color:"var(--fm)",marginTop:6,fontStyle:"italic"}}>{activePipe.desc}</div>
            {pipeMode !== "free" && (
              <div style={{marginTop:8,fontSize:9,color:"var(--ff)"}}>
                Sequence: {activePipe.sequence?.map(k => AGENTS.find(a=>a.key===k)?.name).filter(Boolean).join(" → ")}
              </div>
            )}
            {pipeMode !== "free" && (
              <div style={{marginTop:8,display:"flex",gap:4}}>
                <button className="btn gh" style={{fontSize:8,padding:"3px 8px"}} onClick={()=>{setShowPrompt(p=>!p);setPromptCopied(false)}}>{showPrompt?"Hide":"View"} Prompt</button>
                <button className="btn gh" style={{fontSize:8,padding:"3px 8px"}} onClick={()=>{navigator.clipboard?.writeText(SEQ_PROMPTS[pipeMode]);setPromptCopied(true);setTimeout(()=>setPromptCopied(false),2000)}}>{promptCopied?"Copied":"Copy"}</button>
              </div>
            )}
            {showPrompt && pipeMode !== "free" && SEQ_PROMPTS[pipeMode] && (
              <pre style={{marginTop:8,padding:10,background:"var(--bg)",border:"1px solid var(--bd)",fontSize:10,lineHeight:1.6,color:"var(--fm)",whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:320,overflow:"auto",fontFamily:"var(--sans)"}}>{SEQ_PROMPTS[pipeMode]}</pre>
            )}
          </div>
          <div className="bsc">
            <h4>Agents {pipeMode !== "free" && <span style={{fontSize:9,fontWeight:300,color:"var(--ff)"}}>(sequence locked)</span>}</h4>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
              {pipeMode === "free"
                ? AGENTS.map(a=><span key={a.key} className={`chip ${am[a.key]?"on":""}`} onClick={()=>asu.set_agent_mask({...am,[a.key]:!am[a.key]})}>{a.name}</span>)
                : activePipe.sequence?.map(k => {const a = AGENTS.find(ag=>ag.key===k); return a ? <span key={k} className="chip on" style={{cursor:"default"}}>{a.name}</span> : null})
              }
            </div>
          </div>
          <div className="bsc">
            <h4>Content ({content.length})</h4>
            <div style={{maxHeight:200,overflow:"auto"}}>
              {content.map(c=><div key={c.id} className="bspub"><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{c.title}</span><span className={`dt ${c.status}`}/></div>)}
            </div>
          </div>
          <PillarDiagnostic />
          <div className="bsc">
            <h4>Settings</h4>
            <div style={{display:"grid",gap:8}}>
              <div>
                <div style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",color:"var(--ff)",marginBottom:4}}>Anthropic API Key</div>
                <input className="bsi" type="password" placeholder="sk-ant-..." value={settings.apiKey} onChange={e=>asu.set_settings({apiKey:e.target.value})} style={{fontSize:11,padding:"6px 8px"}} />
              </div>
              <div>
                <div style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",color:"var(--ff)",marginBottom:4}}>Model</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                  {MODELS.map(m=>(
                    <button key={m.value} className={`pb-emo-btn ${settings.model===m.value?"on":""}`} onClick={()=>asu.set_settings({model:m.value})} style={{fontSize:8,padding:"4px 10px"}}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",color:"var(--ff)",marginBottom:4}}>API Version</div>
                <input className="bsi" value={settings.anthropicVersion} onChange={e=>asu.set_settings({anthropicVersion:e.target.value})} style={{fontSize:11,padding:"6px 8px"}} />
              </div>
              {!settings.apiKey && <div style={{fontSize:9,color:"#c44",fontStyle:"italic"}}>API key required for agent pipeline and synthesis</div>}
            </div>
          </div>
        </div>
        <div>
          <div className="bsc">
            <h4>Pipeline — {idea?.title} <span style={{fontSize:9,fontWeight:300,color:"var(--ff)"}}>{pipeMode !== "free" ? `· Sequence ${activePipe.label}` : "· Free mode"}</span></h4>
            {(pbProject.name || pbEmotion) && (
              <div style={{fontSize:9,color:"var(--ff)",marginBottom:4,padding:"4px 8px",background:"var(--bg)",borderRadius:4,display:"inline-flex",gap:6,alignItems:"center"}}>
                <span style={{color:"var(--fm)"}}>Playbook:</span>
                {pbProject.name && <span>{pbProject.name}</span>}
                {pbEmotion && <span style={{color:PILLARS[0].color}}>· {pbEmotion}</span>}
                {(() => { const d = asu.get_dominant_pillar(); return <span style={{color:d.color}}>· {d.label}</span>; })()}
              </div>
            )}
            {(() => { const aom = asu.get_art_of_model(); const ar = aom.responses[aom.activeVersion]||{}; const filled = Object.values(ar).filter(v=>v?.trim()).length; return filled > 0 ? (
              <div style={{fontSize:9,color:"var(--ff)",marginBottom:6,padding:"4px 8px",background:"var(--bg)",borderRadius:4,display:"inline-flex",gap:6,alignItems:"center"}}>
                <span style={{color:"var(--fm)"}}>Art of Model ({aom.activeVersion}):</span>
                <span>{filled} steps</span>
                {aom.synthesis[aom.activeVersion] && <span>· synthesized</span>}
              </div>
            ) : null; })()}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:11,color:"var(--fm)"}}>{running?"Running…":lastRun?"Complete":"Idle"}</span>
              <button className="btn" onClick={run} disabled={running}>{running?"Running…":"Run"}</button>
            </div>
            <div className="pipe"><div className="pipe-f" style={{width:`${running?progress:lastRun?100:0}%`}}/></div>
          </div>
          <div className="bsc">
            <h4>Outputs {lastRun?.mode && lastRun.mode !== "free" && <span style={{fontSize:9,fontWeight:300,color:"var(--ff)"}}> · Sequence {PIPE_MODES[lastRun.mode]?.label || lastRun.mode}</span>}</h4>
            {!lastRun?<div style={{fontSize:11,color:"var(--ff)",fontStyle:"italic"}}>Run to see outputs.</div>:lastRun.selection.map((ak,idx)=>{
              const out=lastRun.outputs[ak];const ag=AGENTS.find(a=>a.key===ak);
              if(!ag) return null;
              const proc=!out&&lastRun.status==="running";
              const stepLabel = lastRun.mode && lastRun.mode !== "free" ? `${idx===0&&lastRun.mode==="v3"?"Phase -1/0":idx===0&&lastRun.mode==="v2"?"Phase 0":`Phase ${idx}`}` : null;
              return(
                <div key={ak} className="rout" style={{opacity:proc?.5:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <h5>{stepLabel && <span style={{fontSize:9,color:"var(--ff)",fontWeight:400,marginRight:6}}>{stepLabel}</span>}{ag.name}{proc&&<span style={{fontSize:10,color:"var(--ff)",fontWeight:300}}> — processing…</span>}</h5>
                    {out&&<button className="btn gh" style={{fontSize:9,padding:"3px 8px"}} onClick={()=>pub(ak,lastRun)}>Publish</button>}
                  </div>
                  {out?(
                    <>
                      <p className="rexp">{out.expansion}</p>
                      {out.steps?.length>0&&<div style={{marginTop:6}}><div style={{fontSize:9,fontWeight:500,letterSpacing:".1em",textTransform:"uppercase",color:"var(--ff)",marginBottom:3}}>Plan</div><ol className="rsteps">{out.steps.map((s,i)=><li key={i}>{s}</li>)}</ol></div>}
                      {out.tasks?.length>0&&<div style={{marginTop:6}}><div style={{fontSize:9,fontWeight:500,letterSpacing:".1em",textTransform:"uppercase",color:"var(--ff)",marginBottom:3}}>Tasks</div>{out.tasks.map((t,i)=><div key={i} style={{fontSize:11,color:"var(--fm)",padding:"1px 0",display:"flex",gap:6}}><span style={{fontSize:9}}>{t.status==="done"?"✓":"○"}</span><span>{t.label}</span></div>)}</div>}
                    </>
                  ):proc?<div style={{fontSize:11,color:"var(--ff)",fontStyle:"italic",padding:"6px 0"}}>Waiting…</div>:null}
                </div>
              );
            })}
          </div>
          {lastRun?.status==="complete"&&(
            <div className="bsc">
              <h4>Export</h4>
              <div style={{display:"flex",gap:6}}>
                <button className="btn gh" onClick={()=>navigator.clipboard?.writeText(mkMd(idea,lastRun))}>Copy Markdown</button>
                <button className="btn gh" onClick={()=>{const b=new Blob([mkMd(idea,lastRun)],{type:"text/markdown"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${idea.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.md`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}}>Download .md</button>
              </div>
            </div>
          )}
          {lastRun?.status==="complete"&&(
            <div className="bsc">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h4>Synthesis</h4>
                <button className="btn" disabled={bsSyncing} style={{fontSize:10}} onClick={async ()=>{
                  if(bsSyncing) return;
                  setBsSyncing(true);
                  const agentOutputs = lastRun.selection.map(ak => {
                    const ag = AGENTS.find(a=>a.key===ak);
                    const out = lastRun.outputs[ak];
                    return ag && out ? `${ag.name}: ${out.expansion}` : null;
                  }).filter(Boolean).join("\n\n");
                  const aomCtx = asu.build_agent_context();
                  const prompt = `You are synthesizing the outputs of multiple creative agents who each expanded the same idea: "${idea.title}"${idea.desc ? ` — ${idea.desc}` : ""}.

Agent outputs:
${agentOutputs}
${aomCtx ? `\nContext that shaped these outputs:${aomCtx}` : ""}

Write a synthesis that:
1. Identifies what the agents agree on — the convergent direction
2. Names where they diverge — the productive tensions
3. Recommends the strongest thread to pursue and why
4. Suggests one concrete next action

Be specific to the outputs. Write 4-5 sentences in prose. No bullet points.

Respond with ONLY the synthesis text, no preamble.`;
                  try {
                    const res = await fetch("https://api.anthropic.com/v1/messages", {
                      method:"POST",headers:{"Content-Type":"application/json","x-api-key":settings.apiKey,"anthropic-version":settings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true"},
                      body:JSON.stringify({model:settings.model,max_tokens:600,messages:[{role:"user",content:prompt}]}),
                    });
                    if(!res.ok) throw new Error(`${res.status}`);
                    const d = await res.json();
                    setBsSynthesis(d.content?.map(b=>b.text||"").join("")||"Synthesis unavailable.");
                  } catch(err) {
                    setBsSynthesis(`Synthesis unavailable — ${err.message}`);
                  }
                  setBsSyncing(false);
                }}>{bsSyncing?"Generating…":bsSynthesis?"Regenerate":"Generate Synthesis"}</button>
              </div>
              {bsSyncing && <div style={{fontSize:12,color:"var(--fm)",fontStyle:"italic",marginTop:8}}>Reading agent outputs and finding the throughline…</div>}
              {bsSynthesis && !bsSyncing && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:13,fontWeight:300,color:"var(--fg)",lineHeight:1.7,fontFamily:"var(--display)",letterSpacing:"-0.01em"}}>{bsSynthesis}</div>
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button className="btn gh" style={{fontSize:9}} onClick={()=>navigator.clipboard?.writeText(bsSynthesis)}>Copy</button>
                    <button className="btn gh" style={{fontSize:9}} onClick={()=>{
                      asu.log_decision({decision:`Synthesis for "${idea.title}": ${bsSynthesis.slice(0,200)}`,pillar:asu.get_dominant_pillar().key,note:"Auto-logged from backstage synthesis"});
                    }}>Log as Decision</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
