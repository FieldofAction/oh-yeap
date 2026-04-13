import React, { useRef, useState, useEffect } from "react";

/* ── Hero 02: "Type Field" ──
   Oversized letterforms cropped by grid cells.
   Each cell is an aperture revealing a fragment of a continuous form.
   Cursor acts as field probe — proximity shifts letter offsets.
   The field as landscape. */

/*
  Letter config: which letter, which cell (0-8 in 3x3), font size,
  and x/y offset controlling which fragment of the glyph is visible.

  Grid:
  ┌───0───┬───1───┬───2───┐
  │   A   │   C   │ void  │
  ├───3───┼───4───┼───5───┤
  │ void  │   T   │   I   │
  ├───6───┼───7───┼───8───┤
  │   O   │ void  │   N   │
  └───────┴───────┴───────┘
*/
const GLYPHS = [
  { ch:"A", cell:0, size:320, ox:-30,  oy:40  },
  { ch:"C", cell:1, size:340, ox:-60,  oy:-20 },
  null, // void
  null, // void
  { ch:"T", cell:4, size:300, ox:-20,  oy:30  },
  { ch:"I", cell:5, size:360, ox:-40,  oy:-30 },
  { ch:"O", cell:6, size:350, ox:-50,  oy:-40 },
  null, // void
  { ch:"N", cell:8, size:310, ox:-20,  oy:-10 },
];

export default function HeroTypeField() {
  const fieldRef = useRef(null);
  const [offsets, setOffsets] = useState(GLYPHS.map(() => ({ dx: 0, dy: 0 })));
  const targetOffsets = useRef(GLYPHS.map(() => ({ dx: 0, dy: 0 })));
  const currentOffsets = useRef(GLYPHS.map(() => ({ dx: 0, dy: 0 })));
  const velocities = useRef(GLYPHS.map(() => ({ dx: 0, dy: 0 })));
  const lastMoveTime = useRef(Date.now());
  const rafRef = useRef(null);
  const [entered, setEntered] = useState(false);

  // Entry fade
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Spring physics for each cell's offset
  useEffect(() => {
    let running = true;
    const TENSION = 0.012;
    const DAMPING = 0.92;
    const DRIFT_AMP = 2;
    const DRIFT_PERIOD = 15000;

    const tick = () => {
      const now = Date.now();
      const idle = now - lastMoveTime.current > 2000;

      const next = GLYPHS.map((g, i) => {
        if (!g) return { dx: 0, dy: 0 };
        let tdx = targetOffsets.current[i].dx;
        let tdy = targetOffsets.current[i].dy;

        // Ambient drift at rest
        if (idle) {
          const phase = i * 0.7;
          const t = now / DRIFT_PERIOD;
          tdx += Math.sin((t + phase) * Math.PI * 2) * DRIFT_AMP;
          tdy += Math.cos((t + phase * 0.6) * Math.PI * 2) * DRIFT_AMP * 0.7;
        }

        const cur = currentOffsets.current[i];
        const vel = velocities.current[i];
        const fx = (tdx - cur.dx) * TENSION;
        const fy = (tdy - cur.dy) * TENSION;
        vel.dx = (vel.dx + fx) * DAMPING;
        vel.dy = (vel.dy + fy) * DAMPING;
        cur.dx += vel.dx;
        cur.dy += vel.dy;
        return { dx: cur.dx, dy: cur.dy };
      });

      setOffsets(next);
      if (running) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  // Cursor tracking — each cell responds to proximity
  useEffect(() => {
    const onMove = (e) => {
      const el = fieldRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;  // 0..1
      const my = (e.clientY - rect.top) / rect.height;   // 0..1
      lastMoveTime.current = Date.now();

      // Cell centers in 0..1 space
      GLYPHS.forEach((g, i) => {
        if (!g) return;
        const col = g.cell % 3;
        const row = Math.floor(g.cell / 3);
        const cx = (col + 0.5) / 3;
        const cy = (row + 0.5) / 3;
        const distX = mx - cx;
        const distY = my - cy;
        const dist = Math.sqrt(distX * distX + distY * distY);
        const proximity = Math.max(0, 1 - dist * 2.5);
        // Shift letter offset toward cursor — reveals hidden parts of the glyph
        const strength = 25;
        targetOffsets.current[i] = {
          dx: distX * proximity * strength,
          dy: distY * proximity * strength,
        };
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="htf-field" ref={fieldRef}>
      {GLYPHS.map((g, i) => (
        <div key={i} className={`htf-cell${g ? "" : " htf-cell--void"}`}>
          {g && (
            <span
              className="htf-glyph"
              style={{
                fontSize: g.size,
                transform: `translate(${g.ox + offsets[i].dx}px, ${g.oy + offsets[i].dy}px)`,
                opacity: entered ? 0.18 : 0,
                transitionProperty: "opacity",
                transitionDuration: entered ? "1.5s" : "0s",
                transitionTimingFunction: "ease",
                transitionDelay: entered ? `${0.3 + i * 0.15}s` : "0s",
              }}
            >
              {g.ch}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
