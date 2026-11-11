import { useState, useRef, useCallback, useEffect } from "react";
import useASUStore from "../store/useASUStore";
import { LAWS, PAIR_MECHANICS } from "../data/field-laws";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

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
    <g
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={law.name}
      onClick={() => onClick(law.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(law.id); } }}
      style={{ cursor: "pointer" }}
    >
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
        fill={active ? law.color : detected ? `${law.color}cc` : "var(--fm)"}
        fontSize="22" fontFamily="var(--display)" fontWeight="600"
        style={{ transition: "fill 0.5s ease", userSelect: "none" }}>
        {law.glyph}
      </text>
      <text x={x} y={y + 14} textAnchor="middle"
        fill={active || detected ? "var(--fg)" : "var(--fm)"}
        fontSize="13" fontFamily="var(--sans)" fontWeight="600"
        style={{ transition: "fill 0.5s ease", userSelect: "none" }}>
        {law.name}
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

function MechanicsGrid({ combined }) {
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
    <div className="tl-section">
      <h2 className="bg-question-title">How they operate together</h2>
      <div className="tl-list">
        {pairs.map(({ a, b, key, name, mechanic }) => (
          <div key={key} className="tl-row">
            <p className="wb-name">{name}</p>
            <p className="wb-body">{a.name} and {b.name}</p>
            <p className="wb-text wb-measure">{mechanic}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function FieldConsole({ navigateTo }) {
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

  const engagedNames = LAWS.filter(l => active.has(l.id)).map(l => l.name);
  const detectedOnly = LAWS.filter(l => detected.has(l.id) && !active.has(l.id)).map(l => l.name);

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Console</h1>
        <nav className="wb-actions" aria-label="Console">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
        </nav>
      </header>

      <div className="wb-tool-body">
        {showKey ? (
          <div className="tl-section">
            <h2 className="wb-name">Where each law comes from</h2>
            <div className="tl-list">
              {LAWS.map(l => (
                <div key={l.id} className="tl-pair">
                  <span className="wb-name">{l.name}</span>
                  <span className="wb-body">{l.source}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <form className="tl-section" onSubmit={(e) => { e.preventDefault(); detectLaws(); }}>
          <div className="wb-signal">
            <label htmlFor="fl-name" className="wb-label">Name this moment</label>
            <input id="fl-name" className="wb-field" value={situationName} onChange={e => setSituationName(e.target.value)} autoComplete="off" />
          </div>
          <div className="wb-signal">
            <label htmlFor="fl-situation" className="wb-label">What are you navigating right now?</label>
            <textarea id="fl-situation" className="wb-field tl-area" ref={textRef} rows={3}
              value={situation}
              onChange={e => { setSituation(e.target.value); setDetected(new Set()); setDetectionNote(null); setSynthesis(null); }}
            />
          </div>
          <div className="wb-actions">
            <button type="submit" className="wb-button" disabled={detecting || !situation.trim()}>Find the laws at work</button>
            {detecting ? <p className="wb-body" role="status">Reading the field.</p> : null}
            {!detecting && detectionNote ? <p className="wb-body">{detectionNote}</p> : null}
          </div>
        </form>

        {detectedLaws.length > 0 ? (
          <div className="tl-section">
            <h2 className="wb-name">Laws at work here</h2>
            <div className="tl-chips">
              {detectedLaws.map(l => (
                <button key={l.id} type="button" className="tl-chip" aria-pressed={active.has(l.id)} onClick={() => toggleLaw(l.id)}>
                  <span className="tl-swatch" aria-hidden="true" style={{ background: l.color }} />
                  {l.name}
                </button>
              ))}
            </div>
            <p className="wb-body">Select one to engage it, or choose any law on the ring.</p>
          </div>
        ) : null}

        {combined.size === 0 && !situation ? (
          <p className="wb-body wb-measure">Name your experience. Describe it. Let the field find you. Or choose any law on the ring to begin.</p>
        ) : null}

        <div className="fl-ring">
          <svg viewBox={`0 0 ${W} ${H}`} className="fl-svg" role="group" aria-label="The seven Field Laws">
            <ConnectionLines active={active} detected={detected} cx={cx} cy={cy} radius={radius} />
            {LAWS.map(law => (
              <LawNode key={law.id} law={law}
                active={active.has(law.id)} detected={detected.has(law.id)}
                onClick={toggleLaw} cx={cx} cy={cy} radius={radius} />
            ))}
            <circle cx={cx} cy={cy} r={72} fill="var(--bg)" stroke="var(--bd)" strokeWidth="3" />
            {combined.size > 0 && (
              <>
                <circle cx={cx} cy={cy} r={72} fill="none" stroke="var(--ac2)" strokeWidth="1" opacity={0.3} className="fl-breathe" />
                <circle cx={cx} cy={cy} r={62} fill="none" stroke="var(--ac2)" strokeWidth="0.5" opacity={0.12}
                  strokeDasharray="2 9" className="fl-spin" style={{ transformOrigin: `${cx}px ${cy}px` }} />
              </>
            )}
            {combined.size > 0 && (
              <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--fg)"
                fontSize={36} fontFamily="var(--display)" fontWeight="600" aria-hidden="true">
                {combined.size}
              </text>
            )}
          </svg>
        </div>

        <MechanicsGrid combined={combined} />

        {(combined.size >= 1 || situation) ? (
          <div className="wb-actions">
            {combined.size >= 1 ? (
              <button type="button" className="wb-button" onClick={generateSynthesis} disabled={loading}>{loading ? "Reading the field" : "Synthesize the field"}</button>
            ) : null}
            <button type="button" className="wb-link" onClick={reset}>Clear everything</button>
          </div>
        ) : null}

        {synthesis ? (
          <div className="tl-section">
            <h2 className="bg-question-title">{situationName || "Synthesis"}</h2>
            <p className="wb-text wb-measure tl-prewrap">{synthesis}</p>
            <p className="wb-body wb-measure">
              {engagedNames.length ? `Engaged: ${engagedNames.join(", ")}.` : ""}{engagedNames.length && detectedOnly.length ? " " : ""}{detectedOnly.length ? `Detected: ${detectedOnly.join(", ")}.` : ""}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
