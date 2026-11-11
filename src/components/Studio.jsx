import React, { useEffect, useState } from "react";
import { runMock, synthesizeRun } from "../data/atrium-mocks";
import { runModuleLLM, RUNNABLE_KEYS, buildContextString } from "../lib/atrium-runners";
import { buildBundle, bundleToMarkdown } from "../lib/atrium-bundle";
import SubstepDetail from "./WorkbenchReadingDetail";
import "../styles/workbench.css";

// The Workbench holds signals open. A signal is one line the operator is
// tracking; it stays in Held until they let it settle. Tools read a held
// signal, and each reading attaches to it. Grace reads across the others and
// may withhold ("Not yet"), which is a result, not a failure.

// Every Workshop tool, as an index. Each opens on its own page.
const TOOLS = [
  { key: "breakground", label: "Breakground", line: "Seven questions before the work begins." },
  { key: "desert", label: "Desert", line: "The same seven fields, with no guide." },
  { key: "model", label: "Art of Model", line: "Reads a signal for origin, field, counter and form." },
  { key: "console", label: "Console", line: "Seven laws, and what happens between any two." },
  { key: "playbook", label: "Playbook", line: "Four pillars and an emotional register, set as a brief." },
  { key: "backstage", label: "Backstage", line: "One idea, read by eight agents." },
  { key: "foa", label: "FOA Generator", line: "Typographic artifacts from a single idea." },
  { key: "editor", label: "Exploration Editor", line: "Drafts that are allowed to stay drafts." },
  { key: "lab", label: "Incandescent Lab", line: "Finished runs, shown as process." },
];

// The tools that can read a held signal from here, in the order they run.
// Grace is last because it reads the others.
const READERS = [
  { key: "model", label: "Art of Model" },
  { key: "backstage", label: "Backstage" },
  { key: "foa", label: "FOA Generator" },
  { key: "grace", label: "Grace" },
];
const READER_LABEL = {
  ...Object.fromEntries(TOOLS.map((t) => [t.key, t.label])),
  ...Object.fromEntries(READERS.map((r) => [r.key, r.label])),
};

const SAMPLE_STEP_MS = 1400;
const EARLIER_READINGS_LIMIT = 5;
const EARLIER_READING_CHARS = 1500;

function dayLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: "long", day: "numeric" } : { month: "long", day: "numeric", year: "numeric" });
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function readersOf(readings) {
  const seen = [];
  readings.forEach((r) => (r.payload?.steps || []).forEach((s) => {
    const label = READER_LABEL[s.moduleKey] || s.moduleKey;
    if (!seen.includes(label)) seen.push(label);
  }));
  return seen;
}

function isSample(reading) {
  return (reading.payload?.steps || []).some((s) => s.output?.mock);
}

// One reading, set as text. Grace's take leads when Grace was part of it.
function Reading({ reading, asu, onCopy, copied }) {
  const [open, setOpen] = useState(false);
  const steps = reading.payload?.steps || [];
  const synth = synthesizeRun(steps, reading.label);
  const hasGrace = synth.source === "grace";
  const names = joinNames(steps.map((s) => READER_LABEL[s.moduleKey] || s.moduleKey));

  return (
    <div className="wb-reading">
      {hasGrace ? (
        <div className={`wb-grace${synth.notYet ? " wb-grace-notyet" : ""}`}>
          <p className="wb-name">Grace</p>
          <p className="wb-reveal">{synth.notYet ? "Not yet." : synth.reveal}</p>
        </div>
      ) : null}

      {hasGrace && synth.condition ? <p className="wb-body wb-measure">{synth.condition}</p> : null}
      {!hasGrace ? <p className="wb-body wb-measure">Read by {names}. Grace was not part of this reading, so nothing has been named.</p> : null}

      {hasGrace && !synth.notYet && synth.failureMode?.length > 0 ? (
        <div className="wb-block">
          <p className="wb-name">What would make this fail</p>
          {synth.failureMode.map((t, i) => <p key={i} className="wb-body wb-measure">{t}</p>)}
        </div>
      ) : null}
      {hasGrace && !synth.notYet && synth.nextAgent ? (
        <div className="wb-block">
          <p className="wb-name">What acts next</p>
          <p className="wb-body wb-measure">{synth.nextAgent}</p>
        </div>
      ) : null}
      {hasGrace && !synth.notYet && synth.fieldTypeLabel ? (
        <p className="wb-body">It wants to land as a {synth.fieldTypeLabel}{synth.fieldTypeSurface ? `, on ${synth.fieldTypeSurface}` : ""}.</p>
      ) : null}

      {isSample(reading) ? <p className="wb-body">Sample text, not a reading. Add a key in Backstage to read with the model.</p> : null}
      {reading.canonical ? <p className="wb-body">Kept as canon {dayLabel(reading.canonicalAt)}.</p> : null}

      <div className="wb-actions">
        <button type="button" className="wb-link" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Hide the full reading" : "Show the full reading"}
        </button>
        {hasGrace && !synth.notYet && !reading.canonical ? (
          <button type="button" className="wb-link" onClick={() => asu.commit_to_canon(reading.id)}>Keep as canon</button>
        ) : null}
        {reading.canonical ? (
          <button type="button" className="wb-link" onClick={() => asu.revert_canon(reading.id)}>Remove from canon</button>
        ) : null}
        {!reading.canonical ? (
          <button type="button" className="wb-link" onClick={() => asu.clear_flow_artifact(reading.id)}>Remove this reading</button>
        ) : null}
      </div>

      {open ? (
        <div className="wb-trace">
          {steps.map((s, i) => (
            <div key={i} className="wb-trace-step">
              <p className="wb-name">{READER_LABEL[s.moduleKey] || s.moduleKey}</p>
              {s.status === "error" ? <p className="wb-body">This tool failed: {s.error}</p> : null}
              {s.output?.detail ? <SubstepDetail kind={s.output.kind} detail={s.output.detail} /> : null}
            </div>
          ))}
          {reading.canonical ? (
            <div className="wb-actions">
              <button type="button" className="wb-link" onClick={() => onCopy(reading, "markdown")}>
                {copied === `${reading.id}:markdown` ? "Copied" : "Copy as Markdown"}
              </button>
              <button type="button" className="wb-link" onClick={() => onCopy(reading, "json")}>
                {copied === `${reading.id}:json` ? "Copied" : "Copy as JSON"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function Studio({ navigateTo, asu }) {
  const signals = asu?.get_signals?.() || [];
  const flow = asu?.get_flow_lane?.() || [];
  const currentRun = asu?.get_current_run?.() || null;
  const canonicalRuns = asu?.get_canonical_runs?.() || [];
  const hasKey = !!asu?.get_settings?.()?.apiKey;
  const isRunning = !!currentRun;

  const [tab, setTab] = useState("held");
  const [draft, setDraft] = useState("");
  const [pickerFor, setPickerFor] = useState(null);
  const [picked, setPicked] = useState(() => new Set(["grace"]));
  const [useCanon, setUseCanon] = useState(true);
  const [excludedCanonIds, setExcludedCanonIds] = useState(() => new Set());
  const [earlierOpen, setEarlierOpen] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);

  const held = signals.filter((s) => !s.settledAt);
  const settled = signals.filter((s) => s.settledAt).sort((a, b) => b.settledAt - a.settledAt);
  const signalIds = new Set(signals.map((s) => s.id));
  // Runs made before signals existed, or whose signal was deleted.
  const earlierRuns = flow.filter((it) => it.payload?.steps && (!it.signalId || !signalIds.has(it.signalId)));
  const readingsFor = (id) => flow.filter((it) => it.signalId === id && it.payload?.steps);
  const isEmpty = signals.length === 0 && earlierRuns.length === 0;

  const canonContext = (useCanon ? canonicalRuns : [])
    .filter((r) => !excludedCanonIds.has(r.id))
    .slice(0, 5)
    .map((r) => {
      const synth = synthesizeRun(r.payload.steps, r.label);
      return { signal: r.label, reveal: synth.reveal, condition: synth.condition, fieldType: synth.fieldTypeLabel };
    });

  // Walks the reading one tool at a time. Tools in RUNNABLE_KEYS call the model
  // when a key is set; otherwise they return sample text, which the reading is
  // labelled with. A failed tool is recorded and the rest still run.
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
            output = await runModuleLLM(step.moduleKey, currentRun.signal, priorSteps, settings, {
              abortSignal: controller.signal,
              canonContext: stepCanonContext,
              earlierReadings: currentRun.earlierReadings || [],
            });
          } else {
            await new Promise((r) => setTimeout(r, SAMPLE_STEP_MS));
            output = runMock(step.moduleKey, currentRun.signal, priorSteps, stepCanonContext);
          }
          if (cancelled) return;
          asu.update_run_step(runningIdx, { status: "done", completedAt: Date.now(), output: { ...output, mock: !useReal } });
        } catch (err) {
          if (cancelled || err?.name === "AbortError") return;
          asu.update_run_step(runningIdx, { status: "error", completedAt: Date.now(), error: err?.message || String(err) });
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

  const onHold = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    asu.hold_signal(draft);
    setDraft("");
    setTab("held");
  };

  const togglePicked = (key) => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const toggleCanonExclusion = (id) => setExcludedCanonIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleEarlier = (id) => setEarlierOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const onRead = (signal) => {
    const sequence = READERS.map((r) => r.key).filter((k) => picked.has(k));
    if (!sequence.length || isRunning) return;
    // Oldest first, so the model can see what has and has not repeated.
    const earlierReadings = readingsFor(signal.id)
      .slice(0, EARLIER_READINGS_LIMIT)
      .reverse()
      .map((r) => `Reading from ${new Date(r.ts).toLocaleDateString()}:\n${buildContextString(r.payload.steps).slice(0, EARLIER_READING_CHARS)}`);
    asu.start_run(canonContext, { signalId: signal.id, signal: signal.text, sequence, earlierReadings });
    setPickerFor(null);
  };

  // Breakground and Desert have their own pages. The signal goes with you,
  // and what you answer there comes back as a reading on it.
  const onCarry = (signal, toolKey) => {
    asu.carry_signal(signal);
    setPickerFor(null);
    navigateTo(toolKey);
  };

  const onCopy = async (reading, format) => {
    const bundle = buildBundle(reading);
    const text = format === "markdown" ? bundleToMarkdown(bundle) : JSON.stringify(bundle, null, 2);
    try {
      await navigator.clipboard?.writeText?.(text);
      const mark = `${reading.id}:${format}`;
      setCopied(mark);
      setTimeout(() => setCopied((c) => (c === mark ? null : c)), 1800);
    } catch {
      // Clipboard can be unavailable in restricted contexts.
    }
  };

  const q = search.trim().toLowerCase();
  const matches = (text, readings) => {
    if (!q) return true;
    if (text?.toLowerCase().includes(q)) return true;
    return readings.some((r) => {
      const synth = synthesizeRun(r.payload.steps, r.label);
      return [synth.reveal, synth.condition, synth.fieldTypeLabel].some((v) => v?.toLowerCase().includes(q));
    });
  };

  const signalForm = (
    <form className={`wb-signal${isEmpty ? " wb-signal-open" : ""}`} onSubmit={onHold}>
      <label htmlFor="wb-signal-input" className="wb-label">What are you tracking right now?</label>
      <div className="wb-signal-row">
        {isEmpty ? (
          // Before anything is held the line is large, so it is a textarea
          // that wraps. Enter holds the signal, as it does in the one-line field.
          <textarea
            id="wb-signal-input"
            className="wb-field"
            rows={2}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value.replace(/\n/g, " "));
              // Grow with the text so a long signal is never clipped.
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => { if (e.key === "Enter") onHold(e); }}
            placeholder="A question, an obstruction, a hunch"
          />
        ) : (
          <input
            id="wb-signal-input"
            className="wb-field"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="A question, an obstruction, a hunch"
            autoComplete="off"
          />
        )}
        {draft.trim() ? <button type="submit" className="wb-button">Hold</button> : null}
      </div>
    </form>
  );

  const toolsIndex = (
    <section className="wb-tools" aria-label="Tools">
      {TOOLS.map((t) => (
        <button key={t.key} type="button" className="wb-tool" onClick={() => navigateTo(t.key)}>
          <span className="wb-tool-name">{t.label}</span>
          <span className="wb-tool-line">{t.line}</span>
        </button>
      ))}
    </section>
  );

  const picker = (signal) => (
    <div className="wb-picker">
      <fieldset className="wb-fieldset">
        <legend className="wb-name">Read it with</legend>
        {READERS.map((r) => (
          <label key={r.key} className="wb-check">
            <input type="checkbox" checked={picked.has(r.key)} onChange={() => togglePicked(r.key)} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="wb-body wb-measure">Grace reads the others and this signal's earlier readings. It can answer "Not yet."</p>
      {canonicalRuns.length > 0 ? (
        <fieldset className="wb-fieldset">
          <label className="wb-check">
            <input type="checkbox" checked={useCanon} onChange={() => setUseCanon((v) => !v)} />
            <span>Let the tools see what is kept as canon</span>
          </label>
          {useCanon ? canonicalRuns.slice(0, 8).map((r) => (
            <label key={r.id} className="wb-check wb-check-nested">
              <input type="checkbox" checked={!excludedCanonIds.has(r.id)} onChange={() => toggleCanonExclusion(r.id)} />
              <span>{synthesizeRun(r.payload.steps, r.label).reveal || r.label}</span>
            </label>
          )) : null}
        </fieldset>
      ) : null}
      {!hasKey ? (
        <p className="wb-body wb-measure">
          No key is set, so this will produce sample text.{" "}
          <button type="button" className="wb-link wb-link-inline" onClick={() => navigateTo("backstage")}>Add one in Backstage</button>
        </p>
      ) : null}
      <div className="wb-actions">
        <button type="button" className="wb-button" onClick={() => onRead(signal)} disabled={picked.size === 0 || isRunning}>Read</button>
        <button type="button" className="wb-link" onClick={() => setPickerFor(null)}>Cancel</button>
      </div>
      <div className="wb-block">
        <p className="wb-name">Or take it into</p>
        <div className="wb-actions">
          <button type="button" className="wb-link" onClick={() => onCarry(signal, "breakground")}>Breakground</button>
          <button type="button" className="wb-link" onClick={() => onCarry(signal, "desert")}>Desert</button>
        </div>
      </div>
    </div>
  );

  const heldItem = (signal) => {
    const readings = readingsFor(signal.id);
    const [latest, ...older] = readings;
    const readers = readersOf(readings);
    const running = currentRun?.signalId === signal.id ? currentRun : null;
    const runningStep = running?.steps.find((s) => s.status === "running") || running?.steps.find((s) => s.status === "queued");
    const showOlder = earlierOpen.has(signal.id);
    return (
      <article key={signal.id} className="wb-item">
        <span className="wb-mark" aria-hidden="true" />
        <div className="wb-item-body">
          <h2 className="wb-headline">{signal.text}</h2>
          <p className="wb-body">
            Held since {dayLabel(signal.ts)}.{readers.length ? ` Read by ${joinNames(readers)}.` : ""}
          </p>

          {running ? (
            <div className="wb-actions" role="status">
              <p className="wb-body">Reading with {READER_LABEL[runningStep?.moduleKey] || "the tools"}.</p>
              <button type="button" className="wb-link" onClick={() => asu.abort_run()}>Stop</button>
            </div>
          ) : null}

          {latest ? <Reading reading={latest} asu={asu} onCopy={onCopy} copied={copied} /> : null}

          {older.length > 0 ? (
            <div className="wb-older">
              <button type="button" className="wb-link" aria-expanded={showOlder} onClick={() => toggleEarlier(signal.id)}>
                {showOlder ? "Hide earlier readings" : "Show earlier readings"}
              </button>
              {showOlder ? older.map((r) => (
                <div key={r.id} className="wb-older-item">
                  <p className="wb-body">Read {dayLabel(r.ts)}</p>
                  <Reading reading={r} asu={asu} onCopy={onCopy} copied={copied} />
                </div>
              )) : null}
            </div>
          ) : null}

          {pickerFor === signal.id ? picker(signal) : (
            <div className="wb-actions">
              <button type="button" className="wb-link" onClick={() => setPickerFor(signal.id)} disabled={isRunning}>Read it with a tool</button>
              <button type="button" className="wb-link" onClick={() => asu.settle_signal(signal.id)} disabled={!!running}>Let it settle</button>
            </div>
          )}
        </div>
      </article>
    );
  };

  const settledItem = (signal) => {
    const readings = readingsFor(signal.id);
    if (!matches(signal.text, readings)) return null;
    const showOlder = earlierOpen.has(signal.id);
    return (
      <article key={signal.id} className="wb-item wb-item-settled">
        <div className="wb-item-body">
          <h2 className="wb-settled-line">{signal.text}</h2>
          <p className="wb-body">Settled {dayLabel(signal.settledAt)}. Held from {dayLabel(signal.ts)}.</p>
          {readings.length > 0 ? (
            <div className="wb-older">
              <button type="button" className="wb-link" aria-expanded={showOlder} onClick={() => toggleEarlier(signal.id)}>
                {showOlder ? "Hide its readings" : "Show its readings"}
              </button>
              {showOlder ? readings.map((r) => (
                <div key={r.id} className="wb-older-item">
                  <p className="wb-body">Read {dayLabel(r.ts)}</p>
                  <Reading reading={r} asu={asu} onCopy={onCopy} copied={copied} />
                </div>
              )) : null}
            </div>
          ) : null}
          <div className="wb-actions">
            <button type="button" className="wb-link" onClick={() => { asu.reopen_signal(signal.id); setTab("held"); }}>Hold it again</button>
            <button type="button" className="wb-link" onClick={() => asu.remove_signal(signal.id)}>Delete</button>
          </div>
        </div>
      </article>
    );
  };

  if (isEmpty) {
    return (
      <section className="wb wb-empty">
        <header className="wb-header">
          <h1 className="wb-title">Workbench</h1>
          <button type="button" className="wb-link" aria-expanded={tab === "tools"} onClick={() => setTab(tab === "tools" ? "held" : "tools")}>
            {tab === "tools" ? "Close tools" : "Tools"}
          </button>
        </header>
        {tab === "tools" ? toolsIndex : signalForm}
      </section>
    );
  }

  const visibleSettled = settled.map(settledItem).filter(Boolean);
  const visibleEarlier = earlierRuns.filter((r) => matches(r.label, [r]));

  return (
    <section className="wb">
      <header className="wb-header">
        <h1 className="wb-title">Workbench</h1>
        <nav className="wb-segments" aria-label="Workbench sections">
          {[["held", "Held"], ["settled", "Settled"], ["tools", "Tools"]].map(([key, label]) => (
            <button key={key} type="button" className="wb-segment" aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>
      </header>

      {tab === "held" ? signalForm : null}

      {tab === "held" ? (
        <section className="wb-list" aria-label="Held">
          {held.length === 0 ? <p className="wb-body">Nothing is being held.</p> : held.map(heldItem)}
        </section>
      ) : null}

      {tab === "settled" ? (
        <section className="wb-list wb-list-settled" aria-label="Settled">
          <div className="wb-search">
            <label htmlFor="wb-search-input" className="wb-label">Search what has settled</label>
            <input id="wb-search-input" className="wb-field" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {visibleSettled}
          {visibleEarlier.length > 0 ? (
            <div className="wb-earlier-runs">
              <h2 className="wb-name">Runs from before signals could be held</h2>
              {visibleEarlier.map((r) => (
                <article key={r.id} className="wb-item wb-item-settled">
                  <div className="wb-item-body">
                    <h2 className="wb-settled-line">{r.label}</h2>
                    <p className="wb-body">Read {dayLabel(r.ts)}</p>
                    <Reading reading={r} asu={asu} onCopy={onCopy} copied={copied} />
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {visibleSettled.length === 0 && visibleEarlier.length === 0 ? (
            <p className="wb-body">{q ? "Nothing settled matches that." : "Nothing has settled yet."}</p>
          ) : null}
        </section>
      ) : null}

      {tab === "tools" ? toolsIndex : null}
    </section>
  );
}
