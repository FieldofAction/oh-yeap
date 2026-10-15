import process from "node:process";
import {
  clientIp, cors, fail, header, ipHash, json, noContent, query, readJson, safeEqual,
} from "./_lib/soulmega/http.js";
import { OTHER_PLACEMENT, SIGNAL_EVENTS, validateSignal, ymd } from "./_lib/soulmega/audience.js";
import { rateLimit, readCounts, readUniques, recordSignal, storeConfig } from "./_lib/soulmega/store.js";

// First-party measurement for Soul Mega audience capture.
//
// POST /api/soulmega-signal  beacon batch {v, sid, dryRun?, events:[{e,p,c,d,src,n?}]}
//   -> 204 always. Counted per origin class (prod|stage|dev) into daily
//      aggregates; unknown origins are dropped. A dry-run batch from a
//      soulmega.com page (?sm_cap=preview, config dryRun) is QA traffic and
//      counts as dev. Unknown placements count as "other". No IPs, no emails.
//
// GET /api/soulmega-signal?report=1&from=YYYY-MM-DD&to=YYYY-MM-DD&env=prod
//   Authorization: Bearer <SOULMEGA_REPORT_KEY>
//   -> placement and context funnels, pageviews, Mailchimp webhook tallies.

const LIMITS = [{ max: 120, windowSec: 60 }];
const ENVS = ["prod", "stage", "dev"];
const MAX_DAYS = 92;
const COUNTED = SIGNAL_EVENTS.filter((e) => e !== "pv");

export default async function handler(req, res) {
  const origin = cors(req, res, { methods: "GET, POST, OPTIONS", headers: "Content-Type, Authorization" });
  if (req.method === "OPTIONS") return noContent(res);
  if (req.method === "GET") return report(req, res);
  if (req.method !== "POST" || !origin) return noContent(res);

  try {
    const raw = await readJson(req, 32768);
    const batch = validateSignal(raw);
    if (!batch || !batch.events.length) return noContent(res);
    if (await rateLimit("signal", ipHash(clientIp(req)), LIMITS)) return noContent(res);
    const env = origin === "prod" && raw.dryRun === true ? "dev" : origin;
    await recordSignal({ env, day: ymd(new Date()), events: batch.events, sid: batch.sid });
  } catch (e) {
    console.error("soulmega-signal:", e?.message || e);
  }
  return noContent(res);
}

// ---------- report ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(t) && ymd(new Date(t)) === s ? t : null;
}

// Inclusive list of days, at most MAX_DAYS. Defaults to the last 30 days.
export function dateRange(from, to, now = new Date()) {
  const end = to === undefined ? parseDay(ymd(now)) : parseDay(to);
  const start = from === undefined && end !== null ? end - 29 * 86400000 : parseDay(from);
  if (start === null || end === null || start > end) return null;
  const count = Math.round((end - start) / 86400000) + 1;
  if (count > MAX_DAYS) return null;
  const days = Array.from({ length: count }, (_v, i) => ymd(new Date(start + i * 86400000)));
  return { from: days[0], to: days[days.length - 1], days };
}

const ratio = (a, b) => (b > 0 ? Math.round((a / b) * 10000) / 10000 : null);
const counters = () => Object.fromEntries(COUNTED.map((e) => [e, 0]));
const withRates = (c) => ({
  ...c,
  conversion: ratio(c.ok, c.imp),
  dismissRate: ratio(c.dismiss, c.imp),
  prefsRate: ratio(c.prefs_ok, c.prefs_view),
});

// Pure report math over summed counter fields. capture fields are
// "{e}|{p}|{c}|{d}|{src}", mc fields "{type}|{source}|{context}", uniques
// keyed "{e}|{p}".
export function buildReport({ env, from, to, capture = {}, mc = {}, uniques = {} }) {
  const byPlacement = {};
  const byContext = {};
  const bySource = {};
  const byDevice = {};
  const pageviews = { total: 0, byContext: {} };

  for (const [field, n] of Object.entries(capture)) {
    const [e, p, c, d, src] = field.split("|");
    if (e === "pv") {
      pageviews.total += n;
      pageviews.byContext[c] = (pageviews.byContext[c] || 0) + n;
      continue;
    }
    if (!COUNTED.includes(e)) continue;
    for (const [bucket, key] of [[byPlacement, p], [byContext, c], [bySource, src], [byDevice, d]]) {
      if (!bucket[key]) bucket[key] = counters();
      bucket[key][e] += n;
    }
  }

  const rated = (bucket) => Object.fromEntries(Object.entries(bucket).map(([k, c]) => [k, withRates(c)]));
  // null marks a unique count the store could not answer.
  const unique = (k) => (k in uniques ? uniques[k] : 0);
  const placements = rated(byPlacement);
  for (const p of Object.keys(placements)) {
    // "other" pools unknown placements, so it has no unique counts (null).
    placements[p].uniques = p === OTHER_PLACEMENT ? { imp: null, ok: null } : { imp: unique(`imp|${p}`), ok: unique(`ok|${p}`) };
  }

  const mailchimp = {
    subscribe: { total: 0, bySource: {} },
    unsubscribe: { total: 0, bySource: {}, byContext: {} },
    cleaned: 0,
    profile: 0,
    upemail: 0,
    campaign: 0,
  };
  for (const [field, n] of Object.entries(mc)) {
    const [type, source = "unknown", context = "unknown"] = field.split("|");
    if (type === "subscribe" || type === "unsubscribe") {
      const t = mailchimp[type];
      t.total += n;
      t.bySource[source] = (t.bySource[source] || 0) + n;
      if (t.byContext) t.byContext[context] = (t.byContext[context] || 0) + n;
    } else if (type in mailchimp) {
      mailchimp[type] += n;
    }
  }

  return {
    env,
    from,
    to,
    byPlacement: placements,
    byContext: rated(byContext),
    bySource: rated(bySource),
    byDevice: rated(byDevice),
    pageviews,
    mailchimp,
  };
}

async function report(req, res) {
  const q = query(req);
  if (String(q.report) !== "1") return fail(res, 400, "bad_request");

  const key = String(process.env.SOULMEGA_REPORT_KEY || "").trim();
  const given = /^Bearer\s+(.+)$/i.exec(header(req, "authorization"))?.[1]?.trim() || "";
  if (!key || !safeEqual(given, key)) return fail(res, 401, "unauthorized");
  if (!storeConfig()) return fail(res, 501, "no_store");

  const env = q.env === undefined ? "prod" : String(q.env);
  const range = dateRange(q.from, q.to);
  if (!ENVS.includes(env) || !range) return fail(res, 400, "bad_request");

  try {
    const { capture, mc } = await readCounts({ env, days: range.days });
    const pairs = new Set();
    for (const field of Object.keys(capture)) {
      const [e, p] = field.split("|");
      if ((e === "imp" || e === "ok") && p !== OTHER_PLACEMENT) pairs.add(`${e}|${p}`);
    }
    const uniques = await readUniques({ env, days: range.days, pairs: [...pairs] });
    return json(res, 200, buildReport({ env, from: range.from, to: range.to, capture, mc, uniques }));
  } catch (e) {
    console.error("soulmega-signal: report failed:", e?.message || e);
    return fail(res, 503, "unavailable");
  }
}
