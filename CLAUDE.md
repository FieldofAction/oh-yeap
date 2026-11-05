# fieldofaction.org — working rules

Read before changing any page, template, component or stylesheet.

## Text on the page

Every piece of text does one of three jobs: it says the idea, it names
the thing, or it operates a control. If a line does none of these, it
does not exist. Test: delete it. If the reader loses nothing they would
act on or need to understand the next line, it stays deleted.

There are two levels of text: the headline and the body. Beneath them,
only functional text — a form label, a nav link, a caption that
identifies an image, a date. Nothing is added to make the page look
designed, considered or complex.

Do not add, anywhere, unprompted:

- labels above a headline (eyebrow, kicker, overline, category word)
- taglines or descriptors under a title ("Generative · Field of Action")
- path or breadcrumb labels as decoration (A / B / C, SECTION / PAGE)
- numbered section labels (01 — NAME)
- status or state lines ("Working interpretation", "Open to revision",
  "Research in progress", "Hypothesis · updates with your choices")
- counts and stats as ornament ("53 observations / 38 source pages")
- small uppercase tracked text of any kind
- monospace for labels or meta (mono is for code and indices only)
- arrows on links (↗ → ←); the underline is the affordance
- a second line of small text explaining what the first line meant

If a page seems to need a label to be understood, the headline is wrong:
fix the headline. If a section has only a label for a title, give it a
real heading or merge it into its neighbour.

When editing an existing page, remove what fails this rule; do not
restyle it. Delete the CSS, don't hide the element. Report what was
removed and why.

Index devices that stay, by decision: the case-study § section numbers,
the numbered legends in the Materials study form, tags and chips.

## Enforcement

`scripts/text-on-the-page-test.mjs` runs before every build (see
`prebuild` in package.json) and fails it on: a class name that names a
label (eyebrow, kicker, overline, tagline, crumb, -pre), a small label
rendered directly above a heading, an arrow in link or button text, or
a new small-uppercase CSS rule beyond the frozen baseline in
`scripts/text-on-the-page-baseline.json`. Removing a baseline entry
from the CSS is always allowed; adding one is not. Do not edit the
baseline to make a failing build pass.

## Typography

`src/styles/field-standard.css` owns public type sizes (rem tokens,
loaded last). `scripts/field-standard-test.mjs` keeps it to typography
and bounded layout. Faces: Hanken Grotesk (sans, body and labels),
Schibsted Grotesk (display), Space Mono (code and indices only). Never
Inter.
