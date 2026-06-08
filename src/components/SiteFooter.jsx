import React from "react";

/* Maker's mark — FOA grid ecology glyph (public/images/foa/foa_grid_ecology.svg).
   Rendered as a CSS mask so it inherits the footer color (var(--ff)). */
function Mark() {
  return <span className="ft-mark" role="img" aria-label="Field of Action mark" />;
}

export default function SiteFooter() {
  return (
    <footer className="ft">
      <div className="ft-inner">
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
