# Content Audit — Launch March 11

> Edit `src/data/seed.js` for all content changes.
> Images go in `public/images/` and are referenced as `/images/...`
> Audio files go in `public/audio/` and are referenced as `/audio/...`
> Check items off as you go. Push when ready.

---

## Priority Matrix

| Priority | Section | What's needed | Effort |
|----------|---------|---------------|--------|
| **P0** | Practice (4) | Rewrite case study format — consolidate "before" context, remove before/after slides, focus on outcome | High |
| **P0** | Practice (4) | Case study images — hero + figures (count TBD after rewrite) | High |
| **P0** | Writing (17) | Upload audio files for 16 essays (1 missing `audioDur`) | Medium — 16 files |
| **P1** | Exploration | Relational Design images — hero + 6 interstitials | Medium — 7 images |
| **P2** | Writing | Review inline artwork `src` — some blocks missing URLs | Medium |
| **P3** | Artifacts | Diagram Packs + Relational Field Model copy | Low-Medium |
| **P3** | Site-wide | About/Info page, meta tags, OG image | TBD |

---

## Practice — Case Studies

> **Format change needed**: Current structure is before/after with slides (snapshot → context → challenge → reframe → intervention → results → insight). Want to consolidate the "before" context without showing before slides. Copy and component format are partial — need a rewrite pass.

### Apple Music
- [ ] Rewrite: consolidate before context into concise framing
- [ ] Rewrite: simplify to outcome-focused narrative
- [ ] Images: hero + figures (count TBD after format decision)
- [ ] Review: title, subtitle, desc, role, deliverables, tags

### Google Cloud
- [ ] Rewrite: consolidate before context into concise framing
- [ ] Rewrite: simplify to outcome-focused narrative
- [ ] Images: hero + figures (count TBD)
- [ ] Review: title, subtitle, desc, role, deliverables, tags

### Vevo
- [ ] Rewrite: consolidate before context into concise framing
- [ ] Rewrite: simplify to outcome-focused narrative
- [ ] Images: hero + figures (count TBD)
- [ ] Review: title, subtitle, desc, role, deliverables, tags

### Tribeca Festival (archived)
- [ ] Decision: include in launch or keep archived?
- [ ] If including: same rewrite pass as above
- [ ] Images: hero + figures

---

## Writing — Audio Uploads (16 needed)

> 16 of 17 essays need audio files uploaded. Memo 2 (Reshaping Players) also missing `audioDur` in seed data.

| # | Title | Has `audioDur`? | Audio uploaded? |
|---|-------|-----------------|-----------------|
| M1 | Beyond Productivity | ❌ no | [ ] |
| M2 | Reshaping Players | ❌ no | [ ] |
| M3 | Leveling Game | ✅ 21:36 | [ ] |
| M4 | Freedom | ✅ 29:36 | [ ] |
| M5 | Internet and the Age of Emotion | ✅ 41:01 | [ ] |
| M6 | Foundation | ✅ 21:01 | [ ] |
| M7 | Art of Tolerance | ✅ 17:46 | [ ] |
| M8 | Safety Trap | ✅ 20:55 | [ ] |
| M9 | Architecture of Coherence | ✅ 9:47 | [ ] |
| FN | Way of the Wave | ✅ 16:25 | [ ] |
| FN | What Lies Beyond Next | ✅ 15:49 | [ ] |
| FN | Loud Goodbye | ✅ 16:03 | [ ] |
| FN | The Grieving Interface | ✅ 10:05 | [ ] |
| FN | Terms of Visibility | ✅ 5:20 | [ ] |
| FN | After the Bridge | ✅ 10:31 | [ ] |
| FN | The False Step | ✅ 12:59 | [ ] |
| FN | Beyond Age | ✅ 15:36 | [ ] |

**To do:**
- [ ] Upload 16–17 audio files to `public/audio/`
- [ ] Add `audioDur` to Memo 1 and Memo 2 in seed.js
- [ ] Wire audio file paths in seed data or component

---

## Writing — Body + Covers (17)

> Body copy and Substack cover images exist for all 17 pieces. These need a review pass, not a rewrite.

### Memos (9)
- [x] Body copy — all 9 have full content
- [x] Cover images — all via Substack CDN
- [ ] Review: inline artwork blocks — some missing `src` URLs
- [ ] Review: captions and alt text across all memos

### Field Notes (8)
- [x] Body copy — all 8 have full content
- [x] Cover images — all via Substack CDN
- [ ] Review pass on each

---

## Exploration (3)

### Relational Design *(live)*
- [x] Full theory content (intro, abstract, 6 sections, 8 principles, 6 lineages, works cited, colophon)
- [ ] `images.hero` — hero image
- [ ] `images.inter1`–`inter6` — 6 interstitial images
- [ ] Review: section body copy final pass

### GSL — Generative Simulation Layer *(wip)*
- [x] Hypothesis + 5 fragments + 4 open questions + 3 connections
- [ ] Decision: ready for launch or keep WIP?
- [ ] Review: fragment content final pass

### Hybrid Intelligence *(wip)*
- [x] Hypothesis + 6 fragments + 4 open questions + 2 connections
- [ ] Decision: ready for launch or keep WIP?
- [ ] Review: fragment content final pass

---

## Artifacts (3)

### Diagram Packs *(wip, v0.3)*
- [x] Spec outline (4 anatomy items, usage, source)
- [ ] Flesh out anatomy descriptions
- [ ] Decision: ready for launch or hold?

### Compression Sequence *(live, v1.0)*
- [x] Full prompt content + 4 anatomy items + usage
- [ ] Review pass — content is complete

### Relational Field Model *(seed, v0.1)*
- [x] Spec outline (4 anatomy items, usage, source)
- [ ] Expand content from outline to full descriptions
- [ ] Decision: promote to `wip` or `live` for launch?

---

## Site-Wide

- [ ] Hero dashboard grid — confirm labels are final
- [ ] Hero headline — confirm final
- [ ] Footer content — review
- [ ] About/Info page — content pass
- [ ] Field Console — review law names and descriptions
- [ ] Favicon / OG image for social sharing
- [ ] Meta description for SEO
- [ ] Mobile responsive spot-check all sections

---

## Summary of Open Work

| Category | Items | What's needed |
|----------|-------|---------------|
| Practice rewrite | 4 case studies | Consolidate before context, new format, images |
| Audio upload | 16–17 files | Upload + wire into site |
| Writing review | 17 essays | Inline artwork URLs, captions, alt text |
| Exploration images | 7 | Relational Design hero + interstitials |
| Artifacts copy | 2 | Diagram Packs + Relational Field Model |
| Site-wide | — | Meta, OG, footer, mobile QA |

---

## Week-by-Week Suggestion

### Week 1 (Mar 1–7) — Heavy Lift
- [ ] Rewrite Practice case study format (decide structure, rewrite all 4)
- [ ] Upload 16 audio files + wire paths
- [ ] Prepare + add Practice images
- [ ] Prepare + add Exploration images (Relational Design)
- [ ] Decide on Artifacts: ship or hold
- [ ] Decide on Tribeca: ship or hold

### Week 2 (Mar 8–10) — Polish + QA
- [ ] Writing review pass (inline artwork, captions)
- [ ] Full site walkthrough — every page, every detail view
- [ ] Mobile responsive check
- [ ] Link check (Substack, LinkedIn, all external)
- [ ] OG image + meta tags for sharing
- [ ] Performance check (image sizes, load time)
- [ ] Final push

### Launch Day (Mar 11)
- [ ] DNS / domain if custom
- [ ] Share link
