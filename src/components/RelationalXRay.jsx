import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

/* ── Relational X-Ray — Field Diagnostic Overlay ── */

const LAYERS = {
  signal: {
    label: "Signal",
    desc: "What is alive",
    color: "#2e6b4f",
    title: "What is alive in this field",
    body: "Relational Design is generating real signal. The framework attracts collaborators organically, surfaces structure that disappears into the work, and creates conditions that outlast intervention.",
    items: [
      "Organic pull — people arrive without being recruited",
      "Temporal coherence — the work accumulates rather than disperses",
      "Useful surprise — the framework yields more than was put in",
    ],
  },
  inflation: {
    label: "Inflation",
    desc: "What's outside the model",
    color: "#a06828",
    title: "What the model doesn't account for",
    body: "Three variables are operating outside Relational Design's current formalization. They aren't failures — they're where reality is ahead of the framework.",
    items: [
      "Power asymmetry — agency differentials in collaborative fields",
      "Scale effects — what changes when the practice reaches beyond the room",
      "Adversarial conditions — friction that doesn't respond to care",
    ],
  },
  shadow: {
    label: "Shadow",
    desc: "Where it protects itself",
    color: "#6a5aaa",
    title: "Where the framework protects itself",
    body: "The deepest belief of Relational Design — design the conditions, trust emergence — carries its own shadow. The same move that opens possibility can prevent collapse.",
    items: [
      "Infinite deferral — conditions kept perpetually 'not ready'",
      "Hidden control — shaping the field while appearing to release it",
      "Fragility to speed — breaks when reality demands fast decisions",
    ],
  },
  combined: {
    label: "Combined",
    desc: "Full field reading",
    color: "#b5401e",
    title: "Full field reading",
    body: "The field is alive. The model has meaningful gaps. The shadow is organized around one specific avoidance. All three are operating simultaneously.",
    items: [
      "Signal is strong and self-organizing",
      "Inflation pressure highest at: power + scale",
      "Shadow most active as: deferral + fragility",
      "The gap between signal and shadow is the most important question",
    ],
  },
};

const LAYER_KEYS = ["signal", "inflation", "shadow", "combined"];

function ReadingCard({ layer, delay }) {
  const d = LAYERS[layer];
  if (!d) return null;
  return (
    <div
      className={`xr-card xr-card--${layer}`}
      style={{ "--xr-lc": d.color, animationDelay: `${delay}ms` }}
    >
      <div className="xr-card-label">{d.label}</div>
      <div className="xr-card-title">{d.title}</div>
      {d.body && <div className="xr-card-body">{d.body}</div>}
      <div className="xr-card-items">
        {d.items.map((item, i) => (
          <div key={i} className="xr-card-item">{item}</div>
        ))}
      </div>
    </div>
  );
}

export default function RelationalXRay({ onClose }) {
  const [active, setActive] = useState("combined");

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleLayer = useCallback((key) => setActive(key), []);

  return createPortal(
    <div className="xr-overlay" onClick={onClose}>
      {/* Onion-skin tint */}
      <div className={`xr-tint xr-tint--${active}`} />

      {/* Panel */}
      <div className="xr-panel" onClick={(e) => e.stopPropagation()}>
        <div className="xr-panel-header">
          <div>
            <div className="xr-badge">Relational X-Ray</div>
            <div className="xr-title">Field Diagnostic</div>
          </div>
          <button className="xr-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="xr-controls">
          <div className="xr-controls-label">View Layer</div>
          {LAYER_KEYS.map((key) => {
            const d = LAYERS[key];
            return (
              <button
                key={key}
                className={`xr-layer-btn${active === key ? " xr-layer-btn--active" : ""}`}
                onClick={() => handleLayer(key)}
              >
                <span
                  className="xr-layer-dot"
                  style={{ background: d.color }}
                />
                <span className="xr-layer-name">{d.label}</span>
                <span className="xr-layer-desc">{d.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="xr-readings">
          {active === "combined" ? (
            <>
              <ReadingCard layer="combined" delay={0} />
              <ReadingCard layer="signal" delay={80} />
              <ReadingCard layer="inflation" delay={160} />
              <ReadingCard layer="shadow" delay={240} />
            </>
          ) : (
            <ReadingCard layer={active} delay={0} />
          )}
        </div>

        <div className="xr-footer">
          Field of Action — Relational X-Ray v1
        </div>
      </div>
    </div>,
    document.body
  );
}
