import { useState, useMemo, useEffect } from "react";
import { AGENTS } from "../data/agents";
import { PILLARS, EMO_MAP, REFS } from "../data/playbook-data";
import { AOM_VERSIONS } from "../data/aom-versions";
import { uid } from "../data/seed";

// ─── ASU Store (MCP-ready data layer) ────────────────────────────
// Each method maps 1:1 to a future MCP tool endpoint.
// Store shape mirrors the MCP server spec: tools read/write from this.
const STORAGE_KEY = "asu-store";

const DEFAULT_STORE = {
  // Settings
  settings: {
    apiKey: "",
    model: "claude-sonnet-4-6",
    anthropicVersion: "2023-06-01",
  },
  // Playbook
  playbook: {
    project: { name:"", client:"", brief:"", status:"active", createdAt:new Date().toLocaleDateString() },
    pillars: { system:50, scenography:50, soul:50, relational:50 },
    emotion: "",
    application: { bigMove:"", whimsy:"", connection:"" },
    agents: [],
    decisions: [],  // {date, phase, decision, pillar, note}
  },
  // Backstage
  backstage: {
    ideas: [{ id:uid(), title:"System-Aware Brand Toolkit", desc:"Turn the essay into an actionable toolkit.", tags:["brand","systems"], runs:[] }],
    activeIdeaId: null,
    agentMask: Object.fromEntries(AGENTS.map(a => [a.key, true])),
  },
  // System
  system: {
    condition: "Threshold",
    reading: "Steps to an Ecology of Mind, Bateson",
    building: "Governed Surface v5",
    working: "TV",
  },
  // Art of Model
  artOfModel: {
    activeVersion: "v3",
    responses: { v1:{}, v2:{}, v3:{} },
    synthesis: { v1:null, v2:null, v3:null },
  },
  // Atrium — the Studio's connective tissue. Every field is optional context
  // for modules; modules must boot fine when these are empty.
  atrium: {
    activeSignal: "",        // one line: what the user is tracking right now
    flowLane: [],            // [{id, source, label, ts, payload}] recent module outputs
    openLoops: [],           // [{id, label, source, ts}] unfinished work across modules
    sequence: [],            // [moduleKey, ...] operator-defined run order
    currentRun: null,        // { id, signal, startedAt, completedAt, steps:[{moduleKey, status, output, error, startedAt, completedAt}] } | null
  },
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const saved = JSON.parse(raw);
    // Deep merge saved over defaults so new keys are always present
    return {
      settings: { ...DEFAULT_STORE.settings, ...saved.settings },
      playbook: { ...DEFAULT_STORE.playbook, ...saved.playbook, project: { ...DEFAULT_STORE.playbook.project, ...(saved.playbook?.project||{}) }, pillars: { ...DEFAULT_STORE.playbook.pillars, ...(saved.playbook?.pillars||{}) }, application: { ...DEFAULT_STORE.playbook.application, ...(saved.playbook?.application||{}) } },
      backstage: { ...DEFAULT_STORE.backstage, ...saved.backstage, ideas: saved.backstage?.ideas?.length ? saved.backstage.ideas : DEFAULT_STORE.backstage.ideas, agentMask: { ...DEFAULT_STORE.backstage.agentMask, ...(saved.backstage?.agentMask||{}) } },
      system: { ...DEFAULT_STORE.system, ...saved.system },
      artOfModel: { ...DEFAULT_STORE.artOfModel, ...saved.artOfModel, responses: { ...DEFAULT_STORE.artOfModel.responses, ...(saved.artOfModel?.responses||{}) }, synthesis: { ...DEFAULT_STORE.artOfModel.synthesis, ...(saved.artOfModel?.synthesis||{}) } },
      atrium: { ...DEFAULT_STORE.atrium, ...(saved.atrium||{}), flowLane: Array.isArray(saved.atrium?.flowLane) ? saved.atrium.flowLane : [], openLoops: Array.isArray(saved.atrium?.openLoops) ? saved.atrium.openLoops : [], sequence: Array.isArray(saved.atrium?.sequence) ? saved.atrium.sequence : [], currentRun: null },
    };
  } catch { return DEFAULT_STORE; }
}

// Hook: provides store + MCP-shaped accessors
function useASUStore() {
  const [store, setStore] = useState(loadStore);

  // Persist to localStorage on every change
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {} }, [store]);

  const api = useMemo(() => ({
    // ── Playbook Tools (read) ──
    get_project_brief: () => store.playbook.project,
    get_pillar_targets: () => store.playbook.pillars,
    get_emotional_system: () => ({ emotion: store.playbook.emotion, description: store.playbook.emotion ? EMO_MAP[store.playbook.emotion] || "" : "" }),
    get_application: () => store.playbook.application,
    get_agent_roster: () => ({ activated: store.playbook.agents, all: AGENTS.map(a => ({ key:a.key, name:a.name })) }),
    get_reference_matrix: () => REFS,
    get_decisions: () => store.playbook.decisions,
    get_dominant_pillar: () => {
      const p = store.playbook.pillars;
      return PILLARS.reduce((a,b) => p[a.key]>=p[b.key]?a:b, PILLARS[0]);
    },

    // ── Playbook Tools (write) ──
    set_project_brief: (updates) => setStore(s => ({...s, playbook:{...s.playbook, project:{...s.playbook.project, ...updates}}})),
    set_pillar_targets: (updates) => setStore(s => ({...s, playbook:{...s.playbook, pillars:{...s.playbook.pillars, ...updates}}})),
    set_emotional_system: (emotion) => setStore(s => ({...s, playbook:{...s.playbook, emotion}})),
    set_application: (updates) => setStore(s => ({...s, playbook:{...s.playbook, application:{...s.playbook.application, ...updates}}})),
    set_agent_roster: (agents) => setStore(s => ({...s, playbook:{...s.playbook, agents}})),
    log_decision: (decision) => setStore(s => ({...s, playbook:{...s.playbook, decisions:[...s.playbook.decisions, {...decision, date:new Date().toLocaleDateString()}]}})),

    // ── Backstage Tools (read) ──
    get_ideas: () => store.backstage.ideas,
    get_active_idea: () => store.backstage.ideas.find(i => i.id === store.backstage.activeIdeaId) || store.backstage.ideas[0],
    get_outputs: (ideaId) => { const idea = store.backstage.ideas.find(i => i.id === ideaId); return idea?.runs?.[idea.runs.length-1] || null; },
    get_agent_mask: () => store.backstage.agentMask,

    // ── Backstage Tools (write) ──
    add_idea: (title, desc, tags) => { const n = {id:uid(),title,desc,tags:tags||[],runs:[]}; setStore(s => ({...s, backstage:{...s.backstage, ideas:[n,...s.backstage.ideas], activeIdeaId:n.id}})); return n; },
    set_active_idea: (id) => setStore(s => ({...s, backstage:{...s.backstage, activeIdeaId:id}})),
    set_agent_mask: (mask) => setStore(s => ({...s, backstage:{...s.backstage, agentMask:mask}})),
    update_idea: (id, fn) => setStore(s => ({...s, backstage:{...s.backstage, ideas:s.backstage.ideas.map(i => i.id===id ? fn(i) : i)}})),

    // ── System Tools ──
    get_system_condition: () => store.system,
    set_system_condition: (updates) => setStore(s => ({...s, system:{...s.system, ...updates}})),

    // ── Art of Model Tools ──
    get_art_of_model: () => store.artOfModel,
    set_aom_response: (ver, stepN, val) => setStore(s => ({...s, artOfModel:{...s.artOfModel, responses:{...s.artOfModel.responses, [ver]:{...s.artOfModel.responses[ver], [stepN]:val}}}})),
    set_aom_synthesis: (ver, text) => setStore(s => ({...s, artOfModel:{...s.artOfModel, synthesis:{...s.artOfModel.synthesis, [ver]:text}}})),
    set_aom_version: (ver) => setStore(s => ({...s, artOfModel:{...s.artOfModel, activeVersion:ver}})),

    // ── Context Builder (assembles playbook + art of model context for agent prompts) ──
    build_agent_context: () => {
      const pb = store.playbook;
      const aom = store.artOfModel;
      const hasPb = pb.project.name || pb.emotion || pb.project.brief;
      const activeAom = aom.responses[aom.activeVersion] || {};
      const hasAom = Object.values(activeAom).some(v => v && v.trim());
      if (!hasPb && !hasAom) return "";
      const dominant = PILLARS.reduce((a,b) => pb.pillars[a.key]>=pb.pillars[b.key]?a:b, PILLARS[0]);
      let ctx = "";
      if (hasPb) {
        ctx += `\n\nACTIVE PROJECT CONTEXT: shape your response to fit this:\n${pb.project.name?`Project: ${pb.project.name}`:""} ${pb.project.client?`| Client: ${pb.project.client}`:""}\n${pb.project.brief?`Brief: ${pb.project.brief}\n`:""}Dominant Pillar: ${dominant.label} (${dominant.desc})\nPillar Targets: System: ${pb.pillars.system}/100, Scenography: ${pb.pillars.scenography}/100, Soul: ${pb.pillars.soul}/100, Relational: ${pb.pillars.relational}/100${pb.emotion?`\nEmotional Register: ${pb.emotion}. Lean into this tone and atmosphere`:""}${pb.application.bigMove?`\nBig Move: ${pb.application.bigMove}`:""}\n\nIMPORTANT: Let the pillar targets shape your output. ${pb.pillars.scenography>65?"Emphasize immersive, monumental, cinematic qualities. ":""}${pb.pillars.soul>65?"Emphasize atmospheric, emotional, resonant qualities. ":""}${pb.pillars.system>65?"Emphasize structural clarity, proportion, and systematic logic. ":""}${pb.pillars.relational>65?"Emphasize connection, choreography, and how things relate. ":""}${pb.emotion?`Set the tone to ${pb.emotion}.`:""}`;
      }
      if (hasAom) {
        const ver = aom.activeVersion;
        const model = AOM_VERSIONS[ver];
        const filled = model.steps.filter(s => activeAom[s.n]?.trim());
        if (filled.length > 0) {
          ctx += `\n\nART OF MODEL (${ver}): the foundational thinking shaping this work:\n`;
          filled.forEach(s => { ctx += `${s.title}: ${activeAom[s.n]}\n`; });
          if (aom.synthesis[ver]) ctx += `Synthesis: ${aom.synthesis[ver]}\n`;
        }
      }
      return ctx;
    },

    // ── Atrium Tools (Studio connective tissue — modules read these as optional context) ──
    get_active_signal: () => store.atrium?.activeSignal || "",
    set_active_signal: (text) => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), activeSignal:text}})),
    get_flow_lane: () => store.atrium?.flowLane || [],
    get_canonical_runs: () => (store.atrium?.flowLane || []).filter(it => it.canonical && it.payload?.steps),
    push_flow_artifact: ({source, label, payload}) => {
      const item = { id: uid(), source, label, payload: payload||null, ts: Date.now() };
      setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), flowLane: [item, ...((s.atrium?.flowLane)||[])].slice(0, 12)}}));
      return item;
    },
    clear_flow_artifact: (id) => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), flowLane: ((s.atrium?.flowLane)||[]).filter(i => i.id !== id)}})),
    get_open_loops: () => store.atrium?.openLoops || [],
    add_open_loop: ({label, source}) => {
      const loop = { id: uid(), label, source: source||null, ts: Date.now() };
      setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), openLoops: [loop, ...((s.atrium?.openLoops)||[])]}}));
      return loop;
    },
    close_open_loop: (id) => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), openLoops: ((s.atrium?.openLoops)||[]).filter(l => l.id !== id)}})),

    // ── Atrium Sequence Tools (Slice 1: orchestration shell, mocked execution) ──
    get_sequence: () => store.atrium?.sequence || [],
    add_to_sequence: (moduleKey) => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), sequence: [...((s.atrium?.sequence)||[]), moduleKey]}})),
    remove_from_sequence: (idx) => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), sequence: ((s.atrium?.sequence)||[]).filter((_, i) => i !== idx)}})),
    move_in_sequence: (from, to) => setStore(s => {
      const seq = [...((s.atrium?.sequence)||[])];
      if (from < 0 || from >= seq.length || to < 0 || to >= seq.length) return s;
      const [it] = seq.splice(from, 1);
      seq.splice(to, 0, it);
      return {...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), sequence: seq}};
    }),
    clear_sequence: () => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), sequence: []}})),

    get_current_run: () => store.atrium?.currentRun || null,
    start_run: (canonContext = []) => {
      const seq = store.atrium?.sequence || [];
      const signal = store.atrium?.activeSignal || "";
      if (seq.length === 0) return null;
      const run = {
        id: uid(),
        signal,
        startedAt: Date.now(),
        completedAt: null,
        status: "running",
        canonContext: Array.isArray(canonContext) ? canonContext : [],
        steps: seq.map((moduleKey) => ({
          moduleKey,
          status: "queued",
          output: null,
          error: null,
          startedAt: null,
          completedAt: null,
        })),
      };
      setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), currentRun: run}}));
      return run;
    },
    update_run_step: (idx, updates) => setStore(s => {
      const run = s.atrium?.currentRun;
      if (!run) return s;
      const steps = run.steps.map((st, i) => i === idx ? {...st, ...updates} : st);
      return {...s, atrium:{...s.atrium, currentRun: {...run, steps}}};
    }),
    complete_run: () => setStore(s => {
      const run = s.atrium?.currentRun;
      if (!run) return s;
      const completed = {...run, status: "done", completedAt: Date.now()};
      const flowItem = {
        id: uid(),
        source: "Run",
        label: completed.signal || "(no signal)",
        ts: completed.completedAt,
        payload: { runId: completed.id, steps: completed.steps },
      };
      // Stratification cap: canonical items are exempt (they never expire); non-canonical
      // items obey a soft cap of 50. The Compost zone shows older non-canonical runs;
      // beyond 50 they get culled to keep localStorage bounded.
      const NON_CANONICAL_CAP = 50;
      const next = [flowItem, ...((s.atrium?.flowLane)||[])];
      const canonicals = next.filter(it => it.canonical);
      const nonCanonicals = next.filter(it => !it.canonical).slice(0, NON_CANONICAL_CAP);
      // Preserve original order (most recent first) by sorting on ts desc
      const merged = [...canonicals, ...nonCanonicals].sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return {...s, atrium:{...s.atrium, currentRun: null, flowLane: merged}};
    }),
    abort_run: () => setStore(s => ({...s, atrium:{...(s.atrium||DEFAULT_STORE.atrium), currentRun: null}})),

    // ── Atrium Canon (Freedom Embassy seat — operator gesture, not a module) ──
    commit_to_canon: (flowItemId, note) => setStore(s => ({
      ...s,
      atrium:{
        ...(s.atrium||DEFAULT_STORE.atrium),
        flowLane: ((s.atrium?.flowLane)||[]).map(it => it.id === flowItemId ? {...it, canonical: true, canonicalAt: Date.now(), canonicalNote: note || null} : it),
      },
    })),
    revert_canon: (flowItemId) => setStore(s => ({
      ...s,
      atrium:{
        ...(s.atrium||DEFAULT_STORE.atrium),
        flowLane: ((s.atrium?.flowLane)||[]).map(it => it.id === flowItemId ? {...it, canonical: false, canonicalAt: null, canonicalNote: null} : it),
      },
    })),
    // Stratification (#2) — manual archive moves a run to Compost zone before its
    // age-based decay would. Restore moves it back. Canon is unaffected by archive
    // (a canonical run cannot be archived; revert_canon first if needed).
    archive_artifact: (flowItemId) => setStore(s => ({
      ...s,
      atrium:{
        ...(s.atrium||DEFAULT_STORE.atrium),
        flowLane: ((s.atrium?.flowLane)||[]).map(it => it.id === flowItemId && !it.canonical ? {...it, archived: true, archivedAt: Date.now()} : it),
      },
    })),
    restore_artifact: (flowItemId) => setStore(s => ({
      ...s,
      atrium:{
        ...(s.atrium||DEFAULT_STORE.atrium),
        flowLane: ((s.atrium?.flowLane)||[]).map(it => it.id === flowItemId ? {...it, archived: false, archivedAt: null} : it),
      },
    })),

    // ── Settings Tools ──
    get_settings: () => store.settings,
    set_settings: (updates) => setStore(s => ({...s, settings:{...s.settings, ...updates}})),

    // Raw store access (for components that need full state)
    store,
  }), [store]);

  return api;
}

export default useASUStore;
