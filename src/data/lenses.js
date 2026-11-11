import { MODELS } from "./models";
import { PATTERNS } from "./patterns";
import { LAWS, PAIR_MECHANICS } from "./field-laws";

// Every reference library in the site, offered as something that can read a
// held signal. A lens is a name and the sentence that defines it; nothing is
// added to the libraries themselves.
const lawName = Object.fromEntries(LAWS.map((l) => [l.id, l.name]));

export const LENSES = [
  ...MODELS.map((m) => ({ key: `lens:${m.id}`, name: m.title, kind: "Mental model", text: m.desc })),
  ...PATTERNS.map((p) => ({ key: `lens:${p.id}`, name: p.title, kind: "Pattern", text: p.desc })),
  ...Object.entries(PAIR_MECHANICS).map(([pair, v]) => {
    const [a, b] = pair.split("+");
    return { key: `lens:pair:${pair}`, name: v.name, kind: `${lawName[a]} and ${lawName[b]}`, text: v.mechanic };
  }),
].filter((l) => l.name && l.text);

const BY_KEY = new Map(LENSES.map((l) => [l.key, l]));
export const isLensKey = (key) => typeof key === "string" && key.startsWith("lens:");
export const lensFor = (key) => BY_KEY.get(key) || null;

export function searchLenses(query, limit = 8) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const l of LENSES) {
    const name = l.name.toLowerCase();
    if (name.startsWith(q)) starts.push(l);
    else if (name.includes(q) || l.text.toLowerCase().includes(q)) contains.push(l);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export const randomLens = () => LENSES[Math.floor(Math.random() * LENSES.length)];

// With no key set, the lens is laid beside the signal unread.
export function lensCard(lens) {
  return {
    kind: "lens",
    summary: lens.name,
    detail: { lens: lens.name, lensKind: lens.kind, text: lens.text, unread: true, fits: null, reading: "", question: "" },
  };
}
