import React, { useMemo, useCallback } from "react";
import { VIS } from "../../data/seed";

export default function CaseStudyDetail({ item, closing, onClose, fg }) {
  const heroVi = useMemo(() => VIS[Math.abs(item.title.charCodeAt(0)) % VIS.length](fg), [item.title, fg]);
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i + 1) % VIS.length](fg), [item.title, fg]);

  const cs = item.caseStudy;
  if (!cs) return null;

  return (
    <div className={`cs-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>&larr; Back</button>
      <div className="cs-inner">

        {/* Hero */}
        <div className="cs-hero">
          <div dangerouslySetInnerHTML={{ __html: heroVi }} style={{ width:"100%", height:"100%" }} />
          <div className="cs-hero-glow" />
        </div>

        {/* Title block */}
        <h1 className="cs-title">{item.title}</h1>
        <p className="cs-subtitle">{item.subtitle}</p>

        {/* Meta row */}
        <div className="cs-meta-row">
          {item.role && <div className="cs-meta-col"><span className="cs-meta-label">Role</span><span className="cs-meta-val">{item.role}</span></div>}
          <div className="cs-meta-col"><span className="cs-meta-label">Year</span><span className="cs-meta-val">{item.year}</span></div>
          <div className="cs-meta-col"><span className="cs-meta-label">Status</span><span className="cs-meta-val" style={{textTransform:"capitalize"}}>{item.status}</span></div>
        </div>

        {/* Executive Snapshot */}
        {cs.snapshot && (
          <div className="cs-snapshot">
            <div className="cs-section-label">Executive Snapshot</div>
            <div className="cs-snapshot-grid">
              <div className="cs-snap-item"><span className="cs-snap-key">Context</span><span className="cs-snap-val">{cs.snapshot.context}</span></div>
              <div className="cs-snap-item"><span className="cs-snap-key">Challenge</span><span className="cs-snap-val">{cs.snapshot.challenge}</span></div>
              <div className="cs-snap-item"><span className="cs-snap-key">Risk</span><span className="cs-snap-val">{cs.snapshot.risk}</span></div>
              {cs.snapshot.shift && <div className="cs-snap-item"><span className="cs-snap-key">Strategic Shift</span><span className="cs-snap-val">{cs.snapshot.shift[0]} &rarr; {cs.snapshot.shift[1]}</span></div>}
              <div className="cs-snap-item"><span className="cs-snap-key">Impact</span><span className="cs-snap-val">{cs.snapshot.impact}</span></div>
            </div>
          </div>
        )}

        {/* Placeholder visual */}
        <div className="cs-full-img">
          <div dangerouslySetInnerHTML={{ __html: artVi(1) }} style={{ width:"100%", height:"100%" }} />
          <div className="cs-full-img-glow" />
          <div className="cs-full-img-label">Figure 1</div>
        </div>

        {/* Institutional Context */}
        {cs.context && (
          <div className="cs-narrative">
            <div className="cs-section-label">Institutional Context</div>
            <div className="cs-body">
              {cs.context.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        {/* The Challenge */}
        {cs.challenge && (
          <div className="cs-narrative">
            <div className="cs-section-label">The Challenge</div>
            <div className="cs-body">
              <p>{cs.challenge.body}</p>
            </div>
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
            {cs.challenge.closing && <p className="cs-pull">{cs.challenge.closing}</p>}
          </div>
        )}

        {/* Placeholder visual */}
        <div className="cs-full-img">
          <div dangerouslySetInnerHTML={{ __html: artVi(2) }} style={{ width:"100%", height:"100%" }} />
          <div className="cs-full-img-glow" />
          <div className="cs-full-img-label">Figure 2</div>
        </div>

        {/* Strategic Reframe */}
        {cs.reframe && (
          <div className="cs-narrative">
            <div className="cs-section-label">Strategic Reframe</div>
            <div className="cs-reframe-arrow">
              <span className="cs-reframe-from">{cs.reframe[0]}</span>
              <span className="cs-reframe-down">&darr;</span>
              <span className="cs-reframe-to">{cs.reframe[1]}</span>
            </div>
            {cs.reframeBody && (
              <div className="cs-body">
                {cs.reframeBody.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        )}

        {/* The Intervention */}
        {cs.intervention && (
          <div className="cs-narrative">
            <div className="cs-section-label">The Intervention</div>
            <div className="cs-intervention-grid">
              {cs.intervention.system && (
                <div className="cs-intv-col">
                  <div className="cs-intv-h">System Design</div>
                  <ul className="cs-points">{cs.intervention.system.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {cs.intervention.expression && (
                <div className="cs-intv-col">
                  <div className="cs-intv-h">Expression</div>
                  <ul className="cs-points">{cs.intervention.expression.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {cs.intervention.governance && (
                <div className="cs-intv-col">
                  <div className="cs-intv-h">Governance</div>
                  <ul className="cs-points">{cs.intervention.governance.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder visual */}
        <div className="cs-full-img">
          <div dangerouslySetInnerHTML={{ __html: artVi(3) }} style={{ width:"100%", height:"100%" }} />
          <div className="cs-full-img-glow" />
          <div className="cs-full-img-label">Figure 3</div>
        </div>

        {/* The Results */}
        {cs.results && (
          <div className="cs-narrative">
            <div className="cs-section-label">The Results</div>
            {cs.results.points?.length > 0 && (
              <ul className="cs-points">
                {cs.results.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
            {cs.results.closing && <p className="cs-pull">{cs.results.closing}</p>}
          </div>
        )}

        {/* Field Insight */}
        {cs.insight && (
          <div className="cs-insight">
            <div className="cs-section-label">Field Insight</div>
            <div className="cs-insight-lines">
              {cs.insight.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        )}

        {/* Deliverables */}
        {item.deliverables?.length > 0 && (
          <div className="cs-deliv">
            <div className="cs-section-label">Deliverables</div>
            <div className="cs-deliv-list">
              {item.deliverables.map(d => <span key={d} className="prow-tag">{d}</span>)}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="cs-tags">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel" style={{cursor:"pointer"}}>&rarr; {r}</span>)}
        </div>
      </div>
    </div>
  );
}
