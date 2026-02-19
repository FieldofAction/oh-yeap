import React, { useState, useCallback } from "react";
import { VIS } from "../../data/seed";

export default function SpecSheetDetail({ item, allItems, closing, onClose, onOpen, fg }) {
  const artVi = useCallback((i) => VIS[(Math.abs(item.title.charCodeAt(0)) + i) % VIS.length](fg), [item.title, fg]);
  const typeLabel = {diagram:"Diagram",prompt:"Prompt",framework:"Framework",model:"Model"}[item.artifactType] || "Artifact";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className={`sp-overlay ${closing ? "closing" : ""}`}>
      <button className="rd-back" onClick={onClose}>&larr; Back</button>
      <div className="sp-inner">
        <div className="sp-head">
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

        {/* Executable prompt block — copy-paste ready */}
        {item.spec?.prompt && (
          <div className="sp-section">
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
          <div className="sp-section">
            <div className="sp-section-label">{item.spec.prompt ? "How It Works" : "Preview"}</div>
            {item.spec.preview.type === "visual" && (
              <>
                <div className="sp-preview-visual">
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
          <div className="sp-section">
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
        {item.spec?.usage && (
          <div className="sp-section">
            <div className="sp-section-label">Usage</div>
            <div className="sp-usage">{item.spec.usage}</div>
          </div>
        )}
        {item.spec?.source?.length > 0 && (
          <div className="sp-section">
            <div className="sp-section-label">Source</div>
            {item.spec.source.map((s, i) => {
              const linked = allItems.find(a => a.title === s.title);
              return (
                <div key={i} className="sp-source-item" onClick={() => { if(linked && (linked.body || linked.caseStudy || linked.sketch || linked.spec)){onOpen(linked);window.scrollTo(0,0)} }}>
                  <div className="sp-source-title">{s.title} &rarr;</div>
                  <div className="sp-source-why">{s.why}</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="rd-tags">
          {item.tags?.map(t => <span key={t} className="card-tg">{t}</span>)}
          {item.relations?.map(r => <span key={r} className="card-tg rel">&rarr; {r}</span>)}
        </div>
      </div>
    </div>
  );
}
