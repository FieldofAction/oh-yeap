import {
  DEV_SECRET, captureSecret, clientIp, cors, envFlag, fail, geoFromHeaders, ipHash, json, noContent, readJson,
} from "./_lib/soulmega/http.js";
import { CONSENT_VERSIONS, buildSignup, isTrap, validateSubscribe } from "./_lib/soulmega/audience.js";
import { createMailchimp, redactPlan } from "./_lib/soulmega/mailchimp.js";
import { rateLimit } from "./_lib/soulmega/store.js";
import { signToken } from "./_lib/soulmega/token.js";

// Soul Mega audience capture, step 1: email + 21+ affirmation in, a member
// on the list and a short-lived token for step 2 out.
//
// POST /api/soulmega-subscribe  (text/plain JSON from sm-capture.js)
//   -> { ok, status: "subscribed"|"pending"|"updated", token, geo?, dryRun?, plan? }
//    | 409 { error: "bounced" | "rejected" }  Mailchimp will not take this address
//
// Only soulmega.com origins write to Mailchimp. Staging, local and the lab
// are always dry run: the response carries the plan of Mailchimp calls live
// mode would make, and nothing is sent. A dry run for a soulmega.com origin
// (SOULMEGA_CAPTURE_DRY_RUN=1, or a preview page) also logs the plan, redacted.

const LIMITS = [
  { max: 6, windowSec: 60 },
  { max: 30, windowSec: 3600 },
];

export default async function handler(req, res) {
  const origin = cors(req, res);
  if (req.method === "OPTIONS") return origin ? noContent(res) : fail(res, 403, "forbidden");
  if (!origin) return fail(res, 403, "forbidden");
  if (req.method !== "POST") return fail(res, 405, "method_not_allowed");

  const body = await readJson(req);
  if (!body) return fail(res, 400, "bad_request");

  const ip = clientIp(req);
  if (await rateLimit("subscribe", ipHash(ip), LIMITS)) {
    res.setHeader("Retry-After", "60");
    return fail(res, 429, "rate_limited");
  }

  const checked = validateSubscribe(body);
  if (checked.error) return fail(res, 400, checked.error);
  if (!CONSENT_VERSIONS.includes(checked.value.consent)) {
    console.warn("soulmega-subscribe: consent id not in the archive:", checked.value.consent);
  }

  const dryRun = origin !== "prod" || body.dryRun === true || envFlag("SOULMEGA_CAPTURE_DRY_RUN");
  const secret = captureSecret() || (dryRun ? DEV_SECRET : null);
  const provider = createMailchimp({ dryRun });
  if (!secret || !provider.ready) {
    console.error("soulmega-subscribe:", !secret ? "SOULMEGA_CAPTURE_SECRET is not set" : provider.problem);
    return fail(res, 503, "unavailable");
  }

  const geo = geoFromHeaders(req);
  const reply = (status, id, { trap = false, existing = false } = {}) =>
    json(res, 200, {
      ok: true,
      status,
      token: signToken({ h: id, d: dryRun ? 1 : 0, x: trap, e: existing }, secret),
      ...(geo ? { geo } : {}),
      ...(dryRun ? { dryRun: true, plan: provider.plan } : {}),
    });

  // Bots get a convincing success and nothing is written.
  if (isTrap(body)) return reply("subscribed", provider.memberId(checked.value.email), { trap: true });

  try {
    const result = await provider.subscribe(buildSignup(checked.value, { ip, geo }));
    if (dryRun && origin === "prod") {
      console.log(JSON.stringify({ smcap_plan: { endpoint: "subscribe", status: result.status, plan: redactPlan(provider.plan) } }));
    }
    // A hard-bounced address: nothing was written, and the person should try another.
    if (result.status === "bounced") return fail(res, 409, "bounced");
    return reply(result.status, result.id, { existing: !result.isNew });
  } catch (e) {
    console.error("soulmega-subscribe:", e?.message || e);
    if (e?.code === "invalid_email") return fail(res, 400, "invalid_email");
    // Mailchimp's final no for this address: the client must not route around it.
    if (e?.code === "rejected") return fail(res, 409, "rejected");
    return fail(res, 503, "unavailable");
  }
}
