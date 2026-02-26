import React, { useState, useMemo } from "react";
import { AGENTS } from "../data/agents";

export default function IncandescantLab({ asu }) {
  const ideas = asu.get_ideas();
  const [expandedId, setExpandedId] = useState(null);

  // Only show ideas that have at least one completed run
  const completedIdeas = useMemo(() =>
    ideas.filter(i => i.runs?.some(r => r.status === "complete")),
    [ideas]
  );

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="il en">
      <div className="il-header dc dc1">
        <h1 className="il-title">Incandescent Lab</h1>
        <p className="il-sub">Behind the scenes of the creative process — completed idea runs from the Backstage pipeline, exhibited as process artifacts.</p>
      </div>

      {completedIdeas.length === 0 ? (
        <div className="il-empty dc dc2">
          <div className="il-empty-icon">◇</div>
          <p>No completed runs yet.</p>
          <p className="il-empty-hint">Head to Backstage to run ideas through the agent pipeline. Completed runs appear here as process exhibitions.</p>
        </div>
      ) : (
        <div className="il-grid">
          {completedIdeas.map((idea, idx) => {
            const lastComplete = [...(idea.runs || [])].reverse().find(r => r.status === "complete");
            if (!lastComplete) return null;
            const isOpen = expandedId === idea.id;
            const agentCount = lastComplete.selection?.length || 0;
            const runCount = idea.runs.filter(r => r.status === "complete").length;

            return (
              <div key={idea.id} className={`il-card dc${isOpen ? " il-card-open" : ""}`} style={{ animationDelay: `${0.15 + idx * 0.06}s` }}>
                <div className="il-card-head" onClick={() => toggle(idea.id)}>
                  <div className="il-card-info">
                    <div className="il-card-title">{idea.title}</div>
                    {idea.desc && <div className="il-card-desc">{idea.desc}</div>}
                    <div className="il-card-meta">
                      <span>{agentCount} agent{agentCount !== 1 ? "s" : ""}</span>
                      <span className="il-meta-sep">·</span>
                      <span>{runCount} run{runCount !== 1 ? "s" : ""}</span>
                      {lastComplete.mode && lastComplete.mode !== "free" && (
                        <><span className="il-meta-sep">·</span><span>{lastComplete.mode}</span></>
                      )}
                    </div>
                  </div>
                  <span className={`il-card-arrow${isOpen ? " open" : ""}`}>↓</span>
                </div>

                {idea.tags?.length > 0 && (
                  <div className="il-card-tags">
                    {idea.tags.map(t => <span key={t} className="card-tg">{t}</span>)}
                  </div>
                )}

                {isOpen && (
                  <div className="il-card-body">
                    {lastComplete.selection.map(ak => {
                      const out = lastComplete.outputs[ak];
                      const ag = AGENTS.find(a => a.key === ak);
                      if (!ag || !out) return null;
                      return (
                        <div key={ak} className="il-agent-block">
                          <div className="il-agent-name">{ag.name}</div>
                          {out.expansion && <p className="il-agent-exp">{out.expansion}</p>}
                          {out.steps?.length > 0 && (
                            <div className="il-agent-section">
                              <div className="il-agent-section-h">Plan</div>
                              <ol className="il-agent-steps">
                                {out.steps.map((s, i) => <li key={i}>{s}</li>)}
                              </ol>
                            </div>
                          )}
                          {out.tasks?.length > 0 && (
                            <div className="il-agent-section">
                              <div className="il-agent-section-h">Tasks</div>
                              {out.tasks.map((t, i) => (
                                <div key={i} className="il-agent-task">
                                  <span className="il-task-status">{t.status === "done" ? "✓" : "○"}</span>
                                  <span>{t.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
