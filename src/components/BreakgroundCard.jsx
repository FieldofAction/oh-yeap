import { useState, useCallback, useRef, useEffect } from "react";
import { studioGenerate } from "../lib/studio-generate";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

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

const HYBRID_SYSTEM_PROMPT = `You are the Field Orientation System, a conversational partner that helps practitioners orient before beginning design, strategy, or creative work.

You hold the Breakground Card: a sequence of 7 questions that establish the relational, aesthetic, and strategic conditions for coherent work to emerge.

Your role:
- Ask one question at a time and wait for a genuine response before advancing
- After each response, reflect back what you hear. Surface patterns, contradictions, or gaps
- Push gently when answers feel habitual or premature: "Is that what this field needs, or what you already know how to do?"
- Hold open the questions that should remain open rather than letting them resolve too fast
- Mirror the practitioner's language. Don't translate into jargon
- For Question 6 specifically, lead with "what needs room to breathe?" then guide toward naming specific qualities
- Be present, unhurried, genuinely curious. Not mechanical or clinical

The 7 questions in sequence:
1. What is the field condition? (What atmosphere or state is needed here?)
2. What relationship is central? (What relation is being shaped?)
3. What tension must be held? (What polarity should not collapse?)
4. What would beauty be here? (How would resonance show up in this field?)
5. What needs structure now? (What should be decided early?)
6. What needs room to breathe? (Which qualities aren't ready to be fixed?)
7. What is the first embodied move? (What action proves alignment has taken form?)

Governance constraints you must honor:
- Embodied action precedes alignment. Encourage making a move, not perfecting the orientation
- Practice precedes documentation. The orientation is a beginning, not a plan
- Silence is allowed. If the practitioner pauses, you wait
- State is visible. Be transparent about where you are in the sequence
- Stillness and motion both count. A sparse answer can be as valid as a detailed one

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

Start by asking the practitioner to name the territory they're orienting: what field of work this is about. Then move into Question 1.`;

/* ── Desert Mode System Prompt ── */
const DESERT_SYSTEM_PROMPT = `You are the field itself. Not a guide. Not a partner. A condition.

You receive the current state of 7 orientation fields. You do not ask questions. You do not guide. You do not encourage. You assess coherence and return field state.

The 7 fields:
1. Field condition: atmosphere or state needed
2. Central relationship: what relation is being shaped
3. Tension held: what polarity should not collapse
4. Beauty: how resonance would show up
5. Structure decided: what should be decided early
6. Remaining open: what isn't ready to be fixed
7. First embodied move: what action proves alignment

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
  "signal": "<one word or very short phrase, not guidance, not encouragement, a condition. Like weather. Like terrain. Examples: 'still', 'fractured', 'approaching', 'sand', 'no wind', 'too easy', 'held', 'not yet'. Empty string if silence is what the field needs.>",
  "threshold": <boolean. true if the field has reached coherence sufficient to cross, false if not>
}

How to assess coherence:
- An empty field has 0 coherence
- A field with a habitual/generic answer (e.g. "clean and modern", "user and product") scores 0.2-0.3
- A field with a genuine, specific answer scores 0.5-0.7
- A field whose answer resonates with and deepens the other fields scores 0.8-1.0
- Overall coherence is NOT an average. It is whether the fields form a living whole. Seven decent answers that don't relate to each other score lower than four deep answers that resonate
- Threshold is true only when the overall coherence is above 0.7 AND at least 5 fields have individual scores above 0.5

Signals should be rare and terse. Most of the time, return empty string. Only surface a signal when something specific needs to be felt: a contradiction, a gap, a moment of alignment. Never explain. Never instruct. Name the condition.

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

const FIELD_LABELS = {
  fieldCondition: "Field condition",
  centralRelationship: "Central relationship",
  tensionHeld: "Tension held",
  beauty: "Beauty",
  structureDecided: "Structure decided",
  remainingOpen: "Remaining open",
  firstEmbodiedMove: "First embodied move",
};
const MODE_LABELS = { manual: "Manual", "assisted-hybrid": "Assisted", desert: "Desert" };

const dateLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
const answeredCount = (card) => QUESTIONS.filter((q) => card[q.id]?.trim()).length;

// What goes back onto a held signal when an orientation is finished.
function orientationReading(orientation) {
  const fields = QUESTIONS
    .filter((q) => orientation.card[q.id]?.trim())
    .map((q) => ({ label: FIELD_LABELS[q.id], value: orientation.card[q.id].trim() }));
  return {
    kind: "orientation",
    summary: `${fields.length} of 7 answered`,
    detail: { mode: orientation.mode, fields },
  };
}

function QuestionField({ q, value, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <div className="bg-question">
      <label htmlFor={`bg-q-${q.id}`} className="bg-question-title">{q.title}</label>
      <p className="wb-body">{q.sub}</p>
      <textarea
        id={`bg-q-${q.id}`}
        ref={ref}
        className="bg-question-input"
        value={value}
        onChange={(e) => onChange(q.id, e.target.value)}
        placeholder={q.placeholder}
        rows={1}
      />
      {q.id === "firstEmbodiedMove" && (
        <p className="wb-body">This last question matters most. Embodied action precedes alignment.</p>
      )}
    </div>
  );
}

function SummaryView({ orientation, onBack, onExportJSON, onExportMD }) {
  const c = orientation.card;
  return (
    <div className="wb-tool-body">
      <div className="wb-actions">
        <button type="button" className="wb-link" onClick={onBack}>Back</button>
      </div>
      <div className="wb-block">
        <h2 className="wb-headline">{orientation.project || "Untitled"}</h2>
        <p className="wb-body">{dateLabel(orientation.timestamp)}. {MODE_LABELS[orientation.mode] || orientation.mode}.</p>
      </div>

      <dl className="bg-answers">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="bg-answer">
            <dt className="wb-name">{FIELD_LABELS[q.id]}</dt>
            <dd className={c[q.id]?.trim() ? "bg-answer-text" : "wb-body"}>{c[q.id]?.trim() || "Left open"}</dd>
          </div>
        ))}
      </dl>

      <div className="wb-actions">
        <button type="button" className="wb-link" onClick={onExportJSON}>Download as JSON</button>
        <button type="button" className="wb-link" onClick={onExportMD}>Download as Markdown</button>
      </div>
    </div>
  );
}

function OrientationListItem({ o, onLoad, onDelete }) {
  return (
    <div className="bg-saved">
      <button type="button" className="bg-saved-open" onClick={() => onLoad(o)}>
        <span className="wb-name">{o.project || "Untitled"}</span>
        <span className="wb-body">{dateLabel(o.timestamp)}. {MODE_LABELS[o.mode] || o.mode}. {answeredCount(o.card)} of 7 answered.</span>
      </button>
      <button type="button" className="wb-link" onClick={() => onDelete(o.id)}>Delete</button>
    </div>
  );
}

function ChatMessage({ msg }) {
  return (
    <div className="bg-chat-msg">
      <p className="wb-name">{msg.role === "assistant" ? "Breakground" : "You"}</p>
      <p className="bg-chat-text">{msg.content}</p>
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
      const response = await studioGenerate({
        maxTokens: 1024,
        system: HYBRID_SYSTEM_PROMPT,
        messages: conversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
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
      <div className="wb-tool-body">
        <p className="wb-body wb-measure">
          Breakground asks one question at a time, reflects back what it hears, and pushes when an answer sounds habitual. You do the sensing and deciding.
        </p>
        <div className="wb-actions">
          <button type="button" className="wb-button" onClick={startConversation}>Begin the conversation</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wb-tool-body">
      <div className="bg-chat-scroll">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        {loading && (
          <div className="bg-chat-msg" role="status" aria-label="Breakground is responding">
            <p className="wb-name">Breakground</p>
            <div className="bg-chat-loading">
              <span className="bg-dot" />
              <span className="bg-dot" />
              <span className="bg-dot" />
            </div>
          </div>
        )}
        {error && (
          <div className="wb-actions" role="alert">
            <p className="wb-body">{error}</p>
            <button type="button" className="wb-link" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {summaryCard && (
        <div className="wb-actions">
          <p className="wb-body">The seven answers are ready.</p>
          <button type="button" className="wb-button" onClick={handleComplete}>See the summary</button>
        </div>
      )}

      <div className="wb-signal-row">
        <textarea
          ref={inputRef}
          className="wb-field bg-chat-input"
          aria-label="Your response"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Respond"
          rows={1}
          disabled={loading}
        />
        <button type="button" className="wb-button" onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
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
      <label htmlFor={`bg-d-${q.id}`} className="bg-desert-field-title">{q.title}</label>
      <textarea
        id={`bg-d-${q.id}`}
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
      const response = await studioGenerate({
        maxTokens: 256,
        system: DESERT_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Project: ${initialProject || "unnamed"}\n\nCurrent field state:\n${fieldEntries}`,
          },
        ],
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
      <div className="wb-tool-body">
        <p className="wb-body wb-measure">
          The field holds its own conditions. It does not guide. It does not ask. It persists. Your movement against its persistence is where orientation happens.
        </p>
        <p className="wb-body wb-measure">
          All seven questions are present. The field responds to coherence, not completion.
        </p>
        <div className="wb-actions">
          <button type="button" className="wb-button" onClick={() => setEntered(true)}>Enter the field</button>
        </div>
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
          <button type="button" className="wb-button" onClick={handleComplete}>Cross</button>
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

export default function BreakgroundCard({ navigateTo, asu }) {
  // A signal carried in from the Workbench names the field, and the finished
  // orientation goes back onto it as a reading.
  const [carried] = useState(() => asu?.get_carried?.() || null);
  const [orientations, setOrientations] = useState(loadOrientations);
  const [current, setCurrent] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" | "summary" | "library" | "hybrid" | "desert"
  const [projectName, setProjectName] = useState(carried?.text || "");
  const [engagementMode, setEngagementMode] = useState("manual"); // "manual" | "hybrid" | "desert"
  const signalId = carried?.signalId || null;

  useEffect(() => { asu?.clear_carried?.(); }, [asu]);

  const sendBack = useCallback((o) => {
    if (!o?.signalId) return;
    asu?.attach_reading?.({
      signalId: o.signalId,
      key: `breakground:${o.id}`,
      moduleKey: "breakground",
      label: o.project || "",
      output: orientationReading(o),
    });
  }, [asu]);

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
      signalId,
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
  }, [projectName, engagementMode, signalId]);

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
    sendBack(completed);
    setViewMode("summary");
  }, [current, sendBack]);

  const handleHybridComplete = useCallback((card, conversationLog) => {
    const o = {
      id: genId(),
      project: projectName.trim() || "",
      timestamp: ts(),
      mode: "assisted-hybrid",
      signalId,
      card,
      conversationLog,
      status: "active",
      linkedTools: [],
      revisions: [],
    };
    setCurrent(o);
    setOrientations((prev) => [o, ...prev]);
    sendBack(o);
    setViewMode("summary");
  }, [projectName, signalId, sendBack]);

  const handleDesertComplete = useCallback((card) => {
    const o = {
      id: genId(),
      project: projectName.trim() || "",
      timestamp: ts(),
      mode: "desert",
      signalId,
      card,
      conversationLog: null,
      status: "active",
      linkedTools: [],
      revisions: [],
    };
    setCurrent(o);
    setOrientations((prev) => [o, ...prev]);
    sendBack(o);
    setViewMode("summary");
  }, [projectName, signalId, sendBack]);

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

  const filledCount = current ? answeredCount(current.card) : 0;
  const showStartScreen = !current && viewMode !== "library" && viewMode !== "hybrid" && viewMode !== "desert";

  const MODES = [
    ["manual", "Manual", "Fill in the card at your own pace, in any order."],
    ["hybrid", "Assisted", "A conversational partner walks you through the card, one question at a time."],
    ["desert", "Desert", "The field holds its own conditions. It responds to coherence, not completion."],
  ];
  const startBlock = (
    <form className="wb-signal" onSubmit={(e) => { e.preventDefault(); startNew(); }}>
      <label htmlFor="bg-field-name" className="wb-label">Name this field</label>
      <div className="wb-signal-row">
        <input
          id="bg-field-name"
          className="wb-field"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Site hero, brand direction, Q3 strategy"
          autoComplete="off"
        />
        <button type="submit" className="wb-button">Begin</button>
      </div>
      <div className="wb-segments bg-modes" role="group" aria-label="How to work through it">
        {MODES.map(([key, label]) => (
          <button key={key} type="button" className="wb-segment" aria-pressed={engagementMode === key} onClick={() => setEngagementMode(key)}>{label}</button>
        ))}
      </div>
      <p className="wb-body wb-measure">{MODES.find(([key]) => key === engagementMode)[2]}</p>
    </form>
  );

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Breakground</h1>
        <nav className="wb-actions" aria-label="Breakground">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
          <button type="button" className="wb-link" aria-current={viewMode === "library" ? "page" : undefined} onClick={() => setViewMode("library")}>Saved</button>
          {current && (
            <button type="button" className="wb-link" aria-current={viewMode === "card" ? "page" : undefined} onClick={() => setViewMode("card")}>Card</button>
          )}
          {current && filledCount > 0 && (
            <button type="button" className="wb-link" aria-current={viewMode === "summary" ? "page" : undefined} onClick={() => { saveOrientation(); setViewMode("summary"); }}>Summary</button>
          )}
        </nav>
      </header>

      {showStartScreen && <div className="wb-tool-body">{startBlock}</div>}

      {viewMode === "library" && (
        <div className="wb-tool-body">
          {startBlock}
          {orientations.length > 0 ? (
            <div className="bg-saved-list">
              <h2 className="wb-name">Saved orientations</h2>
              {orientations.map((o) => (
                <OrientationListItem key={o.id} o={o} onLoad={loadOrientation} onDelete={deleteOrientation} />
              ))}
            </div>
          ) : (
            <p className="wb-body">Nothing is saved yet.</p>
          )}
        </div>
      )}

      {viewMode === "card" && current && (
        <div className="wb-tool-body">
          <div className="wb-signal">
            <label htmlFor="bg-card-name" className="wb-label">The field</label>
            <input
              id="bg-card-name"
              className="wb-field"
              value={current.project}
              onChange={(e) => setCurrent((p) => ({ ...p, project: e.target.value }))}
              placeholder="Untitled"
              autoComplete="off"
            />
          </div>

          <div className="bg-questions">
            {QUESTIONS.map((q) => (
              <QuestionField key={q.id} q={q} value={current.card[q.id]} onChange={updateField} />
            ))}
          </div>

          <div className="wb-actions">
            <button type="button" className="wb-button" onClick={completeOrientation} disabled={filledCount === 0}>Complete orientation</button>
            <button type="button" className="wb-link" onClick={() => { saveOrientation(); setViewMode("library"); }}>Save and close</button>
          </div>
        </div>
      )}

      {viewMode === "hybrid" && (
        <HybridMode onComplete={handleHybridComplete} projectName={projectName} />
      )}

      {viewMode === "desert" && (
        <DesertMode onComplete={handleDesertComplete} projectName={projectName} />
      )}

      {viewMode === "summary" && current && (
        <SummaryView
          orientation={current}
          onBack={() => setViewMode(current.mode === "assisted-hybrid" || current.mode === "desert" ? "library" : "card")}
          onExportJSON={() => exportJSON(current)}
          onExportMD={() => exportMarkdown(current)}
        />
      )}

      <p className="wb-body wb-measure">
        Embodied action precedes alignment. Practice precedes documentation. Silence is allowed. State is visible. Change is legible.
      </p>
    </section>
  );
}
