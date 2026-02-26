import React from "react";

const MAIN_LINKS = [
  { key:"public", label:"Work" },
  { key:"model", label:"Art of Model" },
  { key:"playbook", label:"Playbook" },
  { key:"backstage", label:"Backstage" },
  { key:"models", label:"Models" },
];

const SUB_LINKS = [
  { key:"about", label:"About" },
  { key:"colophon", label:"Colophon" },
  { key:"philosophy", label:"Philosophy" },
  { key:"patterns", label:"Pattern Language" },
];

export default function SiteFooter({ view, setView }) {
  const go = (key) => { setView(key); window.scrollTo(0,0); };
  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-nav">
          <div className="ft-col">
            <div className="ft-col-h">Sections</div>
            {MAIN_LINKS.map(l => (
              <button key={l.key} className={`ft-link${view === l.key ? " on" : ""}`} onClick={() => go(l.key)}>{l.label}</button>
            ))}
          </div>
          <div className="ft-col">
            <div className="ft-col-h">Information</div>
            {SUB_LINKS.map(l => (
              <button key={l.key} className={`ft-link${view === l.key ? " on" : ""}`} onClick={() => go(l.key)}>{l.label}</button>
            ))}
            <a href="https://substack.com/@adickson/posts" target="_blank" rel="noopener noreferrer" className="ft-link">Substack</a>
            <a href="https://linkedin.com/in/alfred-daniel-dickson-ii-5803423" target="_blank" rel="noopener noreferrer" className="ft-link">LinkedIn</a>
          </div>
        </div>
        <div className="ft-bar">
          <span>Field of Action</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
}
