// Field-direction bundle export. Takes a canonical flow item and emits a portable
// packet — JSON or Markdown — that downstream tools (Flora, Runway, Public surfaces,
// print fabricators) can consume as a constraint-rendering seed.
//
// Position B: the Atrium upstreams to artifact tools. The bundle is the pipe.
//
// Schema versioned at field-direction-bundle/v1. Future: art direction enriched
// via LLM, lineage traversal across canonical chain, signed bundles for sharing.

import { synthesizeRun } from "../data/atrium-mocks";

const SCHEMA = "field-direction-bundle/v1";

// Map a flow item's payload steps into a per-kind output dictionary so the bundle
// can be assembled without re-walking the steps array each lookup.
function indexStepsByKind(steps) {
  const out = {};
  (steps || []).forEach((s) => {
    if (s.output?.kind && !out[s.output.kind]) {
      out[s.output.kind] = s.output;
    }
  });
  return out;
}

function dominantPillar(pillars) {
  if (!pillars) return null;
  return Object.entries(pillars).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// Token derivation: maps the run's constraint config onto the visual OS tokens
// (density / randomness / distribution / depth / clarity). Heuristic, not LLM —
// gives downstream tools a starting position they can override.
function deriveTokens(byKind, synth) {
  const pillars = byKind["playbook"]?.detail?.pillars;
  const emotion = byKind["playbook"]?.detail?.emotion;
  const desert = byKind["desert"]?.detail;

  // Density correlates with system+scenography weight (more structure = denser)
  const density = pillars
    ? Math.min(1, ((pillars.system + pillars.scenography) / 200) * 1.2)
    : null;

  // Randomness inverse to system pillar; higher emotional register names trend chaotic
  const chaoticRegisters = ["Unrest", "Wonder"];
  const rigidRegisters = ["Stillness", "Resolve"];
  let randomness = pillars ? Math.max(0, Math.min(1, 1 - pillars.system / 100)) : null;
  if (chaoticRegisters.includes(emotion)) randomness = randomness != null ? Math.min(1, randomness + 0.2) : 0.7;
  if (rigidRegisters.includes(emotion)) randomness = randomness != null ? Math.max(0, randomness - 0.2) : 0.3;

  // Distribution / depth / clarity — less determinate, hint-only
  const distribution = pillars?.relational != null
    ? (pillars.relational > 60 ? "clustered" : "uniform")
    : null;
  const depth = pillars?.scenography != null
    ? (pillars.scenography > 60 ? "layered" : "flat")
    : null;
  const clarity = pillars?.soul != null
    ? (pillars.soul > 60 ? "diffused" : "sharp")
    : null;

  return {
    density: density?.toFixed?.(2),
    randomness: randomness?.toFixed?.(2),
    distribution,
    depth,
    clarity,
    desertDensity: desert?.density?.toFixed?.(2),
  };
}

// Recommended visual primitives based on Field type + active laws. Per the
// visual OS: Field is always present; Nodes/Vectors/Boundaries/Type are
// surface-dependent.
function recommendPrimitives(fieldType, byKind) {
  const out = ["Field"];
  if (fieldType === "instrument" || fieldType === "map") out.push("Boundaries");
  if (fieldType === "study" || fieldType === "composition") out.push("Nodes");
  if (fieldType === "editorial" || fieldType === "composition") out.push("Type");
  if (fieldType === "activation") out.push("Nodes", "Vectors");
  if (byKind["console"]?.detail?.tensions?.length > 0) {
    if (!out.includes("Vectors")) out.push("Vectors");
  }
  return out;
}

// Recommended motion type based on Field type + condition tone.
function recommendMotion(fieldType, condition) {
  if (fieldType === "activation") return "node response";
  if (fieldType === "study") return "emergence";
  if (fieldType === "instrument") return "constraint deformation";
  if (fieldType === "map") return "field drift";
  if (fieldType === "editorial" || fieldType === "composition") {
    if (/receding|drift|dissolving/i.test(condition || "")) return "field drift";
    return "signal flow";
  }
  return "field drift";
}

// Synthesize an image prompt for downstream gen tools. Concatenates the reveal,
// the palette/mood from Desert (if present), and the dominant compositional
// posture from active hermetic laws. Keeps it short and seed-shaped — operator
// can refine in the downstream tool.
function buildImagePrompt(synth, byKind) {
  const reveal = synth.reveal || synth.takeaway;
  const palette = byKind["desert"]?.detail?.palette;
  const mood = byKind["desert"]?.detail?.mood || "still";
  const laws = byKind["console"]?.detail?.activeLaws?.map((l) => l.name) || [];
  const lawClause = laws.length ? `Compositional principles drawn from ${laws.join(", ")}.` : "";
  const paletteClause = palette ? `Palette: ${palette}.` : "";
  const moodClause = mood ? `Mood: ${mood}.` : "";
  return [reveal && `Reveal: ${reveal}`, paletteClause, moodClause, lawClause]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// Build the full bundle from a canonical flow item.
export function buildBundle(flowItem) {
  if (!flowItem) return null;
  const steps = flowItem.payload?.steps || [];
  const synth = synthesizeRun(steps, flowItem.label);
  const byKind = indexStepsByKind(steps);
  const tokens = deriveTokens(byKind, synth);
  const primitives = recommendPrimitives(synth.fieldType, byKind);
  const motion = recommendMotion(synth.fieldType, synth.condition);
  const imagePrompt = buildImagePrompt(synth, byKind);

  return {
    schema: SCHEMA,
    atrium: {
      ranAt: flowItem.ts ? new Date(flowItem.ts).toISOString() : null,
      promotedAt: flowItem.canonicalAt ? new Date(flowItem.canonicalAt).toISOString() : null,
      flowItemId: flowItem.id,
      runId: flowItem.payload?.runId || null,
    },
    signal: flowItem.label || "",
    fieldDirection: {
      fieldType: synth.fieldType || null,
      fieldTypeLabel: synth.fieldTypeLabel || null,
      surface: synth.fieldTypeSurface || null,
      reveal: synth.reveal || "",
      condition: synth.condition || "",
      failureMode: synth.failureMode || [],
      nextAgent: synth.nextAgent || "",
    },
    constraint: {
      activeLaws: byKind["console"]?.detail?.activeLaws || [],
      tensions: byKind["console"]?.detail?.tensions?.map((t) => t.pair) || [],
      pillars: byKind["playbook"]?.detail?.pillars || null,
      dominantPillar: dominantPillar(byKind["playbook"]?.detail?.pillars),
      emotion: byKind["playbook"]?.detail?.emotion || null,
      application: byKind["playbook"]?.detail?.application || null,
    },
    artDirection: {
      palette: byKind["desert"]?.detail?.palette || null,
      mood: byKind["desert"]?.detail?.mood || null,
      desertNotes: byKind["desert"]?.detail?.notes || null,
      tokens,
      primitives,
      motion,
      imagePrompt,
      lawsCheck: [
        "Everything maps to a condition",
        "No decoration",
        "Rules are perceivable",
        "Emergence over composition",
        "Type behaves like matter",
      ],
    },
    trace: {
      stepCount: steps.length,
      modules: steps.map((s) => s.moduleKey),
      kinds: steps.map((s) => s.output?.kind || null),
    },
  };
}

// Markdown rendering — human-readable variant for pasting into docs, Notion, etc.
export function bundleToMarkdown(bundle) {
  if (!bundle) return "";
  const fd = bundle.fieldDirection;
  const c = bundle.constraint;
  const ad = bundle.artDirection;
  const lines = [];

  lines.push(`# Field-direction Bundle`);
  lines.push(`*${SCHEMA}*`);
  lines.push("");
  lines.push(`**Signal**`);
  lines.push(`> ${bundle.signal || "(empty)"}`);
  lines.push("");

  lines.push(`## Field Direction`);
  if (fd.fieldTypeLabel) lines.push(`**${fd.fieldTypeLabel}**${fd.surface ? ` · ${fd.surface}` : ""}`);
  lines.push("");
  if (fd.reveal) {
    lines.push(`### Reveal`);
    lines.push(fd.reveal);
    lines.push("");
  }
  if (fd.condition) {
    lines.push(`### Condition`);
    lines.push(fd.condition);
    lines.push("");
  }
  if (fd.failureMode?.length) {
    lines.push(`### Failure mode`);
    fd.failureMode.forEach((f) => lines.push(`- ${f}`));
    lines.push("");
  }
  if (fd.nextAgent) {
    lines.push(`### Next agent`);
    lines.push(fd.nextAgent);
    lines.push("");
  }

  lines.push(`## Constraint`);
  if (c.activeLaws?.length) {
    lines.push(`**Active laws**`);
    c.activeLaws.forEach((l) => lines.push(`- **${l.name}** — ${l.reading || ""}`));
    lines.push("");
  }
  if (c.tensions?.length) {
    lines.push(`**Tensions**`);
    c.tensions.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }
  if (c.pillars) {
    lines.push(`**Pillars** — System ${c.pillars.system} · Scenography ${c.pillars.scenography} · Soul ${c.pillars.soul} · Relational ${c.pillars.relational}`);
    if (c.dominantPillar) lines.push(`Dominant pillar: **${c.dominantPillar}**`);
    lines.push("");
  }
  if (c.emotion) {
    lines.push(`**Emotion** — ${c.emotion}`);
    lines.push("");
  }

  lines.push(`## Art Direction`);
  if (ad.palette) lines.push(`**Palette** — ${ad.palette}`);
  if (ad.mood) lines.push(`**Mood** — ${ad.mood}`);
  if (ad.tokens) {
    lines.push(`**Tokens**`);
    Object.entries(ad.tokens).forEach(([k, v]) => v != null && lines.push(`- ${k}: ${v}`));
  }
  if (ad.primitives?.length) lines.push(`**Primitives** — ${ad.primitives.join(", ")}`);
  if (ad.motion) lines.push(`**Motion** — ${ad.motion}`);
  lines.push("");
  if (ad.imagePrompt) {
    lines.push(`### Image prompt`);
    lines.push(`> ${ad.imagePrompt}`);
    lines.push("");
  }
  lines.push(`### Laws check (non-negotiable)`);
  ad.lawsCheck.forEach((law) => lines.push(`- [ ] ${law}`));
  lines.push("");

  lines.push(`## Trace`);
  lines.push(`${bundle.trace.stepCount} step${bundle.trace.stepCount === 1 ? "" : "s"}: ${bundle.trace.modules.join(" → ")}`);
  lines.push("");

  return lines.join("\n");
}
