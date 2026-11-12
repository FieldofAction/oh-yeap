import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { AGENTS, CORE_CYCLE, AGENT_ROLES, AGENT_RINGS } from "../data/agents";
import { THEMES } from "../data/themes";
import { PILLARS } from "../data/playbook-data";
import { uid } from "../data/seed";
import { useSignalSession, sessionOutput } from "../lib/signal-session";
import SessionActions from "./SessionActions";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

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
  const go = (e) => { e.preventDefault(); if (!t.trim()) return; onAdd(t.trim(), d.trim(), tags); setT(""); setD(""); setTags([]) };
  return (
    <form className="tl-inline-form" onSubmit={go}>
      <div className="wb-signal">
        <label htmlFor="bs-idea-title" className="wb-label">Title</label>
        <input id="bs-idea-title" className="wb-field" value={t} onChange={e => setT(e.target.value)} autoComplete="off" />
      </div>
      <div className="wb-signal">
        <label htmlFor="bs-idea-intention" className="wb-label">Intention</label>
        <textarea id="bs-idea-intention" className="wb-field tl-area" rows={2} value={d} onChange={e => setD(e.target.value)} />
      </div>
      <div className="wb-signal">
        <label htmlFor="bs-idea-tag" className="wb-label">Tags</label>
        <div className="wb-signal-row">
          <input id="bs-idea-tag" className="wb-field" value={ti} onChange={e => setTi(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addT(); } }} autoComplete="off" />
          <button type="button" className="wb-link" onClick={addT}>Add the tag</button>
        </div>
        {tags.length > 0 ? <p className="wb-body">{tags.join(", ")}</p> : null}
      </div>
      <div className="wb-actions">
        <button type="submit" className="wb-button" disabled={!t.trim()}>Add the idea</button>
        <button type="button" className="wb-link" onClick={() => { setT(""); setD(""); setTags([]) }}>Clear</button>
      </div>
    </form>
  );
}

function PillarDiagnostic() {
  const [vals, setVals] = useState({ system: 70, scenography: 30, soul: 50, relational: 80 });
  const set = (k, v) => setVals(p => ({ ...p, [k]: parseInt(v) }));
  const dominant = PILLARS.reduce((a, b) => vals[a.key] >= vals[b.key] ? a : b, PILLARS[0]);
  const combination =
    (vals.system > 60 && vals.soul > 60 && "High System and Soul: infrastructure with atmosphere.") ||
    (vals.scenography > 60 && vals.relational > 60 && "High Scenography and Relational: choreographed spectacle.") ||
    (vals.system > 60 && vals.relational > 60 && vals.scenography < 40 && "System and Relational without Scenography: quiet coherence.") ||
    (vals.soul > 60 && vals.scenography > 60 && vals.system < 40 && "Soul and Scenography without System: expressive but fragile.") ||
    "";

  return (
    <div className="tl-section">
      <h2 className="bg-question-title">Where does a piece of work sit across the four pillars?</h2>
      <div className="tl-sliders">
        {PILLARS.map(p => (
          <div key={p.key} className="tl-slider">
            <label htmlFor={`bs-diag-${p.key}`} className="wb-name">{p.label}</label>
            <input id={`bs-diag-${p.key}`} type="range" className="tl-range" style={{ "--p": vals[p.key] }} min="0" max="100" value={vals[p.key]} onChange={e => set(p.key, e.target.value)} />
            <output htmlFor={`bs-diag-${p.key}`} className="wb-body">{vals[p.key]}</output>
          </div>
        ))}
      </div>
      <p className="wb-body wb-measure">{dominant.label} leads. {dominant.desc}{combination ? ` ${combination}` : ""}</p>
    </div>
  );
}

const MODELS = [
  { value:"claude-sonnet-4-6", label:"Sonnet 4.6" },
  { value:"claude-haiku-4-5-20251001", label:"Haiku 4.5" },
  { value:"claude-opus-4-7", label:"Opus 4.7" },
];

const SEQ_PROMPTS = {
  v4: `ASU: Canonical System Order (V4)
Treat the following as a live signal inside the full ASU system.
Run all agents in canonical order. The system loops: Field reopens perception, CLSSM regenerates ideas, Freedom Embassy stabilizes governance.

Band 1: Perception + Creation (situations become artifacts):
1. Field
   Read signals from the environment. Identify tensions, opportunities, constraints.
2. Works in Progress
   Investigate emerging ideas. Experiment with possible responses. Develop early models.
3. Action
   Produce artifacts, systems, or interventions that respond to Field conditions.

Band 2: Memory + Intelligence (work becomes knowledge):
4. Cache
   Store the artifact in retrievable form. Preserve beyond the moment of creation.
5. Atlas
   Map relationships between this artifact and existing work. Reveal patterns. Link lineages. Make the system self-aware.

Band 3: Cultural Release (timing engine):
6. Grace
   Determine when, how, and where this enters the world. Maintain integrity and resonance. May delay release.
7. Open
   Hold unresolved futures. Preserve optionality. Keep the system generative rather than closed.

Band 4: Deep System (long-term vitality):
8. Art Practice
   Maintain personal exploration and aesthetic development outside instrumental goals.
9. Hotel
   Materialize ideas in lived culture: objects, environments, experiential artifacts.
10. CLSSM
    Generate deep conceptual primitives that seed future cycles.
11. Freedom Embassy
    Establish system authority. Define structural rules. Maintain long-term continuity.

Rules:
• The system is a loop, not a pipeline. Each pass deepens the previous.
• Agents build on all previous layers.
• No redundancy across agents.
• Perception + Creation converts signal to artifact.
• Memory + Intelligence converts artifact to knowledge.
• Cultural Release governs timing and placement.
• Deep System maintains long-term vitality and governance.
Signal:`,
  v1: `ASU: Full Cycle 1.0
Treat the following as a live signal.
Run all agents across three rings in this exact order:
Ring 1: Operational Cycle:
1. Field. Sense and clarify the signal.
2. Works in Progress. Structure it into a model or framework.
3. Action. Translate it into an artifact.
4. Cache. Preserve it as a durable form.
5. Atlas. Map its relationships to existing work.
6. Grace. Determine how it enters the world.
7. Open. Hold what remains unresolved.
Ring 2: Practice Layer:
8. Art Practice. Explore its aesthetic and sensory dimension.
9. Hotel. Assess its material or experiential form.
Ring 3: Governance Layer:
10. CLSSM. Surface the deep structural pattern beneath it.
11. Freedom Embassy. Decide: activate, pause, or archive.
Rules:
• Each agent must build on the previous layer.
• Keep outputs concise and non-redundant.
• Do not skip stages.
• End with a governance decision.
Signal:`,
  v2: `ASU: Full Cycle 2.0
Treat the following as a live signal inside a dynamic field.
Phase 0: Field
• Clarify the signal.
• Identify environmental, personal, and systemic context.
• Surface hidden tensions or weak signals.
• Define the real question underneath the signal.
Then run agents across all rings:
Ring 1: Operational Cycle:
1. Works in Progress
   Structure the signal into a model, map, or index.
2. Action
   Translate it into an artifact or applied pattern.
3. Cache
   Preserve it: title + thesis + durable form.
4. Atlas
   Map relationships to existing work and lineages.
5. Grace
   Determine placement: audience, timing, channel.
   May delay release if conditions aren't met.
6. Open
   Hold what remains unresolved.
   Name open questions and speculative directions.
Ring 2: Practice Layer:
7. Art Practice
   Explore the aesthetic or visual resonance.
8. Hotel
   Embody as ritual, object, or experiential environment.
Ring 3: Governance Layer:
9. CLSSM
   Distill the governing principle or deep structural pattern.
10. Freedom Embassy
    Decide: move forward, pause, or archive.
    End with exactly one recommended next action.
Rules:
• Each layer must build on the previous one.
• No repetition across agents.
• Be concise but not shallow.
• Prefer structural clarity over poetic excess.
• Close with a governance decision.
Signal:`,
  v3: `ASU: Full Cycle 3.0
Treat the following as a live signal inside a dynamic field.
Phase -1: Necessity Check
Before creating anything:
• Is this signal worthy of generation?
• Is it noise, avoidance, repetition, or real movement?
• Does it require action, reflection, or release?
If the signal does not require generation, say so clearly and stop.
If it does, continue.
Phase 0: Field
• Clarify the signal.
• Identify context (personal, environmental, systemic).
• Surface hidden tension.
• Define the real underlying question.
Then run agents across all rings:
Ring 1: Operational Cycle:
1. Works in Progress
   Structure into model / index / map.
2. Action
   Translate into artifact or applied pattern.
3. Cache
   Preserve: title + thesis + durable form.
4. Atlas
   Map relationships and lineages.
5. Grace
   Determine placement. May delay release.
   Specify conditions if delaying.
6. Open
   Hold unresolved questions.
   Name speculative directions.
Ring 2: Practice Layer:
7. Art Practice
   Express emotional / visual / sensory dimension.
8. Hotel
   Embody as ritual, object, or behavioral practice.
Ring 3: Governance Layer:
9. CLSSM
   Distill governing law or deep structural pattern.
10. Freedom Embassy
    Decide: move forward, pause, archive, or re-run.
    End with exactly ONE: concrete action OR deliberate non-action.
Rules:
• Build layer by layer.
• No redundancy.
• Prefer clarity over volume.
• Stop if momentum becomes performative.
• Governance closes the cycle.
Signal:`,
};

export default function Backstage({ content, themeKey, onThemeChange, onPublish, asu, navigateTo }) {
  const ideas = asu.get_ideas();
  const am = asu.get_agent_mask();
  const settings = asu.get_settings();
  const asuRef = useRef(asu);
  asuRef.current = asu;
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
  const [pipeMode, setPipeMode] = useState("v4");
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [synthCopied, setSynthCopied] = useState(false);
  const [synthLogged, setSynthLogged] = useState(false);

  const PIPE_MODES = useMemo(() => ({
    v4: { label:"v4.0", desc:"Canonical system order: four functional bands",
      sequence: CORE_CYCLE,
      system:`ASU Canonical System Order (V4): Treat the input as a live signal inside the full ASU system. Agents operate in four functional bands: Perception + Creation, Memory + Intelligence, Cultural Release, Deep System. The system is a loop. Each pass deepens the previous.

RULES: Agents build on all previous layers. No redundancy. Perception + Creation converts signal to artifact. Memory + Intelligence converts artifact to knowledge. Cultural Release governs timing. Deep System maintains long-term vitality and governance.`,
      agentInstructions:{
        "field":"Band 1: PERCEPTION: Read signals from the environment. Identify tensions, opportunities, and constraints within the active context. Define the situation clearly.",
        "works-in-progress":"Band 1: EXPLORATION: Investigate emerging ideas. Experiment with possible responses. Develop early conceptual models. Build on Field's reading.",
        "action":"Band 1: CREATION: Produce the artifact, system, or intervention that responds to the conditions identified. Build on WIP's models.",
        "cache":"Band 2: PRESERVATION: Store this artifact in retrievable form. Title + thesis + durable form. Ensure it persists beyond the moment of creation.",
        "atlas":"Band 2: RELATIONAL MAPPING: Map relationships between this artifact and existing work. Link lineages. Reveal patterns. Make the system self-aware. This is where work becomes knowledge.",
        "grace":"Band 3: PLACEMENT: Determine when, how, and where this enters the world. Maintain integrity and resonance. May delay release. If so, specify conditions.",
        "open":"Band 3: EMERGENCE: Hold unresolved futures. Preserve optionality. Name what remains genuinely open. Keep the system generative rather than closed.",
        "art-practice":"Band 4: INTERNAL MAKING: Maintain personal exploration and aesthetic development outside instrumental goals. What does this signal mean for your own creative practice?",
        "hotel":"Band 4: MATERIAL LAYER: Materialize ideas in lived culture: objects, environments, experiential artifacts. If no material dimension exists, say so clearly.",
        "clssm":"Band 4: SOURCE: Generate the deep conceptual primitive beneath this entire cycle. What foundational idea seeds the next cycle of perception and creation?",
        "freedom-embassy":"Band 4: GOVERNANCE: Establish system authority for this signal. Define structural rules. Maintain long-term continuity. The loop returns to Field. What should Field perceive next?",
      }
    },
    v1: { label:"v1.0", desc:"Full 11-agent cycle with signal clarity check",
      sequence: CORE_CYCLE,
      system:`ASU Full Cycle 1.0: Treat the input as a live signal. Run all agents across three rings in strict order. Each agent builds on the previous layer.

RULES: Keep outputs concise and non-redundant. Do not skip stages. Build layer by layer. Governance closes the cycle.`,
      agentInstructions:{
        "field":"Ring 1, Phase 1: Assess signal clarity (clear / needs sharpening / compound signal), then sense and clarify the signal. Define what it actually is.",
        "works-in-progress":"Ring 1, Phase 2: Structure the clarified signal into a model, map, or framework. Build on Field's assessment.",
        "action":"Ring 1, Phase 3: Translate into a concrete artifact: system, interface, or applied design pattern. Build on the structure from Works in Progress.",
        "cache":"Ring 1, Phase 4: Preserve it. Title + thesis + durable form. This is the artifact's identity and archive entry. Build on Action's output.",
        "atlas":"Ring 1, Phase 5: Map relationships to existing work. What lineages connect? What patterns recur? What earlier work does this extend? Build on Cache's naming.",
        "grace":"Ring 1, Phase 6: Determine how this enters the world. Evaluate audience, timing, and channel. If conditions aren't met, recommend delay and specify what must change.",
        "open":"Ring 1, Phase 7: Hold what remains unresolved. Name the open questions, speculative directions, and what the system does not yet understand about this signal.",
        "art-practice":"Ring 2, Phase 8: Explore the aesthetic and sensory dimension. What does this look like, feel like, sound like? Build on all previous layers. Be evocative but precise.",
        "hotel":"Ring 2, Phase 9: Assess the material dimension. Does this have an experiential or embodied form? If yes, describe it. If no material dimension exists, say so clearly.",
        "clssm":"Ring 3, Phase 10: Surface the deep structural pattern beneath the entire sequence. Connect to foundational axioms. What governing law holds this together? Be brief, dense, and non-obvious.",
        "freedom-embassy":"Ring 3, Phase 11: Final governance decision: activate, pause, or archive. What does this trade off? What condition does it build toward? End with exactly one recommended action.",
      }
    },
    v2: { label:"v2.0", desc:"Full cycle with Phase 0 framing",
      sequence: CORE_CYCLE,
      system:`ASU Full Cycle 2.0: Treat the input as a live signal inside a dynamic field. Field runs as Phase 0 to frame the entire cycle. All three rings execute in sequence.

RULES: Each layer must build on the previous one. No repetition across agents. Be concise but not shallow. Prefer structural clarity over poetic excess. Governance closes the cycle.`,
      agentInstructions:{
        "field":"Phase 0: FRAMING LAYER: Clarify the signal. Identify environmental, personal, and systemic context. Surface hidden tensions or weak signals. Define the real question underneath the signal. Your output frames everything that follows.",
        "works-in-progress":"Ring 1, Phase 1: Structure the signal into a model, map, or index. Build on Field's framing.",
        "action":"Ring 1, Phase 2: Translate into an artifact or applied pattern. Build on the structure.",
        "cache":"Ring 1, Phase 3: Preserve it. Title + thesis + durable form. Build on Action's output.",
        "atlas":"Ring 1, Phase 4: Map relationships to existing work and lineages. What connects? What recurs? Build on all previous layers.",
        "grace":"Ring 1, Phase 5: PLACEMENT: Determine how this enters the world. Evaluate audience, narrative framing, cultural timing, distribution. May delay release. If so, specify conditions.",
        "open":"Ring 1, Phase 6: EMERGENCE: Hold what remains unresolved. Name open questions and speculative directions. Acknowledge what the system does not yet understand.",
        "art-practice":"Ring 2, Phase 7: Explore the aesthetic or visual resonance. What is the sensory dimension of this work? Build on all previous layers.",
        "hotel":"Ring 2, Phase 8: Embody as ritual, object, or experiential environment. If no material dimension exists, say so clearly.",
        "clssm":"Ring 3, Phase 9: Distill the governing principle or deep structural pattern beneath the entire cycle.",
        "freedom-embassy":"Ring 3, Phase 10: GOVERNANCE: What moves forward? What pauses? What archives? End with exactly one recommended next action.",
      }
    },
    v3: { label:"v3.0", desc:"Gated full cycle with necessity check",
      sequence: CORE_CYCLE,
      system:`ASU Full Cycle 3.0: Treat the input as a live signal inside a dynamic field. CRITICAL: Field must first run a Necessity Check before anything else. All three rings execute in sequence.

RULES: Build layer by layer. No redundancy. Prefer clarity over volume. Stop if momentum becomes performative. Governance closes the cycle.`,
      agentInstructions:{
        "field":"Phase -1 NECESSITY CHECK + Phase 0 FRAMING: FIRST: Is this signal worthy of generation? Is it noise, avoidance, repetition, or real movement? Does it require action, reflection, or release? If the signal does not require generation, say so clearly in your expansion and recommend stopping. If it does require generation: clarify the signal, identify context (personal, environmental, systemic), surface hidden tension, define the real underlying question.",
        "works-in-progress":"Ring 1, Phase 1: Structure into model / index / map. Build on the framing. If Field recommended stopping, acknowledge and provide only a minimal structural note.",
        "action":"Ring 1, Phase 2: Translate into artifact or applied pattern.",
        "cache":"Ring 1, Phase 3: Preserve. Title + thesis + durable form.",
        "atlas":"Ring 1, Phase 4: Map relationships and lineages across the archive.",
        "grace":"Ring 1, Phase 5: PLACEMENT: Determine how this enters the world. May delay release. Specify conditions for release if delaying.",
        "open":"Ring 1, Phase 6: EMERGENCE: Hold unresolved questions. Name speculative directions. Acknowledge what the system does not yet understand.",
        "art-practice":"Ring 2, Phase 7: Express emotional / visual / sensory dimension. Sustain creative vitality.",
        "hotel":"Ring 2, Phase 8: Embody as ritual, object, or behavioral practice. If no material dimension exists, say so clearly.",
        "clssm":"Ring 3, Phase 9: Distill governing law or deep structural pattern.",
        "freedom-embassy":"Ring 3, Phase 10: GOVERNANCE: Move forward, pause, archive, or re-run at deeper level. End with exactly ONE: concrete action OR deliberate non-action.",
      }
    },
    free: { label:"Free", desc:"Manual agent selection, all rings available",
      sequence:null, system:null, agentInstructions:null
    },
  }), []);

  const activePipe = PIPE_MODES[pipeMode];

  const addIdea = useCallback((t, d, tg) => {
    const n = asu.add_idea(t, d, tg); setAid(n.id);
  }, [asu]);

  // A signal carried in from the Workbench becomes the idea being run, and a
  // banked run goes back onto it.
  const session = useSignalSession(asu, "backstage", "Backstage");
  useEffect(() => {
    const text = session.carried?.text;
    if (!text) return;
    const existing = ideas.find(i => i.title === text);
    if (existing) setAid(existing.id); else addIdea(text, "", []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const callAgent = useCallback(async (agent, data, seqCtx) => {
    const liveAsu = asuRef.current;
    const pbCtx = liveAsu.build_agent_context();
    const currentSettings = liveAsu.get_settings();
    const seqSystem = seqCtx?.system ? `\n\n${seqCtx.system}` : "";
    const seqInstruction = seqCtx?.instruction ? `\n\nYOUR ROLE IN THIS SEQUENCE: ${seqCtx.instruction}` : "";
    const prevOutputs = seqCtx?.previousOutputs ? `\n\nPREVIOUS AGENT OUTPUTS (build on these, do not repeat):\n${seqCtx.previousOutputs}` : "";
    const msg = `Idea: "${data.title}"${data.desc?`\n\nDescription: ${data.desc}`:""}${data.tags?.length?`\n\nTags: ${data.tags.join(", ")}`:""}\n${pbCtx}${seqSystem}${seqInstruction}${prevOutputs}\n\nRespond in this exact JSON format only, no markdown fences, no preamble:\n{"expansion":"your 2-3 sentence expansion","steps":["step 1","step 2","step 3"],"tasks":[{"label":"task description","status":"todo"},{"label":"task description","status":"todo"}]}`;
    console.log("[Backstage] callAgent →", agent.name, "model:", currentSettings.model, "key:", currentSettings.apiKey ? `${currentSettings.apiKey.slice(0,10)}...` : "MISSING");
    if (!currentSettings.apiKey) {
      return {expansion:`${agent.name}: API key is missing. Add it in Settings below.`,steps:[],tasks:[]};
    }
    try {
      const reqBody = { model:currentSettings.model, max_tokens:1000, system:agent.prompt, messages:[{role:"user",content:msg}] };
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
      return {expansion:`${agent.name}: unavailable. ${err.message}`,steps:[`Define intent for ${agent.name}`,"Map constraints","Draft artifact"],tasks:[{label:"Review",status:"todo"}]};
    }
  }, []);

  const run = useCallback(async () => {
    if (running||!idea) return;
    setRunning(true); setProgress(0); setBsSynthesis(null); setSynthCopied(false); setSynthLogged(false);
    const liveAsu = asuRef.current;
    const rid = uid(); const outs = {};
    const currentAm = liveAsu.get_agent_mask();

    const isSequence = pipeMode !== "free" && activePipe.sequence;
    const sel = isSequence
      ? activePipe.sequence.map(k => AGENTS.find(a => a.key === k)).filter(Boolean)
      : AGENTS.filter(a => currentAm[a.key]);

    liveAsu.update_idea(idea.id, i => ({...i,runs:[...i.runs,{id:rid,status:"running",mode:pipeMode,selection:sel.map(a=>a.key),outputs:{}}]}));

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

      asuRef.current.update_idea(idea.id, it => ({...it,runs:it.runs.map(rn => rn.id!==rid?rn:{...rn,outputs:{...rn.outputs,[sel[i].key]:r}})}));
    }
    setProgress(100);
    asuRef.current.update_idea(idea.id, it => ({...it,runs:it.runs.map(rn => rn.id===rid?{...rn,status:"complete",outputs:outs}:rn)}));
    setRunning(false);
  }, [running, idea, callAgent, pipeMode, activePipe]);

  const pub = useCallback((ak, rn) => {
    const ag=AGENTS.find(a=>a.key===ak);
    if(!ag||!rn.outputs[ak]) return;
    const map={"action":"practice","cache":"writing","works-in-progress":"exploration","field":"writing","atlas":"exploration","grace":"writing","open":"exploration","art-practice":"exploration","hotel":"exploration","clssm":"exploration","freedom-embassy":"writing"};
    onPublish({section:map[ak]||"exploration",title:`${idea.title}: ${ag.name}`,subtitle:ag.name,year:new Date().getFullYear().toString(),status:"draft",desc:rn.outputs[ak].expansion,tags:idea.tags||[],relations:[]});
  }, [idea, onPublish]);

  const generateSynthesis = async () => {
                  if(bsSyncing) return;
                  setBsSyncing(true); setSynthCopied(false); setSynthLogged(false);
                  const agentOutputs = lastRun.selection.map(ak => {
                    const ag = AGENTS.find(a=>a.key===ak);
                    const out = lastRun.outputs[ak];
                    return ag && out ? `${ag.name}: ${out.expansion}` : null;
                  }).filter(Boolean).join("\n\n");
                  const aomCtx = asu.build_agent_context();
                  const prompt = `You are synthesizing the outputs of multiple creative agents who each expanded the same idea: "${idea.title}"${idea.desc ? `. ${idea.desc}` : ""}.

Agent outputs:
${agentOutputs}
${aomCtx ? `\nContext that shaped these outputs:${aomCtx}` : ""}

Write a synthesis that:
1. Identifies what the agents agree on: the convergent direction
2. Names where they diverge: the productive tensions
3. Recommends the strongest thread to pursue and why
4. Suggests one concrete next action

Be specific to the outputs. Write 4-5 sentences in prose. No bullet points.

Respond with ONLY the synthesis text, no preamble.`;
                  try {
                    const liveSettings = asuRef.current.get_settings();
                    const res = await fetch("https://api.anthropic.com/v1/messages", {
                      method:"POST",headers:{"Content-Type":"application/json","x-api-key":liveSettings.apiKey,"anthropic-version":liveSettings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true"},
                      body:JSON.stringify({model:liveSettings.model,max_tokens:600,messages:[{role:"user",content:prompt}]}),
                    });
                    if(!res.ok) throw new Error(`${res.status}`);
                    const d = await res.json();
                    setBsSynthesis(d.content?.map(b=>b.text||"").join("")||"Synthesis unavailable.");
                  } catch(err) {
                    setBsSynthesis(`Synthesis unavailable. ${err.message}`);
                  }
                  setBsSyncing(false);
                };
  const downloadMarkdown = () => {
    const b = new Blob([mkMd(idea, lastRun)], { type: "text/markdown" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `${idea.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  };
  const sessionTitle = idea?.title || "Backstage run";
  const bankSession = () => session.bank({
    title: session.carried?.text || sessionTitle,
    key: `backstage:${session.carried?.signalId || "own"}:${idea?.id}`,
    output: sessionOutput({
      title: sessionTitle,
      fields: [
        { label: "Idea", value: [idea?.title, idea?.desc].filter(Boolean).join(". ") },
        ...lastRun.selection.map((ak) => ({ label: AGENTS.find(a => a.key === ak)?.name || ak, value: lastRun.outputs[ak]?.expansion })),
      ],
      synthesis: bsSynthesis && !bsSynthesis.startsWith("Synthesis unavailable") ? bsSynthesis : "",
    }),
  });
  const aom = asu.get_art_of_model();
  const aomAnswered = Object.values(aom.responses[aom.activeVersion] || {}).filter(v => v?.trim()).length;
  const shapedBy = [
    (pbProject.name || pbEmotion) ? `Playbook${pbProject.name ? ` (${pbProject.name})` : ""}${pbEmotion ? `, ${pbEmotion}` : ""}, ${asu.get_dominant_pillar().label} leading` : null,
    aomAnswered > 0 ? `Art of Model${aom.synthesis[aom.activeVersion] ? ", with its synthesis" : ""}` : null,
  ].filter(Boolean);
  const STATUS_WORDS = { live: "Live", wip: "In progress", draft: "Draft", seed: "Seed", archived: "Archived" };

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Backstage</h1>
        <nav className="wb-actions" aria-label="Backstage">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
        </nav>
      </header>

      <div className="wb-tool-body">
        <div className="tl-section">
          <h2 className="bg-question-title">Ideas</h2>
          <div className="tl-chips">
            {ideas.map(i => (
              <button key={i.id} type="button" className="tl-chip" aria-pressed={i.id === aid} onClick={() => setAid(i.id)}>{i.title}</button>
            ))}
          </div>
          <Composer onAdd={addIdea} />
        </div>

        <div className="tl-section">
          <h2 className="wb-headline">{idea?.title}</h2>
          {shapedBy.length > 0 ? <p className="wb-body wb-measure">Shaped by {shapedBy.join(" and ")}.</p> : null}

          <div className="wb-block">
            <div className="wb-segments tl-segments tl-segments-wrap" role="group" aria-label="How the agents run">
              {Object.entries(PIPE_MODES).map(([k, v]) => (
                <button key={k} type="button" className="wb-segment" aria-pressed={pipeMode === k} onClick={() => setPipeMode(k)}>{v.label}</button>
              ))}
            </div>
            <p className="wb-body wb-measure">{activePipe.desc}</p>
          </div>

          {pipeMode === "free" ? (
            <div className="tl-roster">
              {AGENT_RINGS.map(r => {
                const members = AGENTS.filter(a => a.ring === r.ring);
                const allOn = members.every(a => am[a.key]);
                return (
                  <fieldset key={r.ring} className={`tl-ring${members.length > 4 ? " tl-ring-wide" : ""}`}>
                    <legend className="tl-ring-head">
                      <span className="wb-name">{r.name}</span>
                      <span className="wb-body">{r.line}</span>
                    </legend>
                    <div className="tl-ring-agents">
                      {members.map(a => (
                        <label key={a.key} className="tl-agent">
                          <input type="checkbox" checked={!!am[a.key]} onChange={() => asu.set_agent_mask({ ...am, [a.key]: !am[a.key] })} />
                          <span className="tl-agent-name">{a.name}</span>
                          <span className="tl-agent-role">{AGENT_ROLES[a.key]}</span>
                        </label>
                      ))}
                    </div>
                    <button type="button" className="wb-link tl-ring-all" onClick={() => asu.set_agent_mask({ ...am, ...Object.fromEntries(members.map(a => [a.key, !allOn])) })}>
                      {allOn ? `Leave out the ${r.name.toLowerCase()}` : `Use all of the ${r.name.toLowerCase()}`}
                    </button>
                  </fieldset>
                );
              })}
            </div>
          ) : (
            <div className="wb-block">
              <p className="wb-body wb-measure">The sequence sets the agents and the order they speak in.</p>
              <ol className="tl-roster tl-order">
                {(activePipe.sequence || []).map(k => AGENTS.find(a => a.key === k)).filter(Boolean).map(a => (
                  <li key={a.key} className="tl-agent">
                    <span className="tl-agent-name">{a.name}</span>
                    <span className="tl-agent-role">{AGENT_ROLES[a.key]}</span>
                  </li>
                ))}
              </ol>
              <div className="wb-actions">
                <button type="button" className="wb-link" aria-expanded={showPrompt} onClick={() => { setShowPrompt(p => !p); setPromptCopied(false) }}>{showPrompt ? "Hide the prompt" : "Show the prompt"}</button>
                <button type="button" className="wb-link" onClick={() => { navigator.clipboard?.writeText(SEQ_PROMPTS[pipeMode]); setPromptCopied(true); setTimeout(() => setPromptCopied(false), 2000) }}>{promptCopied ? "Copied" : "Copy the prompt"}</button>
              </div>
              {showPrompt && SEQ_PROMPTS[pipeMode] ? <pre className="tl-code">{SEQ_PROMPTS[pipeMode]}</pre> : null}
            </div>
          )}

          <div className="wb-actions">
            <button type="button" className="wb-button" onClick={run} disabled={running}>{running ? "Running" : lastRun ? "Run it again" : "Run"}</button>
            {!settings.apiKey ? <p className="wb-body">A key is needed before this can run. Add one under Settings.</p> : null}
          </div>
          {running ? <div className="tl-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Run progress"><div style={{ width: `${progress}%` }} /></div> : null}
        </div>

        {lastRun ? (
          <div className="tl-section">
            <h2 className="bg-question-title">What the agents made of it</h2>
            <div className="tl-list">
              {lastRun.selection.map((ak) => {
                const out = lastRun.outputs[ak]; const ag = AGENTS.find(a => a.key === ak);
                if (!ag) return null;
                const proc = !out && lastRun.status === "running";
                return (
                  <div key={ak} className="tl-row">
                    <h3 className="wb-name">{ag.name}</h3>
                    {proc ? <p className="wb-body" role="status">Waiting.</p> : null}
                    {out ? (
                      <>
                        <p className="wb-text wb-measure">{out.expansion}</p>
                        {out.steps?.length > 0 ? <ol className="tl-ol">{out.steps.map((st, i) => <li key={i}>{st}</li>)}</ol> : null}
                        {out.tasks?.length > 0 ? <ul className="tl-ul">{out.tasks.map((t, i) => <li key={i}>{t.label}{t.status === "done" ? " (done)" : ""}</li>)}</ul> : null}
                        <div className="wb-actions">
                          <button type="button" className="wb-link" onClick={() => pub(ak, lastRun)}>Publish as a draft</button>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {lastRun?.status === "complete" ? (
          <div className="tl-section">
            <h2 className="bg-question-title">Synthesis</h2>
            {bsSyncing ? <p className="wb-body" role="status">Reading what the agents made and finding the throughline.</p> : null}
            {bsSynthesis && !bsSyncing ? <p className="wb-text wb-measure">{bsSynthesis}</p> : null}
            <div className="wb-actions">
              <button type="button" className="wb-button" disabled={bsSyncing} onClick={generateSynthesis}>{bsSynthesis ? "Generate it again" : "Generate the synthesis"}</button>
              {bsSynthesis && !bsSyncing ? (
                <>
                  <button type="button" className="wb-link" onClick={() => { navigator.clipboard?.writeText(bsSynthesis); setSynthCopied(true); setTimeout(() => setSynthCopied(false), 2000); }}>{synthCopied ? "Copied" : "Copy it"}</button>
                  <button type="button" className="wb-link" onClick={() => {
                    asuRef.current.log_decision({decision:`Synthesis for "${idea.title}": ${bsSynthesis.slice(0,200)}`,pillar:asuRef.current.get_dominant_pillar().key,note:"Auto-logged from backstage synthesis"});
                    setSynthLogged(true);
                    setTimeout(() => setSynthLogged(false), 2000);
                  }}>{synthLogged ? "Logged" : "Log it as a decision"}</button>
                </>
              ) : null}
            </div>
            <SessionActions onBank={bankSession} onDownload={downloadMarkdown} bankedTo={session.bankedTo} navigateTo={navigateTo}>
              <button type="button" className="wb-link" onClick={() => navigator.clipboard?.writeText(mkMd(idea, lastRun))}>Copy the run as Markdown</button>
            </SessionActions>
          </div>
        ) : null}

        <PillarDiagnostic />

        <div className="tl-section">
          <h2 className="bg-question-title">Settings</h2>
          <div className="wb-signal">
            <label htmlFor="bs-key" className="wb-label">Anthropic API key</label>
            <input id="bs-key" className="wb-field" type="password" placeholder="sk-ant-" value={settings.apiKey} onChange={e => asu.set_settings({ apiKey: e.target.value })} autoComplete="off" />
          </div>
          <div className="wb-block">
            <p className="wb-label">Model</p>
            <div className="wb-segments tl-segments tl-segments-wrap" role="group" aria-label="Model">
              {MODELS.map(m => (
                <button key={m.value} type="button" className="wb-segment" aria-pressed={settings.model === m.value} onClick={() => asu.set_settings({ model: m.value })}>{m.label}</button>
              ))}
            </div>
          </div>
          <div className="wb-signal tl-narrow">
            <label htmlFor="bs-version" className="wb-label">API version</label>
            <input id="bs-version" className="wb-field" value={settings.anthropicVersion} onChange={e => asu.set_settings({ anthropicVersion: e.target.value })} autoComplete="off" />
          </div>
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">System condition</h2>
          <div className="tl-form">
            {[["condition","Condition"],["reading","Reading"],["building","Building"],["working","At"]].map(([k, l]) => (
              <div key={k} className="wb-signal">
                <label htmlFor={`bs-now-${k}`} className="wb-label">{l}</label>
                <input id={`bs-now-${k}`} className="wb-field" value={nowState[k]} onChange={e => asu.set_system_condition({ [k]: e.target.value })} autoComplete="off" />
              </div>
            ))}
          </div>
          <div className="wb-block">
            <p className="wb-label">Posture</p>
            <div className="wb-segments tl-segments tl-segments-wrap" role="group" aria-label="Posture">
              {Object.entries(THEMES).map(([k, t]) => (
                <button key={k} type="button" className="wb-segment" aria-pressed={themeKey === k} onClick={() => onThemeChange(k)}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">What is on the site</h2>
          <div className="tl-list tl-scroll">
            {content.map(c => (
              <div key={c.id} className="tl-pair">
                <span className="wb-name">{c.title}</span>
                <span className="wb-body">{STATUS_WORDS[c.status] || c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
