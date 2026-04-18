import React, { useRef, useState, useEffect } from "react";

/* ── Hero 01: "Signal Grid" ──
   Letters as nodes in a relational network.
   Corner-attractor cursor displacement, spring physics.
   The field as diagram. */

// Two layouts: wide (desktop/tablet, 2.5:1 band) and square (phone, 1:1 impact shape).
// The square layout anchors FIELD to the top and ACTION to the bottom.
const LAYOUTS = {
  wide: {
    viewBox: "0 0 1000 400",
    vbWidth: 1000,
    vbHeight: 400,
    bound: { left: 60, right: 940, top: 55, bottom: 345 },
    midY: 200,
    connDashWidth: 0.4,
    // Minimum inter-letter gap for collision prevention (viewBox units).
    // At 21px glyphs in a 1000-wide viewBox this generous spacing prevents any visible overlap.
    minKern: 60,
    // Calm desktop spring — mouse input is already precise.
    spring: { tension: 0.003, damping: 0.96, restThreshold: 0.001 },
    // Radial attention field: clarity zone that follows the cursor. Values in viewBox units.
    // Baseline matches the existing rest opacity; peak/dim are the focused/defocused ends.
    attention: {
      radius: 160,
      letterBase: 0.22, letterPeak: 0.55, letterDim: 0.14,
      connBase: 0.1, connPeak: 0.22, connDim: 0.06,
    },
    // Echo mid-layer: a dim copy of the letters driven by its own slower spring.
    // Depth comes from temporal lag, not amplitude — at rest the echo sits almost
    // on top of the foreground, so it reads as a soft shadow rather than doubled text.
    // During motion the slower spring trails, giving transient parallax.
    echo: {
      amplitudeScale: 1.0,
      spring: { tension: 0.0016, damping: 0.965, restThreshold: 0.0008 },
      offsetX: -1.5, offsetY: -1.5,
      letterOpacity: 0.045, connOpacity: 0.022,
    },
    // Background spotlight: a soft radial gradient centered on the cursor, tied to
    // presence so it fades in/out with the field. Very low opacity — barely there.
    background: { spotOpacity: 0.05, spotRadius: 520 },
  },
  square: {
    viewBox: "0 0 1000 1000",
    vbWidth: 1000,
    vbHeight: 1000,
    // Equal 100u margin on all four sides of the framed box.
    bound: { left: 100, right: 900, top: 100, bottom: 900 },
    midY: 500,
    connDashWidth: 1.0,
    // Tighter kerning: compresses rest spacing to ~135u so letters feel
    // grouped rather than spread; tilt can still push down to 115u.
    minKern: 115,
    // Spring: soft-landing. Lower tension + heavier damping glide the
    // letters to rest rather than snapping. Responsiveness comes from
    // the eased tilt input filter, not spring stiffness.
    spring: { tension: 0.006, damping: 0.93, restThreshold: 0.002 },
    // Square viewBox is taller; a larger radius matches the denser letter field.
    // Note: on touch devices cursor events never fire, so presence stays 0 and this is effectively off.
    attention: {
      radius: 280,
      letterBase: 0.22, letterPeak: 0.55, letterDim: 0.14,
      connBase: 0.1, connPeak: 0.22, connDim: 0.06,
    },
    // Echo tuned for touch: tilt drives pullX/Y with its own aggressive filtering,
    // so the echo's spring needs to trail noticeably without feeling disconnected.
    echo: {
      amplitudeScale: 1.0,
      spring: { tension: 0.0035, damping: 0.945, restThreshold: 0.0015 },
      offsetX: -2, offsetY: -2,
      letterOpacity: 0.045, connOpacity: 0.022,
    },
    background: { spotOpacity: 0.05, spotRadius: 600 },
  },
};

function buildBase({ bound, midY }) {
  // Evenly distribute interior letters between the left/right anchor columns,
  // keeping F/D and A/N flush with bound.left / bound.right.
  const span = bound.right - bound.left;
  // FIELD = 5 letters → 4 gaps
  const fieldXs = [0, 1, 2, 3, 4].map(i => bound.left + (span * i) / 4);
  // ACTION = 6 letters → 5 gaps
  const actionXs = [0, 1, 2, 3, 4, 5].map(i => bound.left + (span * i) / 5);
  return [
    { ch:"F", x:fieldXs[0],  y:bound.top },
    { ch:"I", x:fieldXs[1],  y:bound.top },
    { ch:"E", x:fieldXs[2],  y:bound.top },
    { ch:"L", x:fieldXs[3],  y:bound.top },
    { ch:"D", x:fieldXs[4],  y:bound.top },
    { ch:"O", x:bound.left,  y:midY },
    { ch:"F", x:bound.right, y:midY },
    { ch:"A", x:actionXs[0], y:bound.bottom },
    { ch:"C", x:actionXs[1], y:bound.bottom },
    { ch:"T", x:actionXs[2], y:bound.bottom },
    { ch:"I", x:actionXs[3], y:bound.bottom },
    { ch:"O", x:actionXs[4], y:bound.bottom },
    { ch:"N", x:actionXs[5], y:bound.bottom },
  ];
}

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

function displaceAll(letters, pullX = 0, pullY = 0, bound, minKern = 60) {
  const px = isNaN(pullX) ? 0 : pullX;
  const py = isNaN(pullY) ? 0 : pullY;
  const anchorX = px <= 0 ? bound.left : bound.right;
  const rows = {};
  letters.forEach((l, i) => {
    const key = l.y;
    if (!rows[key]) rows[key] = [];
    rows[key].push({ idx: i, baseX: l.x, baseY: l.y });
  });
  const result = letters.map(l => ({ ...l, dx: l.x }));
  const minY = bound.top, maxY = bound.bottom;
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
      if (ordered[0].dx < bound.left) ordered[0].dx = bound.left;
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i].dx <= ordered[i - 1].dx + minKern) ordered[i].dx = ordered[i - 1].dx + minKern;
      }
    } else {
      const last = ordered.length - 1;
      if (ordered[last].dx > bound.right) ordered[last].dx = bound.right;
      for (let i = last - 1; i >= 0; i--) {
        if (ordered[i].dx >= ordered[i + 1].dx - minKern) ordered[i].dx = ordered[i + 1].dx - minKern;
      }
    }
    ordered.forEach(o => { o.dx = Math.max(bound.left, Math.min(bound.right, o.dx)); });
    ordered.forEach(s => { result[s.idx].dx = s.dx; });
  });
  return result;
}

// Smoothstep proximity: returns 1 at the cursor center, 0 at/past the radius.
// Shape is p*p*(3-2p) so the falloff has continuous derivative at both ends.
function radialProximity(px, py, cx, cy, radius) {
  const ddx = px - cx, dy = py - cy;
  const dist = Math.sqrt(ddx * ddx + dy * dy);
  const p = Math.max(0, 1 - dist / radius);
  return p * p * (3 - 2 * p);
}

function FieldSVG({ pullX, pullY, echoX, echoY, cursorVX, cursorVY, cursorPresence, layout }) {
  const base = buildBase(layout);
  const letters = displaceAll(base, pullX, pullY, layout.bound, layout.minKern);
  // Echo uses the same displacement math with its own lagged, reduced-amplitude target.
  // The positional delta between letters and echoLetters is what reads as parallax.
  const echoLetters = displaceAll(base, echoX, echoY, layout.bound, layout.minKern);
  const inset = 18;
  const att = layout.attention;
  const echoCfg = layout.echo;
  const bgCfg = layout.background;
  // When presence is ~0 the radial field contributes nothing; skip the per-element calc.
  const fieldOn = cursorPresence > 0.001;
  const letterOpacityFor = (x, y) => {
    if (!fieldOn) return att.letterBase;
    const prox = radialProximity(x, y, cursorVX, cursorVY, att.radius);
    const focused = att.letterDim + prox * (att.letterPeak - att.letterDim);
    return att.letterBase + (focused - att.letterBase) * cursorPresence;
  };
  const connOpacityFor = (mx, my) => {
    if (!fieldOn) return att.connBase;
    const prox = radialProximity(mx, my, cursorVX, cursorVY, att.radius);
    const focused = att.connDim + prox * (att.connPeak - att.connDim);
    return att.connBase + (focused - att.connBase) * cursorPresence;
  };
  // Background spotlight position: follow cursor when present, rest at viewBox center.
  const spotCX = fieldOn ? cursorVX : layout.vbWidth / 2;
  const spotCY = fieldOn ? cursorVY : layout.vbHeight / 2;
  const spotAlpha = bgCfg.spotOpacity * cursorPresence;
  // Unique gradient id per layout so wide/square don't collide if both are in the DOM briefly.
  const spotId = `hg-spot-${layout.vbWidth}-${layout.vbHeight}`;
  return (
    <svg className="hg-svg" viewBox={layout.viewBox} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={spotId} cx={spotCX} cy={spotCY} r={bgCfg.spotRadius} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--fg)" stopOpacity={spotAlpha} />
          <stop offset="100%" stopColor="var(--fg)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={layout.vbWidth} height={layout.vbHeight} fill={`url(#${spotId})`} pointerEvents="none" />
      {/* Echo layer — dim, static diagonal offset, no per-letter radial modulation. */}
      <g transform={`translate(${echoCfg.offsetX} ${echoCfg.offsetY})`} aria-hidden="true">
        {CONNECTIONS.map(([a, b], i) => {
          const la = echoLetters[a], lb = echoLetters[b];
          const ddx = lb.dx - la.dx, dy = lb.y - la.y;
          const dist = Math.sqrt(ddx*ddx + dy*dy);
          if (dist < 1) return null;
          const ux = ddx / dist, uy = dy / dist;
          const x1 = la.dx + ux * inset, y1 = la.y + uy * inset;
          const x2 = lb.dx - ux * inset, y2 = lb.y - uy * inset;
          return (
            <line key={`el${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--fg)" strokeWidth={layout.connDashWidth} opacity={echoCfg.connOpacity} />
          );
        })}
        {echoLetters.map((l, i) => (
          <text key={`et${i}`} x={l.dx} y={l.y} textAnchor="middle" dominantBaseline="central" className="hg-glyph" opacity={echoCfg.letterOpacity}>{l.ch}</text>
        ))}
      </g>
      {/* Foreground layer */}
      {CONNECTIONS.map(([a, b], i) => {
        const la = letters[a], lb = letters[b];
        const ddx = lb.dx - la.dx, dy = lb.y - la.y;
        const dist = Math.sqrt(ddx*ddx + dy*dy);
        if (dist < 1) return null;
        const ux = ddx / dist, uy = dy / dist;
        const x1 = la.dx + ux * inset, y1 = la.y + uy * inset;
        const x2 = lb.dx - ux * inset, y2 = lb.y - uy * inset;
        const shortened = Math.max(0, dist - inset * 2);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
          <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--fg)" strokeWidth={layout.connDashWidth} opacity={connOpacityFor(mx, my)}
            strokeDasharray={shortened} strokeDashoffset="0" />
        );
      })}
      {letters.map((l, i) => (
        <text key={`t${i}`} x={l.dx} y={l.y} textAnchor="middle" dominantBaseline="central" className="hg-glyph" opacity={letterOpacityFor(l.dx, l.y)}>{l.ch}</text>
      ))}
    </svg>
  );
}

// Compression → release: each letter starts pulled 45% toward its row center, then
// glides out to its resting position in sync with the opacity fade. Lerp only in X
// (rows are horizontal); vertical alignment reads as "the diagram" and stays stable.
function compressedXFor(letters) {
  const rows = {};
  letters.forEach((l, i) => {
    if (!rows[l.y]) rows[l.y] = [];
    rows[l.y].push(i);
  });
  const out = new Array(letters.length);
  Object.values(rows).forEach(indices => {
    let minX = Infinity, maxX = -Infinity;
    indices.forEach(i => { if (letters[i].x < minX) minX = letters[i].x; if (letters[i].x > maxX) maxX = letters[i].x; });
    const center = (minX + maxX) / 2;
    indices.forEach(i => { out[i] = letters[i].x + (center - letters[i].x) * 0.45; });
  });
  return out;
}

function FieldSVGAnimated({ onComplete, layout }) {
  const base = buildBase(layout);
  const compressed = compressedXFor(base);
  useEffect(() => {
    const timer = setTimeout(onComplete, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);
  const inset = 18;
  return (
    <svg className="hg-svg" viewBox={layout.viewBox} preserveAspectRatio="xMidYMid meet">
      {CONNECTIONS.map(([a, b], i) => {
        const la = base[a], lb = base[b];
        const ddx = lb.x - la.x, dy = lb.y - la.y;
        const dist = Math.sqrt(ddx*ddx + dy*dy);
        if (dist < 1) return null;
        const ux = ddx / dist, uy = dy / dist;
        const x1 = la.x + ux * inset, y1 = la.y + uy * inset;
        const x2 = lb.x - ux * inset, y2 = lb.y - uy * inset;
        const shortened = Math.max(0, dist - inset * 2);
        const delay = 0.1 + i * 0.08;
        return (
          <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--fg)" strokeWidth={layout.connDashWidth} opacity="0">
            <set attributeName="stroke-dasharray" to={`${shortened}`} />
            <animate attributeName="stroke-dashoffset" from={shortened} to="0" dur="1.6s" begin={`${delay}s`} fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
            <animate attributeName="opacity" from="0" to="0.1" dur="0.8s" begin={`${delay}s`} fill="freeze" />
          </line>
        );
      })}
      {base.map((l, i) => (
        <text key={`t${i}`} x={compressed[i]} y={l.y} textAnchor="middle" dominantBaseline="central" className="hg-glyph" opacity="0">
          {l.ch}
          <animate attributeName="x" from={compressed[i]} to={l.x} dur="1.1s" begin={`${DELAYS[i]}s`} fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" />
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
  // Cursor in viewBox coords + presence (0–1). Presence eases in when the cursor
  // enters the field rect and out when it leaves, so the radial effect has no hard edge.
  const [cursorVX, setCursorVX] = useState(500);
  const [cursorVY, setCursorVY] = useState(200);
  const [cursorPresence, setCursorPresence] = useState(0);
  // Echo layer: lagged spring that tracks the same pull target at reduced amplitude.
  // The gap between this and pullX/pullY is what creates the parallax/depth feel.
  const [echoX, setEchoX] = useState(0);
  const [echoY, setEchoY] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [needsMotionPerm, setNeedsMotionPerm] = useState(false);
  const [motionActive, setMotionActive] = useState(false);
  // Layout: square on phones (≤480px), wide everywhere else.
  const [layoutKey, setLayoutKey] = useState(() => {
    if (typeof window === "undefined") return "wide";
    return window.matchMedia("(max-width: 480px)").matches ? "square" : "wide";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 480px)");
    const handler = (e) => setLayoutKey(e.matches ? "square" : "wide");
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler);
    };
  }, []);
  const layout = LAYOUTS[layoutKey];
  const rafRef = useRef(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const lastMoveTime = useRef(Date.now());
  const motionBaselineBeta = useRef(null);
  const motionListenerRef = useRef(null);
  // Radial attention targets (viewBox coords) and eased current values.
  // Presence target = 1 while cursor is inside the field rect, 0 otherwise.
  const cursorTargetX = useRef(500);
  const cursorTargetY = useRef(200);
  const cursorCurX = useRef(500);
  const cursorCurY = useRef(200);
  const presenceTarget = useRef(0);
  const presenceCur = useRef(0);
  // Echo spring state (current position + velocity per axis).
  const echoCurX = useRef(0);
  const echoCurY = useRef(0);
  const echoVelX = useRef(0);
  const echoVelY = useRef(0);

  useEffect(() => {
    if (!animated) return;
    let running = true;
    const TENSION = layout.spring.tension;
    const DAMPING = layout.spring.damping;
    const REST_THRESHOLD = layout.spring.restThreshold;
    const IDLE_MS = 2000;
    const DRIFT_AMP = 0.03;
    const DRIFT_PERIOD = 12000;
    // Low-pass ease for cursor position and presence. ~0.18 per frame at 60fps
    // lands inside the spec's 120–200ms response window without overshoot.
    const CURSOR_EASE = 0.18;
    const PRESENCE_EASE = 0.12;
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
      // Echo spring: same target (scaled), deliberately slower than foreground.
      const eCfg = layout.echo;
      const eTarget = targetX.current + driftX;
      const eTargetY = targetY.current + driftY;
      const eForceX = (eTarget * eCfg.amplitudeScale - echoCurX.current) * eCfg.spring.tension;
      const eForceY = (eTargetY * eCfg.amplitudeScale - echoCurY.current) * eCfg.spring.tension;
      echoVelX.current = (echoVelX.current + eForceX) * eCfg.spring.damping;
      echoVelY.current = (echoVelY.current + eForceY) * eCfg.spring.damping;
      echoCurX.current += echoVelX.current;
      echoCurY.current += echoVelY.current;
      if (Math.abs(echoVelX.current) > eCfg.spring.restThreshold || Math.abs(echoVelY.current) > eCfg.spring.restThreshold) {
        setEchoX(echoCurX.current);
        setEchoY(echoCurY.current);
      }
      const prevCX = cursorCurX.current, prevCY = cursorCurY.current, prevP = presenceCur.current;
      cursorCurX.current += (cursorTargetX.current - cursorCurX.current) * CURSOR_EASE;
      cursorCurY.current += (cursorTargetY.current - cursorCurY.current) * CURSOR_EASE;
      presenceCur.current += (presenceTarget.current - presenceCur.current) * PRESENCE_EASE;
      if (Math.abs(cursorCurX.current - prevCX) > 0.1 || Math.abs(cursorCurY.current - prevCY) > 0.1) {
        setCursorVX(cursorCurX.current);
        setCursorVY(cursorCurY.current);
      }
      if (Math.abs(presenceCur.current - prevP) > 0.001) {
        setCursorPresence(presenceCur.current);
      }
      if (running) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [animated, layout]);

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
      // Radial field: viewBox-space cursor position, always updated so the
      // ease-target stays aligned even when the pointer is just outside the field.
      cursorTargetX.current = x * layout.vbWidth;
      cursorTargetY.current = y * layout.vbHeight;
      // Presence tracks whether the pointer is inside the field rect.
      presenceTarget.current = (x >= 0 && x <= 1 && y >= 0 && y <= 1) ? 1 : 0;
    };
    const onLeave = () => { presenceTarget.current = 0; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [animated, layout]);

  // Device-tilt interaction for touch devices.
  // Partial (A) + (C): ambient idle drift always runs; tilt adds input when available.
  // iOS 13+ requires gesture-initiated permission; Android / older iOS attach silently.
  useEffect(() => {
    if (!animated) return;
    if (typeof window === "undefined") return;
    const hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
    if (!hasTouch) return;
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) return;
    if (typeof DOE.requestPermission === "function") {
      setNeedsMotionPerm(true);
    } else {
      attachOrientation();
    }
    return () => detachOrientation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  const attachOrientation = () => {
    // Deadzone so tiny hand tremors don't register.
    const DEADZONE_DEG = 3;
    // Degree at which the eased response hits ~76% of max.
    const FALLOFF_DEG = 30;
    // Low-pass smoothing on the raw gyro stream — 0 = never change, 1 = instant.
    const SMOOTH = 0.12;
    // Smooth ease that maxes asymptotically instead of clamping hard.
    // sign(x) * tanh(|x - deadzone| / falloff), zeroed inside the deadzone.
    const easeTilt = (deg) => {
      const sign = deg < 0 ? -1 : 1;
      const mag = Math.max(0, Math.abs(deg) - DEADZONE_DEG);
      return sign * Math.tanh(mag / FALLOFF_DEG) * 1.6;
    };
    const handler = (e) => {
      // gamma: left-right tilt (-90..90). beta: front-back tilt (-180..180).
      // First reading establishes a baseline so "flat" position sits at rest.
      const g = typeof e.gamma === "number" ? e.gamma : 0;
      const b = typeof e.beta === "number" ? e.beta : 0;
      if (motionBaselineBeta.current === null) motionBaselineBeta.current = b;
      const rawX = easeTilt(g);
      const rawY = easeTilt(b - motionBaselineBeta.current);
      // Low-pass filter so target itself glides rather than jumps on every reading.
      targetX.current += (rawX - targetX.current) * SMOOTH;
      targetY.current += (rawY - targetY.current) * SMOOTH;
      lastMoveTime.current = Date.now();
    };
    window.addEventListener("deviceorientation", handler);
    motionListenerRef.current = handler;
    setMotionActive(true);
  };

  const detachOrientation = () => {
    if (motionListenerRef.current) {
      window.removeEventListener("deviceorientation", motionListenerRef.current);
      motionListenerRef.current = null;
    }
  };

  const requestMotionPermission = async () => {
    try {
      const resp = await window.DeviceOrientationEvent.requestPermission();
      if (resp === "granted") attachOrientation();
    } catch (_) {
      /* denied or unavailable — fall through to ambient idle drift */
    } finally {
      setNeedsMotionPerm(false);
    }
  };

  return (
    <div className="hg-field" ref={fieldRef}>
      {!animated
        ? <FieldSVGAnimated key={`anim-${layoutKey}`} layout={layout} onComplete={() => setAnimated(true)} />
        : <FieldSVG key={`still-${layoutKey}`} layout={layout} pullX={pullX} pullY={pullY} echoX={echoX} echoY={echoY} cursorVX={cursorVX} cursorVY={cursorVY} cursorPresence={cursorPresence} />
      }
      {needsMotionPerm && !motionActive && (
        <button
          type="button"
          className="hg-motion-cta"
          onClick={requestMotionPermission}
          aria-label="Enable motion interaction"
        >
          Tilt to engage
        </button>
      )}
    </div>
  );
}
