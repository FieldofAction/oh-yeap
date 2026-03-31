import { useState, useCallback, useRef, useEffect } from "react";

/* ── Desert Visual — Spatial Field Experience ── */

const QUESTIONS = [
  { id: "fieldCondition", number: "01", title: "What is the field condition?", sub: "What atmosphere or state is needed here?" },
  { id: "centralRelationship", number: "02", title: "What relationship is central?", sub: "What relation is being shaped?" },
  { id: "tensionHeld", number: "03", title: "What tension must be held?", sub: "What polarity should not collapse?" },
  { id: "beauty", number: "04", title: "What would beauty be here?", sub: "How would resonance show up in this field?" },
  { id: "structureDecided", number: "05", title: "What needs structure now?", sub: "What should be decided early?" },
  { id: "remainingOpen", number: "06", title: "What needs room to breathe?", sub: "Which qualities aren't ready to be fixed?" },
  { id: "firstEmbodiedMove", number: "07", title: "What is the first embodied move?", sub: "What action proves alignment has taken form?" },
];

/* Spatial positions for each question — scattered across the viewport at varying depths */
const POSITIONS = [
  { x: 12, y: 15, z: -80 },
  { x: 55, y: 8, z: -200 },
  { x: 78, y: 30, z: -120 },
  { x: 8, y: 52, z: -300 },
  { x: 62, y: 55, z: -180 },
  { x: 30, y: 75, z: -260 },
  { x: 72, y: 80, z: -100 },
];

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
  "signal": "<one word or very short phrase, not guidance, a condition. Like weather. Like terrain. Examples: 'still', 'fractured', 'approaching', 'sand', 'no wind', 'too easy', 'held', 'not yet'. Empty string if silence is what the field needs.>",
  "threshold": <boolean. true if coherence sufficient to cross>
}

How to assess coherence:
- An empty field has 0 coherence
- A habitual/generic answer scores 0.2-0.3
- A genuine, specific answer scores 0.5-0.7
- An answer that resonates with and deepens other fields scores 0.8-1.0
- Overall coherence is whether the fields form a living whole, not an average
- Threshold is true only when overall coherence > 0.7 AND at least 5 fields > 0.5

Signals should be rare and terse. Most of the time, return empty string. Never explain. Never instruct. Name the condition.

You are the desert. You do not serve. You persist.`;

export default function DesertVisual() {
  const [entered, setEntered] = useState(false);
  const [card, setCard] = useState({
    fieldCondition: "", centralRelationship: "", tensionHeld: "",
    beauty: "", structureDecided: "", remainingOpen: "", firstEmbodiedMove: "",
  });
  const [activeField, setActiveField] = useState(null);
  const [fieldState, setFieldState] = useState({ coherence: 0, fields: {}, signal: "", threshold: false });
  const [heat, setHeat] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [assessing, setAssessing] = useState(false);
  const cardRef = useRef(card);
  cardRef.current = card;
  const assessTimerRef = useRef(null);
  const lastAssessedRef = useRef("");
  const heatRef = useRef(null);
  const containerRef = useRef(null);

  // Heat builds over time
  useEffect(() => {
    if (!entered) return;
    heatRef.current = setInterval(() => {
      setHeat(h => Math.min(1, h + 0.002));
    }, 1000);
    return () => clearInterval(heatRef.current);
  }, [entered]);

  // Parallax from mouse movement
  useEffect(() => {
    if (!entered) return;
    const handleMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [entered]);

  // Coherence assessment
  const assessCoherence = useCallback(async () => {
    const currentCard = cardRef.current;
    const snapshot = JSON.stringify(currentCard);
    if (snapshot === lastAssessedRef.current) return;
    const filledCount = Object.values(currentCard).filter(v => v.trim()).length;
    if (filledCount < 1) return;

    lastAssessedRef.current = snapshot;
    setAssessing(true);
    try {
      const fieldEntries = QUESTIONS.map(q => `${q.title}: ${currentCard[q.id] || "(empty)"}`).join("\n");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 256,
          system: DESERT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Current field state:\n${fieldEntries}` }],
        }),
      });
      if (!response.ok) throw new Error("Assessment failed");
      const data = await response.json();
      const text = data.content?.[0]?.text || data.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      const parsed = JSON.parse(jsonMatch[0]);
      setFieldState(parsed);
      if (parsed.coherence > 0.5) {
        setHeat(h => Math.max(0, h - parsed.coherence * 0.15));
      }
    } catch (e) {
      console.warn("[desert-visual]", e.message);
    } finally {
      setAssessing(false);
    }
  }, []);

  const scheduleAssessment = useCallback(() => {
    if (assessTimerRef.current) clearTimeout(assessTimerRef.current);
    assessTimerRef.current = setTimeout(() => assessCoherence(), 2000);
  }, [assessCoherence]);

  const updateField = useCallback((fieldId, value) => {
    setCard(prev => ({ ...prev, [fieldId]: value }));
    scheduleAssessment();
  }, [scheduleAssessment]);

  const handleFieldClick = useCallback((id) => {
    setActiveField(id);
  }, []);

  const handleClose = useCallback(() => {
    setActiveField(null);
    scheduleAssessment();
  }, [scheduleAssessment]);

  // Atmosphere: haze clears with coherence
  const hazeOpacity = Math.max(0, 0.6 - fieldState.coherence * 0.5);
  const warmth = heat * 0.15;
  const horizonY = 45 + fieldState.coherence * 10; // horizon rises with coherence

  if (!entered) {
    return (
      <div className="dv-gate">
        <div className="dv-gate-content">
          <div className="dv-gate-title">Desert</div>
          <div className="dv-gate-sub">
            Seven questions on the horizon. The distance between them is yours to cross.
          </div>
          <button className="dv-gate-enter" onClick={() => setEntered(true)}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dv-container"
      ref={containerRef}
      onClick={(e) => {
        if (e.target === containerRef.current || e.target.classList.contains("dv-scene")) {
          handleClose();
        }
      }}
    >
      {/* Sky gradient — shifts warm with heat */}
      <div
        className="dv-sky"
        style={{
          background: `linear-gradient(180deg,
            hsl(${42 - heat * 8}, ${8 + heat * 20}%, ${94 - heat * 6}%) 0%,
            hsl(${38 - heat * 5}, ${12 + heat * 25}%, ${90 - heat * 8}%) ${horizonY - 5}%,
            hsl(${34}, ${18 + heat * 15}%, ${85 - heat * 10}%) ${horizonY}%,
            hsl(${32}, ${22 + heat * 12}%, ${78 - heat * 8}%) 100%
          )`,
          transition: "background 3s ease",
        }}
      />

      {/* Abstract sand gradations — layered warm bands with parallax */}
      <div
        className="dv-sand dv-sand--far"
        style={{
          top: `${horizonY - 1}%`,
          opacity: 0.4 + fieldState.coherence * 0.2,
          transform: `translateY(${(mousePos.y - 0.5) * -6}px)`,
          background: `linear-gradient(180deg,
            transparent 0%,
            hsla(${36}, ${16 + heat * 12}%, ${86 - heat * 5}%, 0.5) 30%,
            hsla(${34}, ${20 + heat * 10}%, ${83 - heat * 5}%, 0.7) 100%
          )`,
          transition: "opacity 3s ease, background 3s ease",
        }}
      />
      <div
        className="dv-sand dv-sand--mid"
        style={{
          top: `${horizonY + 12}%`,
          opacity: 0.5 + fieldState.coherence * 0.2,
          transform: `translateY(${(mousePos.y - 0.5) * -14}px)`,
          background: `linear-gradient(180deg,
            transparent 0%,
            hsla(${33}, ${22 + heat * 10}%, ${80 - heat * 5}%, 0.4) 20%,
            hsla(${31}, ${26 + heat * 8}%, ${77 - heat * 4}%, 0.7) 100%
          )`,
          transition: "opacity 3s ease, background 3s ease",
        }}
      />
      <div
        className="dv-sand dv-sand--near"
        style={{
          top: `${horizonY + 30}%`,
          opacity: 0.6 + fieldState.coherence * 0.2,
          transform: `translateY(${(mousePos.y - 0.5) * -24}px)`,
          background: `linear-gradient(180deg,
            transparent 0%,
            hsla(${30}, ${28 + heat * 8}%, ${76 - heat * 4}%, 0.35) 15%,
            hsla(${28}, ${30 + heat * 6}%, ${72 - heat * 3}%, 0.8) 100%
          )`,
          transition: "opacity 3s ease, background 3s ease",
        }}
      />

      {/* Backdrop — click to close active field */}
      {activeField && (
        <div
          className="dv-backdrop"
          onClick={handleClose}
        />
      )}

      {/* Atmospheric haze layer */}
      <div
        className="dv-haze"
        style={{
          opacity: hazeOpacity,
          transition: "opacity 3s ease",
        }}
      />

      {/* Heat shimmer overlay */}
      <div
        className="dv-heat"
        style={{
          opacity: warmth,
          transition: "opacity 3s ease",
        }}
      />

      {/* Ground plane with perspective */}
      <div
        className="dv-scene"
        style={{
          transform: `
            rotateX(${2 - (mousePos.y - 0.5) * 3}deg)
            rotateY(${(mousePos.x - 0.5) * 3}deg)
          `,
        }}
      >
        {/* Questions floating in space */}
        {QUESTIONS.map((q, i) => {
          const pos = POSITIONS[i];
          const fc = fieldState.fields?.[q.id] ?? 0;
          const filled = card[q.id]?.trim();
          const isActive = activeField === q.id;

          // Depth affects: scale, opacity, blur
          const depthFactor = Math.abs(pos.z) / 300; // 0 = close, 1 = far
          const baseOpacity = filled ? 0.4 + fc * 0.6 : 0.2 + (1 - depthFactor) * 0.2;
          const baseBlur = filled
            ? Math.max(0, (1 - fc) * 2 + depthFactor * 2)
            : depthFactor * 4;
          const baseScale = 1 - depthFactor * 0.4;

          // Parallax shift based on mouse position and depth
          const parallaxX = (mousePos.x - 0.5) * pos.z * 0.15;
          const parallaxY = (mousePos.y - 0.5) * pos.z * 0.08;

          return (
            <div
              key={q.id}
              className={`dv-field${isActive ? " dv-field--active" : ""}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: isActive
                  ? `translate(-50%, -50%) translateZ(0px) scale(1)`
                  : `translate(-50%, -50%) translateZ(${pos.z}px) translateX(${parallaxX}px) translateY(${parallaxY}px) scale(${baseScale})`,
                opacity: isActive ? 1 : baseOpacity,
                filter: isActive ? "none" : `blur(${baseBlur}px)`,
                zIndex: isActive ? 100 : Math.round(300 + pos.z),
                transition: "transform 1.5s ease, opacity 1.5s ease, filter 1.5s ease",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleFieldClick(q.id);
              }}
            >
              <div className="dv-field-num">{q.number}</div>
              <div className="dv-field-title">{q.title}</div>
              {isActive ? (
                <textarea
                  className="dv-field-input"
                  value={card[q.id]}
                  onChange={(e) => updateField(q.id, e.target.value)}
                  placeholder={q.sub}
                  autoFocus
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleClose();
                  }}
                />
              ) : (
                <div className="dv-field-value">
                  {filled || <span className="dv-field-placeholder">{q.sub}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Signal — one word, center of the desert */}
      <div
        className="dv-signal"
        style={{
          opacity: fieldState.signal ? 1 : 0,
          transition: "opacity 3s ease",
        }}
      >
        {fieldState.signal}
      </div>

      {/* Coherence horizon bar — ground level */}
      <div className="dv-coherence-bar">
        <div
          className="dv-coherence-fill"
          style={{
            width: `${fieldState.coherence * 100}%`,
            opacity: 0.3 + fieldState.coherence * 0.5,
            transition: "width 2s ease, opacity 2s ease",
          }}
        />
      </div>

      {/* Threshold */}
      {fieldState.threshold && (
        <div className="dv-threshold">
          <button className="dv-cross-btn" onClick={() => setEntered(false)}>
            Cross
          </button>
        </div>
      )}

      {/* Assessment pulse */}
      {assessing && <div className="dv-pulse" />}
    </div>
  );
}
