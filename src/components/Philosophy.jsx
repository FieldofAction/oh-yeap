import React from "react";
import { SEED } from "../data/seed";

export default function Philosophy() {
  const rdItem = SEED.find(c => c.title === "Relational Design");
  const theory = rdItem?.theory;
  if (!theory) return null;

  return (
    <div className="ph en">
      {/* Header */}
      <div className="ph-header en d1">
        <div className="ph-pre">Canon</div>
        <h1 className="ph-h">Relational Design</h1>
        <p className="ph-sub">Field-Centered Framework</p>
      </div>

      {/* Canon — moved from Public.jsx */}
      <div className="ph-canon en d2">
        <p className="ph-canon-p">A practice of designing conditions &mdash; not outcomes. Orientation and shared language for work that holds complexity without collapsing it.</p>
        <div className="ph-canon-ax">
          <span className="ph-canon-al">Governing Principle</span>
          <p className="ph-canon-at">Embodied action precedes alignment. You do not act to become aligned. You act because alignment has already taken form.</p>
        </div>
        <div className="ph-canon-ax">
          <span className="ph-canon-al">System Invariant</span>
          <p className="ph-canon-at">Practice precedes documentation. Documentation never leads offerings. Silence is allowed.</p>
        </div>
        <div className="ph-canon-ax">
          <span className="ph-canon-al">Aliveness</span>
          <p className="ph-canon-at">The system demonstrates aliveness through responsiveness, not performance. State is visible. Change is legible. Stillness and motion are both evidence of attention.</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="ph-section en d3">
        <div className="ph-sl">Introduction</div>
        <p className="ph-intro">{theory.intro}</p>
      </div>

      {/* Abstract */}
      <div className="ph-abstract en d4">
        <div className="ph-sl">Abstract</div>
        <p className="ph-abstract-text">{theory.abstract}</p>
      </div>

      {/* Process Diagram */}
      <div className="ph-process en d5">
        <div className="ph-sl">Process</div>
        <div className="ph-process-ring">
          {theory.processDiagram.map((step, i) => (
            <div key={i} className="ph-process-step">
              <div className="ph-process-dot" />
              <div className="ph-process-name">{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Theory Sections */}
      {theory.sections.map((sec, i) => (
        <div key={i} className="ph-section en">
          <div className="ph-body-heading">{sec.heading}</div>
          {sec.body.split("\n\n").map((p, j) => (
            <p key={j} className="ph-body-text">{p}</p>
          ))}
          {sec.caption && <div className="ph-body-caption">{sec.caption}</div>}
        </div>
      ))}

      {/* Principles */}
      <div className="ph-principles en">
        <div className="ph-sl">Principles</div>
        <div className="ph-principles-grid">
          {theory.principles.map((p, i) => (
            <div key={i} className="ph-principle">
              <div className="ph-principle-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="ph-principle-title">{p.title}</div>
              <div className="ph-principle-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lineages */}
      <div className="ph-lineages en">
        <div className="ph-sl">Lineages</div>
        <div className="ph-lineages-grid">
          {theory.lineages.map((lin, i) => (
            <div key={i} className={`ph-lineage${lin.heading === "Convergence" ? " convergence" : ""}`}>
              <div className="ph-lineage-heading">{lin.heading}</div>
              <div className="ph-lineage-body">{lin.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Works Cited */}
      <div className="ph-works-cited en">
        <div className="ph-sl">Works Cited</div>
        <div className="ph-works-list">
          {theory.worksCited.map((ref, i) => (
            <div key={i} className="ph-work-item">{ref}</div>
          ))}
        </div>
      </div>

      {/* Colophon */}
      {theory.colophon && (
        <div className="ph-colophon en">
          <div className="ph-colophon-line">Written &amp; Researched by {theory.colophon.author}</div>
          <div className="ph-colophon-line">{theory.colophon.location}</div>
          <div className="ph-colophon-line">{theory.colophon.period}</div>
          {theory.colophon.contribution && <div className="ph-colophon-line" style={{ fontWeight:300, opacity:.6, marginTop:8, maxWidth:360, marginLeft:"auto", marginRight:"auto" }}>{theory.colophon.contribution}</div>}
          <div className="ph-colophon-org">{theory.colophon.org}</div>
        </div>
      )}
    </div>
  );
}
