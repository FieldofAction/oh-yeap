import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { VIS } from "../../data/seed";
import { HiddenStrip } from "../HiddenIndicators";
import { PatternChipsDetail, AlexanderChipsDetail } from "../PatternLens";
import VideoEmbed from "../VideoEmbed";

/* Catalogue — collapsible instrument index */
function CatalogueBlock({ block, observe }) {
  const [open, setOpen] = useState(false);
  return (
    <div ref={observe} className="cs-block cs-block--catalogue cs-sr cs-sr--rise">
      <button type="button" className="cs-catalogue-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="cs-catalogue-toggle-head">
          {block.label && <span className="cs-block--section-label">{block.label}</span>}
          {block.heading && <span className="cs-catalogue-heading">{block.heading}</span>}
        </span>
        <span className={`cs-catalogue-chev${open ? " is-open" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="cs-catalogue-groups">
          {block.groups?.map((g, gi) => (
            <div key={gi} className="cs-cat-group">
              <div className="cs-cat-moment">
                {g.moment}
                {g.sub && <span className="cs-cat-moment-sub">{g.sub}</span>}
              </div>
              <div className="cs-cat-rows">
                {g.items?.map((it, ii) => (
                  <div key={ii} className="cs-cat-row">
                    <span className="cs-cat-name">{it.name}</span>
                    <span className="cs-cat-line">{it.line}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Triptych — three cards; with variant:"spread" the outer tiles
   slide apart on scroll to reveal the middle as an individual tile */
function TriptychBlock({ block, observe }) {
  const spread = block.variant === "spread";
  /* Scroll progress (--spread) is driven by the shared handler in CaseStudyDetail. */
  const cls = `cs-block cs-block--triptych${spread ? " cs-block--spread" : ""} cs-sr${spread ? "" : " cs-sr--stagger"}`;
  return (
    <div ref={observe} className={cls}>
      {block.images?.map((img, i) => (
        <div key={i} className="cs-triptych-card" style={img.bg ? { background: img.bg } : {}}>
          {img.src && <img src={img.src} alt={img.alt || ""} />}
          {(img.label || img.title) && <div className="cs-triptych-overlay" />}
          {img.label && <div className="cs-triptych-label">{img.label}</div>}
          {img.title && <div className="cs-triptych-title">{img.title}</div>}
        </div>
      ))}
      {block.caption && <div className="cs-cap">{block.caption}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scroll-triggered reveal system
   Uses IntersectionObserver rooted in the .cs-overlay scroll
   container. Blocks start hidden and animate in as they
   enter the viewport — replaces mount-time stagger.
   ═══════════════════════════════════════════════════════════ */
function useScrollReveal(rootRef) {
  const observerRef = useRef(null);
  const elemsRef = useRef(new Set());

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cs-visible");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { root, threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    // Observe anything already registered
    elemsRef.current.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, [rootRef]);

  // Ref callback — attach to each block
  const observe = useCallback((el) => {
    if (!el) return;
    elemsRef.current.add(el);
    observerRef.current?.observe(el);
  }, []);

  return observe;
}

/* ── Image block helper — renders src or generated SVG ── */
function BlockImg({ src, alt, fg, artVi, index = 0 }) {
  if (src) {
    return <img src={src} alt={alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: artVi(index) }} style={{ width: "100%", height: "100%" }} />
      <div className="cs-block-glow" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(47,91,255,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
    </>
  );
}

/* ── Instrument icon rail — decorative vertical glyph stack ── */
function IconRail({ items, active = 0 }) {
  if (!items?.length) return null;
  return (
    <div className="cs-icon-rail" aria-hidden="true">
      {items.map((it, i) => (
        <div key={i} className={`cs-icon-rail-item${i === active ? " active" : ""}`} title={it.label || ""}>
          <span>{it.glyph}</span>
        </div>
      ))}
    </div>
  );
}

export default function CaseStudyDetail({ item, closing, onClose, fg, lens, patternLens }) {
  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg), [item.title, fg]);

  const overlayRef = useRef(null);
  const observe = useScrollReveal(overlayRef);

  /* Scroll-driven motion — drives --p (0..1 progress through viewport) on
     marked image blocks for subtle parallax / reveal. Scoped to Workbench. */
  useEffect(() => {
    if (item.title !== "Workbench") return;
    const root = overlayRef.current;
    if (!root) return;
    const pEls = Array.from(root.querySelectorAll(".cs-block--material, .cs-block--band, .cs-block--plate, .cs-block--plate-split"));
    const triEls = Array.from(root.querySelectorAll(".cs-block--triptych.cs-block--spread"));
    if (!pEls.length && !triEls.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 800;
      // read pass — all layout reads batched first
      const pRects = pEls.map((el) => el.getBoundingClientRect());
      const triRects = triEls.map((el) => el.getBoundingClientRect());
      // write pass — no interleaved reads, so no forced reflow per element
      for (let i = 0; i < pEls.length; i++) {
        const r = pRects[i];
        const p = Math.max(0, Math.min(1, 1 - (r.top + r.height / 2) / vh));
        pEls[i].style.setProperty("--p", p.toFixed(3));
      }
      for (let i = 0; i < triEls.length; i++) {
        const r = triRects[i];
        const s = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.85)));
        triEls[i].style.setProperty("--spread", s.toFixed(3));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [item.title]);

  const cs = item.caseStudy;
  if (!cs) return null;
  const imgs = cs.images || {};
  const figures = imgs.figures || [];
  const layout = cs.layout;

  /* ── Editorial block renderer ── */
  const renderBlock = (block, idx) => {
    const key = `block-${idx}`;

    switch (block.type) {
      /* ── Hero image — full bleed ── */
      case "hero":
        /* Floating variant: framed card on a gradient stage with an instrument rail */
        if (block.variant === "float") {
          return (
            <div key={key} ref={observe} className="cs-block cs-block--hero-float cs-sr cs-sr--scale">
              <div className="cs-hero-float-bg" style={block.bgGradient ? { background: block.bgGradient } : undefined} />
              <div className="cs-hero-float-stage">
                <div className="cs-hero-float-card">
                  {block.src ? (
                    <img src={block.src} alt={block.alt || item.title} />
                  ) : (
                    <BlockImg src={null} alt={item.title} fg={fg} artVi={artVi} index={idx} />
                  )}
                </div>
                <IconRail items={block.rail} />
              </div>
              {block.caption && <div className="cs-cap cs-cap--light">{block.caption}</div>}
            </div>
          );
        }
        /* Frame variant: full screenshot shown legibly (contain) in a clean hairline frame */
        if (block.variant === "frame") {
          return (
            <div key={key} ref={observe} className="cs-block cs-block--plate-frame cs-sr cs-sr--scale">
              <div className="cs-plate-figure">
                {block.src ? <img src={block.src} alt={block.alt || item.title} /> : <BlockImg src={null} alt={item.title} fg={fg} artVi={artVi} index={idx} />}
              </div>
              {block.caption && <div className="cs-cap cs-cap--center">{block.caption}</div>}
            </div>
          );
        }
        return (
          <div key={key} ref={observe} className={`cs-block cs-block--hero${block.variant ? ` cs-block--${block.variant}` : ""} cs-sr cs-sr--scale`}>
            <div className="cs-block-img">
              <BlockImg src={block.src} alt={block.alt || item.title} fg={fg} artVi={artVi} index={idx} />
            </div>
            {block.caption && <div className="cs-cap">{block.caption}</div>}
          </div>
        );

      /* ── Figure — single full-width ── */
      case "figure":
        return (
          <div key={key} ref={observe} className={`cs-block cs-block--figure${block.variant ? ` cs-block--${block.variant}` : ""} cs-sr cs-sr--rise`}>
            <div className="cs-block-img">
              <BlockImg src={block.src} alt={block.alt} fg={fg} artVi={artVi} index={idx} />
            </div>
            {block.caption && <div className="cs-cap">{block.caption}</div>}
          </div>
        );

      /* ── Two-up — side by side ── */
      case "two-up":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--two-up cs-sr cs-sr--stagger">
            {block.images?.map((img, i) => (
              <div key={i} className="cs-block-img">
                <BlockImg src={img.src} alt={img.alt} fg={fg} artVi={artVi} index={idx + i} />
              </div>
            ))}
            {block.images?.some(img => img.caption) && (
              <div className="cs-block-cap">
                {block.images.map((img, i) => (
                  <div key={i} className="cs-cap">{img.caption || ""}</div>
                ))}
              </div>
            )}
          </div>
        );

      /* ── Three-up — three in a row ── */
      case "three-up":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--three-up cs-sr cs-sr--stagger">
            {block.images?.map((img, i) => (
              <div key={i} className="cs-block-img">
                <BlockImg src={img.src} alt={img.alt} fg={fg} artVi={artVi} index={idx + i} />
              </div>
            ))}
            {block.caption && (
              <div className="cs-block-cap"><div className="cs-cap">{block.caption}</div></div>
            )}
          </div>
        );

      /* ── Inline — image + text side by side ── */
      case "inline":
        return (
          <div key={key} ref={observe} className={`cs-block cs-block--inline${block.align === "right" ? " cs-block--inline-right" : ""} cs-sr cs-sr--rise`}>
            <div>
              <div className="cs-block-img">
                <BlockImg src={block.src} alt={block.alt} fg={fg} artVi={artVi} index={idx} />
              </div>
              {block.caption && <div className="cs-cap">{block.caption}</div>}
            </div>
            {block.text && (
              <div className="cs-block-inline-text">
                {block.text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        );

      /* ── Section header ── */
      case "section":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--section cs-sr cs-sr--rise">
            <div className="cs-block--section-label">{block.label}</div>
            <div className="cs-block--section-rule" />
          </div>
        );

      /* ── Body text — pulls from cs data by key ── */
      case "body": {
        let text = block.text;
        if (!text && block.key) {
          if (block.key === "framing") text = cs.framing;
          else if (block.key === "outcomes" && cs.outcomes?.points) {
            return (
              <div key={key} ref={observe} className="cs-block cs-block--body cs-narrative cs-sr cs-sr--rise">
                <ul className="cs-points">
                  {cs.outcomes.points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            );
          }
        }
        if (!text) return null;
        return (
          <div key={key} ref={observe} className="cs-block cs-block--body cs-sr cs-sr--rise">
            <div className="cs-body">
              {text.split("\n\n").map((p, i) => (
                <p key={i}>
                  {p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
                    /^\*\*[^*]+\*\*$/.test(seg) ? <strong key={j}>{seg.slice(2, -2)}</strong> : seg
                  )}
                </p>
              ))}
            </div>
          </div>
        );
      }

      /* ── Pull quote — text as image ── */
      case "pull-quote":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--pull-quote cs-sr cs-sr--rise">
            <div className="cs-block--pull-quote-rule" />
            <div className="cs-block--pull-quote-text">{block.text}</div>
            {block.attr && <div className="cs-block--pull-quote-attr">{block.attr}</div>}
          </div>
        );

      /* ── Reframe — thesis + body ── */
      case "reframe":
        if (!cs.reframe) return null;
        return (
          <div key={key} ref={observe} className="cs-reframe cs-sr cs-sr--rise">
            <div className="cs-reframe-thesis">{cs.reframe.thesis}</div>
            {cs.reframe.body && (
              <div className="cs-body cs-reframe-body">
                {cs.reframe.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        );

      /* ── Intervention — 3-column grid ── */
      case "intervention":
        if (!cs.intervention) return null;
        return (
          <div key={key} ref={observe} className="cs-block cs-block--intervention cs-sr cs-sr--stagger">
            <div className="cs-intervention-grid">
              {cs.intervention.system && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">01</div>
                  <div className="cs-intv-h">System Design</div>
                  <div className="cs-intv-body">{cs.intervention.system.map((s, i) => <p key={i}>{s}</p>)}</div>
                </div>
              )}
              {cs.intervention.expression && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">02</div>
                  <div className="cs-intv-h">Expression</div>
                  <div className="cs-intv-body">{cs.intervention.expression.map((s, i) => <p key={i}>{s}</p>)}</div>
                </div>
              )}
              {cs.intervention.governance && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">03</div>
                  <div className="cs-intv-h">Governance</div>
                  <div className="cs-intv-body">{cs.intervention.governance.map((s, i) => <p key={i}>{s}</p>)}</div>
                </div>
              )}
              {cs.intervention.method && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">04</div>
                  <div className="cs-intv-h">Method, Made Operable</div>
                  <div className="cs-intv-body">{cs.intervention.method.map((s, i) => <p key={i}>{s}</p>)}</div>
                </div>
              )}
            </div>
          </div>
        );

      /* ── Insight — closing lines ── */
      case "insight":
        if (!cs.outcomes?.insight?.length) return null;
        return (
          <div key={key} ref={observe} className="cs-insight cs-sr cs-sr--rise">
            {cs.outcomes.insight.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        );

      /* ── Video ── */
      case "video":
        return (
          <div key={key} ref={observe} className="cs-block cs-sr cs-sr--scale">
            <VideoEmbed url={block.url || item.videoUrl} poster={block.poster || item.videoPoster} />
          </div>
        );

      /* ═══════════════════════════════════════════
         NEW BLOCK TYPES — Agency-level techniques
         ═══════════════════════════════════════════ */

      /* ── Sticky — text pinned while images scroll ── */
      case "sticky":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--sticky cs-sr cs-sr--rise">
            <div className="cs-sticky-text">
              {block.label && <div className="cs-block--section-label">{block.label}</div>}
              {block.heading && <h2 className="cs-sticky-heading">{block.heading}</h2>}
              {block.body && <div className="cs-sticky-body">{block.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
            </div>
            <div className="cs-sticky-images">
              {block.images?.map((img, i) => (
                <div key={i} className="cs-sticky-card">
                  <div className="cs-block-img">
                    <BlockImg src={img.src} alt={img.alt} fg={fg} artVi={artVi} index={idx + i} />
                  </div>
                  {img.caption && <div className="cs-cap">{img.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        );

      /* ── Split — text vs image, full bleed contrast ── */
      case "split":
        return (
          <div key={key} ref={observe} className={`cs-block cs-block--split${block.align === "right" ? " cs-block--split-reversed" : ""} cs-sr cs-sr--rise`}>
            <div className={`cs-split-text${block.tone === "light" ? " cs-split-text--light" : ""}`}>
              {block.subtitle && <div className="cs-split-subtitle">{block.subtitle}</div>}
              {block.heading && <h2 className="cs-split-heading">{block.heading}</h2>}
              {block.body && <div className="cs-split-body">{block.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
            </div>
            <div className={`cs-split-image${block.panel ? " cs-split-image--panel" : ""}`} style={block.panel && block.panelGradient ? { background: block.panelGradient } : undefined}>
              {block.src ? (
                block.panel ? (
                  <div className="cs-split-card">
                    <img src={block.src} alt={block.alt || ""} />
                  </div>
                ) : (
                  <img src={block.src} alt={block.alt || ""} />
                )
              ) : (
                <div className="cs-split-gradient" />
              )}
              {block.panel && <IconRail items={block.rail} active={block.railActive ?? 0} />}
            </div>
          </div>
        );

      /* ── Device — screenshot in CSS monitor mockup ── */
      case "device":
        return (
          <div key={key} ref={observe} className={`cs-block cs-block--device${block.panel ? " cs-block--device-panel" : ""} cs-sr cs-sr--scale`} style={block.panel && block.bgGradient ? { background: block.bgGradient } : undefined}>
            {block.panel && <IconRail items={block.rail} active={block.railActive ?? 0} />}
            <div className="cs-device-glow" />
            <div className="cs-device-frame">
              <div className="cs-device-screen">
                {block.src ? (
                  <img src={block.src} alt={block.alt || ""} />
                ) : (
                  <div className="cs-device-placeholder">
                    <BlockImg src={null} alt="" fg={fg} artVi={artVi} index={idx} />
                  </div>
                )}
              </div>
            </div>
            <div className="cs-device-base" />
            <div className="cs-device-stand" />
            <div className="cs-device-foot" />
            {block.caption && <div className="cs-cap" style={{ textAlign: "center", marginTop: 16 }}>{block.caption}</div>}
          </div>
        );

      /* ── Grid — contact sheet / film strip ── */
      case "grid": {
        const cols = block.cols || 4;
        return (
          <div key={key} ref={observe} className="cs-block cs-block--grid cs-sr cs-sr--stagger" style={{ "--grid-cols": cols }}>
            {block.images?.map((img, i) => (
              <div key={i} className={`cs-grid-cell${img.brand ? " cs-grid-cell--brand" : ""}`}>
                {img.brand ? (
                  <span>{img.brand}</span>
                ) : (
                  <div className="cs-block-img">
                    <BlockImg src={img.src} alt={img.alt} fg={fg} artVi={artVi} index={idx + i} />
                  </div>
                )}
              </div>
            ))}
            {block.caption && <div className="cs-cap" style={{ gridColumn: "1/-1" }}>{block.caption}</div>}
          </div>
        );
      }

      /* ── Triptych — tall poster-style cards (scroll-spread when variant) ── */
      case "triptych":
        return <TriptychBlock key={key} block={block} observe={observe} />;

      /* ── Atmosphere — floating UI fragment on product background ── */
      case "atmosphere":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--atmosphere cs-sr cs-sr--scale">
            <div className="cs-atmo-bg">
              {block.bgSrc ? (
                <img src={block.bgSrc} alt="" />
              ) : (
                <div className="cs-atmo-bg-gradient" style={{ background: block.bgGradient || "linear-gradient(135deg, #1a0a00 0%, #2d1200 30%, #ff6b2b 100%)" }} />
              )}
            </div>
            <div className="cs-atmo-content">
              {block.cardSrc ? (
                <div className="cs-atmo-card">
                  <img src={block.cardSrc} alt={block.cardAlt || ""} />
                </div>
              ) : block.cardItems ? (
                <div className="cs-atmo-card">
                  {block.cardTitle && <div className="cs-atmo-card-title">{block.cardTitle}</div>}
                  {block.cardItems.map((ci, i) => (
                    <div key={i} className={`cs-atmo-card-item${ci.active ? " active" : ""}`}>
                      <span className="cs-atmo-card-icon">{ci.icon || "●"}</span>
                      {ci.label}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="cs-atmo-text">
                {block.heading && <h2>{block.heading}</h2>}
                {block.body && block.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
            {block.caption && <div className="cs-cap" style={{ position: "relative", zIndex: 2, textAlign: "center", color: "rgba(255,255,255,.5)", marginTop: 16 }}>{block.caption}</div>}
          </div>
        );

      /* ── Collage — bento moodboard of screenshots on a dark canvas ── */
      case "collage":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--collage cs-sr cs-sr--scale">
            <div className="cs-collage-grid">
              {block.images?.map((img, i) => (
                <div
                  key={i}
                  className={`cs-collage-cell${img.brand ? " cs-collage-cell--brand" : ""}`}
                  style={{ gridColumn: `span ${img.w || 1}`, gridRow: `span ${img.h || 1}` }}
                >
                  {img.brand ? (
                    <div className="cs-collage-brand">
                      <span className="cs-collage-brand-name">{img.brand}</span>
                      {img.sub && <span className="cs-collage-brand-sub">{img.sub}</span>}
                    </div>
                  ) : (
                    <img src={img.src} alt={img.alt || ""} loading="lazy" />
                  )}
                </div>
              ))}
            </div>
            {block.caption && <div className="cs-cap cs-cap--light cs-cap--center">{block.caption}</div>}
          </div>
        );

      /* ── Catalogue — disciplined typographic index of the instruments ── */
      case "catalogue":
        return <CatalogueBlock key={key} block={block} observe={observe} />;

      /* ── Plate — one legible figure, optionally paired with prose (split) ── */
      case "plate": {
        const figure = (
          <div className={`cs-plate-figure${block.fade ? " cs-plate-figure--fade" : ""}`}>
            <img src={block.src} alt={block.alt || ""} loading="lazy" />
          </div>
        );
        if (block.heading || block.body) {
          return (
            <div key={key} ref={observe} className={`cs-block cs-block--plate-split${block.align === "right" ? " cs-block--plate-split-rev" : ""} cs-sr cs-sr--rise`}>
              <div className="cs-plate-text">
                {block.label && <div className="cs-split-subtitle">{block.label}</div>}
                {block.heading && <h2 className="cs-split-heading">{block.heading}</h2>}
                {block.body && <div className="cs-split-body">{block.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
              </div>
              <div>
                {figure}
                {block.caption && <div className="cs-cap">{block.caption}</div>}
              </div>
            </div>
          );
        }
        return (
          <div key={key} ref={observe} className="cs-block cs-block--plate cs-sr cs-sr--rise">
            {figure}
            {block.caption && <div className="cs-cap cs-cap--center">{block.caption}</div>}
          </div>
        );
      }

      /* ── Plates — a row of legible cropped figures (the moments) ── */
      case "plates":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--plates cs-sr cs-sr--stagger">
            <div className="cs-plates-row">
              {block.items?.map((it, i) => (
                <figure key={i} className="cs-plate-item">
                  <div className="cs-plate-figure"><img src={it.src} alt={it.alt || ""} loading="lazy" /></div>
                  <figcaption>
                    {it.label && <span className="cs-plate-eyebrow">{it.label}</span>}
                    {it.line && <span className="cs-plate-line">{it.line}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
            {block.caption && <div className="cs-cap cs-cap--center">{block.caption}</div>}
          </div>
        );

      /* ── Diptych — screenshot paired with an architecture image (or its slot) ── */
      case "diptych": {
        const scaleTag = block.scale ? block.scale.toUpperCase() : "";
        const shot = block.screenshot || {};
        const arch = block.arch || {};
        const cells = [
          <figure key="shot" className="cs-dip-cell">
            <div className="cs-plate-figure"><img src={shot.src} alt={shot.alt || ""} loading="lazy" /></div>
            {shot.cap && <figcaption>{shot.cap}</figcaption>}
          </figure>,
          <figure key="arch" className="cs-dip-cell">
            {arch.src ? (
              <div className="cs-plate-figure cs-plate-figure--dark"><img src={arch.src} alt={arch.alt || ""} loading="lazy" /></div>
            ) : (
              <div className="cs-arch-slot">
                <span className="cs-arch-slot-tag">Architecture · {scaleTag || "image"}</span>
                {arch.prompt && <span className="cs-arch-slot-prompt">{arch.prompt}</span>}
              </div>
            )}
            {arch.cap && <figcaption>{arch.cap}</figcaption>}
          </figure>,
        ];
        return (
          <div key={key} ref={observe} className="cs-block cs-block--diptych cs-sr cs-sr--rise">
            {(block.label || scaleTag) && (
              <div className="cs-dip-head">
                {block.label && <span className="cs-dip-label">{block.label}</span>}
                {scaleTag && <span className="cs-dip-scale">{scaleTag}</span>}
              </div>
            )}
            <div className="cs-dip-pair">{block.archFirst ? [cells[1], cells[0]] : cells}</div>
            {block.caption && <div className="cs-cap cs-cap--center">{block.caption}</div>}
          </div>
        );
      }

      /* ── Four-fold — the method's structure as a drawn diagram ── */
      case "fourfold":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--fourfold cs-sr cs-sr--rise">
            {block.label && <div className="cs-block--section-label">{block.label}</div>}
            {block.heading && <h2 className="cs-fourfold-heading">{block.heading}</h2>}
            <div className="cs-fourfold-row">
              {block.nodes?.map((n, i) => (
                <div key={i} className="cs-ff-node">
                  <span className="cs-ff-glyph">{n.glyph}</span>
                  <span className="cs-ff-name">{n.name}</span>
                  <span className="cs-ff-rule" />
                  <span className="cs-ff-to">{n.to}</span>
                </div>
              ))}
            </div>
            {block.body && <div className="cs-fourfold-body">{block.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Legacy Fig component for non-layout case studies ── */
  const Fig = ({ index }) => {
    const fig = figures[index];
    if (!fig) return null;
    return (
      <div ref={observe} className="cs-fig cs-sr cs-sr--rise">
        <div className="cs-full-img">
          {fig.src ? (
            <img src={fig.src} alt={fig.alt || `${item.title} figure ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: artVi(index) }} style={{ width: "100%", height: "100%" }} />
          )}
          <div className="cs-full-img-glow" />
        </div>
        {fig.caption && <div className="cs-fig-cap">{fig.caption}</div>}
      </div>
    );
  };

  return (
    <div ref={overlayRef} className={`cs-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>&larr; Back</button>
      <div className="cs-inner">
        <HiddenStrip item={item} />

        {/* ── Title + Meta — always first (immediate, no scroll-trigger) ── */}
        <div className="cs-header dc dc1">
          <h1 className="cs-title">{item.title}</h1>
          <p className="cs-subtitle">{item.subtitle}</p>
          <div className="cs-meta-row">
            {item.role && <div className="cs-meta-col"><span className="cs-meta-label">Role</span><span className="cs-meta-val">{item.role}</span></div>}
            <div className="cs-meta-col"><span className="cs-meta-label">Year</span><span className="cs-meta-val">{item.year}</span></div>
          </div>
        </div>

        {/* ── Editorial layout (block-based) or legacy layout ── */}
        {layout ? (
          <>
            {layout.map((block, idx) => renderBlock(block, idx))}
          </>
        ) : (
          <>
            {/* Legacy: Hero */}
            <div ref={observe} className="cs-block cs-block--hero cs-sr cs-sr--scale">
              <div className="cs-block-img">
                {imgs.hero ? (
                  <img src={imgs.hero} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width: "100%", height: "100%" }} />
                )}
              </div>
            </div>

            {item.videoUrl && (
              <div ref={observe} className="cs-sr cs-sr--scale">
                <VideoEmbed url={item.videoUrl} poster={item.videoPoster} />
              </div>
            )}

            {cs.framing && (
              <div ref={observe} className="cs-narrative cs-sr cs-sr--rise">
                <div className="cs-section-label">Framing</div>
                <div className="cs-body">
                  {cs.framing.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            )}

            <Fig index={0} />

            {cs.reframe && (
              <div ref={observe} className="cs-reframe cs-sr cs-sr--rise">
                <div className="cs-reframe-thesis">{cs.reframe.thesis}</div>
                {cs.reframe.body && (
                  <div className="cs-body cs-reframe-body">
                    {cs.reframe.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                )}
              </div>
            )}

            <Fig index={1} />

            {cs.intervention && (
              <div ref={observe} className="cs-narrative cs-sr cs-sr--stagger">
                <div className="cs-section-label">The Intervention</div>
                <div className="cs-intervention-grid">
                  {cs.intervention.system && (
                    <div className="cs-intv-card">
                      <div className="cs-intv-num">01</div>
                      <div className="cs-intv-h">System Design</div>
                      <div className="cs-intv-body">{cs.intervention.system.map((s, i) => <p key={i}>{s}</p>)}</div>
                    </div>
                  )}
                  {cs.intervention.expression && (
                    <div className="cs-intv-card">
                      <div className="cs-intv-num">02</div>
                      <div className="cs-intv-h">Expression</div>
                      <div className="cs-intv-body">{cs.intervention.expression.map((s, i) => <p key={i}>{s}</p>)}</div>
                    </div>
                  )}
                  {cs.intervention.governance && (
                    <div className="cs-intv-card">
                      <div className="cs-intv-num">03</div>
                      <div className="cs-intv-h">Governance</div>
                      <div className="cs-intv-body">{cs.intervention.governance.map((s, i) => <p key={i}>{s}</p>)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Fig index={2} />

            {cs.outcomes && (
              <>
                <div ref={observe} className="cs-narrative cs-sr cs-sr--rise">
                  <div className="cs-section-label">Outcomes</div>
                  {cs.outcomes.points?.length > 0 && (
                    <ul className="cs-points">
                      {cs.outcomes.points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  )}
                </div>
                {cs.outcomes.closing && (
                  <div ref={observe} className="cs-pullquote cs-sr cs-sr--rise">{cs.outcomes.closing}</div>
                )}
                {cs.outcomes.insight?.length > 0 && (
                  <div ref={observe} className="cs-insight cs-sr cs-sr--rise">
                    {cs.outcomes.insight.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Credits ── */}
        {cs.credits?.length > 0 && (
          <div ref={observe} className="cs-credits cs-sr cs-sr--rise">
            <div className="cs-section-label">Credits</div>
            <div className="cs-credits-grid">
              {cs.credits.map((c, i) => (
                <div key={i} className="cs-credit">
                  <div className="cs-credit-name">{c.name}</div>
                  <div className="cs-credit-role">{c.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <PatternChipsDetail itemTitle={item.title} active={lens} />
        <AlexanderChipsDetail itemTitle={item.title} active={patternLens} />

        {/* ── Deliverables + Tags ── */}
        <div ref={observe} className="cs-footer cs-sr cs-sr--rise">
          {item.deliverables?.length > 0 && (
            <div className="cs-deliv">
              <div className="cs-section-label">Deliverables</div>
              <div className="cs-deliv-list">
                {item.deliverables.map(d => <span key={d} className="prow-tag">{d}</span>)}
              </div>
            </div>
          )}
          <div className="cs-tags">
            {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
            {item.relations?.map(r => <span key={r} className="card-tg rel" style={{ cursor: "pointer" }}>&rarr; {r}</span>)}
          </div>
        </div>

      </div>
    </div>
  );
}
