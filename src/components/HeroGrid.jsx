import React, { useRef } from "react";
import HeroSignalGrid from "./HeroSignalGrid";
import HeroTypeField from "./HeroTypeField";
import HeroConstraintField from "./HeroConstraintField";

/* ── Hero Shell: randomly selects a composition on mount ── */

const DASH = [
  { label: "Practice", val: "Relational Design" },
  { label: "Position", val: "Design Leader\nat Apple TV" },
  { label: "Attention", val: "Consolidation → Application" },
  { label: "Building", val: "Energetic Fields" },
  { label: "Writing", val: "Themes of Authoring" },
];

// Wave 1 launch: only Hero 01 active in rotation. Others tabled for later.
const HEROES = [HeroSignalGrid];

export default function HeroGrid() {
  const chosen = useRef(HEROES[Math.floor(Math.random() * HEROES.length)]);
  const Hero = chosen.current;

  return (
    <div className="hero hero--grid en">
      {/* Dashboard strip — shared across all compositions */}
      <div className="hero-dash-grid en d1">
        {DASH.map((d, i) => (
          <div key={i} className="hero-dash-cell">
            <div className="hero-dash-label">{d.label}</div>
            <div className="hero-dash-val">{d.val.includes("\n") ? d.val.split("\n").map((l, j) => <span key={j}>{l}{j === 0 && <br />}</span>) : d.val}</div>
          </div>
        ))}
      </div>

      {/* Selected composition */}
      <Hero />
    </div>
  );
}
