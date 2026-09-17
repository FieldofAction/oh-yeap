# Experiments — publishing

How to add and revise an entry in the Experiments section at `/experiments`.
Written so another agent can follow it without reading the code.

**The whole publishing action is adding one Markdown file.** No component, index,
or content list is edited. The directory *is* the index.

---

## Where things live

| Path | What it is |
|---|---|
| `content/experiments/<slug>.md` | One entry. The only file you create or edit. |
| `content/experiments/_TEMPLATE.md` | Copy this. Files starting with `_` never publish. |
| `scripts/experiments-lib.mjs` | The content contract: fields, sections, validation. |
| `scripts/experiments-render.mjs` | The shared entry template and the index. |
| `scripts/experiments-build.mjs` | Generates the pages. |
| `scripts/experiments-validate.mjs` | Checks the content without generating. |
| `scripts/experiments-test.mjs` | Tests the checks and the renderer. |
| `scripts/fixtures/experiments/` | Test fixtures. **Not experiments** — outside `content/` so they can never publish. |
| `public/experiments/` | **Generated. Git-ignored. Never hand-edit.** |

Pages are regenerated on every `npm run dev` and `npm run build` (wired as
`predev`/`prebuild`), so a new file is live the moment the site builds.

---

## Add an entry

1. Copy the template to its real name. **The filename is the URL.**

   ```bash
   cp content/experiments/_TEMPLATE.md content/experiments/refusal-drift-under-role-framing.md
   # publishes at https://fieldofaction.org/experiments/refusal-drift-under-role-framing
   ```

   Slug rules: lowercase words joined by single hyphens. `index` is reserved —
   the build writes `index.html` for the section index. Pick the slug once: it
   is the permanent URL, so renaming the file breaks any link already shared.

2. Fill in the front matter (between the `---` fences) and the sections. Only
   the approved public-facing text goes in; see **Safeguards** below.

3. Validate:

   ```bash
   npm run experiments:validate
   ```

   Fix everything it reports. The messages name the file and the problem.
   `npm run experiments:test` checks the validator itself, and does not need to
   be run to publish an entry.

4. Preview:

   ```bash
   npm run dev     # then open http://localhost:5180/experiments
   ```

5. Commit the `.md` file on a branch and open a pull request. Do not commit
   anything under `public/experiments/` — it is generated.

---

## The file format

### Front matter

| Key | Required | Notes |
|---|---|---|
| `id` | yes | Stable identifier, never reused or changed. `A-Z 0-9 . - _`, e.g. `FOA-EXP-2026-001`. Other entries reference this. |
| `title` | yes | Page `<h1>` and `<title>`. |
| `summary` | yes | One or two sentences. Becomes the meta description and the index blurb — keep it under 160 characters. |
| `experiment_date` | yes | `YYYY-MM-DD`, when the experiment was run. Drives index order. |
| `published` | yes | `YYYY-MM-DD`, first publication. Must be on or after `experiment_date`. |
| `version` | yes | `1`, `1.2`, or `1.2.3`. |
| `updated` | no | `YYYY-MM-DD`. Defaults to `published`. Must not precede it. |
| `status` | no | `published` (default) or `draft`. Drafts generate no page and are skipped by the index. |
| `confidence_level` | no | `low`, `moderate` or `high`. Renders as a chip; the `## Confidence` section still carries the reasoning. |
| `tags` | no | List. |
| `related` | no | List of other entries' `id` values. Each must resolve to a real entry; a related entry that is still a draft renders unlinked. |
| `slug` | no | If present it must equal the filename. Normally just omit it. |

Lists take either form:

```yaml
tags:
  - framing
  - refusal
```

```yaml
tags: [framing, refusal]
```

Unknown keys are a validation error, so a typo fails loudly instead of being
dropped silently.

### Sections

Sections are `## ` headings, exactly as spelled below. Every line of the body
must sit under one. Order in the file does not matter — the template always
renders observation before interpretation.

| Section | Required | Band | Holds |
|---|---|---|---|
| `## Recipe` | yes | Material record | The mixture: what was combined, in what proportion. Keep conceptual proportions and exposed settings apart — see below. |
| `## Process` | yes | Material record | What was done, in order: the sequence of turns or calls, what was held constant. |
| `## Environment` | yes | Material record | The conditions the run sat in: model and version, surface, fresh or continued context, tools available, date. |
| `## Observed Phenomenon` | yes | Material record | What the material actually did, quoted or counted. **Observation only.** |
| `## Confidence` | yes | Material record | How much this record can carry. |
| `## Anomaly` | yes | Material record | What did not fit. "Nothing deviated" is a valid answer. |
| `## Possible Behavior` | no | Interpretation | Possible *human* behaviour in relation to the material, as a hypothesis. Omit the section if there is none — do not force a use case. |
| `## Evidence` | no | Support | What backs the record: transcript excerpts, counts across runs, comparisons. |
| `## Sources` | no | Support | References. |
| `## Limitations` | no | Support | What this run does not establish. |
| `## Next Test` | no | Support | The single next thing to vary. |

The page labels the three bands and states on the page that the interpretation
band is hypothesis, not observation. The research sequence runs **mixture →
phenomenon → possible human behavior**, and the template renders it in that
order regardless of how the file is written.

Keeping claims in the right band is the author's job: if a line explains *why*
something happened, it belongs under Possible Behavior, not under Observed
Phenomenon.

**Under `## Recipe`, label which kind of quantity you are giving.** A conceptual
proportion ("roughly two parts instruction to one part example") is your reading
of the mixture. An exposed setting (a model identifier and version, a sampling
parameter you set directly) is a value the system actually takes. They are not
the same evidence and should not read as though they were.

### Markdown accepted inside a section

Paragraphs (blank line between them), `- ` bullets, `1. ` numbered lists,
`> ` quotes, `**bold**`, `*italic*`, `` `code` ``, and `[text](https://…)`.
One bullet per line. Raw HTML is escaped, not rendered.

Everything else is refused by the validator, with an error naming the supported
alternative — nothing is silently flattened:

| Rejected | Because | Instead |
|---|---|---|
| `###` and deeper headings | the `## ` sections are the structure | put the text under the right section |
| tables | would flatten to a paragraph | a list, or one labelled line per row |
| `![image](…)` | would render as stray punctuation | describe it in text, or link it under `## Sources` |
| footnotes `[^1]` | would render as literal brackets | put the reference under `## Sources` |
| fenced code blocks | would flatten to a paragraph | `` `inline code` `` |
| horizontal rules | the sections are the only dividers | a new section |

Raw HTML is escaped, not rendered. Link targets are limited to `http(s)`,
`mailto:` and root-relative paths.

If an entry genuinely needs one of these forms, implement and test it in
`renderBlocks` in `scripts/experiments-lib.mjs` and add a case to
`scripts/experiments-test.mjs` — do not loosen the check and leave the
rendering unproven.

---

## Revise an entry

Edit the same file. Keep `id`, the filename and `published` as they are — that
is what makes the URL permanent — and:

- raise `version` (`1` → `1.1` for a correction, `2` for a re-run or a changed reading);
- set `updated` to today.

Then `npm run experiments:validate` again.

**Unpublish** by setting `status: draft`: the page stops being generated and the
entry leaves the index, while the file and its history stay. Deleting the file
also works; both leave the URL dead, so prefer a correction over a removal.

---

## What the validator checks

`npm run experiments:validate` (also run automatically by every build, which
refuses to generate anything if it fails):

- required fields present and non-empty; unknown fields rejected;
- `id`, slug, date, `version`, `status` and `confidence_level` formats;
- the reserved slug `index`, which would otherwise overwrite the section index;
- Markdown forms the renderer does not support (tables, images, footnotes,
  fenced code, horizontal rules, deeper headings);
- `published` not before `experiment_date`; `updated` not before `published`;
- duplicate `id` across files;
- duplicate slug — structurally impossible while the filename is the slug, and
  checked anyway in case a `slug:` field is reintroduced;
- every `related` id resolves to a real entry, and no entry relates to itself;
- all required sections present; unknown, duplicated or misspelled headings
  rejected; no text outside a section;
- `summary` length (error over 300 characters, warning over 180).

`npm run experiments:test` runs the suite behind those checks:
`scripts/experiments-test.mjs` against the fixture directories in
`scripts/fixtures/experiments/`. Each rejection has a fixture proving it fires,
and a valid fixture proves every promised Markdown form is still accepted and
still renders — so tightening a check cannot quietly become over-restriction.

Fixtures live outside `content/experiments/` on purpose. A fixture must never be
publishable, and must never read as a real experiment.

---

## How the pages are produced

`scripts/experiments-build.mjs` writes `public/experiments/index.html` and one
`<slug>.html` per published entry, then Vite copies `public/` into `dist/`. The
output directory is wiped and rebuilt each run, so a deleted or renamed entry
cannot leave a stale page behind.

- **Ordering:** newest `experiment_date` first, then `published`, then `id`.
- **URLs:** `/experiments` and `/experiments/<slug>`, extensionless. The
  `vercel.json` rewrites serve them in production; a Vite plugin
  (`experiments-clean-url`) mirrors that for `npm run dev` and `npm run preview`.
- **Per page:** its own `<title>`, meta description, canonical URL, Open Graph
  and Twitter tags, and JSON-LD. Readable, static HTML — no client-side
  rendering.
- **Design:** the Threshold theme tokens from `src/data/themes.js` and the site
  font stack, inlined into each page.
- `content/experiments/*.md` is negated in `.vercelignore` so the blanket `*.md`
  rule there cannot starve the production build of its content.
- **Reachability:** the public sidebar carries an `Experiments` link under WORK →
  sections (`src/components/PublicSidebar.jsx`), a full-page link like the World
  Cup Atlas rather than a SPA filter. Every generated page links back to the
  index and to the site root.

---

## The publishing gate

Six steps. Each one is a stop, not a formality.

1. **Review the text in conversation.** The entry is read and approved as text
   before any file exists.
2. **Approve public branch visibility.** The repository is public, so pushing
   the branch publishes the text — approval to *draft* is approval to publish it
   to anyone who looks at the branch. Get it before the push, not after.
3. **Create the preview change.** Commit on the branch; the PR updates in place.
4. **Verify the exact content and the build.** Read the entry on the preview
   deployment at `/experiments/<slug>`, and confirm validation and the
   production build pass on that commit.
5. **Obtain explicit production approval** for the revision that was verified,
   not for an earlier draft of it.
6. **Merge the approved revision.**

Two things this gate does not do:

- **`status: published` is a rendering switch, not permission to merge.** It
  controls whether the build generates a page. It says nothing about whether
  anyone approved publication.
- **`status: draft` does not make an entry private.** It hides the entry from the
  site. The file is still in a public repository, readable by anyone, from the
  moment it is pushed.

---

## Safeguards

- **Only approved public-facing text.** Do not paste private conversations,
  unapproved research, or anyone else's material into an entry.
- **Do not invent results.** If there is no approved entry, the section stays in
  its empty state. That is a correct state, not a gap to fill.
- **A draft branch in a public repository is not private storage.** Anything
  committed here is public the moment it is pushed, merged or not, and
  `status: draft` only hides it from the site — not from the repository.
- **The generated output is not a source file.** Never edit or commit
  `public/experiments/`.
