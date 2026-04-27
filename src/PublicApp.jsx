import React, { useState, useMemo, useCallback, useEffect } from "react";
import { THEMES } from "./data/themes";
import { SEED, isHidden } from "./data/seed";
import usePublicSystemCondition from "./hooks/usePublicSystemCondition";
import useExplorationStore from "./store/useExplorationStore";
import Public from "./components/Public";
import Models from "./components/Models";
import SiteFooter from "./components/SiteFooter";
import PublicSidebar from "./components/PublicSidebar";
import About from "./components/About";
import Colophon from "./components/Colophon";
import Canon from "./components/Canon";
import PatternLanguage from "./components/PatternLanguage";
import PatioBeach from "./components/PatioBeach";
import Superconscious from "./components/Superconscious";
import HotelNest from "./components/HotelNest";
import { DualLensToggle, DualLensBar } from "./components/PatternLens";
import WritingDetail from "./components/details/WritingDetail";
import CaseStudyDetail from "./components/details/CaseStudy";
import SketchbookDetail from "./components/details/Sketchbook";
import SpecSheetDetail from "./components/details/SpecSheet";
import TheoryDetail from "./components/details/TheoryDetail";

// Public bundle — no Studio views, no ASU store, no agent prompts.
// Studio lives at studio.fieldofaction.org behind Vercel auth.

const VIEW_TO_HASH = {
  patiobeach: "patio-beach",
  superconscious: "share-location",
  canon: "relational-design",
  about: "about",
  colophon: "colophon",
  models: "mental-models",
  patterns: "pattern-language",
  hotelnest: "hotel/nest",
};
const HASH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_HASH).map(([view, hash]) => [hash, view])
);
const PUBLIC_VIEWS = new Set([
  "public", "patiobeach", "superconscious", "canon", "about",
  "colophon", "models", "patterns", "hotelnest",
]);
const viewFromHash = () => {
  const hash = typeof window !== "undefined"
    ? window.location.hash.replace(/^#\/?/, "")
    : "";
  const target = HASH_TO_VIEW[hash] || "public";
  return PUBLIC_VIEWS.has(target) ? target : "public";
};

const WORK_VIEWS = new Set(["public", "superconscious", "patiobeach"]);
const CANON_VIEWS = new Set(["canon"]);
const INFO_VIEWS = new Set(["about", "colophon"]);
const themeForView = (v) =>
  WORK_VIEWS.has(v) ? "threshold" :
  CANON_VIEWS.has(v) ? "canon" :
  INFO_VIEWS.has(v) ? "info" : "light";

function cv(t) {
  return {
    "--bg": t.bg, "--fg": t.fg, "--fm": t.fm, "--ff": t.ff,
    "--bd": t.bd, "--sf": t.sf, "--sfh": t.sfh, "--cbg": t.cbg, "--ch": t.ch,
    "--ac1": t.ac1, "--ac2": t.ac2,
  };
}

export default function PublicApp() {
  const [view, setView] = useState(() => viewFromHash());
  const [themeKey, setThemeKey] = useState(() => themeForView(viewFromHash()));
  const [filter, setFilter] = useState("All");
  const [relFilter, setRelFilter] = useState(null);
  const [egg, setEgg] = useState(false);
  const [lens, setLens] = useState(false);
  const [patternLens, setPatternLens] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [closing, setClosing] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const explorationStore = useExplorationStore();
  const nowState = usePublicSystemCondition();

  const enrichedActiveItem = useMemo(() => {
    if (!activeItem?.sketch) return activeItem;
    const merged = explorationStore.getExploration(activeItem.title);
    return merged || activeItem;
  }, [activeItem, explorationStore]);

  const theme = THEMES[themeKey];
  const toggleLens = useCallback(() => setLens(p => !p), []);
  const togglePatternLens = useCallback(() => setPatternLens(p => !p), []);

  const navigateTo = useCallback((target) => {
    if (target === view && !transitioning) return;
    setTransitioning(true);
    setThemeKey(themeForView(target));
    setTimeout(() => {
      setView(target);
      window.scrollTo(0, 0);
      setTransitioning(false);
      const hash = VIEW_TO_HASH[target] || "";
      const desired = hash ? `#${hash}` : "";
      if (window.location.hash !== desired) {
        const url = hash ? desired : window.location.pathname + window.location.search;
        window.history.pushState(null, "", url);
      }
    }, 200);
  }, [view, transitioning]);

  useEffect(() => {
    const handler = () => {
      const target = viewFromHash();
      if (target === view) return;
      setThemeKey(themeForView(target));
      setView(target);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", handler);
    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("hashchange", handler);
    };
  }, [view]);

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
    }, 100);
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [view, filter, relFilter]);

  React.useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) setEgg(p => !p);
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !isInput) setLens(p => !p);
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !isInput) setPatternLens(p => !p);
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

  // Hidden-from-public items (Wave-1 practice + per-item `hidden: true`) are excluded from production builds.
  // Dev (`npm run dev`) shows everything so unfinished pages can be previewed locally; visual indicators
  // distinguish hidden material — see HIDDEN-ITEMS.md.
  const publicContent = useMemo(
    () => SEED.filter(c => import.meta.env.DEV || !isHidden(c)),
    []
  );

  // Per-section counts of hidden items, used to drive dev-only nav + section-header indicators.
  // Empty object in production (no indicators rendered).
  const hiddenCounts = useMemo(() => {
    if (!import.meta.env.DEV) return {};
    return SEED.reduce((acc, c) => {
      if (isHidden(c)) acc[c.section] = (acc[c.section] || 0) + 1;
      return acc;
    }, {});
  }, []);

  const filtered = useMemo(() => {
    let items = publicContent.filter(c => c.status !== "draft");
    if (relFilter) {
      items = items.filter(c =>
        c.title === relFilter || c.relations?.includes(relFilter) ||
        c.tags?.includes(relFilter)
      );
    } else if (filter !== "All") {
      items = items.filter(c => c.section.toLowerCase() === filter.toLowerCase());
    }
    return items;
  }, [publicContent, filter, relFilter]);

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

  return (
    <div style={cv(theme)} className="app-layout">
      <PublicSidebar view={view} navigateTo={navigateTo} filter={filter} setFilter={handleFilter} hiddenCounts={hiddenCounts} />
      <div className="app-content">
        <DualLensBar modelActive={lens} patternActive={patternLens} onToggleModel={toggleLens} onTogglePattern={togglePatternLens} onOpenModels={() => navigateTo("models")} onOpenPatterns={() => navigateTo("patterns")} />
        <main className={`view-wrap${transitioning ? " view-leaving" : ""}`}>
          {view === "public" && <Public items={filtered} allItems={publicContent} filter={filter} setFilter={handleFilter} relFilter={relFilter} onRelation={handleRelation} theme={theme} nowState={nowState} onOpen={openItem} lens={lens} patternLens={patternLens} showGraph={showGraph} hiddenCounts={hiddenCounts} />}
          {view === "models" && <Models content={publicContent} onOpen={openItem} fg={theme.fg} />}
          {view === "about" && <About theme={theme} />}
          {view === "colophon" && <Colophon />}
          {view === "canon" && <Canon />}
          {view === "patterns" && <PatternLanguage content={publicContent} onOpen={openItem} fg={theme.fg} />}
          {view === "patiobeach" && <PatioBeach />}
          {view === "superconscious" && <Superconscious />}
          {view === "hotelnest" && <HotelNest />}
        </main>

        <SiteFooter />
      </div>

      {activeItem && activeItem.body && !activeItem.caseStudy && !activeItem.sketch && <WritingDetail item={activeItem} allItems={publicContent} closing={closing} onClose={closeItem} onRelation={handleRelation} onOpen={openItem} fg={theme.fg} lens={lens} patternLens={patternLens} />}
      {activeItem && activeItem.caseStudy && <CaseStudyDetail item={activeItem} closing={closing} onClose={closeItem} fg={theme.fg} lens={lens} patternLens={patternLens} />}
      {activeItem && activeItem.sketch && <SketchbookDetail item={enrichedActiveItem} allItems={publicContent} closing={closing} onClose={closeItem} onOpen={openItem} fg={theme.fg} lens={lens} patternLens={patternLens} />}
      {activeItem && activeItem.theory && <TheoryDetail item={activeItem} allItems={publicContent} closing={closing} onClose={closeItem} onOpen={openItem} onRelation={handleRelation} fg={theme.fg} lens={lens} patternLens={patternLens} />}
      {activeItem && activeItem.spec && !activeItem.sketch && !activeItem.theory && <SpecSheetDetail item={activeItem} allItems={publicContent} closing={closing} onClose={closeItem} onOpen={openItem} fg={theme.fg} lens={lens} patternLens={patternLens} />}

      {view !== "models" && view !== "patterns" && <DualLensToggle modelActive={lens} patternActive={patternLens} onToggleModel={toggleLens} onTogglePattern={togglePatternLens} />}

      {egg && (
        <div className="egg-overlay" style={{ position: "fixed", bottom: 20, left: 20, right: 20, zIndex: 200, background: "var(--sf)", border: "1px solid var(--bd)", padding: 20, fontFamily: "var(--sans)", fontSize: 11, color: "var(--fm)", lineHeight: 1.8, maxWidth: 480, animation: "en .3s ease" }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ff)", marginBottom: 8 }}>System Condition</div>
          <div><strong style={{ color: "var(--fg)" }}>{nowState.condition}</strong> · Reading {nowState.reading} · Building {nowState.building} · At {nowState.working}</div>
          <div style={{ marginTop: 12, fontSize: 10, color: "var(--ff)" }}>11 agents · {publicContent.length} artifacts · {publicContent.filter(c => c.status === "live").length} live · {lens ? "Model Lens on" : "Model Lens off"} · {patternLens ? "Pattern Lens on" : "Pattern Lens off"}</div>
          <div style={{ marginTop: 8, fontSize: 9, color: "var(--ff)", fontWeight: 300 }}>Press ? to close · M for model lens · P for pattern lens · G for connections · Esc to clear</div>
        </div>
      )}
    </div>
  );
}
