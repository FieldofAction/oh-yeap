# Field Standard — public typography v1

## Approved direction

Evolve the existing site, not its identity. Give the work presence, reading comfort,
and supporting information clarity. Existing page-specific color logic is protected.
The work title should be more prominent than the section category above it.

## Implementation

`src/styles/field-standard.css` is the single source of typography tokens and role
mappings. `src/main.jsx` imports it after the public app and its component styles.
It is deliberately not imported by `src/studio-main.jsx`.

`withFieldStandard` in `scripts/field-standard-lib.mjs` inlines that same stylesheet
into the generated experiments index and every published experiment. The builder
still generates `public/experiments/`; do not edit or commit generated pages.
The experiment renderer, content contract, content files, URLs and metadata stay
unchanged. Rebuild experiments after changing the shared stylesheet.

`npm run typography:test` checks the scope contract and integration. The tests also
run before the normal production build. No dependencies were added or changed.

## First-pass coverage

- Public homepage: posture-strip text, section hierarchy, Workbench/practice entries,
  Writing featured entries and index, artifact titles and descriptions.
- Reading: essay and Field Note titles, body copy, section headings, captions and
  metadata; case-study prose and supporting catalogue/intervention text.
- About and Colophon; Relational Design overview, long-form text and content headings.
- Materials in Relation: introductory typography only, not the dense instrument UI.
- Experiments: index and all generated entries, including headings, prose and metadata.
- Shared navigation text sizes, without changing navigation structure or behavior.

This is a shared public-content implementation, not an indiscriminate resize of
all CSS. The interactive hero's letter field, identity assets, specialized art
surfaces, fixed-format graphics, and private Studio controls are intentionally not
rescaled. Bespoke case-study display compositions keep their authored sizes.

## Sizes at a default 16 px root

| Role | Range |
| --- | --- |
| Page title | 38–68 px |
| Field Note title | 32–52 px |
| Featured work | 28–40 px |
| Section / experiment band | 22–26 px |
| Featured index entry | 20–24 px |
| Reading subsection | 18–19 px |
| Introductory deck | 19–22 px |
| Long-form body | 17–18 px |
| Supporting copy | 16–17 px |
| Captions | 13 px |
| Metadata | 12 px |
| Compact labels | 11 px |

Sizes use rem-based bounds, with viewport interpolation between them. The root
font size is not reset. Existing Hanken Grotesk, Schibsted Grotesk and Space Mono
assignments remain intact; this layer contains no font-family declarations.
Display weights generally settle at 500, body copy at 400. Reading line-height is
1.65; title leading is role-specific. This is not a 100 px headline rollout.

## Metadata correction

Experiment tags span the full facts grid using `.x-fact:has(.x-tags)`, rather than
assuming tags are the seventh field. The fallback is normal wrapping within the
existing cell. Other facts use two columns on phones, three on wider screens and
one at very narrow widths. Labels, identifiers and long tags wrap without clipping,
including when the root text size is doubled. Surfaces and borders are unchanged.

## Protected scope

Do not add color, background, opacity, font-family, decorative borders, shadows,
filters, motion, global h1/p resets or `!important` declarations to this stylesheet.
Do not alter theme tokens, wordmarks, copy, imagery, routes, navigation architecture,
data visibility, instrument behavior, or existing animation/interaction code for
this refinement. Any later container simplification needs a page-specific reason.

## Verification status at initial implementation

- 12 Node contract/integration tests pass locally.
- 24 Chromium review-fixture cases pass: homepage Threshold, homepage Daylight and
  Experiment 010 at 320 / 390 / 768 / 1200 px, with 16 / 32 px root sizes.
- Those fixture checks compare each element's text/background/border color, opacity
  and font family before and after; verify content identity; check document and
  selected text/metadata overflow; and confirm work titles outrank section labels.
- The fixtures are source-based reconstructions from the approved review, **not a
  full React checkout or production screenshots**. They render using fallback fonts
  in this network-restricted environment. This does not establish font-loaded,
  cross-browser or whole-site accessibility conformance.

## Before merging

1. Confirm the PR's Vercel production build succeeds (including typography tests).
2. Open the deployment with the actual site fonts loaded. Compare home in both
   Threshold and Daylight; open a Writing entry, the Workbench case study, About,
   Colophon, Relational Design and Materials in Relation.
3. Review `/experiments/` and long experiment titles and bodies at desktop and phone
   widths. Check tags, optional confidence fields, lists, related links and code.
4. Check keyboard focus, existing menus/theme switching, browser zoom and narrow
   layouts. Compare protected page colors against main; no palette changes belong here.
5. Merge only after review. A branch/PR is not a production rollout.

## Rollback

Revert this change as a unit. For an isolated trial, removing the public CSS import
restores public React styling; removing the builder wrapper restores generated
experiment styling on the next build. Do not delete the stylesheet while its imports
or the build guard still refer to it.
