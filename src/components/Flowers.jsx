import { useEffect, useMemo, useState } from "react";
import { STARS } from "../data/stars";
import { julianDate, lstDeg, equatorialToHorizon, projectStar } from "../lib/sky";

const FALLBACK_LOC = { lat: 40.6782, lon: -73.9442 }; // Brooklyn, NY

const EMOJI = [
  "🌸", "🌺", "🌻", "🌷", "🌹", "🌼", "💮",
  "✿", "❀", "❁", "❃", "❋", "✾",
];

const HUES = [340, 320, 300, 285, 20, 35, 50, 200, 175, 15, 0, 355];

function rand(min, max) {
  return min + Math.random() * (max - min);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clusterPosition() {
  // Polar distribution in vmin units → circular footprint (width ≈ height in px).
  const angle = Math.random() * Math.PI * 2;
  const r = Math.pow(Math.random(), 1.4);
  const radius = 34; // vmin
  return {
    ox: Math.cos(angle) * r * radius,
    oy: Math.sin(angle) * r * radius,
  };
}

function makeFlower(slot) {
  const isEmoji = Math.random() < 0.55;
  const pos = clusterPosition();
  return {
    key: `${slot}-${Math.random().toString(36).slice(2, 8)}`,
    slot,
    ox: pos.ox,
    oy: pos.oy,
    size: rand(26, 78),
    duration: rand(11, 18),
    rot: rand(-30, 30),
    dx: rand(-22, 22),
    dy: rand(18, 50),
    isEmoji,
    emoji: pick(EMOJI),
    petals: 5 + Math.floor(Math.random() * 8),
    hue: pick(HUES),
    hue2: pick(HUES),
    sat: Math.floor(rand(55, 88)),
    lit: Math.floor(rand(62, 80)),
    coreHue: pick([45, 50, 38, 30]),
  };
}

function paletteForHour(h) {
  // dawn 5–7
  if (h >= 5 && h < 7) return {
    label: "dawn",
    top: "#1c1a2e", mid: "#3d3656", low: "#8a6678", horizon: "#dba98e",
    glow1: "hsla(20, 55%, 50%, 0.45)",
    glow2: "hsla(280, 35%, 25%, 0.35)",
    glow3: "hsla(220, 40%, 25%, 0.30)",
    starOp: 0.35,
  };
  // morning 7–11
  if (h >= 7 && h < 11) return {
    label: "morning",
    top: "#2a3b54", mid: "#4a6584", low: "#8aa3bc", horizon: "#d6c4a4",
    glow1: "hsla(40, 35%, 60%, 0.32)",
    glow2: "hsla(210, 35%, 50%, 0.22)",
    glow3: "hsla(200, 40%, 55%, 0.20)",
    starOp: 0.10,
  };
  // midday 11–14 (kept muted so flowers stay legible)
  if (h >= 11 && h < 14) return {
    label: "midday",
    top: "#3a4a64", mid: "#52688a", low: "#849ab8", horizon: "#a8b0bc",
    glow1: "hsla(220, 25%, 60%, 0.28)",
    glow2: "hsla(40, 22%, 70%, 0.18)",
    glow3: "hsla(200, 30%, 55%, 0.20)",
    starOp: 0.04,
  };
  // afternoon 14–17
  if (h >= 14 && h < 17) return {
    label: "afternoon",
    top: "#33384c", mid: "#4f4660", low: "#8a6a6c", horizon: "#caa07a",
    glow1: "hsla(30, 45%, 55%, 0.40)",
    glow2: "hsla(260, 30%, 30%, 0.30)",
    glow3: "hsla(15, 40%, 45%, 0.28)",
    starOp: 0.18,
  };
  // sunset 17–19
  if (h >= 17 && h < 19) return {
    label: "sunset",
    top: "#1a1235", mid: "#3d1c4a", low: "#963550", horizon: "#e87a48",
    glow1: "hsla(20, 75%, 55%, 0.55)",
    glow2: "hsla(320, 55%, 35%, 0.45)",
    glow3: "hsla(280, 40%, 25%, 0.35)",
    starOp: 0.45,
  };
  // dusk 19–21
  if (h >= 19 && h < 21) return {
    label: "dusk",
    top: "#060410", mid: "#14102e", low: "#2a1a35", horizon: "#321c30",
    glow1: "hsla(335, 45%, 26%, 0.55)",
    glow2: "hsla(285, 40%, 20%, 0.50)",
    glow3: "hsla(220, 45%, 22%, 0.40)",
    starOp: 0.75,
  };
  // night 21–5
  return {
    label: "night",
    top: "#020108", mid: "#080518", low: "#100a25", horizon: "#1a1232",
    glow1: "hsla(240, 50%, 20%, 0.50)",
    glow2: "hsla(260, 40%, 15%, 0.40)",
    glow3: "hsla(220, 40%, 18%, 0.35)",
    starOp: 1.0,
  };
}

function GeomFlower({ f }) {
  const petals = useMemo(() => {
    const arr = [];
    for (let i = 0; i < f.petals; i++) {
      const angle = (360 / f.petals) * i;
      arr.push(angle);
    }
    return arr;
  }, [f.petals]);

  const petalLen = 22;
  const petalWid = 12;
  const cx = 32;
  const cy = 32;

  return (
    <svg
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`pg-${f.key}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={`hsla(${f.hue2}, ${f.sat}%, 92%, 0.95)`} />
          <stop offset="55%" stopColor={`hsla(${f.hue}, ${f.sat}%, ${f.lit}%, 0.95)`} />
          <stop offset="100%" stopColor={`hsla(${f.hue}, ${f.sat}%, ${Math.max(40, f.lit - 22)}%, 0.85)`} />
        </radialGradient>
      </defs>
      {petals.map((a, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy - petalLen / 2}
          rx={petalWid / 2}
          ry={petalLen / 2}
          fill={`url(#pg-${f.key})`}
          transform={`rotate(${a} ${cx} ${cy})`}
          opacity="0.9"
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r="5"
        fill={`hsl(${f.coreHue}, 85%, 60%)`}
        opacity="0.95"
      />
      <circle cx={cx} cy={cy} r="2.5" fill={`hsl(${f.coreHue}, 90%, 80%)`} />
    </svg>
  );
}

const FLOWER_COUNT = 90;
const OPAL_COUNT = 6;
const OPAL_FLECK_HUES = [340, 320, 200, 165, 50, 30, 285, 15];

function blobPath(cx, cy, baseRx, baseRy, n, jitter) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI / n);
    const j = 1 + (Math.random() - 0.5) * jitter;
    pts.push({
      x: cx + Math.cos(angle) * baseRx * j,
      y: cy + Math.sin(angle) * baseRy * j,
    });
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + " Z";
}

function makeOpal(slot) {
  const pos = clusterPosition();
  const aspect = rand(0.55, 0.85);
  const baseRx = 42;
  const baseRy = 42 * aspect;
  const path = blobPath(50, 36, baseRx, baseRy, 7 + Math.floor(Math.random() * 4), 0.42);
  const flecks = [];
  const fleckN = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < fleckN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.6;
    flecks.push({
      x: 50 + Math.cos(a) * r * baseRx * 0.75,
      y: 36 + Math.sin(a) * r * baseRy * 0.75,
      r: 3 + Math.random() * 5,
      hue: pick(OPAL_FLECK_HUES),
      baseAlpha: 0.45 + Math.random() * 0.35,
      dur: 4 + Math.random() * 5,
      delay: -Math.random() * 6,
    });
  }
  return {
    key: `op-${slot}-${Math.random().toString(36).slice(2, 8)}`,
    slot,
    ox: pos.ox,
    oy: pos.oy,
    size: rand(38, 64),
    duration: rand(26, 40),
    rot: rand(-25, 25),
    dx: rand(-14, 14),
    dy: rand(10, 30),
    aspect,
    bodyTint: pick([210, 200, 220, 195, 230]),
    path,
    flecks,
  };
}

function Opal({ o }) {
  const clipId = `opal-clip-${o.key}`;
  return (
    <svg viewBox="0 0 100 70" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`opal-body-${o.key}`} cx="45%" cy="38%" r="60%">
          <stop offset="0%"  stopColor="rgba(255,255,255,0.85)" />
          <stop offset="45%" stopColor={`hsla(${o.bodyTint}, 35%, 86%, 0.55)`} />
          <stop offset="100%" stopColor={`hsla(${o.bodyTint}, 40%, 70%, 0.20)`} />
        </radialGradient>
        <radialGradient id={`opal-hi-${o.key}`} cx="35%" cy="28%" r="35%">
          <stop offset="0%"  stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={o.path} />
        </clipPath>
      </defs>
      <path d={o.path} fill={`url(#opal-body-${o.key})`} />
      <g clipPath={`url(#${clipId})`}>
        {o.flecks.map((f, i) => (
          <circle
            key={i}
            cx={f.x}
            cy={f.y}
            r={f.r}
            fill={`hsl(${f.hue}, 95%, 72%)`}
            style={{
              mixBlendMode: "screen",
              opacity: f.baseAlpha,
              animation: `fl-opal-shimmer ${f.dur}s ease-in-out ${f.delay}s infinite`,
              transformOrigin: `${f.x}px ${f.y}px`,
            }}
          />
        ))}
        <ellipse cx="42" cy="26" rx="22" ry="10" fill={`url(#opal-hi-${o.key})`} />
      </g>
    </svg>
  );
}

function computeStars(loc, now) {
  const jd = julianDate(now);
  const lst = lstDeg(jd, loc.lon);
  const out = [];
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const h = equatorialToHorizon(s.ra, s.dec, loc.lat, lst);
    const p = projectStar(h.alt, h.az);
    if (!p) continue;
    const left = 50 + p.x * 50;
    const top = 50 + p.y * 50;
    const size = Math.max(0.6, 3.6 - s.mag * 0.45);
    const baseOp = Math.max(0.25, 1 - Math.max(0, s.mag) * 0.13);
    if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(baseOp)) continue;
    out.push({
      id: i,
      left,
      top,
      mag: s.mag,
      size,
      baseOp,
      delay: (i * 0.61) % 6,
      dur: 3 + (i % 5) * 0.8,
    });
  }
  return out;
}

export default function Flowers() {
  const [flowers, setFlowers] = useState(() =>
    Array.from({ length: FLOWER_COUNT }, (_, i) => makeFlower(i))
  );
  const [opals, setOpals] = useState(() =>
    Array.from({ length: OPAL_COUNT }, (_, i) => makeOpal(i))
  );
  const [palette, setPalette] = useState(() => paletteForHour(new Date().getHours()));
  const [loc, setLoc] = useState(FALLBACK_LOC);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => {
      setPalette(paletteForHour(new Date().getHours()));
      setNow(new Date());
    };
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { /* keep fallback */ },
      { timeout: 8000, maximumAge: 60 * 60 * 1000 }
    );
  }, []);

  const stars = useMemo(() => computeStars(loc, now), [loc, now]);

  useEffect(() => {
    const id = setInterval(() => {
      setFlowers((prev) => {
        const next = prev.slice();
        const k = 2 + Math.floor(Math.random() * 3);
        const seen = new Set();
        for (let n = 0; n < k; n++) {
          let idx;
          do {
            idx = Math.floor(Math.random() * next.length);
          } while (seen.has(idx));
          seen.add(idx);
          next[idx] = makeFlower(idx);
        }
        return next;
      });
    }, 1700);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setOpals((prev) => {
        const next = prev.slice();
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = makeOpal(idx);
        return next;
      });
    }, 5200);
    return () => clearInterval(id);
  }, []);

  const skyBg = `
    radial-gradient(ellipse 80% 60% at 50% 110%, ${palette.glow1}, transparent 65%),
    radial-gradient(ellipse 60% 50% at 18% 85%, ${palette.glow2}, transparent 55%),
    radial-gradient(ellipse 70% 55% at 82% 88%, ${palette.glow3}, transparent 55%),
    linear-gradient(180deg,
      ${palette.top} 0%,
      ${palette.mid} 38%,
      ${palette.low} 74%,
      ${palette.horizon} 100%
    )
  `;

  return (
    <div className="fl-page" data-tod={palette.label}>
      <div className="fl-sky" style={{ background: skyBg }} />
      <div className="fl-stars">
        {stars.map((s) => (
          <span
            key={s.id}
            className="fl-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              opacity: s.baseOp * palette.starOp,
            }}
          />
        ))}
      </div>

      <div className="fl-field" aria-hidden="true">
        {flowers.map((f) => (
          <div
            key={f.key}
            className="fl-bloom"
            style={{
              left: `calc(50% + ${f.ox}vmin)`,
              top: `calc(50% + ${f.oy}vmin)`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              "--dur": `${f.duration}s`,
              "--rot": `${f.rot}deg`,
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              fontSize: `${f.size}px`,
              filter: f.isEmoji
                ? `drop-shadow(0 0 ${Math.round(f.size / 4)}px hsla(${f.hue}, 70%, 60%, 0.35))`
                : `drop-shadow(0 0 ${Math.round(f.size / 5)}px hsla(${f.hue}, 70%, 55%, 0.5))`,
            }}
          >
            {f.isEmoji ? (
              <span className="fl-emoji">{f.emoji}</span>
            ) : (
              <GeomFlower f={f} />
            )}
          </div>
        ))}
      </div>

      <div className="fl-opals" aria-hidden="true">
        {opals.map((o) => (
          <div
            key={o.key}
            className="fl-opal"
            style={{
              left: `calc(50% + ${o.ox}vmin)`,
              top: `calc(50% + ${o.oy}vmin)`,
              width: `${o.size}px`,
              height: `${o.size * o.aspect}px`,
              "--dur": `${o.duration}s`,
              "--rot": `${o.rot}deg`,
              "--dx": `${o.dx}px`,
              "--dy": `${o.dy}px`,
            }}
          >
            <Opal o={o} />
          </div>
        ))}
      </div>

      <div className="fl-haze" />

      <style>{`
        .fl-page {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .fl-sky {
          position: absolute;
          inset: 0;
          transition: background 1200ms ease;
        }
        .fl-haze {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 90% 50% at 50% 100%, hsla(340, 50%, 40%, 0.18), transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 0%, hsla(240, 50%, 15%, 0.25), transparent 70%);
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .fl-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .fl-star {
          position: absolute;
          background: #fff;
          border-radius: 50%;
          animation: fl-twinkle ease-in-out infinite;
          will-change: opacity, transform;
          transition: left 1200ms linear, top 1200ms linear, opacity 1200ms linear;
        }
        @keyframes fl-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 0.95; transform: scale(1.15); }
        }
        .fl-field {
          position: absolute;
          inset: 0;
        }
        .fl-bloom {
          position: absolute;
          transform-origin: center center;
          animation: fl-cycle var(--dur) ease-in-out infinite;
          will-change: transform, opacity;
          display: block;
        }
        .fl-emoji {
          display: block;
          line-height: 1;
          user-select: none;
          text-shadow: 0 0 18px rgba(255, 200, 230, 0.25);
        }
        @keyframes fl-cycle {
          0%   { opacity: 0;    transform: translate(0,0) scale(0.05) rotate(var(--rot)); }
          12%  { opacity: 0.85; transform: translate(calc(var(--dx) * 0.2), calc(var(--dy) * -0.2)) scale(0.55) rotate(calc(var(--rot) + 4deg)); }
          30%  { opacity: 1;    transform: translate(calc(var(--dx) * 0.45), calc(var(--dy) * -0.45)) scale(1.05) rotate(calc(var(--rot) + 12deg)); }
          55%  { opacity: 1;    transform: translate(calc(var(--dx) * 0.7), calc(var(--dy) * -0.7)) scale(1.0) rotate(calc(var(--rot) + 20deg)); }
          78%  { opacity: 0.7;  transform: translate(calc(var(--dx) * 0.9), calc(var(--dy) * -0.9)) scale(0.9) rotate(calc(var(--rot) + 26deg)); }
          92%  { opacity: 0.25; transform: translate(var(--dx), calc(var(--dy) * -1.05)) scale(0.78) rotate(calc(var(--rot) + 30deg)); }
          100% { opacity: 0;    transform: translate(var(--dx), calc(var(--dy) * -1.15)) scale(0.7) rotate(calc(var(--rot) + 34deg)); }
        }
        .fl-opals {
          position: absolute;
          inset: 0;
        }
        .fl-opal {
          position: absolute;
          transform: translate(-50%, -50%);
          transform-origin: center center;
          animation: fl-opal-cycle var(--dur) ease-in-out infinite;
          will-change: transform, opacity;
          filter: drop-shadow(0 0 18px rgba(220, 230, 255, 0.35));
        }
        @keyframes fl-opal-cycle {
          0%   { opacity: 0;    transform: translate(-50%, -50%) scale(0.4) rotate(var(--rot)); }
          18%  { opacity: 0.9;  transform: translate(calc(-50% + var(--dx) * 0.25), calc(-50% + var(--dy) * -0.25)) scale(1) rotate(calc(var(--rot) + 8deg)); }
          50%  { opacity: 0.95; transform: translate(calc(-50% + var(--dx) * 0.55), calc(-50% + var(--dy) * -0.55)) scale(1) rotate(calc(var(--rot) + 20deg)); }
          82%  { opacity: 0.9;  transform: translate(calc(-50% + var(--dx) * 0.85), calc(-50% + var(--dy) * -0.85)) scale(0.98) rotate(calc(var(--rot) + 32deg)); }
          100% { opacity: 0;    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) * -1.05)) scale(0.8) rotate(calc(var(--rot) + 40deg)); }
        }
        @keyframes fl-opal-shimmer {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fl-bloom { animation-duration: 40s; }
          .fl-opal  { animation-duration: 60s; }
          .fl-star  { animation: none; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
