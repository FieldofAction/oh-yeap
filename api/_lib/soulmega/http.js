import crypto from "node:crypto";
import process from "node:process";
import { Buffer } from "node:buffer";

// Request plumbing shared by the Soul Mega capture endpoints: who is calling
// (origin class), CORS, body parsing, JSON replies, client IP, IP geo.
//
// Origin classes decide what a request may do. Only `prod` (soulmega.com)
// can ever write to the mailing list; `stage` and `dev` are always dry run.

const PROD_ORIGINS = ["https://www.soulmega.com", "https://soulmega.com"];
const STAGE_ORIGINS = ["https://soulmega.webflow.io"];
const DEV_ORIGINS = ["https://www.fieldofaction.org", "https://fieldofaction.org"];
const LOCAL_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const ORIGIN_RE = /^https?:\/\/[a-z0-9.-]+(:\d{1,5})?$/;

// Used only in dry run when SOULMEGA_CAPTURE_SECRET is unset, so the lab and
// local work can sign tokens. Live mode never falls back to it.
export const DEV_SECRET = "soulmega-capture-dev-secret-not-for-live-use";

export function envFlag(name) {
  return String(process.env[name] || "").trim() === "1";
}

export function captureSecret() {
  const s = (process.env.SOULMEGA_CAPTURE_SECRET || "").trim();
  return s || null;
}

function extraOrigins() {
  return String(process.env.SOULMEGA_CAPTURE_EXTRA_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/\/+$/, ""))
    .filter((s) => ORIGIN_RE.test(s));
}

// "prod" | "stage" | "dev" | null
export function classifyOrigin(origin) {
  if (typeof origin !== "string" || !origin) return null;
  const o = origin.trim().toLowerCase();
  if (PROD_ORIGINS.includes(o) || extraOrigins().includes(o)) return "prod";
  if (STAGE_ORIGINS.includes(o)) return "stage";
  if (DEV_ORIGINS.includes(o) || LOCAL_RE.test(o)) return "dev";
  return null;
}

export function header(req, name) {
  const v = req.headers?.[name];
  return Array.isArray(v) ? String(v[0] ?? "") : typeof v === "string" ? v : "";
}

// Sets Vary always and the CORS echo only for allowed origins. Returns the
// origin class so the caller can gate on it.
export function cors(req, res, { methods = "POST, OPTIONS", headers = "Content-Type" } = {}) {
  res.setHeader("Vary", "Origin");
  const origin = header(req, "origin").trim();
  const cls = classifyOrigin(origin);
  if (cls) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", methods);
    res.setHeader("Access-Control-Allow-Headers", headers);
    res.setHeader("Access-Control-Max-Age", "600");
  }
  return cls;
}

export function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

export function fail(res, status, error) {
  return json(res, status, { ok: false, error });
}

export function noContent(res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(204).end();
}

export function query(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    return Object.fromEntries(new URL(req.url || "/", "http://local").searchParams);
  } catch {
    return {};
  }
}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// The body as Vercel hands it over: a string (text/plain), an object
// (application/json, urlencoded), a Buffer, or an unread stream (dev, tests).
// Reading req.body can throw on malformed JSON, hence the guard.
export async function readBody(req, maxBytes = 16384) {
  let b;
  try {
    b = req.body;
  } catch {
    return { error: true };
  }
  if (b !== undefined && b !== null) {
    if (b instanceof Uint8Array) {
      return b.length > maxBytes ? { error: true } : { value: Buffer.from(b).toString("utf8") };
    }
    if (typeof b === "string") {
      return Buffer.byteLength(b) > maxBytes ? { error: true } : { value: b };
    }
    return isPlainObject(b) ? { value: b } : { error: true };
  }
  if (typeof req[Symbol.asyncIterator] !== "function") return { value: "" };
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) return { error: true };
    chunks.push(buf);
  }
  return { value: Buffer.concat(chunks).toString("utf8") };
}

// A JSON object from either a string body or an already-parsed one, else null.
export async function readJson(req, maxBytes = 16384) {
  const { value, error } = await readBody(req, maxBytes);
  if (error) return null;
  if (typeof value === "string") {
    if (!value.trim()) return null;
    try {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isPlainObject(value) ? value : null;
}

export function clientIp(req) {
  const fwd = header(req, "x-forwarded-for").split(",")[0].trim();
  return fwd || header(req, "x-real-ip").trim() || req.socket?.remoteAddress || "";
}

// These endpoints never store a raw IP: rate limits key on a salted, truncated
// hash. (The signup IP does go to Mailchimp as ip_signup, part of the opt-in
// record Mailchimp keeps on the member.)
export function ipHash(ip) {
  const salt = captureSecret() || DEV_SECRET;
  return crypto.createHash("sha256").update(`${salt}${ip || "unknown"}`).digest("hex").slice(0, 20);
}

// City-level location from Vercel's edge headers. Off with SOULMEGA_GEO=0.
export function geoFromHeaders(req) {
  if (String(process.env.SOULMEGA_GEO || "").trim() === "0") return null;
  let city = header(req, "x-vercel-ip-city").trim();
  try {
    city = decodeURIComponent(city);
  } catch {
    city = "";
  }
  city = city.replace(/[^\p{L}\p{M} .'-]/gu, "").trim().slice(0, 60);
  const region = header(req, "x-vercel-ip-country-region").trim().toUpperCase();
  const country = header(req, "x-vercel-ip-country").trim().toUpperCase();
  const geo = {
    city,
    region: /^[A-Z0-9]{1,3}$/.test(region) ? region : "",
    country: /^[A-Z]{2}$/.test(country) ? country : "",
  };
  return geo.city || geo.region || geo.country ? geo : null;
}

// Constant-time string compare that does not leak length.
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
