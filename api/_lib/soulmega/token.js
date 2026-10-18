import crypto from "node:crypto";
import { Buffer } from "node:buffer";

// Step-1 to step-2 token: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
// Payload { h: subscriber id, exp: unix seconds, d: 0|1 dry run, x?: 1 trap,
// e?: 1 the member was already on the list }. It lets the preferences call name
// the member without the email coming back from the browser. An e:1 token only
// adds to the record (see mailchimp.preferences).

export const TOKEN_TTL_SECONDS = 2 * 60 * 60;
const B64URL_RE = /^[A-Za-z0-9_-]+$/;

const nowSeconds = () => Math.floor(Date.now() / 1000);

function mac(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest();
}

function decodePayload(body) {
  if (!B64URL_RE.test(body)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p || typeof p !== "object" || Array.isArray(p)) return null;
    if (typeof p.h !== "string" || !p.h || p.h.length > 64) return null;
    if (!Number.isInteger(p.exp) || (p.d !== 0 && p.d !== 1)) return null;
    if (p.x !== undefined && p.x !== 1) return null;
    if (p.e !== undefined && p.e !== 1) return null;
    return p;
  } catch {
    return null;
  }
}

export function signToken({ h, d = 0, x = false, e = false }, secret, { now = nowSeconds(), ttl = TOKEN_TTL_SECONDS } = {}) {
  if (!secret) throw new Error("token secret missing");
  const payload = { h: String(h), exp: now + ttl, d: d ? 1 : 0 };
  if (x) payload.x = 1;
  if (e) payload.e = 1;
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body, secret).toString("base64url")}`;
}

// The claims without checking the signature. Only for choosing which secret
// to verify with (a dry-run token may use the dev secret); never trust it.
export function peekToken(token) {
  if (typeof token !== "string" || token.length > 512) return null;
  const parts = token.split(".");
  return parts.length === 2 ? decodePayload(parts[0]) : null;
}

// The payload when the signature is good and the token is unexpired, else null.
export function verifyToken(token, secret, { now = nowSeconds() } = {}) {
  if (!secret || typeof token !== "string" || token.length > 512) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !B64URL_RE.test(parts[1])) return null;
  const [body, sig] = parts;
  const given = Buffer.from(sig, "base64url");
  const expected = mac(body, secret);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  const payload = decodePayload(body);
  if (!payload || payload.exp <= now) return null;
  return payload;
}
