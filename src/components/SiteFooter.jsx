import React from "react";

/* Maker's mark — geometric FOA monogram.
   Three overlapping circles (system / structure / action)
   with the initials F·O·A subtly embedded. */
function Mark() {
  return (
    <svg
      className="ft-mark"
      viewBox="0 0 48 48"
      width="28"
      height="28"
      aria-label="Field of Action mark"
    >
      {/* Three interlocking circles — atlas / grace / open rings */}
      <circle cx="19" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity=".6" />
      <circle cx="29" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity=".6" />
      <circle cx="24" cy="29" r="12" fill="none" stroke="currentColor" strokeWidth="1" opacity=".6" />
      {/* Center dot — the convergence point */}
      <circle cx="24" cy="23" r="1.5" fill="currentColor" opacity=".5" />
    </svg>
  );
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
