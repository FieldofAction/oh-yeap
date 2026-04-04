import React, { useRef, useState, useEffect, useCallback } from "react";
import { SEED } from "../data/seed";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "philosophy", label: "Philosophy" },
  { id: "principles", label: "Principles" },
  { id: "lineages", label: "Lineages" },
  { id: "works-cited", label: "Works Cited" },
];

/* ── X-Ray diagnostic data mapped to theory sections ── */
const XRAY_DATA = {
  overview: [
    { type: "signal", title: "Core conviction is generative", body: "The central idea, design conditions not outcomes, has produced real work, organized real thinking, and attracted collaborators organically.", tell: null },
    { type: "shadow", title: "Can become theology if untested", body: "A framework that cannot acknowledge its failure modes is not a framework. It is a theology.", tell: "The theory feels complete and self-reinforcing. When was it last challenged by someone who doesn't share the worldview?" },
  ],
  philosophy: {
    "Form to Field": [
      { type: "signal", title: "Real paradigm shift", body: "Moving from fixed form to dynamic field conditions represents a genuine epistemic contribution.", tell: null },
      { type: "inflation", title: "Scale effects thin the model", body: "Field-centered design was developed at the scale of human attention. The framework thins when the field exceeds what one designer's awareness can hold.", tell: "Things worked at 6 people and broke at 60." },
    ],
    "Enter Relational Intelligence": [
      { type: "signal", title: "Genuine epistemic contribution", body: "Intelligence as emergent within relationships rather than residing in entities. This reframe has real explanatory power.", tell: null },
      { type: "inflation", title: "Power asymmetry not modeled", body: "The relational frame models the field as though participants have equivalent agency. Almost no field operates this way.", tell: "Conditions set, no movement. Ask who doesn't feel permission to enter the field." },
      { type: "shadow", title: "Hidden control through conditions", body: "The designer 'creates conditions' but conditions can be manipulated. Invisible authorship dressed as openness.", tell: "You are surprised when the field produces something you didn't want. That surprise is data." },
    ],
    "Aesthetics as Condition": [
      { type: "signal", title: "Beauty as resonance works", body: "Redefining aesthetics as field coherence rather than surface form is productive and actionable.", tell: null },
      { type: "shadow", title: "Moral aestheticization", body: "The tendency to prefer the framework's elegance over the messiness of the actual situation. When the approach becomes more important than the outcome.", tell: "The work looks right but is not producing results." },
    ],
    "Human-Centered to Field-Centered Design": [
      { type: "signal", title: "Opens design beyond the individual", body: "Distributing subjectivity across human, non-human, and environmental participants reflects how systems actually work.", tell: null },
      { type: "inflation", title: "Hidden incentives unaccounted", body: "People are also optimizing for career, relationships, fear of exposure. The relational frame cannot see these variables.", tell: "Coherent conditions, incoherent behavior. People are playing a different game." },
      { type: "shadow", title: "Infinite deferral", body: "The deepest shadow: using 'the conditions are not ready' as a permanent holding pattern. Infinite justification for waiting.", tell: "You have been in preparation longer than the preparation could possibly require." },
    ],
    "Relational Turn": [
      { type: "signal", title: "Living system orientation", body: "Pattern, rhythm, and resonance replacing static form as primary units of meaning aligns with contemporary thought across disciplines.", tell: null },
      { type: "inflation", title: "Adversarial conditions not modeled", body: "The framework welcomes productive friction but has less purchase on pure adversarial intent. Somewhat naive in the presence of bad actors.", tell: "You keep designing better conditions and they keep getting undermined." },
      { type: "shadow", title: "Fragility to speed", body: "In contexts that demand speed, a decision that has to happen today, the framework can become paralytic.", tell: "The speed of the situation is exceeding the speed of the framework." },
    ],
    "Toward Transrelational Intelligence": [
      { type: "signal", title: "Forward-facing vision", body: "Agency operating across boundaries through collective fields of emotion, information, and energy. Compelling direction.", tell: null },
      { type: "inflation", title: "Scale + adversarial gaps compound", body: "As systems scale toward transrelational intelligence, both scale effects and adversarial conditions intensify.", tell: null },
    ],
  },
  principles: [
    { type: "signal", title: "Each principle carries signal", body: "The 8 principles form a coherent, actionable framework. They are concrete and can be applied.", tell: null },
    { type: "shadow", title: "Each has a shadow cost", body: "Patience becomes deferral. Openness becomes hidden control. Attunement becomes fragility. The cost is the price of the thing itself.", tell: "The shadow of any strength is simply that strength, deployed past the point where it is still a strength." },
  ],
};

/* ── Section diagrams ── */
const SECTION_DIAGRAMS = {
  "Form to Field": { src: "/images/theory/canon-form-to-field.png", caption: "Design\u2019s movement from fixed form toward dynamic field conditions." },
  "Enter Relational Intelligence": { src: "/images/theory/canon-relational-intelligence.png", caption: "Creativity, and awareness emerge in the spaces between elements rather than the elements themselves." },
  "Aesthetics as Condition": { src: "/images/theory/canon-aesthetics.png", caption: null },
  "Human-Centered to Field-Centered Design": { src: "/images/theory/canon-field-centered.png", caption: "Reframing design from focusing on individual users to engaging entire systems." },
  "Relational Turn": { src: "/images/theory/canon-relational-turn.png", caption: "Each adjustment shifts the system, requiring continual attunement." },
  "Toward Transrelational Intelligence": { src: "/images/theory/canon-transrelational.png", caption: "Intelligence becomes a distributed condition across human, artificial, and ecological systems, forming a shared field of becoming." },
};

const TYPE_COLORS = { signal: "#2e6b4f", inflation: "#a06828", shadow: "#6a5aaa" };
const TYPE_LABELS = { signal: "Signal", inflation: "Inflation", shadow: "Shadow" };

/* ── Diagnostic card ── */
function XRayCard({ item, delay }) {
  return (
    <div
      className={`cn-xr-card cn-xr-card--${item.type}`}
      style={{ "--xr-c": TYPE_COLORS[item.type], animationDelay: `${delay}ms` }}
    >
      <div className="cn-xr-card-label">{TYPE_LABELS[item.type]}</div>
      <div className="cn-xr-card-title">{item.title}</div>
      <div className="cn-xr-card-body">{item.body}</div>
      {item.tell && <div className="cn-xr-card-tell"><strong>Tell:</strong> {item.tell}</div>}
    </div>
  );
}

export default function Canon() {
  const rdItem = SEED.find(c => c.title === "Relational Design");
  const theory = rdItem?.theory;
  const [active, setActive] = useState("overview");
  const [xrayMode, setXrayMode] = useState(false);
  const [xrayFilter, setXrayFilter] = useState("all"); // "all" | "signal" | "inflation" | "shadow"
  const sectionRefs = useRef({});

  /* Scroll-spy */
  useEffect(() => {
    const observers = [];
    const entries = new Map();
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          entries.set(id, entry.intersectionRatio);
          let best = "overview";
          let bestRatio = 0;
          entries.forEach((ratio, key) => {
            if (ratio > bestRatio) { best = key; bestRatio = ratio; }
          });
          setActive(best);
        },
        { threshold: [0, 0.1, 0.25, 0.5], rootMargin: "-80px 0px -40% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  /* X key toggles X-Ray mode */
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if (isInput) return;
      if ((e.key === "x" || e.key === "X") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setXrayMode(p => !p);
      }
      if (e.key === "Escape" && xrayMode) {
        setXrayMode(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [xrayMode]);

  const scrollTo = (id) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filterCards = useCallback((cards) => {
    if (xrayFilter === "all") return cards;
    return cards.filter(c => c.type === xrayFilter);
  }, [xrayFilter]);

  const renderCards = useCallback((cards, baseDelay = 0) => {
    if (!xrayMode || !cards) return null;
    const filtered = filterCards(cards);
    if (filtered.length === 0) return null;
    return (
      <div className="cn-xr-cards">
        {filtered.map((item, i) => (
          <XRayCard key={i} item={item} delay={baseDelay + i * 60} />
        ))}
      </div>
    );
  }, [xrayMode, filterCards]);

  if (!theory) return null;

  return (
    <div className={`ph en${xrayMode ? " cn-xray-active" : ""}`}>
      {/* ── Sub-Nav / X-Ray Toolbar ── */}
      <nav className="cn-subnav">
        {xrayMode ? (
          <>
            <div className="cn-xr-bar-label">Relational X-Ray</div>
            <div className="cn-xr-filters">
              {["all", "signal", "inflation", "shadow"].map(f => (
                <button
                  key={f}
                  className={`cn-xr-filter-btn${xrayFilter === f ? " on" : ""}`}
                  onClick={() => setXrayFilter(f)}
                  style={f !== "all" ? { "--xr-fc": TYPE_COLORS[f] } : undefined}
                >
                  {f === "all" ? "All" : TYPE_LABELS[f]}
                </button>
              ))}
            </div>
            <button className="cn-xr-close" onClick={() => setXrayMode(false)}>&times;</button>
          </>
        ) : (
          SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              className={`cn-subnav-link${active === id ? " on" : ""}`}
              onClick={() => scrollTo(id)}
            >
              {label}
            </button>
          ))
        )}
      </nav>

      {/* ── 1. Overview ── */}
      <div ref={el => sectionRefs.current["overview"] = el} id="canon-overview" className="ph-header en d1" style={{ scrollMarginTop: 56 }}>
        <div className="ph-pre">Canon</div>
        <h1 className="ph-h">Relational Design</h1>
        <p className="ph-sub">Field-Centered Framework</p>
      </div>

      <div className="ph-canon en d2">
        <p className="ph-canon-p">A practice of designing conditions. Orientation and shared language for work that holds complexity without collapsing it.</p>
        <div className="ph-canon-ax">
          <span className="ph-canon-al">Governing Principle</span>
          <p className="ph-canon-at">Embodied action precedes alignment. You act because alignment has already taken form.</p>
        </div>
        <div className="ph-canon-ax">
          <span className="ph-canon-al">System Invariant</span>
          <p className="ph-canon-at">Practice precedes documentation.</p>
        </div>
        <div className="ph-canon-ax">
          <span className="ph-canon-al">Aliveness</span>
          <p className="ph-canon-at">The system demonstrates aliveness through responsiveness, instead of performance. State is visible. Change is legible. Stillness and motion are both evidence of attention.</p>
        </div>
      </div>

      {renderCards(XRAY_DATA.overview)}

      <div className="ph-section en d3">
        <div className="ph-sl">Introduction</div>
        <p className="ph-intro">{theory.intro}</p>
      </div>

      <div className="ph-abstract en d4">
        <div className="ph-sl">Abstract</div>
        <p className="ph-abstract-text">{theory.abstract}</p>
        <img src="/images/theory/canon-abstract.png" alt="Relational Design abstract diagram" className="cn-diagram" loading="lazy" />
        <div className="cn-diagram-caption">Relational Design Process Diagram</div>
      </div>

      {/* ── 2. Philosophy ── */}
      <div ref={el => sectionRefs.current["philosophy"] = el} id="canon-philosophy" style={{ scrollMarginTop: 56 }}>

        {theory.sections.map((sec, i) => (
          <div key={i} className="ph-section en">
            <div className="ph-body-heading">{sec.heading}</div>
            {sec.body.split("\n\n").map((p, j) => (
              <p key={j} className="ph-body-text">{p}</p>
            ))}
            {SECTION_DIAGRAMS[sec.heading] && (
              <>
                <img src={SECTION_DIAGRAMS[sec.heading].src} alt={`${sec.heading} diagram`} className="cn-diagram" loading="lazy" />
                {SECTION_DIAGRAMS[sec.heading].caption && <div className="cn-diagram-caption">{SECTION_DIAGRAMS[sec.heading].caption}</div>}
              </>
            )}
            {!SECTION_DIAGRAMS[sec.heading] && sec.caption && <div className="ph-body-caption">{sec.caption}</div>}
            {renderCards(XRAY_DATA.philosophy?.[sec.heading], i * 40)}
          </div>
        ))}
      </div>

      {/* ── 3. Principles ── */}
      <div ref={el => sectionRefs.current["principles"] = el} id="canon-principles" style={{ scrollMarginTop: 56 }}>
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

        {renderCards(XRAY_DATA.principles)}

        {/* Lens Mode acknowledgment */}
        <div className="cn-lens-note">
          <em>Model Lens</em>: reveal mental model relationships across work. Press <kbd>M</kbd> to activate.
          <em>Pattern Lens</em>: overlay Alexander's architectural patterns. Press <kbd>P</kbd> to activate.
          {!xrayMode && <><br /><em>X-Ray</em>: field diagnostic overlay. Press <kbd>X</kbd> to activate.</>}
        </div>
      </div>

      {/* ── 4. Lineages ── */}
      <div ref={el => sectionRefs.current["lineages"] = el} id="canon-lineages" style={{ scrollMarginTop: 56 }}>
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
      </div>

      {/* ── 5. Works Cited ── */}
      <div ref={el => sectionRefs.current["works-cited"] = el} id="canon-works-cited" style={{ scrollMarginTop: 56 }}>
        <div className="ph-works-cited en">
          <div className="ph-sl">Works Cited</div>
          <div className="ph-works-list">
            {theory.worksCited.map((ref, i) => (
              <div key={i} className="ph-work-item">{ref}</div>
            ))}
          </div>
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
