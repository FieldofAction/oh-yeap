# The Oz Index — operations brief

## What this is
`public/oz-index.html` is The Oz Index, Cultural Infrastructure Instrument 002.
A single self-contained HTML file (~33KB): no build step, no dependencies, no imports,
no web fonts. Its one external asset is the hero plate at `public/media/background-image.png`.
It deploys as a static asset and serves at fieldofaction.org/oz-index.

Thesis under test: every film since 1939 carries a thread back to *The Wizard of Oz*.
The instrument generates every trace live against a fixed taxonomy, so no two are identical.

Two lenses on that thesis, switched by the pill at the top:

| | Film | Spirit |
|---|---|---|
| Taxonomy | STRUCTURE / IMAGE / ICON / PERSONNEL / SOUND / DIRECT CITATION | AWAKENING / THE PATH / COMPANIONS / SHADOW / THE CURTAIN / THE RETURN |
| Rating | Thread (1–5) | Resonance (1–5) |
| Specific | Deep cut | Transmission |
| Honesty | Counterpoint | Sober note |
| Chip verb | Tracing | Walking |
| Extra | — | Exoteric/esoteric duality pair |
| Accent | `#30D158` | `#E8B84B` |

The honesty layer is load-bearing. Both prompts forbid inflating a thin connection:
a low rating plus a counterpoint is a correct, expected output, and Spirit mode is
explicitly permitted to read a film as the journey refused or inverted. If a trace
ever reads like promotion, the prompt has drifted.

## Deploy
The file lives at `public/oz-index.html`. Vite copies `public/` to the deploy root,
so it lands at `/oz-index.html` with its hero at `/media/background-image.png`. The clean URL
`/oz-index` is served by:
- `vercel.json` — a production rewrite `/oz-index` → `/oz-index.html`.
- `vite.config.js` — a dev-server middleware (`standalone-pages-clean-url`) mirroring
  that rewrite for `npm run dev`, shared with the Atlas.

To ship changes: edit the file, commit, push. Vercel does the rest.
Never run a formatter, minifier, or linter over it. Never split it into multiple files.

The page sits in the **spaces** group of the public sidebar, beside the Atlas. The way
back out is a `.foa-back` chevron at the top left of the instrument, matching the Atlas's
in position and wording, so the two are entered and left the same way. Its hit area is
padded to 44px with a compensating negative margin, because below 560px the label is
hidden and the chevron alone is 14px.

## Design — C4 "Emerald"
Register: Apple / OpenAI. System type, near-black canvas `#0A0A0B`, frosted pills,
hairline strokes, generous radii. The chrome recedes so the plate and the prose carry
the piece.

- **The hero plate is the instrument's face.** The travelers on the road approaching the
  Emerald City, full-bleed in a 24px-radius frame, with the trace field floating over its
  foot as a frosted pill at 50-57% of the plate, which clears the travelers' heads at 61%
  by about 4%. Everything else on the page is quiet by comparison. The plate
  lives at `public/media/background-image.png` (1822×1824) and is referenced twice in the
  page: the preload hint in `<head>` and the `<img class="plate">` src, whose `width`/
  `height` reserve the aspect box. Both are written relative (`media/…`, no leading
  slash) so the page renders identically served from the deploy root and opened straight
  off disk. `.hero` carries the plate's `aspect-ratio` and a faint fill of its own, so a
  plate that fails to load leaves the frame and the trace pill intact. A web-weight derivative sits beside it at
  `background-image.jpg` (1600px, 436KB against the PNG's 3.6MB) if load time matters more
  than the lossless master.
- **The registers are the signature move.** Kansas idle holds the plate under
  `saturate(0.35) sepia(0.35) brightness(0.92)`. On resolve it blooms to full color over
  1.6s. That transition is the one orchestrated motion in the piece, and it carries
  information: the state changed. A frosted chip top-left names the state in words —
  Kansas, then Tracing…, then Oz → *title*.
- **The road carries the journey.** Each step of the trace places a numbered frosted
  marker along `TRACK`, a five-point polyline in percentage coordinates. The trace walks
  toward the viewer: step 1 stands with the travelers at 61% and the last step arrives in
  the foreground at 91%. Markers scale `0.72 → 1.14` with distance so they sit in the
  plate's perspective, and they fade in on a 300ms-per-step beat.
  Three constraints bind that span, and any re-fit has to respect all three: the pill
  occupies 50-57%, and a marker behind frosted glass reads as a smudge; the markers are a
  fixed 30px while the plate scales, so below 620px five of them stack into a bead chain
  and are hidden, with the journey card carrying the numbering instead; and the x column
  is sampled from the road's own centreline, so it moves with y. Verified clear at 3, 4,
  and 5 steps, which is the range the contract allows.
- **Motion doctrine.** Fades and a single color bloom. The report rises 12px once on
  arrival; the chip dot pulses only while a trace is open. No springs, parallax, or
  float. `prefers-reduced-motion` removes every animation and the bloom transition.
- **Type is the system stack**, SF Pro on Apple hardware and the platform equivalent
  elsewhere, with tight display tracking (-0.022em at the masthead). Nothing is loaded
  over the network.
- **Print is a first-class view.** "Download PDF" calls `window.print()` against a full
  print stylesheet: white ground, black ink, chrome dropped, cards flattened to
  hairline-ruled sections, a printed header carrying the lens and the film, and
  `break-inside: avoid` on steps, the duality table, and the counterpoint.

Voice: declarative, unhurried, museum-placard register. Sentence case for prose, small
caps for metadata. Spirit mode is liturgical in cadence and precise in claim.

## The two routes it calls
Neither key is ever in the page.

**`/api/generate`** — the trace, and the generated key art. Existing shared Anthropic
proxy (`api/generate.js` in production, a `vite.config.js` middleware in dev). It forwards
the request body verbatim, so the page owns the model, the token budget, and the prompts.
Reads `ANTHROPIC_API_KEY`. This proxy is shared with the studio tools, so it carries no
rate limit of its own: a limit added for the instrument would also throttle them.

**`/api/poster?title=&year=`** — the theatrical poster. `api/poster.js` searches TMDB and
returns `{ poster: <url> }` or `{ poster: null }`. Reads `TMDB_API_KEY` (v3 key or v4 read
token, detected by shape). Per-IP throttle: 30 lookups/minute, in-process, which throttles
one hot client rather than enforcing a global quota. Responses are cached at the edge for
a day. TMDB attribution is required whenever a poster is shown.

Every failure on the poster route answers `200 { poster: null }` on purpose. A missing key,
a TMDB outage, or an unmatched title all degrade to the next art tier.

## Key art — three tiers
The art column fills from the best tier available, and the report reads correctly at any
of them.

1. **Theatrical poster**, from the TMDB lookup above. Caption: "Theatrical key art".
   An `onerror` on the image falls through to tier 2, so a dead URL costs nothing.
2. **Key art the instrument cuts itself.** A second `/api/generate` call asks for a
   complete `<svg>` under 30 elements: flat vector shapes, at most four colors drawn from
   the film's own visual world, the title lowercase at the foot, Saul Bass restraint. The
   reply is sliced between `<svg` and `</svg>`, screened against a banned-token list
   (`<script`, `javascript:`, the `on*` handlers, `href=`, `xlink`, `<image`,
   `<foreignobject`), and rendered as a `data:image/svg+xml` URI inside an `<img>`, which
   is an inert context. Caption: "Key art · set by the instrument". This tier is a
   feature of the instrument, not a stopgap for the first one.
3. **Edition cover.** A typeset card holding the title, year, director, and category.
   It needs no network at all, so it is what the column shows while the other two tiers
   are in flight (captioned "Composing key art…") and what it keeps if both come back empty.

Tiers 1 and 2 are requested in parallel and each paints as it lands, so the column can
settle twice: Edition cover, then generated art, then the poster if TMDB has one.

## Editing the instrument
The whole thing is one file, top to bottom: `TRACK`, `SOURCE_CANON`, `MODES`,
`buildPrompt`, the CSS, the markup, the state machine. Four places account for most edits.

- **`SOURCE_CANON`** — the Spirit-mode interpretive canon, injected verbatim into the
  prompt. It currently holds the general esoteric reading of Oz. Open thread: distill the
  Know Thyself podcast's two-part Oz breakdown into this string, in their vocabulary.
- **`MODES`** — every piece of per-lens copy and the taxonomy notes. Changing a label here
  changes it everywhere; nothing is duplicated in the markup.
- **`buildPrompt`** — the two trace prompts, including the JSON contract and the honesty
  rules. The page parses the model's reply as JSON, so any change to the contract shape
  has to be matched in `renderReport`.
- **`TRACK`** — the road polyline the step markers ride.

Model output is text from a model. It renders through `textContent` only, never
`innerHTML`. Keep it that way.

The trace ceiling is `max_tokens: 4000`. A measured Spirit trace runs ~2150 output tokens
and a film trace ~1350; `max_tokens` is a ceiling rather than a spend, and a trace that
overruns it truncates mid-JSON and fails to parse. The generated-art call uses 1500.

## Open threads
1. **`SOURCE_CANON` upgrade** from the Know Thyself Oz transcripts. Needs the transcript
   files; they are not in this repo.
2. **Accumulating index.** The name promises an index; the instrument keeps no history.
   Trace collection, shareable trace cards, a third lens if a new canon emerges.
