import React from "react";

const WRITE = [
  { href: "https://substack.com/@adickson", label: "Substack" },
  { href: "https://linkedin.com/in/alfred-daniel-dickson-ii-5803423", label: "LinkedIn" },
];

export default function About() {
  return (
    <div className="ab en">
      <div className="ab-header en d1">
        <div className="ab-pre">Alfred (Daniel) Dickson II</div>
        <h1 className="ab-h">About</h1>
      </div>

      <div className="ab-section en d2">
        <p className="ab-display">
          I design structure for living systems. The work is Relational Design: staying with the relationships between people, tools, signals, and constraints long enough that a decision can still be traced to what produced it.
        </p>
        <p className="ab-body">
          Field of Action is the notebook where I keep the experiments, the models, and the writing. The model is on the Relational Design page. The proof is in the practice. The memos are where the thinking takes its time.
        </p>
      </div>

      <div className="ab-section en d3">
        <div className="ab-sl">Practice</div>
        <p className="ab-body">
          I have done this at Apple Music, at Google Cloud, at Vevo, and at the Tribeca Festival: design systems, product surfaces, brand, and the experience of a cultural institution. I am based in Los Angeles.
        </p>
      </div>

      <div className="ab-section en d4">
        <div className="ab-sl">Write</div>
        <p className="ab-body ab-write">
          {WRITE.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}
