import React from "react";

/* Maker's mark — FOA grid ecology glyph, circle-less variant for small sizes
   (public/images/foa/foa_grid_ecology_mark.svg).
   Rendered as a CSS mask so it inherits the footer color (var(--ff)). */
function Mark() {
  return <span className="ft-mark" role="img" aria-label="Field of Action mark" />;
}

// Dates are the ones the work actually closed or shipped. No status is implied
// by sitting in this list. The current items are named as current.
const NOTES = [
  { label: "Experiments", href: "/experiments", state: "Current", date: "September 2026" },
  { label: "Oz Index", href: "/oz-index", state: "Current", date: "September 2026" },
  { label: "World Cup Atlas", href: "/world-cup-atlas", state: "Finished study", date: "Spain, 19 July 2026" },
  { label: "Nest", href: "#hotel/nest", view: "hotelnest", state: "Printed edition", date: "Closed 8 May 2026" },
  { label: "Patio Beach", href: "#patio-beach", view: "patiobeach", state: "Archive", date: "Source of the Nest edition" },
  { label: "Share Location", href: "#share-location", view: "superconscious", state: "Archive" },
  { label: "Bloom", href: "#bloom", view: "flowers", state: "Instrument" },
  { label: "Galaxy", href: "#galaxy", view: "galaxy", state: "Instrument", date: "June 2026" },
  { label: "Mental Models", href: "#mental-models", view: "models", state: "Reference" },
  { label: "Pattern Language", href: "#pattern-language", view: "patterns", state: "Reference" },
  { label: "Colophon", href: "#colophon", view: "colophon", state: "Site" },
  { label: "Workshop", href: "https://studio.fieldofaction.org", state: "Private" },
  { label: "Archive", href: "https://daniel-dickson.org/", state: "Earlier work", external: true },
];

export default function SiteFooter({ view }) {
  return (
    <footer className="ft">
      <div className="ft-inner">
        <nav className="ft-notes" aria-label="Notebook">
          <div className="ft-notes-h">Notebook</div>
          <ul>
            {NOTES.map((item) => {
              const on = item.view && item.view === view;
              const external = Boolean(item.external);
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={on ? "on" : undefined}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span className="ft-notes-name">{item.label}</span>
                    <span className="ft-notes-meta">
                      {item.state}{item.date ? ` · ${item.date}` : ""}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ft-bar">
          <span className="ft-left">
            <Mark />
            <span>Field of Action</span>
          </span>
          <span>© 2026 Daniel Dickson</span>
        </div>
      </div>
    </footer>
  );
}
