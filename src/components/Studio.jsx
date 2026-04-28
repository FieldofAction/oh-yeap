import React, { useEffect, useState } from "react";
import { runMock, synthesizeRun } from "../data/atrium-mocks";
import { runModuleLLM, RUNNABLE_KEYS } from "../lib/atrium-runners";
import { buildBundle, bundleToMarkdown } from "../lib/atrium-bundle";

// FOA ring layout. Each seat is a role; a seat is "filled" by zero or more modules,
// "implicit" if covered by infrastructure rather than a UI surface, or "open" if no
// surface exists yet — open seats are rendered to make the gap visible.
const RINGS = [
  {
    key: "operational",
    label: "Operational",
    desc: "Field → WIP → Action → Cache. The production cycle.",
    seats: [
      { role: "Field", verb: "Read", kind: "open", note: "No signal-capture surface yet. The Active Signal above fills this seat for now." },
      { role: "WIP", verb: "Explore", modules: [
        { key: "editor", label: "Exploration Editor", desc: "Draft and enrich exploration entries." },
        { key: "breakground", label: "Breakground", desc: "Card-based exploration and compositions." },
      ]},
      { role: "Action", verb: "Produce", modules: [
        { key: "backstage", label: "Backstage", desc: "Idea composer with 8-agent pipeline." },
        { key: "foa", label: "FOA Generator", desc: "Generate Field of Action outputs from prompts." },
      ]},
      { role: "Cache", verb: "Store", kind: "implicit", note: "seed.js + useASUStore — already structural, no surface needed." },
    ],
  },
  {
    key: "practice",
    label: "Practice",
    desc: "The meta-work that informs the cycle.",
    seats: [
      { role: "Art Practice", verb: "Express", modules: [
        { key: "desert", label: "Desert", desc: "Visual environment for desert compositions." },
      ]},
      { role: "CLSSM", verb: "Extract", modules: [
        { key: "model", label: "Art of Model", desc: "Interactive synthesis engine for designing meaningful intervention." },
      ]},
      { role: "Atlas", verb: "Map", modules: [
        { key: "console", label: "Console", desc: "7 laws diagram with 21 pair mechanics." },
        { key: "playbook", label: "Playbook", desc: "4 pillars, 6 emotional registers, 23 references, 7 steps." },
      ]},
    ],
  },
  {
    key: "governance",
    label: "Governance",
    desc: "Judgment, materialization, decision authority.",
    seats: [
      { role: "Grace", verb: "Evaluate", modules: [
        { key: "grace", label: "Grace", desc: "Reads the run across upstream steps and renders a coherent take.", atriumOnly: true },
      ]},
      { role: "Open", verb: "Track", kind: "open", note: "No tracker for unfinished work across modules. Open Loops below will surface it." },
      { role: "Hotel", verb: "Materialize", modules: [
        { key: "lab", label: "Incandescent Lab", desc: "Process exhibitions from completed runs." },
      ]},
      { role: "Freedom Embassy", verb: "Decide", kind: "action", note: "Activated by 'Promote to canon' on completed runs in the Flow Lane." },
    ],
  },
];

// Derived: ordered palette of all module keys (used by the sequence builder).
const MODULE_INFO = (() => {
  const map = {};
  RINGS.forEach((ring) => {
    ring.seats.forEach((seat) => {
      seat.modules?.forEach((m) => {
        map[m.key] = { label: m.label, role: seat.role, verb: seat.verb };
      });
    });
  });
  return map;
})();

const PALETTE_ORDER = Object.keys(MODULE_INFO);

function ringCards(ring) {
  const out = [];
  ring.seats.forEach((seat) => {
    const seatLabel = `${seat.role} · ${seat.verb}`;
    if (seat.modules?.length) {
      seat.modules.forEach((m) => out.push({ kind: m.atriumOnly ? "atrium-only" : "module", seat: seatLabel, ...m }));
    } else if (seat.kind === "implicit") {
      out.push({ kind: "implicit", seat: seatLabel, key: `${ring.key}-${seat.role}`, label: "Already structural", desc: seat.note });
    } else if (seat.kind === "action") {
      out.push({ kind: "action", seat: seatLabel, key: `${ring.key}-${seat.role}`, label: "Action seat", desc: seat.note });
    } else {
      out.push({ kind: "open", seat: seatLabel, key: `${ring.key}-${seat.role}`, label: "Open seat", desc: seat.note });
    }
  });
  return out;
}

// Mocked execution timing for slice 1 (no real module wiring yet).
const MOCK_STEP_DURATION_MS = 1400;

// Stratification (#2): non-canonical items older than this threshold drift into
// the Compost zone. Canonical items are exempt — they never decay.
const ACTIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function classifyZone(item, now = Date.now()) {
  if (item.canonical) return "canon";
  if (item.archived) return "compost";
  if (item.ts && (now - item.ts) > ACTIVE_THRESHOLD_MS) return "compost";
  return "active";
}

function matchesSearch(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (item.label?.toLowerCase().includes(q)) return true;
  if (item.payload?.steps) {
    const synth = synthesizeRun(item.payload.steps, item.label);
    if (synth.reveal?.toLowerCase().includes(q)) return true;
    if (synth.condition?.toLowerCase().includes(q)) return true;
    if (synth.fieldTypeLabel?.toLowerCase().includes(q)) return true;
  }
  return false;
}

// A scaffold sentence for the Active Signal. Optional — the operator can write
// freely. The bracketed slots map onto the apparatus: [what] feeds Backstage and
// FOA Generator, [why] feeds Art of Model and Playbook, [resistance] feeds Console.
const SIGNAL_TEMPLATE = "I'm working on [what] toward [why]; the resistance is [what won't yield].";

// Renders a structured stub output per module kind. Slice 1.5 — purely shape-honest;
// no real processing. Each branch matches the shape produced by SHAPE_MOCKS in atrium-mocks.js.
function SubstepDetail({ kind, detail }) {
  if (!detail) return null;
  const Row = ({ k, v }) => (
    <div className="atrium-detail-row">
      {k != null && <span className="atrium-detail-key">{k}</span>}
      <span className="atrium-detail-val">{v}</span>
    </div>
  );
  switch (kind) {
    case "backstage":
      return <ul className="atrium-detail-list">{detail.agents.map((a, i) => <li key={i}><Row k={a.name} v={a.take} /></li>)}</ul>;
    case "art-of-model":
      return (
        <div className="atrium-detail-block">
          {detail.steps.map((s, i) => <Row key={i} k={s.title} v={s.text} />)}
          <Row k="Synthesis" v={detail.synthesis} />
        </div>
      );
    case "foa-generator":
      return (
        <div className="atrium-detail-block">
          {["field", "wip", "action", "cache"].map((k) => <Row key={k} k={k} v={detail[k]} />)}
        </div>
      );
    case "exploration-editor":
      return (
        <div className="atrium-detail-block">
          <Row k="Title" v={detail.title} />
          <Row k="Body" v={detail.body} />
          <Row k="Tags" v={detail.tags?.join(" · ")} />
        </div>
      );
    case "breakground":
      return <ul className="atrium-detail-list">{detail.cards.map((c, i) => <li key={i}><Row k={c.kind} v={c.line} /></li>)}</ul>;
    case "console":
      return (
        <div className="atrium-detail-block">
          <div className="atrium-detail-section-label">Active laws</div>
          {detail.activeLaws.map((l, i) => <Row key={i} k={l.name} v={l.reading} />)}
          {detail.tensions?.length > 0 && (
            <>
              <div className="atrium-detail-section-label">Tensions</div>
              {detail.tensions.map((t, i) => <Row key={i} v={t.pair} />)}
            </>
          )}
        </div>
      );
    case "playbook":
      return (
        <div className="atrium-detail-block">
          <div className="atrium-detail-section-label">Pillars</div>
          <Row k="System" v={detail.pillars.system} />
          <Row k="Scenography" v={detail.pillars.scenography} />
          <Row k="Soul" v={detail.pillars.soul} />
          <Row k="Relational" v={detail.pillars.relational} />
          <Row k="Emotion" v={detail.emotion} />
          <div className="atrium-detail-section-label">Application</div>
          <Row k="Big move" v={detail.application.bigMove} />
          <Row k="Whimsy" v={detail.application.whimsy} />
          <Row k="Connection" v={detail.application.connection} />
        </div>
      );
    case "desert":
      return (
        <div className="atrium-detail-block">
          <Row k="Palette" v={detail.palette} />
          <Row k="Density" v={detail.density?.toFixed?.(2) ?? detail.density} />
          <Row k="Mood" v={detail.mood} />
          <Row k="Notes" v={detail.notes} />
        </div>
      );
    case "lab":
      return (
        <div className="atrium-detail-block">
          <Row k="Title" v={detail.title} />
          {detail.sections?.map((s, i) => <Row key={i} k={s.title} v={s.body} />)}
        </div>
      );
    case "grace": {
      const reveal = detail.reveal ?? detail.takeaway;
      const condition = detail.condition ?? detail.reading;
      const failureMode = detail.failureMode ?? detail.tensionsSeen ?? [];
      const nextAgent = detail.nextAgent ?? detail.nextMove;
      return (
        <div className="atrium-detail-block">
          {detail.fieldTypeLabel && <Row k="Field type" v={`${detail.fieldTypeLabel}${detail.fieldTypeSurface ? ` · ${detail.fieldTypeSurface}` : ""}`} />}
          {reveal && <Row k="Reveal" v={reveal} />}
          {condition && <Row k="Condition" v={condition} />}
          {failureMode?.length > 0 && (
            <>
              <div className="atrium-detail-section-label">Failure mode</div>
              {failureMode.map((t, i) => <Row key={i} v={t} />)}
            </>
          )}
          {nextAgent && <Row k="Next agent" v={nextAgent} />}
        </div>
      );
    }
    default:
      return <pre className="atrium-detail-raw">{JSON.stringify(detail, null, 2)}</pre>;
  }
}

export default function Studio({ navigateTo, asu }) {
  const signal = asu?.get_active_signal?.() || "";
  const flow = asu?.get_flow_lane?.() || [];
  const loops = asu?.get_open_loops?.() || [];
  const sequence = asu?.get_sequence?.() || [];
  const currentRun = asu?.get_current_run?.() || null;
  const canonicalRuns = asu?.get_canonical_runs?.() || [];
  const isRunning = !!currentRun;
  const [expandedFlowId, setExpandedFlowId] = useState(null);
  const [expandedSubsteps, setExpandedSubsteps] = useState(() => new Set());
  const [canonContextOn, setCanonContextOn] = useState(true);
  const [excludedCanonIds, setExcludedCanonIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [compostOpen, setCompostOpen] = useState(false);
  const [bundleOpenId, setBundleOpenId] = useState(null);
  const [bundleFormat, setBundleFormat] = useState("json"); // "json" | "markdown"
  const [bundleCopiedId, setBundleCopiedId] = useState(null);

  const onCopyBundle = async (item) => {
    const bundle = buildBundle(item);
    const text = bundleFormat === "markdown" ? bundleToMarkdown(bundle) : JSON.stringify(bundle, null, 2);
    try {
      await navigator.clipboard?.writeText?.(text);
      setBundleCopiedId(item.id);
      setTimeout(() => setBundleCopiedId((id) => (id === item.id ? null : id)), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts; fall back silently.
    }
  };
  const toggleSubstep = (key) => setExpandedSubsteps((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const toggleCanonExclusion = (id) => setExcludedCanonIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Compact canonical context derived from the synthesized form of canonical runs.
  // Passed to each step's runner so modules (especially Grace) can recognize
  // condition repetition across runs.
  const canonContext = (canonContextOn ? canonicalRuns : [])
    .filter((r) => !excludedCanonIds.has(r.id))
    .slice(0, 5)
    .map((r) => {
      const synth = synthesizeRun(r.payload.steps, r.label);
      return {
        signal: r.label,
        reveal: synth.reveal,
        condition: synth.condition,
        fieldType: synth.fieldTypeLabel,
      };
    });

  // Run driver: walks the queued sequence one step at a time. For modules in
  // RUNNABLE_KEYS with an API key set, calls the real LLM. Otherwise falls back
  // to shape-honest mocks. Errors mark the step as "error" but do not halt the
  // run — subsequent steps still execute, since each module is independent.
  useEffect(() => {
    if (!currentRun) return;
    const allDone = currentRun.steps.every((s) => s.status === "done" || s.status === "error");
    if (allDone) {
      asu.complete_run();
      return;
    }
    const runningIdx = currentRun.steps.findIndex((s) => s.status === "running");
    if (runningIdx !== -1) {
      const step = currentRun.steps[runningIdx];
      const priorSteps = currentRun.steps.slice(0, runningIdx).filter((s) => s.status === "done");
      const settings = asu.get_settings?.() || {};
      const useReal = !!settings.apiKey && RUNNABLE_KEYS.has(step.moduleKey);
      let cancelled = false;
      const controller = useReal ? new AbortController() : null;

      const stepCanonContext = currentRun.canonContext || [];

      (async () => {
        try {
          let output;
          if (useReal) {
            output = await runModuleLLM(step.moduleKey, currentRun.signal, priorSteps, settings, { abortSignal: controller.signal, canonContext: stepCanonContext });
          } else {
            await new Promise((r) => setTimeout(r, MOCK_STEP_DURATION_MS));
            output = runMock(step.moduleKey, currentRun.signal, priorSteps, stepCanonContext);
          }
          if (cancelled) return;
          asu.update_run_step(runningIdx, {
            status: "done",
            completedAt: Date.now(),
            output: { ...output, mock: !useReal },
          });
        } catch (err) {
          if (cancelled || err?.name === "AbortError") return;
          asu.update_run_step(runningIdx, {
            status: "error",
            completedAt: Date.now(),
            error: err?.message || String(err),
          });
        }
      })();

      return () => {
        cancelled = true;
        if (controller) controller.abort();
      };
    }
    const nextQueuedIdx = currentRun.steps.findIndex((s) => s.status === "queued");
    if (nextQueuedIdx !== -1) {
      asu.update_run_step(nextQueuedIdx, { status: "running", startedAt: Date.now() });
    }
  }, [currentRun, asu]);

  const onRun = () => {
    if (!sequence.length || isRunning) return;
    asu.start_run(canonContext);
  };
  const canRun = sequence.length > 0 && !isRunning;
  const runningStepIdx = currentRun?.steps.findIndex((s) => s.status === "running") ?? -1;
  const doneCount = currentRun?.steps.filter((s) => s.status === "done").length || 0;

  return (
    <section className="studio-landing en">
      <header className="studio-header">
        <div className="studio-overtitle">Studio · Atrium</div>
        <h1 className="studio-title">Workbench</h1>
        <p className="studio-subtitle">An instrument of coherence — modules grouped by their role in the system.</p>
      </header>

      {/* Active Signal */}
      <div className="atrium-signal en d1">
        <div className="atrium-signal-meta">
          <span className="atrium-signal-tag">Active signal · Field (Read)</span>
          <span className="atrium-signal-hint">Picked modules below run on this signal.</span>
          <button
            type="button"
            className="atrium-signal-template-btn"
            onClick={() => asu?.set_active_signal?.(SIGNAL_TEMPLATE)}
            disabled={isRunning}
            title="Pre-fill the input with a structured template"
          >Use template</button>
        </div>
        <input
          className="atrium-signal-input"
          type="text"
          value={signal}
          onChange={(e) => asu?.set_active_signal?.(e.target.value)}
          placeholder="What are you tracking right now? A question, an obstruction, a hunch."
          aria-label="Active signal"
          disabled={isRunning}
        />
        <div className="atrium-signal-template-hint">
          Template: <em>I'm working on [what] toward [why]; the resistance is [what won't yield].</em> — or write it however you want.
        </div>
      </div>

      {/* Canon Context — Memory layer. Available canonical runs feed into the next run as context. */}
      {canonicalRuns.length > 0 && (
        <div className="atrium-canon-context en d1">
          <div className="atrium-canon-context-header">
            <span className="atrium-canon-context-label">
              Canon context · {canonicalRuns.length} canonical run{canonicalRuns.length === 1 ? "" : "s"}
            </span>
            <span className="atrium-canon-context-hint">
              {canonContextOn
                ? "Available to runnable modules during the next run. Click a chip to exclude."
                : "Off for the next run."}
            </span>
            <button
              type="button"
              className={`atrium-canon-toggle ${canonContextOn ? "atrium-canon-toggle-on" : "atrium-canon-toggle-off"}`}
              onClick={() => setCanonContextOn((v) => !v)}
              disabled={isRunning}
            >
              {canonContextOn ? "On" : "Off"}
            </button>
          </div>
          {canonContextOn && (
            <ul className="atrium-canon-context-list">
              {canonicalRuns.slice(0, 8).map((r) => {
                const synth = synthesizeRun(r.payload.steps, r.label);
                const excluded = excludedCanonIds.has(r.id);
                return (
                  <li key={r.id} className={`atrium-canon-context-item${excluded ? " atrium-canon-context-item-excluded" : ""}`}>
                    <button
                      type="button"
                      className="atrium-canon-context-chip"
                      onClick={() => toggleCanonExclusion(r.id)}
                      disabled={isRunning}
                      title={excluded ? "Click to include in next run" : "Click to exclude from next run"}
                    >
                      <span className="atrium-canon-context-fieldtype">{synth.fieldTypeLabel || "—"}</span>
                      <span className="atrium-canon-context-reveal">{synth.reveal || "(no reveal)"}</span>
                      <span className="atrium-canon-context-state">{excluded ? "excluded" : "included"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Sequence builder */}
      <div className="atrium-sequence en d2">
        <div className="atrium-sequence-header">
          <span className="atrium-sequence-label">Sequence</span>
          <span className="atrium-sequence-desc">
            {isRunning
              ? `Running step ${Math.max(runningStepIdx, doneCount) + 1}/${currentRun.steps.length}…`
              : sequence.length === 0
                ? "Pick modules from the palette to build a run."
                : `${sequence.length} step${sequence.length === 1 ? "" : "s"} queued. Press Run to execute.`}
          </span>
        </div>

        {sequence.length > 0 && (
          <ol className="atrium-sequence-list">
            {sequence.map((moduleKey, i) => {
              const info = MODULE_INFO[moduleKey];
              const step = currentRun?.steps[i];
              const status = step?.status || "idle";
              return (
                <li key={`${moduleKey}-${i}`} className={`atrium-step atrium-step-${status}`}>
                  <span className="atrium-step-idx">{i + 1}</span>
                  <span className="atrium-step-role">{info?.role} · {info?.verb}</span>
                  <span className="atrium-step-label">{info?.label || moduleKey}</span>
                  <span className={`atrium-step-status atrium-step-status-${status}`}>{status}</span>
                  {!isRunning && (
                    <span className="atrium-step-actions">
                      <button type="button" className="atrium-step-btn" onClick={() => asu.move_in_sequence(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button type="button" className="atrium-step-btn" onClick={() => asu.move_in_sequence(i, i + 1)} disabled={i === sequence.length - 1} aria-label="Move down">↓</button>
                      <button type="button" className="atrium-step-btn atrium-step-btn-x" onClick={() => asu.remove_from_sequence(i)} aria-label="Remove from sequence">×</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="atrium-palette">
          <div className="atrium-palette-label">Palette</div>
          <div className="atrium-palette-chips">
            {PALETTE_ORDER.map((key) => {
              const info = MODULE_INFO[key];
              const count = sequence.filter((k) => k === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  className="atrium-palette-chip"
                  onClick={() => asu.add_to_sequence(key)}
                  disabled={isRunning}
                  title={`Add ${info.label} to sequence`}
                >
                  <span className="atrium-palette-chip-role">{info.role}</span>
                  <span className="atrium-palette-chip-label">{info.label}</span>
                  {count > 0 && <span className="atrium-palette-chip-count">×{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="atrium-sequence-controls">
          <button
            type="button"
            className="atrium-run-btn"
            onClick={onRun}
            disabled={!canRun}
          >
            {isRunning ? "Running…" : "Run sequence"}
          </button>
          {!isRunning && sequence.length > 0 && (
            <button type="button" className="atrium-clear-btn" onClick={() => asu.clear_sequence()}>
              Clear
            </button>
          )}
          {isRunning && (
            <button type="button" className="atrium-clear-btn" onClick={() => asu.abort_run()}>
              Abort run
            </button>
          )}
        </div>
        <div className="atrium-sequence-note">
          {asu?.get_settings?.()?.apiKey
            ? "Backstage, Art of Model, FOA Generator, and Grace call the real LLM. Other modules use shape-honest mocks until slice 3."
            : "No API key set — all modules use shape-honest mocks. Add a key in Backstage → Settings to wire the runnable four (Backstage, Art of Model, FOA Generator, Grace)."}
        </div>
      </div>

      {/* Three rings — map of the apparatus (navigation, not orchestration) */}
      {RINGS.map((ring, ri) => {
        const cards = ringCards(ring);
        return (
          <div key={ring.key} className={`atrium-ring en d${Math.min(ri + 2, 5)}`}>
            <div className="atrium-ring-header">
              <span className="atrium-ring-label">{ring.label}</span>
              <span className="atrium-ring-desc">{ring.desc}</span>
            </div>
            <div className="studio-grid">
              {cards.map((c, i) => {
                const stagger = `d${Math.min(i + 1, 5)}`;
                if (c.kind === "module") {
                  return (
                    <button key={c.key} className={`studio-card en ${stagger}`} onClick={() => navigateTo(c.key)}>
                      <div className="studio-card-seat">{c.seat}</div>
                      <div className="studio-card-label">{c.label}</div>
                      <div className="studio-card-desc">{c.desc}</div>
                      <span className="studio-card-arrow">→</span>
                    </button>
                  );
                }
                return (
                  <div key={c.key} className={`studio-card studio-card-${c.kind} en ${stagger}`} aria-disabled="true">
                    <div className="studio-card-seat">{c.seat}</div>
                    <div className="studio-card-label">{c.label}</div>
                    <div className="studio-card-desc">{c.desc}</div>
                    {c.kind === "open" && <span className="studio-card-arrow">↳ to be designed</span>}
                    {c.kind === "action" && <span className="studio-card-arrow">↳ Flow Lane action</span>}
                    {c.kind === "atrium-only" && <span className="studio-card-arrow">↳ runs in Atrium sequence</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Flow Lane — three-zone stratification: Canon · Active · Compost */}
      {(() => {
        const now = Date.now();
        const filtered = flow.filter((it) => matchesSearch(it, searchQuery));
        const canonItems = filtered.filter((it) => classifyZone(it, now) === "canon");
        const activeItems = filtered.filter((it) => classifyZone(it, now) === "active");
        const compostItems = filtered.filter((it) => classifyZone(it, now) === "compost");

        const renderChip = (item) => {
              const isRun = item.source === "Run" && item.payload?.steps;
              const isExpanded = expandedFlowId === item.id;
              const synth = isRun ? synthesizeRun(item.payload.steps, item.label) : null;
              const zone = classifyZone(item, now);
              return (
                <div key={item.id} className={`atrium-flow-chip${isRun ? " atrium-flow-chip-run" : ""}${isExpanded ? " atrium-flow-chip-expanded" : ""}${item.canonical ? " atrium-flow-chip-canonical" : ""}`}>
                  <div
                    className="atrium-flow-chip-header"
                    title={new Date(item.ts).toLocaleString()}
                  >
                    <span className="atrium-flow-chip-source">{item.source}{isRun && item.payload?.steps ? ` · ${item.payload.steps.length} steps` : ""}</span>
                    <span className="atrium-flow-chip-label">{item.label}</span>
                  </div>
                  <button
                    type="button"
                    className="atrium-flow-chip-x"
                    onClick={() => asu?.clear_flow_artifact?.(item.id)}
                    aria-label="Remove artifact from flow lane"
                  >×</button>
                  {isRun && synth && (
                    <div className={`atrium-flow-chip-synthesis atrium-flow-chip-synthesis-${synth.source}`}>
                      <div className="atrium-flow-chip-synthesis-label">
                        Field-direction {synth.source === "auto" ? "· auto (no Grace step)" : "· from Grace"}
                        {synth.fieldTypeLabel && (
                          <span className="atrium-flow-chip-synthesis-fieldtype"> · {synth.fieldTypeLabel}</span>
                        )}
                      </div>
                      {synth.reveal && (
                        <div className="atrium-flow-chip-synthesis-takeaway">{synth.reveal}</div>
                      )}
                      <p className="atrium-flow-chip-synthesis-text">{synth.condition}</p>
                      {synth.failureMode?.length > 0 && (
                        <>
                          <div className="atrium-flow-chip-synthesis-sublabel">Failure mode</div>
                          <ul className="atrium-flow-chip-synthesis-tensions">
                            {synth.failureMode.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </>
                      )}
                      {synth.nextAgent && (
                        <div className="atrium-flow-chip-synthesis-next">
                          <span className="atrium-flow-chip-synthesis-sublabel">Next agent</span>
                          <span className="atrium-flow-chip-synthesis-next-text">{synth.nextAgent}</span>
                        </div>
                      )}
                      {synth.fieldTypeSurface && synth.source === "grace" && (
                        <div className="atrium-flow-chip-synthesis-surface">
                          <span className="atrium-flow-chip-synthesis-sublabel">Surface</span>
                          <span className="atrium-flow-chip-synthesis-surface-text">{synth.fieldTypeSurface}</span>
                        </div>
                      )}
                      <div className="atrium-flow-chip-synthesis-actions">
                        {item.canonical ? (
                          <>
                            <div className="atrium-canonical-badge">
                              <span className="atrium-canonical-mark">● CANONICAL</span>
                              <span className="atrium-canonical-ts">committed {new Date(item.canonicalAt).toLocaleString()}</span>
                              <button
                                type="button"
                                className="atrium-canonical-undo"
                                onClick={() => asu?.revert_canon?.(item.id)}
                              >undo</button>
                            </div>
                            <button
                              type="button"
                              className="atrium-export-btn"
                              onClick={() => setBundleOpenId(bundleOpenId === item.id ? null : item.id)}
                            >{bundleOpenId === item.id ? "− Hide bundle" : "+ Export bundle"}</button>
                          </>
                        ) : zone === "compost" ? (
                          <button
                            type="button"
                            className="atrium-restore-btn"
                            onClick={() => asu?.restore_artifact?.(item.id)}
                          >Restore from Compost</button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="atrium-promote-btn"
                              onClick={() => asu?.commit_to_canon?.(item.id)}
                            >Promote to canon · Freedom Embassy</button>
                            <button
                              type="button"
                              className="atrium-archive-btn"
                              onClick={() => asu?.archive_artifact?.(item.id)}
                              title="Move to Compost"
                            >Archive</button>
                          </>
                        )}
                      </div>
                      {item.canonical && bundleOpenId === item.id && (() => {
                        const bundle = buildBundle(item);
                        const text = bundleFormat === "markdown" ? bundleToMarkdown(bundle) : JSON.stringify(bundle, null, 2);
                        return (
                          <div className="atrium-bundle-panel">
                            <div className="atrium-bundle-panel-header">
                              <span className="atrium-bundle-panel-label">Field-direction bundle · field-direction-bundle/v1</span>
                              <div className="atrium-bundle-format">
                                <button
                                  type="button"
                                  className={`atrium-bundle-format-btn${bundleFormat === "json" ? " on" : ""}`}
                                  onClick={() => setBundleFormat("json")}
                                >JSON</button>
                                <button
                                  type="button"
                                  className={`atrium-bundle-format-btn${bundleFormat === "markdown" ? " on" : ""}`}
                                  onClick={() => setBundleFormat("markdown")}
                                >Markdown</button>
                              </div>
                              <button
                                type="button"
                                className="atrium-bundle-copy-btn"
                                onClick={() => onCopyBundle(item)}
                              >{bundleCopiedId === item.id ? "✓ Copied" : "Copy"}</button>
                            </div>
                            <pre className="atrium-bundle-body">{text}</pre>
                            <div className="atrium-bundle-hint">
                              Paste into Flora / Runway / a Public draft entry / any downstream tool. The Atrium upstreams; the production tool receives.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {isRun && (
                    <button
                      type="button"
                      className="atrium-flow-chip-trace-toggle"
                      onClick={() => setExpandedFlowId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? "− Hide trace" : "+ Show trace"} <span className="atrium-flow-chip-trace-count">({item.payload.steps.length} steps)</span>
                    </button>
                  )}
                  {isRun && isExpanded && (
                    <ol className="atrium-flow-substeps">
                      {item.payload.steps.map((s, i) => {
                        const info = MODULE_INFO[s.moduleKey];
                        const subKey = `${item.id}.${i}`;
                        const subOpen = expandedSubsteps.has(subKey);
                        const hasDetail = !!s.output?.detail;
                        return (
                          <li key={i} className={`atrium-flow-substep atrium-flow-substep-${s.status}${subOpen ? " atrium-flow-substep-open" : ""}`}>
                            <button
                              type="button"
                              className="atrium-flow-substep-row"
                              onClick={() => hasDetail && toggleSubstep(subKey)}
                              disabled={!hasDetail}
                            >
                              <span className="atrium-flow-substep-idx">{i + 1}</span>
                              <span className="atrium-flow-substep-label">{info?.label || s.moduleKey}</span>
                              <span className="atrium-flow-substep-output">{s.output?.summary || s.error || "—"}</span>
                              {hasDetail && <span className="atrium-flow-substep-toggle">{subOpen ? "−" : "+"}</span>}
                            </button>
                            {subOpen && hasDetail && (
                              <div className="atrium-flow-substep-detail">
                                <SubstepDetail kind={s.output.kind} detail={s.output.detail} />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              );
        };

        return (
          <div className="atrium-flow en d5">
            <div className="atrium-flow-header">
              <span className="atrium-flow-label">Flow lane</span>
              <span className="atrium-flow-desc">Canon · Active · Compost</span>
              <input
                type="search"
                className="atrium-flow-search"
                placeholder="Search runs (signal, reveal, condition, field type)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {flow.length === 0 ? (
              <div className="atrium-flow-empty">No artifacts yet. Run a sequence to populate.</div>
            ) : (
              <>
                {/* Canon zone — always visible */}
                <div className="atrium-flow-zone atrium-flow-zone-canon">
                  <div className="atrium-flow-zone-header">
                    <span className="atrium-flow-zone-label">Canon</span>
                    <span className="atrium-flow-zone-count">{canonItems.length}</span>
                    <span className="atrium-flow-zone-hint">Committed Field-directions. Durable across decay.</span>
                  </div>
                  <div className="atrium-flow-track">
                    {canonItems.length === 0
                      ? <div className="atrium-flow-empty">No canonical runs yet. Promote a run from Active to land here.</div>
                      : canonItems.map(renderChip)}
                  </div>
                </div>

                {/* Active zone — recent non-canonical runs */}
                <div className="atrium-flow-zone atrium-flow-zone-active">
                  <div className="atrium-flow-zone-header">
                    <span className="atrium-flow-zone-label">Active</span>
                    <span className="atrium-flow-zone-count">{activeItems.length}</span>
                    <span className="atrium-flow-zone-hint">Recent runs. Promote to Canon, or Archive to Compost.</span>
                  </div>
                  <div className="atrium-flow-track">
                    {activeItems.length === 0
                      ? <div className="atrium-flow-empty">No active runs.</div>
                      : activeItems.map(renderChip)}
                  </div>
                </div>

                {/* Compost zone — archived or aged-out */}
                {compostItems.length > 0 && (
                  <div className="atrium-flow-zone atrium-flow-zone-compost">
                    <button
                      type="button"
                      className="atrium-flow-zone-header atrium-flow-zone-header-clickable"
                      onClick={() => setCompostOpen((v) => !v)}
                    >
                      <span className="atrium-flow-zone-label">Compost</span>
                      <span className="atrium-flow-zone-count">{compostItems.length}</span>
                      <span className="atrium-flow-zone-hint">Archived or aged out. Restorable.</span>
                      <span className="atrium-flow-zone-toggle">{compostOpen ? "−" : "+"}</span>
                    </button>
                    {compostOpen && (
                      <div className="atrium-flow-track">
                        {compostItems.map(renderChip)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Open Loops — Track role. Stub until any module logs one. */}
      {loops.length > 0 && (
        <div className="atrium-loops en d5">
          <div className="atrium-flow-header">
            <span className="atrium-flow-label">Open loops</span>
            <span className="atrium-flow-desc">Unfinished work across modules.</span>
          </div>
          <ul className="atrium-loops-list">
            {loops.map((l) => (
              <li key={l.id} className="atrium-loops-item">
                <span className="atrium-loops-source">{l.source || "—"}</span>
                <span className="atrium-loops-label">{l.label}</span>
                <button
                  type="button"
                  className="atrium-loops-close"
                  onClick={() => asu?.close_open_loop?.(l.id)}
                >close</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
