import React from "react";

const TECH = [
  { h:"React 19", v:"Functional components, hooks, no class components" },
  { h:"Vite 7", v:"Dev server and production builds" },
  { h:"State Management", v:"Custom hook (useASUStore) backed by localStorage" },
  { h:"Routing", v:"State-based view switching, no URL routing" },
  { h:"Styling", v:"Single CSS file with custom properties for theming" },
  { h:"AI Integration", v:"Anthropic API (Claude) for synthesis generation" },
  { h:"Themes", v:"Two themes: Threshold (dark) and Light, switched at runtime" },
  { h:"Persistence", v:"Client-side localStorage. No database, no server" },
];

const FORMS = [
  { h:"Memo", v:"Numbered entry in an ongoing series. Builds an argument over time, theme by theme." },
  { h:"Field Note", v:"A singular observation from the work. Not part of a series; stands alone." },
  { h:"Exploration", v:"An active experiment. Open-ended; the form is unsettled by design." },
  { h:"Artifact", v:"A system reference — specs, models, frameworks. A standing form intended for reuse." },
];

const PRINCIPLES = [
  "Two typefaces only: Inter for display and body, Space Mono for code.",
  "CSS custom properties drive theming. Every color is a variable.",
  "Entrance animations with staggered delays create rhythm on load.",
  "Responsive breakpoints at 480px, 600px, 768px, and 900px.",
  "No framework, no utility classes. Hand-written CSS for every component.",
  "Maximum restraint: whitespace, subtle transitions, minimal ornamentation.",
];

const SWATCHES = [
  { label:"BG", varName:"--bg" },
  { label:"FG", varName:"--fg" },
  { label:"FM", varName:"--fm" },
  { label:"FF", varName:"--ff" },
  { label:"BD", varName:"--bd" },
  { label:"SF", varName:"--sf" },
  { label:"AC1", varName:"--ac1" },
  { label:"AC2", varName:"--ac2" },
];

export default function Colophon() {
  return (
    <div className="co en">
      <div className="co-header en d1">
        <div className="co-pre">Site</div>
        <h2 className="co-h">Colophon</h2>
        <p className="co-sub">Field of Action is the professional research notebook and digital garden of Alfred (Daniel) Dickson II. A space for individual exploration of systems thinking and Relational Design.</p>
        <p className="co-sub">How this was built. The tools, principles, and decisions behind the surface.</p>
      </div>

      <div className="co-section en d2">
        <div className="co-sl">Forms</div>
        <div className="co-grid">
          {FORMS.map(t => (
            <div key={t.h} className="co-item">
              <div className="co-item-h">{t.h}</div>
              <div className="co-item-v">{t.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="co-section en d2">
        <div className="co-sl">Technology</div>
        <div className="co-grid">
          {TECH.map(t => (
            <div key={t.h} className="co-item">
              <div className="co-item-h">{t.h}</div>
              <div className="co-item-v">{t.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="co-section en d3">
        <div className="co-sl">Design Rules</div>
        {PRINCIPLES.map((p, i) => (
          <p key={i} className="co-item-v" style={{ marginBottom:8, paddingLeft:12, borderLeft:"1px solid var(--bd)" }}>{p}</p>
        ))}
      </div>

      <div className="co-section en d4">
        <div className="co-sl">Typography + Color</div>
        <div className="co-type-spec">
          <div className="co-type-row">
            <div className="co-type-sample">Inter</div>
            <div className="co-type-label">Display + Body &middot; Titles, headings, body text, UI &middot; 300/400/500/600/700 weights</div>
          </div>
          <div className="co-type-row">
            <div className="co-type-sample sans">Space Mono</div>
            <div className="co-type-label">Monospace &middot; Code, metadata, system text &middot; 400/700 weights</div>
          </div>
        </div>
        <div className="co-sl" style={{ marginTop:24 }}>Active Palette</div>
        <div className="co-swatch-row">
          {SWATCHES.map(s => (
            <div key={s.label} className="co-swatch">
              <div className="co-swatch-dot" style={{ background:`var(${s.varName})` }} />
              <div className="co-swatch-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="co-section en d5">
        <div className="co-sl">Credits</div>
        <div className="co-credits">
          <strong>Alfred Daniel Dickson II</strong><br/>
          Field of Action<br/>
          Los Angeles, CA<br/>
          2024&ndash;2026
        </div>
      </div>
    </div>
  );
}
