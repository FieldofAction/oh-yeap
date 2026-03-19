import { useState, useCallback, useRef, useEffect } from "react";

/* ── Breakground Card — Field Orientation System (Manual Mode) ── */

const QUESTIONS = [
  {
    id: "fieldCondition",
    number: "01",
    title: "What is the field condition?",
    sub: "What atmosphere or state is needed here?",
    placeholder: "calm, charged, spacious, ceremonial, invitational, investigative, tense, intimate, catalytic…",
  },
  {
    id: "centralRelationship",
    number: "02",
    title: "What relationship is central?",
    sub: "What relation is being shaped?",
    placeholder: "audience ↔ message, person ↔ interface, brand ↔ world, image ↔ feeling, system ↔ attention…",
  },
  {
    id: "tensionHeld",
    number: "03",
    title: "What tension must be held?",
    sub: "What polarity should not collapse?",
    placeholder: "clarity / expression, beauty / utility, structure / openness, stillness / motion, coherence / surprise…",
  },
  {
    id: "beauty",
    number: "04",
    title: "What would beauty be here?",
    sub: "How would resonance show up in this field?",
    placeholder: "rhythm without rigidity, clarity without sterility, elegance without performance, energy without noise…",
  },
  {
    id: "structureDecided",
    number: "05",
    title: "What needs structure now?",
    sub: "What should be decided early?",
    placeholder: "hierarchy, mode, grid, narrative order, tone range, pacing, component logic…",
  },
  {
    id: "remainingOpen",
    number: "06",
    title: "What needs room to breathe?",
    sub: "Of what's emerging, which qualities aren't ready to be fixed?",
    placeholder: "final image, color temperature, motion behavior, metaphor, copy phrasing, sequence logic…",
  },
  {
    id: "firstEmbodiedMove",
    number: "07",
    title: "What is the first embodied move?",
    sub: "What action proves alignment has taken form?",
    placeholder: "collect references, write a one-line intention, define three tonal directions, build one valid state…",
  },
];

/* ── Utility: generate ISO timestamp ── */
const ts = () => new Date().toISOString();

/* ── Utility: simple unique ID ── */
const genId = () => `fos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ── Local storage helpers ── */
const STORAGE_KEY = "fos-orientations";

function loadOrientations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOrientations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ── Export helpers ── */
function exportJSON(orientation) {
  const blob = new Blob([JSON.stringify(orientation, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${orientation.project || "orientation"}-${orientation.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportMarkdown(orientation) {
  const c = orientation.card;
  const md = `# Field Orientation Summary

**Project:** ${orientation.project || "Untitled"}
**Date:** ${new Date(orientation.timestamp).toLocaleDateString()}
**Mode:** ${orientation.mode}

---

## Field condition
${c.fieldCondition || "—"}

## Central relationship
${c.centralRelationship || "—"}

## Tension held
${c.tensionHeld || "—"}

## Beauty
${c.beauty || "—"}

## Structure decided
${c.structureDecided || "—"}

## Remaining open
${c.remainingOpen || "—"}

## First embodied move
${c.firstEmbodiedMove || "—"}
`;
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${orientation.project || "orientation"}-summary.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Sub-components ── */

function QuestionField({ q, value, onChange, focused, onFocus }) {
  const ref = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  const filled = value && value.trim().length > 0;

  return (
    <div
      className={`bg-question${focused ? " bg-question--focused" : ""}${filled ? " bg-question--filled" : ""}`}
      onClick={() => ref.current?.focus()}
    >
      <div className="bg-question-head">
        <span className="bg-question-num">{q.number}</span>
        <span className="bg-question-title">{q.title}</span>
      </div>
      <div className="bg-question-sub">{q.sub}</div>
      <textarea
        ref={ref}
        className="bg-question-input"
        value={value}
        onChange={(e) => onChange(q.id, e.target.value)}
        onFocus={() => onFocus(q.id)}
        placeholder={q.placeholder}
        rows={1}
      />
      {q.id === "firstEmbodiedMove" && (
        <div className="bg-question-note">
          This last question matters most. Embodied action precedes alignment.
        </div>
      )}
    </div>
  );
}

function SummaryView({ orientation, onBack, onExportJSON, onExportMD }) {
  const c = orientation.card;
  const fields = QUESTIONS.map((q) => ({
    label: q.title.replace("What is the ", "").replace("What ", "").replace("?", ""),
    value: c[q.id],
  }));
  const filledCount = QUESTIONS.filter((q) => c[q.id]?.trim()).length;

  return (
    <div className="bg-summary en">
      <div className="bg-summary-header">
        <button className="bg-btn bg-btn--ghost" onClick={onBack}>← Back to card</button>
        <div className="bg-summary-meta">
          <span className="bg-meta-label">{orientation.project || "Untitled"}</span>
          <span className="bg-meta-sep">·</span>
          <span className="bg-meta-date">{new Date(orientation.timestamp).toLocaleDateString()}</span>
          <span className="bg-meta-sep">·</span>
          <span className="bg-meta-count">{filledCount}/7 fields</span>
        </div>
      </div>

      <h2 className="bg-summary-title">Field Orientation Summary</h2>

      <div className="bg-summary-fields">
        {fields.map((f, i) => (
          <div key={i} className={`bg-summary-field dc dc${i + 1}`}>
            <div className="bg-summary-field-label">{f.label}</div>
            <div className="bg-summary-field-value">{f.value || "—"}</div>
          </div>
        ))}
      </div>

      <div className="bg-summary-actions">
        <div className="bg-summary-actions-label">Export</div>
        <button className="bg-btn bg-btn--outline" onClick={onExportJSON}>JSON</button>
        <button className="bg-btn bg-btn--outline" onClick={onExportMD}>Markdown</button>
      </div>
    </div>
  );
}

function OrientationListItem({ o, onLoad, onDelete }) {
  const filledCount = QUESTIONS.filter((q) => o.card[q.id]?.trim()).length;
  return (
    <div className="bg-list-item">
      <div className="bg-list-item-main" onClick={() => onLoad(o)}>
        <div className="bg-list-item-name">{o.project || "Untitled"}</div>
        <div className="bg-list-item-meta">
          {new Date(o.timestamp).toLocaleDateString()} · {filledCount}/7 · {o.status}
        </div>
      </div>
      <button className="bg-list-item-del" onClick={(e) => { e.stopPropagation(); onDelete(o.id); }} title="Delete">×</button>
    </div>
  );
}

/* ── Main component ── */

export default function BreakgroundCard() {
  const [orientations, setOrientations] = useState(loadOrientations);
  const [current, setCurrent] = useState(null); // orientation object or null
  const [focusedQ, setFocusedQ] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" | "summary" | "library"
  const [projectName, setProjectName] = useState("");

  // Sync to localStorage whenever orientations change
  useEffect(() => {
    saveOrientations(orientations);
  }, [orientations]);

  const startNew = useCallback(() => {
    const o = {
      id: genId(),
      project: projectName.trim() || "",
      timestamp: ts(),
      mode: "manual",
      card: {
        fieldCondition: "",
        centralRelationship: "",
        tensionHeld: "",
        beauty: "",
        structureDecided: "",
        remainingOpen: "",
        firstEmbodiedMove: "",
      },
      conversationLog: null,
      status: "active",
      linkedTools: [],
      revisions: [],
    };
    setCurrent(o);
    setViewMode("card");
    setProjectName("");
  }, [projectName]);

  const updateField = useCallback((fieldId, value) => {
    setCurrent((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, card: { ...prev.card, [fieldId]: value } };
      return updated;
    });
  }, []);

  const saveOrientation = useCallback(() => {
    if (!current) return;
    setOrientations((prev) => {
      const exists = prev.find((o) => o.id === current.id);
      if (exists) return prev.map((o) => (o.id === current.id ? current : o));
      return [current, ...prev];
    });
  }, [current]);

  const completeOrientation = useCallback(() => {
    if (!current) return;
    const completed = { ...current, status: "active" };
    setCurrent(completed);
    setOrientations((prev) => {
      const exists = prev.find((o) => o.id === completed.id);
      if (exists) return prev.map((o) => (o.id === completed.id ? completed : o));
      return [completed, ...prev];
    });
    setViewMode("summary");
  }, [current]);

  const loadOrientation = useCallback((o) => {
    setCurrent(o);
    setViewMode("card");
  }, []);

  const deleteOrientation = useCallback((id) => {
    setOrientations((prev) => prev.filter((o) => o.id !== id));
    if (current?.id === id) {
      setCurrent(null);
      setViewMode("library");
    }
  }, [current]);

  const filledCount = current
    ? QUESTIONS.filter((q) => current.card[q.id]?.trim()).length
    : 0;

  return (
    <div className="bg-wrap en">
      {/* ── Header ── */}
      <div className="bg-header">
        <div className="bg-header-left">
          <h1 className="bg-title">Breakground Card</h1>
          <div className="bg-subtitle">Field Orientation System</div>
        </div>
        <div className="bg-header-right">
          <button
            className={`bg-tab${viewMode === "library" ? " bg-tab--active" : ""}`}
            onClick={() => setViewMode("library")}
          >
            Library ({orientations.length})
          </button>
          {current && (
            <button
              className={`bg-tab${viewMode === "card" ? " bg-tab--active" : ""}`}
              onClick={() => setViewMode("card")}
            >
              Card
            </button>
          )}
          {current && filledCount > 0 && (
            <button
              className={`bg-tab${viewMode === "summary" ? " bg-tab--active" : ""}`}
              onClick={() => { saveOrientation(); setViewMode("summary"); }}
            >
              Summary
            </button>
          )}
        </div>
      </div>

      {/* ── Start new orientation ── */}
      {viewMode !== "summary" && !current && viewMode !== "library" && (
        <div className="bg-start en">
          <div className="bg-start-prompt">Name this field</div>
          <div className="bg-start-row">
            <input
              className="bg-start-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Site Hero, Brand Direction, Q3 Strategy…"
              onKeyDown={(e) => e.key === "Enter" && startNew()}
            />
            <button className="bg-btn bg-btn--primary" onClick={startNew}>
              Begin
            </button>
          </div>
          <div className="bg-start-note">
            Or press Enter. The name can be changed later.
          </div>
        </div>
      )}

      {/* ── New orientation prompt from library ── */}
      {viewMode === "library" && (
        <div className="bg-library en">
          <div className="bg-start en" style={{ marginBottom: 32 }}>
            <div className="bg-start-prompt">New orientation</div>
            <div className="bg-start-row">
              <input
                className="bg-start-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Name this field…"
                onKeyDown={(e) => e.key === "Enter" && startNew()}
              />
              <button className="bg-btn bg-btn--primary" onClick={startNew}>
                Begin
              </button>
            </div>
          </div>
          {orientations.length > 0 && (
            <>
              <div className="bg-library-label">Saved orientations</div>
              <div className="bg-library-list">
                {orientations.map((o) => (
                  <OrientationListItem
                    key={o.id}
                    o={o}
                    onLoad={loadOrientation}
                    onDelete={deleteOrientation}
                  />
                ))}
              </div>
            </>
          )}
          {orientations.length === 0 && (
            <div className="bg-library-empty">
              No orientations yet. Begin one above.
            </div>
          )}
        </div>
      )}

      {/* ── Card view ── */}
      {viewMode === "card" && current && (
        <div className="bg-card en">
          {/* Project name (editable) */}
          <div className="bg-card-project">
            <input
              className="bg-card-project-input"
              value={current.project}
              onChange={(e) => setCurrent((p) => ({ ...p, project: e.target.value }))}
              placeholder="Untitled orientation"
            />
            <div className="bg-card-progress">
              <span className="bg-card-progress-count">{filledCount}</span>
              <span className="bg-card-progress-sep">/</span>
              <span className="bg-card-progress-total">7</span>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-card-questions">
            {QUESTIONS.map((q) => (
              <QuestionField
                key={q.id}
                q={q}
                value={current.card[q.id]}
                onChange={updateField}
                focused={focusedQ === q.id}
                onFocus={setFocusedQ}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="bg-card-actions">
            <button className="bg-btn bg-btn--ghost" onClick={() => { saveOrientation(); setViewMode("library"); }}>
              Save & close
            </button>
            <button
              className="bg-btn bg-btn--primary"
              onClick={completeOrientation}
              disabled={filledCount === 0}
            >
              View summary
            </button>
          </div>
        </div>
      )}

      {/* ── Summary view ── */}
      {viewMode === "summary" && current && (
        <SummaryView
          orientation={current}
          onBack={() => setViewMode("card")}
          onExportJSON={() => exportJSON(current)}
          onExportMD={() => exportMarkdown(current)}
        />
      )}

      {/* ── Governance ── */}
      <div className="bg-governance">
        <div className="bg-governance-label">Operating constraints</div>
        <div className="bg-governance-items">
          <span>Embodied action precedes alignment</span>
          <span className="bg-gov-sep">·</span>
          <span>Practice precedes documentation</span>
          <span className="bg-gov-sep">·</span>
          <span>Silence is allowed</span>
          <span className="bg-gov-sep">·</span>
          <span>State is visible</span>
          <span className="bg-gov-sep">·</span>
          <span>Change is legible</span>
        </div>
      </div>
    </div>
  );
}
