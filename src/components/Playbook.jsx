import React, { useState, useMemo, useEffect } from "react";
import { PILLARS, EMOTIONS, REFS, STEPS, EMO_MAP } from "../data/playbook-data";
import { useSignalSession, downloadText, slug, sessionOutput } from "../lib/signal-session";
import SessionActions from "./SessionActions";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

export default function Playbook({ asu, navigateTo }) {
  const project = asu.get_project_brief();
  const pillars = asu.get_pillar_targets();
  const emotion = asu.get_emotional_system().emotion;
  const app = asu.store.playbook.application;
  const dominant = asu.get_dominant_pillar();
  const [steps, setSteps] = useState(() => STEPS.map(()=>false));
  const [showExport, setShowExport] = useState(false);

  const exportText = useMemo(() => {
    const lines = [
      `PROJECT BRIEF: ${project.name || "Untitled"}`,
      `Client: ${project.client || "—"}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `FIELD OF ACTION METHOD`,
      `Framework: System, Scenography, Soul, Relational Design`,
      `"Blending systematic clarity, scenographic spectacle, soulful atmosphere,`,
      `and relational design to build worlds that are both disciplined and alive."`,
      ``,
      `BRIEF`,
      project.brief || "—",
      ``,
      `PILLAR TARGETS`,
      ...PILLARS.map(p => `  ${p.label}: ${pillars[p.key]}/100`),
      `  Dominant: ${dominant.label}. ${dominant.desc}`,
      ``,
      `EMOTIONAL SYSTEM: ${emotion || "—"}`,
      ``,
      `APPLICATION`,
      `  Big Move: ${app.bigMove || "—"}`,
      `  Whimsy: ${app.whimsy || "—"}`,
      `  Connection: ${app.connection || "—"}`,
      ``,
      `CHECKLIST`,
      ...STEPS.map((s,i)=>`  [${steps[i]?"✓":" "}] ${s.title}: ${s.desc}`),
      ``,
      `REFERENCE MATRIX`,
      ...REFS.map(r => `  ${r.name}: ${r.principle}`),
      ``,
      `Field of Action`,
    ];
    return lines.join("\n");
  }, [project, pillars, emotion, app, steps, dominant]);

  // A signal carried in from the Workbench is what this brief is for.
  const session = useSignalSession(asu, "playbook", "Playbook");
  const carriedText = session.carried?.text || "";
  useEffect(() => {
    // Seed the brief with the signal, but never over something already written.
    if (carriedText && !project.brief?.trim()) asu.set_project_brief({ brief: carriedText });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sessionTitle = project.name?.trim() || carriedText || "Playbook brief";
  const hasBrief = !!(project.name?.trim() || project.brief?.trim());
  const bankSession = () => session.bank({
    title: sessionTitle,
    key: `playbook:${session.carried?.signalId || "own"}:${slug(project.name, "brief")}`,
    output: sessionOutput({
      title: sessionTitle,
      fields: [
        { label: "Client", value: project.client },
        { label: "Brief", value: project.brief },
        { label: "Pillars", value: PILLARS.map(p => `${p.label} ${pillars[p.key]}`).join(", ") + `. ${dominant.label} leads.` },
        { label: "Emotional register", value: emotion },
        { label: "The big move", value: app.bigMove },
        { label: "The whimsy detail", value: app.whimsy },
        { label: "How it fosters connection", value: app.connection },
      ],
    }),
  });
  const download = () => downloadText(`${slug(project.name, "project")}-brief.txt`, exportText, "text/plain");
  const APPLICATION_FIELDS = {
    3: ["bigMove", "The big move"],
    4: ["whimsy", "The whimsy detail"],
    5: ["connection", "How it fosters connection"],
  };
  const RINGS = [
    { name: "Operational cycle", agents: [
      {name:"Field",input:"Phenomena, signals, patterns",action:"Senses signals in the environment and translates into frameworks"},
      {name:"Works in Progress",input:"Emerging ideas, raw material",action:"Investigates, prototypes, and structures into working models"},
      {name:"Action",input:"Structured ideas, briefs",action:"Produces concrete artifacts: systems, interfaces, objects"},
      {name:"Cache",input:"Completed artifacts, narrative",action:"Preserves as durable, portable, stand-alone forms"},
      {name:"Atlas",input:"Archive, accumulated work",action:"Maps relationships, lineages, and recurring patterns"},
      {name:"Grace",input:"Artifacts ready for release",action:"Determines placement: audience, timing, channel, conditions"},
      {name:"Open",input:"Unresolved questions, tensions",action:"Holds what has not yet taken form, emergence space"},
    ], cycle: "Field senses, then Works in Progress structures. Action produces, then Cache preserves. Atlas maps, then Grace places. Open holds emergence, and the cycle begins again." },
    { name: "Practice layer", agents: [
      {name:"Art Practice",input:"Concepts, aesthetic material",action:"Sustains experimentation and personal mastery"},
      {name:"Hotel",input:"Lifestyle cues, objects",action:"Produces lifestyle artifacts and experiential environments"},
    ], cycle: "Art Practice experiments, then Hotel materializes." },
    { name: "Governance layer", agents: [
      {name:"CLSSM",input:"Deep patterns, axioms",action:"Generates conceptual primitives and structural source"},
      {name:"Freedom Embassy",input:"System proposals, direction",action:"Establishes governance and system boundaries"},
    ], cycle: "CLSSM generates primitives, then Freedom Embassy governs." },
  ];

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Playbook</h1>
        <nav className="wb-actions" aria-label="Playbook">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
        </nav>
      </header>

      <div className="wb-tool-body">
        <p className="wb-text wb-measure">Field of Action Method is my approach to design: blending systematic clarity, scenographic spectacle, soulful atmosphere, and relational design to build worlds that are both disciplined and alive.</p>

        <div className="tl-section">
          <h2 className="bg-question-title">Project brief</h2>
          <div className="tl-form">
            <div className="wb-signal">
              <label htmlFor="pb-name" className="wb-label">Project name</label>
              <input id="pb-name" className="wb-field" value={project.name} onChange={e=>asu.set_project_brief({name:e.target.value})} autoComplete="off" />
            </div>
            <div className="wb-signal">
              <label htmlFor="pb-client" className="wb-label">Client</label>
              <input id="pb-client" className="wb-field" value={project.client} onChange={e=>asu.set_project_brief({client:e.target.value})} autoComplete="off" />
            </div>
          </div>
          <div className="wb-signal">
            <label htmlFor="pb-brief" className="wb-label">The ask, the constraints, and what success looks like</label>
            <textarea id="pb-brief" className="wb-field tl-area" rows={4} value={project.brief} onChange={e=>asu.set_project_brief({brief:e.target.value})} />
          </div>
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">Where should this project sit across the four pillars?</h2>
          <div className="tl-sliders">
            {PILLARS.map(p => (
              <div key={p.key} className="tl-slider">
                <label htmlFor={`pb-pillar-${p.key}`} className="wb-name">{p.label}</label>
                <input id={`pb-pillar-${p.key}`} type="range" className="tl-range" style={{ "--p": pillars[p.key] }} min="0" max="100" value={pillars[p.key]} onChange={e=>asu.set_pillar_targets({[p.key]:parseInt(e.target.value)})} />
                <output htmlFor={`pb-pillar-${p.key}`} className="wb-body">{pillars[p.key]}</output>
              </div>
            ))}
          </div>
          <p className="wb-body wb-measure">{dominant.label} leads. {dominant.desc}</p>
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">What emotional register should it carry?</h2>
          <div className="wb-segments tl-segments tl-segments-wrap" role="group" aria-label="Emotional register">
            {EMOTIONS.map(e => (
              <button key={e} type="button" className="wb-segment" aria-pressed={emotion===e} onClick={()=>asu.set_emotional_system(emotion===e?"":e)}>{e}</button>
            ))}
          </div>
          {emotion ? <p className="wb-body wb-measure">{EMO_MAP[emotion]}</p> : null}
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">Applying it</h2>
          <div className="tl-list">
            {STEPS.map((s,i) => (
              <div key={i} className="tl-row">
                <label className="wb-check">
                  <input type="checkbox" checked={!!steps[i]} onChange={()=>setSteps(p=>{const n=[...p];n[i]=!n[i];return n})} />
                  <span className="wb-name">{s.title}</span>
                </label>
                <p className="wb-body tl-indent">{s.desc}</p>
                {APPLICATION_FIELDS[i] ? (
                  <div className="wb-signal tl-indent">
                    <label htmlFor={`pb-app-${i}`} className="wb-label">{APPLICATION_FIELDS[i][1]}</label>
                    <input id={`pb-app-${i}`} className="wb-field" value={app[APPLICATION_FIELDS[i][0]]} onChange={e=>asu.set_application({[APPLICATION_FIELDS[i][0]]:e.target.value})} autoComplete="off" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="tl-section">
          <div className="wb-actions">
            <button type="button" className="wb-link" aria-expanded={showExport} onClick={()=>setShowExport(p=>!p)}>{showExport ? "Hide the summary" : "Show the summary"}</button>
            <button type="button" className="wb-link" onClick={()=>navigator.clipboard?.writeText(exportText)}>Copy the summary</button>
          </div>
          {showExport ? <pre className="tl-code">{exportText}</pre> : null}
          <SessionActions onBank={hasBrief ? bankSession : null} onDownload={download} downloadLabel="Download as text" bankedTo={session.bankedTo} navigateTo={navigateTo} />
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">The four pillars</h2>
          <div className="tl-list">
            <div className="tl-pair"><span className="wb-name">System</span><span className="wb-body">Clarity of structure, proportion, and function.</span></div>
            <div className="tl-pair"><span className="wb-name">Scenography</span><span className="wb-body">Immersive staging and monumental spectacle.</span></div>
            <div className="tl-pair"><span className="wb-name">Soul</span><span className="wb-body">Emotional registers that create atmosphere and resonance.</span></div>
            <div className="tl-pair"><span className="wb-name">Relational</span><span className="wb-body">Choreography of connection: how people, agents, and environments interact.</span></div>
          </div>
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">Agents as action systems</h2>
          <p className="wb-body wb-measure">Each agent is a pavilion inside the larger ecosystem. They don't just hold an identity. They act on inputs and expand them. Inputs are never static. They are constantly acted upon, reframed, and elevated.</p>
          {RINGS.map((ring) => (
            <div key={ring.name} className="wb-block">
              <h3 className="wb-name tl-subhead">{ring.name}</h3>
              <div className="tl-list">
                {ring.agents.map((a) => (
                  <div key={a.name} className="tl-triple">
                    <span className="wb-name">{a.name}</span>
                    <span className="wb-body">{a.input}</span>
                    <span className="wb-body">{a.action}</span>
                  </div>
                ))}
              </div>
              <p className="wb-body wb-measure">{ring.cycle}</p>
            </div>
          ))}
        </div>

        <div className="tl-section">
          <h2 className="bg-question-title">References</h2>
          <div className="tl-list">
            {REFS.map((r,i) => (
              <div key={i} className="tl-triple">
                <span className="wb-name">{r.name}</span>
                <span className="wb-body">{r.principle}</span>
                <span className="wb-body">{r.tactic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
