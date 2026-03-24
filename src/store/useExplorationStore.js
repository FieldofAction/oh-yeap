import { useState, useCallback, useEffect } from "react";
import { SEED } from "../data/seed";

const STORAGE_KEY = "foa-explorations";

/* ── Helpers ── */
const uid = () => `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const today = () => {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveOverrides(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ── Get base explorations from SEED ── */
function getBaseExplorations() {
  return SEED.filter(item => item.section === "exploration" && item.sketch);
}

/* ── Merge: base SEED + localStorage overrides ── */
function mergeExplorations(overrides) {
  const base = getBaseExplorations();
  const merged = base.map(item => {
    const ov = overrides[item.title];
    if (!ov) return item;
    return {
      ...item,
      status: ov.status ?? item.status,
      sketch: {
        ...item.sketch,
        hypothesis: ov.hypothesis ?? item.sketch.hypothesis,
        fragments: [...item.sketch.fragments, ...(ov.addedFragments || [])],
        openQuestions: (ov.questions ?? item.sketch.openQuestions.map(q =>
          typeof q === "string" ? { text: q, status: "open" } : q
        )),
        connections: [...item.sketch.connections, ...(ov.addedConnections || [])],
      },
    };
  });

  // Add brand-new explorations from localStorage
  if (overrides.__new) {
    merged.push(...overrides.__new);
  }

  return merged;
}

/* ── Normalize questions from seed format (string[]) to object format ── */
function normalizeQuestions(questions) {
  return questions.map(q =>
    typeof q === "string" ? { text: q, status: "open" } : q
  );
}

/* ── Hook ── */
export default function useExplorationStore() {
  const [overrides, setOverrides] = useState(loadOverrides);

  useEffect(() => {
    saveOverrides(overrides);
  }, [overrides]);

  const explorations = mergeExplorations(overrides);

  const getExploration = useCallback((title) => {
    return explorations.find(e => e.title === title);
  }, [explorations]);

  /* ── Mutations ── */

  const addFragment = useCallback((title, fragment) => {
    setOverrides(prev => {
      const ov = { ...prev };
      if (!ov[title]) ov[title] = {};
      if (!ov[title].addedFragments) ov[title].addedFragments = [];
      ov[title].addedFragments = [...ov[title].addedFragments, {
        ...fragment,
        date: fragment.date || today(),
        _added: Date.now(),
      }];
      return { ...ov };
    });
  }, []);

  const updateHypothesis = useCallback((title, text) => {
    setOverrides(prev => ({
      ...prev,
      [title]: { ...prev[title], hypothesis: text },
    }));
  }, []);

  const updateStatus = useCallback((title, status) => {
    setOverrides(prev => ({
      ...prev,
      [title]: { ...prev[title], status },
    }));
  }, []);

  const addQuestion = useCallback((title, questionText) => {
    setOverrides(prev => {
      const ov = { ...prev };
      if (!ov[title]) ov[title] = {};
      // Get current questions (either from overrides or normalized from seed)
      const base = getBaseExplorations().find(e => e.title === title);
      const current = ov[title]?.questions || normalizeQuestions(base?.sketch?.openQuestions || []);
      ov[title].questions = [...current, { text: questionText, status: "open" }];
      return { ...ov };
    });
  }, []);

  const resolveQuestion = useCallback((title, index, resolution) => {
    setOverrides(prev => {
      const ov = { ...prev };
      if (!ov[title]) ov[title] = {};
      const base = getBaseExplorations().find(e => e.title === title);
      const current = [...(ov[title]?.questions || normalizeQuestions(base?.sketch?.openQuestions || []))];
      if (current[index]) {
        current[index] = {
          ...current[index],
          status: resolution.status, // "resolved" | "reframed" | "absorbed"
          note: resolution.note,
          date: today(),
        };
      }
      ov[title].questions = current;
      return { ...ov };
    });
  }, []);

  const addConnection = useCallback((title, connection) => {
    setOverrides(prev => {
      const ov = { ...prev };
      if (!ov[title]) ov[title] = {};
      if (!ov[title].addedConnections) ov[title].addedConnections = [];
      ov[title].addedConnections = [...ov[title].addedConnections, connection];
      return { ...ov };
    });
  }, []);

  const createExploration = useCallback((data) => {
    setOverrides(prev => {
      const ov = { ...prev };
      if (!ov.__new) ov.__new = [];
      ov.__new = [...ov.__new, {
        id: uid(),
        section: "exploration",
        title: data.title,
        subtitle: data.subtitle || "",
        desc: data.desc || "",
        year: "Active",
        status: "seed",
        tags: data.tags || [],
        relations: [],
        hasVisual: false,
        sketch: {
          hypothesis: data.hypothesis || "",
          fragments: [],
          openQuestions: [],
          connections: [],
        },
      }];
      return { ...ov };
    });
  }, []);

  /* ── Export ── */
  const exportJSON = useCallback(() => {
    const data = mergeExplorations(overrides);
    const clean = data.map(e => ({
      title: e.title,
      subtitle: e.subtitle,
      desc: e.desc,
      year: e.year,
      status: e.status,
      tags: e.tags,
      relations: e.relations,
      sketch: {
        hypothesis: e.sketch.hypothesis,
        fragments: e.sketch.fragments.map(f => {
          const { _added, ...rest } = f;
          return rest;
        }),
        openQuestions: e.sketch.openQuestions.map(q =>
          typeof q === "string" ? q : q.status === "open" ? q.text : q
        ),
        connections: e.sketch.connections,
      },
    }));
    return JSON.stringify(clean, null, 2);
  }, [overrides]);

  const downloadJSON = useCallback(() => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explorations-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON]);

  return {
    explorations,
    getExploration,
    addFragment,
    updateHypothesis,
    updateStatus,
    addQuestion,
    resolveQuestion,
    addConnection,
    createExploration,
    exportJSON,
    downloadJSON,
  };
}
