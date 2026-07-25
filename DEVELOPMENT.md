# Field of Action — Development

How this site is built, run, and extended. For a collaborator who already knows React. For the *why* behind it, see the case study; this is the *how*.

One React 19 + Vite codebase produces **two builds** from the same source: a **public** site (the portfolio) and a **studio** site (private tools). All content lives in a single seed file. There is no CMS, no router library, and no backend of its own — routing is hash-based and the only server calls are to Anthropic, from the studio.

---

## Quick start

```bash
npm install
npm run dev          # vite dev server on http://localhost:5180
```

`.claude/launch.json` also defines a `dev` config (port 5180, `--strictPort`, auto-port).

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server (public tree by default) |
| `npm run build` | Public build → `dist/` |
| `npm run build:studio` | Studio build (`BUILD_TARGET=studio`), renames `studio.html` → `index.html` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the last build |
| `npm run atlas:validate` / `atlas:matchday` | World Cup Atlas data tooling (see `ATLAS.md`) |

**Env vars.** Only two, both optional for normal work:

- `ANTHROPIC_API_KEY` — read in `vite.config.js` for the dev-only `/api/generate` and `/api/anthropic` proxies. Needed **only** to exercise the AI studio tools that use the server proxy (Breakground, Desert, FOA Generator) in dev. The public site needs no key.
- `BUILD_TARGET` — `public` (default) or `studio`. Selects the HTML entry. Set on the Vercel project, not locally.

Node version is **not pinned** (no `.nvmrc`/`engines`); use a current LTS. Studio tools that call Anthropic from the browser read the key from the studio's Settings panel (stored in `localStorage`), not from env — see [Studio & agents](#studio--agents).

---

## Architecture

### Two entry points, two React trees

| | Public | Studio |
|---|---|---|
| HTML | `index.html` | `studio.html` (`noindex`) |
| Boot | `src/main.jsx` → `PublicApp.jsx` | `src/studio-main.jsx` → `App.jsx` |
| Default view | `public` | `studio` |
| Content | reads `SEED` | reads `SEED` + agent/studio data |

Both mount `#root` in `<StrictMode>` and import `index.css` + `styles/main.css`. The two trees import **disjoint** module sets — this is what keeps proprietary studio code out of the public bundle (see below).

### Routing (hash-based, no library)

`PublicApp.jsx` maps views to hashes via `VIEW_TO_HASH` (e.g. `patiobeach → #patio-beach`, `canon → #relational-design`, `hotelnest → #hotel/nest`); `viewFromHash()` inverts it. Unknown hashes fall back to the `public` view through a `PUBLIC_VIEWS` allow-set.

- **Detail deep links (public only):** `#item/<slug>` opens a content item's overlay. `openItem()` prefers `item.slug`, falls back to the random `item.id`; `findItemByHash` resolves either against `SEED`. Loading an `#item/…` URL directly synthesizes a home history entry so browser Back returns to the listing.
- `popstate`/`hashchange` keep the view and theme in sync; `navigateTo` does a 200ms fade (`view-leaving`), scrolls to top, and `pushState`s the hash.
- `App.jsx` (studio) uses the same pattern but has extra in-app views (`model`, `playbook`, `console`, `press`, `nestcompositor`, …) reached via `navigateTo`, and no `#item/` deep links.

### State

`src/store/useASUStore.js` is a localStorage-backed hook (key `asu-store`), **studio only** — it holds `settings` (apiKey/model), `playbook`, `backstage`, `system`, `artOfModel`, and `atrium`. Methods are named MCP-tool-style (`get_*`/`set_*`). The public app carries none of this; it uses `src/hooks/usePublicSystemCondition.js`. Exploration-sketch edits overlay through `src/store/useExplorationStore.js` (keyed by title).

### Theming

`src/data/themes.js` exports `THEMES` — five flat token palettes: `threshold` (dark), `canon` (mid-grey), `light`, `daylight` (paper, public work views), `info` (grey). `cv(t)` maps a palette to CSS custom properties (`--bg`, `--fg`, …) applied inline on the root `.app-layout`. The theme switches automatically per view via `themeForView(v)`:

- work views (`public`, `superconscious`, `patiobeach`, …) → `threshold`, or `daylight` when the visitor toggles light (persisted as `foa-work-light`)
- `canon` → `canon`; `about`/`colophon` → `info`; everything else → `light`

The accent is always cobalt `#2F5BFF`. There is no `data-theme` attribute; daylight adds a `theme-daylight` class. The light/dark toggle only renders on work views.

### Directory map

```
src/
  components/        all views + tools; details/ (CaseStudy, WritingDetail, Sketchbook,
                     SpecSheet, TheoryDetail), ui/ (Card, PracticeRow, …), Hero* visuals
  data/             seed.js (all content), themes.js, models.js, patterns.js,
                    agents.js (private) / agents-public.js, atrium-mocks.js, …
  lib/              atrium-bundle.js, atrium-llm.js, atrium-runners.js, pressHelpers.js, sky.js
  hooks/            usePublicSystemCondition.js, useSwipeNav.js
  store/            useASUStore.js, useExplorationStore.js
  main.jsx / PublicApp.jsx      → public tree
  studio-main.jsx / App.jsx     → studio tree
public/             images/, media/, audio/, standalone HTML (world-cup-atlas.html,
                    start-here.html), atlas-data.json, favicon.svg
scripts/            *.mjs build/QA tooling (atlas, Puppeteer captures, OG render, nest)
```

### The public / studio split

`BUILD_TARGET` picks the Vite input (`vite.config.js`): `studio` → `studio.html`; default → `index.html`. Because the two React trees import different modules, the studio-only code — `useASUStore.js`, `Backstage.jsx`, `IncandescantLab.jsx`, `agents.js`, and every agent-calling tool — is **never imported by `PublicApp.jsx`**, so the proprietary agent prompts do not enter the public bundle. Public and studio are separate Vercel projects sharing this repo, differentiated only by the `BUILD_TARGET` env var. The studio surface is gated at the edge (Vercel), not in app code.

---

## Adding content

All content is objects in the `SEED` array in **`src/data/seed.js`** (which also exports `uid()`, `isHidden()`, `NOW`, and `VIS` placeholder-art generators). Both trees import `SEED` and filter it.

### Item shape

Common top-level fields (real example, trimmed):

```js
{ id: uid(), slug: "workbench", section: "practice", published: true,
  title: "Workbench", subtitle: "Field of Action's Practice Surface",
  desc: "…", year: "2026", status: "live",
  tags: ["Practice","Method","Systems"], relations: [],
  role: "Designer", hasVisual: true,
  caseStudy: { … } }              // ← payload key decides the detail view
```

- `slug` is stable and powers the shareable `#item/<slug>` link. **Give every item a slug** — without one the deep link uses the random `id` and won't survive a reload.
- `status`: `live` / `wip` / `seed` / `draft` (…); `draft` is filtered from listings.
- `relations` is an array of other item **titles**; it drives the relation filter (press `G`).
- The **payload key present decides which detail view renders**: `body` → essay, `caseStudy` → case study, `sketch` → sketchbook, `spec` → spec sheet, `theory` → theory page.

### Sections

| `section` | Renders as | Nav | Notes |
|---|---|---|---|
| `practice` | Case study (`caseStudy`) | Practice | Wave-1 gated — needs `published: true` |
| `writing` | Essay (`body`) | Writing | all current items are `writeType: "memo"` |
| `exploration` | Sketchbook (`sketch`) or Theory (`theory`) | Exploration | empty on public today |
| `artifacts` | Spec sheet (`spec`) | Artifacts | |

### Case-study blocks

`item.caseStudy` holds narrative sub-objects (`framing`, `reframe`, `intervention`, `outcomes`, `images`) plus a `layout` array of blocks, rendered by `src/components/details/CaseStudy.jsx`:

| block `type` | key fields |
|---|---|
| `hero` | `src`, `alt`, `caption`, `variant` (`float`\|`frame`) |
| `figure` | `src`, `alt`, `caption`, `variant` |
| `two-up` / `three-up` / `grid` / `triptych` | `images:[{src,alt,caption}]`, `caption` |
| `section` | `label` |
| `body` | `key` (pulls a caseStudy sub-object) or literal `text` |
| `pull-quote` | `text` |
| `sticky` / `split` | `heading`, `body`, `src`/`images` |
| `device` | `src`, `alt`, `caption` |
| `video` | `url` (or item `videoUrl`), `poster` |
| `reframe` / `intervention` / `insight` | none — render from the caseStudy sub-objects |

(Plus composite blocks: `atmosphere`, `collage`, `plate`, `diptych`, `catalogue`, …)

### Essay body

`section: "writing"` items carry a `body` array (rendered by `WritingDetail.jsx`):

```js
body: [
  { type: "text", content: "…" },
  { type: "artwork", src: "/images/essays/…png", alt: "…", caption: "…" },
  { type: "credit", thesis: "…" },
  { type: "citations", items: ["<strong>…</strong>. …"] },
]
```

Audio: set `audioSrc` (an `/audio/*.m4a` path) for the inline player, or `audioDur` + `substackUrl` for a "Listen on Substack" link. Sketch, theory, and spec shapes follow the same pattern — see the respective `details/` renderer for their fields.

### Hidden items & the Wave-1 gate

```js
export const isHidden = (item) =>
  Boolean(item?.hidden) || (item?.section === "practice" && !item?.published);
```

Two ways to hide: `hidden: true`, or a `practice` item without `published: true` (the Wave-1 launch gate — only "Workbench" is published today). Listings use `SEED.filter(c => import.meta.env.DEV || !isHidden(c))`, so **dev shows everything**. On the studio deployment, appending `?preview` reveals hidden items on the live site.

### Media

Images live under `public/images/<category>/…` (`case-studies`, `essays`, `theory`, `hotel`, `nest`, …); other media under `public/media/…`; audio under `public/audio/*.m4a`. Reference them by absolute path from the `public` root, e.g. `/images/case-studies/Workbench/band.png`. Archives (Patio Beach, NYC, Superconscious) are **not** in `SEED` — they're hardcoded in their own components / `src/data/nycArchive.js`.

**To add a case study:** append a `section:"practice"`, `published:true` object with a `slug` and a `caseStudy:{ framing, reframe, intervention, outcomes, layout:[…] }`; drop art in `public/images/case-studies/<Name>/`.
**To add an essay:** `section:"writing"`, `writeType:"memo"`, a `body:[…]` array, optional `audioSrc`. Give it a `slug`.

---

## Studio & agents

High level — the studio is where the practice's tools live, and it stays private on purpose.

- **The agent model.** An eleven-agent system organized in three rings — an operational cycle, a practice layer, and a governance layer. The roster and one-line roles are in `src/data/agents-public.js` (the public-safe slice, used by the About page). The **full system prompts live in `src/data/agents.js`**, which is imported only by studio modules (`useASUStore.js`, `Backstage.jsx`, `IncandescantLab.jsx`) and **never by the public tree** — that import isolation is the whole point of the two-build split. Treat `agents.js` as proprietary; don't wire it into any public path.
- **Atrium** (`src/lib/atrium-*.js`, state in `useASUStore.atrium`) is the orchestration surface that runs modules in sequence. It runs "shape-honest" mocks (`atrium-mocks.js`) by default and real LLM runs for a small set of wired modules when a key is present; `atrium-bundle.js` exports a portable *field-direction bundle* (`field-direction-bundle/v1`) meant to seed downstream tools. Details intentionally omitted.
- **Tools** (studio components): Studio/Atrium home, Art of Model, Playbook, Field Console, Backstage, Lab, FOA Generator, Breakground, Desert, Exploration Editor, and the Press container (Nest Compositor, Nest Reel).
- **Anthropic integration.** Bring-your-own-key: the Backstage **Settings** panel writes `settings.apiKey` and picks `settings.model` into `localStorage`. Most tools call `api.anthropic.com` directly from the browser with that key; three (Breakground, Desert, FOA Generator) POST to `/api/generate`, which currently exists **only** as a dev Vite middleware (see below).

---

## Deploy

`vercel.json`:

```json
{ "buildCommand": "if [ \"$BUILD_TARGET\" = \"studio\" ]; then npm run build:studio; else npm run build; fi",
  "rewrites": [
    { "source": "/world-cup-atlas", "destination": "/world-cup-atlas.html" },
    { "source": "/start-here",      "destination": "/start-here.html" } ] }
```

- **Public** deploy: `vite build` → `dist/index.html` (from `PublicApp`). Serves `https://fieldofaction.org`.
- **Studio** deploy: `BUILD_TARGET=studio` build, `studio.html` becomes `index.html`, served at `studio.fieldofaction.org`, edge-gated on Vercel.
- **Standalone pages:** anything in `public/*.html` ships as-is. `world-cup-atlas.html` and `start-here.html` get clean URLs via the rewrites above (mirror a new rewrite here when you add another standalone page; dev serves the `.html` path directly except for `/world-cup-atlas`, which a Vite plugin rewrites).

### Known gaps / TODO

- **`/api/generate` has no production handler** — it's only the dev Vite middleware, so Breakground / Desert / FOA Generator's proxy path won't work on the deployed studio until a serverless function is added.
- **DNS / apex→www / SSL** are managed on Vercel, not in the repo (`launch-plan.md` still lists them as open).
- **Node version** is unpinned — add `.nvmrc`/`engines` if the team wants a guaranteed version.
- The **studio edge-gate/password** is configured on Vercel, outside version control.
