import React, { useCallback } from "react";
import { VIS } from "../../data/seed";

/* Relational Design icon — official mark (Illustrator 29.5.1 export) */
function RDIcon({ color = "currentColor", size = 36 }) {
  return (
    <svg viewBox="0 0 96 101" width={size} height={size} fill="none" stroke={color} strokeMiterlimit="10">
      <rect x="17.29" y="22.15" width="61.42" height="61.42" rx="5.67" ry="5.67" />
      <rect x="8.89" y="10.89" width="78.21" height="78.21" rx="7.2" ry="7.2" />
      <rect x="32.72" y="46.99" width="30.71" height="30.71" rx="2.83" ry="2.83" />
    </svg>
  );
}

export default function TheoryDetail({ item, allItems, closing, onClose, onOpen, onRelation, fg }) {
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i) % VIS.length](fg), [item.title, fg]);
  const theory = item.theory;

  return (
    <div className={`th-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>← Back</button>
      <div className="th-inner">
        {/* Title block with icon */}
        <div className="th-head">
          <div className="th-icon">
            <RDIcon color={fg} size={36} />
          </div>
          <div className="th-badge">Theory</div>
          <h1 className="th-title">Theory of {item.title}</h1>
          <div className="th-subtitle">{item.subtitle}</div>
          <div className="th-colophon">
            {theory.colophon && (
              <>
                <span>Written and Researched by {theory.colophon.author}</span>
                <span className="th-colophon-sep" />
                <span>Contained by {theory.colophon.org}</span>
                <span className="th-colophon-sep" />
                <span>Developed in {theory.colophon.location} · {theory.colophon.period}</span>
              </>
            )}
          </div>
        </div>

        {/* Intro — page 1 framing */}
        {theory.intro && (
          <div className="th-intro">
            <p>{theory.intro}</p>
          </div>
        )}

        {/* Process diagram */}
        {theory.processDiagram?.length > 0 && (
          <div className="th-process">
            <div className="th-section-label">Relational Design Process Diagram</div>
            <div className="th-process-ring">
              {theory.processDiagram.map((step, i) => (
                <div key={i} className="th-process-step">
                  <div className="th-process-dot" />
                  <div className="th-process-name">{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abstract */}
        {theory.abstract && (
          <div className="th-abstract">
            <div className="th-section-header">
              <div className="th-section-label">Abstract</div>
              <div className="th-section-page">3</div>
            </div>
            <p className="th-abstract-text">{theory.abstract}</p>
          </div>
        )}

        {/* Hero visual */}
        <div className="th-hero-visual">
          <div dangerouslySetInnerHTML={{ __html: artVi(0) }} style={{ width: "100%", height: "100%" }} />
          <div className="th-hero-glow" />
        </div>

        {/* Body sections with page-style headers */}
        {theory.sections?.map((section, i) => (
          <div key={i} className="th-body-section">
            <div className="th-body-heading">{section.heading}</div>
            <div className="th-body-text">
              {section.body.split("\n\n").map((para, j) => <p key={j}>{para}</p>)}
            </div>
            {/* Interstitial visual between sections */}
            {i < theory.sections.length - 1 && i !== 3 && (
              <div className="th-interstitial">
                <div dangerouslySetInnerHTML={{ __html: artVi(i + 1) }} style={{ width: "100%", height: "100%" }} />
                <div className="th-hero-glow" />
              </div>
            )}
            {section.caption && <div className="th-body-caption">{section.caption}</div>}
          </div>
        ))}

        {/* Principles */}
        {theory.principles?.length > 0 && (
          <div className="th-principles">
            <div className="th-body-heading">Principles of Relational Design</div>
            <div className="th-principles-grid">
              {theory.principles.map((p, i) => (
                <div key={i} className="th-principle">
                  <div className="th-principle-num">{String(i + 1).padStart(2, "0")}</div>
                  <div className="th-principle-title">{p.title}</div>
                  <div className="th-principle-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lineages — structured per PDF page 11 */}
        {theory.lineages?.length > 0 && (
          <div className="th-lineages">
            <div className="th-body-heading">Lineages of Relational Design</div>
            <div className="th-lineages-grid">
              {theory.lineages.map((l, i) => (
                <div key={i} className={`th-lineage-item${l.heading === "Convergence" ? " convergence" : ""}`}>
                  <div className="th-lineage-heading">{l.heading}</div>
                  <div className="th-lineage-body">{l.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Works Cited */}
        {theory.worksCited?.length > 0 && (
          <div className="th-works-cited">
            <div className="th-section-header">
              <div className="th-section-label">Works Cited</div>
              <div className="th-section-page">12</div>
            </div>
            <div className="th-works-list">
              {theory.worksCited.map((w, i) => (
                <div key={i} className="th-work-item">{w}</div>
              ))}
            </div>
          </div>
        )}

        {/* Tags + Relations */}
        <div className="rd-tags">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => (
            <span key={r} className="card-tg rel" onClick={() => { onClose(); setTimeout(() => onRelation(r), 350) }} style={{ cursor: "pointer" }}>→ {r}</span>
          ))}
        </div>

        {/* Connected Work */}
        {(() => {
          const related = allItems.filter(c => {
            if (c.id === item.id || c.status === "draft") return false;
            if (item.relations?.some(r => c.title === r || c.relations?.includes(r))) return true;
            if (item.tags?.some(t => c.tags?.includes(t))) return true;
            return false;
          }).slice(0, 6);
          if (related.length === 0) return null;
          return (
            <div className="rd-related">
              <div className="rd-related-h">Connected Work</div>
              {related.map(r => (
                <div key={r.id} className="rd-related-item" onClick={() => { if (r.body || r.caseStudy || r.sketch || r.spec || r.theory) { onOpen(r); window.scrollTo(0, 0) } else { onClose(); setTimeout(() => onRelation(r.title), 350) } }}>
                  <div>
                    <div className="rd-related-title">{r.title}</div>
                    <div className="rd-related-sub">{r.subtitle || r.section} · {r.year}</div>
                  </div>
                  <span style={{ color: "var(--ff)", fontSize: 16 }}>→</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Colophon footer */}
        <div className="th-footer">
          <div className="th-footer-icon">
            <RDIcon color={fg} size={28} />
          </div>
          <div className="th-footer-line">Relational Design</div>
          <div className="th-footer-line">Written & Researched by {theory.colophon?.author}</div>
          <div className="th-footer-line">{theory.colophon?.location}</div>
          <div className="th-footer-line">{theory.colophon?.period}</div>
          {theory.colophon?.contribution && (
            <div className="th-footer-contrib">{theory.colophon.contribution}</div>
          )}
          <div className="th-footer-org">{theory.colophon?.org}</div>
        </div>
      </div>
    </div>
  );
}
