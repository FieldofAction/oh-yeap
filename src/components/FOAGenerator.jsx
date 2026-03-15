import { useState, useRef } from "react";

const SYSTEM_PROMPT = `You are generating Field of Action (FOA) typographic artifacts.
These artifacts behave like system signals, research posters, or engineering stamps, not marketing graphics.
They must feel inspired by:
- OMA research posters • Metahaven graphic research • Experimental Jetset typography • Virgil Abloh annotation systems
But the output must feel clean, conceptual, and system-oriented.
Artifact Structure
Each artifact must contain these components:
1. Metadata Row — Small system classification text.
2. Thesis — Large headline that communicates the core idea.
3. Signal Layer — A word repeated three times (e.g., ACTION ACTION ACTION).
4. Orientation Phrase — A philosophical or poetic statement.
5. Authority Layer — Field of Action system certification.
6. Temporal Signal — A phrase that suggests activation or timing.
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

const COLORS = [
  { bg: "#0a0a0a", text: "#f0f0f0", accent: "#FFE500", border: "#333" },
  { bg: "#f5f0e8", text: "#1a1a1a", accent: "#CC2200", border: "#1a1a1a" },
  { bg: "#0d1117", text: "#c9d1d9", accent: "#58a6ff", border: "#30363d" },
  { bg: "#1a1a1a", text: "#e8e8e8", accent: "#FF6B35", border: "#444" },
  { bg: "#f0f0f0", text: "#111111", accent: "#0066FF", border: "#111" },
  { bg: "#0a0a14", text: "#e8e0ff", accent: "#9B59B6", border: "#2d2d4e" },
  { bg: "#141414", text: "#d4f5d4", accent: "#00FF88", border: "#2a4a2a" },
  { bg: "#1a0a00", text: "#f5e6cc", accent: "#FF9900", border: "#4a2a00" },
];

function ArtifactCard({ artifact, index, isNew }) {
  const colors = COLORS[index % COLORS.length];
  const thesis = artifact.thesis?.split("\\n") || [];
  const orientation = artifact.orientation?.split("\\n") || [];
  const authority = artifact.authority?.split("\\n") || [];
  const signalWords = artifact.signal?.split(" ") || [];

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: "32px",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        position: "relative",
        animation: isNew ? "fadeSlideIn 0.5s ease forwards" : "none",
        animationDelay: `${index * 0.07}s`,
        opacity: isNew ? 0 : 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "16px",
          fontSize: "10px",
          opacity: 0.4,
          letterSpacing: "0.15em",
        }}
      >
        {String(index + 1).padStart(2, "0")} / 08
      </div>

      <div
        style={{
          fontSize: "9px",
          letterSpacing: "0.2em",
          opacity: 0.6,
          marginBottom: "6px",
          color: colors.accent,
        }}
      >
        {artifact.metadata}
      </div>
      <div
        style={{
          fontSize: "8px",
          letterSpacing: "0.25em",
          opacity: 0.45,
          marginBottom: "28px",
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: "12px",
        }}
      >
        {artifact.label}
      </div>

      <div style={{ marginBottom: "28px" }}>
        {thesis.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: "18px",
              fontWeight: "700",
              letterSpacing: "0.05em",
              lineHeight: "1.2",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {signalWords.map((word, i) => (
          <div
            key={i}
            style={{
              fontSize: "28px",
              fontWeight: "900",
              letterSpacing: "0.12em",
              color: colors.accent,
              lineHeight: "1",
              opacity: 1 - i * 0.2,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          marginBottom: "20px",
          opacity: 0.5,
        }}
      />

      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "8px",
            letterSpacing: "0.2em",
            opacity: 0.4,
            marginBottom: "8px",
          }}
        >
          ✺
        </div>
        {orientation.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              lineHeight: "1.7",
              fontStyle: /[a-z]/.test(line) ? "italic" : "normal",
              opacity: 0.85,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        {authority.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: i === 0 ? "11px" : "8px",
              letterSpacing: "0.2em",
              opacity: i === 0 ? 0.9 : 0.5,
              fontWeight: i === 0 ? "600" : "400",
              lineHeight: "1.5",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: colors.accent,
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            fontSize: "9px",
            letterSpacing: "0.25em",
            color: colors.accent,
            fontWeight: "700",
          }}
        >
          {artifact.temporal}
        </div>
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#080808",
        color: "#e0e0e0",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .foa-textarea:focus { outline: none; }
        .foa-textarea::placeholder { color: #444; }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "24px 40px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: "#FFE500",
              marginBottom: "4px",
            }}
          >
            FOA.SYSTEM / ARTIFACT GENERATOR
          </div>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              opacity: 0.4,
            }}
          >
            FIELD OF ACTION — RELATIONAL DESIGN PRACTICE
          </div>
        </div>
        <div
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            opacity: 0.25,
          }}
        >
          V.02 / 2026
        </div>
      </div>

      {/* Input Zone */}
      <div
        style={{
          padding: "40px",
          borderBottom: "1px solid #1e1e1e",
          maxWidth: "680px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            letterSpacing: "0.25em",
            color: "#FFE500",
            marginBottom: "12px",
            opacity: 0.8,
          }}
        >
          INPUT IDEA
        </div>
        <textarea
          ref={textareaRef}
          className="foa-textarea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Enter your idea here..."
          rows={3}
          style={{
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: "1px solid #2a2a2a",
            color: "#e0e0e0",
            fontSize: "22px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: "600",
            letterSpacing: "0.03em",
            lineHeight: "1.4",
            resize: "none",
            padding: "0 0 16px 0",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <button
            onClick={generate}
            disabled={loading || !idea.trim()}
            style={{
              backgroundColor: loading ? "#222" : "#FFE500",
              color: loading ? "#555" : "#000",
              border: "none",
              padding: "12px 28px",
              fontSize: "9px",
              letterSpacing: "0.3em",
              fontWeight: "700",
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: loading || !idea.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? "GENERATING..." : "GENERATE ARTIFACTS"}
          </button>
          <div
            style={{
              fontSize: "8px",
              letterSpacing: "0.15em",
              opacity: 0.3,
            }}
          >
            ⌘ + ENTER
          </div>
        </div>
        {loading && (
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "5px",
                height: "5px",
                backgroundColor: "#FFE500",
                borderRadius: "50%",
                animation: "pulse 1s infinite",
              }}
            />
            <div
              style={{
                fontSize: "8px",
                letterSpacing: "0.25em",
                color: "#FFE500",
                opacity: 0.7,
              }}
            >
              FIELD ACTIVATION IN PROGRESS
            </div>
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: "16px",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "#CC2200",
            }}
          >
            ERROR: {error}
          </div>
        )}
      </div>

      {/* Artifacts Grid */}
      {artifacts.length > 0 && (
        <div style={{ padding: "40px" }}>
          <div
            style={{
              fontSize: "8px",
              letterSpacing: "0.25em",
              color: "#FFE500",
              marginBottom: "28px",
              opacity: 0.7,
            }}
          >
            ARTIFACT OUTPUT — {artifacts.length} SIGNALS GENERATED
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "2px",
            }}
          >
            {artifacts.map((artifact, i) => (
              <ArtifactCard
                key={i}
                artifact={artifact}
                index={i}
                isNew={isNew}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {artifacts.length === 0 && !loading && (
        <div
          style={{
            padding: "80px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.2,
            textAlign: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "900",
              letterSpacing: "0.2em",
              lineHeight: "1",
            }}
          >
            ✺
          </div>
          <div style={{ fontSize: "9px", letterSpacing: "0.3em" }}>
            ENTER AN IDEA TO BEGIN
          </div>
        </div>
      )}
    </div>
  );
}
