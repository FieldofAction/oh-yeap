# Hidden Items — Revisions Thread

Items flagged `hidden: true` in `src/data/seed.js` are filtered out of every public surface (cards, detail overlays, cross-linking from Models and Pattern Language) via `App.jsx:174`. The data is intact; they're invisible until the flag comes off.

Two other hide mechanisms are also active: a Wave-1 launch gate that removes all `section: "practice"` items, and a title-match in `Public.jsx:208` that relocates Relational Design out of the Exploration grid into the CANON nav.

---

## Currently hidden — full list

### A. By `hidden: true` flag (this revisions thread)

| # | Item | Section | Status | Type | Why hidden |
|---|------|---------|--------|------|-----------|
| 1 | Diagram Packs | Artifacts | wip / v0.3 | Spec sheet | No diagram assets; preview caption references diagrams that don't exist yet |
| 2 | Relational Field Model | Artifacts | seed / v0.1 | Spec sheet | No preview visual; couples tightly to Relational Design canon without adding new signal |
| 3 | Hybrid Intelligence | Exploration | wip | Sketchbook | Fragments reference visuals (agent comparison, architecture diagram) with no `src`; reads as essay, not sketch |
| 4 | Condition-First | Exploration | wip | Sketchbook | Held back for revision pass |

*With Condition-First and Hybrid Intelligence both hidden, the public Exploration section is now empty. The filter button and section header still render on direct navigation; consider suppressing empty sections in `Public.jsx` if that becomes visually awkward.*

### B. By Wave-1 launch gate (`section !== "practice"` at [App.jsx:174](src/App.jsx:174))

| # | Item | Section | Year | Status | Type |
|---|------|---------|------|--------|------|
| 4 | Apple Music | Practice | 2023– | live | Case study |
| 5 | Google Cloud | Practice | 2021–2023 | live | Case study |
| 6 | Vevo | Practice | 2016–2021 | live | Case study |
| 7 | Tribeca Festival | Practice | 2014–2016 | archived | Case study |

*Wave 2 refinement ships these back on. See the comment block at [App.jsx:171–174](src/App.jsx:171).*

### C. Relocated, not hidden

| # | Item | From | To | Mechanism |
|---|------|------|----|-----------|
| 8 | Relational Design | Exploration grid | CANON sidebar nav | Title-match filter at [Public.jsx:208](src/components/Public.jsx:208) |

---

## Level of effort per item (hidden-flag items)

### 1. Diagram Packs — **M/L**
**Missing**
- 4 actual diagram assets: Field Diagram, Emergence Pattern, Feedback Loop, Threshold Map
- Preview visual (currently `{type:"visual", caption:"..."}` with no `src`)

**Ready**
- Anatomy, usage, source — all written and solid

**Shape of the work**
- Decide whether to draw these in Figma/SVG or render procedurally in-app. Procedural would match the rest of the site's posture (HeroGrid, HeroSignalGrid, etc.); static assets would ship faster but feel less native.

---

### 2. Relational Field Model — **M**
**Missing**
- One preview visual: the model itself (agents as nodes, conditions as gradients, signals as arrows, coherence zones as regions)

**Ready**
- Anatomy, usage, source — all written and solid

**Open question**
- Does this belong as its own Artifact, or as a diagram *inside* the Relational Design canon? It's spatial expression of the theory — moving it into Canon may be more coherent than shipping it as a standalone spec sheet. Decision first, production second.

---

### 3. Hybrid Intelligence — **L**
**Missing**
- 2 visual fragments (currently captioned, no `src`): agent output comparison + architecture diagram
- A real sketch posture. Current fragments are retrospective notes; the form wants present-tense artifacts — screenshots of actual runs, actual agent disagreements, a working Backstage pipeline trace

**Ready**
- Hypothesis + open questions — strong, keep

**Shape of the work**
- The Backstage pipeline itself is the living instrument. Best path: wire a "snapshot" action in Backstage that produces sketch fragments automatically, then let this page be the feed. Otherwise it'll stay in the "unfinished essay" trap.

---

### 4. Condition-First — **TBD**
Held for revision pass. LOE to be filled in as the direction becomes clear.

---

## Residual references (not hidden, live as strings)

These still appear as applied-in chips on Models / Pattern Language, even though the items themselves don't open:

- **Hybrid Intelligence** — `src/data/models.js` (mm-18, mm-19, mm-36) and `src/data/patterns.js` (pl-009, pl-018, pl-041, pl-080, pl-083, pl-148, pl-159)
- **Diagram Packs** — `src/data/patterns.js` (pl-207, pl-249, pl-252)
- **Relational Field Model** — `src/data/patterns.js` (pl-001, pl-028, pl-106, pl-205)
- **Compression Sequence** (visible) references Hybrid Intelligence in `relations` and `source`

Clicking any of these chips now resolves to `undefined` in `findSeedItem` and no overlay opens — graceful but silent. If we want a cleaner hide, filter these `appliedIn` entries out or suppress unresolved chips in `Models.jsx:52` / `PatternLanguage.jsx`.

**Effort to suppress:** S. One-line filter in each chip renderer: `appliedIn.filter(t => content.find(c => c.title === t))`.

---

## How to unhide

Remove `hidden: true` from the item's seed entry. Nothing else changes.

## How to add another hidden page

Add `hidden: true` to the seed entry. The filter in `App.jsx:174` catches it across Public, Models, and Pattern Language.
