// Slice 1.5 — shape-honest mocks. Each generator returns a structured stub
// matching the native output form of its real module. No LLM calls, no real
// processing — these exist so the operator can read the *shape* of a multi-module
// run before slice 2 wires real interpolators and slice 3 wires auto-modes.
//
// Most mocks take only the signal. Grace is the exception: it consumes priorSteps
// (completed upstream outputs) and is the first cross-step reader in the apparatus.
// Output shape: { kind, summary, detail } where detail is module-specific.

// ── Pseudo-random pickers (deterministic from signal text) ─────────────
function pseudoRandom(seed, salt = 0) {
  let h = 5381 + salt;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}
function pick(arr, seed, salt = 0) {
  return arr[pseudoRandom(seed, salt) % arr.length];
}
function pickN(arr, n, seed, salt = 0) {
  const out = [];
  const used = new Set();
  let i = 0;
  while (out.length < Math.min(n, arr.length) && i < n * 12) {
    const idx = pseudoRandom(seed, salt + i) % arr.length;
    if (!used.has(idx)) { used.add(idx); out.push(arr[idx]); }
    i++;
  }
  return out;
}
function truncate(s, n = 60) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── Content libraries (kept small and local; real modules will replace them) ──
const AGENTS = ["Field", "WIP", "Action", "Cache", "Atlas", "Grace", "Open", "Art Practice"];
const AGENT_VOICES = [
  "wants to be grounded before it can bloom",
  "is already in tension with the form",
  "asks for stillness, not another move",
  "demands a counter-move that hasn't surfaced",
  "is the missing seat, not the next step",
  "may be a decoy for what is actually being asked",
  "needs to be released, not held",
  "is doing the work the operator hasn't named",
];
const HERMETIC_LAWS = [
  { key: "Mentalism", line: "All is mind; the situation reflects what is held in attention." },
  { key: "Correspondence", line: "As above, so below — the small move mirrors the structural one." },
  { key: "Vibration", line: "Nothing rests; the object's tone is its frequency." },
  { key: "Polarity", line: "Opposites are degrees of the same axis." },
  { key: "Rhythm", line: "Every motion has its return; pacing is the work." },
  { key: "Cause & Effect", line: "No accident — every output traces to a posture." },
  { key: "Gender", line: "Generative and receptive principles co-act in every form." },
];
const TENSIONS = [
  "Cause & Effect ↔ Rhythm — outcome-thinking versus cadence",
  "Polarity ↔ Correspondence — opposition pulling against analogy",
  "Mentalism ↔ Vibration — what is held versus what is felt",
  "Gender ↔ Cause & Effect — receptive posture under outcome pressure",
];
const EMOTIONAL_REGISTERS = ["Threshold", "Wonder", "Grief", "Resolve", "Unrest", "Stillness"];
const PALETTES = ["dusk", "noon", "ember", "verdigris", "ink", "salt"];
const MOODS = ["receding", "approaching", "static under pressure", "dissolving at the edges", "centered and breathing", "split between registers"];
const CARD_VOICES = ["question", "obstruction", "echo", "counter-move", "premise", "release"];
const APPLICATIONS = [
  "Move slowly so the structure can be felt.",
  "Refuse the obvious resolution.",
  "Let the smallest element carry the largest claim.",
  "Make the seam visible.",
  "Hold the contradiction without flattening it.",
];

// Field of Action surface taxonomy. The visual OS recognizes five surfaces; the
// sixth (Field Composition) sits between Editorial Field and Field Instrument —
// expressive, rule-driven, more precise than editorial but less structured than an
// instrument. Atrium runs route to one of these.
export const FIELD_TYPES = [
  { key: "activation", label: "Field Activation", surface: "Hero", note: "Reactive, alive — performs the thesis" },
  { key: "editorial", label: "Editorial Field", surface: "Writing", note: "Atmospheric, suggestive — meaning embedded in environment" },
  { key: "composition", label: "Field Composition", surface: "(new)", note: "Expressive but rule-driven — between editorial and instrument" },
  { key: "study", label: "Field Study", surface: "Exploration", note: "Experimental, unstable — reveals edges" },
  { key: "instrument", label: "Field Instrument", surface: "Artifact", note: "Structured, transferable — usable output" },
  { key: "map", label: "Field Map", surface: "Canon", note: "Minimal, authoritative — the rules themselves" },
];

// One-line Reveals — what the run uncovered. Distinct from the longer Condition
// prose — punchy declaratives the operator can scan in seconds.
const TAKEAWAYS = [
  "The signal asks for a release, not a resolution.",
  "The form is in the operator's hands, not the apparatus.",
  "What looked like a question is actually a posture.",
  "The tension is between holding and shipping.",
  "Three readings in, the work is more mature than first articulated.",
  "The resistance is not the obstacle; it is the form.",
  "What is being made is not what was first announced.",
  "Materialization is closer than the signal suggests.",
  "The apparatus has read enough; the operator hasn't yet decided.",
  "There is more available than has been touched.",
  "The work is asking to be smaller than the brief proposed.",
  "The signal has shifted; the next run should follow it.",
];

// ── Per-module shape generators ────────────────────────────────────────
export const SHAPE_MOCKS = {
  backstage: (signal) => ({
    kind: "backstage",
    summary: `8-agent take on "${truncate(signal, 40)}"`,
    detail: {
      agents: AGENTS.map((name, i) => ({
        name,
        take: `${pick(AGENT_VOICES, signal, i + 11)}`,
      })),
    },
  }),

  model: (signal) => ({
    kind: "art-of-model",
    summary: `Synthesis · v3 · ${pick(["coherent", "partially aligned", "in tension", "centered"], signal, 3)}`,
    detail: {
      version: "v3",
      steps: [
        { title: "Origin", text: `The signal points to ${truncate(signal, 80)} — read first as posture, not problem.` },
        { title: "Field", text: `What surrounds it: ${pick(MOODS, signal, 4)}.` },
        { title: "Counter", text: `What it resists: the easy ${pick(["resolution", "pivot", "frame", "metaphor"], signal, 5)}.` },
        { title: "Form", text: `Provisional form: ${pick(["a hold", "a release", "a split", "a return"], signal, 6)}.` },
      ],
      synthesis: `Read together, the signal asks for ${pick(APPLICATIONS, signal, 7)}`,
    },
  }),

  foa: (signal) => ({
    kind: "foa-generator",
    summary: `Field of Action outline · 4 zones`,
    detail: {
      field: `What is being read: ${truncate(signal, 100)}.`,
      wip: `In motion: ${pick(["a draft", "a fragment", "an experiment", "a sketch"], signal, 8)} that won't yet resolve.`,
      action: `What to produce: ${pick(["a single artifact", "a series", "a constraint document", "a refusal"], signal, 9)}.`,
      cache: `What to retain: ${pick(["the question that arrived first", "the form that almost worked", "the contradiction", "the unsent draft"], signal, 10)}.`,
    },
  }),

  editor: (signal) => ({
    kind: "exploration-editor",
    summary: `Draft entry · ${pick(["fragment", "memo", "sketch", "field note"], signal, 12)}`,
    detail: {
      title: pick([
        "Notes Toward a Form",
        "What the Signal Asks",
        "Provisional Reading",
        "Against Resolution",
        "The Hold and the Release",
      ], signal, 13),
      body: `Working from the signal "${truncate(signal, 60)}". Initial reading: ${pick(MOODS, signal, 14)}. The question this entry circles is whether ${pick(APPLICATIONS, signal, 15).toLowerCase()}`,
      tags: pickN(["draft", "exploration", "in-progress", "memo", "fragment", "fieldnote"], 3, signal, 16),
    },
  }),

  breakground: (signal) => ({
    kind: "breakground",
    summary: `Card composition · 5 cards arranged`,
    detail: {
      cards: Array.from({ length: 5 }, (_, i) => ({
        kind: pick(CARD_VOICES, signal, 20 + i),
        line: `${pick(MOODS, signal, 30 + i).replace(/^./, (c) => c.toUpperCase())}; ${pick(APPLICATIONS, signal, 40 + i).toLowerCase()}`,
      })),
    },
  }),

  console: (signal) => {
    const activeLawIdxs = pickN([0, 1, 2, 3, 4, 5, 6], 3, signal, 50);
    const activeLaws = activeLawIdxs.map((i) => HERMETIC_LAWS[i]);
    const tensions = pickN(TENSIONS, 2, signal, 60);
    return {
      kind: "console",
      summary: `Forces · ${activeLaws.length} active laws, ${tensions.length} tensions`,
      detail: {
        activeLaws: activeLaws.map((l) => ({ name: l.key, reading: l.line })),
        tensions: tensions.map((t) => ({ pair: t })),
      },
    };
  },

  playbook: (signal) => {
    const pillars = {
      system: 30 + (pseudoRandom(signal, 70) % 50),
      scenography: 30 + (pseudoRandom(signal, 71) % 50),
      soul: 30 + (pseudoRandom(signal, 72) % 50),
      relational: 30 + (pseudoRandom(signal, 73) % 50),
    };
    return {
      kind: "playbook",
      summary: `Pillars · sys ${pillars.system} · scen ${pillars.scenography} · soul ${pillars.soul} · rel ${pillars.relational}`,
      detail: {
        pillars,
        emotion: pick(EMOTIONAL_REGISTERS, signal, 74),
        application: {
          bigMove: pick(APPLICATIONS, signal, 75),
          whimsy: pick(APPLICATIONS, signal, 76),
          connection: pick(APPLICATIONS, signal, 77),
        },
      },
    };
  },

  desert: (signal) => ({
    kind: "desert",
    summary: `Visual params · ${pick(PALETTES, signal, 80)} · ${pick(MOODS, signal, 81)}`,
    detail: {
      palette: pick(PALETTES, signal, 80),
      density: 0.3 + ((pseudoRandom(signal, 82) % 70) / 100),
      mood: pick(MOODS, signal, 81),
      notes: `Ground keyed to ${pick(EMOTIONAL_REGISTERS, signal, 83).toLowerCase()}; geometry resists the signal's ${pick(["pull", "push", "cadence", "stillness"], signal, 84)}.`,
    },
  }),

  lab: (signal) => ({
    kind: "lab",
    summary: `Exhibition page · 4 sections`,
    detail: {
      title: pick([
        "Run Notes",
        "What the Apparatus Found",
        "A Reading in Four Parts",
        "Field Trace",
      ], signal, 90),
      sections: [
        { title: "Premise", body: `Signal: "${truncate(signal, 80)}".` },
        { title: "Reading", body: pick(MOODS, signal, 91) + "." },
        { title: "Form", body: pick(APPLICATIONS, signal, 92) },
        { title: "Open", body: `Carries forward: ${pick(["the contradiction", "the unfinished draft", "the question that arrived first", "the form that almost worked"], signal, 93)}.` },
      ],
    },
  }),

  // Grace — Governance · Evaluate. The first cross-step + cross-run reader.
  // Consumes the run's prior outputs AND canonical Field-directions from the
  // apparatus's history. Renders a single coherent Field-direction. When canon
  // context is provided, Grace flags condition repetition — the apparatus
  // recognizing it has been in this Field before.
  grace: (signal, priorSteps = [], canonContext = []) => {
    const stepCount = priorSteps.length;
    const canonCount = canonContext.length;
    const consoleStep = priorSteps.find((s) => s.output?.kind === "console");
    const consoleTensions = consoleStep?.output?.detail?.tensions?.map((t) => t.pair) || [];
    const playbookStep = priorSteps.find((s) => s.output?.kind === "playbook");
    const dominantPillar = playbookStep
      ? Object.entries(playbookStep.output.detail.pillars).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null;
    const modelStep = priorSteps.find((s) => s.output?.kind === "art-of-model");
    const fallbackTensions = pickN(TENSIONS, 2, signal, 100);
    const tensions = consoleTensions.length ? consoleTensions : fallbackTensions;

    const moodWord = pick(MOODS, signal, 101);
    const stepClause = stepCount === 0
      ? "with no upstream readings"
      : `across ${stepCount} step${stepCount === 1 ? "" : "s"}`;
    const pillarClause = dominantPillar ? ` The pillar tilt is ${dominantPillar}.` : "";
    const synthClause = modelStep ? ` The synthesis read it as ${moodWord}.` : ` The dominant read is ${moodWord}.`;

    // Canon-echo clause: if canonical runs exist, surface condition repetition.
    let canonClause = "";
    if (canonCount > 0) {
      const echoFieldType = canonContext.find(c => c.fieldType)?.fieldType;
      const echoLabel = echoFieldType
        ? FIELD_TYPES.find(ft => ft.key === echoFieldType)?.label || null
        : null;
      canonClause = ` This signal echoes ${canonCount} prior canonical Field-direction${canonCount === 1 ? "" : "s"}${echoLabel ? `, last surfaced as ${echoLabel}` : ""}.`;
    }

    const reading = `Working ${stepClause}, the apparatus held "${truncate(signal, 80)}".${synthClause}${pillarClause}${canonClause}`;

    const next = pick([
      "Hold the contradiction; do not flatten it.",
      "Take the smallest output forward; release the rest.",
      "Re-run with the resistance reframed as the question.",
      "Move toward materialization; the apparatus has read enough.",
      "Pause. The signal isn't yet articulate; tighten it before another run.",
      "Promote the strongest fragment to canon; let the rest stay draft.",
    ], signal, 102 + stepCount);

    const reveal = pick(TAKEAWAYS, signal, 200 + stepCount);
    const fieldTypeIdx = pseudoRandom(signal, 300 + stepCount) % FIELD_TYPES.length;
    const fieldType = FIELD_TYPES[fieldTypeIdx];

    return {
      kind: "grace",
      summary: stepCount === 0
        ? `Field-direction · no upstream context`
        : `Field-direction · ${fieldType.label}`,
      detail: {
        reveal,                 // was: takeaway — the felt insight
        condition: reading,     // was: reading — what governs the situation
        failureMode: tensions,  // was: tensionsSeen — what would make this dead
        nextAgent: next,        // was: nextMove — what acts next
        fieldType: fieldType.key,
        fieldTypeLabel: fieldType.label,
        fieldTypeSurface: fieldType.surface,
      },
    };
  },
};

export function runMock(moduleKey, signal, priorSteps = [], canonContext = []) {
  const fn = SHAPE_MOCKS[moduleKey];
  if (!fn) {
    return { kind: "unknown", summary: `${moduleKey} — no mock defined`, detail: null };
  }
  return fn(signal, priorSteps, canonContext);
}

// Derive a synthesis for a completed run. If Grace was in the sequence, its
// output IS the synthesis. Otherwise return a structural auto-summary that
// surfaces the gap and nudges the operator to include Grace next time.
export function synthesizeRun(steps, signal) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const graceStep = safeSteps.find((s) => s.output?.kind === "grace");
  if (graceStep && graceStep.output?.detail) {
    const d = graceStep.output.detail;
    return {
      source: "grace",
      reveal: d.reveal ?? d.takeaway ?? "",
      condition: d.condition ?? d.reading ?? "",
      failureMode: d.failureMode ?? d.tensionsSeen ?? [],
      nextAgent: d.nextAgent ?? d.nextMove ?? "",
      fieldType: d.fieldType ?? null,
      fieldTypeLabel: d.fieldTypeLabel ?? null,
      fieldTypeSurface: d.fieldTypeSurface ?? null,
    };
  }
  // Auto-summary — no Grace step. Honest about the gap.
  const kindLabels = {
    backstage: "Backstage", "art-of-model": "Art of Model", "foa-generator": "FOA Generator",
    "exploration-editor": "Exploration Editor", breakground: "Breakground", console: "Console",
    playbook: "Playbook", desert: "Desert", lab: "Lab", grace: "Grace",
  };
  const labels = safeSteps.map((s) => kindLabels[s.output?.kind] || s.moduleKey).join(", ");
  const n = safeSteps.length;
  return {
    source: "auto",
    reveal: n === 0 ? "Empty run." : "No Grace step — apparatus saw shape but didn't render judgment.",
    condition: n === 0
      ? "Empty run."
      : `Ran ${n} step${n === 1 ? "" : "s"}: ${labels}. No Grace step in this sequence — Field-direction is structural only. Add Grace at the end of a future run for a coherent reading.`,
    failureMode: [],
    nextAgent: "Include Grace as a terminal step to render a real Field-direction.",
    fieldType: null,
    fieldTypeLabel: null,
    fieldTypeSurface: null,
  };
}
