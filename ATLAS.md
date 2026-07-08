# World Cup Atlas — operations brief

## What this is
`public/world-cup-atlas.html` is World Cup Atlas, Cultural Infrastructure Case Study 001.
A single self-contained HTML file (~130KB): no build step, no dependencies, no imports.
It deploys as a static asset and serves at fieldofaction.org/world-cup-atlas.
Deep links work on static hosting: `#c/{teamId}` (constitutions), `#m/{a}-{b}` (matches),
`#declarations #atlas #matches #play #about`.

## Deploy
The file lives at `public/world-cup-atlas.html`. Vite copies `public/` to the deploy root,
so it lands at `/world-cup-atlas.html`. The clean URL `/world-cup-atlas` is served by:
- `vercel.json` — a production rewrite `/world-cup-atlas` → `/world-cup-atlas.html`.
- `vite.config.js` — a dev-server middleware mirroring that rewrite for `npm run dev`.

To ship changes: edit the file, commit, push. Vercel does the rest.
Never run a formatter, minifier, or linter over it. Never split it into multiple files.

## Matchday updates (the standing task)
Do NOT edit the HTML for scores. The page fetches an optional file at load. Because the
page fetches `atlas-data.json` relative to its URL (`/world-cup-atlas`), that resolves to
the site root, so the file must live at:

    public/atlas-data.json

If present, it overrides the embedded snapshot. Shape (all keys optional):

    {
      "asof": "July 8, 2026",
      "chip": "Quarter-finals · Live",
      "statuses": { "arg": "QF", "egy": "OUT16" },
      "matches": [ /* same shape as the MATCHES const in the HTML */ ],
      "poly": { "asOf": "July 8, 2026", "rows": [["fra",38.1],["esp",15.2]] }
    }

The MATCHES shape (copy structure from the HTML, search `const MATCHES=`):
groups of `{round:'...', items:[...]}` where items are
`{a:'fra', b:'mar', sa:2, sb:0, note:'July 9'}` for played matches,
`{a:'fra', b:'mar', prob:[60.4,23.6,16], note:'July 9'}` for upcoming
(prob = [home win %, draw %, away win %]),
`{tbd:'Winner X v Winner Y', note:'July 11'}` for unresolved slots.

Team ids are 3-letter lowercase (bra, jpn, esp, arg, mar, ger, fra, mex, eng, ...).
Status values with labels today: QF, R16, OUT16, OUT32, OUTG, OUT (see `STATUS_LABEL`
in the HTML). Only QF and R16 render as "alive" (signal color). As the tournament
advances, add new statuses (e.g. SF, F, W) to `STATUS_LABEL` in the HTML first, or the
label shows blank.

After each matchday: fetch results from a scores source, update statuses for
winners/losers, move played fixtures into the played group with sa/sb, resolve
tbd slots into real fixtures, update the chip when the round changes, commit
`public/atlas-data.json`. The HTML itself should not change.

## Voice rules (if any copy is ever touched)
No em dashes. No antithetical constructions ("not X, but Y"). Plain declaratives.
Labels are caps; reading text is sentence or title case.

## Credit
The site credits Field of Action (footer back link + About imprint).
