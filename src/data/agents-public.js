// Public-safe slice of agents data.
// The full prompts live in agents.js and must never be imported by the public bundle.
// `role` here is the pre-extracted phrase About.jsx used to derive at runtime via regex.
export const AGENTS_PUBLIC = [
  { key: "field",            name: "Field",             ring: 1, role: "Perception" },
  { key: "works-in-progress", name: "Works in Progress", ring: 1, role: "Exploration" },
  { key: "action",           name: "Action",            ring: 1, role: "Creation" },
  { key: "cache",            name: "Cache",             ring: 1, role: "Preservation" },
  { key: "atlas",            name: "Atlas",             ring: 1, role: "Relational Mapping" },
  { key: "grace",            name: "Grace",             ring: 1, role: "Placement" },
  { key: "open",             name: "Open",              ring: 1, role: "Emergence" },
  { key: "art-practice",     name: "Art Practice",      ring: 2, role: "experimentation and personal mastery" },
  { key: "hotel",            name: "Hotel",             ring: 2, role: "lifestyle artifacts and experiential environments" },
  { key: "clssm",            name: "CLSSM",             ring: 3, role: "deep conceptual source" },
  { key: "freedom-embassy",  name: "Freedom Embassy",   ring: 3, role: "governance and system boundaries" },
];

export const RING_LABELS = {
  1: { name: "Operational Cycle",  desc: "Governs the production and interpretation of work" },
  2: { name: "Practice Layer",     desc: "Maintains creative vitality and material expression" },
  3: { name: "Governance Layer",   desc: "Provides conceptual source and structural authority" },
};
