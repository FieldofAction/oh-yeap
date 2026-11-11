import { useState, useRef, useCallback, useEffect } from "react";
import useASUStore from "../store/useASUStore";
import { LAWS, PAIR_MECHANICS } from "../data/field-laws";

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
  const nodeR = 46;
  const isHighlighted = active || detected;

  return (
    <g onClick={() => onClick(law.id)} style={{ cursor: "pointer" }}>
      {isHighlighted && (
        <circle cx={x} cy={y} r={nodeR + 16} fill="none"
          stroke={law.color}
          strokeWidth={detected && !active ? "2" : "1.5"}
          opacity={detected && !active ? 0.4 : 0.2}
          strokeDasharray={detected && !active ? "4 4" : "none"}
          className="fl-pulse"
        />
      )}
      <circle cx={x} cy={y} r={nodeR}
        fill={active ? `${law.color}28` : detected ? `${law.color}0e` : "var(--bg)"}
        stroke={active ? law.color : detected ? `${law.color}77` : "var(--bd)"}
        strokeWidth={active ? "3" : detected ? "2" : "2"}
        style={{ transition: "all 0.5s ease" }}
      />
      {detected && !active && (
        <circle cx={x} cy={y} r={nodeR - 8} fill="none"
          stroke={law.color} strokeWidth="1" opacity="0.25" strokeDasharray="2 7" />
      )}
      <text x={x} y={y - 6} textAnchor="middle"
        fill={active ? law.color : detected ? `${law.color}cc` : "var(--bd)"}
        fontSize="22" fontFamily="var(--display)" fontWeight="600"
        style={{ transition: "fill 0.5s ease", userSelect: "none" }}>
        {law.glyph}
      </text>
      <text x={x} y={y + 14} textAnchor="middle"
        fill={active ? law.color : detected ? `${law.color}88` : "var(--bd)"}
        fontSize="10" fontFamily="var(--sans)" fontWeight="700" letterSpacing="1.5"
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
          stroke={a.color} strokeWidth="6" opacity="0.07" />,
        <line key={`a-${key}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
          stroke={`url(#grad-${a.id}-${b.id})`} strokeWidth="2.5"
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
            stroke="var(--bd)" strokeWidth="1.5" strokeDasharray="2 10" opacity="0.7" />
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
      <div className="fl-mech-label">Field Mechanics: How They Operate Together</div>
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
  const asu = useASUStore();
  const [active, setActive] = useState(new Set());
  const [detected, setDetected] = useState(new Set());
  const [situation, setSituation] = useState("");
  const [situationName, setSituationName] = useState("");
  const [synthesis, setSynthesis] = useState(null);
  const [detectionNote, setDetectionNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "k" || e.key === "K") setShowKey(v => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const W = 640, H = 640;
  const cx = W / 2, cy = H / 2;
  const radius = 240;

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
    const settings = asu.get_settings();
    if (!settings.apiKey) { setDetectionNote("API key is missing. Add it in Backstage → Settings."); return; }
    setDetecting(true);
    setDetected(new Set());
    setDetectionNote(null);
    setSynthesis(null);
    try {
      console.log("[Console] detect → key:", settings.apiKey ? `${settings.apiKey.slice(0,10)}...` : "MISSING", "model:", settings.model);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json","x-api-key":settings.apiKey,"anthropic-version":settings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 400,
          system: `You identify which of the seven Field Laws are most present in a described situation.\nThe seven laws and their IDs:\n- origin: the situation's conditions trace back to a mental or perceptual state\n- scale: the same pattern is operating at multiple levels simultaneously\n- frequency: the person's signal, energy, or state is the key variable\n- axis: opposing forces or poles are in tension\n- cycle: timing, phases, contraction or expansion are the dominant dynamic\n- vector: causation, direction, and downstream effects are in play\n- generation: creation, collaboration, or the interplay of structure and flow is at stake\nReturn ONLY valid JSON, no markdown, no extra text:\n{"laws":["id1","id2"],"note":"One sentence naming the core dynamic at play."}\nSelect 2 to 4 laws most genuinely active. Be precise.`,
          messages: [{ role: "user", content: situation }]
        })
      });
      if (!res.ok) { const errBody = await res.text(); console.error("[Console] API error:", res.status, errBody); setDetectionNote(`API error ${res.status}. Check key and model in Backstage → Settings`); setDetecting(false); return; }
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      const validIds = new Set(LAWS.map(l => l.id));
      setDetected(new Set((parsed.laws || []).filter(id => validIds.has(id))));
      setDetectionNote(parsed.note || null);
    } catch (err) {
      console.error("[Console] detect error:", err);
      setDetectionNote("Detection failed. Check browser console for details.");
    }
    setDetecting(false);
  };

  const generateSynthesis = async () => {
    const combined = new Set([...active, ...detected]);
    if (combined.size < 1) return;
    const settings = asu.get_settings();
    if (!settings.apiKey) { setSynthesis("API key is missing. Add it in Backstage → Settings."); return; }
    setLoading(true);
    setSynthesis(null);
    const activeLaws = LAWS.filter(l => active.has(l.id));
    const detectedOnlyLaws = LAWS.filter(l => detected.has(l.id) && !active.has(l.id));
    const allLaws = LAWS.filter(l => combined.has(l.id));
    const lawDescriptions = allLaws.map(l => `${l.name} ("${l.axiom}"): ${l.description}`).join("\n");
    try {
      console.log("[Console] synthesize → key:", settings.apiKey ? `${settings.apiKey.slice(0,10)}...` : "MISSING", "model:", settings.model);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json","x-api-key":settings.apiKey,"anthropic-version":settings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 900,
          system: `You are a strategic field guide. Practical, precise, direct. Present tense. No mystical language. This is systems intelligence applied to real situations.\nGiven a situation and the field laws active within it, reveal:\n1. The specific leverage point where these laws intersect for THIS situation\n2. What operating from the center of this combination actually looks and feels like\n3. One concrete move available from that position right now\nThree tight paragraphs. No lists. Speak directly to the person as a trusted advisor would.`,
          messages: [{
            role: "user",
            content: `${situationName ? `Experience named: "${situationName}"\n` : ""}What I'm navigating: ${situation}\n\nLaws detected as active in this field: ${detectedOnlyLaws.map(l => l.name).join(", ") || "none"}\nLaws I am choosing to engage consciously: ${activeLaws.map(l => l.name).join(", ") || "working with detected"}\n\nAll field laws in play:\n${lawDescriptions}`
          }]
        })
      });
      if (!res.ok) { const errBody = await res.text(); console.error("[Console] API error:", res.status, errBody); setSynthesis(`API error ${res.status}. Check key and model in Backstage → Settings`); setLoading(false); return; }
      const data = await res.json();
      setSynthesis(data.content?.[0]?.text || "The field cannot be reduced to words. Sit with the combination.");
    } catch (err) {
      console.error("[Console] synthesis error:", err);
      setSynthesis("Synthesis failed. Check browser console for details.");
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
        <h1 className="fl-h">Console</h1>
        <div className="fl-rule" />
      </div>

      {/* Hidden Translation Key */}
      {showKey && (
        <div className="fl-key en">
          <div className="fl-key-label">Translation Key</div>
          <div className="fl-key-grid">
            {LAWS.map(l => (
              <div key={l.id} className="fl-key-row">
                <span className="fl-key-source">{l.source}</span>
                <span className="fl-key-arrow">→</span>
                <span className="fl-key-name" style={{ color: l.color }}>{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="fl-detected-hint">Tap to engage consciously, or activate any law on the console below.</div>
        </div>
      )}

      {/* SVG Console */}
      <div className="fl-ring en d3">
        <svg viewBox={`0 0 ${W} ${H}`} className="fl-svg">
          <ConnectionLines active={active} detected={detected} cx={cx} cy={cy} radius={radius} />
          {LAWS.map(law => (
            <LawNode key={law.id} law={law}
              active={active.has(law.id)} detected={detected.has(law.id)}
              onClick={toggleLaw} cx={cx} cy={cy} radius={radius} />
          ))}
          {/* Field Center */}
          <circle cx={cx} cy={cy} r={72} fill="var(--bg)" stroke="var(--bd)" strokeWidth="3" />
          {combined.size > 0 && (
            <>
              <circle cx={cx} cy={cy} r={72} fill="none" stroke="var(--ac2)" strokeWidth="1" opacity={0.3} className="fl-breathe" />
              <circle cx={cx} cy={cy} r={62} fill="none" stroke="var(--ac2)" strokeWidth="0.5" opacity={0.12}
                strokeDasharray="2 9" className="fl-spin" style={{ transformOrigin: `${cx}px ${cy}px` }} />
            </>
          )}
          <text x={cx} y={cy + 6} textAnchor="middle"
            fill={combined.size > 0 ? "var(--fg)" : "var(--bd)"}
            fontSize={combined.size === 0 ? 18 : 36} fontFamily="var(--display)" fontWeight="600"
            style={{ transition: "all 0.5s" }}>
            {combined.size === 0 ? "○" : combined.size}
          </text>
          {combined.size > 0 && (
            <text x={cx} y={cy + 30} textAnchor="middle" fill="var(--ff)"
              fontSize="11" fontFamily="var(--sans)" fontWeight="500" letterSpacing="3">
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
