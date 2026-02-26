import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
  WebGLRenderer, Scene, PerspectiveCamera,
  PlaneGeometry, MeshBasicMaterial, Mesh, Color, Raycaster, Vector2, Vector3,
} from "three";

/* ── Pick items for the gallery ── */
function selectItems(items) {
  return items
    .filter(c => c.status !== "draft" && (c.section === "practice" || c.body))
    .slice(0, 20);
}

/* ── Card positions: loose spiral spread ── */
function layoutCards(count) {
  const positions = [];
  const goldenAngle = 2.399963;
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const angle = i * goldenAngle;
    const radius = 2.2 + t * 3.5;
    const x = Math.cos(angle) * radius * 0.5;
    const y = (t - 0.5) * 4 + Math.sin(angle + i) * 0.6;
    const z = Math.sin(angle) * radius * 0.5;
    positions.push([x, y, z]);
  }
  return positions;
}

/* ── Section → color map ── */
const SEC_COLORS = {
  practice: 0x3B4A3F,
  writing: 0x5A4E3B,
  exploration: 0x4A3B5A,
  artifacts: 0x3B525A,
};

/* ── Flat fallback (reduced motion) ── */
function FlatGrid({ items, onOpen }) {
  return (
    <div className="sg-flat-grid">
      {items.map(item => (
        <div
          key={item.id}
          className="sg-flat-card"
          onClick={() => onOpen(item)}
        >
          <div className="sg-flat-section">{item.section}</div>
          <div className="sg-flat-title">{item.title}</div>
          <div className="sg-flat-year">{item.year}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */
export default function SpatialGallery({ items, theme, onOpen }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const labelsRef = useRef(null);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [reduceMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const selected = useMemo(() => selectItems(items), [items]);
  const positions = useMemo(() => layoutCards(selected.length), [selected.length]);

  // Click handler
  const handleClick = useCallback(() => {
    if (hoveredIdx >= 0 && selected[hoveredIdx]) {
      onOpen(selected[hoveredIdx]);
    }
  }, [hoveredIdx, selected, onOpen]);

  useEffect(() => {
    if (reduceMotion) return;
    const el = containerRef.current;
    if (!el || selected.length === 0) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0 || h === 0) return;

    // Renderer
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "default" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    canvasRef.current.appendChild(renderer.domElement);

    // Camera
    const cam = new PerspectiveCamera(50, w / h, 0.1, 100);
    cam.position.set(0, 0, 8);
    cam.lookAt(0, 0, 0);

    // Scene
    const scene = new Scene();

    // Card planes
    const cardGeo = new PlaneGeometry(1.6, 1);
    const meshes = [];
    const thm = theme || {};
    const acColor = new Color(thm.ac2 || "#FF5F1F");

    selected.forEach((item, i) => {
      const baseColor = SEC_COLORS[item.section] || 0x555555;
      const mat = new MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      });
      const mesh = new Mesh(cardGeo, mat);
      mesh.position.set(...positions[i]);
      mesh.userData = { index: i, baseColor, baseOpacity: 0.15 };
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Raycaster
    const raycaster = new Raycaster();
    const mouse = new Vector2(9999, 9999);
    let currentHover = -1;

    // Spherical camera controls
    let theta = 0;
    let phi = Math.PI / 2;
    let radius = 8;
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const updateCamera = () => {
      cam.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cam.position.y = radius * Math.cos(phi);
      cam.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cam.lookAt(0, 0, 0);
    };
    updateCamera();

    // Mouse handlers
    const onMouseDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        theta += dx * 0.005;
        phi = Math.max(0.3, Math.min(Math.PI - 0.3, phi - dy * 0.005));
        updateCamera();
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onWheel = (e) => {
      radius = Math.max(4, Math.min(14, radius + e.deltaY * 0.005));
      updateCamera();
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });

    // Touch support
    let touchStart = null;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e) => {
      if (!touchStart || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      theta += dx * 0.005;
      phi = Math.max(0.3, Math.min(Math.PI - 0.3, phi - dy * 0.005));
      updateCamera();
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { touchStart = null; };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    // Label projection
    const labelsEl = labelsRef.current;
    const tempVec = new Vector3();
    const updateLabels = () => {
      if (!labelsEl) return;
      const labels = labelsEl.children;
      for (let i = 0; i < meshes.length && i < labels.length; i++) {
        tempVec.setFromMatrixPosition(meshes[i].matrixWorld);
        tempVec.project(cam);
        const x = (tempVec.x * 0.5 + 0.5) * w;
        const y = (-tempVec.y * 0.5 + 0.5) * h;
        const zDepth = Math.max(0, Math.min(1, (tempVec.z + 1) * 0.5));
        const opacity = 1 - zDepth * 0.7;
        const scale = 1 - zDepth * 0.3;
        labels[i].style.transform = `translate(${x}px,${y}px) translate(-50%,-120%) scale(${scale})`;
        labels[i].style.opacity = opacity;
      }
    };

    // Resize
    let rTimer;
    const onResize = () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        const rw = el.clientWidth;
        const rh = el.clientHeight;
        if (rw === 0 || rh === 0) return;
        renderer.setSize(rw, rh);
        cam.aspect = rw / rh;
        cam.updateProjectionMatrix();
      }, 100);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    // Animate
    let animId = null;
    let time = 0;
    const animate = () => {
      time += 0.016;

      // Ambient float
      meshes.forEach((m, i) => {
        m.position.y = positions[i][1] + Math.sin(time * 0.5 + i * 0.8) * 0.04;
      });

      // Raycast for hover
      raycaster.setFromCamera(mouse, cam);
      const intersects = raycaster.intersectObjects(meshes);
      const newHover = intersects.length > 0 ? intersects[0].object.userData.index : -1;

      if (newHover !== currentHover) {
        // Reset previous
        if (currentHover >= 0 && meshes[currentHover]) {
          const prev = meshes[currentHover];
          prev.material.opacity = prev.userData.baseOpacity;
          prev.material.color.setHex(prev.userData.baseColor);
        }
        // Highlight new
        if (newHover >= 0 && meshes[newHover]) {
          const curr = meshes[newHover];
          curr.material.opacity = 0.4;
          curr.material.color.copy(acColor);
        }
        currentHover = newHover;
        setHoveredIdx(newHover);
      }

      renderer.render(scene, cam);
      updateLabels();
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    stateRef.current = { renderer, cam, scene, meshes, cardGeo };

    // Visibility
    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(animId); }
      else { animId = requestAnimationFrame(animate); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(rTimer);
      ro.disconnect();
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("visibilitychange", onVis);
      meshes.forEach(m => m.material.dispose());
      cardGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, [reduceMotion, selected, positions, theme]);

  // Theme update without remount
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !theme) return;
    const acColor = new Color(theme.ac2 || "#FF5F1F");
    s.meshes.forEach(m => {
      if (m.material.opacity > 0.3) {
        m.material.color.copy(acColor);
      }
    });
  }, [theme]);

  if (reduceMotion) {
    return (
      <div className="sg en">
        <div className="sg-header dc dc1">
          <h1 className="sg-title">Gallery</h1>
          <p className="sg-sub">A spatial view of the work.</p>
        </div>
        <FlatGrid items={selected} onOpen={onOpen} />
      </div>
    );
  }

  return (
    <div className="sg" ref={containerRef} onClick={handleClick}>
      <div className="sg-canvas" ref={canvasRef} />
      <div className="sg-overlay" ref={labelsRef}>
        {selected.map((item, i) => (
          <div
            key={item.id}
            className={`sg-label${hoveredIdx === i ? " sg-label-hl" : ""}`}
          >
            <div className="sg-label-title">{item.title}</div>
            <div className="sg-label-meta">{item.section} · {item.year}</div>
          </div>
        ))}
      </div>
      <div className="sg-hint">Drag to orbit · Scroll to zoom · Click to open</div>
    </div>
  );
}
