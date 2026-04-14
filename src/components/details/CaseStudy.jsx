import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { VIS } from "../../data/seed";
import { PatternChipsDetail, AlexanderChipsDetail } from "../PatternLens";
import VideoEmbed from "../VideoEmbed";

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

export default function CaseStudyDetail({ item, closing, onClose, fg, lens, patternLens }) {
  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg), [item.title, fg]);

  const overlayRef = useRef(null);
  const observe = useScrollReveal(overlayRef);

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
              {text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
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
          <div key={key} ref={observe} className="cs-block cs-narrative cs-sr cs-sr--stagger">
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
            <div className="cs-split-image">
              {block.src ? (
                <img src={block.src} alt={block.alt || ""} />
              ) : (
                <div className="cs-split-gradient" />
              )}
            </div>
          </div>
        );

      /* ── Device — screenshot in CSS monitor mockup ── */
      case "device":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--device cs-sr cs-sr--scale">
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

      /* ── Triptych — tall poster-style cards ── */
      case "triptych":
        return (
          <div key={key} ref={observe} className="cs-block cs-block--triptych cs-sr cs-sr--stagger">
            {block.images?.map((img, i) => (
              <div key={i} className="cs-triptych-card" style={img.bg ? { background: img.bg } : {}}>
                {img.src && <img src={img.src} alt={img.alt || ""} />}
                <div className="cs-triptych-overlay" />
                {img.label && <div className="cs-triptych-label">{img.label}</div>}
                {img.title && <div className="cs-triptych-title">{img.title}</div>}
              </div>
            ))}
            {block.caption && <div className="cs-cap">{block.caption}</div>}
          </div>
        );

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
