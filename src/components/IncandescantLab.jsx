import React, { useState, useMemo } from "react";
import { AGENTS } from "../data/agents";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

export default function IncandescantLab({ asu, navigateTo }) {
  const ideas = asu.get_ideas();
  const [expandedId, setExpandedId] = useState(null);

  // Only show ideas that have at least one completed run
  const completedIdeas = useMemo(() =>
    ideas.filter(i => i.runs?.some(r => r.status === "complete")),
    [ideas]
  );

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Incandescent Lab</h1>
        <nav className="wb-actions" aria-label="Incandescent Lab">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
        </nav>
      </header>

      <div className="wb-tool-body">
        <p className="wb-body wb-measure">Finished runs from Backstage, shown as process.</p>

        {completedIdeas.length === 0 ? (
          <div className="wb-actions">
            <p className="wb-body">Nothing has finished a run yet.</p>
            <button type="button" className="wb-link" onClick={() => navigateTo?.("backstage")}>Open Backstage</button>
          </div>
        ) : (
          <div className="tl-list">
            {completedIdeas.map((idea) => {
              const lastComplete = [...(idea.runs || [])].reverse().find(r => r.status === "complete");
              if (!lastComplete) return null;
              const isOpen = expandedId === idea.id;
              return (
                <article key={idea.id} className="tl-row">
                  <button type="button" className="tl-row-open" aria-expanded={isOpen} onClick={() => toggle(idea.id)}>
                    <span className="bg-question-title">{idea.title}</span>
                    {idea.desc ? <span className="wb-body">{idea.desc}</span> : null}
                    {idea.tags?.length > 0 ? <span className="wb-body">{idea.tags.join(", ")}</span> : null}
                  </button>

                  {isOpen ? (
                    <div className="tl-row-body">
                      {lastComplete.selection.map(ak => {
                        const out = lastComplete.outputs[ak];
                        const ag = AGENTS.find(a => a.key === ak);
                        if (!ag || !out) return null;
                        return (
                          <div key={ak} className="wb-block">
                            <h3 className="wb-name">{ag.name}</h3>
                            {out.expansion ? <p className="wb-text wb-measure">{out.expansion}</p> : null}
                            {out.steps?.length > 0 ? (
                              <ol className="tl-ol">
                                {out.steps.map((st, i) => <li key={i}>{st}</li>)}
                              </ol>
                            ) : null}
                            {out.tasks?.length > 0 ? (
                              <ul className="tl-ul">
                                {out.tasks.map((t, i) => <li key={i}>{t.label}{t.status === "done" ? " (done)" : ""}</li>)}
                              </ul>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
