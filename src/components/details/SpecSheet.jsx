import React, { useState, useCallback, useEffect, useRef } from "react";
import { VIS } from "../../data/seed";
import { HiddenStrip } from "../HiddenIndicators";
import { PatternChipsDetail, AlexanderChipsDetail } from "../PatternLens";

// Simple 2-column table — optional header row, optional emphasized last row.
function SpecTable({ head, rows, emphasizeLast }) {
  if (!rows?.length) return null;
  return (
    <div className="sp-table">
      {head && (
        <div className="sp-table-row sp-table-head">
          <span>{head[0]}</span><span>{head[1]}</span>
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className={`sp-table-row${emphasizeLast && i === rows.length - 1 ? " sp-table-row--key" : ""}`}>
          <span>{r[0]}</span><span>{r[1]}</span>
        </div>
      ))}
    </div>
  );
}

export default function SpecSheetDetail({ item, allItems, closing, onClose, onOpen, fg, lens, patternLens }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.scrollTo(0, 0);
  }, [item.id]);

  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i) % VIS.length](fg), [item.title, fg]);
  const typeLabel = {diagram:"Diagram",prompt:"Prompt",framework:"Framework",model:"Model",method:"Method"}[item.artifactType] || "Artifact";
  const [copied, setCopied] = useState(false);

  // Atmosphere gets its own space: a full-bleed editorial image band that carries the
  // section headline, with clean content below. A condition arrives out of atmosphere.
  const atmo = item.spec?.atmosphere || {};
  const sectionHead = (key, label) => atmo[key] ? (
    <figure className="sp-plate" style={{ backgroundImage: `url("${atmo[key]}")` }}>
      <figcaption className="sp-plate-h">{label}</figcaption>
    </figure>
  ) : (
    <div className="sp-section-label">{label}</div>
  );

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div ref={overlayRef} className={`sp-overlay ${closing ? "closing" : ""}${item.spec?.specimen ? " sp-specimen" : ""}`}>
      <button className="rd-back" onClick={onClose}>&larr; Back</button>
      <div className="sp-inner">
        <HiddenStrip item={item} />
        {item.spec?.specimen && (
          <div className="sp-spine" aria-hidden="true">{`${item.title} · v${item.version} · ${typeLabel.toUpperCase()}`}</div>
        )}
        <div className="sp-head dc dc1">
          <div className="sp-head-left">
            <div className="sp-badge">{typeLabel}</div>
            <h1 className="sp-title">{item.title}</h1>
            <div className="sp-desc">{item.desc}</div>
          </div>
          <div className="sp-head-meta">
            <div className="sp-meta-row"><strong>Version</strong> {item.version || "\u2014"}</div>
            <div className="sp-meta-row"><strong>Status</strong> {item.status}</div>
            <div className="sp-meta-row"><strong>Year</strong> {item.year}</div>
            <div className="sp-meta-row"><strong>Type</strong> {item.subtitle}</div>
          </div>
        </div>

        {/* One atmospheric hero \u2014 a single piece of art at the top */}
        {item.spec?.hero && (
          <figure className="sp-hero" aria-hidden="true">
            <div className="sp-hero-art" style={{ backgroundImage: `url("${item.spec.hero}")`, backgroundSize: "132%", backgroundPosition: "100% 50%" }} />
          </figure>
        )}

        {/* Premise — why the instrument exists, with an optional cause/effect table */}
        {item.spec?.premise && (
          <div className="sp-section dc dc2">
            {sectionHead("premise", "Premise")}
            <div className="sp-premise-text">
              <div className="sp-usage" style={{ whiteSpace: "pre-line" }}>{item.spec.premise}</div>
              {item.spec.premiseLead && (
                <div className="sp-premise-lead">{item.spec.premiseLead}</div>
              )}
              {item.spec.stabilizesProse && (
                <div className="sp-usage" style={{ whiteSpace: "pre-line" }}>{item.spec.stabilizesProse}</div>
              )}
            </div>
          </div>
        )}

        {/* What it is — short definition */}
        {item.spec?.framing && (
          <div className="sp-framing dc dc2">
            <div className="sp-framing-label">{item.spec.framing.label}</div>
            <div className="sp-framing-body" style={{ whiteSpace: "pre-line" }}>{item.spec.framing.body}</div>
          </div>
        )}

        {/* Numbered components — canvas grid of zones */}
        {item.spec?.components?.length > 0 && (
          <div className="sp-section dc dc3">
            <div className="sp-section-label">Components</div>
            <div className="sp-components sp-components--grid">
              {item.spec.components.map((c, i) => (
                <div key={i} className="sp-components-item">
                  <div className="sp-components-num">{String(c.num ?? i + 1).padStart(2, "0")}</div>
                  <div className="sp-components-body">
                    <div className="sp-components-label">{c.label}</div>
                    <div className="sp-components-desc" style={{ whiteSpace: "pre-line" }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The Derivation Chain — the hero: vertical flow, forward and backward */}
        {item.spec?.glue && (
          <div className="sp-section dc dc4">
            {sectionHead("chain", item.spec.glue.label)}
            {item.spec.glue.body && <div className="sp-framing-body" style={{ whiteSpace: "pre-line", maxWidth: 680 }}>{item.spec.glue.body}</div>}
            {item.spec.glue.chainNodes?.length > 0 ? (
              <div className="sp-chainr-wrap">
                <div className="sp-chainr" role="img" aria-label={`Reversible chain: ${item.spec.glue.chainNodes.join(", ")}; reads in either direction`}>
                  {item.spec.specimen && <span className="sp-chainr-mark" aria-hidden="true" />}
                  {(() => {
                    const nodes = item.spec.glue.chainNodes;
                    const counts = item.spec.glue.chainRows || [nodes.length];
                    const rows = []; let idx = 0;
                    for (const c of counts) { rows.push(nodes.slice(idx, idx + c)); idx += c; }
                    if (idx < nodes.length) rows.push(nodes.slice(idx));
                    return rows.map((row, ri) => (
                      <React.Fragment key={ri}>
                        <div className="sp-chainr-row">
                          {row.map((n, ni) => <div key={ni} className={`sp-chainr-node${ri === rows.length - 1 && ni === row.length - 1 ? " is-decision" : ""}`}>{n}</div>)}
                        </div>
                        {ri < rows.length - 1 && <div className="sp-chainr-arrow" aria-hidden="true">&#8645;</div>}
                      </React.Fragment>
                    ));
                  })()}
                </div>
                {item.spec.glue.instrument && <div className="sp-chainr-instrument">{item.spec.glue.instrument}</div>}
              </div>
            ) : item.spec.glue.chain && (
              <div className="sp-glue-chain">{item.spec.glue.chain}</div>
            )}
            {item.spec.glue.after && (
              <div className="sp-framing-body sp-glue-after" style={{ whiteSpace: "pre-line", maxWidth: 680 }}>{item.spec.glue.after}</div>
            )}
          </div>
        )}

        {/* Executable prompt block, copy-paste ready */}
        {item.spec?.prompt && (
          <div className="sp-section dc dc3">
            <div className="sp-prompt-header">
              <div className="sp-section-label">Prompt</div>
              <button className="sp-copy-btn" onClick={() => handleCopy(item.spec.prompt)}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="sp-prompt-block">
              <pre className="sp-prompt-code">{item.spec.prompt}</pre>
            </div>
          </div>
        )}

        {item.spec?.preview && (
          <div className="sp-section dc dc4">
            <div className="sp-section-label">{item.spec.prompt ? "How It Works" : "Preview"}</div>
            {item.spec.preview.type === "visual" && (
              <>
                <div className="sp-preview-visual img-reveal">
                  {item.spec.preview.src ? (
                    <img src={item.spec.preview.src} alt={item.spec.preview.caption || item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: artVi(0) }} style={{ width:"100%", height:"100%" }} />
                  )}
                  <div className="sp-preview-glow" />
                </div>
                {item.spec.preview.caption && <div className="sp-preview-cap">{item.spec.preview.caption}</div>}
              </>
            )}
            {item.spec.preview.type === "text" && (
              <div className="sp-preview-text">{item.spec.preview.content}</div>
            )}
          </div>
        )}
        {item.spec?.anatomy?.length > 0 && (
          <div className="sp-section dc dc5">
            <div className="sp-section-label">Anatomy</div>
            <div className="sp-anatomy">
              {item.spec.anatomy.map((a, i) => (
                <div key={i} className="sp-anatomy-item">
                  <div className="sp-anatomy-label">{a.label}</div>
                  <div className="sp-anatomy-desc">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* A second atmospheric band, before the how-to */}
        {item.spec?.usageArt && (
          <figure className="sp-hero" aria-hidden="true">
            <div className="sp-hero-art" style={{ backgroundImage: `url("${item.spec.usageArt}")` }} />
          </figure>
        )}
        {/* In practice — a worked specimen: the chain run once on a real subject */}
        {item.spec?.example?.run?.length > 0 && (
          <div className="sp-section dc dc5">
            <div className="sp-section-label">In practice</div>
            <div className="sp-example-card" style={item.spec.example.accent ? { "--ex-accent": item.spec.example.accent } : undefined}>
              <div className="sp-example-subject">
                {item.spec.example.mark && (
                  <img className="sp-example-mark" src={item.spec.example.mark} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                )}
                <span>A Condition Set, filled for {item.spec.example.subject}</span>
              </div>
              <ol className="sp-example-run">
                {item.spec.example.run.map((step, i) => (
                  <li key={i} className={`sp-example-step${i === 0 ? " is-anchor" : ""}${step.stage === "Decision" ? " is-decision" : ""}`}>
                    <div className="sp-example-stage">{step.stage}</div>
                    <div className="sp-example-text">{step.text}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* How to use it — numbered step tiles */}
        {item.spec?.usageSteps?.length > 0 ? (
          <div className="sp-section dc dc6">
            <div className="sp-section-label">How to use it</div>
            <div className="sp-steps">
              {item.spec.usageSteps.map((s, i) => (
                <div key={i} className="sp-step">
                  <div className="sp-step-num">{String(s.num ?? i + 1).padStart(2, "0")}</div>
                  <div className="sp-step-body">
                    <div className="sp-step-title">{s.title}</div>
                    <div className="sp-step-desc" style={{ whiteSpace: "pre-line" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : item.spec?.usage && (
          <div className="sp-section dc dc6">
            <div className="sp-section-label">{item.spec.components ? "How to use it" : "Usage"}</div>
            <div className="sp-usage" style={{ whiteSpace: "pre-line" }}>{item.spec.usage}</div>
          </div>
        )}

        {/* Use moments — when the instrument earns its keep */}
        {item.spec?.useMoments?.rows?.length > 0 && (
          <div className="sp-section dc dc6">
            {sectionHead("moments", "Use moments")}
            <SpecTable head={item.spec.useMoments.head} rows={item.spec.useMoments.rows} />
          </div>
        )}


        {item.spec?.protects && (
          <div className="sp-section dc dc6">
            <div className="sp-section-label">What it protects</div>
            <div className="sp-usage" style={{ whiteSpace: "pre-line" }}>{item.spec.protects}</div>
          </div>
        )}
        {item.spec?.openQuestions?.length > 0 && (
          <div className="sp-oq dc dc7">
            <div className="sp-section-label">Open Questions</div>
            {item.spec.openQuestions.map((q, i) => (
              <div key={i} className="sp-oq-item">{q}</div>
            ))}
          </div>
        )}
        {item.spec?.source?.length > 0 && (
          <div className="sp-section dc dc8">
            <div className="sp-section-label">{item.spec.components ? "Connections" : "Source"}</div>
            {item.spec.source.map((s, i) => {
              const linked = allItems.find(a => a.title === s.title);
              return (
                <div key={i} className="sp-source-item" onClick={() => { if(linked && (linked.body || linked.caseStudy || linked.sketch || linked.spec)){onOpen(linked)} }}>
                  <div className="sp-source-title">{s.title} &rarr;</div>
                  <div className="sp-source-why">{s.why}</div>
                </div>
              );
            })}
          </div>
        )}
        <PatternChipsDetail itemTitle={item.title} active={lens} />
        <AlexanderChipsDetail itemTitle={item.title} active={patternLens} />
        <div className="rd-tags dc dc8">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel">&rarr; {r}</span>)}
        </div>
      </div>
    </div>
  );
}
