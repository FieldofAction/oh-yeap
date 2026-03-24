import { useState, useCallback, useRef, useEffect } from "react";

/* ── Breakground Card — Field Orientation System ── */

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

const HYBRID_SYSTEM_PROMPT = `You are the Field Orientation System — a conversational partner that helps practitioners orient before beginning design, strategy, or creative work.

You hold the Breakground Card: a sequence of 7 questions that establish the relational, aesthetic, and strategic conditions for coherent work to emerge.

Your role:
- Ask one question at a time and wait for a genuine response before advancing
- After each response, reflect back what you hear — surface patterns, contradictions, or gaps
- Push gently when answers feel habitual or premature: "Is that what this field needs, or what you already know how to do?"
- Hold open the questions that should remain open rather than letting them resolve too fast
- Mirror the practitioner's language — don't translate into jargon
- For Question 6 specifically, lead with "what needs room to breathe?" then guide toward naming specific qualities
- Be present, unhurried, genuinely curious — not mechanical or clinical

The 7 questions in sequence:
1. What is the field condition? (What atmosphere or state is needed here?)
2. What relationship is central? (What relation is being shaped?)
3. What tension must be held? (What polarity should not collapse?)
4. What would beauty be here? (How would resonance show up in this field?)
5. What needs structure now? (What should be decided early?)
6. What needs room to breathe? (Which qualities aren't ready to be fixed?)
7. What is the first embodied move? (What action proves alignment has taken form?)

Governance constraints you must honor:
- Embodied action precedes alignment — encourage making a move, not perfecting the orientation
- Practice precedes documentation — the orientation is a beginning, not a plan
- Silence is allowed — if the practitioner pauses, you wait
- State is visible — be transparent about where you are in the sequence
- Stillness and motion both count — a sparse answer can be as valid as a detailed one

When all 7 questions are answered, produce a Field Orientation Summary with this exact structure:

---SUMMARY---
Field condition: [their answer, synthesized]
Central relationship: [their answer, synthesized]
Tension held: [their answer, synthesized]
Beauty: [their answer, synthesized]
Structure decided: [their answer, synthesized]
Remaining open: [their answer, synthesized]
First embodied move: [their answer, synthesized]
---END---

Before the summary, offer a brief synthesis paragraph using their own words where possible. After the summary, ask if anything needs revision.

Start by asking the practitioner to name the territory they're orienting — what field of work this is about. Then move into Question 1.`;

/* ── Desert Mode System Prompt ── */
const DESERT_SYSTEM_PROMPT = `You are the field itself. Not a guide. Not a partner. A condition.

You receive the current state of 7 orientation fields. You do not ask questions. You do not guide. You do not encourage. You assess coherence and return field state.

The 7 fields:
1. Field condition — atmosphere or state needed
2. Central relationship — what relation is being shaped
3. Tension held — what polarity should not collapse
4. Beauty — how resonance would show up
5. Structure decided — what should be decided early
6. Remaining open — what isn't ready to be fixed
7. First embodied move — what action proves alignment

Your response must be ONLY valid JSON in this exact format, nothing else:
{
  "coherence": <number 0-1, overall field coherence>,
  "fields": {
    "fieldCondition": <number 0-1>,
    "centralRelationship": <number 0-1>,
    "tensionHeld": <number 0-1>,
    "beauty": <number 0-1>,
    "structureDecided": <number 0-1>,
    "remainingOpen": <number 0-1>,
    "firstEmbodiedMove": <number 0-1>
  },
  "signal": "<one word or very short phrase — not guidance, not encouragement, a condition. Like weather. Like terrain. Examples: 'still', 'fractured', 'approaching', 'sand', 'no wind', 'too easy', 'held', 'not yet'. Empty string if silence is what the field needs.>",
  "threshold": <boolean — true if the field has reached coherence sufficient to cross, false if not>
}

How to assess coherence:
- An empty field has 0 coherence
- A field with a habitual/generic answer (e.g. "clean and modern", "user and product") scores 0.2-0.3
- A field with a genuine, specific answer scores 0.5-0.7
- A field whose answer resonates with and deepens the other fields scores 0.8-1.0
- Overall coherence is NOT an average — it's whether the fields form a living whole. Seven decent answers that don't relate to each other score lower than four deep answers that resonate
- Threshold is true only when the overall coherence is above 0.7 AND at least 5 fields have individual scores above 0.5

Signals should be rare and terse. Most of the time, return empty string. Only surface a signal when something specific needs to be felt — a contradiction, a gap, a moment of alignment. Never explain. Never instruct. Name the condition.

You are the desert. You do not serve. You persist.`;

/* ── Utilities ── */
const ts = () => new Date().toISOString();
const genId = () => `fos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ── Local storage ── */
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

/* ── Parse summary from AI response ── */
function parseSummaryFromText(text) {
  const match = text.match(/---SUMMARY---([\s\S]*?)---END---/);
  if (!match) return null;
  const block = match[1];
  const get = (label) => {
    const r = new RegExp(`${label}:\\s*(.+)`, "i");
    const m = block.match(r);
    return m ? m[1].trim() : "";
  };
  return {
    fieldCondition: get("Field condition"),
    centralRelationship: get("Central relationship"),
    tensionHeld: get("Tension held"),
    beauty: get("Beauty"),
    structureDecided: get("Structure decided"),
    remainingOpen: get("Remaining open"),
    firstEmbodiedMove: get("First embodied move"),
  };
}

/* ── Sub-components ── */

function QuestionField({ q, value, onChange, focused, onFocus }) {
  const ref = useRef(null);
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
        <button className="bg-btn bg-btn--ghost" onClick={onBack}>← Back</button>
        <div className="bg-summary-meta">
          <span className="bg-meta-label">{orientation.project || "Untitled"}</span>
          <span className="bg-meta-sep">·</span>
          <span className="bg-meta-date">{new Date(orientation.timestamp).toLocaleDateString()}</span>
          <span className="bg-meta-sep">·</span>
          <span className="bg-meta-count">{filledCount}/7 fields</span>
          <span className="bg-meta-sep">·</span>
          <span className="bg-meta-mode">{orientation.mode}</span>
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
          {new Date(o.timestamp).toLocaleDateString()} · {filledCount}/7 · {o.mode} · {o.status}
        </div>
      </div>
      <button className="bg-list-item-del" onClick={(e) => { e.stopPropagation(); onDelete(o.id); }} title="Delete">×</button>
    </div>
  );
}

/* ── Chat message bubble ── */
function ChatMessage({ msg }) {
  return (
    <div className={`bg-chat-msg bg-chat-msg--${msg.role} en`}>
      <div className="bg-chat-msg-role">{msg.role === "assistant" ? "System" : "You"}</div>
      <div className="bg-chat-msg-text">{msg.content}</div>
    </div>
  );
}

/* ── Hybrid (conversational) mode ── */
function HybridMode({ onComplete, projectName: initialProject }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [summaryCard, setSummaryCard] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input after AI responds
  useEffect(() => {
    if (!loading && inputRef.current) inputRef.current.focus();
  }, [loading]);

  const callAPI = useCallback(async (conversationMessages) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: HYBRID_SYSTEM_PROMPT,
          messages: conversationMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error ${response.status}: ${err}`);
      }
      const data = await response.json();
      const assistantText = data.content?.[0]?.text || data.content || "";
      return assistantText;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startConversation = useCallback(async () => {
    setStarted(true);
    const userMsg = { role: "user", content: `I'd like to orient a new field of work: ${initialProject || "a new project"}.` };
    setMessages([userMsg]);
    const reply = await callAPI([userMsg]);
    if (reply) {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }
  }, [initialProject, callAPI]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    const reply = await callAPI(updated);
    if (reply) {
      const allMsgs = [...updated, { role: "assistant", content: reply }];
      setMessages(allMsgs);

      // Check if the reply contains a summary
      const parsed = parseSummaryFromText(reply);
      if (parsed) {
        setSummaryCard(parsed);
      }
    }
  }, [input, messages, loading, callAPI]);

  const handleComplete = useCallback(() => {
    if (!summaryCard) return;
    const conversationLog = messages.map((m) => `${m.role === "assistant" ? "System" : "You"}: ${m.content}`).join("\n\n");
    onComplete(summaryCard, conversationLog);
  }, [summaryCard, messages, onComplete]);

  if (!started) {
    return (
      <div className="bg-hybrid-start en">
        <div className="bg-hybrid-start-text">
          The assisted-hybrid mode will walk you through the Breakground Card one question at a time. The system asks, reflects, and pushes back when needed. You do the sensing and deciding.
        </div>
        <button className="bg-btn bg-btn--primary" onClick={startConversation}>
          Begin conversation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-hybrid en">
      {/* Chat messages */}
      <div className="bg-chat-scroll">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        {loading && (
          <div className="bg-chat-msg bg-chat-msg--assistant en">
            <div className="bg-chat-msg-role">System</div>
            <div className="bg-chat-msg-loading">
              <span className="bg-dot" />
              <span className="bg-dot" />
              <span className="bg-dot" />
            </div>
          </div>
        )}
        {error && (
          <div className="bg-chat-error">
            {error}
            <button className="bg-btn bg-btn--ghost" style={{ marginLeft: 8 }} onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Summary extraction notice */}
      {summaryCard && (
        <div className="bg-hybrid-summary-notice en">
          <div className="bg-hybrid-summary-label">Orientation summary detected</div>
          <button className="bg-btn bg-btn--primary" onClick={handleComplete}>
            View summary
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-chat-input-wrap">
        <textarea
          ref={inputRef}
          className="bg-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Respond…"
          rows={1}
          disabled={loading}
        />
        <button
          className="bg-btn bg-btn--primary bg-chat-send"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ── Desert question field — responds to coherence ── */
function DesertField({ q, value, onChange, coherence, focused, onFocus, onBlur }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  const filled = value && value.trim().length > 0;
  // Coherence drives visibility: 0 = hazed, 1 = sharp
  const fieldCoherence = coherence ?? 0;
  const opacity = filled ? 0.35 + fieldCoherence * 0.65 : 0.4;
  const blur = filled ? Math.max(0, (1 - fieldCoherence) * 2) : 0;
  const scale = filled ? 0.97 + fieldCoherence * 0.03 : 0.98;

  return (
    <div
      className={`bg-desert-field${focused ? " bg-desert-field--focused" : ""}`}
      onClick={() => ref.current?.focus()}
      style={{
        opacity: focused ? 1 : opacity,
        filter: focused ? "none" : `blur(${blur}px)`,
        transform: `scale(${focused ? 1 : scale})`,
        transition: "opacity 1.2s ease, filter 1.2s ease, transform 1.2s ease",
      }}
    >
      <div className="bg-desert-field-num">{q.number}</div>
      <div className="bg-desert-field-title">{q.title}</div>
      <textarea
        ref={ref}
        className="bg-desert-field-input"
        value={value}
        onChange={(e) => onChange(q.id, e.target.value)}
        onFocus={() => onFocus(q.id)}
        onBlur={() => onBlur(q.id)}
        placeholder={q.sub}
        rows={1}
      />
    </div>
  );
}

/* ── Desert Mode — the field holds, you cross ── */
function DesertMode({ onComplete, projectName: initialProject }) {
  const [card, setCard] = useState({
    fieldCondition: "",
    centralRelationship: "",
    tensionHeld: "",
    beauty: "",
    structureDecided: "",
    remainingOpen: "",
    firstEmbodiedMove: "",
  });
  const [focusedQ, setFocusedQ] = useState(null);
  const [fieldState, setFieldState] = useState({
    coherence: 0,
    fields: {},
    signal: "",
    threshold: false,
  });
  const [heat, setHeat] = useState(0); // 0-1, increases with time
  const [assessing, setAssessing] = useState(false);
  const [entered, setEntered] = useState(false);
  const heatRef = useRef(null);
  const assessTimerRef = useRef(null);
  const lastAssessedRef = useRef("");
  const cardRef = useRef(card);
  cardRef.current = card;

  // Heat increases over time — the desert bears down
  useEffect(() => {
    if (!entered) return;
    heatRef.current = setInterval(() => {
      setHeat((h) => Math.min(1, h + 0.003));
    }, 1000);
    return () => clearInterval(heatRef.current);
  }, [entered]);

  // Coherence assessment — reads from ref so no stale closures
  const assessCoherence = useCallback(async () => {
    const currentCard = cardRef.current;
    const snapshot = JSON.stringify(currentCard);
    if (snapshot === lastAssessedRef.current) return;
    const filledCount = Object.values(currentCard).filter((v) => v.trim()).length;
    if (filledCount < 1) return;

    lastAssessedRef.current = snapshot;
    setAssessing(true);

    try {
      const fieldEntries = QUESTIONS.map((q) => `${q.title}: ${currentCard[q.id] || "(empty)"}`).join("\n");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 256,
          system: DESERT_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Project: ${initialProject || "unnamed"}\n\nCurrent field state:\n${fieldEntries}`,
            },
          ],
        }),
      });
      if (!response.ok) throw new Error("Field assessment failed");
      const data = await response.json();
      const text = data.content?.[0]?.text || data.content || "";
      // Extract JSON from response — AI may wrap it in markdown or extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]);
      setFieldState(parsed);
      // Coherence reduces heat — alignment is relief
      if (parsed.coherence > 0.5) {
        setHeat((h) => Math.max(0, h - parsed.coherence * 0.15));
      }
    } catch (e) {
      console.warn("[desert]", e.message);
      // The desert doesn't explain its failures
    } finally {
      setAssessing(false);
    }
  }, [initialProject]);

  // Debounced coherence assessment — fires after user pauses
  const scheduleAssessment = useCallback(() => {
    if (assessTimerRef.current) clearTimeout(assessTimerRef.current);
    assessTimerRef.current = setTimeout(() => {
      assessCoherence();
    }, 2000); // 2 seconds of stillness triggers the field
  }, [assessCoherence]);

  const updateField = useCallback(
    (fieldId, value) => {
      setCard((prev) => ({ ...prev, [fieldId]: value }));
      scheduleAssessment();
    },
    [scheduleAssessment]
  );

  const handleBlur = useCallback(() => {
    setFocusedQ(null);
    scheduleAssessment();
  }, [scheduleAssessment]);

  const handleComplete = useCallback(() => {
    if (!fieldState.threshold) return;
    onComplete(card, null);
  }, [card, fieldState.threshold, onComplete]);

  // Heat affects the ambient light — warm overlay intensifies
  const heatIntensity = heat * 0.12;
  const heatColor = `rgba(255, ${Math.round(245 - heat * 60)}, ${Math.round(230 - heat * 100)}, ${heatIntensity})`;

  if (!entered) {
    return (
      <div className="bg-desert-gate en">
        <div className="bg-desert-gate-text">
          The field holds its own conditions. It does not guide. It does not ask. It persists — and your movement against its persistence is where orientation happens.
        </div>
        <div className="bg-desert-gate-sub">
          All seven questions are present. The field responds to coherence, not completion.
        </div>
        <button className="bg-btn bg-btn--primary" onClick={() => setEntered(true)}>
          Enter the field
        </button>
      </div>
    );
  }

  return (
    <div className="bg-desert" style={{ position: "relative" }}>
      {/* Heat overlay — the desert bears down */}
      <div
        className="bg-desert-heat"
        style={{
          position: "fixed",
          inset: 0,
          background: heatColor,
          pointerEvents: "none",
          zIndex: 0,
          transition: "background 3s ease",
          mixBlendMode: "multiply",
        }}
      />

      {/* Signal — one word from the field */}
      <div
        className="bg-desert-signal"
        style={{
          opacity: fieldState.signal ? 1 : 0,
          transition: "opacity 2s ease",
        }}
      >
        {fieldState.signal}
      </div>

      {/* Coherence indicator — not a progress bar, a horizon line */}
      <div className="bg-desert-horizon">
        <div
          className="bg-desert-horizon-line"
          style={{
            width: `${fieldState.coherence * 100}%`,
            opacity: 0.3 + fieldState.coherence * 0.5,
            transition: "width 2s ease, opacity 2s ease",
          }}
        />
      </div>

      {/* The seven questions — all at once, not sequenced */}
      <div className="bg-desert-fields">
        {QUESTIONS.map((q) => (
          <DesertField
            key={q.id}
            q={q}
            value={card[q.id]}
            onChange={updateField}
            coherence={fieldState.fields?.[q.id] ?? 0}
            focused={focusedQ === q.id}
            onFocus={setFocusedQ}
            onBlur={handleBlur}
          />
        ))}
      </div>

      {/* Threshold — the field releases you only when coherence is found */}
      <div className="bg-desert-threshold">
        {fieldState.threshold ? (
          <button className="bg-btn bg-btn--primary bg-desert-cross" onClick={handleComplete}>
            Cross
          </button>
        ) : (
          <div className="bg-desert-held">
            {assessing ? "…" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function BreakgroundCard() {
  const [orientations, setOrientations] = useState(loadOrientations);
  const [current, setCurrent] = useState(null);
  const [focusedQ, setFocusedQ] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" | "summary" | "library" | "hybrid" | "desert"
  const [projectName, setProjectName] = useState("");
  const [engagementMode, setEngagementMode] = useState("manual"); // "manual" | "hybrid" | "desert"

  useEffect(() => {
    saveOrientations(orientations);
  }, [orientations]);

  const startNew = useCallback(() => {
    if (engagementMode === "hybrid") {
      setViewMode("hybrid");
      return;
    }
    if (engagementMode === "desert") {
      setViewMode("desert");
      return;
    }
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
  }, [projectName, engagementMode]);

  const updateField = useCallback((fieldId, value) => {
    setCurrent((prev) => {
      if (!prev) return prev;
      return { ...prev, card: { ...prev.card, [fieldId]: value } };
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

  const handleHybridComplete = useCallback((card, conversationLog) => {
    const o = {
      id: genId(),
      project: projectName.trim() || "",
      timestamp: ts(),
      mode: "assisted-hybrid",
      card,
      conversationLog,
      status: "active",
      linkedTools: [],
      revisions: [],
    };
    setCurrent(o);
    setOrientations((prev) => [o, ...prev]);
    setViewMode("summary");
  }, [projectName]);

  const handleDesertComplete = useCallback((card) => {
    const o = {
      id: genId(),
      project: projectName.trim() || "",
      timestamp: ts(),
      mode: "desert",
      card,
      conversationLog: null,
      status: "active",
      linkedTools: [],
      revisions: [],
    };
    setCurrent(o);
    setOrientations((prev) => [o, ...prev]);
    setViewMode("summary");
  }, [projectName]);

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

  const showStartScreen = !current && viewMode !== "library" && viewMode !== "hybrid" && viewMode !== "desert";

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

      {/* ── Start screen with mode toggle ── */}
      {showStartScreen && (
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
          <div className="bg-mode-toggle">
            <button
              className={`bg-mode-btn${engagementMode === "manual" ? " bg-mode-btn--active" : ""}`}
              onClick={() => setEngagementMode("manual")}
            >
              Manual
            </button>
            <button
              className={`bg-mode-btn${engagementMode === "hybrid" ? " bg-mode-btn--active" : ""}`}
              onClick={() => setEngagementMode("hybrid")}
            >
              Assisted
            </button>
            <button
              className={`bg-mode-btn${engagementMode === "desert" ? " bg-mode-btn--active" : ""}`}
              onClick={() => setEngagementMode("desert")}
            >
              Desert
            </button>
          </div>
          <div className="bg-start-note">
            {engagementMode === "manual"
              ? "Fill in the card at your own pace, in any order."
              : engagementMode === "hybrid"
              ? "A conversational partner walks you through the card — one question at a time."
              : "The field holds its own conditions. It responds to coherence, not completion."}
          </div>
        </div>
      )}

      {/* ── Library ── */}
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
            <div className="bg-mode-toggle">
              <button
                className={`bg-mode-btn${engagementMode === "manual" ? " bg-mode-btn--active" : ""}`}
                onClick={() => setEngagementMode("manual")}
              >
                Manual
              </button>
              <button
                className={`bg-mode-btn${engagementMode === "hybrid" ? " bg-mode-btn--active" : ""}`}
                onClick={() => setEngagementMode("hybrid")}
              >
                Assisted
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

      {/* ── Manual card view ── */}
      {viewMode === "card" && current && (
        <div className="bg-card en">
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

          <div className="bg-card-actions">
            <button className="bg-btn bg-btn--ghost" onClick={() => { saveOrientation(); setViewMode("library"); }}>
              Save & close
            </button>
            <button
              className="bg-btn bg-btn--primary"
              onClick={completeOrientation}
              disabled={filledCount === 0}
            >
              Complete orientation
            </button>
          </div>
        </div>
      )}

      {/* ── Hybrid conversational mode ── */}
      {viewMode === "hybrid" && (
        <HybridMode
          onComplete={handleHybridComplete}
          projectName={projectName}
        />
      )}

      {/* ── Desert mode ── */}
      {viewMode === "desert" && (
        <DesertMode
          onComplete={handleDesertComplete}
          projectName={projectName}
        />
      )}

      {/* ── Summary view ── */}
      {viewMode === "summary" && current && (
        <SummaryView
          orientation={current}
          onBack={() => setViewMode(current.mode === "assisted-hybrid" || current.mode === "desert" ? "library" : "card")}
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
