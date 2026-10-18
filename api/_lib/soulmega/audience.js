// Soul Mega audience model, provider neutral: what a signup, a preference
// update and a beacon batch may contain, metro normalization, and the
// first-touch rules. mailchimp.js maps the result onto Mailchimp.

export const CONTEXTS = ["home", "product", "events", "radio", "journal", "local", "shop"];
export const INTERESTS = ["events", "beer", "music", "merch"];
export const INTEREST_LABELS = {
  events: "Events",
  beer: "Beer releases",
  music: "Music & culture",
  merch: "Merch",
};
export const SIGNAL_EVENTS = [
  "pv", "imp", "open", "submit", "ok", "err", "dismiss",
  "prefs_view", "prefs_ok", "prefs_skip", "sms_click", "fallback",
];
export const SOURCE_BUCKETS = ["direct", "search", "social", "email", "referral", "campaign", "internal"];
export const DEVICES = ["m", "d"];
export const MAX_SIGNAL_EVENTS = 25;

export const PLACEMENT_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const EVENT_SLUG_RE = /^[a-z0-9-]{1,60}$/;
const CONSENT_RE = /^[a-z0-9][a-z0-9.-]{0,31}$/;
const SID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const ATTRIBUTION_KEYS = ["source", "medium", "campaign", "content", "referrer", "landing", "ts"];
export const DEFAULT_CONSENT = "email-v1";
// Consent copy versions whose exact wording is archived in SOULMEGA-CAPTURE.md
// ("Consent versions"). An id outside this list is still accepted and stored,
// and the subscribe handler logs it so the archive can catch up.
export const CONSENT_VERSIONS = ["email-v1"];

// Placements counted under their own name in the beacon store: the config.json
// placements plus the module's built-in ones. Anything else (a typo, a new
// data-sm-cap id, a forged beacon) is counted as "other", so a caller cannot
// mint new Redis keys. Add an id here when adding a placement.
export const OTHER_PLACEMENT = "other";
export const KNOWN_PLACEMENTS = [
  "flyout", "footer", "inline",
  "home-origin", "beer-list", "collabs-end", "events-list", "journal-index", "journal-story", "radio-day",
  "find-us-local",
];

// Who people are, by what they pick (interests) and where they signed up
// (context tags). The provider turns these into saved segments.
export const SEGMENTS = [
  { name: "Social Connector", interests: ["events"], contexts: ["events", "local"] },
  { name: "Explorer", interests: ["beer"], contexts: ["product"] },
  { name: "Culture Participant", interests: ["music"], contexts: ["radio", "journal"] },
  { name: "Brand Enthusiast", interests: ["merch"], contexts: ["shop"] },
];

export const contextTag = (context) => `ctx-${context}`;

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function ymd(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// ---------- email ----------

const LOCAL_PART_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeEmail(raw) {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  const at = email.indexOf("@");
  if (at < 1 || at !== email.lastIndexOf("@")) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL_PART_RE.test(local)) return null;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  if (!domain.includes(".")) return null;
  const labels = domain.split(".");
  if (!labels.every((l) => LABEL_RE.test(l))) return null;
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || /^\d+$/.test(tld)) return null;
  return email;
}

// ---------- step 1: subscribe ----------

function cleanAttribution(raw) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const key of ATTRIBUTION_KEYS) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 100);
  }
  return out;
}

// { value } with the cleaned signup, or { error } in the HTTP contract's terms.
export function validateSubscribe(body) {
  if (!isObj(body)) return { error: "bad_request" };
  if (body.v !== undefined && body.v !== 1) return { error: "bad_request" };
  const email = normalizeEmail(body.email);
  if (!email) return { error: "invalid_email" };
  if (body.age21 !== true) return { error: "age_required" };
  const { placement, context } = body;
  if (typeof placement !== "string" || !PLACEMENT_RE.test(placement)) return { error: "bad_request" };
  if (!CONTEXTS.includes(context)) return { error: "bad_request" };
  let consent = DEFAULT_CONSENT;
  if (body.consent !== undefined) {
    if (typeof body.consent !== "string" || !CONSENT_RE.test(body.consent)) return { error: "bad_request" };
    consent = body.consent;
  }
  // Cosmetic fields are cleaned rather than refused, so a stray value never
  // costs a signup.
  const page = typeof body.page === "string" && body.page.startsWith("/") ? body.page.slice(0, 200) : "";
  const event = typeof body.event === "string" && EVENT_SLUG_RE.test(body.event) ? body.event : "";
  return {
    value: { email, placement, context, consent, page, event, attribution: cleanAttribution(body.attribution) },
  };
}

// Honeypot filled, or the form was sent faster than a person types.
export function isTrap(body) {
  const hp = body?.hp;
  if (hp !== undefined && hp !== null && hp !== "") return true;
  const elapsed = Number(body?.elapsed);
  return !Number.isFinite(elapsed) || elapsed < 1200;
}

export function signupTags(v) {
  const tags = [`src-${v.placement}`, contextTag(v.context)];
  if (v.event) tags.push(`evt-${v.event}`);
  tags.push("web-signup");
  return tags;
}

// The provider-neutral signup. firstTouch is written once (only where the
// record is still empty); refresh is written on every signup.
export function buildSignup(v, { now = new Date(), ip = "", geo = null } = {}) {
  const day = ymd(now);
  const a = v.attribution || {};
  return {
    email: v.email,
    firstTouch: {
      source: v.placement,
      context: v.context,
      page: v.page,
      campaign: a.campaign || v.event || "",
      referrer: a.source || a.referrer || "",
    },
    refresh: {
      age21: `${day} checkbox`,
      consent: `${v.consent} ${day}`,
      geoip: geo ? formatGeo(geo) : "",
    },
    metroGuess: geo ? metroFromGeo(geo) : "",
    tags: signupTags(v),
    ip: typeof ip === "string" ? ip : "",
    at: now.toISOString(),
  };
}

// ---------- step 2: preferences ----------

export function cleanCity(raw) {
  if (typeof raw !== "string") return "";
  const city = raw.replace(/’/g, "'").replace(/\s+/g, " ").trim();
  if (!city || city.length > 60) return "";
  return /^[\p{L}\p{M} .'-]+$/u.test(city) && /\p{L}/u.test(city) ? city : "";
}

export function normalizePreferences(body) {
  const skipped = body?.skipped === true;
  const raw = Array.isArray(body?.interests) ? body.interests : [];
  const interests = INTERESTS.filter((id) => raw.includes(id));
  const city = skipped ? "" : cleanCity(body?.city);
  return {
    skipped,
    interests,
    city,
    metro: city ? metroForCity(city) : "",
    tags: [skipped ? "prefs-skipped" : "prefs-set"],
  };
}

// ---------- metro ----------

const MARKETS = [
  ["DC Metro", ["DC", "MD", "VA"], [
    "washington", "dc", "district of columbia", "arlington", "alexandria", "falls church", "mclean",
    "tysons", "fairfax", "reston", "silver spring", "takoma park", "bethesda", "chevy chase",
    "rockville", "gaithersburg", "hyattsville", "college park", "greenbelt", "bowie", "laurel",
    "landover", "largo", "upper marlboro", "oxon hill", "national harbor", "capitol heights",
    "mount rainier", "brentwood", "riverdale",
  ]],
  ["Baltimore", ["MD"], [
    "baltimore", "towson", "columbia", "ellicott city", "catonsville", "glen burnie", "owings mills",
    "pikesville", "dundalk",
  ]],
  ["Annapolis", ["MD"], ["annapolis"]],
  ["Frederick", ["MD"], ["frederick"]],
  ["Delaware", ["DE"], [
    "wilmington", "newark", "dover", "lewes", "rehoboth", "rehoboth beach", "middletown", "bear", "milford",
  ]],
  ["Richmond", ["VA"], ["richmond"]],
  ["Philadelphia", ["PA"], ["philadelphia", "philly"]],
  ["New York", ["NY"], ["new york", "new york city", "nyc", "brooklyn", "queens", "bronx", "manhattan"]],
  ["Denver", ["CO"], ["denver"]],
];
const CITY_TO_MARKET = new Map();
for (const [market, states, cities] of MARKETS) {
  for (const city of cities) CITY_TO_MARKET.set(city, { market, states });
}

const STATE_SUFFIXES = [
  ["district of columbia", "DC"], ["maryland", "MD"], ["virginia", "VA"], ["delaware", "DE"],
  ["pennsylvania", "PA"], ["new york", "NY"], ["colorado", "CO"],
  ["dc", "DC"], ["md", "MD"], ["va", "VA"], ["de", "DE"], ["pa", "PA"], ["ny", "NY"], ["co", "CO"],
];
const REGION_METRO = { DC: "DC Metro", MD: "Maryland", DE: "Delaware", VA: "Virginia" };

// "Washington, D.C." -> { key: "washington", state: "DC" }
function cityKey(raw) {
  let key = String(raw || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.'’]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ (usa|us|united states)$/, "");
  let state = "";
  for (const [suffix, code] of STATE_SUFFIXES) {
    if (key.endsWith(` ${suffix}`)) {
      key = key.slice(0, -(suffix.length + 1)).trim();
      state = code;
      break;
    }
  }
  return { key, state };
}

function matchMarket(city, state) {
  const k = cityKey(city);
  const hit = CITY_TO_MARKET.get(k.key);
  const st = k.state || state || "";
  if (!hit) return null;
  if (st && !hit.states.includes(st)) return null;
  return hit.market;
}

// A declared city: its market, or "Elsewhere". Empty in, empty out.
export function metroForCity(city) {
  if (!city || !String(city).trim()) return "";
  return matchMarket(city, "") || "Elsewhere";
}

// From IP geo: the city's market when it agrees with the region, else the
// region's catch-all, else "Elsewhere".
export function metroFromGeo(geo) {
  if (!geo || (!geo.city && !geo.region && !geo.country)) return "";
  if (geo.country && geo.country !== "US") return "Elsewhere";
  return (geo.city && matchMarket(geo.city, geo.region)) || REGION_METRO[geo.region] || "Elsewhere";
}

export function formatGeo(geo) {
  if (!geo) return "";
  return [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
}

// ---------- beacons ----------

// Keeps only well-formed events; returns null when the batch is unusable.
export function validateSignal(body) {
  if (!isObj(body) || (body.v !== undefined && body.v !== 1) || !Array.isArray(body.events)) return null;
  const sid = typeof body.sid === "string" && SID_RE.test(body.sid) ? body.sid : "";
  const events = [];
  for (const ev of body.events.slice(0, MAX_SIGNAL_EVENTS)) {
    if (!isObj(ev) || !SIGNAL_EVENTS.includes(ev.e)) continue;
    // Pageviews belong to no placement; everything else must name one.
    if (ev.e !== "pv" && !(typeof ev.p === "string" && PLACEMENT_RE.test(ev.p))) continue;
    if (!CONTEXTS.includes(ev.c) || !DEVICES.includes(ev.d) || !SOURCE_BUCKETS.includes(ev.src)) continue;
    const p = ev.e === "pv" ? "-" : KNOWN_PLACEMENTS.includes(ev.p) ? ev.p : OTHER_PLACEMENT;
    const out = { e: ev.e, p, c: ev.c, d: ev.d, src: ev.src };
    if (Number.isInteger(ev.n) && ev.n >= 0 && ev.n <= 99) out.n = ev.n;
    events.push(out);
  }
  return { sid, events };
}
