import React, { useMemo, useCallback } from "react";
import { VIS } from "../../data/seed";
import { PatternChipsDetail, AlexanderChipsDetail } from "../PatternLens";
import VideoEmbed from "../VideoEmbed";

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

  const cs = item.caseStudy;
  if (!cs) return null;
  const imgs = cs.images || {};
  const figures = imgs.figures || [];
  const layout = cs.layout;

  /* ── Editorial block renderer ── */
  const renderBlock = (block, idx) => {
    const key = `block-${idx}`;
    const delay = { animationDelay: `${0.12 + idx * 0.06}s` };

    switch (block.type) {
      /* ── Hero image — full bleed ── */
      case "hero":
        return (
          <div key={key} className="cs-block cs-block--hero dc img-reveal" style={delay}>
            <div className="cs-block-img">
              <BlockImg src={block.src} alt={block.alt || item.title} fg={fg} artVi={artVi} index={idx} />
            </div>
            {block.caption && <div className="cs-cap">{block.caption}</div>}
          </div>
        );

      /* ── Figure — single full-width ── */
      case "figure":
        return (
          <div key={key} className="cs-block cs-block--figure dc img-reveal" style={delay}>
            <div className="cs-block-img">
              <BlockImg src={block.src} alt={block.alt} fg={fg} artVi={artVi} index={idx} />
            </div>
            {block.caption && <div className="cs-cap">{block.caption}</div>}
          </div>
        );

      /* ── Two-up — side by side ── */
      case "two-up":
        return (
          <div key={key} className="cs-block cs-block--two-up dc img-reveal" style={delay}>
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
          <div key={key} className="cs-block cs-block--three-up dc img-reveal" style={delay}>
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
          <div key={key} className={`cs-block cs-block--inline${block.align === "right" ? " cs-block--inline-right" : ""} dc`} style={delay}>
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
          <div key={key} className="cs-block cs-block--section dc" style={delay}>
            <div className="cs-block--section-label">{block.label}</div>
            <div className="cs-block--section-rule" />
          </div>
        );

      /* ── Body text — pulls from cs data by key ── */
      case "body": {
        let text = block.text;
        if (!text && block.key) {
          // Pull from structured data
          if (block.key === "framing") text = cs.framing;
          else if (block.key === "outcomes" && cs.outcomes?.points) {
            return (
              <div key={key} className="cs-block cs-block--body cs-narrative dc" style={delay}>
                <ul className="cs-points">
                  {cs.outcomes.points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            );
          }
        }
        if (!text) return null;
        return (
          <div key={key} className="cs-block cs-block--body dc" style={delay}>
            <div className="cs-body">
              {text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        );
      }

      /* ── Pull quote — text as image ── */
      case "pull-quote":
        return (
          <div key={key} className="cs-block cs-block--pull-quote dc" style={delay}>
            <div className="cs-block--pull-quote-rule" />
            <div className="cs-block--pull-quote-text">{block.text}</div>
            {block.attr && <div className="cs-block--pull-quote-attr">{block.attr}</div>}
          </div>
        );

      /* ── Reframe — thesis + body ── */
      case "reframe":
        if (!cs.reframe) return null;
        return (
          <div key={key} className="cs-reframe dc" style={delay}>
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
          <div key={key} className="cs-block cs-narrative dc" style={delay}>
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
          <div key={key} className="cs-insight dc" style={delay}>
            {cs.outcomes.insight.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        );

      /* ── Video ── */
      case "video":
        return (
          <div key={key} className="cs-block dc" style={delay}>
            <VideoEmbed url={block.url || item.videoUrl} poster={block.poster || item.videoPoster} />
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
      <div className="cs-fig dc img-reveal" style={{ animationDelay: `${0.2 + index * 0.08}s` }}>
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
    <div className={`cs-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>&larr; Back</button>
      <div className="cs-inner">

        {/* ── Title + Meta — always first ── */}
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
            <div className="cs-block cs-block--hero dc dc2 img-reveal">
              <div className="cs-block-img">
                {imgs.hero ? (
                  <img src={imgs.hero} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width: "100%", height: "100%" }} />
                )}
              </div>
            </div>

            {item.videoUrl && (
              <div className="dc dc3">
                <VideoEmbed url={item.videoUrl} poster={item.videoPoster} />
              </div>
            )}

            {cs.framing && (
              <div className="cs-narrative dc dc3">
                <div className="cs-section-label">Framing</div>
                <div className="cs-body">
                  {cs.framing.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            )}

            <Fig index={0} />

            {cs.reframe && (
              <div className="cs-reframe dc dc4">
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
              <div className="cs-narrative dc dc5">
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
                <div className="cs-narrative dc dc6">
                  <div className="cs-section-label">Outcomes</div>
                  {cs.outcomes.points?.length > 0 && (
                    <ul className="cs-points">
                      {cs.outcomes.points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  )}
                </div>
                {cs.outcomes.closing && (
                  <div className="cs-pullquote dc dc7">{cs.outcomes.closing}</div>
                )}
                {cs.outcomes.insight?.length > 0 && (
                  <div className="cs-insight dc dc8">
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
        <div className="cs-footer dc dc8">
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
