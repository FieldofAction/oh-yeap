import {
  DEV_SECRET, captureSecret, clientIp, cors, envFlag, fail, ipHash, json, noContent, readJson,
} from "./_lib/soulmega/http.js";
import { normalizePreferences } from "./_lib/soulmega/audience.js";
import { createMailchimp, redactPlan } from "./_lib/soulmega/mailchimp.js";
import { rateLimit } from "./_lib/soulmega/store.js";
import { peekToken, verifyToken } from "./_lib/soulmega/token.js";

// Soul Mega audience capture, step 2: interests and city for the member
// named by the step-1 token.
//
// POST /api/soulmega-preferences  { v, token, interests[], city, skipped, ... }
//   -> { ok, dryRun?, plan? } | 401 expired | 409 rejected
//
// A dry-run token (d:1) stays dry run, whatever the origin. A token for a
// member who was already on the list (e:1) only adds interests and fills an
// empty city: whoever holds it has only shown they know the address.

const LIMITS = [{ max: 20, windowSec: 60 }];

export default async function handler(req, res) {
  const origin = cors(req, res);
  if (req.method === "OPTIONS") return origin ? noContent(res) : fail(res, 403, "forbidden");
  if (!origin) return fail(res, 403, "forbidden");
  if (req.method !== "POST") return fail(res, 405, "method_not_allowed");

  const body = await readJson(req);
  if (!body) return fail(res, 400, "bad_request");

  if (await rateLimit("preferences", ipHash(clientIp(req)), LIMITS)) {
    res.setHeader("Retry-After", "60");
    return fail(res, 429, "rate_limited");
  }

  const claims = peekToken(body.token);
  if (!claims) return fail(res, 401, "expired");
  const secret = captureSecret() || (claims.d === 1 ? DEV_SECRET : null);
  if (!secret) {
    console.error("soulmega-preferences: SOULMEGA_CAPTURE_SECRET is not set");
    return fail(res, 503, "unavailable");
  }
  const token = verifyToken(body.token, secret);
  if (!token) return fail(res, 401, "expired");

  const dryRun =
    token.d === 1 || origin !== "prod" || body.dryRun === true || envFlag("SOULMEGA_CAPTURE_DRY_RUN");
  const dry = (plan) => (dryRun ? { dryRun: true, plan } : {});

  // A trapped signup wrote nothing, so there is nothing to update.
  if (token.x === 1) return json(res, 200, { ok: true, ...dry([]) });

  const provider = createMailchimp({ dryRun });
  if (!provider.ready) {
    console.error("soulmega-preferences:", provider.problem);
    return fail(res, 503, "unavailable");
  }

  try {
    await provider.preferences(token.h, normalizePreferences(body), { existing: token.e === 1 });
    if (dryRun && origin === "prod") {
      console.log(JSON.stringify({ smcap_plan: { endpoint: "preferences", plan: redactPlan(provider.plan) } }));
    }
    return json(res, 200, { ok: true, ...dry(provider.plan) });
  } catch (e) {
    console.error("soulmega-preferences:", e?.message || e);
    if (e?.code === "not_found") return fail(res, 401, "expired");
    if (e?.code === "rejected") return fail(res, 409, "rejected");
    return fail(res, 503, "unavailable");
  }
}
