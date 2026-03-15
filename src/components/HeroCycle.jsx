import React, { useState, useEffect, useCallback } from "react";

/*
  Image-mask textures for ACTION letters.
  Each entry = a CSS gradient simulating material/process textures.
  Swap these for real image URLs later: url('/photos/clay.jpg'), etc.
*/
const TEX = [
  "linear-gradient(135deg, #8B6914 0%, #D4A843 40%, #6B4F1A 100%)",        // warm brass
  "linear-gradient(160deg, #2C3E50 0%, #4A6741 50%, #1A1A2E 100%)",        // deep forest
  "radial-gradient(ellipse at 30% 40%, #B85C3A 0%, #7B3F2A 60%, #3D1E0F 100%)", // fired clay
  "linear-gradient(120deg, #4A4A4A 0%, #8A8A8A 30%, #2A2A2A 70%, #6A6A6A 100%)", // brushed steel
  "linear-gradient(145deg, #1A1A2E 0%, #3D3D6B 50%, #16213E 100%)",        // night ink
  "radial-gradient(circle at 60% 50%, #C4956A 0%, #8B6914 50%, #4A3010 100%)", // amber
];

/*
  ACTION letter map — which letters on each row get the image treatment.
  Format: { row: [letterIndex, textureIndex] }
  "ACTION" = A(0) C(1) T(2) I(3) O(4) N(5)
*/
const MASK_MAP = [
  [{ idx: 2, tex: 0 }, { idx: 4, tex: 1 }],  // row 1: T and O
  [{ idx: 0, tex: 2 }, { idx: 3, tex: 3 }],  // row 2: A and I
  [{ idx: 1, tex: 4 }, { idx: 5, tex: 5 }],  // row 3: C and N
];

const WORD = "ACTION";

function ActionRow({ masks, delay }) {
  return (
    <div className="hc-action-row" style={{ animationDelay: `${delay}s` }}>
      {WORD.split("").map((ch, i) => {
        const mask = masks.find(m => m.idx === i);
        if (mask) {
          return (
            <span key={i} className="hc-action-letter hc-action-img" style={{ backgroundImage: TEX[mask.tex] }}>
              {ch}
            </span>
          );
        }
        return <span key={i} className="hc-action-letter">{ch}</span>;
      })}
    </div>
  );
}

const CYCLE_MS = 6000;

const SLIDES = [
  { key: "structure", type: "text" },
  { key: "action", type: "action" },
  { key: "push", type: "text" },
  { key: "identity", type: "identity" },
];

export default function HeroCycle() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const advance = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      setActive(prev => (prev + 1) % SLIDES.length);
      setLeaving(false);
    }, 400);
  }, []);

  useEffect(() => {
    const id = setInterval(advance, CYCLE_MS);
    return () => clearInterval(id);
  }, [advance]);

  const slide = SLIDES[active];

  return (
    <div className="hc" onClick={advance} title="Click to advance">
      {/* Slide indicator dots */}
      <div className="hc-dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            className={`hc-dot${i === active ? " on" : ""}`}
            onClick={(e) => { e.stopPropagation(); setLeaving(true); setTimeout(() => { setActive(i); setLeaving(false); }, 400); }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className={`hc-slide${leaving ? " hc-leaving" : " hc-entering"}`}>
        {slide.key === "structure" && (
          <h1 className="hc-text hero-h">
            Designing Structure<br />for Living Systems
          </h1>
        )}

        {slide.key === "action" && (
          <div className="hc-action">
            {MASK_MAP.map((masks, i) => (
              <ActionRow key={i} masks={masks} delay={i * 0.08} />
            ))}
          </div>
        )}

        {slide.key === "push" && (
          <h1 className="hc-text hero-h">
            Push Gently<br />into the Universe
          </h1>
        )}

        {slide.key === "identity" && (
          <div className="hc-identity">
            <h1 className="hc-identity-name">Field of Action</h1>
            <p className="hc-identity-sub">
              Professional interface of Alfred (Daniel) Dickson II
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
