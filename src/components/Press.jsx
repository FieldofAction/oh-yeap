import React, { useEffect } from "react";

// Press is the production-tools tier — sibling to Studio (discernment).
// Each tool inside Press is named after the edition or job it serves.
// First tenant: Nest Compositor (social asset generator for the Nest edition).
//
// Chrome colors follow the host site theme via CSS variables; per-tool
// canvas surfaces still use photo-derived colors for the asset itself.

const PaperBg = "var(--bg)";
const Ink = "var(--fg)";
const Muted = "var(--fm)";
const Hairline = "var(--bd)";
const Surface = "var(--sf)";

const TOOLS = [
  {
    key: "nestcompositor",
    label: "Nest Compositor",
    edition: "for the Nest edition",
    desc: "Photo-aware social asset generator. Four layouts (Single · Juxtapose · Synthesis · Mark) at 1:1 and 9:16, with batch contact sheet, photo-scale nesting, and per-photo credits. Auto-connected to the Patio Beach archive.",
    status: "live",
  },
  {
    key: "nestreel",
    label: "Nest Reel",
    edition: "for the Nest edition",
    desc: "Color-shifting WebM maker. Up to 50 photos in sequence; field color crossfades between each photo's dominant. 1:1 and 9:16. Auto-connected to the Patio Beach archive.",
    status: "live",
  },
  {
    key: null,
    label: "Poster Generator",
    edition: "print, 300 DPI with bleed",
    desc: "Sibling tool for print-ready posters. Up to four photos at full resolution, layout determined by photo count, per-photo DPI diagnostic.",
    status: "drafted",
  },
];

export default function Press({ navigateTo }) {
  // Load the editorial fonts at the Press level so both the landing and the
  // tools inside it can rely on them being ready.
  useEffect(() => {
    if (document.querySelector("link[data-press-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
    link.setAttribute("data-press-fonts", "1");
    document.head.appendChild(link);
  }, []);

  return (
    <section
      style={{
        backgroundColor: PaperBg,
        color: Ink,
        minHeight: "100vh",
        fontFamily: '"IBM Plex Mono", monospace',
        padding: "48px 32px",
      }}
    >
      <style>{`
        .press-serif { font-family: "Playfair Display", Georgia, serif; }
        .press-mono { font-family: "IBM Plex Mono", monospace; }
        .press-tool-card { transition: background-color 0.15s ease, border-color 0.15s ease; }
        .press-tool-card.live:hover { background-color: ${Surface}; border-color: ${Ink}; }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ marginBottom: 48 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: Muted,
              marginBottom: 12,
            }}
          >
            Press
          </div>
          <h1
            className="press-serif"
            style={{
              fontSize: 48,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Production
          </h1>
          <p
            style={{
              maxWidth: 560,
              marginTop: 16,
              fontSize: 14,
              lineHeight: 1.6,
              color: Muted,
            }}
          >
            Tools for making artifacts that carry the work into the world.
            Studio reflects; Press produces.
          </p>
        </header>

        <div style={{ display: "grid", gap: 16 }}>
          {TOOLS.map((tool) => {
            const isLive = tool.status === "live" && tool.key;
            return (
              <button
                key={tool.label}
                type="button"
                disabled={!isLive}
                onClick={() => isLive && navigateTo(tool.key)}
                className={`press-tool-card${isLive ? " live" : ""}`}
                style={{
                  textAlign: "left",
                  padding: 24,
                  border: `1px solid ${Hairline}`,
                  backgroundColor: "transparent",
                  color: Ink,
                  cursor: isLive ? "pointer" : "default",
                  opacity: isLive ? 1 : 0.55,
                  fontFamily: "inherit",
                  display: "block",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    marginBottom: 12,
                  }}
                >
                  <div className="press-serif" style={{ fontSize: 22, fontWeight: 500 }}>
                    {tool.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: Muted,
                    }}
                  >
                    {tool.status}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: Muted,
                    marginBottom: 8,
                    fontStyle: "italic",
                  }}
                  className="press-serif"
                >
                  {tool.edition}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: Ink }}>
                  {tool.desc}
                </div>
                {isLive && (
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: Ink,
                    }}
                  >
                    Open →
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${Hairline}`,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: Muted,
          }}
        >
          Field of Action · Press
        </div>
      </div>
    </section>
  );
}
