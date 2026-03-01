import React, { useState, useMemo, useCallback, useEffect } from "react";
import { THEMES } from "./data/themes";
import { SEED, uid, VIS } from "./data/seed";
import useASUStore from "./store/useASUStore";
import Public from "./components/Public";
import ArtOfModel from "./components/ArtOfModel";
import Playbook from "./components/Playbook";
import Backstage from "./components/Backstage";
import Models from "./components/Models";
import SiteFooter from "./components/SiteFooter";
import Sidebar from "./components/Sidebar";
import About from "./components/About";
import Colophon from "./components/Colophon";
import Canon from "./components/Canon";
import PatternLanguage from "./components/PatternLanguage";
import FieldConsole from "./components/FieldConsole";
import IncandescantLab from "./components/IncandescantLab";
import { PatternLensToggle, PatternLensBar } from "./components/PatternLens";
import WritingDetail from "./components/details/WritingDetail";
import CaseStudyDetail from "./components/details/CaseStudy";
import SketchbookDetail from "./components/details/Sketchbook";
import SpecSheetDetail from "./components/details/SpecSheet";
import TheoryDetail from "./components/details/TheoryDetail";

function cv(t) {
  return {
    "--bg": t.bg, "--fg": t.fg, "--fm": t.fm, "--ff": t.ff,
    "--bd": t.bd, "--sf": t.sf, "--sfh": t.sfh, "--cbg": t.cbg, "--ch": t.ch,
    "--ac1": t.ac1, "--ac2": t.ac2,
  };
}

export default function App() {
  const [view, setView] = useState("public");
  const [themeKey, setThemeKey] = useState("threshold");
  const [content, setContent] = useState(SEED);
  const [filter, setFilter] = useState("All");
  const [relFilter, setRelFilter] = useState(null);
  const [egg, setEgg] = useState(false);
  const [lens, setLens] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [closing, setClosing] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const asu = useASUStore();
  const theme = THEMES[themeKey];
  const toggleLens = useCallback(() => setLens(p => !p), []);

  // View-to-theme mapping: Work = dark, Canon = deep slate, Studio = light, Info = medium grey
  const WORK_VIEWS = useMemo(() => new Set(["public"]), []);
  const CANON_VIEWS = useMemo(() => new Set(["canon"]), []);
  const INFO_VIEWS = useMemo(() => new Set(["about", "colophon"]), []);

  // Page transition — fade out, swap, fade in, auto-switch theme
  const navigateTo = useCallback((target) => {
    if (target === view && !transitioning) return;
    const nextTheme = WORK_VIEWS.has(target) ? "threshold" : CANON_VIEWS.has(target) ? "canon" : INFO_VIEWS.has(target) ? "info" : "light";
    setTransitioning(true);
    setThemeKey(nextTheme);
    setTimeout(() => {
      setView(target);
      window.scrollTo(0, 0);
      setTransitioning(false);
    }, 200);
  }, [view, transitioning, WORK_VIEWS, CANON_VIEWS, INFO_VIEWS]);

  // Scroll-reveal observer — watches .reveal elements, adds .revealed on intersect
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    const timer = setTimeout(() => {
      document.querySelectorAll(".reveal:not(.revealed)").forEach(el => obs.observe(el));
    }, 100); // slight delay so mount animations finish first
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [view, filter, relFilter]);

  // Easter eggs: press "?" for system condition, "M" for model lens, "G" for connections graph
  React.useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) setEgg(p => !p);
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !isInput) setLens(p => !p);
      if ((e.key === "g" || e.key === "G") && !e.ctrlKey && !e.metaKey && !isInput) setShowGraph(p => !p);
      if (e.key === "Escape") {
        setEgg(false);
        setShowGraph(false);
        setRelFilter(null);
        if (activeItem) {
          setClosing(true);
          setTimeout(() => { setActiveItem(null); setClosing(false) }, 200);
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
    setTimeout(() => { setActiveItem(null); setClosing(false); }, 200);
  }, []);
  const handlePublish = useCallback((item) => {
    setContent(prev => {
      const exists = prev.find(c => c.title === item.title);
      if (exists) return prev.map(c => c.id === exists.id ? { ...c, ...item } : c);
      return [{ ...item, id: uid() }, ...prev];
    });
  }, []);

  return (
    <div style={cv(theme)} className="app-layout">
      <Sidebar view={view} navigateTo={navigateTo} filter={filter} setFilter={handleFilter} />
      <div className="app-content">
        <PatternLensBar active={lens} onToggle={toggleLens} onOpenModels={() => navigateTo("models")} />
        <main className={`view-wrap${transitioning ? " view-leaving" : ""}`}>
          {view === "public" && <Public items={filtered} allItems={content} filter={filter} setFilter={handleFilter} relFilter={relFilter} onRelation={handleRelation} theme={theme} nowState={asu.get_system_condition()} onOpen={openItem} lens={lens} showGraph={showGraph} />}
          {view === "model" && <ArtOfModel asu={asu} />}
          {view === "playbook" && <Playbook asu={asu} />}
          {view === "backstage" && <Backstage content={content} themeKey={themeKey} onThemeChange={setThemeKey} onPublish={handlePublish} asu={asu} />}
          {view === "models" && <Models content={content} onOpen={openItem} fg={theme.fg} />}
          {view === "about" && <About theme={theme} />}
          {view === "colophon" && <Colophon />}
          {view === "canon" && <Canon />}
          {view === "console" && <FieldConsole />}
          {view === "lab" && <IncandescantLab asu={asu} />}
          {view === "patterns" && <PatternLanguage content={content} onOpen={openItem} fg={theme.fg} />}
        </main>

          <SiteFooter />
      </div>

      {/* Writing detail overlay */}
      {activeItem && activeItem.body && !activeItem.caseStudy && !activeItem.sketch && <WritingDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onRelation={handleRelation} onOpen={openItem} fg={theme.fg} lens={lens} />}

      {/* Case study detail overlay */}
      {activeItem && activeItem.caseStudy && <CaseStudyDetail item={activeItem} closing={closing} onClose={closeItem} fg={theme.fg} lens={lens} />}

      {/* Exploration sketchbook overlay */}
      {activeItem && activeItem.sketch && <SketchbookDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onOpen={openItem} fg={theme.fg} lens={lens} />}

      {/* Theory detail overlay */}
      {activeItem && activeItem.theory && <TheoryDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onOpen={openItem} onRelation={handleRelation} fg={theme.fg} lens={lens} />}

      {/* Artifact spec sheet overlay */}
      {activeItem && activeItem.spec && !activeItem.sketch && !activeItem.theory && <SpecSheetDetail item={activeItem} allItems={content} closing={closing} onClose={closeItem} onOpen={openItem} fg={theme.fg} lens={lens} />}

      {/* Pattern lens toggle — floating 71 button */}
      {view !== "models" && <PatternLensToggle active={lens} onToggle={toggleLens} />}

      {/* Easter egg overlay — press ? to toggle */}
      {egg && (
        <div className="egg-overlay" style={{ position: "fixed", bottom: 20, left: 20, right: 20, zIndex: 200, background: "var(--sf)", border: "1px solid var(--bd)", padding: 20, fontFamily: "var(--sans)", fontSize: 11, color: "var(--fm)", lineHeight: 1.8, maxWidth: 480, animation: "en .3s ease" }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ff)", marginBottom: 8 }}>System Condition</div>
          <div><strong style={{ color: "var(--fg)" }}>{asu.get_system_condition().condition}</strong> · Reading {asu.get_system_condition().reading} · Building {asu.get_system_condition().building} · At {asu.get_system_condition().working}</div>
          <div style={{ marginTop: 12, fontSize: 10, color: "var(--ff)" }}>8 agents · {content.length} artifacts · {content.filter(c => c.status === "live").length} live · {lens ? "Model Lens on" : "Model Lens off"}</div>
          <div style={{ marginTop: 8, fontSize: 9, color: "var(--ff)", fontWeight: 300 }}>Press ? to close · M for model lens · G for connections · Esc to clear</div>
        </div>
      )}
    </div>
  );
}
