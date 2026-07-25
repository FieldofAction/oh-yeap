# Field of Action — Launch Plan

**Status:** Live. Wave 1 launched April 16, 2026.
**Now shipping toward:** Wave 2.
**Last updated:** July 24, 2026

> The original pre-launch plan (dated March 2026, still marked "pre-launch") is preserved at
> [archive/launch-plan-prelaunch-2026.md](archive/launch-plan-prelaunch-2026.md). This file replaces it.

---

## Where things stand

The site is live. It launched in waves rather than all at once, and it is still building in public.

**Shipped (Wave 1 and after):**

- [x] Public launch — nav trimmed, Studio gated, social metadata (OG card, favicon, share previews)
- [x] Governance split — public bundle at the main domain, studio bundle edge-gated at `studio.fieldofaction.org`
- [x] Hero resolved — `HERO_MODE = 4` (`HeroGrid` shell running the Signal Grid composition)
- [x] Repositioning — "Studio" → "Workshop," employer name off the social card, notebook masthead
- [x] Commerce — `/hotel/nest` storefront wired to Stripe (edition of 100)
- [x] Press tier — Nest Compositor and Nest Reel live
- [x] Atrium orchestration surface (running shape-honest mocks)
- [x] Galaxy instrument, PDF résumé
- [x] World Cup Atlas — standalone, live-tracked through the final

---

## Wave 2 — Open Items

### Content — bring the gated work back on

- [ ] **Ship the four case studies** — Apple Music, Google Cloud, Vevo, Tribeca are hidden by the Wave-1 launch gate (`section !== "practice"` at `App.jsx:174`). Turn the gate off when their detail pages are ready.
- [ ] **Diagram Packs** (Artifacts, hidden) — needs 4 diagram assets (Field Diagram, Emergence Pattern, Feedback Loop, Threshold Map) + a preview visual. Decide: draw in SVG vs. render procedurally (procedural matches the site's posture).
- [ ] **Relational Field Model** (Artifacts, hidden) — needs one preview visual (agents as nodes, conditions as gradients, signals as arrows).
- [ ] **Hybrid Intelligence** and **Condition-First** (Exploration, hidden) — held for a revision pass; with both hidden the public Exploration section is currently empty.
- [ ] **Empty-section handling** — suppress the Exploration header/filter when the section has no visible items (`Public.jsx`).

### Home — hero rotation

- [ ] **Rotate in additional heroes** — Heroes 02–09 are parked in `HEROES.md` and live in the codebase. Bring each into `HeroGrid.HEROES` as its concept matures (Type Field, Constraint Field, Action Vector, Field Pulse, etc.).

### Tools

- [ ] **Poster Generator** (Press) — drafted at 300 DPI; finish and ship.
- [ ] **Atrium** — replace the shape-honest mocks with live interpolators wired to the real agent ring.

### Technical & polish

- [ ] Custom domain / DNS / SSL verification (confirm production state)
- [ ] Cross-browser + mobile spot-check after each wave
- [ ] Confirm keyboard shortcuts (M, P, G, ?, X, Esc) still behave after nav changes

---

## Current site stats

- **513** commits across ~155 days (as of July 20)
- **19** published essays
- **7** public tiers (Work, Canon, Studio/Workshop, Info, Reference, External, Press)
- **956** archived images (Patio Beach + Share Location)
- **11** agents · **71** models · **253** patterns · **4** themes

---

*Waves, not a big bang. Ship what's ready, gate what isn't, keep building in the open.*
