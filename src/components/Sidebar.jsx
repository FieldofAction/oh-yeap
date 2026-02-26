import React, { useState } from "react";

const NAV = [
  { tier: "WORK", items: [
    { key: "public", label: "Practice", filter: "Practice" },
    { key: "public", label: "Writing", filter: "Writing" },
    { key: "public", label: "Exploration", filter: "Exploration" },
    { key: "public", label: "Artifacts", filter: "Artifacts" },
    { key: "gallery", label: "Gallery" },
  ]},
  { tier: "STUDIO", items: [
    { key: "model", label: "Art of Model" },
    { key: "playbook", label: "Playbook" },
    { key: "console", label: "Console" },
    { key: "lab", label: "Incandescent Lab" },
    { key: "backstage", label: "Backstage" },
  ]},
  { tier: "INFO", items: [
    { key: "about", label: "About" },
    { key: "colophon", label: "Colophon" },
    { key: "philosophy", label: "Philosophy" },
    { key: "patterns", label: "Pattern Language" },
  ]},
  { tier: "EXTERNAL", items: [
    { href: "https://fieldofaction.substack.com", label: "Substack" },
    { href: "https://linkedin.com/in/danieldickson", label: "LinkedIn" },
  ]},
];

export default function Sidebar({ view, navigateTo, filter, setFilter }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (item) => {
    if (item.href) { window.open(item.href, "_blank"); return; }
    navigateTo(item.key);
    if (item.filter) setFilter(item.filter);
    else if (item.key === "public" && !item.filter) setFilter("All");
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
      <button className="sb-toggle" onClick={() => setMobileOpen(p => !p)} aria-label="Menu">
        <span className="sb-toggle-bar" />
        <span className="sb-toggle-bar" />
        <span className="sb-toggle-bar" />
      </button>

      <aside className={`sb${mobileOpen ? " sb-open" : ""}`}>
        <div className="sb-brand" onClick={() => { navigateTo("public"); setFilter("All"); setMobileOpen(false); }}>
          Field of Action
        </div>

        {NAV.map(group => (
          <div key={group.tier} className="sb-tier">
            <div className="sb-tier-h">{group.tier}</div>
            {group.items.map(item => (
              item.href ? (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="sb-link sb-external" style={{ paddingLeft: 20 }}>
                  {item.label} <span className="sb-ext-arrow">↗</span>
                </a>
              ) : (
                <button key={`${item.key}-${item.label}`} className={`sb-link${isActive(item) ? " on" : ""}`} style={{ paddingLeft: 20 + (item.indent || 0) * 16 }} onClick={() => handleNav(item)}>
                  {item.label}
                </button>
              )
            ))}
          </div>
        ))}
      </aside>

      {mobileOpen && <div className="sb-backdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
