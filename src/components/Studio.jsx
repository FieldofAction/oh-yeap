import React from "react";

const TOOLS = [
  { key: "model", label: "Art of Model", desc: "Interactive synthesis engine for designing meaningful intervention." },
  { key: "playbook", label: "Playbook", desc: "4 pillars, 6 emotional registers, 23 references, 7 steps." },
  { key: "console", label: "Console", desc: "7 laws diagram with 21 pair mechanics." },
  { key: "foa", label: "FOA Generator", desc: "Generate Field of Action outputs from system prompts." },
  { key: "breakground", label: "Breakground", desc: "Card-based exploration and breakground compositions." },
  { key: "desert", label: "Desert", desc: "Visual environment for desert compositions." },
  { key: "backstage", label: "Backstage", desc: "Idea composer with 8-agent pipeline." },
  { key: "editor", label: "Exploration Editor", desc: "Draft and enrich exploration entries." },
  { key: "lab", label: "Incandescent Lab", desc: "Process exhibitions from completed runs." },
];

export default function Studio({ navigateTo }) {
  return (
    <section className="studio-landing en">
      <header className="studio-header">
        <div className="studio-overtitle">Studio</div>
        <h1 className="studio-title">Workbench</h1>
        <p className="studio-subtitle">Methods, interfaces, and research tools.</p>
      </header>

      <div className="studio-grid">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.key}
            className={`studio-card en d${Math.min(i + 1, 5)}`}
            onClick={() => navigateTo(tool.key)}
          >
            <div className="studio-card-label">{tool.label}</div>
            <div className="studio-card-desc">{tool.desc}</div>
            <span className="studio-card-arrow">&rarr;</span>
          </button>
        ))}
      </div>
    </section>
  );
}
