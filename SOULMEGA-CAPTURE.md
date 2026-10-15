# Soul Mega audience capture

Prototype v1.0.0. This is the engineering guide for whoever deploys and runs it.

soulmega.com is a Webflow site. Its only signup today is the footer "Join Greatness" form, which Webflow sends
straight to Mailchimp with no source, no interests and no consent record. This system replaces that path with one
script on soulmega.com and four small functions on this Vercel project (www.fieldofaction.org):

- **One script, three surfaces.** `sm-capture.js` renders an engaged-reader flyout, an inline invitation on each
  key page, and an age checkbox plus fine print under the existing footer form. Everything renders inside Shadow
  DOM, so the ~300 global `!important` rules on soulmega.com cannot reach it.
- **Two steps.** Step 1 is email plus a required "I'm 21 or older" box. Step 2 (optional) is interests and city.
- **Mailchimp stays the list.** The functions write the member, first-touch attribution, the 21+ affirmation, the
  consent version, tags and interests to audience `94b16e1a8e`. The browser never talks to the Mailchimp API.
- **First-party measurement.** The script sends small beacons (impressions, submits, dismissals). The signal
  function counts them in Upstash Redis and serves a per-placement report. No third-party analytics.

Nothing here touches the live site until the release steps below are followed.


## Architecture

```
 soulmega.com (Webflow)                          www.fieldofaction.org (Vercel "oh-yeap")
+-------------------------------+               +-----------------------------------------------+
| any page                      | GET + SRI     | /soulmega/capture/sm-capture-<v>.js           |
|  footer site script           |-------------> |   immutable, cached for a year                |
|                               | GET           | /soulmega/capture/config.json                 |
|  <sm-capture> hosts           |-------------> |   copy, placements, flyout, kill switch       |
|  (Shadow DOM):                |               |                                               |
|   - flyout                    | POST          | /api/soulmega-subscribe ---+                  |
|   - inline, per page          |-------------> | /api/soulmega-preferences -+--> Mailchimp     |
|   - footer extras             | text/plain    |                                 API (us3)     |
|                               | sendBeacon    | /api/soulmega-signal ------+--> Upstash       |
|                               |-------------> |   beacons in, report out        Redis         |
|                               |               |                                               |
|                               |               | /api/soulmega-mailchimp-webhook <-- Mailchimp |
|                               |               |   subscribe, unsubscribe, cleaned...          |
+-------------------------------+               +-----------------------------------------------+

 If subscribe cannot save the signup (503, a timeout, or a dry-run answer to a
 page that did not ask for one), the script sends the email to Mailchimp's
 public signup endpoint (JSONP), the way the footer works today, with the same
 AGE21, CONSENT, SOURCE, CONTEXT and SIGNUPPG stamps as hidden merge fields.
```


## Files

| File | What it is |
|---|---|
| `public/soulmega/capture/sm-capture.js` | The client module. One classic-script IIFE, no dependencies, `const VERSION`. |
| `public/soulmega/capture/config.json` | Remote config: copy, contexts, routes, placements, flyout rules, kill switch. |
| `public/soulmega/capture/sm-capture-<v>.js` | Released, immutable copies. Written by the release script. |
| `public/soulmega/capture/lab.html` | The prototype lab (noindex). Mock soulmega.com pages plus a QA panel. |
| `api/soulmega-subscribe.js` | Step 1. |
| `api/soulmega-preferences.js` | Step 2. |
| `api/soulmega-signal.js` | Beacons in (POST), report out (GET). |
| `api/soulmega-mailchimp-webhook.js` | Mailchimp audience events, counted without storing emails. |
| `api/_lib/soulmega/*.js` | HTTP helpers, audience model, Mailchimp adapter, token, store. |
| `scripts/soulmega-mailchimp-setup.mjs` | Audience schema setup. Plan by default, `--apply` to write. |
| `scripts/soulmega-capture-test.mjs` | Tests. No network. |
| `scripts/soulmega-capture-dev.mjs` | Local server for the lab and the handlers. |
| `scripts/soulmega-capture-release.mjs` | Versioned copy, SRI hash, Webflow registration payload. |

npm scripts: `soulmega:test`, `soulmega:lab`, `soulmega:release`, `soulmega:setup`.


## HTTP contract (summary)

Base URL in production: `https://www.fieldofaction.org/api`. Always the `www` host: the bare domain answers 307.

The client sends every POST as `Content-Type: text/plain;charset=UTF-8` with a JSON string body, which avoids a CORS
preflight. Responses are JSON with `Cache-Control: no-store`, CORS echoing allowed origins, and `Vary: Origin`.
`OPTIONS` answers 204.

**Origin classes.** Only `prod` may write to Mailchimp.

| Class | Origins | Writes to Mailchimp |
|---|---|---|
| `prod` | `https://www.soulmega.com`, `https://soulmega.com`, anything in `SOULMEGA_CAPTURE_EXTRA_ORIGINS` | yes, unless dry-run |
| `stage` | `https://soulmega.webflow.io` | never (always dry-run) |
| `dev` | `http://localhost:*`, `http://127.0.0.1:*`, `https://www.fieldofaction.org`, `https://fieldofaction.org` | never (always dry-run) |
| other | | 403, no CORS header |

A request is also dry-run when its body has `dryRun: true` or when `SOULMEGA_CAPTURE_DRY_RUN=1`. In dry-run the
functions run the same logic, record the Mailchimp calls they would have made, and return them as `plan`. For a
`prod` origin they also log the plan as one `{"smcap_plan":...}` line with the address, IP and member hash redacted.

The script asks for dry run itself (`dryRun: true` in every body) in the lab, in preview (`?sm_cap=preview`), on any
`*.webflow.io` host, and when `config.json` sets `dryRun`. A page that did not ask for dry run treats a dry-run
answer as "not saved" and uses the fallback, so a visitor is never told they are on the list when nothing was
written. A dry-run signup outside the lab does not mark the browser as subscribed.

| Endpoint | Request | Answers |
|---|---|---|
| `POST /soulmega-subscribe` | `{v, email, age21, consent, placement, context, page, event?, attribution, hp, elapsed, sid, dryRun?}` | 200 `{ok, status: subscribed\|pending\|updated, token, geo?, dryRun?, plan?}`; 400 `invalid_email`, `age_required`, `bad_request`; 409 `bounced` (the address hard-bounced, nothing written), `rejected` (Mailchimp's final no for this address); 429 `rate_limited`; 503 `unavailable` (client falls back) |
| `POST /soulmega-preferences` | `{v, token, interests[], city, skipped, placement, context, sid, dryRun?}` | 200 `{ok, dryRun?, plan?}`; 401 `expired`; 409 `rejected`; 429 |
| `POST /soulmega-signal` | `{v, sid, dryRun?, events: [{e, p, c, path, d, src, n?}]}`, up to 25 | 204 always |
| `GET /soulmega-signal?report=1&from&to&env` | `Authorization: Bearer <SOULMEGA_REPORT_KEY>` | 200 report; 401; 501 `no_store` without Upstash |
| `GET /soulmega-mailchimp-webhook?key=` | Mailchimp's URL check | 200 `ok`; 401 on a bad key |
| `POST /soulmega-mailchimp-webhook?key=` | `application/x-www-form-urlencoded` from Mailchimp | 200; counts by type, SOURCE and CONTEXT |

Bot traps (a filled honeypot, or under 1.2 s from render to submit) get a normal-looking 200 and write nothing.
Rate limits are per hashed IP: subscribe 6 a minute and 30 an hour, preferences 20 a minute, signal 120 a minute.
These endpoints and Upstash never store a raw IP (rate limits key on a salted hash). The signup IP does go to
Mailchimp as `ip_signup`, which Mailchimp keeps on the member as part of the opt-in record: the privacy policy must
say so. The step-1 token is an HMAC that expires after two hours.

What subscribe writes. Step 1 only proves that someone knows an address, so an existing member's record is only
filled where it is empty:

| Member | Status written | Merge fields |
|---|---|---|
| new (404) | `subscribed`, or `pending` with double opt-in | everything: `SOURCE`, `CONTEXT`, `SIGNUPPG`, `CAMPAIGN`, `REFERRER`, `AGE21`, `CONSENT`, `GEOIP`, `METRO` |
| `subscribed`, `pending` | unchanged | only fields that are empty (no PATCH at all when the record is complete) |
| `unsubscribed`, `archived` | `pending`: Mailchimp emails a confirmation, and they rejoin only by confirming it. A repeat signup then finds them `pending`, so the email is not sent again | empty fields, plus fresh `AGE21` and `CONSENT` (the record of this new opt-in) |
| `transactional` (a buyer who never opted in) | `subscribed` (or `pending`): this signup is their opt-in | as for `unsubscribed` |
| `cleaned` (hard-bounced) | nothing; the answer is 409 `bounced` and the person is asked for another address | nothing |

Tags on every write: `src-<placement>`, `ctx-<context>`, `evt-<event>`, `web-signup`. A Mailchimp 400 that is final
for the address ("Member In Compliance State", "Forgotten Email Not Subscribed") answers 409 `rejected`, and the
script shows "We couldn't add that address. Try another one?" without falling back. 401, 403, 429, 5xx, timeouts
and a merge-field error (setup not applied) answer 503, and the script falls back.

The step-1 token records whether the member already existed (`e:1`). For such a token, step 2 only adds: chosen
interests become true and nothing is turned off, and CITY and METRO are written only when CITY is empty. For a member
the signup created, the chips are the person's whole statement (unchosen interests go false).

Step 1 still answers `updated` or `pending` for an address already on the list, so the response shows whether an
address is a member, much as Mailchimp's own hosted form does ("is already subscribed"). The per-IP rate limit is the
only brake on that. With `SOULMEGA_DOUBLE_OPT_IN=1`, a new address cannot be subscribed by someone else either;
that is a product decision (see "Double opt-in" below).


## Consent versions

Every signup stores `CONSENT: "<consentId> YYYY-MM-DD"` and `AGE21: "YYYY-MM-DD checkbox"`. The id names the exact
wording the person agreed to, archived here. Any edit to `copy.age`, `copy.fine`, `copy.privacy` or `copy.cta` in
`config.json` (or the footer's button) changes that wording, so it ships with a new `consentId` (`email-v2`, and so
on), a new row below, and the id added to `CONSENT_VERSIONS` in `api/_lib/soulmega/audience.js`. The subscribe
function still stores an id it does not know, and logs it.

| Id | Since | Surface | Exact wording |
|---|---|---|---|
| `email-v1` | 2026-10-14 | flyout and inline invitations | Checkbox (required): "I’m 21 or older". Fine print: "For adults 21+. Unsubscribe anytime. Privacy Policy" (links to `/privacy`). Button: "Keep me posted" |
| `email-v1` | 2026-10-14 | footer (Webflow form) | Button: "Join Greatness" (Webflow). Checkbox and fine print added by the script, same words as above |
| `email-v1` | 2026-10-14 | Mailchimp hosted-form fallback | Whatever surface the person used (above); the fallback sends the same `AGE21` and `CONSENT` values as hidden merge fields |


## Environment variables

Set these in the Vercel project ("oh-yeap"), Production unless noted. A change only takes effect after a redeploy.

| Variable | Needed | What it does |
|---|---|---|
| `MAILCHIMP_API_KEY` | live writes | Server-side key. The datacenter is the suffix after `-` (Soul Mega is `us3`). Keys made on or after 2026-06-22 expire one year after creation: put the rotation date in the team calendar. |
| `MAILCHIMP_AUDIENCE_ID` | no | Defaults to `94b16e1a8e` ("Soul Mega"). |
| `MAILCHIMP_INTEREST_IDS` | live interests | JSON `{"events":"..","beer":"..","music":"..","merch":".."}`, printed by the setup script. Without it, step 2 still writes CITY, METRO and tags, skips interests and logs a warning. |
| `SOULMEGA_DOUBLE_OPT_IN` | no | `1` makes new members `pending` until they confirm by email. Default single opt-in. |
| `SOULMEGA_CAPTURE_SECRET` | live writes | HMAC secret for step-1 tokens and IP hashing. 32+ random bytes, e.g. `openssl rand -base64 48`. Live requests without it answer 503. Dry-run uses a fixed dev secret. |
| `SOULMEGA_CAPTURE_DRY_RUN` | no | `1` forces dry-run for every origin. Keep it on until the controlled live test. |
| `SOULMEGA_CAPTURE_EXTRA_ORIGINS` | no | Comma list of extra `prod` origins. |
| `SOULMEGA_REPORT_KEY` | for the report | Bearer key for `GET /api/soulmega-signal?report=1`. |
| `SOULMEGA_WEBHOOK_KEY` | for the webhook | Shared key in the webhook URL. |
| `SOULMEGA_GEO` | no | `0` stops the GEOIP and METRO write from Vercel's IP geo headers. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | for counters | Injected by the Upstash Marketplace integration. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. Without them, beacons and webhooks are logged, one JSON line per batch, and the report answers 501. |

Local dev server only (never set these on Vercel):

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `5181` | Port. |
| `HOST` | `127.0.0.1` | Bind address. |
| `SOULMEGA_CAPTURE_LIVE` | unset | `1` stops the server forcing `SOULMEGA_CAPTURE_DRY_RUN=1`. Localhost is still a `dev` origin, so this alone writes nothing. |
| `SOULMEGA_CAPTURE_DEV_GEO` | `Washington,DC,US` | Simulated Vercel geo headers (`City,REGION,CC`), or `0` for none. |
| `SOULMEGA_CAPTURE_API_DIR` | `<repo>/api` | Folder of `soulmega-*.js` handlers to serve. |


## Local development

```
npm run soulmega:lab        # http://localhost:5181/soulmega/capture/lab.html
npm run soulmega:test       # unit tests, no network
npx eslint api/soulmega-*.js api/_lib/soulmega public/soulmega scripts/soulmega-*.mjs
```

The Claude preview config `soulmega-capture-lab` in `.claude/launch.json` starts the same server.

The dev server serves `public/` with no caching and runs `api/soulmega-<name>.js` with Vercel-shaped `req` and `res`
(`req.query`, `req.body` parsed by content type, `req.cookies`, `res.status()`, `res.json()`, `res.send()`). It
adds the client IP and simulated geo headers that Vercel's edge would add. `GET /` redirects to the lab. Handlers are
imported once: restart the server after editing them, or run `node --watch scripts/soulmega-capture-dev.mjs`. To load
a local env file: `node --env-file=.env.local scripts/soulmega-capture-dev.mjs`.

The webhook and the report check their keys locally too, so they answer 401 until `SOULMEGA_WEBHOOK_KEY` and
`SOULMEGA_REPORT_KEY` are set. Any value works on your machine:
`SOULMEGA_WEBHOOK_KEY=dev SOULMEGA_REPORT_KEY=dev npm run soulmega:lab`. The report then answers 501 `no_store`
until Upstash is configured.

The rate limits apply locally as well. Without Upstash they are kept in the server's memory, so a seventh signup
inside a minute from your machine shows "Something went sideways." Restart the server to clear them.


## The lab

`/soulmega/capture/lab.html` shows the prototype inside mock-ups of soulmega.com. It is unlisted, carries
`noindex,nofollow` (meta tag and `X-Robots-Tag` header), and it is safe to share: every request it makes is dry-run
twice over (the page sets `lab: true, dryRun: true`, and www.fieldofaction.org is a `dev` origin). Its Content
Security Policy only allows its own origin, so it cannot reach list-manage.com even by mistake, and native form posts
are blocked.

The mock pages are built from the saved live HTML of 2026-10-13/14. The site CSS in the file is a copy of the live
CSS of that date (the shared Webflow stylesheet filtered to the classes the mock-ups use, the site head code, the
footer component embed, the site footer "system layer", and each page's own code), comments removed. That includes
the global `!important` rules on inputs, buttons, placeholders, `p` and `svg` that the module has to survive. If the
live site changes a lot, refresh those blocks from the live pages.

The QA panel (top left on desktop, a "Lab" tab on a phone) has page links, Show flyout now, Reset state, toggles for
API down and fast triggers, links for preview mode and arriving as a subscriber, the module's `state()`, and a live
log of `smcap:track`, `smcap:request` and `smcap:response` events with their JSON, including the dry-run Mailchimp
`plan`. It keeps clear of the flyout's corner. On desktop it tucks down to its title bar while the footer form is
on screen, since the form sits at the very bottom of the page and cannot scroll out from under it; hover or focus
the bar to open it again.


## QA switches

| Switch | Where | Effect |
|---|---|---|
| `?sm_cap=preview` | any page with the script | Ignores suppression, shows the flyout after 1 s, forces dry-run. Safe on production: a signup made in preview is not saved (and the browser is not marked as subscribed), and its beacons count as `dev`. Do not share preview links with the public. |
| `?sm_cap=reset` | any page with the script | Clears the module's storage (`smcap:*`), then runs normally. |
| `?sm_sub=1` | any page with the script | Marks the visitor as subscribed (hides invitations), then removes itself from the URL. An `mc_eid` parameter (from Mailchimp email links) also marks them subscribed. |
| `?path=/beer` | lab | Which page to simulate. Default `/home-enter`. Also `/`, `/collabs`, `/events`, `/journal`, `/journal/a-little-something-for-dc`, `/radio`, `/find-us`, `/contact-us`, `/markus`. Anything else shows the 404 page. |
| `?fast=1` | lab | Flyout after 6 s engaged, or 3 s plus half a scroll. |
| `?down=1` | lab | Subscribe answers 503, so the fallback path runs (dry-run, nothing is sent). |

Kill switch: set `"enabled": false` in `config.json` and deploy. Pages loaded after that render nothing (the file
is cached for up to 300 s). A page that was already open checks `config.json` again before it shows its flyout,
so no new flyout appears; an inline invitation or flyout already on screen stays until the next page load, and
signups made from it still go through the API.


## Remote config keys worth knowing

- `api` and `mailchimpFallback.action`, `.u`, `.id` are pinned by the script: `config.json` is not covered by the
  SRI hash, so it cannot send addresses anywhere else. `api` must be `https://www.fieldofaction.org/api` (or `/api`
  in the lab); the fallback must be a `https://<x>.usN.list-manage.com/subscribe/post-json` URL with hex ids.
  Anything else falls back to the built-in values.
- `mailchimpFallback.enabled: false` turns the hosted-form fallback off. Visitors then see "Something went sideways.
  Try again in a minute." when the API cannot save, and keep their typed address for the retry.
- `placements[].rule: false` drops the inline invitation's top hairline where the page already draws one
  (`events-list` ships with it).
- Thresholds take 0 literally: `flyout.engagedSeconds: 0` shows on the first engaged second, `dismissDays: 0` means
  a dismissal never suppresses.
- Beacons are counted per placement only for the ids in `KNOWN_PLACEMENTS` (`api/_lib/soulmega/audience.js`):
  `flyout`, `footer`, `inline` and the eight config placements. Any other id is counted as `other`, so a forged
  beacon cannot create new Redis keys. Add an id there when adding a placement or a `data-sm-cap` slot.

The flyout also steps aside (hidden and inert) whenever any part of the site footer is on screen, unless focus is
inside it, and never appears while the footer is in view: one invitation at a time, and the footer links stay
reachable. Phones in landscape and any window under 500 px tall get the docked, collapsed flyout.


## Mailchimp setup

1. In Mailchimp (Profile > Extras > API keys), create a key for this integration. Note its expiry date.
2. Run the plan. It is read-only and prints what exists and what it would create:
   ```
   MAILCHIMP_API_KEY=xxxx-us3 npm run soulmega:setup
   ```
3. Review the plan with the Soul Mega team: 10 merge fields (`CITY METRO GEOIP SOURCE CONTEXT SIGNUPPG CAMPAIGN
   REFERRER AGE21 CONSENT`, CITY public so the preference center shows it), the "What moves you" interest group
   (Events, Beer releases, Music & culture, Merch), the `ctx-*` tags and four saved segments (Social Connector,
   Explorer, Culture Participant, Brand Enthusiast). The audience allows 30 merge fields: check the count in the plan.
4. Apply. It creates only what is missing, so it is safe to run again:
   ```
   MAILCHIMP_API_KEY=xxxx-us3 npm run soulmega:setup -- --apply
   ```
5. Copy the printed `MAILCHIMP_INTEREST_IDS` JSON into Vercel. Add `MAILCHIMP_API_KEY` to Vercel as a sensitive
   variable. The script never prints the key.
6. Webhook (after Upstash, step below): in the audience settings, add
   `https://www.fieldofaction.org/api/soulmega-mailchimp-webhook?key=<SOULMEGA_WEBHOOK_KEY>` for subscribe,
   unsubscribe, profile, cleaned, email changed and campaign events. Mailchimp checks the URL with a GET first.
7. Before going live, confirm the audience has a postal address in its settings (CAN-SPAM).

Double opt-in: with `SOULMEGA_DOUBLE_OPT_IN=1`, new members are `pending` until they click Mailchimp's confirmation
email. Mailchimp only attaches interest groups to subscribed members, so step-2 interests written to a pending
member may not stick. Test this with one address before choosing double opt-in. It is also the only setting that
stops someone from subscribing an address they do not own (single opt-in trusts whoever types it); the compliance
checklist (N1) suggests it for abuse-prone sources, or everywhere if deliverability slips.


## Upstash Redis (counters and the report)

The code works without it: beacons are logged and the report answers 501. To turn counting on:

1. Get approval first. It adds a Marketplace integration, and possibly billing, to the Vercel team.
2. In the Vercel dashboard, open the project "oh-yeap", then Storage, Create Database, and choose **Upstash for
   Redis** (Marketplace integration `upstash/upstash-kv`). Pick the region nearest the functions (Vercel's default
   is Washington, D.C., `iad1`). Connect it to the project for Production and Preview.
3. The integration injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Redeploy.
4. Check: a page view on the lab should leave a `smcap:dev:d:<date>` hash in the database.

Keys expire after 400 days. Counts are kept per environment (`prod`, `stage`, `dev`), so lab traffic never mixes
with production numbers.


## Release and Webflow registration

A released file never changes. Any change to `sm-capture.js` after a release needs a new `VERSION`.

1. Bump `const VERSION` in `public/soulmega/capture/sm-capture.js` (semantic version).
2. Run the release script:
   ```
   npm run soulmega:release
   ```
   It writes `public/soulmega/capture/sm-capture-<VERSION>.js`, refuses if that file exists with different bytes,
   and prints the sha384 SRI hash and the Webflow payload:
   ```json
   {
     "hostedLocation": "https://www.fieldofaction.org/soulmega/capture/sm-capture-1.0.0.js",
     "integrityHash": "sha384-...",
     "version": "1.0.0",
     "displayName": "sm_capture"
   }
   ```
   `--out <dir>` writes the file somewhere else (for a dry run of the release itself).
3. Commit the versioned file, merge and deploy. Check the URL answers 200 with
   `cache-control: public, max-age=31536000, immutable` and `access-control-allow-origin: *`.
4. Register it in Webflow with **register_hosted_script** using the payload above.
5. Apply it with **add_site_script**: the registered script's id, location `footer`, and the same version.
   **Never use set_site_scripts.** It replaces the whole list of applied scripts and would drop
   `footer_reveal_repair` (and anything else already applied).
6. Publish to the staging domain `soulmega.webflow.io` first. Staging is always dry-run, so test there with
   `?sm_cap=preview`.
7. Publish to production. **A Webflow publish ships every change staged in the Designer along with the script.**
   Check with the Soul Mega team that nothing half-finished is staged before you publish.

The script loads `config.json` from the same folder as its own URL, so copy changes ship by deploying
`config.json` with no new release. Remote config is fetched with a 1.5 s timeout and falls back to built-in defaults.

To roll back: apply the previous version with add_site_script and publish, or use the kill switch.


## Rollout order

1. **Privacy policy.** Publish one on soulmega.com at `/privacy` (today it is a 404). The fine print on every
   capture point links to it, and Delaware law requires one for any commercial site that collects personal data from
   Delaware users. This blocks launch.
2. **Secrets.** In Vercel, set `SOULMEGA_CAPTURE_SECRET`, `SOULMEGA_REPORT_KEY`, `SOULMEGA_WEBHOOK_KEY`, and
   `SOULMEGA_CAPTURE_DRY_RUN=1`.
3. **Mailchimp.** Key, setup plan, review, `--apply`, then `MAILCHIMP_INTEREST_IDS` and `MAILCHIMP_API_KEY` in Vercel.
4. **Upstash.** After approval, provision and redeploy.
5. **Deploy this branch.** Run the lab on www.fieldofaction.org on desktop and a phone.
6. **Release and stage.** Release script, register, add_site_script (footer), publish to `soulmega.webflow.io`,
   test with `?sm_cap=preview`. On `*.webflow.io` the script always runs dry, so nothing is written from staging.
7. **Check the fallback once, by hand.** From a team address, submit Mailchimp's hosted form directly with the
   hidden fields the fallback sends (`AGE21`, `CONSENT`, `SOURCE`, `CONTEXT`, `SIGNUPPG`; the setup script must have
   created them) and confirm in Mailchimp that they landed on the member. If they did not, set
   `mailchimpFallback.enabled: false` in `config.json` before step 8: a fallback signup without its age record fails
   checklist item S1.
8. **Production, API still dry.** Publish to soulmega.com with `SOULMEGA_CAPTURE_DRY_RUN=1` still set. The API writes
   nothing and logs each redacted plan (`smcap_plan` lines in the function logs). The script sees the dry-run answer,
   counts the signup as not saved and sends it through the hosted-form fallback, so no visitor's signup is lost (with
   the fallback off they see "Something went sideways" instead, so keep this step short). Read the plans and the
   beacons in Upstash.
9. **One controlled live signup.** Remove `SOULMEGA_CAPTURE_DRY_RUN`, redeploy, sign up once with a team address,
   check the member in Mailchimp (merge fields, tags, interests), then unsubscribe it.
10. **Webhook.** Add the Mailchimp webhook.
11. **Watch and tune.** Read the report after a week. Tune placements and flyout timing in `config.json`. Copy edits
    to the consent wording need a new `consentId` (see "Consent versions").


## vercel.json and PR #127

This branch adds a `headers` array to `vercel.json`:

- `/soulmega/capture/sm-capture-(.*)\.js`: `Cache-Control: public, max-age=31536000, immutable`
- `/soulmega/capture/config.json`: `Cache-Control: public, max-age=300, stale-while-revalidate=86400`
- `/soulmega/capture/lab.html`: `X-Robots-Tag: noindex, nofollow`

Open PR #127 (Markus voice and live face) also adds a `headers` array, for `/vendor/(.*)`. Whichever merges second
will conflict in `vercel.json`. Resolve it by hand into one array that keeps all four entries:

```json
"headers": [
  {
    "source": "/vendor/(.*)",
    "headers": [
      { "key": "Access-Control-Allow-Origin", "value": "*" },
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]
  },
  {
    "source": "/soulmega/capture/sm-capture-(.*)\\.js",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]
  },
  {
    "source": "/soulmega/capture/config.json",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=300, stale-while-revalidate=86400" }
    ]
  },
  {
    "source": "/soulmega/capture/lab.html",
    "headers": [
      { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
    ]
  }
]
```

After the merge, check the headers on a preview deployment with `curl -sI`.


## Things to know

- **The footer form's action is double-escaped** on the live site (`&amp;amp;id=`), so today's Webflow submit
  probably never reaches the list. The module takes over the footer submit in the capture phase and leaves the
  markup alone. If the module is ever removed, fix that action in the Designer.
- **SMS is off.** The UI never asks for a phone number. When Soul Mega has an age-gated Mailchimp SMS program,
  set `sms.enabled` and `sms.url` in `config.json` to show a hand-off link after signup. It shows only where both
  switches agree: the context is listed in `sms.contexts` and that context's own `sms` is `true` (today: events).
- **The Mailchimp key expires.** A 401 from Mailchimp makes subscribe answer 503 (the client falls back to
  Mailchimp's public endpoint, with the age and consent stamps) and logs that the key may have expired.
- **The lab's CSS is a snapshot.** See "The lab" above.
