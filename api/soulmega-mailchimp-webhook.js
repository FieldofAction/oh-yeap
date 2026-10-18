import process from "node:process";
import { Buffer } from "node:buffer";
import { fail, query, readBody, safeEqual } from "./_lib/soulmega/http.js";
import { CONTEXTS, PLACEMENT_RE, ymd } from "./_lib/soulmega/audience.js";
import { recordWebhook } from "./_lib/soulmega/store.js";

// Mailchimp audience webhook for Soul Mega capture measurement.
//
// GET  /api/soulmega-mailchimp-webhook?key=...  -> 200 "ok" (Mailchimp checks the URL)
// POST /api/soulmega-mailchimp-webhook?key=...  application/x-www-form-urlencoded
//   type=unsubscribe&fired_at=...&data[merges][SOURCE]=flyout&...
//
// Tallies {type}|{SOURCE}|{CONTEXT} per day so unsubscribes can be traced back
// to the placement that brought someone in. The email address is never read,
// stored or logged.
// Payload format: https://mailchimp.com/developer/marketing/api-concepts/webhooks/

const TYPES = ["subscribe", "unsubscribe", "profile", "upemail", "cleaned", "campaign"];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v : Array.isArray(v) && typeof v[0] === "string" ? v[0] : "");

// Only the non-personal fields we count. Vercel may hand the body over as a
// string, a Buffer, a flat object ("data[merges][SOURCE]") or a nested one.
export function parseWebhook(body) {
  let flat = Object.create(null);
  if (body instanceof Uint8Array) body = Buffer.from(body).toString("utf8");
  if (typeof body === "string") {
    for (const [k, v] of new URLSearchParams(body)) {
      if (!(k in flat)) flat[k] = v;
    }
  } else if (isObj(body)) {
    flat = body;
  }
  const merges = isObj(flat.data) && isObj(flat.data.merges) ? flat.data.merges : null;
  const merge = (tag) => str(merges ? merges[tag] : flat[`data[merges][${tag}]`]).trim();
  const source = merge("SOURCE");
  const context = merge("CONTEXT");
  const firedDay = /^(\d{4}-\d{2}-\d{2})/.exec(str(flat.fired_at))?.[1] || "";
  return {
    type: str(flat.type).trim(),
    day: firedDay,
    source: PLACEMENT_RE.test(source) ? source : "unknown",
    context: CONTEXTS.includes(context) ? context : "unknown",
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = String(process.env.SOULMEGA_WEBHOOK_KEY || "").trim();
  const given = String(query(req).key || "");
  if (!key || !safeEqual(given, key)) return fail(res, 401, "unauthorized");

  if (req.method === "GET" || req.method === "HEAD") {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send("ok");
  }
  if (req.method !== "POST") return fail(res, 405, "method_not_allowed");

  try {
    const { value, error } = await readBody(req, 65536);
    const event = error ? null : parseWebhook(value);
    // Anything unrecognized is acknowledged so Mailchimp does not retry it.
    if (event && TYPES.includes(event.type)) {
      await recordWebhook({
        day: event.day || ymd(new Date()),
        type: event.type,
        source: event.source,
        context: event.context,
      });
    }
  } catch (e) {
    console.error("soulmega-mailchimp-webhook:", e?.message || e);
  }
  return res.status(200).json({ ok: true });
}
