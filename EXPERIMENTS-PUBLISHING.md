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
| `public/experiments/` | **Generated. Git-ignored. Never hand-edit.** |

Pages are regenerated on every `npm run dev` and `npm run build` (wired as
`predev`/`prebuild`), so a new file is live the moment the site builds.

---

## Add an entry

1. Copy the template to its real name. **The filename is the URL.**

   ```bash
   cp content/experiments/_TEMPLATE.md content/experiments/kaolin-silicate-bloom.md
   # publishes at https://fieldofaction.org/experiments/kaolin-silicate-bloom
   ```

   Slug rules: lowercase words joined by single hyphens. Pick it once — it is
   the permanent URL, so renaming the file breaks any link already shared.

2. Fill in the front matter (between the `---` fences) and the sections. Only
   the approved public-facing text goes in; see **Safeguards** below.

3. Validate:

   ```bash
   npm run experiments:validate
   ```

   Fix everything it reports. The messages name the file and the problem.

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
  - clay
  - silicate
```

```yaml
tags: [clay, silicate]
```

Unknown keys are a validation error, so a typo fails loudly instead of being
dropped silently.

### Sections

Sections are `## ` headings, exactly as spelled below. Every line of the body
must sit under one. Order in the file does not matter — the template always
renders observation before interpretation.

| Section | Required | Band | Holds |
|---|---|---|---|
| `## Recipe` | yes | Material record | The mixture. Quantities, ratios, grades, sources. |
| `## Process` | yes | Material record | What was done, in order. |
| `## Environment` | yes | Material record | Conditions it ran in. |
| `## Observed Phenomenon` | yes | Material record | What was seen, heard, measured. **Observation only.** |
| `## Confidence` | yes | Material record | How much this record can carry. |
| `## Anomaly` | yes | Material record | What did not fit. "Nothing deviated" is a valid answer. |
| `## Possible Behavior` | no | Interpretation | The behavioural hypothesis. Omit the section if there is none. |
| `## Evidence` | no | Support | What backs the record. |
| `## Sources` | no | Support | References. |
| `## Limitations` | no | Support | What this run does not establish. |
| `## Next Test` | no | Support | The single next thing to vary. |

The page labels the three bands and states on the page that the interpretation
band is hypothesis, not observation. Keeping claims in the right band is the
author's job: if a line explains *why* something happened, it belongs under
Possible Behavior, not under Observed Phenomenon.

### Markdown accepted inside a section

Paragraphs (blank line between them), `- ` bullets, `1. ` numbered lists,
`> ` quotes, `**bold**`, `*italic*`, `` `code` ``, and `[text](https://…)`.
One bullet per line. Raw HTML is escaped, not rendered.

Anything else — `###` sub-headings, tables, images, footnotes — is a validation
error rather than a silent mis-render. If an entry needs one, extend
`renderBlocks` in `scripts/experiments-lib.mjs` rather than working around it.

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
- `published` not before `experiment_date`; `updated` not before `published`;
- duplicate `id` across files;
- duplicate slug — structurally impossible while the filename is the slug, and
  checked anyway in case a `slug:` field is reintroduced;
- every `related` id resolves to a real entry, and no entry relates to itself;
- all required sections present; unknown, duplicated or misspelled headings
  rejected; no text outside a section;
- `summary` length (error over 300 characters, warning over 180).

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
