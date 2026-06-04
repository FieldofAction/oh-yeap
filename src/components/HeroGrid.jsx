import React, { useRef } from "react";
import HeroSignalGrid from "./HeroSignalGrid";
import HeroTypeField from "./HeroTypeField";
import HeroConstraintField from "./HeroConstraintField";

/* ── Hero Shell: randomly selects a composition on mount ── */

// Posture strip: declarative manifest of the practice's current state.
// Cells with `href` light up as navigable on hover; the rest stay quietly declarative.
const DASH = [
  { label: "Practice", val: "Relational Design", href: "#relational-design" },
  { label: "Position", val: "Design Leader\nat Apple TV" },
  { label: "Attention", val: "Application → Transmission" },
  { label: "Building", val: "Condition Sets" },
  { label: "Writing", val: "Authoring Themes" },
  { label: "Hosting", val: "Nest · First Edition", href: "#hotel/nest" },
];

// Wave 1 launch: only Hero 01 active in rotation. Others tabled for later.
const HEROES = [HeroSignalGrid];

export default function HeroGrid({ isLight }) {
  const chosen = useRef(HEROES[Math.floor(Math.random() * HEROES.length)]);
  const Hero = chosen.current;

  return (
    <div className="hero hero--grid en">
      {/* Dashboard strip — shared across all compositions */}
      <div className="hero-dash-grid en d1">
        {DASH.map((d, i) => {
          const Tag = d.href ? "a" : "div";
          const cls = `hero-dash-cell${d.href ? " hero-dash-cell--link" : ""}`;
          return (
            <Tag key={i} className={cls} {...(d.href ? { href: d.href } : {})}>
              <div className="hero-dash-label">{d.label}</div>
              <div className="hero-dash-val">{d.val.includes("\n") ? d.val.split("\n").map((l, j) => <span key={j}>{l}{j === 0 && <br />}</span>) : d.val}</div>
            </Tag>
          );
        })}
      </div>

      {/* Selected composition */}
      <Hero isLight={isLight} />
    </div>
  );
}
