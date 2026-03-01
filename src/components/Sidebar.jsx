import React, { useState } from "react";

const NAV = [
  { tier: "WORK", items: [
    { key: "public", label: "Practice", filter: "Practice" },
    { key: "public", label: "Writing", filter: "Writing" },
    { key: "public", label: "Exploration", filter: "Exploration" },
    { key: "public", label: "Artifacts", filter: "Artifacts" },
  ]},
  { tier: "CANON", items: [
    { key: "canon", label: "Relational Design" },
  ]},
  { tier: "STUDIO", items: [
    { group: "Methods", children: [
      { key: "model", label: "Art of Model" },
      { key: "playbook", label: "Playbook" },
    ]},
    { group: "Interfaces", children: [
      { key: "console", label: "Console" },
    ]},
    { group: "Research", children: [
      { key: "lab", label: "Incandescent Lab" },
    ]},
    { group: "Archive", children: [
      { key: "backstage", label: "Backstage" },
    ]},
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

export default function Sidebar({ view, navigateTo, filter, setFilter }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (item) => {
    if (item.href) { window.open(item.href, "_blank"); return; }
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
          <span className="sb-toggle-bar" />
        </button>
        <div className="sb-brand" onClick={() => { navigateTo("public"); setFilter("All"); setMobileOpen(false); window.scrollTo(0, 0); }}>
          Field of Action
        </div>
      </div>

      <aside className={`sb${mobileOpen ? " sb-open" : ""}`}>
        {NAV.map(group => (
          <div key={group.tier} className="sb-tier">
            <div className="sb-tier-h">{group.tier}</div>
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
    </>
  );
}
