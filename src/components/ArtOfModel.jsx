import React, { useState, useMemo, useCallback } from "react";
import { AOM_VERSIONS } from "../data/aom-versions";
import { PILLARS } from "../data/playbook-data";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

export default function ArtOfModel({ asu, navigateTo }) {
  const settings = asu.get_settings();
  const aomState = asu.get_art_of_model();
  const ver = aomState.activeVersion || "v3";
  const responses = aomState.responses;
  const model = AOM_VERSIONS[ver];
  const [synthesizing, setSynthesizing] = useState(false);

  const r = responses[ver] || {};
  const inputSteps = model.steps.filter(s => s.ph);
  const allFilled = inputSteps.every(s => r[s.n]?.trim());
  const synthesis = aomState.synthesis[ver];

  const isUnlocked = useCallback((idx) => {
    if (idx === 0) return true;
    const prev = model.steps[idx - 1];
    return prev.ph ? !!(r[prev.n]?.trim()) : true;
  }, [model, r]);

  const runSynthesis = useCallback(async () => {
    if (!allFilled || synthesizing) return;
    setSynthesizing(true);
    const stepsText = inputSteps.filter(s => r[s.n]).map(s => `${s.title} (${s.layer}): ${r[s.n]}`).join("\n");
    const prompt = `You are analyzing responses to The Art of Model (${ver}): "${model.subtitle}"${model.shift ? ` (${model.shift})` : ""}.

The user has completed all steps:
${stepsText}

Write a synthesis that:
1. Identifies the throughline across all their answers
2. Names the core tension or opportunity
3. Suggests what this means for their next move
4. Connects their thinking to a concrete direction

Be direct, specific to their answers, and avoid generic advice. Write 3-4 sentences. Do not use bullet points.

Respond with ONLY the synthesis text, no preamble.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json","x-api-key":settings.apiKey,"anthropic-version":settings.anthropicVersion,"anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({ model:settings.model, max_tokens:500, messages:[{role:"user",content:prompt}] }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      const text = d.content?.map(b => b.text||"").join("") || "";
      asu.set_aom_synthesis(ver, text);
    } catch(err) {
      asu.set_aom_synthesis(ver, `Synthesis unavailable. ${err.message}. Your completed model is still stored and feeding into the Playbook and Backstage.`);
    }
    setSynthesizing(false);
  }, [allFilled, synthesizing, model, ver, r, asu, inputSteps]);

  const exportText = useMemo(() => {
    const lines = [
      `THE ART OF MODEL: ${ver.toUpperCase()}`, model.subtitle,
      model.shift ? `(${model.shift})` : "", `Date: ${new Date().toLocaleDateString()}`, ``,
      ...model.steps.flatMap(s => [`${s.n}. ${s.title}`, s.question ? `   Q: ${s.question}` : "", r[s.n] ? `   A: ${r[s.n]}` : `   A: —`, `   Layer: ${s.layer}`, ``]),
      `Flow: ${model.flow.join(" → ")}`, ``,
      synthesis ? `SYNTHESIS\n${synthesis}\n` : "", `Field of Action`,
    ];
    return lines.filter(l => l !== "").join("\n");
  }, [ver, r, model, synthesis]);

  const VERSION_NAMES = { v1: "Intervention", v2: "Authorship", v3: "Infrastructure" };
  const VERSION_LINES = {
    v1: "Artifact-focused. Responsible act. Make something.",
    v2: "Field-focused. Sustainable signal. Become something.",
    v3: "Identity-focused. Recursive system. Run something.",
  };
  const download = () => {
    const b = new Blob([exportText], { type: "text/plain" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `art-of-model-${ver}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  };

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Art of Model</h1>
        <nav className="wb-actions" aria-label="Art of Model">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
        </nav>
      </header>

      <div className="wb-tool-body">
        <div className="wb-block">
          <h2 className="wb-headline">{model.subtitle}</h2>
          {model.shift ? <p className="wb-body">{model.shift.replace(/\s*→\s*/g, " to ")}</p> : null}
        </div>

        <div className="wb-block">
          <div className="wb-segments tl-segments" role="group" aria-label="Version">
            {Object.keys(AOM_VERSIONS).map((k) => (
              <button key={k} type="button" className="wb-segment" aria-pressed={ver === k} onClick={() => asu.set_aom_version(k)}>{VERSION_NAMES[k] || k}</button>
            ))}
          </div>
          <p className="wb-body">{VERSION_LINES[ver]}</p>
        </div>

        <div className="bg-questions">
          {model.steps.map((s, idx) => {
            const unlocked = isUnlocked(idx);
            const id = `aom-${ver}-${s.n}`;
            return (
              <div key={id} className={`bg-question${unlocked ? "" : " tl-locked"}`}>
                <label htmlFor={s.ph && unlocked ? id : undefined} className="bg-question-title">{s.title}</label>
                {s.question ? <p className="wb-text">{s.question}</p> : null}
                <p className="wb-body">{s.body}</p>
                {s.mapped ? <p className="wb-body">Mapped to {s.mapped}.</p> : null}
                {!unlocked ? <p className="wb-body">Answer the step before this one to open it.</p> : null}
                {s.ph && unlocked ? (
                  <textarea id={id} className="bg-question-input tl-textarea" placeholder={s.ph} value={r[s.n] || ""} onChange={(e) => asu.set_aom_response(ver, s.n, e.target.value)} />
                ) : null}
              </div>
            );
          })}
        </div>

        {allFilled ? (
          <div className="wb-block">
            <h2 className="wb-name">Synthesis</h2>
            {synthesizing ? <p className="wb-body" role="status">Reading your answers.</p> : null}
            {synthesis && !synthesizing ? <p className="wb-text wb-measure">{synthesis}</p> : null}
            {synthesis && !synthesizing ? <p className="wb-body wb-measure">This synthesis and your answers now feed Playbook and Backstage.</p> : null}
            <div className="wb-actions">
              <button type="button" className="wb-button" onClick={runSynthesis} disabled={synthesizing}>{synthesis ? "Generate it again" : "Generate the synthesis"}</button>
            </div>
          </div>
        ) : null}

        <div className="wb-actions">
          <button type="button" className="wb-link" onClick={() => navigator.clipboard?.writeText(exportText)}>Copy as text</button>
          <button type="button" className="wb-link" onClick={download}>Download as text</button>
        </div>
      </div>
    </section>
  );
}
