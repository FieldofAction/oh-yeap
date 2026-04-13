import React, { useRef, useState, useEffect } from "react";

/* ── Hero 03: "Constraint Field" ──
   Thick lines as visible constraints in a continuous field.
   Cursor acts as agent — lines attract, repel, deform.
   Intersections emerge from the system, not placed manually.
   The field as force. */

/*
  Line definitions: each line has two endpoints in a 1000x400 viewBox,
  a thickness, and a type (flow, boundary, tension, ghost).
  Lines extend beyond the frame — endpoints can exceed viewBox bounds.
*/
/*
  Lines modeled on court/field geometry — abstracted but systematic.
  ViewBox: 1000x400. Think of it as a half-court seen from above.

  Baseline (bottom edge), sidelines (left/right edges),
  half-court line (vertical center), free-throw lane (rectangle),
  three-point arc (curve), center circle.
*/
const LINES = [
  // Baselines — top and bottom edges of the court
  { x1:-20, y1:20,  x2:1020, y2:20,   w:28, type:"boundary" },
  { x1:-20, y1:380, x2:1020, y2:380,  w:28, type:"boundary" },
  // Sidelines — left and right
  { x1:40,  y1:-20, x2:40,   y2:420,  w:24, type:"boundary" },
  { x1:960, y1:-20, x2:960,  y2:420,  w:24, type:"boundary" },
  // Half-court line
  { x1:500, y1:-20, x2:500,  y2:420,  w:22, type:"flow" },
  // Free-throw lane (left key) — rectangle
  { x1:-20, y1:120, x2:200,  y2:120,  w:20, type:"flow" },
  { x1:-20, y1:280, x2:200,  y2:280,  w:20, type:"flow" },
  { x1:200, y1:120, x2:200,  y2:280,  w:20, type:"flow" },
  // Free-throw lane (right key)
  { x1:1020,y1:130, x2:800,  y2:130,  w:18, type:"flow" },
  { x1:1020,y1:270, x2:800,  y2:270,  w:18, type:"flow" },
  { x1:800, y1:130, x2:800,  y2:270,  w:18, type:"flow" },
  // Diagonal tension — connecting keys across half-court
  { x1:200, y1:120, x2:800,  y2:270,  w:10, type:"ghost" },
  { x1:200, y1:280, x2:800,  y2:130,  w:10, type:"ghost" },
];

/* Opacity per type */
const TYPE_OPACITY = { flow: 0.14, boundary: 0.1, tension: 0.08, ghost: 0.04 };
const TYPE_DEFORM = { flow: 1, boundary: 0.4, tension: 0.8, ghost: 1.5 };

/*
  Compute intersection points between line segments.
  These become nodes — emergent, not placed.
*/
function findIntersections(lines) {
  const pts = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = lines[i], b = lines[j];
      const denom = (a.x1 - a.x2) * (b.y1 - b.y2) - (a.y1 - a.y2) * (b.x1 - b.x2);
      if (Math.abs(denom) < 0.01) continue;
      const t = ((a.x1 - b.x1) * (b.y1 - b.y2) - (a.y1 - b.y1) * (b.x1 - b.x2)) / denom;
      const u = -((a.x1 - a.x2) * (a.y1 - b.y1) - (a.y1 - a.y2) * (a.x1 - b.x1)) / denom;
      if (t >= -0.1 && t <= 1.1 && u >= -0.1 && u <= 1.1) {
        const x = a.x1 + t * (a.x2 - a.x1);
        const y = a.y1 + t * (a.y2 - a.y1);
        if (x > -20 && x < 1020 && y > -20 && y < 420) {
          pts.push({ x, y, lines: [i, j] });
        }
      }
    }
  }
  return pts;
}

const NODES = findIntersections(LINES);

export default function HeroConstraintField() {
  const fieldRef = useRef(null);
  const [deform, setDeform] = useState({ mx: 500, my: 200, active: false });
  const targetRef = useRef({ mx: 500, my: 200 });
  const currentRef = useRef({ mx: 500, my: 200 });
  const velocityRef = useRef({ mx: 0, my: 0 });
  const lastMoveTime = useRef(Date.now());
  const rafRef = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Spring physics for cursor position smoothing
  useEffect(() => {
    let running = true;
    const TENSION = 0.02;
    const DAMPING = 0.88;
    const DRIFT_PERIOD = 18000;
    const DRIFT_AMP = 40;

    const tick = () => {
      const now = Date.now();
      const idle = now - lastMoveTime.current > 2500;

      let tx = targetRef.current.mx;
      let ty = targetRef.current.my;

      // Ambient drift at rest — lines slowly shift
      if (idle) {
        const t = now / DRIFT_PERIOD;
        tx = 500 + Math.sin(t * Math.PI * 2) * DRIFT_AMP;
        ty = 200 + Math.cos(t * Math.PI * 2 * 0.6) * DRIFT_AMP * 0.6;
      }

      const cur = currentRef.current;
      const vel = velocityRef.current;
      vel.mx = (vel.mx + (tx - cur.mx) * TENSION) * DAMPING;
      vel.my = (vel.my + (ty - cur.my) * TENSION) * DAMPING;
      cur.mx += vel.mx;
      cur.my += vel.my;

      if (Math.abs(vel.mx) > 0.05 || Math.abs(vel.my) > 0.05) {
        setDeform({ mx: cur.mx, my: cur.my, active: !idle });
      }

      if (running) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  // Cursor tracking across full page
  useEffect(() => {
    const onMove = (e) => {
      const el = fieldRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 1000;
      const my = ((e.clientY - rect.top) / rect.height) * 400;
      targetRef.current = { mx, my };
      lastMoveTime.current = Date.now();
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Deform line midpoints based on cursor proximity
  const deformedLines = LINES.map((line, i) => {
    const midX = (line.x1 + line.x2) / 2;
    const midY = (line.y1 + line.y2) / 2;
    const dx = deform.mx - midX;
    const dy = deform.my - midY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const influence = Math.max(0, 1 - dist / 300);
    const strength = 20 * TYPE_DEFORM[line.type] * influence * influence;
    // Line bends at midpoint — perpendicular to line direction
    const lineAngle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
    const perpX = -Math.sin(lineAngle);
    const perpY = Math.cos(lineAngle);
    // Bend toward cursor
    const sign = (dx * perpX + dy * perpY) > 0 ? 1 : -1;
    const bendX = midX + perpX * strength * sign;
    const bendY = midY + perpY * strength * sign;
    return { ...line, bendX, bendY, influence };
  });

  /* Two panels — same court, different crops and rotations */
  const PANELS = [
    { viewBox:"50 -50 500 500", rot:-15 },
    { viewBox:"450 -50 500 500", rot:10 },
  ];

  const renderField = (panel, panelIdx) => (
    <svg className="hcf-svg" viewBox={panel.viewBox} preserveAspectRatio="xMidYMid slice" style={{transform:`rotate(${panel.rot}deg) scale(1.3)`}}>
      {deformedLines.map((line, i) => {
        const opacity = entered ? TYPE_OPACITY[line.type] + line.influence * 0.06 : 0;
        const d = `M${line.x1},${line.y1} Q${line.bendX},${line.bendY} ${line.x2},${line.y2}`;
        return (
          <path key={`l${panelIdx}-${i}`} d={d} fill="none" stroke="var(--fg)"
            strokeWidth={line.w} opacity={opacity} strokeLinecap="round"
            style={{ transition: entered ? "opacity 1.2s ease" : "none", transitionDelay: entered ? `${0.2 + i * 0.08}s` : "0s" }} />
        );
      })}
      {[
        { cx:500, cy:200, r:60, w:20, full:true },
        { cx:0, cy:200, r:180, w:18, full:false, startAngle:-60, endAngle:60 },
        { cx:1000, cy:200, r:180, w:18, full:false, startAngle:120, endAngle:240 },
      ].map((arc, i) => {
        const adx = deform.mx - arc.cx, ady = deform.my - arc.cy;
        const dist = Math.sqrt(adx*adx + ady*ady);
        const influence = Math.max(0, 1 - dist / 300);
        const deformR = arc.r + influence * 8;
        const opacity = entered ? 0.12 + influence * 0.05 : 0;
        if (arc.full) return <circle key={`a${panelIdx}-${i}`} cx={arc.cx} cy={arc.cy} r={deformR} fill="none" stroke="var(--fg)" strokeWidth={arc.w} opacity={opacity} style={{transition:entered?"opacity 1.2s ease":"none",transitionDelay:entered?"0.6s":"0s"}} />;
        const sa = arc.startAngle * Math.PI / 180, ea = arc.endAngle * Math.PI / 180;
        const ax1 = arc.cx + Math.cos(sa)*deformR, ay1 = arc.cy + Math.sin(sa)*deformR;
        const ax2 = arc.cx + Math.cos(ea)*deformR, ay2 = arc.cy + Math.sin(ea)*deformR;
        const la = (arc.endAngle - arc.startAngle) > 180 ? 1 : 0;
        return <path key={`a${panelIdx}-${i}`} d={`M${ax1},${ay1} A${deformR},${deformR} 0 ${la} 1 ${ax2},${ay2}`} fill="none" stroke="var(--fg)" strokeWidth={arc.w} opacity={opacity} strokeLinecap="round" style={{transition:entered?"opacity 1.2s ease":"none",transitionDelay:entered?"0.7s":"0s"}} />;
      })}
    </svg>
  );

  return (
    <div className="hg-field hcf-field" ref={fieldRef}>
      {PANELS.map((panel, i) => (
        <div key={i} className="hcf-panel">
          {renderField(panel, i)}
        </div>
      ))}
    </div>
  );
}
