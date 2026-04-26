import React, { useState } from "react";

// Public-facing sidebar.
// Studio entry is a plain external link to the gated studio subdomain.
// No password gate, no STUDIO_PASSWORD, no STUDIO_KEYS — auth happens at the edge.
const STUDIO_URL = "https://studio.fieldofaction.org";

const NAV = [
  { tier: "WORK", items: [
    { key: "public", label: "Writing", filter: "Writing" },
    { key: "public", label: "Exploration", filter: "Exploration" },
    { key: "public", label: "Artifacts", filter: "Artifacts" },
    { key: "patiobeach", label: "Patio Beach" },
    { key: "superconscious", label: "Share Location" },
  ]},
  { tier: "HOTEL", items: [
    { key: "hotelnest", label: "Nest" },
  ]},
  { tier: "CANON", items: [
    { key: "canon", label: "Relational Design" },
  ]},
  { tier: "STUDIO", external: true, items: [
    { href: STUDIO_URL, label: "Studio", studio: true },
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
    { href: "https://substack.com/@adickson", label: "Substack" },
    { href: "https://linkedin.com/in/alfred-daniel-dickson-ii-5803423", label: "LinkedIn" },
  ]},
];

export default function PublicSidebar({ view, navigateTo, filter, setFilter }) {
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
          Field of Action
        </div>
      </div>

      <aside className={`sb${mobileOpen ? " sb-open" : ""}`}>
        {NAV.map(group => (
          <div key={group.tier} className="sb-tier">
            <div className="sb-tier-h">
              {group.tier}
              {group.external && (
                <span className="sb-lock" aria-label="Studio is private">●</span>
              )}
            </div>
            {group.items.map((item) => {
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
    </>
  );
}
