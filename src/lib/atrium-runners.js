// Slice 2 — per-module LLM runners. Four modules currently wired: Backstage,
// Art of Model (model), FOA Generator (foa), Grace. Output shapes match the
// shape-honest mocks in src/data/atrium-mocks.js so existing UI rendering
// (SubstepDetail, synthesisRun, takeaway) works unchanged.
//
// Modules NOT in RUNNABLE_KEYS still use shape-honest mocks. Slice 3 will add
// auto-modes for Console, Playbook, Breakground, Desert, Exploration Editor, Lab.

import { callAtriumLLM, extractJSON, AtriumLLMError } from "./atrium-llm";

const KIND_FROM_KEY = {
  backstage: "backstage",
  model: "art-of-model",
  foa: "foa-generator",
  grace: "grace",
};

export const RUNNABLE_KEYS = new Set(Object.keys(KIND_FROM_KEY));

// ── Prompts ──────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  backstage: `You are the Backstage module of the Atrium apparatus — an 8-agent reading pipeline operating under the Field of Action (FoA) framework.

Given the operator's signal and any upstream context from prior modules in the run, produce one short clause (under 14 words) per agent. Each take must reflect that agent's role, not summarize the signal:

- Field — environmental signal reading
- WIP — exploratory work-in-progress
- Action — production
- Cache — storage and retrieval
- Atlas — mapping and orientation
- Grace — evaluation and quality judgment
- Open — tracking unfinished loops
- Art Practice — expressive exploration

Tone: declarative, present tense, no preamble. Each take should land as a felt observation, not a summary.

Return ONLY this JSON object (no preamble, no fence, no commentary):
{"agents":[{"name":"Field","take":"..."},{"name":"WIP","take":"..."},{"name":"Action","take":"..."},{"name":"Cache","take":"..."},{"name":"Atlas","take":"..."},{"name":"Grace","take":"..."},{"name":"Open","take":"..."},{"name":"Art Practice","take":"..."}]}`,

  model: `You are the Art of Model module of the Atrium apparatus — a synthesis engine that reads a signal and produces a structured intervention.

Given the signal and any upstream context, produce a 4-step reading and a final synthesis:

- Origin — what the signal asks at root, beyond surface framing
- Field — what surrounds the signal (mood, register, atmosphere)
- Counter — what it resists; what would be the easy/wrong move
- Form — a provisional form the work could take

Then a final synthesis paragraph (2–3 sentences) that names the throughline and the core tension.

Tone: precise, lightly poetic, never therapeutic. No bullet lists in the synthesis paragraph.

Return ONLY this JSON object (no preamble, no fence):
{"version":"v3","steps":[{"title":"Origin","text":"..."},{"title":"Field","text":"..."},{"title":"Counter","text":"..."},{"title":"Form","text":"..."}],"synthesis":"..."}`,

  foa: `You are the FOA Generator module — produces a Field of Action outline with four zones from a signal.

Given the signal and any upstream context, produce one sentence per zone:
- field — what is being read
- wip — what is currently in motion (drafts, fragments, experiments)
- action — what to produce next
- cache — what to retain (the question, the form that almost worked, the contradiction)

Tone: declarative, concrete, no hedging.

Return ONLY this JSON object (no preamble, no fence):
{"field":"...","wip":"...","action":"...","cache":"..."}`,

  grace: `You are Grace — the governance/evaluation organ of the Atrium apparatus, operating under the Field of Action visual OS. You read across upstream module outputs in the current run AND across the apparatus's history of canonical Field-directions, then render a coherent Field-direction.

Your job is NOT to summarize each step. It is to surface what the run as a whole revealed AND whether it echoes prior canonical readings. The reveal should be the one declarative line the operator most needs to read. If canonical runs are provided in the user message and this signal echoes one or more, name that explicitly in the condition prose — the apparatus recognizing it has been in this Field before.

Withholding is a correct, expected outcome. If the upstream readings do not converge, if nothing has repeated across them, the earlier readings of this signal, or the canonical history, or if the signal is not yet articulate, do not manufacture a reveal. Set notYet to true, leave reveal and nextAgent as empty strings, failureMode as an empty array and fieldType as null, and use condition (one or two sentences) to say plainly what has not yet shown itself. A signal may be held for weeks; your job is to notice when it is ready, not to close it.

Given the signal, prior steps' outputs, and any canonical history, produce a Field-direction with these fields (operator vocabulary):

- notYet — true when you are withholding (see above), otherwise false.
- reveal — a single declarative one-line headline naming what was uncovered (under 14 words, no hedging). This is the felt insight.
- condition — a 2–3 sentence prose synthesis of what governs this situation across the run. Names the primary force.
- failureMode — 1–3 named failure conditions; what would make this dead/collapse. Each as "X ↔ Y — brief explanation" naming the axis along which the work fails.
- nextAgent — a single sentence naming what acts next (concrete, specific to this signal). The next move in the apparatus.
- fieldType — one of: "activation" (Hero, reactive/alive), "editorial" (Writing, atmospheric), "composition" (rule-driven expressive — between editorial and instrument), "study" (Exploration, experimental), "instrument" (Artifact, structured/transferable), "map" (Canon, minimal/authoritative). Choose the surface this run wants to land on.

Tone: precise, never therapeutic, no coaching language. Speak the Field of Action OS vocabulary natively.

Return ONLY this JSON object (no preamble, no fence):
{"notYet":false,"reveal":"...","condition":"...","failureMode":["..."],"nextAgent":"...","fieldType":"..."}`,
};

// Field-type metadata for label/surface lookup (matches FIELD_TYPES in atrium-mocks.js)
const FIELD_TYPE_META = {
  activation: { label: "Field Activation", surface: "Hero" },
  editorial: { label: "Editorial Field", surface: "Writing" },
  composition: { label: "Field Composition", surface: "(new)" },
  study: { label: "Field Study", surface: "Exploration" },
  instrument: { label: "Field Instrument", surface: "Artifact" },
  map: { label: "Field Map", surface: "Canon" },
};

// ── Output coercion (best-effort: ensures shape matches mocks even if LLM is sloppy) ──
const COERCERS = {
  backstage: (raw) => {
    const agents = Array.isArray(raw?.agents) ? raw.agents : [];
    return {
      agents: agents
        .filter((a) => a && typeof a.name === "string" && typeof a.take === "string")
        .slice(0, 8),
    };
  },
  model: (raw) => ({
    version: raw?.version || "v3",
    steps: Array.isArray(raw?.steps) ? raw.steps.filter((s) => s?.title && s?.text).slice(0, 6) : [],
    synthesis: raw?.synthesis || "",
  }),
  foa: (raw) => ({
    field: raw?.field || "",
    wip: raw?.wip || "",
    action: raw?.action || "",
    cache: raw?.cache || "",
  }),
  grace: (raw) => {
    if (raw?.notYet === true) {
      return {
        notYet: true,
        reveal: "",
        condition: raw?.condition || "",
        failureMode: [],
        nextAgent: "",
        fieldType: null,
        fieldTypeLabel: null,
        fieldTypeSurface: null,
      };
    }
    const ft = raw?.fieldType && FIELD_TYPE_META[raw.fieldType] ? raw.fieldType : null;
    return {
      notYet: false,
      reveal: raw?.reveal || raw?.takeaway || "",
      condition: raw?.condition || raw?.reading || "",
      failureMode: Array.isArray(raw?.failureMode) ? raw.failureMode.slice(0, 5)
        : Array.isArray(raw?.tensionsSeen) ? raw.tensionsSeen.slice(0, 5) : [],
      nextAgent: raw?.nextAgent || raw?.nextMove || "",
      fieldType: ft,
      fieldTypeLabel: ft ? FIELD_TYPE_META[ft].label : null,
      fieldTypeSurface: ft ? FIELD_TYPE_META[ft].surface : null,
    };
  },
};

const SUMMARIZERS = {
  backstage: (d) => `8-agent take · ${d.agents?.length || 0} voices`,
  model: (d) => `Synthesis · ${d.steps?.length || 0} steps`,
  foa: () => "Field of Action outline · 4 zones",
  grace: (d) => d.notYet ? "Not yet" : d.fieldTypeLabel ? `Field-direction · ${d.fieldTypeLabel}` : "Field-direction",
};

// ── Upstream context builder — lightweight first-pass interpolator ──
// Slice 2 first pass: stringify upstream outputs as readable context. Slice 2.5
// would replace this with per-edge LLM-driven interpolators that reshape one
// module's native output into the next module's expected input.
export function buildContextString(priorSteps) {
  if (!priorSteps?.length) return "";
  const lines = priorSteps
    .filter((s) => s.output)
    .map((s, i) => {
      const kind = s.output.kind || s.moduleKey;
      const summary = s.output.summary || "";
      const detail = compactDetail(s.output);
      return `Step ${i + 1} — ${kind}: ${summary}${detail ? "\n" + detail : ""}`;
    });
  return lines.join("\n\n");
}

function compactDetail(output) {
  if (!output?.detail) return "";
  const d = output.detail;
  switch (output.kind) {
    case "backstage":
      return d.agents?.map((a) => `  ${a.name}: ${a.take}`).join("\n") || "";
    case "art-of-model":
      return [
        ...(d.steps?.map((s) => `  ${s.title}: ${s.text}`) || []),
        d.synthesis ? `  Synthesis: ${d.synthesis}` : null,
      ].filter(Boolean).join("\n");
    case "foa-generator":
      return ["field", "wip", "action", "cache"]
        .map((k) => d[k] ? `  ${k}: ${d[k]}` : null)
        .filter(Boolean)
        .join("\n");
    case "console":
      return [
        d.activeLaws?.map((l) => `  ${l.name}: ${l.reading}`).join("\n"),
        d.tensions?.length ? "  Tensions: " + d.tensions.map((t) => t.pair).join("; ") : null,
        d.situation ? `  Situation: ${d.situation}` : null,
        d.synthesis ? `  Synthesis: ${d.synthesis}` : null,
      ].filter(Boolean).join("\n");
    case "playbook":
      return [
        d.pillars ? `  Pillars: sys ${d.pillars.system}, scen ${d.pillars.scenography}, soul ${d.pillars.soul}, rel ${d.pillars.relational}` : null,
        d.emotion ? `  Emotion: ${d.emotion}` : null,
      ].filter(Boolean).join("\n");
    case "exploration-editor":
      return d.title ? `  ${d.title}: ${d.body || ""}` : "";
    case "lens":
      return d.unread
        ? `  Lens laid beside the signal, unread: ${d.lens} — ${d.text}`
        : [`  Lens: ${d.lens}${d.fits === false ? " (did not fit)" : ""}`, d.reading && `  ${d.reading}`, d.question && `  Question raised: ${d.question}`].filter(Boolean).join("\n");
    case "orientation":
      return d.fields?.map((f) => `  ${f.label}: ${f.value}`).join("\n") || "";
    case "breakground":
      return d.cards?.map((c) => `  ${c.kind}: ${c.line}`).join("\n") || "";
    case "desert":
      return [d.palette && `  Palette: ${d.palette}`, d.mood && `  Mood: ${d.mood}`].filter(Boolean).join("\n");
    case "lab":
      return d.sections?.map((s) => `  ${s.title}: ${s.body}`).join("\n") || "";
    case "grace":
      return [
        d.notYet && "  Grace withheld: not yet",
        d.reveal && `  Reveal: ${d.reveal}`,
        d.condition && `  Condition: ${d.condition}`,
        d.fieldTypeLabel && `  Field type: ${d.fieldTypeLabel}`,
      ].filter(Boolean).join("\n");
    default:
      return "";
  }
}

// Build a compact summary of canonical Field-directions to feed downstream
// runners. Limits to top 5 to keep prompt size bounded.
function buildCanonContextString(canonContext) {
  if (!canonContext?.length) return "";
  return canonContext
    .slice(0, 5)
    .map((c, i) => {
      const fieldLabel = c.fieldType ? `[${c.fieldType}]` : "";
      const reveal = c.reveal || "(no reveal)";
      const condition = c.condition ? ` — ${c.condition.slice(0, 160)}` : "";
      const sig = c.signal ? `\n  signal: "${c.signal.slice(0, 100)}"` : "";
      return `Canonical run ${i + 1} ${fieldLabel}: ${reveal}${condition}${sig}`;
    })
    .join("\n\n");
}

// ── Lens runner — any mental model, pattern or law pairing reads the signal ──
export async function runLensLLM(lens, signal, priorSteps, settings, options = {}) {
  const system = `You read a signal through one lens and nothing else.

The lens is "${lens.name}" (${lens.kind}): ${lens.text}

Apply it to the operator's signal as it stands. Do not summarize the signal, do not resolve it, and do not give advice. A lens that does not fit is a correct, expected result: if it does not illuminate this signal, set fits to false and say plainly why in one sentence. Never stretch the lens to make it fit.

Return ONLY this JSON object (no preamble, no fence):
{"fits":true,"reading":"two or three sentences: what this lens makes visible in the signal","question":"one question the lens raises that the operator has not asked"}`;
  const ctx = buildContextString(priorSteps);
  const parts = [`Operator signal:\n${signal || "(empty)"}`];
  if (ctx) parts.push(`Other readings in this run:\n${ctx}`);
  const { text } = await callAtriumLLM({
    system,
    user: parts.join("\n\n"),
    apiKey: settings.apiKey,
    model: settings.model,
    anthropicVersion: settings.anthropicVersion,
    maxTokens: 600,
    signal: options.abortSignal,
  });
  const parsed = extractJSON(text);
  if (!parsed) throw new AtriumLLMError(`${lens.name} returned malformed JSON. Raw output starts with: ${text.slice(0, 120)}…`);
  return {
    kind: "lens",
    summary: lens.name,
    detail: {
      lens: lens.name,
      lensKind: lens.kind,
      text: lens.text,
      unread: false,
      fits: parsed.fits !== false,
      reading: typeof parsed.reading === "string" ? parsed.reading : "",
      question: parsed.fits === false ? "" : (typeof parsed.question === "string" ? parsed.question : ""),
    },
  };
}

// ── Main runner ──────────────────────────────────────────────────────
export async function runModuleLLM(moduleKey, signal, priorSteps, settings, options = {}) {
  const system = SYSTEM_PROMPTS[moduleKey];
  if (!system) throw new AtriumLLMError(`No runner defined for module: ${moduleKey}`);
  const ctx = buildContextString(priorSteps);
  const canonCtx = buildCanonContextString(options.canonContext);
  const parts = [`Operator signal:\n${signal || "(empty)"}`];
  if (ctx) parts.push(`Upstream context from prior steps in this run:\n${ctx}`);
  if (canonCtx) parts.push(`Prior canonical Field-directions in the apparatus's history (use to recognize condition repetition):\n${canonCtx}`);
  const earlier = (options.earlierReadings || []).filter(Boolean);
  if (earlier.length) parts.push(`Earlier readings of this same signal, oldest first (use to recognize what has and has not repeated):\n${earlier.join("\n\n---\n\n")}`);
  const user = parts.join("\n\n");
  const { text } = await callAtriumLLM({
    system,
    user,
    apiKey: settings.apiKey,
    model: settings.model,
    anthropicVersion: settings.anthropicVersion,
    maxTokens: 1800,
    signal: options.abortSignal,
  });
  const parsed = extractJSON(text);
  if (!parsed) {
    throw new AtriumLLMError(`${moduleKey} returned malformed JSON. Raw output starts with: ${text.slice(0, 120)}…`);
  }
  const detail = COERCERS[moduleKey](parsed);
  const kind = KIND_FROM_KEY[moduleKey];
  const summary = SUMMARIZERS[moduleKey](detail);
  return { kind, summary, detail };
}
