import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";

/* ── Build graph from items with relations ── */
function buildGraph(items) {
  const byTitle = {};
  items.forEach(item => { byTitle[item.title] = item; });

  const edges = [];
  const edgeSet = new Set();
  items.forEach(item => {
    (item.relations || []).forEach(relTitle => {
      if (byTitle[relTitle]) {
        const key = [item.title, relTitle].sort().join("|||");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ source: item.title, target: relTitle });
        }
      }
    });
  });

  const connected = new Set();
  edges.forEach(e => { connected.add(e.source); connected.add(e.target); });

  const nodes = items
    .filter(item => connected.has(item.title))
    .map(item => ({ id: item.title, section: item.section }));

  return { nodes, edges };
}

/* ── Simple force-directed layout ── */
function computeLayout(nodes, edges, width, height) {
  const PAD = 60, ITER = 120, REPULSE = 3500, ATTRACT = 0.004, DAMP = 0.9;
  const cx = width / 2, cy = height / 2;
  const r = Math.min(width, height) / 2 - PAD;

  const pos = nodes.map((n, i) => {
    const a = (2 * Math.PI * i) / nodes.length;
    return { id: n.id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), vx: 0, vy: 0 };
  });
  const byId = {};
  pos.forEach(p => { byId[p.id] = p; });

  for (let t = 0; t < ITER; t++) {
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i], b = pos[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = REPULSE / (d * d);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    edges.forEach(e => {
      const a = byId[e.source], b = byId[e.target];
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = d * ATTRACT;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    });
    pos.forEach(p => {
      p.vx *= DAMP; p.vy *= DAMP;
      p.x += p.vx; p.y += p.vy;
      p.x = Math.max(PAD, Math.min(width - PAD, p.x));
      p.y = Math.max(PAD, Math.min(height - PAD, p.y));
    });
  }
  return pos;
}

export default function NetworkGraph({ items, onRelation, activeNode }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDims({ width, height: width > 768 ? 380 : 260 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges } = useMemo(() => {
    return buildGraph(items.filter(i => i.status !== "draft"));
  }, [items]);

  const positions = useMemo(() => {
    if (dims.width === 0 || nodes.length === 0) return [];
    return computeLayout(nodes, edges, dims.width, dims.height);
  }, [nodes, edges, dims]);

  const posById = useMemo(() => {
    const m = {};
    positions.forEach(p => { m[p.id] = p; });
    return m;
  }, [positions]);

  useEffect(() => {
    if (positions.length > 0) {
      const t = setTimeout(() => setEntered(true), 80);
      return () => clearTimeout(t);
    }
  }, [positions]);

  const edgeCounts = useMemo(() => {
    const c = {};
    edges.forEach(e => {
      c[e.source] = (c[e.source] || 0) + 1;
      c[e.target] = (c[e.target] || 0) + 1;
    });
    return c;
  }, [edges]);

  const effectiveHover = hoveredNode || activeNode;

  // Label collision avoidance — flip overlapping labels above their nodes
  const labelOffsets = useMemo(() => {
    const CPX = 6.2; // approx px per character at label font size
    const offsets = {};
    positions.forEach(p => {
      const r = 5 + (edgeCounts[p.id] || 0) * 1.5;
      offsets[p.id] = r + 14; // default: below
    });
    // Check each pair; use label text width for horizontal threshold
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i], b = positions[j];
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        // horizontal threshold = half-width of each label (text is centered)
        const hw = (a.id.length * CPX + b.id.length * CPX) / 2;
        const threshX = Math.max(120, hw);
        if (dx < threshX && dy < 50) {
          // Labels would collide — flip the one with fewer edges above
          const ca = edgeCounts[a.id] || 0, cb = edgeCounts[b.id] || 0;
          const flip = ca <= cb ? a.id : b.id;
          const rFlip = 5 + (edgeCounts[flip] || 0) * 1.5;
          offsets[flip] = -(rFlip + 6); // above
        }
      }
    }
    return offsets;
  }, [positions, edgeCounts]);

  const connectedTo = useMemo(() => {
    if (!effectiveHover) return null;
    const s = new Set();
    s.add(effectiveHover);
    edges.forEach(e => {
      if (e.source === effectiveHover) s.add(e.target);
      if (e.target === effectiveHover) s.add(e.source);
    });
    return s;
  }, [effectiveHover, edges]);

  const sectionColor = useCallback((section) => {
    switch (section) {
      case "writing": return "var(--ac2)";
      case "exploration": return "var(--ac1)";
      case "artifacts": return "var(--fm)";
      case "practice": return "var(--fg)";
      default: return "var(--ff)";
    }
  }, []);

  if (dims.width === 0 || nodes.length === 0) {
    return <div ref={containerRef} className="ng-container" />;
  }

  return (
    <div ref={containerRef} className="ng-container">
      <div className="ng-header">Connections</div>
      <svg
        className={`ng-svg${entered ? " ng-entered" : ""}`}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        width={dims.width}
        height={dims.height}
      >
        {/* Edges */}
        <g className="ng-edges">
          {edges.map((e, i) => {
            const s = posById[e.source], t = posById[e.target];
            if (!s || !t) return null;
            const hl = connectedTo && connectedTo.has(e.source) && connectedTo.has(e.target);
            const dim = connectedTo && !hl;
            return (
              <line
                key={`${e.source}-${e.target}`}
                className={`ng-edge${hl ? " ng-edge-hl" : ""}${dim ? " ng-edge-dim" : ""}`}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="ng-nodes">
          {positions.map((p, i) => {
            const node = nodes.find(n => n.id === p.id);
            const isHovered = effectiveHover === p.id;
            const isConn = connectedTo && connectedTo.has(p.id);
            const isDim = connectedTo && !isConn;
            const r = 5 + (edgeCounts[p.id] || 0) * 1.5;

            return (
              <g
                key={p.id}
                className={`ng-node${isHovered ? " ng-node-hovered" : ""}${isDim ? " ng-node-dim" : ""}`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onMouseEnter={() => setHoveredNode(p.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onRelation(p.id)}
              >
                {isHovered && <circle cx={p.x} cy={p.y} r={r + 12} className="ng-node-glow" />}
                <circle cx={p.x} cy={p.y} r={r} fill={sectionColor(node?.section)} className="ng-node-circle" />
                <text x={p.x} y={p.y + (labelOffsets[p.id] || r + 14)} className={`ng-node-label${isHovered ? " ng-label-hl" : ""}`}>
                  {p.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
