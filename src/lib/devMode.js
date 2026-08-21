/**
 * Dev mode — reveals material the public site hides.
 *
 * Two things are hidden from visitors (see HIDDEN-ITEMS.md and `isHidden` in
 * src/data/seed.js): items flagged `hidden: true`, and Wave-1 practice entries
 * that have not been cleared with `published: true`. Dev mode turns both back on
 * and paints them with the amber indicators in HiddenIndicators.jsx.
 *
 * Three ways in, all equivalent:
 *
 *   type `dev`                    toggle it, anywhere on the site (useDevModeShortcut)
 *   fieldofaction.org/?dev        turn it on for this browser tab
 *   fieldofaction.org/?dev=off    turn it off
 *
 * `?preview` is accepted as an alias. The choice is stored in sessionStorage, so
 * it survives hash navigation and reloads and disappears when the tab closes.
 * With nothing stored, a local `npm run dev` starts on and a deployed build
 * starts off, so the default is the useful one in both places.
 *
 * This is a convenience, not a security boundary: anyone who appends `?dev` sees
 * the drafts. Material that must stay private belongs outside seed.js.
 */

const STORAGE_KEY = "foa-dev-mode";
const PARAM_NAMES = ["dev", "preview"];
const OFF_VALUES = new Set(["off", "0", "false", "no"]);

/** True when running under `npm run dev`. Also the default when nothing is stored. */
export const IS_DEV_BUILD = Boolean(import.meta.env.DEV);

// Stored tri-state: "1" on, "0" off, absent means fall back to the build default.
// Storing the off case explicitly is what lets the shortcut drop a local dev
// server into the public view without a rebuild.
const readStored = () => {
  try { return sessionStorage.getItem(STORAGE_KEY); }
  catch { return null; }
};

const writeStored = (on) => {
  try { sessionStorage.setItem(STORAGE_KEY, on ? "1" : "0"); }
  catch { /* private mode, storage quota — fall back to URL-only */ }
};

const resolve = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const name = PARAM_NAMES.find(p => params.has(p));
  if (name) {
    const on = !OFF_VALUES.has((params.get(name) || "").trim().toLowerCase());
    writeStored(on);
    return on;
  }
  const stored = readStored();
  if (stored !== null) return stored === "1";
  return IS_DEV_BUILD;
};

/**
 * Resolved once per page load. The content filters that read it are memoized on
 * mount, so a mid-session flip would leave half the tree filtered and half not.
 * `setDevMode` reloads instead of mutating this.
 */
export const DEV_MODE = resolve();

/** Turn dev mode on or off, drop the URL param, and reload so filters re-run. */
export const setDevMode = (on) => {
  writeStored(on);
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  PARAM_NAMES.forEach(p => url.searchParams.delete(p));
  const next = url.toString();
  if (next === window.location.href) window.location.reload();
  else window.location.replace(next);
};
