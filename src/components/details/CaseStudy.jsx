import React, { useMemo, useCallback } from "react";
import { VIS } from "../../data/seed";

export default function CaseStudyDetail({ item, closing, onClose, fg }) {
  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg), [item.title, fg]);

  const cs = item.caseStudy;
  if (!cs) return null;

  const Img = ({ idx, caption }) => (
    <div className="cs-fig">
      <div className="cs-full-img">
        <div dangerouslySetInnerHTML={{ __html: artVi(idx) }} style={{ width:"100%", height:"100%" }} />
        <div className="cs-full-img-glow" />
      </div>
      {caption && <div className="cs-fig-cap">{caption}</div>}
    </div>
  );

  return (
    <div className={`cs-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>&larr; Back</button>
      <div className="cs-inner">

        {/* ── Title + Meta ── */}
        <div className="cs-header">
          <h1 className="cs-title">{item.title}</h1>
          <p className="cs-subtitle">{item.subtitle}</p>
          <div className="cs-meta-row">
            {item.role && <div className="cs-meta-col"><span className="cs-meta-label">Role</span><span className="cs-meta-val">{item.role}</span></div>}
            <div className="cs-meta-col"><span className="cs-meta-label">Year</span><span className="cs-meta-val">{item.year}</span></div>
            {cs.snapshot && <div className="cs-meta-col"><span className="cs-meta-label">Context</span><span className="cs-meta-val">{cs.snapshot.context}</span></div>}
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="cs-hero">
          <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width:"100%", height:"100%" }} />
          <div className="cs-hero-glow" />
        </div>

        {/* ── Institutional Context ── */}
        {cs.context && (
          <div className="cs-narrative">
            <div className="cs-section-label">Institutional Context</div>
            <div className="cs-body">
              {cs.context.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        <Img idx={1} />

        {/* ── The Challenge ── */}
        {cs.challenge && (
          <div className="cs-narrative">
            <div className="cs-section-label">The Challenge</div>
            <div className="cs-body"><p>{cs.challenge.body}</p></div>
            {cs.challenge.points?.length > 0 && (
              <ul className="cs-points">
                {cs.challenge.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
            {cs.challenge.risks?.length > 0 && (
              <div className="cs-risk-block">
                <span className="cs-risk-label">Risk if unresolved</span>
                <ul className="cs-points">
                  {cs.challenge.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Challenge closing as big pull quote ── */}
        {cs.challenge?.closing && (
          <div className="cs-pullquote">{cs.challenge.closing}</div>
        )}

        <Img idx={2} />

        {/* ── Strategic Reframe — the centerpiece ── */}
        {cs.reframe && (
          <div className="cs-reframe">
            <div className="cs-section-label">Strategic Reframe</div>
            <div className="cs-reframe-vis">
              <span className="cs-reframe-from">{cs.reframe[0]}</span>
              <span className="cs-reframe-arrow">&darr;</span>
              <span className="cs-reframe-to">{cs.reframe[1]}</span>
            </div>
            {cs.reframeBody && (
              <div className="cs-body cs-reframe-body">
                {cs.reframeBody.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        )}

        <Img idx={3} />

        {/* ── The Intervention ── */}
        {cs.intervention && (
          <div className="cs-narrative">
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

        <Img idx={4} />

        {/* ── The Results ── */}
        {cs.results && (
          <div className="cs-narrative">
            <div className="cs-section-label">The Results</div>
            {cs.results.points?.length > 0 && (
              <ul className="cs-points">
                {cs.results.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* ── Results closing as big pull quote ── */}
        {cs.results?.closing && (
          <div className="cs-pullquote">{cs.results.closing}</div>
        )}

        <Img idx={5} />

        {/* ── Field Insight — closing moment ── */}
        {cs.insight && (
          <div className="cs-insight">
            {cs.insight.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        )}

        {/* ── Deliverables + Tags ── */}
        <div className="cs-footer">
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
