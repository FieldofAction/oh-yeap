import React, { useState } from "react";
import { DEV_MODE } from "../lib/devMode";

// Public-facing sidebar.
// Studio entry is a plain external link to the gated studio subdomain.
// No password gate, no STUDIO_PASSWORD, no STUDIO_KEYS — auth happens at the edge.
// The drawer is the short path: practice, writing, the model, about, and a way to write.
// Spaces, Hotel, models, patterns, and the workshop live in the footer notebook.
// In dev, Exploration stays here so hidden work can still be opened.
const NAV = [
  { tier: "WORK", items: [
    { key: "public", label: "Practice", filter: "Practice" },
    { key: "public", label: "Writing", filter: "Writing" },
    ...(DEV_MODE ? [{ key: "public", label: "Exploration", filter: "Exploration" }] : []),
    { key: "canon", label: "Relational Design" },
    { key: "about", label: "About" },
  ]},
  { tier: "WRITE", items: [
    { href: "https://substack.com/@adickson", label: "Substack" },
    { href: "https://linkedin.com/in/alfred-daniel-dickson-ii-5803423", label: "LinkedIn" },
  ]},
];

export default function PublicSidebar({ view, navigateTo, filter, setFilter, hiddenCounts = {} }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (item) => {
    if (item.href) { window.open(item.href, item.studio ? "_self" : "_blank"); return; }
    navigateTo(item.key);
    if (item.filter) { setFilter(item.filter); window.scrollTo(0, 0); }
    else if (item.key === "public" && !item.filter) { setFilter("All"); window.scrollTo(0, 0); }
    setMobileOpen(false);
  };

  const isActive = (item) => {
    if (item.href) return false;
    if (item.filter) return view === "public" && filter === item.filter;
    if (item.key === "public" && !item.filter) return view === "public" && (filter === "All" || !filter);
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
          <span className="sb-brand-logo" role="img" aria-label="Field of Action" />
          <span className="sb-brand-tagline">Professional research notebook<br />of Alfred (Daniel) Dickson II</span>
        </div>
      </div>

      <aside className={`sb${mobileOpen ? " sb-open" : ""}`}>
        {NAV.map(group => (
          <div key={group.tier} className="sb-tier">
            <div className="sb-tier-h">
              {group.tier}
              {group.external && (
                <span className="sb-lock" aria-label="Workshop is private">●</span>
              )}
            </div>
            {group.items.map((item) => {
              if (item.group) {
                return (
                  <div key={item.group} className="sb-group">
                    <div className="sb-group-h sb-group-h-lc">{item.group}</div>
                    {item.children.map(child => {
                      // Same-origin static pages (e.g. the World Cup Atlas) load full-page via an anchor,
                      // so middle-click / open-in-new-tab work and no SPA view key is needed.
                      if (child.href) {
                        return (
                          <a
                            key={child.label}
                            href={child.href}
                            className="sb-link"
                            style={{ paddingLeft: 20 }}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </a>
                        );
                      }
                      const childKey = child.filter?.toLowerCase();
                      const childHidden = childKey ? (hiddenCounts[childKey] || 0) : 0;
                      return (
                        <button
                          key={`${child.key}-${child.label}`}
                          className={`sb-link${child.filter ? " sb-link-filter" : ""}${isActive(child) ? " on" : ""}${childHidden ? " sb-link-has-hidden" : ""}`}
                          style={{ paddingLeft: 20 }}
                          onClick={() => handleNav(child)}
                          title={childHidden ? `${childHidden} hidden in dev` : undefined}
                        >
                          {child.filter && <span className="sb-link-dot" aria-hidden="true">·</span>}
                          {child.label}
                          {childHidden ? <span className="sb-link-hidden-count" aria-hidden="true">{childHidden}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              }
              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.studio ? "_self" : "_blank"}
                    rel={item.studio ? undefined : "noopener noreferrer"}
                    className="sb-link sb-external"
                    style={{ paddingLeft: 20 }}
                  >
                    {item.label} <span className="sb-ext-arrow">↗</span>
                  </a>
                );
              }
              const sectionKey = item.filter?.toLowerCase();
              const hiddenInSection = sectionKey ? (hiddenCounts[sectionKey] || 0) : 0;
              return (
                <button key={`${item.key}-${item.label}`} className={`sb-link${item.filter ? " sb-link-filter" : ""}${isActive(item) ? " on" : ""}${hiddenInSection ? " sb-link-has-hidden" : ""}`} style={{ paddingLeft: 20 }} onClick={() => handleNav(item)} title={hiddenInSection ? `${hiddenInSection} hidden in dev` : undefined}>
                  {item.filter && <span className="sb-link-dot" aria-hidden="true">·</span>}
                  {item.label}
                  {hiddenInSection ? <span className="sb-link-hidden-count" aria-hidden="true">{hiddenInSection}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {mobileOpen && <div className="sb-backdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
