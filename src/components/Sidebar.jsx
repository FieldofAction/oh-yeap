import React, { useState, useEffect } from "react";

// Wave 1 launch note:
// - Practice hidden from WORK until case studies are refined (Wave 2).
// - patternlanguage.cc external link removed from REFERENCE (per launch nav decision).
// - STUDIO is password-gated; single entry in nav opens a password modal on click.
const NAV = [
  { tier: "WORK", items: [
    { key: "public", label: "Writing", filter: "Writing" },
    { key: "public", label: "Exploration", filter: "Exploration" },
    { key: "public", label: "Artifacts", filter: "Artifacts" },
    { key: "patiobeach", label: "Patio Beach" },
    { key: "superconscious", label: "Share Location" },
  ]},
  { tier: "CANON", items: [
    { key: "canon", label: "Relational Design" },
  ]},
  { tier: "STUDIO", gated: true, items: [
    { key: "studio", label: "Studio" },
  ]},
  { tier: "INFO", items: [
    { key: "about", label: "About" },
    { key: "colophon", label: "Colophon" },
  ]},
  { tier: "REFERENCE", items: [
    { key: "models", label: "Mental Models" },
    { key: "patterns", label: "Pattern Language" },
  ]},
  { tier: "EXTERNAL", items: [
    { href: "https://fieldofaction.substack.com", label: "Substack" },
    { href: "https://linkedin.com/in/danieldickson", label: "LinkedIn" },
  ]},
];

// Studio password gate.
// Session-only unlock: sessionStorage clears when the tab closes.
// Note: this password ships in the public JS bundle — it's a soft gate, not real security.
const STUDIO_PASSWORD = "M!G0S";
const STUDIO_UNLOCK_KEY = "foa_studio_unlocked";
const STUDIO_KEYS = new Set(["studio","model","playbook","console","foa","breakground","desert","backstage","editor","lab"]);

function isStudioUnlocked() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STUDIO_UNLOCK_KEY) === "1";
}

export default function Sidebar({ view, navigateTo, filter, setFilter }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(() => isStudioUnlocked());
  const [gatePending, setGatePending] = useState(null); // nav item awaiting unlock
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState(false);

  // Guard: if the current view is a studio view but unlock was cleared, bounce home.
  useEffect(() => {
    if (STUDIO_KEYS.has(view) && !unlocked) navigateTo("public");
  }, [view, unlocked, navigateTo]);

  const handleNav = (item) => {
    if (item.href) { window.open(item.href, "_blank"); return; }
    // Studio gate
    if (STUDIO_KEYS.has(item.key) && !unlocked) {
      setGatePending(item);
      setGateInput("");
      setGateError(false);
      return;
    }
    navigateTo(item.key);
    if (item.filter) { setFilter(item.filter); window.scrollTo(0, 0); }
    else if (item.key === "public" && !item.filter) { setFilter("All"); window.scrollTo(0, 0); }
    setMobileOpen(false);
  };

  const submitGate = (e) => {
    e?.preventDefault?.();
    if (gateInput === STUDIO_PASSWORD) {
      sessionStorage.setItem(STUDIO_UNLOCK_KEY, "1");
      setUnlocked(true);
      const pending = gatePending;
      setGatePending(null);
      setGateInput("");
      setGateError(false);
      if (pending) {
        navigateTo(pending.key);
        setMobileOpen(false);
      }
    } else {
      setGateError(true);
    }
  };

  const closeGate = () => {
    setGatePending(null);
    setGateInput("");
    setGateError(false);
  };

  const STUDIO_VIEWS = new Set(["studio", "model", "playbook", "console", "foa", "breakground", "desert", "backstage", "editor", "lab"]);

  const isActive = (item) => {
    if (item.href) return false;
    if (item.filter) return view === "public" && filter === item.filter;
    if (item.key === "public" && !item.filter) return view === "public" && (filter === "All" || !filter);
    if (item.key === "studio") return STUDIO_VIEWS.has(view);
    return view === item.key;
  };

  return (
    <>
      <div className="topbar">
        <button className="sb-toggle" onClick={() => setMobileOpen(p => !p)} aria-label="Menu">
          <span className="sb-toggle-bar" />
          <span className="sb-toggle-bar" />
        </button>
        <div className="sb-brand" onClick={() => { navigateTo("public"); setFilter("All"); setMobileOpen(false); window.scrollTo(0, 0); }}>
          Field of Action
        </div>
      </div>

      <aside className={`sb${mobileOpen ? " sb-open" : ""}`}>
        {NAV.map(group => (
          <div key={group.tier} className="sb-tier">
            <div className="sb-tier-h">
              {group.tier}
              {group.gated && (
                <span className="sb-lock" aria-label={unlocked ? "Studio unlocked" : "Studio locked"}>
                  {unlocked ? "○" : "●"}
                </span>
              )}
            </div>
            {group.items.map((item) => {
              /* Sub-group with children (e.g. STUDIO → Methods, Interfaces) */
              if (item.group) {
                return (
                  <div key={item.group} className="sb-group">
                    <div className="sb-group-h">{item.group}</div>
                    {item.children.map(child => (
                      <button key={`${child.key}-${child.label}`} className={`sb-link${isActive(child) ? " on" : ""}`} style={{ paddingLeft: 32 }} onClick={() => handleNav(child)}>
                        {child.label}
                      </button>
                    ))}
                  </div>
                );
              }
              /* External link */
              if (item.href) {
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="sb-link sb-external" style={{ paddingLeft: 20 }}>
                    {item.label} <span className="sb-ext-arrow">↗</span>
                  </a>
                );
              }
              /* Standard nav item */
              return (
                <button key={`${item.key}-${item.label}`} className={`sb-link${isActive(item) ? " on" : ""}`} style={{ paddingLeft: 20 }} onClick={() => handleNav(item)}>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {mobileOpen && <div className="sb-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* Studio password modal */}
      {gatePending && (
        <div className="sb-gate-overlay" onClick={closeGate}>
          <form className="sb-gate" onClick={(e) => e.stopPropagation()} onSubmit={submitGate}>
            <div className="sb-gate-label">Studio</div>
            <div className="sb-gate-title">Password required</div>
            <input
              type="password"
              autoFocus
              value={gateInput}
              onChange={(e) => { setGateInput(e.target.value); setGateError(false); }}
              onKeyDown={(e) => { if (e.key === "Escape") closeGate(); }}
              className="sb-gate-input"
              aria-label="Studio password"
              aria-invalid={gateError}
            />
            {gateError && <div className="sb-gate-error">Incorrect. Try again.</div>}
            <div className="sb-gate-actions">
              <button type="button" className="sb-gate-btn sb-gate-btn--ghost" onClick={closeGate}>Cancel</button>
              <button type="submit" className="sb-gate-btn">Unlock</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
