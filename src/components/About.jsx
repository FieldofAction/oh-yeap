import React from "react";
import { AGENTS, RING_LABELS } from "../data/agents";
import { AOM_VERSIONS } from "../data/aom-versions";

/* extract a concise role from each agent's prompt (first sentence after "Your role is") */
function agentRole(prompt) {
  const m = prompt.match(/Your (?:role|orientation) is ([^.—]+)/);
  return m ? m[1].trim() : "";
}

export default function About({ theme }) {
  return (
    <div className="ab en">
      <div className="ab-header en d1">
        <div className="ab-pre">Field of Action</div>
        <h1 className="ab-h">About</h1>
        <p className="ab-sub">Position + Practice</p>
      </div>

      {/* Position — moved from Public.jsx ethos */}
      <div className="ab-section en d2">
        <div className="ab-sl">Position</div>
        <p className="ab-display">
          A creative director working at the intersection of design systems, relational theory, and emerging technology. Building conditions for coherence across brand, product, and culture.
        </p>
        <p className="ab-body">
          The work moves between applied design leadership and theoretical research. Current focus: how relational awareness reshapes what design can be, from outputs to field conditions.
        </p>
      </div>

      {/* Background */}
      <div className="ab-section en d3">
        <div className="ab-sl">Background</div>
        <p className="ab-body">
          Nearly two decades across music, technology, entertainment, and culture. Design systems and product surfaces at Apple Music. Cloud infrastructure identity at Google. Brand-building at Vevo during its formative era. Experience design and visual identity for the Tribeca Festival.
        </p>
        <p className="ab-body">
          Based in Los Angeles, CA. Working under the studio name Field of Action.
        </p>
      </div>

      {/* Practice */}
      <div className="ab-section en d4">
        <div className="ab-sl">Practice</div>
        <p className="ab-body">
          Field of Action engages where a real system exists, a real constraint is present, and responsibility is held.
        </p>
        <p className="ab-body">
          The practice evolves through three frameworks. The Art of Model began as a tool for designing meaningful intervention, then deepened into a system for generative authorship, and is now becoming an operating system for generative identity. Each version represents a shift: from acting on a system, to authoring within one, to becoming infrastructure.
        </p>
        <p className="ab-body" style={{ marginTop:20 }}>
          <span style={{ fontFamily:"var(--display)", fontWeight:300, color:"var(--fg)" }}>v1: Intervention.</span>{" "}
          {AOM_VERSIONS.v1.subtitle}<br/>
          <span style={{ fontFamily:"var(--display)", fontWeight:300, color:"var(--fg)" }}>v2: Authorship.</span>{" "}
          {AOM_VERSIONS.v2.subtitle}<br/>
          <span style={{ fontFamily:"var(--display)", fontWeight:300, color:"var(--fg)" }}>v3: Infrastructure.</span>{" "}
          {AOM_VERSIONS.v3.subtitle}
        </p>
      </div>

      {/* Agents */}
      <div className="ab-section en d5">
        <div className="ab-sl">Field of Action</div>
        <p className="ab-body" style={{ marginBottom:24 }}>
          An eleven-agent architecture organized in three rings: an operational cycle for production and interpretation, a practice layer for creative vitality, and a governance layer for structural authority. Each agent holds a distinct orientation on the same input.
        </p>
        <div className="ab-agents">
          {[1,2,3].map(ring => (
            <React.Fragment key={ring}>
              <div className="ab-ring-label">{RING_LABELS[ring].name}</div>
              {AGENTS.filter(a => a.ring === ring).map(a => (
                <div key={a.key} className="ab-agent">
                  <div className="ab-agent-name">{a.name}</div>
                  <div className="ab-agent-role">{agentRole(a.prompt)}</div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* CTA — moved from Public.jsx */}
      <div className="cta">
        <p className="cta-p">Field of Action engages where a real system exists, a real constraint is present, and responsibility is held.</p>
        <a href="#" className="cta-a">Begin a conversation &rarr;</a>
      </div>
    </div>
  );
}
