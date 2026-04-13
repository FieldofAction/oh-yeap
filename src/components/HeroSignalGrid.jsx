import React, { useRef, useState, useEffect } from "react";

/* ── Hero 01: "Signal Grid" ──
   Letters as nodes in a relational network.
   Corner-attractor cursor displacement, spring physics.
   The field as diagram. */

const BOUND = { left: 60, right: 940, top: 55, bottom: 345 };

const BASE = [
  { ch:"F", x:BOUND.left,  y:BOUND.top },
  { ch:"I", x:300,         y:BOUND.top },
  { ch:"E", x:500,         y:BOUND.top },
  { ch:"L", x:700,         y:BOUND.top },
  { ch:"D", x:BOUND.right, y:BOUND.top },
  { ch:"O", x:BOUND.left,  y:200 },
  { ch:"F", x:BOUND.right, y:200 },
  { ch:"A", x:BOUND.left,  y:BOUND.bottom },
  { ch:"C", x:260,         y:BOUND.bottom },
  { ch:"T", x:420,         y:BOUND.bottom },
  { ch:"I", x:580,         y:BOUND.bottom },
  { ch:"O", x:740,         y:BOUND.bottom },
  { ch:"N", x:BOUND.right, y:BOUND.bottom },
];

const DELAYS = [1.4,1.5,1.6,1.7,1.8,1.9,2.0,2.1,2.2,2.3,2.4,2.5,2.6];

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [7,8],[8,9],[9,10],[10,11],[11,12],
  [5,6],
  [0,5],[4,6],
  [5,7],[6,12],
  [2,9],[1,8],[3,11],
  [0,6],[5,12],
];

const MIN_KERN = 15;

function displaceAll(letters, pullX = 0, pullY = 0) {
  const px = isNaN(pullX) ? 0 : pullX;
  const py = isNaN(pullY) ? 0 : pullY;
  const anchorX = px <= 0 ? BOUND.left : BOUND.right;
  const rows = {};
  letters.forEach((l, i) => {
    const key = l.y;
    if (!rows[key]) rows[key] = [];
    rows[key].push({ idx: i, baseX: l.x, baseY: l.y });
  });
  const result = letters.map(l => ({ ...l, dx: l.x }));
  const minY = BOUND.top, maxY = BOUND.bottom;
  Object.values(rows).forEach(row => {
    const rowY = row[0].baseY;
    const rowNorm = (rowY - minY) / (maxY - minY);
    const cursorYNorm = (py + 1) / 2;
    const yDist = Math.abs(rowNorm - cursorYNorm);
    const clampedProx = Math.max(0.1, 1 - yDist * 1.2);
    const intensity = Math.abs(px) * 0.9 * clampedProx;
    row.sort((a, b) => a.baseX - b.baseX);
    row.forEach(r => {
      result[r.idx].dx = r.baseX + (anchorX - r.baseX) * intensity;
    });
    const ordered = row.map(r => ({ idx: r.idx, dx: result[r.idx].dx }));
    if (px <= 0) {
      if (ordered[0].dx < BOUND.left) ordered[0].dx = BOUND.left;
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i].dx <= ordered[i - 1].dx + MIN_KERN) ordered[i].dx = ordered[i - 1].dx + MIN_KERN;
      }
    } else {
      const last = ordered.length - 1;
      if (ordered[last].dx > BOUND.right) ordered[last].dx = BOUND.right;
      for (let i = last - 1; i >= 0; i--) {
        if (ordered[i].dx >= ordered[i + 1].dx - MIN_KERN) ordered[i].dx = ordered[i + 1].dx - MIN_KERN;
      }
    }
    ordered.forEach(o => { o.dx = Math.max(BOUND.left, Math.min(BOUND.right, o.dx)); });
    ordered.forEach(s => { result[s.idx].dx = s.dx; });
  });
  return result;
}

function FieldSVG({ pullX, pullY }) {
  const letters = displaceAll(BASE, pullX, pullY);
  const inset = 18;
  return (
    <svg className="hg-svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
      {CONNECTIONS.map(([a, b], i) => {
        const la = letters[a], lb = letters[b];
        const ddx = lb.dx - la.dx, dy = lb.y - la.y;
        const dist = Math.sqrt(ddx*ddx + dy*dy);
        if (dist < 1) return null;
        const ux = ddx / dist, uy = dy / dist;
        const x1 = la.dx + ux * inset, y1 = la.y + uy * inset;
        const x2 = lb.dx - ux * inset, y2 = lb.y - uy * inset;
        const shortened = Math.max(0, dist - inset * 2);
        return (
          <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--fg)" strokeWidth="0.4" opacity="0.1"
            strokeDasharray={shortened} strokeDashoffset="0" />
        );
      })}
      {letters.map((l, i) => (
        <text key={`t${i}`} x={l.dx} y={l.y} textAnchor="middle" dominantBaseline="central" className="hg-glyph" opacity="0.22">{l.ch}</text>
      ))}
    </svg>
  );
}

function FieldSVGAnimated({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);
  const inset = 18;
  return (
    <svg className="hg-svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
      {CONNECTIONS.map(([a, b], i) => {
        const la = BASE[a], lb = BASE[b];
        const ddx = lb.x - la.x, dy = lb.y - la.y;
        const dist = Math.sqrt(ddx*ddx + dy*dy);
        if (dist < 1) return null;
        const ux = ddx / dist, uy = dy / dist;
        const x1 = la.x + ux * inset, y1 = la.y + uy * inset;
        const x2 = lb.x - ux * inset, y2 = lb.y - uy * inset;
        const shortened = Math.max(0, dist - inset * 2);
        const delay = 0.1 + i * 0.08;
        return (
          <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--fg)" strokeWidth="0.4" opacity="0">
            <set attributeName="stroke-dasharray" to={`${shortened}`} />
            <animate attributeName="stroke-dashoffset" from={shortened} to="0" dur="1.6s" begin={`${delay}s`} fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
            <animate attributeName="opacity" from="0" to="0.1" dur="0.8s" begin={`${delay}s`} fill="freeze" />
          </line>
        );
      })}
      {BASE.map((l, i) => (
        <text key={`t${i}`} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" className="hg-glyph" opacity="0">
          {l.ch}
          <animate attributeName="opacity" from="0" to="0.22" dur="1s" begin={`${DELAYS[i]}s`} fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
        </text>
      ))}
    </svg>
  );
}

export default function HeroSignalGrid() {
  const fieldRef = useRef(null);
  const [pullX, setPullX] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [animated, setAnimated] = useState(false);
  const rafRef = useRef(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const lastMoveTime = useRef(Date.now());

  useEffect(() => {
    if (!animated) return;
    let running = true;
    const TENSION = 0.008;
    const DAMPING = 0.94;
    const REST_THRESHOLD = 0.001;
    const IDLE_MS = 2000;
    const DRIFT_AMP = 0.03;
    const DRIFT_PERIOD = 12000;
    const tick = () => {
      const now = Date.now();
      const idle = now - lastMoveTime.current > IDLE_MS;
      let driftX = 0, driftY = 0;
      if (idle) {
        const t = now / DRIFT_PERIOD;
        driftX = Math.sin(t * Math.PI * 2) * DRIFT_AMP;
        driftY = Math.cos(t * Math.PI * 2 * 0.7) * DRIFT_AMP * 0.5;
      }
      const forceX = (targetX.current + driftX - currentX.current) * TENSION;
      const forceY = (targetY.current + driftY - currentY.current) * TENSION;
      velocityX.current = (velocityX.current + forceX) * DAMPING;
      velocityY.current = (velocityY.current + forceY) * DAMPING;
      currentX.current += velocityX.current;
      currentY.current += velocityY.current;
      if (Math.abs(velocityX.current) > REST_THRESHOLD || Math.abs(velocityY.current) > REST_THRESHOLD) {
        setPullX(currentX.current);
        setPullY(currentY.current);
      }
      if (running) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [animated]);

  useEffect(() => {
    if (!animated) return;
    const onMove = (e) => {
      const el = fieldRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      targetX.current = Math.max(-2, Math.min(2, (x - 0.5) * 2));
      targetY.current = Math.max(-2, Math.min(2, (y - 0.5) * 2));
      lastMoveTime.current = Date.now();
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [animated]);

  return (
    <div className="hg-field" ref={fieldRef}>
      {!animated
        ? <FieldSVGAnimated onComplete={() => setAnimated(true)} />
        : <FieldSVG pullX={pullX} pullY={pullY} />
      }
    </div>
  );
}
