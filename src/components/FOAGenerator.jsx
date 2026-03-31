import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";

const SYSTEM_PROMPT = `You are generating Field of Action (FOA) typographic artifacts.
These artifacts behave like system signals, research posters, or engineering stamps, not marketing graphics.
They must feel inspired by:
- OMA research posters • Metahaven graphic research • Experimental Jetset typography • Virgil Abloh annotation systems
But the output must feel clean, conceptual, and system-oriented.
Artifact Structure
Each artifact must contain these components:
1. Metadata Row: Small system classification text.
2. Thesis: Large headline that communicates the core idea.
3. Signal Layer: A word repeated three times (e.g., ACTION ACTION ACTION).
4. Orientation Phrase: A philosophical or poetic statement.
5. Authority Layer: Field of Action system certification.
6. Temporal Signal: A phrase that suggests activation or timing.
Behavior Rules
1. Typography should feel architectural and structured.
2. Use uppercase for major signals.
3. Orientation phrases may mix case for nuance.
4. Signals should often repeat 3 times.
5. Authority lines should feel like institutional stamps.
6. Each artifact should feel self-contained and able to stand alone.
Produce exactly 8 artifact variations.
Each variation should explore a slightly different: signal word, orientation phrase, metadata label, temporal phrase.
But keep the same thesis derived from the input idea.
Return ONLY a JSON array of 8 objects. No markdown, no explanation, no backticks. Pure JSON only.
Each object must have exactly these keys:
- "metadata": string (e.g. "FOA.PROTOCOL 01" or "FOA.FIELD SIGNAL")
- "label": string (e.g. "RELATIONAL SIGNAL" or "SYSTEM ARTIFACT")
- "thesis": string (2-3 lines, all caps, newline separated with \\n)
- "signal": string (one word repeated 3 times, all caps, space separated)
- "orientation": string (2-4 lines, may mix case, newline separated with \\n)
- "authority": string (2 lines, all caps, newline separated with \\n)
- "temporal": string (short activation phrase, all caps)`;

async function downloadCardAsPng(cardEl, index) {
  try {
    // Inline all computed styles so html2canvas captures everything
    const elements = [cardEl, ...cardEl.querySelectorAll("*")];
    const originals = [];
    elements.forEach((el) => {
      const computed = getComputedStyle(el);
      originals.push(el.getAttribute("style") || "");
      const styles = [
        `color:${computed.color}`,
        `background-color:${computed.backgroundColor}`,
        `font-family:${computed.fontFamily}`,
        `font-size:${computed.fontSize}`,
        `font-weight:${computed.fontWeight}`,
        `font-style:${computed.fontStyle}`,
        `letter-spacing:${computed.letterSpacing}`,
        `text-transform:${computed.textTransform}`,
        `line-height:${computed.lineHeight}`,
        `padding:${computed.padding}`,
        `margin:${computed.margin}`,
        `border:${computed.border}`,
        `opacity:${computed.opacity}`,
        `position:${computed.position}`,
        `top:${computed.top}`,
        `right:${computed.right}`,
        `display:${computed.display}`,
      ].join(";");
      el.setAttribute("style", (el.getAttribute("style") || "") + ";" + styles);
    });

    const canvas = await html2canvas(cardEl, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
    });

    // Restore original styles
    elements.forEach((el, i) => {
      if (originals[i]) el.setAttribute("style", originals[i]);
      else el.removeAttribute("style");
    });

    const link = document.createElement("a");
    link.download = `foa-artifact-${String(index + 1).padStart(2, "0")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    alert("PNG export failed: " + e.message);
  }
}

function downloadAllAsJson(artifacts, idea) {
  const payload = {
    idea,
    generated: new Date().toISOString(),
    artifacts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.download = `foa-artifacts-${Date.now()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function ArtifactCard({ artifact, index, isNew, onDownload }) {
  const cardRef = useRef(null);
  const thesis = artifact.thesis?.split("\\n") || [];
  const orientation = artifact.orientation?.split("\\n") || [];
  const authority = artifact.authority?.split("\\n") || [];
  const signalWords = artifact.signal?.split(" ") || [];

  return (
    <div ref={cardRef} className={`fg-card${isNew ? " fg-card-in" : ""}`} style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="fg-card-idx">
        {String(index + 1).padStart(2, "0")} / 08
        <button className="fg-card-dl" onClick={(e) => { e.stopPropagation(); if (cardRef.current) downloadCardAsPng(cardRef.current, index); }} title="Download as PNG">↓</button>
      </div>

      <div className="fg-card-meta">{artifact.metadata}</div>
      <div className="fg-card-label">{artifact.label}</div>

      <div className="fg-card-thesis">
        {thesis.map((line, i) => <div key={i}>{line}</div>)}
      </div>

      <div className="fg-card-signal">
        {signalWords.map((word, i) => (
          <div key={i} style={{ opacity: 1 - i * 0.2 }}>{word}</div>
        ))}
      </div>

      <div className="fg-card-divider" />

      <div className="fg-card-orient">
        <div className="fg-card-orient-mark">✺</div>
        {orientation.map((line, i) => (
          <div key={i} style={{ fontStyle: /[a-z]/.test(line) ? "italic" : "normal" }}>{line}</div>
        ))}
      </div>

      <div className="fg-card-auth">
        {authority.map((line, i) => (
          <div key={i} className={i === 0 ? "fg-auth-primary" : "fg-auth-secondary"}>{line}</div>
        ))}
      </div>

      <div className="fg-card-temporal">
        <div className="fg-temporal-dot" />
        <span>{artifact.temporal}</span>
      </div>
    </div>
  );
}

export default function FOAGenerator() {
  const [idea, setIdea] = useState("");
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);
  const textareaRef = useRef(null);

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setArtifacts([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: `Idea:\n${idea.trim()}` },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text || "";

      let parsed;
      try {
        const clean = rawText.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        throw new Error("Could not parse artifact data.");
      }

      setIsNew(true);
      setArtifacts(parsed);
    } catch (e) {
      setError(e.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
  };

  return (
    <div className="fg en">
      {/* Header */}
      <div className="fg-header">
        <div>
          <div className="fg-header-label">Artifact Generator</div>
          <div className="fg-header-sub">Field of Action: Relational Design Practice</div>
        </div>
        <div className="fg-header-ver">V.02 / 2026</div>
      </div>

      {/* Input Zone */}
      <div className="fg-input-zone">
        <div className="fg-input-label">Input Idea</div>
        <textarea
          ref={textareaRef}
          className="fg-textarea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Enter your idea here..."
          rows={3}
        />
        <div className="fg-input-actions">
          <button
            className={`fg-btn${loading ? " fg-btn-loading" : ""}`}
            onClick={generate}
            disabled={loading || !idea.trim()}
          >
            {loading ? "Generating..." : "Generate Artifacts"}
          </button>
          <span className="fg-shortcut">⌘ + Enter</span>
        </div>
        {loading && (
          <div className="fg-status">
            <div className="fg-status-dot" />
            <span>Field activation in progress</span>
          </div>
        )}
        {error && (
          <div className="fg-error">Error: {error}</div>
        )}
      </div>

      {/* Artifacts Grid */}
      {artifacts.length > 0 && (
        <div className="fg-output">
          <div className="fg-output-label">
            <span>Artifact Output: {artifacts.length} signals generated</span>
            <button className="fg-dl-all" onClick={() => downloadAllAsJson(artifacts, idea)}>↓ Download JSON</button>
          </div>
          <div className="fg-grid">
            {artifacts.map((artifact, i) => (
              <ArtifactCard key={i} artifact={artifact} index={i} isNew={isNew} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {artifacts.length === 0 && !loading && (
        <div className="fg-empty">
          <div className="fg-empty-glyph">✺</div>
          <div className="fg-empty-text">Enter an idea to begin</div>
        </div>
      )}
    </div>
  );
}
