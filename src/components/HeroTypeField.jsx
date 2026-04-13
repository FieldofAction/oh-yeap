import React, { useRef, useState, useEffect } from "react";

/* ── Hero 02: "Type Field" ──
   Oversized letterforms cropped by grid cells.
   Each cell is an aperture revealing a fragment of a continuous form.
   Cursor acts as field probe — proximity shifts letter offsets.
   The field as landscape. */

/*
  Letter config: ch, cell index (0-8), font size,
  ox/oy = base offset (controls which fragment is visible),
  rot = rotation in degrees (angled crops for abstraction)

  Grid (3 columns x 3 rows):
  ┌───0───┬───1───┬───2───┐
  │   A   │   C   │ void  │
  ├───3───┼───4───┼───5───┤
  │ void  │   T   │   I   │
  ├───6───┼───7───┼───8───┤
  │   O   │ void  │   N   │
  └───────┴───────┴───────┘
*/
const GLYPHS = [
  { ch:"A", cell:0, size:420, ox:-80,  oy:60,   rot:-8  },
  { ch:"C", cell:1, size:460, ox:-100, oy:-50,  rot:5   },
  null,
  null,
  { ch:"T", cell:4, size:380, ox:-40,  oy:70,   rot:-4  },
  { ch:"I", cell:5, size:500, ox:-60,  oy:-80,  rot:12  },
  { ch:"O", cell:6, size:440, ox:-90,  oy:-60,  rot:-6  },
  null,
  { ch:"N", cell:8, size:400, ox:-50,  oy:-30,  rot:7   },
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

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Spring physics — more dynamic than Hero 01
  useEffect(() => {
    let running = true;
    const TENSION = 0.025;     // stiffer spring — more responsive
    const DAMPING = 0.86;      // less damping — more bounce/life
    const DRIFT_AMP = 4;       // stronger rest drift
    const DRIFT_PERIOD = 10000;

    const tick = () => {
      const now = Date.now();
      const idle = now - lastMoveTime.current > 2000;

      const next = GLYPHS.map((g, i) => {
        if (!g) return { dx: 0, dy: 0 };
        let tdx = targetOffsets.current[i].dx;
        let tdy = targetOffsets.current[i].dy;

        if (idle) {
          const phase = i * 0.9;
          const t = now / DRIFT_PERIOD;
          tdx += Math.sin((t + phase) * Math.PI * 2) * DRIFT_AMP;
          tdy += Math.cos((t + phase * 0.6) * Math.PI * 2) * DRIFT_AMP * 0.8;
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

  // Cursor tracking — stronger response, tracked across full page
  useEffect(() => {
    const onMove = (e) => {
      const el = fieldRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      lastMoveTime.current = Date.now();

      GLYPHS.forEach((g, i) => {
        if (!g) return;
        const col = g.cell % 3;
        const row = Math.floor(g.cell / 3);
        const cx = (col + 0.5) / 3;
        const cy = (row + 0.5) / 3;
        const distX = mx - cx;
        const distY = my - cy;
        const dist = Math.sqrt(distX * distX + distY * distY);
        const proximity = Math.max(0, 1 - dist * 2);
        const strength = 50; // doubled from before
        targetOffsets.current[i] = {
          dx: distX * proximity * proximity * strength,
          dy: distY * proximity * proximity * strength,
        };
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="hg-field htf-field" ref={fieldRef}>
      {GLYPHS.map((g, i) => (
        <div key={i} className={`htf-cell${g ? "" : " htf-cell--void"}`}>
          {g && (
            <span
              className="htf-glyph"
              style={{
                fontSize: g.size,
                transform: `translate(${g.ox + offsets[i].dx}px, ${g.oy + offsets[i].dy}px) rotate(${g.rot}deg)`,
                opacity: entered ? 0.2 : 0,
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
