import crypto from "node:crypto";
import process from "node:process";
import { Buffer } from "node:buffer";
import { INTERESTS, contextTag } from "./audience.js";

// Mailchimp Marketing API v3 adapter: the only module that knows Mailchimp
// (merge tags, member statuses, interest ids, tag and segment payloads).
// Handlers speak the neutral model from audience.js.
//
// Dry run swaps fetch for a recorder. The adapter runs the same code, and the
// recorded plan [{method, path, body}] is exactly what live mode would send
// for a member who is not on the list yet.
//
// Members: https://mailchimp.com/developer/marketing/api/lists/members/upsert-member
// Tags:    https://mailchimp.com/developer/marketing/api/lists/members/create-member-tag
// Segment conditions: https://mailchimp.com/developer/marketing/api-concepts/alternative-schemas

export const DEFAULT_AUDIENCE_ID = "94b16e1a8e";
const DEFAULT_DC = "us3";
const TEXT_MAX_BYTES = 255;
const TIMEOUT_MS = 8000;

// Merge tags are at most 10 characters; values are text (255 bytes).
export const MERGE_FIELDS = [
  { tag: "CITY", name: "City", public: true },
  { tag: "METRO", name: "Metro", public: false },
  { tag: "GEOIP", name: "IP location", public: false },
  { tag: "SOURCE", name: "Signup placement", public: false },
  { tag: "CONTEXT", name: "Signup context", public: false },
  { tag: "SIGNUPPG", name: "Signup page", public: false },
  { tag: "CAMPAIGN", name: "Signup campaign", public: false },
  { tag: "REFERRER", name: "Signup referrer", public: false },
  { tag: "AGE21", name: "Age 21+ affirmation", public: false },
  { tag: "CONSENT", name: "Email consent", public: false },
];
const FIRST_TOUCH = { source: "SOURCE", context: "CONTEXT", page: "SIGNUPPG", campaign: "CAMPAIGN", referrer: "REFERRER" };
// Stamped on a new member and on a fresh opt-in. An existing member's record is
// only filled where empty: the step-1 call only proves someone knows an address,
// so it leaves what the member already has in place.
const STAMPS = { age21: "AGE21", consent: "CONSENT", geoip: "GEOIP" };
const OPT_IN_STAMPS = ["AGE21", "CONSENT"];

// Checkboxes, so Mailchimp's own preference center lets people edit them.
export const INTEREST_CATEGORY = { title: "What moves you", type: "checkboxes" };

// Stand-in interest ids so a dry run can show the step-2 PATCH before the
// audience is set up. Live mode never uses them.
const DRY_RUN_INTEREST_IDS = Object.fromEntries(INTERESTS.map((k) => [k, `dryrun-${k}`]));

export class ProviderError extends Error {
  // code: "unavailable" (worth a fallback) | "invalid_email" | "not_found"
  //     | "rejected" (Mailchimp's final answer for this address)
  constructor(code, message, status = 0) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}

export function datacenter(apiKey) {
  const m = /-([a-z]{2,4}\d{1,3})$/.exec(String(apiKey || "").trim());
  return m ? m[1] : null;
}

// Mailchimp's subscriber hash: MD5 of the lowercase address.
export function memberId(email) {
  return crypto.createHash("md5").update(String(email).trim().toLowerCase()).digest("hex");
}

export function parseInterestIds(raw) {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    const out = {};
    for (const k of INTERESTS) {
      if (typeof obj?.[k] === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(obj[k])) out[k] = obj[k];
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function text(value) {
  let s = String(value ?? "");
  while (Buffer.byteLength(s) > TEXT_MAX_BYTES) s = s.slice(0, -1);
  return s;
}

// Keep emails and subscriber hashes out of logs.
function redact(s) {
  return String(s || "")
    .replace(/[^\s@"']+@[^\s@"']+/g, "[email]")
    .replace(/\b[a-f0-9]{32}\b/g, "{hash}");
}

function mcTime(iso) {
  return String(iso).replace(/\.\d{3}Z$/, "+00:00").replace(/Z$/, "+00:00");
}

const looksLikeIp = (ip) => /^[0-9.]{7,15}$/.test(ip) || /^[0-9a-f:]{2,39}$/i.test(ip);

// Outages and our own setup problems are "unavailable" (the client may fall
// back to Mailchimp's hosted form). Any other 4xx is Mailchimp's final answer
// for this address ("Member In Compliance State", "Forgotten Email Not
// Subscribed"...), so it is "rejected" and must not be routed around.
function failure(method, path, res) {
  const status = res.status;
  const title = typeof res.data?.title === "string" ? res.data.title : "";
  const detail = typeof res.data?.detail === "string" ? redact(res.data.detail) : "";
  const errors = Array.isArray(res.data?.errors)
    ? res.data.errors.map((e) => `${e?.field || ""} ${e?.message || ""}`).join(" ")
    : "";
  const where = `Mailchimp ${method} ${redact(path)} -> ${status}${title ? ` ${title}` : ""}`;
  const said = `${where}${detail ? `: ${detail}` : ""}`;
  if (status === 401) {
    return new ProviderError(
      "unavailable",
      `${where}. The API key was rejected; keys made on or after 2026-06-22 expire one year after creation, so it may have expired.`,
      401,
    );
  }
  if (status === 400 && /invalid resource/i.test(title) && /email|fake/i.test(detail)) {
    return new ProviderError("invalid_email", `${where}: ${detail}`, 400);
  }
  if (status === 404) return new ProviderError("not_found", where, 404);
  if (status < 400 || status === 403 || status === 429 || status >= 500) {
    return new ProviderError("unavailable", said, status);
  }
  if (/merge.?field/i.test(`${detail} ${errors}`)) {
    return new ProviderError("unavailable", `${said}. Has the setup script been applied to this audience?`, status);
  }
  return new ProviderError("rejected", said, status);
}

// A dry-run plan safe for function logs: no address, no IP, no member hash.
export function redactPlan(plan) {
  return (plan || []).map((c) => {
    const out = { method: c.method, path: redact(c.path) };
    if (c.body !== undefined) {
      out.body = { ...c.body };
      if ("email_address" in out.body) out.body.email_address = "[email]";
      if ("ip_signup" in out.body) out.body.ip_signup = "[ip]";
    }
    return out;
  });
}

// Stands in for fetch in dry run: records each call and answers the way
// Mailchimp would for a new member (GET 404, writes 200, tags 204).
function recorder(plan) {
  return async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    plan.push(body === undefined ? { method, path: u.pathname + u.search } : { method, path: u.pathname + u.search, body });
    if (method === "GET" && /\/members\/[^/]+$/.test(u.pathname)) {
      return new Response(JSON.stringify({ status: 404, title: "Resource Not Found" }), { status: 404 });
    }
    if (/\/tags$/.test(u.pathname)) return new Response(null, { status: 204 });
    return new Response(JSON.stringify({ status: body?.status || body?.status_if_new }), { status: 200 });
  };
}

// request(method, path, body) -> { status, data }. Paths are relative to /3.0.
// Network failures and timeouts become ProviderError("unavailable").
export function createApi({ apiKey, fetchImpl, signal = null, timeoutMs = TIMEOUT_MS }) {
  const base = `https://${datacenter(apiKey) || DEFAULT_DC}.api.mailchimp.com/3.0`;
  const doFetch = fetchImpl || ((url, init) => globalThis.fetch(url, init));
  return async function request(method, path, body) {
    const init = {
      method,
      headers: { Authorization: `Bearer ${apiKey || "dry-run"}`, Accept: "application/json" },
      signal: signal || AbortSignal.timeout(timeoutMs),
    };
    if (body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await doFetch(base + path, init);
    } catch (e) {
      const why = e?.name === "TimeoutError" || e?.name === "AbortError" ? "timed out" : e?.message || "network error";
      throw new ProviderError("unavailable", `Mailchimp ${method} ${redact(path)} failed: ${why}`);
    }
    let data = null;
    if (res.status !== 204) {
      const raw = await res.text().catch(() => "");
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
    }
    return { status: res.status, data };
  };
}

// The capture adapter. Reads its own env so handlers never touch Mailchimp
// settings. `ready` is false when live mode lacks a usable API key.
export function createMailchimp({ dryRun = false, env = process.env, fetchImpl } = {}) {
  const apiKey = String(env.MAILCHIMP_API_KEY || "").trim();
  const aud = String(env.MAILCHIMP_AUDIENCE_ID || "").trim();
  const audienceId = /^[A-Za-z0-9]{4,20}$/.test(aud) ? aud : DEFAULT_AUDIENCE_ID;
  const doubleOptIn = String(env.SOULMEGA_DOUBLE_OPT_IN || "").trim() === "1";
  const interestIds = parseInterestIds(env.MAILCHIMP_INTEREST_IDS) || (dryRun ? DRY_RUN_INTEREST_IDS : null);
  const plan = dryRun ? [] : null;

  let problem = "";
  if (!dryRun && !apiKey) problem = "MAILCHIMP_API_KEY is not set";
  else if (!dryRun && !datacenter(apiKey)) problem = "MAILCHIMP_API_KEY has no datacenter suffix (like -us3)";

  const request = createApi({
    apiKey,
    fetchImpl: dryRun ? recorder(plan) : fetchImpl,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const memberPath = (id) => `/lists/${audienceId}/members/${id}`;

  async function call(method, path, body, ok = [200]) {
    const res = await request(method, path, body);
    if (!ok.includes(res.status)) throw failure(method, path, res);
    return res;
  }

  // current null = a new member (everything is written). optIn = this signup
  // changes an existing member's status, so its age and consent stamps are the
  // record of that opt-in and replace the old ones.
  function mergeFields(signup, current, { optIn = false } = {}) {
    const fresh = !current;
    const empty = (tag) => fresh || current[tag] == null || String(current[tag]).trim() === "";
    const out = {};
    for (const [key, tag] of Object.entries(FIRST_TOUCH)) {
      const v = signup.firstTouch?.[key];
      if (v && empty(tag)) out[tag] = text(v);
    }
    for (const [key, tag] of Object.entries(STAMPS)) {
      const v = signup.refresh?.[key];
      if (v && (empty(tag) || (optIn && OPT_IN_STAMPS.includes(tag)))) out[tag] = text(v);
    }
    if (signup.metroGuess && empty("METRO")) out.METRO = text(signup.metroGuess);
    return out;
  }

  async function addTags(path, names, { required }) {
    if (!names.length) return;
    try {
      await call("POST", `${path}/tags`, { tags: names.map((name) => ({ name, status: "active" })) }, [200, 204]);
    } catch (e) {
      if (required) throw e;
      console.error("soulmega-mailchimp: tags not applied:", e.message);
    }
  }

  // Step 1. Returns { id, status: "subscribed"|"pending"|"updated"|"bounced", isNew }.
  async function subscribe(signup) {
    const id = memberId(signup.email);
    const path = memberPath(id);
    const got = await call("GET", `${path}?fields=status,merge_fields`, undefined, [200, 404]);
    const existing = got.status === 200 ? got.data || {} : null;
    const optIn = doubleOptIn ? "pending" : "subscribed";
    const stamp = { timestamp_signup: mcTime(signup.at) };
    if (looksLikeIp(signup.ip)) stamp.ip_signup = signup.ip;

    let status;
    let write = null;
    if (!existing) {
      status = optIn;
      write = ["PUT", { email_address: signup.email, status_if_new: optIn, merge_fields: mergeFields(signup, null), ...stamp }];
    } else {
      const current = existing.merge_fields || {};
      const kept = mergeFields(signup, current);
      const opted = mergeFields(signup, current, { optIn: true });
      switch (existing.status) {
        case "subscribed":
          status = "updated";
          write = ["PATCH", { merge_fields: kept }];
          break;
        case "pending":
          status = "pending";
          write = ["PATCH", { merge_fields: kept }];
          break;
        case "unsubscribed":
          // Pending makes Mailchimp send a fresh confirmation; never resubscribe
          // silently. Once pending, a repeat signup lands in the case above, so
          // the confirmation email is not sent again.
          status = "pending";
          write = ["PATCH", { status: "pending", merge_fields: opted, ...stamp }];
          break;
        case "archived":
          status = "pending";
          write = ["PUT", { email_address: signup.email, status: "pending", status_if_new: "pending", merge_fields: opted, ...stamp }];
          break;
        case "transactional":
          // A buyer who never opted in: this signup is their opt-in.
          status = optIn;
          write = ["PATCH", { status: optIn, merge_fields: opted, ...stamp }];
          break;
        case "cleaned":
          // The address hard-bounced: nothing would reach it, so nothing is written.
          status = "bounced";
          break;
        default:
          status = "updated";
      }
    }
    if (write) {
      const [method, body] = write;
      // A returning subscriber whose record is already complete needs no PATCH.
      if (method !== "PATCH" || body.status || Object.keys(body.merge_fields).length) await call(method, path, body);
      await addTags(path, signup.tags, { required: false });
    }
    return { id, status, isNew: !existing };
  }

  // Step 2. prefs from audience.normalizePreferences. existing: the step-1
  // token says the member was already on the list before this signup.
  async function preferences(id, prefs, { existing = false } = {}) {
    const path = memberPath(id);
    if (prefs.skipped) {
      await addTags(path, prefs.tags, { required: true });
      return;
    }
    const body = {};
    if (interestIds) {
      // For a member this signup created, the chips are the person's current
      // statement: unchosen ones go false. An existing member only gains
      // interests, since the token only proves someone knew the address.
      const keys = INTERESTS.filter((k) => interestIds[k] && (!existing || prefs.interests.includes(k)));
      if (keys.length) body.interests = Object.fromEntries(keys.map((k) => [interestIds[k], prefs.interests.includes(k)]));
    } else {
      console.warn("soulmega-preferences: MAILCHIMP_INTEREST_IDS is not set; interests skipped.");
    }
    if (prefs.city) {
      // An existing member's declared city is theirs: only an empty CITY is filled.
      let open = true;
      if (existing) {
        const got = await call("GET", `${path}?fields=merge_fields`);
        const cur = got.data?.merge_fields?.CITY;
        open = cur == null || String(cur).trim() === "";
      }
      if (open) body.merge_fields = { CITY: text(prefs.city), METRO: text(prefs.metro) };
    }
    if (Object.keys(body).length) await call("PATCH", path, body);
    await addTags(path, prefs.tags, { required: true });
  }

  return { ready: !problem, problem, dryRun, plan, memberId, subscribe, preferences };
}

// Saved-segment options for one audience.SEGMENTS entry: match any of its
// interests or context tags (tags are static segments by id).
export function segmentOptions(segment, { categoryId, interestIds, tagIds }) {
  const conditions = [];
  for (const k of segment.interests) {
    conditions.push({
      condition_type: "Interests",
      field: `interests-${categoryId}`,
      op: "interestcontains",
      value: [interestIds[k]],
    });
  }
  for (const c of segment.contexts) {
    conditions.push({
      condition_type: "StaticSegment",
      field: "static_segment",
      op: "static_is",
      value: tagIds[contextTag(c)],
    });
  }
  return { match: "any", conditions };
}
