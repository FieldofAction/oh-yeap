import React from "react";
import { AOM_VERSIONS } from "../data/aom-versions";

export default function About({ theme }) {
  return (
    <div className="ab en">
      <div className="ab-header en d1">
        <div className="ab-pre">Field of Action</div>
        <h1 className="ab-h">About</h1>
        <p className="ab-sub">Position + Practice</p>
      </div>

      {/* Position */}
      <div className="ab-section en d2">
        <div className="ab-sl">Position</div>
        <p className="ab-body">
          Design leadership and generative research as one practice. Twenty years building across entertainment and technology. Toward the conditions that make coherent action possible. Current focus: how relational awareness reshapes what design can be and what it should be for.
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

      {/* Infrastructure */}
      <div className="ab-section en d5">
        <div className="ab-sl">Infrastructure</div>
        <p className="ab-body">
          The practice runs on an eleven-agent architecture organized in three rings. An operational cycle for production and interpretation. A practice layer for creative vitality. A governance layer for structural authority. Each agent holds a distinct orientation on the same input.
        </p>
      </div>

      {/* CTA */}
      <div className="cta">
        <p className="cta-p">Field of Action engages where a real system exists, a real constraint is present, and responsibility is held.</p>
        <a href="https://fieldofaction.substack.com" className="cta-a">Begin a conversation &rarr;</a>
      </div>
    </div>
  );
}
