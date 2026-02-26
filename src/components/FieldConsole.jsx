import { useState, useRef, useCallback } from "react";

const LAWS = [
  { id:"origin",     number:"I",   name:"Origin",     axiom:"The field begins in mind",           glyph:"◎", angle:-90,     color:"#C9A84C", description:"Every condition in the field traces back to a mental state. Consciousness is not inside the situation — it generates it." },
  { id:"scale",      number:"II",  name:"Scale",      axiom:"The pattern holds at every level",    glyph:"⟡", angle:-38.57,  color:"#8B7EC8", description:"What is true in the small is true in the large. Navigate one level well and you are navigating all levels simultaneously." },
  { id:"frequency",  number:"III", name:"Frequency",  axiom:"Everything is signal",                glyph:"〜", angle:12.86,   color:"#5BA8A0", description:"Every action, thought, and state broadcasts a signal. The frequency you hold determines what you can receive and what you attract." },
  { id:"axis",       number:"IV",  name:"Axis",       axiom:"Every force has its complement",      glyph:"⊕", angle:64.29,   color:"#E07B5A", description:"Opposing forces are not enemies — they are the same spectrum. Mastery is moving fluidly between poles rather than being fixed at either end." },
  { id:"cycle",      number:"V",   name:"Cycle",      axiom:"Everything moves in season",          glyph:"≋", angle:115.71,  color:"#7AB8D4", description:"Expansion follows contraction. Rest follows output. The practitioner who knows the cycle is never caught off-guard by either phase." },
  { id:"vector",     number:"VI",  name:"Vector",     axiom:"Every action carries direction",      glyph:"→", angle:167.14,  color:"#B5CC8E", description:"Nothing is neutral. Every move you make has magnitude and direction — and produces a corresponding effect downstream. Awareness is the instrument." },
  { id:"generation", number:"VII", name:"Generation", axiom:"Creation requires two",               glyph:"⚭", angle:218.57,  color:"#D4A0C8", description:"Structure and flow. Initiative and receptivity. Every act of creation requires both principles operating in conscious relation to each other." },
];

const PAIR_MECHANICS = {
  "origin+scale":      { name:"The Fractal Mind",       mechanic:"Your mental state isn't influencing the pattern at other scales — it IS the pattern. Change the interior condition and the exterior structure reorganizes to match." },
  "origin+frequency":  { name:"The Broadcast",          mechanic:"Thought is the transmitter. What you dwell in mentally becomes the signal you broadcast. The field around you responds to frequency, not intention alone." },
  "origin+axis":       { name:"The Chooser",            mechanic:"You cannot dissolve the poles — but you can choose which end your mind inhabits. That choice is the only leverage that matters. Everything else follows from it." },
  "origin+cycle":      { name:"The Witness",            mechanic:"Mind is what watches cycles without being carried by them. When you locate yourself as the observer, the oscillation can no longer use you as its instrument." },
  "origin+vector":     { name:"The First Move",         mechanic:"Conscious thought is first cause. Every downstream effect in your field traces back to a mental state held with enough clarity and conviction to become directive." },
  "origin+generation": { name:"The Inner Studio",       mechanic:"Structure and flow begin as inner orientations before they become outer realities. The creative act starts when both principles are active and conscious simultaneously." },
  "scale+frequency":   { name:"The Signal at Every Level", mechanic:"Frequency doesn't stay on one level — it propagates across all corresponding scales at once. Shift your signal and the shift appears everywhere the pattern repeats." },
  "scale+axis":        { name:"The Mirror Field",       mechanic:"Every polarity you're navigating externally reflects one operating internally at a corresponding scale. The same dynamic, different resolution. Navigate one, you navigate both." },
  "scale+cycle":       { name:"The Nested Season",      mechanic:"Your personal cycle mirrors team cycles mirrors market cycles mirrors longer arcs. You are always inside multiple rhythms simultaneously. Locate which one is dominant." },
  "scale+vector":      { name:"The Ripple Architecture", mechanic:"A single directed action produces effects at every corresponding scale simultaneously. The leverage isn't in the size of the move — it's in how precisely it's aimed." },
  "scale+generation":  { name:"The Universal Template",  mechanic:"Structure and flow operate at every scale of existence. The same creative dynamic inside a single decision as inside an organizational system. Master the template once." },
  "frequency+axis":    { name:"The Spectrum",            mechanic:"Opposing poles aren't fixed positions — they are different frequencies on the same continuum. You don't fight the pole you don't want. You raise the frequency and the field transmutes." },
  "frequency+cycle":   { name:"The Standing Wave",       mechanic:"Signal and cycle interact. Where your frequency aligns with the current phase of the cycle, power concentrates. Where they're out of phase, release is indicated, not force." },
  "frequency+vector":  { name:"The Directed Signal",     mechanic:"Frequency is the carrier. Vector is the aim. A strong signal without direction diffuses. A clear direction without frequency has no force. Together they become decisive." },
  "frequency+generation":{ name:"The Creative Field",    mechanic:"Structure holds a frequency. Flow holds a frequency. When both are broadcasting simultaneously and in relation, the space between them becomes generative." },
  "axis+cycle":        { name:"The Pendulum",            mechanic:"Every swing between poles follows the cycle law. The wider the arc, the more extreme the return. The practitioner's advantage is staying near center as the field oscillates around them." },
  "axis+vector":       { name:"The Corrective Loop",     mechanic:"Push too hard in one direction and the field self-corrects via the opposite pole. Vector without axis awareness creates its own resistance. Balance isn't passive — it's the most efficient path." },
  "axis+generation":   { name:"The Primal Pair",         mechanic:"Structure and flow are the fundamental axis — not as a binary but as complementary forces. Every creative act is a navigation between them. The tension is the engine." },
  "cycle+vector":      { name:"The Timing Law",          mechanic:"The same action lands differently depending on where in the cycle you execute it. Vector without cycle awareness produces effort. Vector with it produces results that seem effortless." },
  "cycle+generation":  { name:"The Alternating Current",  mechanic:"Structure initiates in the expansion phase. Flow receives and develops in the contraction. Forcing structure during a contraction burns the system. Learning the current changes everything." },
  "vector+generation": { name:"The Seed and Field",       mechanic:"Initiative is the vector — it provides direction and force. Receptivity is the field that receives it and generates form from it. Neither is sufficient alone. The question is which you're undersupplying." },
};

const getPairKey = (id1, id2) => {
  const order = LAWS.map(l => l.id);
  const [a, b] = [id1, id2].sort((x, y) => order.indexOf(x) - order.indexOf(y));
  return `${a}+${b}`;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/* ── SVG sub-components ── */

function LawNode({ law, active, detected, onClick, cx, cy, radius }) {
  const x = cx + radius * Math.cos(toRad(law.angle));
  const y = cy + radius * Math.sin(toRad(law.angle));
  const nodeR = 38;
  const isHighlighted = active || detected;

  return (
    <g onClick={() => onClick(law.id)} style={{ cursor: "pointer" }}>
      {isHighlighted && (
        <circle cx={x} cy={y} r={nodeR + 14} fill="none"
          stroke={law.color}
          strokeWidth={detected && !active ? "1.5" : "1"}
          opacity={detected && !active ? 0.4 : 0.2}
          strokeDasharray={detected && !active ? "4 4" : "none"}
          className="fl-pulse"
        />
      )}
      <circle cx={x} cy={y} r={nodeR}
        fill={active ? `${law.color}28` : detected ? `${law.color}0e` : "var(--bg)"}
        stroke={active ? law.color : detected ? `${law.color}77` : "var(--bd)"}
        strokeWidth={active ? "1.5" : detected ? "1" : "0.75"}
        style={{ transition: "all 0.5s ease" }}
      />
      {detected && !active && (
        <circle cx={x} cy={y} r={nodeR - 7} fill="none"
          stroke={law.color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2 7" />
      )}
      <text x={x} y={y - 10} textAnchor="middle"
        fill={active ? law.color : detected ? `${law.color}cc` : "var(--bd)"}
        fontSize="18" fontFamily="var(--display)"
        style={{ transition: "fill 0.5s ease", userSelect: "none" }}>
        {law.glyph}
      </text>
      <text x={x} y={y + 6} textAnchor="middle"
        fill={isHighlighted ? "var(--fg)" : "var(--bd)"}
        fontSize="9" fontFamily="var(--mono)" letterSpacing="1.5"
        style={{ transition: "fill 0.5s ease", userSelect: "none" }}>
        {law.number}
      </text>
      <text x={x} y={y + 18} textAnchor="middle"
        fill={active ? law.color : detected ? `${law.color}88` : "var(--bd)"}
        fontSize="8" fontFamily="var(--mono)" letterSpacing="1"
        style={{ transition: "fill 0.5s ease", userSelect: "none" }}>
        {law.name.toUpperCase()}
      </text>
    </g>
  );
}

function ConnectionLines({ active, detected, cx, cy, radius }) {
  const getPos = (law) => ({
    x: cx + radius * Math.cos(toRad(law.angle)),
    y: cy + radius * Math.sin(toRad(law.angle)),
  });
  const activeNodes = LAWS.filter(l => active.has(l.id));
  const allHighlighted = LAWS.filter(l => active.has(l.id) || detected.has(l.id));
  const lines = [];
  const rendered = new Set();

  for (let i = 0; i < activeNodes.length; i++) {
    for (let j = i + 1; j < activeNodes.length; j++) {
      const a = activeNodes[i], b = activeNodes[j];
      const key = `${a.id}-${b.id}`;
      rendered.add(key);
      const pa = getPos(a), pb = getPos(b);
      lines.push(
        <line key={`glow-${key}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke={a.color} strokeWidth="4" opacity="0.07" />,
        <line key={`a-${key}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke={`url(#grad-${a.id}-${b.id})`} strokeWidth="1.5"
          strokeDasharray="6 4" className="fl-dash" />
      );
    }
  }

  for (let i = 0; i < allHighlighted.length; i++) {
    for (let j = i + 1; j < allHighlighted.length; j++) {
      const key = `${allHighlighted[i].id}-${allHighlighted[j].id}`;
      if (!rendered.has(key)) {
        const pa = getPos(allHighlighted[i]), pb = getPos(allHighlighted[j]);
        lines.push(
          <line key={`d-${key}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke="var(--bd)" strokeWidth="0.75" strokeDasharray="2 10" opacity="0.7" />
        );
      }
    }
  }

  const defs = activeNodes.flatMap((a, i) =>
    activeNodes.slice(i + 1).map(b => (
      <linearGradient key={`grad-${a.id}-${b.id}`} id={`grad-${a.id}-${b.id}`}
        x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={a.color} stopOpacity="0.9" />
        <stop offset="100%" stopColor={b.color} stopOpacity="0.9" />
      </linearGradient>
    ))
  );

  return <g><defs>{defs}</defs>{lines}</g>;
}

/* ── Mechanics Grid ── */

function MechanicsGrid({ combined, active, detected }) {
  const lawList = LAWS.filter(l => combined.has(l.id));
  if (lawList.length < 2) return null;
  const pairs = [];
  for (let i = 0; i < lawList.length; i++) {
    for (let j = i + 1; j < lawList.length; j++) {
      const a = lawList[i], b = lawList[j];
      const key = getPairKey(a.id, b.id);
      const mechanic = PAIR_MECHANICS[key];
      if (mechanic) pairs.push({ a, b, key, ...mechanic });
    }
  }

  return (
    <div className="fl-mech en">
      <div className="fl-mech-label">Field Mechanics — How They Operate Together</div>
      <div className="fl-mech-grid">
        {pairs.map(({ a, b, key, name, mechanic }) => (
          <div key={key} className="fl-mech-card en">
            <div className="fl-mech-bar" style={{ background: `linear-gradient(to right, ${a.color}, ${b.color})` }} />
            <div className="fl-mech-pair">
              <span style={{ color: a.color }}>{a.glyph} {a.name.toUpperCase()}</span>
              <span className="fl-mech-x">×</span>
              <span style={{ color: b.color }}>{b.glyph} {b.name.toUpperCase()}</span>
            </div>
            <div className="fl-mech-name">{name}</div>
            <div className="fl-mech-body">{mechanic}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function FieldConsole() {
  const [active, setActive] = useState(new Set());
  const [detected, setDetected] = useState(new Set());
  const [situation, setSituation] = useState("");
  const [situationName, setSituationName] = useState("");
  const [synthesis, setSynthesis] = useState(null);
  const [detectionNote, setDetectionNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const textRef = useRef(null);

  const W = 540, H = 540;
  const cx = W / 2, cy = H / 2;
  const radius = 195;

  const toggleLaw = useCallback((id) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSynthesis(null);
  }, []);

  const detectLaws = async () => {
    if (!situation.trim()) return;
    setDetecting(true);
    setDetected(new Set());
    setDetectionNote(null);
    setSynthesis(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: `You identify which of the seven Field Laws are most present in a described situation.\nThe seven laws and their IDs:\n- origin: the situation's conditions trace back to a mental or perceptual state\n- scale: the same pattern is operating at multiple levels simultaneously\n- frequency: the person's signal, energy, or state is the key variable\n- axis: opposing forces or poles are in tension\n- cycle: timing, phases, contraction or expansion are the dominant dynamic\n- vector: causation, direction, and downstream effects are in play\n- generation: creation, collaboration, or the interplay of structure and flow is at stake\nReturn ONLY valid JSON — no markdown, no extra text:\n{"laws":["id1","id2"],"note":"One sentence naming the core dynamic at play."}\nSelect 2 to 4 laws most genuinely active. Be precise.`,
          messages: [{ role: "user", content: situation }]
        })
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      const validIds = new Set(LAWS.map(l => l.id));
      setDetected(new Set((parsed.laws || []).filter(id => validIds.has(id))));
      setDetectionNote(parsed.note || null);
    } catch {
      setDetectionNote("The field is present. Trust what you feel.");
    }
    setDetecting(false);
  };

  const generateSynthesis = async () => {
    const combined = new Set([...active, ...detected]);
    if (combined.size < 1) return;
    setLoading(true);
    setSynthesis(null);
    const activeLaws = LAWS.filter(l => active.has(l.id));
    const detectedOnlyLaws = LAWS.filter(l => detected.has(l.id) && !active.has(l.id));
    const allLaws = LAWS.filter(l => combined.has(l.id));
    const lawDescriptions = allLaws.map(l => `${l.name} ("${l.axiom}"): ${l.description}`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 900,
          system: `You are a strategic field guide. Practical, precise, direct. Present tense. No mystical language — this is systems intelligence applied to real situations.\nGiven a situation and the field laws active within it, reveal:\n1. The specific leverage point where these laws intersect for THIS situation\n2. What operating from the center of this combination actually looks and feels like\n3. One concrete move available from that position right now\nThree tight paragraphs. No lists. Speak directly to the person as a trusted advisor would.`,
          messages: [{
            role: "user",
            content: `${situationName ? `Experience named: "${situationName}"\n` : ""}What I'm navigating: ${situation}\n\nLaws detected as active in this field: ${detectedOnlyLaws.map(l => l.name).join(", ") || "none"}\nLaws I am choosing to engage consciously: ${activeLaws.map(l => l.name).join(", ") || "working with detected"}\n\nAll field laws in play:\n${lawDescriptions}`
          }]
        })
      });
      const data = await res.json();
      setSynthesis(data.content?.[0]?.text || "The field cannot be reduced to words. Sit with the combination.");
    } catch {
      setSynthesis("The field cannot be reduced to words. Sit with the combination.");
    }
    setLoading(false);
  };

  const reset = () => {
    setActive(new Set());
    setDetected(new Set());
    setSituation("");
    setSituationName("");
    setSynthesis(null);
    setDetectionNote(null);
  };

  const combined = new Set([...active, ...detected]);
  const detectedLaws = LAWS.filter(l => detected.has(l.id));

  return (
    <div className="fl en">
      {/* Header */}
      <div className="fl-header en d1">
        <div className="fl-pre">Field of Action</div>
        <h1 className="fl-h">Field Console</h1>
        <div className="fl-rule" />
      </div>

      {/* Situation Panel */}
      <div className="fl-sit en d2">
        <div className="fl-sit-header">
          <span className="fl-sit-label">Name the Experience</span>
          {situationName && <span className="fl-sit-echo">{situationName}</span>}
        </div>
        <div className="fl-sit-name-wrap">
          <input className="fl-name-input" placeholder="Give this moment a name..."
            value={situationName} onChange={e => setSituationName(e.target.value)} />
        </div>
        <textarea className="fl-sit-input" ref={textRef} rows={3}
          placeholder="Describe what you're navigating right now..."
          value={situation}
          onChange={e => { setSituation(e.target.value); setDetected(new Set()); setDetectionNote(null); setSynthesis(null); }}
        />
        <div className="fl-sit-footer">
          <span className="fl-sit-note" style={{ fontStyle: detecting ? "italic" : "normal" }}>
            {detecting ? "Reading the field..." : detectionNote ? `${detectionNote}` : "Which laws are active in your field right now?"}
          </span>
          <button className="btn" onClick={detectLaws} disabled={detecting || !situation.trim()}>
            {detecting ? "..." : "Detect"}
          </button>
        </div>
      </div>

      {/* Detected laws strip */}
      {detectedLaws.length > 0 && (
        <div className="fl-detected en">
          <div className="fl-detected-label">Field Laws Active in This Situation</div>
          <div className="fl-detected-chips">
            {detectedLaws.map(l => (
              <span key={l.id} className="fl-law-chip" onClick={() => toggleLaw(l.id)}
                style={{
                  border: `1px solid ${active.has(l.id) ? l.color : l.color + "44"}`,
                  color: active.has(l.id) ? l.color : l.color + "88",
                  background: active.has(l.id) ? `${l.color}15` : "transparent",
                }}>
                {l.glyph} {l.name}{active.has(l.id) && <span style={{ opacity: 0.5 }}> ✓</span>}
              </span>
            ))}
          </div>
          <div className="fl-detected-hint">Tap to engage consciously — or activate any law on the console below.</div>
        </div>
      )}

      {/* SVG Console */}
      <div className="fl-ring en d3">
        <svg viewBox={`0 0 ${W} ${H}`} className="fl-svg">
          <circle cx={cx} cy={cy} r={radius + 50} fill="none" stroke="var(--bd)" strokeWidth="1" opacity="0.5" />
          <circle cx={cx} cy={cy} r={radius - 44} fill="none" stroke="var(--bd)" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.5" />
          <ConnectionLines active={active} detected={detected} cx={cx} cy={cy} radius={radius} />
          {LAWS.map(law => (
            <LawNode key={law.id} law={law}
              active={active.has(law.id)} detected={detected.has(law.id)}
              onClick={toggleLaw} cx={cx} cy={cy} radius={radius} />
          ))}
          {/* Field Center */}
          <circle cx={cx} cy={cy} r={62} fill="var(--bg)" stroke="var(--bd)" strokeWidth="1.5" />
          {combined.size > 0 && (
            <>
              <circle cx={cx} cy={cy} r={62} fill="none" stroke="var(--ac2)" strokeWidth="0.5" opacity={0.3} className="fl-breathe" />
              <circle cx={cx} cy={cy} r={54} fill="none" stroke="var(--ac2)" strokeWidth="0.3" opacity={0.12}
                strokeDasharray="2 9" className="fl-spin" style={{ transformOrigin: `${cx}px ${cy}px` }} />
            </>
          )}
          <text x={cx} y={cy - 10} textAnchor="middle"
            fill={combined.size > 0 ? "var(--ac2)" : "var(--bd)"}
            fontSize="8" fontFamily="var(--mono)" letterSpacing="2"
            style={{ transition: "fill 0.5s" }}>
            {combined.size === 0 ? "FIELD CENTER" : situationName ? "IN FIELD" : "FIELD CENTER"}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={combined.size > 0 ? "var(--fg)" : "var(--bd)"}
            fontSize={combined.size === 0 ? 14 : 24} fontFamily="var(--display)"
            style={{ transition: "all 0.5s" }}>
            {combined.size === 0 ? "○" : combined.size}
          </text>
          {combined.size > 0 && (
            <text x={cx} y={cy + 24} textAnchor="middle" fill="var(--ff)"
              fontSize="7" fontFamily="var(--mono)" letterSpacing="2">
              {combined.size === 1 ? "LAW" : "LAWS"}
            </text>
          )}
        </svg>
      </div>

      {/* Mechanics Grid */}
      <MechanicsGrid combined={combined} active={active} detected={detected} />

      {/* Controls */}
      <div className="fl-controls">
        {combined.size >= 1 && (
          <button className="btn" onClick={generateSynthesis} disabled={loading}>
            {loading ? "Reading the field..." : "Synthesize Field"}
          </button>
        )}
        {(situation || combined.size > 0) && (
          <button className="btn gh" onClick={reset}>Clear All</button>
        )}
      </div>

      {/* Synthesis */}
      {synthesis && (
        <div className="fl-synth en">
          <div className="fl-synth-header">
            <div className="fl-synth-label">Field Synthesis</div>
            {situationName && <div className="fl-synth-name">{situationName}</div>}
          </div>
          <div className="fl-synth-body">{synthesis}</div>
          <div className="fl-synth-laws">
            {LAWS.filter(l => combined.has(l.id)).map(l => (
              <span key={l.id} className="fl-synth-tag" style={{ color: active.has(l.id) ? l.color : `${l.color}66` }}>
                {l.glyph} {l.name.toUpperCase()}{active.has(l.id) ? " · engaged" : " · detected"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {combined.size === 0 && !situation && (
        <div className="fl-empty">
          <p>Name your experience. Describe it. Let the field find you.</p>
          <p>Or activate any law directly to begin.</p>
        </div>
      )}
    </div>
  );
}
