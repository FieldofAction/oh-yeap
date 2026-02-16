import React, { useCallback } from "react";
import { VIS } from "../../data/seed";

export default function TheoryDetail({ item, allItems, closing, onClose, onOpen, onRelation, fg }) {
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i) % VIS.length](fg), [item.title, fg]);
  const theory = item.theory;

  return (
    <div className={`th-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>← Back</button>
      <div className="th-inner">
        {/* Title block */}
        <div className="th-head">
          <div className="th-badge">Theory</div>
          <h1 className="th-title">{item.title}</h1>
          <div className="th-subtitle">{item.subtitle}</div>
          <div className="th-colophon">
            {theory.colophon && (
              <>
                <span>Written and Researched by {theory.colophon.author}</span>
                <span className="th-colophon-sep" />
                <span>Contained by {theory.colophon.org}</span>
                <span className="th-colophon-sep" />
                <span>{theory.colophon.location} · {theory.colophon.period}</span>
              </>
            )}
          </div>
        </div>

        {/* Abstract */}
        {theory.abstract && (
          <div className="th-abstract">
            <div className="th-section-label">Abstract</div>
            <p className="th-abstract-text">{theory.abstract}</p>
          </div>
        )}

        {/* Process diagram */}
        {theory.processDiagram?.length > 0 && (
          <div className="th-process">
            <div className="th-section-label">Process</div>
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

        {/* Hero visual */}
        <div className="th-hero-visual">
          <div dangerouslySetInnerHTML={{ __html: artVi(0) }} style={{ width: "100%", height: "100%" }} />
          <div className="th-hero-glow" />
        </div>

        {/* Body sections */}
        {theory.sections?.map((section, i) => (
          <div key={i} className="th-body-section">
            <div className="th-body-heading">{section.heading}</div>
            <div className="th-body-text">
              {section.body.split("\n\n").map((para, j) => <p key={j}>{para}</p>)}
            </div>
            {section.caption && <div className="th-body-caption">{section.caption}</div>}
            {/* Interstitial visual between sections */}
            {i < theory.sections.length - 1 && (
              <div className="th-interstitial">
                <div dangerouslySetInnerHTML={{ __html: artVi(i + 1) }} style={{ width: "100%", height: "100%" }} />
                <div className="th-hero-glow" />
              </div>
            )}
          </div>
        ))}

        {/* Principles */}
        {theory.principles?.length > 0 && (
          <div className="th-principles">
            <div className="th-section-label">Principles of Relational Design</div>
            <div className="th-principles-grid">
              {theory.principles.map((p, i) => (
                <div key={i} className="th-principle">
                  <div className="th-principle-title">{p.title}</div>
                  <div className="th-principle-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lineages */}
        {theory.lineages && (
          <div className="th-lineages">
            <div className="th-section-label">Lineages of Relational Design</div>
            <div className="th-lineages-text">
              {theory.lineages.split("\n\n").map((para, j) => <p key={j}>{para}</p>)}
            </div>
          </div>
        )}

        {/* Works Cited */}
        {theory.worksCited?.length > 0 && (
          <div className="th-works-cited">
            <div className="th-section-label">Works Cited</div>
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
          <div className="th-footer-line">Relational Design</div>
          <div className="th-footer-line">Written & Researched by {theory.colophon?.author}</div>
          <div className="th-footer-line">{theory.colophon?.location}</div>
          <div className="th-footer-line">{theory.colophon?.period}</div>
          <div className="th-footer-org">{theory.colophon?.org}</div>
        </div>
      </div>
    </div>
  );
}
