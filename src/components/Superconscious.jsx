import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

/* ── Image manifest ─────────────────────────────────────────── */
const DRAWINGS = Array.from({ length: 115 }, (_, i) => {
  const num = String(i + 12).padStart(3, "0");
  return {
    id: i + 1,
    file: `4726-${num}`,
    thumb: `media/drawings/thumbs/4726-${num}.jpg`,
    full: `media/drawings/full/4726-${num}.jpg`,
  };
});

/* ── Lightbox ───────────────────────────────────────────────── */
function Lightbox({ drawings, index, onClose, onNav }) {
  const d = drawings[index];
  if (!d) return null;

  return createPortal(
    <div onClick={onClose} className="sc-lightbox">
      <button
        onClick={(e) => { e.stopPropagation(); onNav(-1); }}
        className="sc-lb-arrow sc-lb-prev"
      >&#8249;</button>

      <img
        src={d.full}
        alt={`Drawing ${d.id}`}
        onClick={(e) => e.stopPropagation()}
        className="sc-lb-media"
      />

      <button
        onClick={(e) => { e.stopPropagation(); onNav(1); }}
        className="sc-lb-arrow sc-lb-next"
      >&#8249;</button>

      <div className="sc-lb-counter" onClick={(e) => e.stopPropagation()}>
        {index + 1} / {drawings.length}
      </div>

      <button
        onClick={onClose}
        className="sc-lb-close"
      >&times;</button>
    </div>,
    document.body
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Superconscious() {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const openLightbox = useCallback((i) => setLightboxIdx(i), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const navLightbox = useCallback((dir) => {
    setLightboxIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return DRAWINGS.length - 1;
      if (next >= DRAWINGS.length) return 0;
      return next;
    });
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (lightboxIdx === null) return;
      if (e.key === "ArrowLeft") navLightbox(-1);
      if (e.key === "ArrowRight") navLightbox(1);
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, navLightbox, closeLightbox]);

  return (
    <div className="sc-page">
      {/* Header */}
      <header className="sc-header">
        <h1 className="sc-title">Share Location</h1>
        <p className="sc-subtitle">Superconscious Drawings</p>
        <p className="sc-date">2019 — 2025</p>
      </header>

      {/* Context */}
      <section className="sc-narrative">
        <p className="sc-narr-body">
          Over time something shifted. I stopped toggling between awareness and instinct and began holding both at once. Conscious of the mark being made while simultaneously surrendering to what wanted to emerge. The drawings became a record of that state. Conscious and Subconscious at once. Superconscious.
        </p>
        <p className="sc-narr-body">
          They came out of a desire to anchor myself. To resist being pulled into the churn of the news cycle. Between 2019 and 2025 the world kept accelerating. Information, crisis, and opinion. An endless loop designed to pull you out of yourself. This practice allowed a hold in place. Something slower than thought. Something the body could lead.
        </p>
        <p className="sc-narr-meta">
          Monoline white paint on black 9 × 11″ archival paper · 126 drawings · Showing 115
        </p>
      </section>

      {/* Grid */}
      <section className="sc-grid">
        {DRAWINGS.map((d, i) => (
          <div
            key={d.id}
            className="sc-grid-item"
            onClick={() => openLightbox(i)}
          >
            <img
              src={d.thumb}
              alt={`Drawing ${d.id}`}
              loading="lazy"
              className="sc-grid-img"
            />
          </div>
        ))}
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          drawings={DRAWINGS}
          index={lightboxIdx}
          onClose={closeLightbox}
          onNav={navLightbox}
        />
      )}
    </div>
  );
}
