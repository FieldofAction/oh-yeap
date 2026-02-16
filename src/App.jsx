import React, { useState, useMemo, useCallback } from "react";
import { THEMES } from "./data/themes";
import { SEED, uid, VIS } from "./data/seed";
import useASUStore from "./store/useASUStore";
import Public from "./components/Public";
import ArtOfModel from "./components/ArtOfModel";
import Playbook from "./components/Playbook";
import Backstage from "./components/Backstage";
import WritingDetail from "./components/details/WritingDetail";
import CaseStudyDetail from "./components/details/CaseStudy";
import SketchbookDetail from "./components/details/Sketchbook";
import SpecSheetDetail from "./components/details/SpecSheet";
import TheoryDetail from "./components/details/TheoryDetail";

function cv(t) {
  return {
    "--bg": t.bg, "--fg": t.fg, "--fm": t.fm, "--ff": t.ff,
    "--bd": t.bd, "--sf": t.sf, "--sfh": t.sfh, "--cbg": t.cbg, "--ch": t.ch,
  };
}

export default function App() {
  const [view, setView] = useState("public");
  const [themeKey, setThemeKey] = useState("threshold");
  const [content, setContent] = useState(SEED);
  const [filter, setFilter] = useState("All");
  const [relFilter, setRelFilter] = useState(null);
  const [egg, setEgg] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [closing, setClosing] = useState(false);
  const asu = useASUStore();
  const theme = THEMES[themeKey];

  // Easter egg: press "?" to reveal system condition overlay
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) setEgg(p => !p);
      if (e.key === "Escape") {
        setEgg(false);
        setRelFilter(null);
        if (activeItem) {
          setClosing(true);
          setTimeout(() => { setActiveItem(null); setClosing(false) }, 300);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeItem]);

  const filtered = useMemo(() => {
    let items = content.filter(c => c.status !== "draft");
    if (relFilter) {
      items = items.filter(c =>
        c.title === relFilter || c.relations?.includes(relFilter) ||
        c.tags?.includes(relFilter)
      );
    } else if (filter !== "All") {
      items = items.filter(c => c.section.toLowerCase() === filter.toLowerCase());
    }
    return items;
  }, [content, filter, relFilter]);

  const handleRelation = useCallback((name) => {
    setFilter("All");
    setRelFilter(prev => prev === name ? null : name);
  }, []);
  const handleFilter = useCallback((f) => {
    setRelFilter(null);
    setFilter(f);
  }, []);
  const openItem = useCallback((item) => {
    if (item.body || item.caseStudy || item.sketch || item.spec || item.theory) {
      setActiveItem(item);
      window.scrollTo(0, 0);
    }
  }, []);
  const closeItem = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setActiveItem(null); setClosing(false); }, 300);
  }, []);
  const handlePublish = useCallback((item) => {
    setContent(prev => {
      const exists = prev.find(c => c.title === item.title);
      if (exists) return prev.map(c => c.id === exists.id ? { ...c, ...item } : c);
      return [{ ...item, id: uid() }, ...prev];
    });
  }, []);

  return (
    <div style={cv(theme)}>
      <nav className="nav">
        <span className="nav-m" onClick={() => { setView("public"); setRelFilter(null); }}>Field Intelligence</span>
        <div className="nav-r">
          <button className={`nl ${view === "public" ? "on" : ""}`} onClick={() => setView("public")}>Work</button>
          <button className={`nl ${view === "model" ? "on" : ""}`} onClick={() => setView("model")}>Art of Model</button>
          <button className={`nl ${view === "playbook" ? "on" : ""}`} onClick={() => setView("playbook")}>Playbook</button>
          <button className={`nl ${view === "backstage" ? "on" : ""}`} onClick={() => setView("backstage")}>Backstage</button>
        </div>
      </nav>
      {view === "public" && <Public items={filtered} filter={filter} setFilter={handleFilter} relFilter={relFilter} onRelation={handleRelation} theme={theme} nowState={asu.get_system_condition()} onOpen={openItem} />}
      {view === "model" && <ArtOfModel asu={asu} />}
      {view === "playbook" && <Playbook asu={asu} />}
      {view === "backstage" && <Backstage content={content} themeKey={themeKey} onThemeChange={setThemeKey} onPublish={handlePublish} asu={asu} />}

      {/* Writing detail overlay */}
      {activeItem && activeItem.body && !activeItem.caseStudy && !activeItem.sketch && <WritingDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onRelation={handleRelation} onOpen={openItem} fg={theme.fg} />}

      {/* Case study detail overlay */}
      {activeItem && activeItem.caseStudy && <CaseStudyDetail item={activeItem} closing={closing} onClose={closeItem} fg={theme.fg} />}

      {/* Exploration sketchbook overlay */}
      {activeItem && activeItem.sketch && <SketchbookDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onOpen={openItem} fg={theme.fg} />}

      {/* Theory detail overlay */}
      {activeItem && activeItem.theory && <TheoryDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onOpen={openItem} onRelation={handleRelation} fg={theme.fg} />}

      {/* Artifact spec sheet overlay */}
      {activeItem && activeItem.spec && !activeItem.sketch && !activeItem.theory && <SpecSheetDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onOpen={openItem} fg={theme.fg} />}

      {/* Easter egg overlay — press ? to toggle */}
      {egg && (
        <div style={{ position: "fixed", bottom: 40, left: 40, right: 40, zIndex: 200, background: "var(--sf)", border: "1px solid var(--bd)", padding: 24, fontFamily: "var(--sans)", fontSize: 11, color: "var(--fm)", lineHeight: 1.8, maxWidth: 480, animation: "en .3s ease" }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ff)", marginBottom: 8 }}>System Condition</div>
          <div><strong style={{ color: "var(--fg)" }}>{asu.get_system_condition().condition}</strong> · Reading {asu.get_system_condition().reading} · Building {asu.get_system_condition().building} · At {asu.get_system_condition().working}</div>
          <div style={{ marginTop: 12, fontSize: 10, color: "var(--ff)" }}>8 agents · {content.length} artifacts · {content.filter(c => c.status === "live").length} live</div>
          <div style={{ marginTop: 8, fontSize: 9, color: "var(--ff)", fontStyle: "italic" }}>Press ? to close · Esc to clear</div>
        </div>
      )}
    </div>
  );
}
