import React, { useMemo, useCallback } from "react";
import { VIS } from "../../data/seed";
import { PatternChipsDetail, AlexanderChipsDetail } from "../PatternLens";
import VideoEmbed from "../VideoEmbed";

export default function CaseStudyDetail({ item, closing, onClose, fg, lens, patternLens }) {
  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg), [item.title, fg]);

  const cs = item.caseStudy;
  if (!cs) return null;
  const imgs = cs.images || {};
  const figures = imgs.figures || [];

  const Fig = ({ index }) => {
    const fig = figures[index];
    if (!fig) return null;
    return (
      <div className="cs-fig dc img-reveal" style={{animationDelay:`${0.2 + index * 0.08}s`}}>
        <div className="cs-full-img">
          {fig.src ? (
            <img src={fig.src} alt={fig.alt || `${item.title} figure ${index + 1}`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: artVi(index) }} style={{ width:"100%", height:"100%" }} />
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

        {/* ── Title + Meta ── */}
        <div className="cs-header dc dc1">
          <h1 className="cs-title">{item.title}</h1>
          <p className="cs-subtitle">{item.subtitle}</p>
          <div className="cs-meta-row">
            {item.role && <div className="cs-meta-col"><span className="cs-meta-label">Role</span><span className="cs-meta-val">{item.role}</span></div>}
            <div className="cs-meta-col"><span className="cs-meta-label">Year</span><span className="cs-meta-val">{item.year}</span></div>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="cs-hero dc dc2 img-reveal">
          {imgs.hero ? (
            <img src={imgs.hero} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width:"100%", height:"100%" }} />
          )}
          <div className="cs-hero-glow" />
        </div>

        {/* ── Optional Video ── */}
        {item.videoUrl && (
          <div className="dc dc3">
            <VideoEmbed url={item.videoUrl} poster={item.videoPoster} />
          </div>
        )}

        {/* ── 1. Framing ── */}
        {cs.framing && (
          <div className="cs-narrative dc dc3">
            <div className="cs-section-label">Framing</div>
            <div className="cs-body">
              {cs.framing.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        <Fig index={0} />

        {/* ── 2. Reframe — thesis moment ── */}
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

        {/* ── 3. Intervention — 3-part grid ── */}
        {cs.intervention && (
          <div className="cs-narrative dc dc5">
            <div className="cs-section-label">The Intervention</div>
            <div className="cs-intervention-grid">
              {cs.intervention.system && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">01</div>
                  <div className="cs-intv-h">System Design</div>
                  <div className="cs-intv-body">
                    {cs.intervention.system.map((s, i) => <p key={i}>{s}</p>)}
                  </div>
                </div>
              )}
              {cs.intervention.expression && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">02</div>
                  <div className="cs-intv-h">Expression</div>
                  <div className="cs-intv-body">
                    {cs.intervention.expression.map((s, i) => <p key={i}>{s}</p>)}
                  </div>
                </div>
              )}
              {cs.intervention.governance && (
                <div className="cs-intv-card">
                  <div className="cs-intv-num">03</div>
                  <div className="cs-intv-h">Governance</div>
                  <div className="cs-intv-body">
                    {cs.intervention.governance.map((s, i) => <p key={i}>{s}</p>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Fig index={2} />

        {/* ── 4. Outcomes — results + insight ── */}
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
            {item.relations?.map(r => <span key={r} className="card-tg rel" style={{cursor:"pointer"}}>&rarr; {r}</span>)}
          </div>
        </div>

      </div>
    </div>
  );
}
