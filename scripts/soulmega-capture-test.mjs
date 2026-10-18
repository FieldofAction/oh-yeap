#!/usr/bin/env node
// Soul Mega audience capture: server tests. Plain node:assert, no network.
// global fetch is stubbed for the whole run; any call the stub does not
// expect fails the test, so nothing can reach Mailchimp or Upstash.
//
//   node scripts/soulmega-capture-test.mjs

import assert from "node:assert/strict";
import process from "node:process";
import { Buffer } from "node:buffer";

import subscribe from "../api/soulmega-subscribe.js";
import preferences from "../api/soulmega-preferences.js";
import signal, { buildReport, dateRange } from "../api/soulmega-signal.js";
import webhook, { parseWebhook } from "../api/soulmega-mailchimp-webhook.js";
import { classifyOrigin } from "../api/_lib/soulmega/http.js";
import {
  metroForCity, metroFromGeo, normalizeEmail, normalizePreferences, validateSignal, validateSubscribe, ymd,
} from "../api/_lib/soulmega/audience.js";
import { memberId } from "../api/_lib/soulmega/mailchimp.js";
import { peekToken, signToken, verifyToken } from "../api/_lib/soulmega/token.js";
import { signalCommands, TTL_SECONDS } from "../api/_lib/soulmega/store.js";
import { runSetup } from "./soulmega-mailchimp-setup.mjs";

// ---------- harness ----------

const ENV_KEYS = [
  "MAILCHIMP_API_KEY", "MAILCHIMP_AUDIENCE_ID", "MAILCHIMP_INTEREST_IDS", "SOULMEGA_DOUBLE_OPT_IN",
  "SOULMEGA_CAPTURE_SECRET", "SOULMEGA_CAPTURE_DRY_RUN", "SOULMEGA_CAPTURE_EXTRA_ORIGINS",
  "SOULMEGA_REPORT_KEY", "SOULMEGA_WEBHOOK_KEY", "SOULMEGA_GEO",
  "KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
];
// A fake key in Mailchimp's shape, assembled at runtime so secret scanners
// don't mistake the source for a real credential.
const API_KEY = ["0123456789abcdef".repeat(2), "us3"].join("-");
const SECRET = "test-capture-secret";
const LIVE = { MAILCHIMP_API_KEY: API_KEY, SOULMEGA_CAPTURE_SECRET: SECRET };
const KV_URL = "https://test-kv.upstash.io";
const STORE = { KV_REST_API_URL: KV_URL, KV_REST_API_TOKEN: "kv-token" };
const MC = "https://us3.api.mailchimp.com/3.0";
const AUD = "94b16e1a8e";
const PROD = "https://www.soulmega.com";
const TODAY = ymd(new Date());
const IDS = { events: "ie1", beer: "ib2", music: "im3", merch: "ix4" };

function setEnv(over = {}) {
  for (const k of ENV_KEYS) delete process.env[k];
  Object.assign(process.env, over);
}

let calls = [];
let routes = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  assert.ok(!/list-manage\.com/.test(u), "never call list-manage.com");
  const call = { url: u, method: init.method || "GET", headers: init.headers || {}, raw: init.body };
  call.body = typeof init.body === "string" && init.body ? JSON.parse(init.body) : undefined;
  calls.push(call);
  for (const route of routes) {
    const out = await route(u, call);
    if (out) return out;
  }
  throw new Error(`unexpected fetch ${call.method} ${u}`);
};

const jsonRes = (status, data) => new Response(JSON.stringify(data), { status });

// Mailchimp stand-in. member null = not on the list.
function mailchimp({ member = null, getStatus, writeStatus = 200 } = {}) {
  return (url, call) => {
    if (!url.startsWith(`${MC}/`)) return undefined;
    if (call.method === "GET" && /\/members\/[a-f0-9]{32}\?/.test(url)) {
      if (getStatus) return jsonRes(getStatus, { title: "API Key Invalid", status: getStatus });
      return member ? jsonRes(200, member) : jsonRes(404, { title: "Resource Not Found", status: 404 });
    }
    if (call.method === "POST" && url.endsWith("/tags")) return new Response(null, { status: 204 });
    if (call.method === "PUT" || call.method === "PATCH") return jsonRes(writeStatus, { status: call.body?.status });
    return undefined;
  };
}

// Upstash stand-in: records each pipeline, answers per command.
let pipelines = [];
function upstash(answer = () => ({ result: 1 })) {
  return (url, call) => {
    if (!url.startsWith(KV_URL)) return undefined;
    assert.equal(url, `${KV_URL}/pipeline`);
    assert.equal(call.method, "POST");
    assert.equal(call.headers.Authorization, "Bearer kv-token");
    pipelines.push(call.body);
    return jsonRes(200, call.body.map(answer));
  };
}

let ipCounter = 0;
function makeReq({ method = "POST", origin = PROD, body, headers = {}, query = {}, ip } = {}) {
  ipCounter += 1;
  return {
    method,
    headers: { ...(origin ? { origin } : {}), "x-forwarded-for": ip || `2001:db8::${ipCounter.toString(16)}`, ...headers },
    body,
    query,
    url: "/api/test",
  };
}
function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    status(n) { this.statusCode = n; return this; },
    json(o) { this.body = o; this.ended = true; return this; },
    send(s) { this.body = s; this.ended = true; return this; },
    end(s) { if (s !== undefined) this.body = s; this.ended = true; return this; },
  };
}
async function hit(handler, opts) {
  const res = makeRes();
  await handler(makeReq(opts), res);
  assert.ok(res.ended, "response ended");
  return res;
}

// Console capture so expected errors stay out of the test output.
async function quiet(fn) {
  const logs = { log: [], error: [], warn: [] };
  const orig = { log: console.log, error: console.error, warn: console.warn };
  for (const k of Object.keys(logs)) console[k] = (...a) => logs[k].push(a.map(String).join(" "));
  try {
    await fn(logs);
  } finally {
    Object.assign(console, orig);
  }
  return logs;
}

// Rate limits use fixed wall-clock windows; a run that crosses a minute
// boundary would reset the count mid-test. Pin the clock to a window start.
async function frozenClock(fn) {
  const real = Date.now;
  const t = Math.floor(real() / 3_600_000) * 3_600_000 + 1_000;
  Date.now = () => t;
  try {
    return await fn();
  } finally {
    Date.now = real;
  }
}

const signup = (over = {}) => ({
  v: 1,
  email: "  Person@Example.COM ",
  age21: true,
  consent: "email-v1",
  placement: "flyout",
  context: "events",
  page: "/events",
  event: "snallygaster-2026",
  attribution: { source: "instagram", medium: "social", campaign: "gabf", content: "", referrer: "l.instagram.com", landing: "/events", ts: "2026-10-14T12:00:00Z", junk: "x" },
  hp: "",
  elapsed: 5400,
  sid: "k3j2abcdefgh1234",
  dryRun: false,
  ...over,
});
const GEO_HEADERS = {
  "x-vercel-ip-city": "Silver%20Spring",
  "x-vercel-ip-country-region": "MD",
  "x-vercel-ip-country": "US",
};

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function reset(env = {}) {
  setEnv(env);
  calls = [];
  routes = [];
  pipelines = [];
}
const mcCalls = () => calls.filter((c) => c.url.startsWith(MC)).map((c) => ({ method: c.method, path: c.url.slice(MC.length), body: c.body }));

// ---------- validation and model ----------

test("email validation", () => {
  assert.equal(normalizeEmail("  A@B.co "), "a@b.co");
  assert.equal(normalizeEmail("x.y+z@sub.example.org"), "x.y+z@sub.example.org");
  for (const bad of [
    "", "a@b", "a@@b.co", "a@b@c.co", "a b@c.co", ".a@b.co", "a.@b.co", "a..b@c.co", "a@-b.co", "a@b.c",
    "a@b.123", "@b.co", "a@", `${"x".repeat(250)}@b.co`, `${"x".repeat(65)}@b.co`, 42, null, undefined,
  ]) {
    assert.equal(normalizeEmail(bad), null, `rejects ${String(bad).slice(0, 30)}`);
  }
  assert.deepEqual(validateSubscribe(signup({ email: "nope" })), { error: "invalid_email" });
  assert.deepEqual(validateSubscribe(signup({ age21: "true" })), { error: "age_required" });
  assert.deepEqual(validateSubscribe(signup({ age21: undefined })), { error: "age_required" });
  assert.deepEqual(validateSubscribe(signup({ placement: "Flyout!" })), { error: "bad_request" });
  assert.deepEqual(validateSubscribe(signup({ context: "blog" })), { error: "bad_request" });
  assert.deepEqual(validateSubscribe(signup({ v: 2 })), { error: "bad_request" });
  assert.deepEqual(validateSubscribe("x"), { error: "bad_request" });
  const ok = validateSubscribe(signup({ page: "no-slash", event: "Bad Slug", attribution: { source: "x".repeat(150), extra: "y" } }));
  assert.equal(ok.value.email, "person@example.com");
  assert.equal(ok.value.page, "");
  assert.equal(ok.value.event, "");
  assert.deepEqual(ok.value.attribution, { source: "x".repeat(100) });
});

test("token sign, verify, expiry, tamper", () => {
  const t = signToken({ h: "abc123", d: 0 }, SECRET);
  const p = verifyToken(t, SECRET);
  assert.equal(p.h, "abc123");
  assert.equal(p.d, 0);
  assert.equal(p.x, undefined);
  assert.ok(p.exp > Date.now() / 1000 + 7100 && p.exp <= Date.now() / 1000 + 7200);
  assert.equal(verifyToken(t, "other-secret"), null, "wrong secret");
  const old = signToken({ h: "abc123" }, SECRET, { now: Math.floor(Date.now() / 1000) - 7201 });
  assert.equal(verifyToken(old, SECRET), null, "expired");
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ h: "someone-else", exp: p.exp, d: 0 })).toString("base64url");
  assert.equal(verifyToken(`${forged}.${sig}`, SECRET), null, "tampered payload");
  const flipped = sig.slice(0, -2) + (sig.slice(-2) === "AA" ? "AB" : "AA");
  assert.equal(verifyToken(`${body}.${flipped}`, SECRET), null, "tampered signature");
  assert.equal(verifyToken(`${body}.${sig}.x`, SECRET), null);
  assert.equal(verifyToken("garbage", SECRET), null);
  assert.equal(verifyToken(undefined, SECRET), null);
  const trap = verifyToken(signToken({ h: "h", d: 1, x: true }, SECRET), SECRET);
  assert.equal(trap.x, 1);
  assert.equal(trap.d, 1);
  assert.equal(trap.e, undefined);
  assert.equal(verifyToken(signToken({ h: "h", e: true }, SECRET), SECRET).e, 1, "existing-member claim");
  const badE = Buffer.from(JSON.stringify({ h: "h", exp: p.exp, d: 0, e: 2 })).toString("base64url");
  assert.equal(peekToken(`${badE}.x`), null, "e must be 1 when present");
  assert.equal(peekToken(t).h, "abc123");
});

test("metro normalization", () => {
  const cases = {
    "Washington, DC": "DC Metro", "washington d.c.": "DC Metro", "D.C.": "DC Metro", DC: "DC Metro",
    "District of Columbia": "DC Metro", "Silver Spring, MD": "DC Metro", "Arlington VA": "DC Metro",
    "Takoma Park": "DC Metro", Baltimore: "Baltimore", "Columbia, MD": "Baltimore", "Ellicott City": "Baltimore",
    Annapolis: "Annapolis", "Frederick, Maryland": "Frederick", "Rehoboth Beach, DE": "Delaware",
    Newark: "Delaware", Richmond: "Richmond", Philadelphia: "Philadelphia", Brooklyn: "New York",
    NYC: "New York", "New York, NY": "New York", Denver: "Denver", Austin: "Elsewhere",
    "Columbia, VA": "Elsewhere", "Newark NJ": "Elsewhere",
  };
  for (const [city, metro] of Object.entries(cases)) assert.equal(metroForCity(city), metro, city);
  assert.equal(metroForCity(""), "");
  assert.equal(metroFromGeo({ city: "Arlington", region: "VA", country: "US" }), "DC Metro");
  assert.equal(metroFromGeo({ city: "Arlington", region: "TX", country: "US" }), "Elsewhere");
  assert.equal(metroFromGeo({ city: "Baltimore", region: "MD", country: "US" }), "Baltimore");
  assert.equal(metroFromGeo({ city: "Hagerstown", region: "MD", country: "US" }), "Maryland");
  assert.equal(metroFromGeo({ city: "Smyrna", region: "DE", country: "US" }), "Delaware");
  assert.equal(metroFromGeo({ city: "Roanoke", region: "VA", country: "US" }), "Virginia");
  assert.equal(metroFromGeo({ city: "Washington", region: "DC", country: "US" }), "DC Metro");
  assert.equal(metroFromGeo({ city: "", region: "DC", country: "US" }), "DC Metro");
  assert.equal(metroFromGeo({ city: "Columbia", region: "SC", country: "US" }), "Elsewhere");
  assert.equal(metroFromGeo({ city: "Paris", region: "IDF", country: "FR" }), "Elsewhere");
  assert.equal(metroFromGeo(null), "");
});

test("origin classes", async () => {
  reset({ SOULMEGA_CAPTURE_EXTRA_ORIGINS: "https://shop.soulmega.com, not a url" });
  assert.equal(classifyOrigin("https://www.soulmega.com"), "prod");
  assert.equal(classifyOrigin("https://soulmega.com"), "prod");
  assert.equal(classifyOrigin("https://shop.soulmega.com"), "prod");
  assert.equal(classifyOrigin("https://soulmega.webflow.io"), "stage");
  for (const o of ["http://localhost:5181", "http://localhost", "http://127.0.0.1:3000", "https://www.fieldofaction.org", "https://fieldofaction.org"]) {
    assert.equal(classifyOrigin(o), "dev", o);
  }
  for (const o of ["https://evil.com", "http://soulmega.com", "https://soulmega.com.evil.com", "https://other.webflow.io", "https://localhost:5181", "null", "", undefined]) {
    assert.equal(classifyOrigin(o), null, String(o));
  }
  reset(LIVE);
  const bad = await hit(subscribe, { origin: "https://evil.com", body: JSON.stringify(signup()) });
  assert.equal(bad.statusCode, 403);
  assert.deepEqual(bad.body, { ok: false, error: "forbidden" });
  assert.equal(bad.headers["access-control-allow-origin"], undefined);
  assert.equal(bad.headers.vary, "Origin");
  const none = await hit(subscribe, { origin: null, body: JSON.stringify(signup()) });
  assert.equal(none.statusCode, 403);
  const noPrefs = await hit(preferences, { origin: null, body: "{}" });
  assert.equal(noPrefs.statusCode, 403);
  const pre = await hit(subscribe, { method: "OPTIONS" });
  assert.equal(pre.statusCode, 204);
  assert.equal(pre.headers["access-control-allow-origin"], PROD);
  assert.equal(calls.length, 0);
});

// ---------- subscribe ----------

test("honeypot and elapsed traps succeed and write nothing", async () => {
  reset(LIVE);
  routes = [mailchimp()];
  for (const over of [{ hp: "bot@spam.com" }, { elapsed: 300 }, { elapsed: undefined }]) {
    const res = await hit(subscribe, { body: JSON.stringify(signup(over)), headers: GEO_HEADERS });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.status, "subscribed");
    assert.equal(res.body.dryRun, undefined);
    assert.equal(res.body.plan, undefined);
    const p = verifyToken(res.body.token, SECRET);
    assert.equal(p.x, 1);
    assert.equal(p.h, memberId("person@example.com"));
  }
  assert.equal(calls.length, 0, "no Mailchimp or store calls");
  reset();
  const dry = await hit(subscribe, { origin: "http://localhost:5181", body: signup({ hp: "x" }) });
  assert.equal(dry.body.dryRun, true);
  assert.deepEqual(dry.body.plan, []);
});

test("new member: GET, PUT with first-touch fields, tags", async () => {
  reset(LIVE);
  routes = [mailchimp()];
  const res = await hit(subscribe, { body: JSON.stringify(signup()), headers: GEO_HEADERS, ip: "203.0.113.9" });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.status, "subscribed");
  assert.deepEqual(res.body.geo, { city: "Silver Spring", region: "MD", country: "US" });
  assert.equal(res.headers["cache-control"], "no-store");
  assert.equal(res.headers["access-control-allow-origin"], PROD);
  const hash = memberId("person@example.com");
  const tok = verifyToken(res.body.token, SECRET);
  assert.equal(tok.h, hash);
  assert.equal(tok.d, 0);
  assert.equal(tok.e, undefined, "a member this signup created is not marked existing");
  const mc = mcCalls();
  assert.deepEqual(mc.map((c) => `${c.method} ${c.path.split("?")[0]}`), [
    `GET /lists/${AUD}/members/${hash}`,
    `PUT /lists/${AUD}/members/${hash}`,
    `POST /lists/${AUD}/members/${hash}/tags`,
  ]);
  assert.equal(mc[0].path, `/lists/${AUD}/members/${hash}?fields=status,merge_fields`);
  const put = mc[1].body;
  assert.equal(put.email_address, "person@example.com");
  assert.equal(put.status_if_new, "subscribed");
  assert.equal(put.status, undefined);
  assert.equal(put.ip_signup, "203.0.113.9");
  assert.match(put.timestamp_signup, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
  assert.deepEqual(put.merge_fields, {
    SOURCE: "flyout",
    CONTEXT: "events",
    SIGNUPPG: "/events",
    CAMPAIGN: "gabf",
    REFERRER: "instagram",
    AGE21: `${TODAY} checkbox`,
    CONSENT: `email-v1 ${TODAY}`,
    GEOIP: "Silver Spring, MD, US",
    METRO: "DC Metro",
  });
  assert.deepEqual(mc[2].body, {
    tags: ["src-flyout", "ctx-events", "evt-snallygaster-2026", "web-signup"].map((name) => ({ name, status: "active" })),
  });
  const auth = calls[0].headers.Authorization;
  assert.equal(auth, `Bearer ${API_KEY}`);
});

test("new member with double opt-in, no geo, event as campaign", async () => {
  reset({ ...LIVE, SOULMEGA_DOUBLE_OPT_IN: "1", SOULMEGA_GEO: "0" });
  routes = [mailchimp()];
  const res = await hit(subscribe, {
    body: signup({ attribution: { referrer: "news.example.org" } }),
    headers: GEO_HEADERS,
  });
  assert.equal(res.body.status, "pending");
  assert.equal(res.body.geo, undefined);
  const put = mcCalls()[1].body;
  assert.equal(put.status_if_new, "pending");
  assert.equal(put.merge_fields.CAMPAIGN, "snallygaster-2026");
  assert.equal(put.merge_fields.REFERRER, "news.example.org");
  assert.equal(put.merge_fields.GEOIP, undefined);
  assert.equal(put.merge_fields.METRO, undefined);
});

test("existing subscribed member: record only filled where empty, token marked existing", async () => {
  reset(LIVE);
  routes = [mailchimp({
    member: {
      status: "subscribed",
      merge_fields: { SOURCE: "footer", CONTEXT: "home", SIGNUPPG: "/home-enter", CAMPAIGN: "", REFERRER: " ", METRO: "Baltimore", AGE21: "2025-01-01 checkbox" },
    },
  })];
  const res = await hit(subscribe, { body: signup(), headers: GEO_HEADERS });
  assert.equal(res.body.status, "updated");
  assert.equal(verifyToken(res.body.token, SECRET).e, 1);
  const mc = mcCalls();
  assert.deepEqual(mc.map((c) => c.method), ["GET", "PATCH", "POST"]);
  // AGE21 and METRO are already there and stay; empty CONSENT and GEOIP are filled.
  assert.deepEqual(mc[1].body, {
    merge_fields: {
      CAMPAIGN: "gabf",
      REFERRER: "instagram",
      CONSENT: `email-v1 ${TODAY}`,
      GEOIP: "Silver Spring, MD, US",
    },
  });

  // Someone who only knows the address cannot rewrite a complete record.
  reset(LIVE);
  routes = [mailchimp({
    member: {
      status: "subscribed",
      merge_fields: {
        SOURCE: "footer", CONTEXT: "home", SIGNUPPG: "/", CAMPAIGN: "x", REFERRER: "y", METRO: "Baltimore",
        AGE21: "2025-03-01 checkbox", CONSENT: "email-v1 2025-03-01", GEOIP: "Baltimore, MD, US",
      },
    },
  })];
  const again = await hit(subscribe, { body: signup(), headers: { ...GEO_HEADERS, "x-vercel-ip-city": "Denver", "x-vercel-ip-country-region": "CO" } });
  assert.equal(again.body.status, "updated");
  assert.deepEqual(mcCalls().map((c) => c.method), ["GET", "POST"], "no PATCH, only the touch tags");
});

test("existing pending member stays pending", async () => {
  reset(LIVE);
  routes = [mailchimp({ member: { status: "pending", merge_fields: {} } })];
  const res = await hit(subscribe, { body: signup() });
  assert.equal(res.body.status, "pending");
  const patch = mcCalls()[1];
  assert.equal(patch.method, "PATCH");
  assert.equal(patch.body.status, undefined);
});

test("unsubscribed member goes to pending (re-confirmation)", async () => {
  reset(LIVE);
  routes = [mailchimp({ member: { status: "unsubscribed", merge_fields: { SOURCE: "footer", AGE21: "2024-01-01 checkbox", GEOIP: "Baltimore, MD, US" } } })];
  const res = await hit(subscribe, { body: signup(), headers: GEO_HEADERS });
  assert.equal(res.body.status, "pending");
  assert.equal(verifyToken(res.body.token, SECRET).e, 1);
  const patch = mcCalls()[1];
  assert.equal(patch.method, "PATCH");
  assert.equal(patch.body.status, "pending");
  assert.equal(patch.body.merge_fields.SOURCE, undefined);
  // A fresh opt-in: its age and consent stamps replace the old ones; GEOIP is kept.
  assert.equal(patch.body.merge_fields.AGE21, `${TODAY} checkbox`);
  assert.equal(patch.body.merge_fields.CONSENT, `email-v1 ${TODAY}`);
  assert.equal(patch.body.merge_fields.GEOIP, undefined);
  assert.ok(patch.body.timestamp_signup);
});

test("archived member is re-added as pending", async () => {
  reset(LIVE);
  routes = [mailchimp({ member: { status: "archived", merge_fields: {} } })];
  const res = await hit(subscribe, { body: signup() });
  assert.equal(res.body.status, "pending");
  const put = mcCalls()[1];
  assert.equal(put.method, "PUT");
  assert.equal(put.body.status, "pending");
  assert.equal(put.body.email_address, "person@example.com");
});

test("transactional member becomes subscribed", async () => {
  reset(LIVE);
  routes = [mailchimp({ member: { status: "transactional", merge_fields: { MERGE10: "Baltimore" } } })];
  const res = await hit(subscribe, { body: signup() });
  assert.equal(res.body.status, "subscribed");
  const patch = mcCalls()[1];
  assert.equal(patch.method, "PATCH");
  assert.equal(patch.body.status, "subscribed");
  assert.equal(patch.body.merge_fields.SOURCE, "flyout");
});

test("cleaned member: no write, 409 bounced", async () => {
  reset(LIVE);
  routes = [mailchimp({ member: { status: "cleaned", merge_fields: {} } })];
  const res = await hit(subscribe, { body: signup() });
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { ok: false, error: "bounced" });
  assert.deepEqual(mcCalls().map((c) => c.method), ["GET"]);
});

test("Mailchimp's final 4xx is 409 rejected; outages and setup gaps stay 503", async () => {
  const run = async (route) => {
    reset(LIVE);
    routes = [route];
    let res;
    await quiet(async () => { res = await hit(subscribe, { body: signup() }); });
    return res;
  };
  const member = (status) => (url, call) => (call.method === "GET" ? jsonRes(200, { status, merge_fields: {} }) : undefined);
  const compliance = await run((url, call) => member("unsubscribed")(url, call)
    || (call.method === "PATCH" ? jsonRes(400, { title: "Member In Compliance State", detail: "person@example.com is already a list member in compliance state due to unsubscribe, bounce, or compliance review." }) : undefined));
  assert.equal(compliance.statusCode, 409);
  assert.deepEqual(compliance.body, { ok: false, error: "rejected" });
  const forgotten = await run((url, call) => (call.method === "GET" ? jsonRes(404, { title: "Resource Not Found" })
    : call.method === "PUT" ? jsonRes(400, { title: "Forgotten Email Not Subscribed", detail: "person@example.com was permanently deleted and cannot be re-imported." }) : undefined));
  assert.equal(forgotten.statusCode, 409);
  assert.equal(forgotten.body.error, "rejected");
  const mergeGap = await run((url, call) => (call.method === "GET" ? jsonRes(404, {})
    : call.method === "PUT" ? jsonRes(400, { title: "Invalid Resource", detail: "Your merge fields were invalid.", errors: [{ field: "AGE21", message: "Merge field AGE21 does not exist" }] }) : undefined));
  assert.equal(mergeGap.statusCode, 503, "missing setup is an outage the fallback can cover");
  for (const status of [403, 429, 502]) {
    const res = await run((url, call) => (call.method === "GET" ? jsonRes(status, { title: "x" }) : undefined));
    assert.equal(res.statusCode, 503, String(status));
  }
});

test("Mailchimp 401 becomes 503 and logs a key hint", async () => {
  reset(LIVE);
  routes = [mailchimp({ getStatus: 401 })];
  let res;
  const logs = await quiet(async () => {
    res = await hit(subscribe, { body: signup() });
  });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { ok: false, error: "unavailable" });
  const err = logs.error.join("\n");
  assert.match(err, /^soulmega-subscribe:/m);
  assert.match(err, /expired/);
  assert.ok(!err.includes("person@example.com"), "no email in logs");
  assert.ok(!err.includes(API_KEY), "no key in logs");
});

test("Mailchimp 500 and network failure become 503", async () => {
  reset(LIVE);
  routes = [mailchimp({ member: { status: "subscribed", merge_fields: {} }, writeStatus: 500 })];
  await quiet(async () => {
    assert.equal((await hit(subscribe, { body: signup() })).statusCode, 503);
  });
  reset(LIVE);
  routes = [() => { throw new TypeError("fetch failed"); }];
  await quiet(async () => {
    assert.equal((await hit(subscribe, { body: signup() })).statusCode, 503);
  });
});

test("Mailchimp rejects the address as fake: 400 invalid_email", async () => {
  reset(LIVE);
  routes = [(url, call) => {
    if (call.method === "PUT") {
      return jsonRes(400, { title: "Invalid Resource", detail: "person@example.com looks fake or invalid, please enter a real email address." });
    }
    return mailchimp()(url, call);
  }];
  let res;
  const logs = await quiet(async () => {
    res = await hit(subscribe, { body: signup() });
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "invalid_email");
  assert.ok(!logs.error.join(" ").includes("person@example.com"));
});

test("live without key or secret: 503", async () => {
  reset({ SOULMEGA_CAPTURE_SECRET: SECRET });
  await quiet(async () => {
    const res = await hit(subscribe, { body: signup() });
    assert.equal(res.statusCode, 503);
  });
  reset({ MAILCHIMP_API_KEY: API_KEY });
  await quiet(async () => {
    const res = await hit(subscribe, { body: signup() });
    assert.equal(res.statusCode, 503);
  });
  assert.equal(calls.length, 0);
});

test("dry run: same plan, nothing sent (dev, stage, flag, env)", async () => {
  reset();
  const res = await hit(subscribe, { origin: "http://localhost:5181", body: signup(), headers: GEO_HEADERS });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.dryRun, true);
  assert.equal(res.body.status, "subscribed");
  assert.equal(calls.length, 0, "no fetch at all in dry run");
  const hash = memberId("person@example.com");
  assert.deepEqual(res.body.plan.map((c) => `${c.method} ${c.path}`), [
    `GET /3.0/lists/${AUD}/members/${hash}?fields=status,merge_fields`,
    `PUT /3.0/lists/${AUD}/members/${hash}`,
    `POST /3.0/lists/${AUD}/members/${hash}/tags`,
  ]);
  assert.equal(res.body.plan[1].body.merge_fields.METRO, "DC Metro");
  assert.equal(verifyToken(res.body.token, "soulmega-capture-dev-secret-not-for-live-use").d, 1);

  // Same plan body as the live PUT for the same input.
  reset(LIVE);
  routes = [mailchimp()];
  await hit(subscribe, { body: signup(), headers: GEO_HEADERS, ip: "198.51.100.4" });
  const livePut = mcCalls()[1].body;
  reset(LIVE);
  let dry;
  const logs = await quiet(async () => {
    dry = await hit(subscribe, { body: signup({ dryRun: true }), headers: GEO_HEADERS, ip: "198.51.100.4" });
  });
  assert.equal(calls.length, 0);
  const dryPut = dry.body.plan[1].body;
  assert.deepEqual({ ...dryPut, timestamp_signup: 0 }, { ...livePut, timestamp_signup: 0 });
  // A soulmega.com dry run logs its plan for the rollout check, with no address, IP or hash.
  assert.equal(logs.log.length, 1);
  const logged = JSON.parse(logs.log[0]).smcap_plan;
  assert.equal(logged.endpoint, "subscribe");
  assert.deepEqual(logged.plan.map((c) => c.method), ["GET", "PUT", "POST"]);
  assert.equal(logged.plan[1].body.email_address, "[email]");
  assert.equal(logged.plan[1].body.ip_signup, "[ip]");
  assert.equal(logged.plan[1].body.merge_fields.AGE21, `${TODAY} checkbox`);
  assert.ok(!/person@example\.com|198\.51\.100\.4|[a-f0-9]{32}/.test(logs.log[0]), "redacted");

  reset({ ...LIVE, SOULMEGA_CAPTURE_DRY_RUN: "1" });
  await quiet(async () => {
    assert.equal((await hit(subscribe, { body: signup() })).body.dryRun, true);
  });
  reset(LIVE);
  assert.equal((await hit(subscribe, { origin: "https://soulmega.webflow.io", body: signup() })).body.dryRun, true);
  assert.equal(calls.length, 0);
});

test("body parsing: string, object, Buffer, bad JSON", async () => {
  reset();
  const o = "http://localhost:5181";
  assert.equal((await hit(subscribe, { origin: o, body: JSON.stringify(signup()) })).statusCode, 200);
  assert.equal((await hit(subscribe, { origin: o, body: signup() })).statusCode, 200);
  assert.equal((await hit(subscribe, { origin: o, body: Buffer.from(JSON.stringify(signup())) })).statusCode, 200);
  const bad = await hit(subscribe, { origin: o, body: "{not json" });
  assert.equal(bad.statusCode, 400);
  assert.deepEqual(bad.body, { ok: false, error: "bad_request" });
  const thrower = makeReq({ origin: o });
  Object.defineProperty(thrower, "body", { get() { throw new Error("Invalid JSON"); } });
  const res = makeRes();
  await subscribe(thrower, res);
  assert.equal(res.statusCode, 400);
  assert.equal((await hit(subscribe, { origin: o, body: signup({ email: "bad" }) })).body.error, "invalid_email");
  assert.equal((await hit(subscribe, { origin: o, body: signup({ age21: false }) })).body.error, "age_required");
  assert.equal((await hit(subscribe, { origin: o, method: "GET" })).statusCode, 405);
});

test("consent id outside the archive is stored and logged", async () => {
  reset();
  let res;
  const logs = await quiet(async () => {
    res = await hit(subscribe, { origin: "http://localhost:5181", body: signup({ consent: "email-v9" }) });
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.plan[1].body.merge_fields.CONSENT, `email-v9 ${TODAY}`);
  assert.match(logs.warn.join(" "), /consent id not in the archive: email-v9/);
});

test("rate limit: 6 per minute per IP", async () => {
  reset();
  await frozenClock(async () => {
    const statuses = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await hit(subscribe, { origin: "http://localhost:5181", body: signup(), ip: "192.0.2.77" })).statusCode);
    }
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 429]);
    const res = await hit(subscribe, { origin: "http://localhost:5181", body: signup(), ip: "192.0.2.77" });
    assert.deepEqual(res.body, { ok: false, error: "rate_limited" });
  });
});

// ---------- preferences ----------

const prefsToken = (over = {}) => signToken({ h: memberId("person@example.com"), d: 0, ...over }, SECRET);

test("preferences: PATCH interests true/false, city and metro, tags", async () => {
  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [mailchimp()];
  const res = await hit(preferences, {
    body: JSON.stringify({ v: 1, token: prefsToken(), interests: ["events", "music", "bogus", "events"], city: "  Baltimore ", skipped: false, placement: "flyout", context: "events" }),
  });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.deepEqual(res.body, { ok: true });
  const hash = memberId("person@example.com");
  const mc = mcCalls();
  assert.deepEqual(mc, [
    {
      method: "PATCH",
      path: `/lists/${AUD}/members/${hash}`,
      body: { interests: { ie1: true, ib2: false, im3: true, ix4: false }, merge_fields: { CITY: "Baltimore", METRO: "Baltimore" } },
    },
    { method: "POST", path: `/lists/${AUD}/members/${hash}/tags`, body: { tags: [{ name: "prefs-set", status: "active" }] } },
  ]);
});

test("preferences: an existing member's token only adds interests and fills an empty city", async () => {
  const hash = memberId("person@example.com");
  const withCity = (city) => (url, call) => {
    if (call.method === "GET" && url.endsWith(`/members/${hash}?fields=merge_fields`)) return jsonRes(200, { merge_fields: { CITY: city } });
    return mailchimp()(url, call);
  };
  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [withCity("Baltimore")];
  const res = await hit(preferences, { body: { token: prefsToken({ e: true }), interests: ["music"], city: "Denver" } });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  const mc = mcCalls();
  assert.deepEqual(mc.map((c) => c.method), ["GET", "PATCH", "POST"]);
  assert.deepEqual(mc[1].body, { interests: { im3: true } }, "nothing turned off, declared city kept");

  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [withCity("")];
  await hit(preferences, { body: { token: prefsToken({ e: true }), interests: [], city: "Denver" } });
  assert.deepEqual(mcCalls()[1].body, { merge_fields: { CITY: "Denver", METRO: "Denver" } });

  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [withCity("Baltimore")];
  await hit(preferences, { body: { token: prefsToken({ e: true }), interests: [], city: "Denver" } });
  assert.deepEqual(mcCalls().map((c) => c.method), ["GET", "POST"], "no PATCH when there is nothing to add");
});

test("preferences: a final Mailchimp 4xx is 409 rejected", async () => {
  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [(url, call) => (call.method === "PATCH" ? jsonRes(400, { title: "Member In Compliance State" }) : undefined)];
  await quiet(async () => {
    const res = await hit(preferences, { body: { token: prefsToken(), interests: ["beer"] } });
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.error, "rejected");
  });
});

test("preferences: skipped writes only the prefs-skipped tag", async () => {
  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [mailchimp()];
  const res = await hit(preferences, { body: { token: prefsToken(), interests: ["beer"], city: "Denver", skipped: true } });
  assert.equal(res.statusCode, 200);
  const mc = mcCalls();
  assert.equal(mc.length, 1);
  assert.deepEqual(mc[0].body, { tags: [{ name: "prefs-skipped", status: "active" }] });
});

test("preferences: expired, tampered or missing token is 401", async () => {
  reset(LIVE);
  routes = [mailchimp()];
  const old = signToken({ h: "abc", d: 0 }, SECRET, { now: Math.floor(Date.now() / 1000) - 8000 });
  for (const token of [old, prefsToken().replace(/.$/, (c) => (c === "A" ? "B" : "A")), "", undefined, "x.y"]) {
    const res = await hit(preferences, { body: { token, interests: [] } });
    assert.equal(res.statusCode, 401, String(token));
    assert.deepEqual(res.body, { ok: false, error: "expired" });
  }
  assert.equal(calls.length, 0);
});

test("preferences: trap token writes nothing; dry-run token stays dry", async () => {
  reset(LIVE);
  routes = [mailchimp()];
  const trap = await hit(preferences, { body: { token: prefsToken({ x: true }), interests: ["events"] } });
  assert.deepEqual(trap.body, { ok: true });
  assert.equal(calls.length, 0);
  let dry;
  await quiet(async () => {
    dry = await hit(preferences, { body: { token: prefsToken({ d: 1 }), interests: ["merch"], city: "Lewes" } });
  });
  assert.equal(dry.body.dryRun, true);
  assert.equal(calls.length, 0);
  assert.equal(dry.body.plan[0].method, "PATCH");
  assert.deepEqual(dry.body.plan[0].body.merge_fields, { CITY: "Lewes", METRO: "Delaware" });
  assert.deepEqual(dry.body.plan[0].body.interests, { "dryrun-events": false, "dryrun-beer": false, "dryrun-music": false, "dryrun-merch": true });
  // Without a configured secret a dry-run token verifies with the dev secret.
  reset();
  const devTok = signToken({ h: "abc", d: 1 }, "soulmega-capture-dev-secret-not-for-live-use");
  const devRes = await hit(preferences, { origin: "http://localhost:5181", body: { token: devTok, skipped: true } });
  assert.equal(devRes.statusCode, 200);
  assert.deepEqual(devRes.body.plan.map((c) => c.method), ["POST"]);
});

test("preferences: no interest ids in live mode skips interests and warns", async () => {
  reset(LIVE);
  routes = [mailchimp()];
  let res;
  const logs = await quiet(async () => {
    res = await hit(preferences, { body: { token: prefsToken(), interests: ["events"], city: "Balt1more!" } });
  });
  assert.equal(res.statusCode, 200);
  assert.match(logs.warn.join(" "), /MAILCHIMP_INTEREST_IDS/);
  assert.deepEqual(mcCalls().map((c) => c.method), ["POST"], "no PATCH when nothing to write");
  assert.deepEqual(normalizePreferences({ interests: ["merch", "beer", "beer", 3], city: "Coeur d’Alene" }), {
    skipped: false, interests: ["beer", "merch"], city: "Coeur d'Alene", metro: "Elsewhere", tags: ["prefs-set"],
  });
});

test("preferences: Mailchimp 401 is 503, missing member is 401", async () => {
  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [(url, call) => (call.method === "PATCH" ? jsonRes(401, { title: "API Key Invalid" }) : undefined)];
  await quiet(async () => {
    assert.equal((await hit(preferences, { body: { token: prefsToken(), interests: [] } })).statusCode, 503);
  });
  reset({ ...LIVE, MAILCHIMP_INTEREST_IDS: JSON.stringify(IDS) });
  routes = [(url, call) => (call.method === "PATCH" ? jsonRes(404, { title: "Resource Not Found" }) : undefined)];
  await quiet(async () => {
    assert.equal((await hit(preferences, { body: { token: prefsToken(), interests: [] } })).statusCode, 401);
  });
});

// ---------- signal ----------

const beacon = (events, over = {}) => JSON.stringify({ v: 1, sid: "sess-1234abcd", events, ...over });
const ev = (e, p, extra = {}) => ({ e, p, c: "events", path: "/events", d: "m", src: "social", ...extra });

test("signal validation", () => {
  const out = validateSignal(JSON.parse(beacon([
    ev("pv", "flyout"), ev("imp", "flyout"), ev("imp", "-"), ev("nope", "flyout"), ev("ok", "flyout", { n: 1 }),
    ev("ok", "flyout", { c: "blog" }), ev("ok", "flyout", { d: "t" }), ev("ok", "flyout", { src: "tv" }),
    ev("prefs_ok", "inline", { n: 500 }), ev("submit", "Bad Placement"),
  ])));
  assert.equal(out.sid, "sess-1234abcd");
  assert.deepEqual(out.events, [
    { e: "pv", p: "-", c: "events", d: "m", src: "social" },
    { e: "imp", p: "flyout", c: "events", d: "m", src: "social" },
    { e: "ok", p: "flyout", c: "events", d: "m", src: "social", n: 1 },
    { e: "prefs_ok", p: "inline", c: "events", d: "m", src: "social" },
  ]);
  const odd = validateSignal(JSON.parse(beacon([ev("imp", "xmv7uzazs-0"), ev("ok", "events-list"), ev("pv", "anything")])));
  assert.deepEqual(odd.events.map((e) => e.p), ["other", "events-list", "-"], "unknown placements pool as other");
  const many = validateSignal(JSON.parse(beacon(Array.from({ length: 40 }, () => ev("imp", "flyout")))));
  assert.equal(many.events.length, 25);
  assert.equal(validateSignal({ v: 1, sid: "x", events: "no" }), null);
  assert.equal(validateSignal(JSON.parse(beacon([], { sid: "bad sid!" }))).sid, "");
});

test("signal: store pipeline payload", async () => {
  reset(STORE);
  routes = [upstash()];
  const res = await hit(signal, { body: beacon([ev("pv", "-"), ev("imp", "flyout"), ev("imp", "flyout"), ev("ok", "flyout", { n: 1 })]) });
  assert.equal(res.statusCode, 204);
  assert.equal(pipelines.length, 2, "rate limit + record");
  assert.equal(pipelines[0][0][0], "INCR");
  assert.match(pipelines[0][0][1], /^smcap:rl:signal:[a-f0-9]{20}:60:\d+$/);
  const d = `smcap:prod:d:${TODAY}`;
  assert.deepEqual(pipelines[1], [
    ["HINCRBY", d, "pv|-|events|m|social", 1],
    ["HINCRBY", d, "imp|flyout|events|m|social", 2],
    ["HINCRBY", d, "ok|flyout|events|m|social", 1],
    ["EXPIRE", d, TTL_SECONDS],
    ["PFADD", `smcap:prod:u:${TODAY}:pv|-`, "sess-1234abcd"],
    ["EXPIRE", `smcap:prod:u:${TODAY}:pv|-`, TTL_SECONDS],
    ["PFADD", `smcap:prod:u:${TODAY}:imp|flyout`, "sess-1234abcd"],
    ["EXPIRE", `smcap:prod:u:${TODAY}:imp|flyout`, TTL_SECONDS],
    ["PFADD", `smcap:prod:u:${TODAY}:ok|flyout`, "sess-1234abcd"],
    ["EXPIRE", `smcap:prod:u:${TODAY}:ok|flyout`, TTL_SECONDS],
  ]);
  assert.equal(TTL_SECONDS, 400 * 86400);
  const raw = JSON.stringify(pipelines);
  assert.ok(!/2001:db8|203\.0\.113/.test(raw), "no raw IP in the store");
  assert.deepEqual(signalCommands({ env: "dev", day: "2026-10-14", events: [ev("imp", "x")], sid: "" }).cmds, [
    ["HINCRBY", "smcap:dev:d:2026-10-14", "imp|x|events|m|social", 1],
    ["EXPIRE", "smcap:dev:d:2026-10-14", TTL_SECONDS],
  ]);
});

test("signal: forged placements cannot mint keys; prod dry-run beacons count as dev", async () => {
  reset(STORE);
  routes = [upstash()];
  await hit(signal, { body: beacon(Array.from({ length: 25 }, (_v, i) => ev("imp", `forged-${i}`))) });
  const d = `smcap:prod:d:${TODAY}`;
  assert.deepEqual(pipelines[1], [
    ["HINCRBY", d, "imp|other|events|m|social", 25],
    ["EXPIRE", d, TTL_SECONDS],
  ], "one field, no HyperLogLog keys");
  reset(STORE);
  routes = [upstash()];
  await hit(signal, { body: beacon([ev("ok", "flyout")], { dryRun: true }) });
  assert.equal(pipelines[1][0][1], `smcap:dev:d:${TODAY}`);
  reset(STORE);
  routes = [upstash()];
  await hit(signal, { origin: "https://soulmega.webflow.io", body: beacon([ev("ok", "flyout")], { dryRun: true }) });
  assert.equal(pipelines[1][0][1], `smcap:stage:d:${TODAY}`, "staging keeps its own class");
});

test("signal: env from origin, unknown origin dropped, 204 always", async () => {
  reset(STORE);
  routes = [upstash()];
  await hit(signal, { origin: "http://localhost:5181", body: beacon([ev("imp", "flyout")]) });
  assert.equal(pipelines[1][0][1], `smcap:dev:d:${TODAY}`);
  reset(STORE);
  routes = [upstash()];
  const res = await hit(signal, { origin: "https://evil.com", body: beacon([ev("imp", "flyout")]) });
  assert.equal(res.statusCode, 204);
  assert.equal(calls.length, 0);
  assert.equal((await hit(signal, { body: "{oops" })).statusCode, 204);
  reset(STORE);
  routes = [() => jsonRes(500, {})];
  await quiet(async () => {
    assert.equal((await hit(signal, { body: beacon([ev("imp", "flyout")]) })).statusCode, 204);
  });
});

test("signal: no store logs one line per batch", async () => {
  reset();
  const logs = await quiet(async () => {
    const res = await hit(signal, { body: beacon([ev("imp", "flyout"), ev("dismiss", "flyout")]) });
    assert.equal(res.statusCode, 204);
  });
  assert.equal(calls.length, 0);
  assert.equal(logs.log.length, 1);
  const line = JSON.parse(logs.log[0]);
  assert.deepEqual(line.smcap.counts, { "imp|flyout|events|m|social": 1, "dismiss|flyout|events|m|social": 1 });
  assert.equal(line.smcap.env, "prod");
});

test("signal: rate limit 120 per minute drops silently", async () => {
  reset();
  let logged = 0;
  await frozenClock(() => quiet(async (logs) => {
    for (let i = 0; i < 122; i++) await hit(signal, { body: beacon([ev("imp", "flyout")]), ip: "192.0.2.200" });
    logged = logs.log.length;
  }));
  assert.equal(logged, 120);
});

// ---------- webhook ----------

const WEBHOOK_BODY =
  "type=unsubscribe&fired_at=2026-10-14+10%3A00%3A00&data%5Baction%5D=unsub&data%5Breason%5D=manual" +
  "&data%5Bemail%5D=person%40example.com&data%5Bmerges%5D%5BEMAIL%5D=person%40example.com" +
  "&data%5Bmerges%5D%5BSOURCE%5D=flyout&data%5Bmerges%5D%5BCONTEXT%5D=events&data%5Bip_opt%5D=203.0.113.5";

test("webhook: key check and GET validation", async () => {
  reset({ SOULMEGA_WEBHOOK_KEY: "hook-key" });
  const ok = await hit(webhook, { method: "GET", origin: null, query: { key: "hook-key" } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body, "ok");
  assert.equal((await hit(webhook, { method: "GET", origin: null, query: { key: "nope" } })).statusCode, 401);
  assert.equal((await hit(webhook, { method: "POST", origin: null, query: {}, body: WEBHOOK_BODY })).statusCode, 401);
  reset();
  assert.equal((await hit(webhook, { method: "GET", origin: null, query: { key: "" } })).statusCode, 401);
});

test("webhook: parses form bodies and never stores or logs the email", async () => {
  assert.deepEqual(parseWebhook(WEBHOOK_BODY), { type: "unsubscribe", day: "2026-10-14", source: "flyout", context: "events" });
  assert.deepEqual(parseWebhook(Object.fromEntries(new URLSearchParams(WEBHOOK_BODY))), {
    type: "unsubscribe", day: "2026-10-14", source: "flyout", context: "events",
  });
  assert.deepEqual(parseWebhook({ type: "profile", fired_at: "2026-10-13 23:59:59", data: { merges: { SOURCE: "footer", CONTEXT: "shop" } } }), {
    type: "profile", day: "2026-10-13", source: "footer", context: "shop",
  });
  assert.deepEqual(parseWebhook("type=cleaned&data%5Bemail%5D=a%40b.co&data%5Bmerges%5D%5BSOURCE%5D=x%7Cevil"), {
    type: "cleaned", day: "", source: "unknown", context: "unknown",
  });

  reset({ ...STORE, SOULMEGA_WEBHOOK_KEY: "hook-key" });
  routes = [upstash()];
  const res = await hit(webhook, { origin: null, query: { key: "hook-key" }, body: WEBHOOK_BODY, headers: { "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(pipelines, [[
    ["HINCRBY", "smcap:prod:mc:2026-10-14", "unsubscribe|flyout|events", 1],
    ["EXPIRE", "smcap:prod:mc:2026-10-14", TTL_SECONDS],
  ]]);
  assert.ok(!calls.some((c) => String(c.raw).includes("example.com")), "email never sent to the store");

  reset({ SOULMEGA_WEBHOOK_KEY: "hook-key" });
  const logs = await quiet(async () => {
    await hit(webhook, { origin: null, query: { key: "hook-key" }, body: Buffer.from(WEBHOOK_BODY) });
    await hit(webhook, { origin: null, query: { key: "hook-key" }, body: "type=sneaky&data%5Bemail%5D=a%40b.co" });
  });
  assert.equal(logs.log.length, 1, "unknown types ignored");
  assert.ok(!logs.log.join(" ").includes("example.com"));
  assert.deepEqual(JSON.parse(logs.log[0]).smcap.mc, { day: "2026-10-14", type: "unsubscribe", source: "flyout", context: "events" });
});

// ---------- report ----------

test("report math", () => {
  const r = buildReport({
    env: "prod",
    from: "2026-10-01",
    to: "2026-10-14",
    capture: {
      "pv|-|events|m|social": 40, "pv|-|home|d|direct": 60,
      "imp|flyout|events|m|social": 30, "imp|flyout|home|d|direct": 10,
      "submit|flyout|events|m|social": 5, "ok|flyout|events|m|social": 4, "err|flyout|events|m|social": 1,
      "dismiss|flyout|home|d|direct": 8, "prefs_view|flyout|events|m|social": 4, "prefs_ok|flyout|events|m|social": 3,
      "prefs_skip|flyout|events|m|social": 1, "imp|events-list|events|d|search": 20, "ok|events-list|events|d|search": 1,
      "imp|other|events|d|direct": 3,
    },
    mc: { "unsubscribe|flyout|events": 2, "unsubscribe|unknown|unknown": 1, "subscribe|flyout|events": 4, "cleaned|unknown|unknown": 3, "profile|footer|home": 2 },
    uniques: { "imp|flyout": 25, "ok|flyout": 4, "imp|events-list": 18, "ok|events-list": null },
  });
  const f = r.byPlacement.flyout;
  assert.equal(f.imp, 40);
  assert.equal(f.ok, 4);
  assert.equal(f.conversion, 0.1);
  assert.equal(f.dismissRate, 0.2);
  assert.equal(f.prefsRate, 0.75);
  assert.deepEqual(f.uniques, { imp: 25, ok: 4 });
  assert.equal(r.byPlacement["events-list"].conversion, 0.05);
  assert.equal(r.byPlacement["events-list"].prefsRate, null);
  assert.deepEqual(r.byPlacement["events-list"].uniques, { imp: 18, ok: null });
  assert.deepEqual(r.byPlacement.other.uniques, { imp: null, ok: null });
  assert.equal(r.byContext.events.imp, 53);
  assert.equal(r.byContext.home.dismiss, 8);
  assert.deepEqual(r.pageviews, { total: 100, byContext: { events: 40, home: 60 } });
  assert.deepEqual(r.mailchimp.unsubscribe.bySource, { flyout: 2, unknown: 1 });
  assert.deepEqual(r.mailchimp.subscribe.bySource, { flyout: 4 });
  assert.equal(r.mailchimp.cleaned, 3);
  assert.equal(r.mailchimp.profile, 2);
  assert.equal(r.bySource.search.imp, 20);
  assert.equal(r.byDevice.m.ok, 4);
  assert.equal(r.byPlacement["-"], undefined);
});

test("report endpoint: auth, store, range, assembly", async () => {
  reset({ SOULMEGA_REPORT_KEY: "report-key" });
  const get = (headers, query) => hit(signal, { method: "GET", origin: null, headers, query: { report: "1", ...query } });
  assert.equal((await get({}, {})).statusCode, 401);
  assert.equal((await get({ authorization: "Bearer wrong" }, {})).statusCode, 401);
  const noStore = await get({ authorization: "Bearer report-key" }, {});
  assert.equal(noStore.statusCode, 501);
  assert.deepEqual(noStore.body, { ok: false, error: "no_store" });

  reset({ SOULMEGA_REPORT_KEY: "report-key", ...STORE });
  assert.equal((await get({ authorization: "Bearer report-key" }, { from: "2026-01-01", to: "2026-06-01" })).statusCode, 400);
  assert.equal((await get({ authorization: "Bearer report-key" }, { env: "qa" })).statusCode, 400);
  routes = [upstash((cmd) => {
    if (cmd[0] === "HGETALL" && cmd[1] === "smcap:prod:d:2026-10-13") return { result: ["imp|flyout|events|m|social", "10", "ok|flyout|events|m|social", "2"] };
    if (cmd[0] === "HGETALL" && cmd[1] === "smcap:prod:d:2026-10-14") return { result: ["imp|flyout|events|m|social", "10", "pv|-|events|m|social", "7"] };
    if (cmd[0] === "HGETALL" && cmd[1] === "smcap:prod:mc:2026-10-14") return { result: ["unsubscribe|flyout|events", "1"] };
    if (cmd[0] === "HGETALL") return { result: [] };
    if (cmd[0] === "PFCOUNT") return { result: cmd[1].endsWith("imp|flyout") ? 15 : 2 };
    return { result: 0 };
  })];
  const res = await get({ authorization: "Bearer report-key" }, { from: "2026-10-13", to: "2026-10-14" });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.env, "prod");
  assert.equal(res.body.byPlacement.flyout.imp, 20);
  assert.equal(res.body.byPlacement.flyout.conversion, 0.1);
  assert.deepEqual(res.body.byPlacement.flyout.uniques, { imp: 15, ok: 2 });
  assert.deepEqual(res.body.pageviews.byContext, { events: 7 });
  assert.deepEqual(res.body.mailchimp.unsubscribe.bySource, { flyout: 1 });
  const pf = pipelines[1].find((c) => c[1].endsWith("imp|flyout"));
  assert.deepEqual(pf, ["PFCOUNT", "smcap:prod:u:2026-10-13:imp|flyout", "smcap:prod:u:2026-10-14:imp|flyout"]);
});

test("date range", () => {
  assert.deepEqual(dateRange("2026-10-12", "2026-10-14").days, ["2026-10-12", "2026-10-13", "2026-10-14"]);
  assert.equal(dateRange("2026-01-01", "2026-04-02").days.length, 92);
  assert.equal(dateRange("2026-01-01", "2026-04-03"), null);
  assert.equal(dateRange("2026-10-14", "2026-10-12"), null);
  assert.equal(dateRange("2026-02-30", "2026-03-01"), null);
  assert.equal(dateRange("yesterday", "2026-03-01"), null);
  const def = dateRange(undefined, undefined, new Date("2026-10-14T15:00:00Z"));
  assert.equal(def.from, "2026-09-15");
  assert.equal(def.to, "2026-10-14");
});

// ---------- setup script ----------

test("setup script: plan is read-only, apply creates only what is missing", async () => {
  const existing = {
    fields: [{ tag: "FNAME", name: "First Name", type: "text" }, { tag: "CITY", name: "City", type: "text" }],
    categories: [{ id: "cat9", title: "What moves you", type: "checkboxes" }],
    interests: [{ id: "int-ev", name: "Events" }],
    segments: [{ id: 101, name: "ctx-events", type: "static" }, { id: 102, name: "Explorer", type: "saved" }],
  };
  let posts = [];
  let next = 500;
  const fake = async (url, init) => {
    const u = new URL(url);
    assert.equal(u.host, "us3.api.mailchimp.com");
    assert.equal(init.headers.Authorization, `Bearer ${API_KEY}`);
    const p = u.pathname.replace(`/3.0/lists/${AUD}`, "");
    if (init.method === "GET") {
      if (p === "") return jsonRes(200, { id: AUD, name: "Soul Mega", stats: { member_count: 900 } });
      if (p === "/merge-fields") return jsonRes(200, { merge_fields: existing.fields });
      if (p === "/interest-categories") return jsonRes(200, { categories: existing.categories });
      if (p === "/interest-categories/cat9/interests") return jsonRes(200, { interests: existing.interests });
      if (p === "/segments") return jsonRes(200, { segments: existing.segments });
    }
    if (init.method === "POST") {
      const body = JSON.parse(init.body);
      posts.push({ path: p, body });
      next += 1;
      return jsonRes(200, { id: p === "/segments" ? next : `new${next}` });
    }
    throw new Error(`unexpected ${init.method} ${url}`);
  };

  const lines = [];
  const plan = await runSetup({ apiKey: API_KEY, fetchImpl: fake, log: (l) => lines.push(l) });
  assert.equal(posts.length, 0, "plan mode writes nothing");
  assert.equal(plan.applied, false);
  assert.equal(plan.actions.filter((a) => a.startsWith("merge field")).length, 9);
  assert.equal(plan.actions.filter((a) => a.startsWith("interest ")).length, 3);
  assert.equal(plan.actions.filter((a) => a.startsWith("tag ")).length, 5);
  assert.equal(plan.actions.filter((a) => a.startsWith("saved segment")).length, 3);
  assert.ok(!lines.join("\n").includes(API_KEY), "never prints the key");

  posts = [];
  const applied = await runSetup({ apiKey: API_KEY, apply: true, fetchImpl: fake, log: (l) => lines.push(l) });
  assert.ok(!lines.join("\n").includes(API_KEY));
  const fieldPosts = posts.filter((x) => x.path === "/merge-fields");
  assert.equal(fieldPosts.length, 9);
  assert.deepEqual(fieldPosts.find((x) => x.body.tag === "GEOIP").body, { name: "IP location", tag: "GEOIP", type: "text", required: false, public: false });
  const interestPosts = posts.filter((x) => x.path === "/interest-categories/cat9/interests").map((x) => x.body.name);
  assert.deepEqual(interestPosts, ["Beer releases", "Music & culture", "Merch"]);
  const tagPosts = posts.filter((x) => x.body.static_segment);
  assert.deepEqual(tagPosts.map((x) => x.body.name), ["ctx-local", "ctx-product", "ctx-radio", "ctx-journal", "ctx-shop"]);
  const social = posts.find((x) => x.body.name === "Social Connector").body;
  const localId = posts.indexOf(tagPosts[0]);
  assert.equal(social.options.match, "any");
  assert.deepEqual(social.options.conditions, [
    { condition_type: "Interests", field: "interests-cat9", op: "interestcontains", value: ["int-ev"] },
    { condition_type: "StaticSegment", field: "static_segment", op: "static_is", value: 101 },
    { condition_type: "StaticSegment", field: "static_segment", op: "static_is", value: 500 + localId + 1 },
  ]);
  assert.equal(posts.filter((x) => x.body.name === "Explorer").length, 0, "existing saved segment left alone");
  assert.equal(applied.interestIds.events, "int-ev");
  assert.ok(lines.some((l) => l.startsWith("MAILCHIMP_INTEREST_IDS={")));
});

// ---------- run ----------

let failed = 0;
for (const t of tests) {
  try {
    await t.fn();
    console.log(`ok   ${t.name}`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL ${t.name}`);
    console.log(e?.stack || e);
  }
}
setEnv();
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exitCode = failed ? 1 : 0;
