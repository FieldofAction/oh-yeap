import React, { useState } from "react";
import { AGENTS_PUBLIC, RING_LABELS } from "../data/agents-public";
import { AOM_PUBLIC } from "../data/aom-versions-public";

const V_LABEL = { fontFamily: "var(--display)", fontWeight: 300, color: "var(--fg)" };

export default function About({ theme }) {
  const [showAgents, setShowAgents] = useState(false);

  return (
    <div className="ab en">
      <div className="ab-header en d1">
        <div className="ab-pre">Alfred (Daniel) Dickson II</div>
        <h1 className="ab-h">About</h1>
        <p className="ab-sub">Position + Practice</p>
      </div>

      {/* Position */}
      <div className="ab-section en d2">
        <div className="ab-sl">Position</div>
        <p className="ab-display">
          Alfred is a design leader working across systems, brand, product surfaces, and emerging technology.
        </p>
        <p className="ab-body">
          His practice combines design leadership, generative research, and systems thinking to shape conditions for clearer decisions, stronger collaboration, and coherent creative output. He builds frameworks that help ideas move into action without losing contact with the conditions that produced them.
        </p>
        <p className="ab-body">
          His current focus is Relational Design: a way of working with the relationships between people, tools, signals, constraints, and forms.
        </p>
      </div>

      {/* About */}
      <div className="ab-section en d3">
        <div className="ab-sl">About</div>
        <p className="ab-body">
          Field of Action is an independent creative practice by Alfred (Daniel) Dickson II.
        </p>
        <p className="ab-body">
          It is a place for experiments, models, instruments, and writing around condition-first design, relational systems, and creative authorship. The work is made for its own sake: to study how ideas move through systems, decisions stay connected to origin, and creative practice can become a form of infrastructure.
        </p>
      </div>

      {/* Background */}
      <div className="ab-section en d4">
        <div className="ab-sl">Background</div>
        <p className="ab-body">
          Alfred's work spans music, technology, entertainment, film and culture.
        </p>
        <p className="ab-body">
          He has shaped design systems, product surfaces, and brand expression at Apple Music; cloud infrastructure identity at Google; brand-building at Vevo during its formative era; and experience design and visual identity for the Tribeca Festival.
        </p>
        <p className="ab-body">
          He is based in Los Angeles, California.
        </p>
      </div>

      {/* Practice */}
      <div className="ab-section en d5">
        <div className="ab-sl">Practice</div>
        <p className="ab-body">
          Field of Action is where I work through real systems, real constraints, and the responsibility that comes with them.
        </p>
        <p className="ab-body">
          The practice evolves through three frameworks. The Art of Model began as a tool for designing meaningful intervention, then deepened into a system for generative authorship, and is now becoming an operating system for generative identity. Each version represents a shift: from acting on a system, to authoring within one, to becoming infrastructure.
        </p>
        <p className="ab-body" style={{ marginTop: 20 }}>
          <span style={V_LABEL}>v1: Intervention.</span>{" "}
          {AOM_PUBLIC.v1.subtitle}<br/>
          <span style={V_LABEL}>v2: Authorship.</span>{" "}
          {AOM_PUBLIC.v2.subtitle}<br/>
          <span style={V_LABEL}>v3: Infrastructure.</span>{" "}
          {AOM_PUBLIC.v3.subtitle}
        </p>
      </div>

      {/* Infrastructure */}
      <div className="ab-section en d5">
        <div className="ab-sl">Infrastructure</div>
        <p className="ab-body" style={{ cursor: "pointer" }} onClick={() => setShowAgents(p => !p)}>
          The practice runs on an eleven-agent architecture organized in three rings. An operational cycle for production and interpretation. A practice layer for creative vitality. A governance layer for coherence. Each agent holds a distinct orientation on the same input.
        </p>
        {showAgents && (
          <div className="ab-agents" style={{ animation: "en .4s ease" }}>
            {[1,2,3].map(ring => (
              <React.Fragment key={ring}>
                <div className="ab-ring-label">{RING_LABELS[ring].name}</div>
                {AGENTS_PUBLIC.filter(a => a.ring === ring).map(a => (
                  <div key={a.key} className="ab-agent">
                    <div className="ab-agent-name">{a.name}</div>
                    <div className="ab-agent-role">{a.role}</div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
