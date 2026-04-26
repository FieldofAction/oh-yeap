import { useEffect, useState } from "react";

// Reads only the `system` slice from the asu-store localStorage entry.
// Public bundle uses this for the hero strip ("Currently at / Reading / Building")
// without importing AGENTS, PILLARS, AOM_VERSIONS, or any other Studio data.
const STORAGE_KEY = "asu-store";
const DEFAULT_SYSTEM = {
  condition: "Threshold",
  reading: "—",
  building: "—",
  working: "—",
};

function readSystem() {
  if (typeof window === "undefined") return DEFAULT_SYSTEM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SYSTEM;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SYSTEM, ...(parsed.system || {}) };
  } catch {
    return DEFAULT_SYSTEM;
  }
}

export default function usePublicSystemCondition() {
  const [system, setSystem] = useState(readSystem);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setSystem(readSystem());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return system;
}
