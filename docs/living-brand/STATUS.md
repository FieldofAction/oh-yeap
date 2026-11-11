# Living Brand: where the build stands

11 November 2026. This follows [INVESTIGATION.md](INVESTIGATION.md), which
describes the first build, and [CONNECTION-PATH.md](CONNECTION-PATH.md), which
covers how it reaches other tools. Read this one for what exists now, what was
tested and by whom, and what is still open.

## What exists

**The rules** (`src/living-brand/domain`). One set of plain functions decides
everything, for the page and for the connector alike:

- Every piece of material carries its context and its standing. Standing is
  separate answers for a purpose: authorized, reusable here, authoritative,
  and, when a question was asked, relevant.
- Standing changes only when a person the brand names decides it. Material
  has to be checked against its source before it can be approved. Adopting
  something as canon needs a scope in the decider's words, and records their
  approval. Turning something down needs a reason.
- A brand has a basis: fictional, the company's own record, or an outsider's
  study of public sources. In a study nobody can decide anything, whatever
  the record claims.
- One engagement opens one brand's partition and nothing else.

**The page** (`/living-brand`, not indexed). The public page holds one
fictional brand, Fernway, and lets a visitor try each seat: the contract
creative director, the people named to decide, an outside partner and an
agency lead with two competing clients.

**The connector** (`living-brand/`). A local MCP server with 25 tools, a
skill that tells an assistant how to run an engagement, and a plugin manifest
so both install together. It keeps each client in its own folder on the
practitioner's machine. Usage and limits are in
[`living-brand/README.md`](../../living-brand/README.md).

**Real brands, kept out of this repository.** This repository is public, so
real brands travel as packets (one plain file per brand) that live elsewhere.
`npm run living-brand:private` builds a single-file page from a folder of
packets and refuses to read from or write into the repository. Two packets
exist so far, both outside it:

- Soul Mega, as a company record drafted from files already in this
  repository and two readings of the live site. One person is named for
  visual and verbal standing; six other areas are named to no one.
- A large public company, as an independent study from public sources.
  Nobody is named, and nobody can be.

## What was tested, and by whom

Automated, on every build:

| Suite | Tests |
|---|---|
| Rules (`scripts/living-brand-test.mjs`) | 60 |
| Connector (`scripts/living-brand-connector-test.mjs`) | 25 |
| Connector over the protocol, both protocol versions (`npm run living-brand:connector:test`) | 5 |
| Page text audit, three states of the page at two widths in both themes | 12 scenarios |

Independent rounds, each run by delegated agents that could not edit the
repository and had to prove a finding by running it:

1. **Operator test of the first page.** Ten defects, all fixed.
2. **Code review of the rules and of the connector.** 43 findings, among
   them: a study could decide through a crafted record, a packet was believed
   without being checked, an expired grant kept opening. All fixed, each
   pinned by a test.
3. **Operator test as a contract creative director** on the public page: 24
   findings. **Operator test as a founder on his own brand** on a private
   page: 30 findings, and a plain verdict that the page was not ready to put
   in front of him. **An assistant run-through**: twelve messages through the
   connector, graded by a separate judge against the skill: ten findings.
4. **A second round** after those fixes: see the end of this document.

The findings that changed the product most:

- The picture standing in for a brand's mark was a ring with a cross through
  it, which can be read as a symbol. It is now a plain block, and every
  drawer says the pictures are stand-ins.
- Adopting canon was one click with a scope nobody saw, and it could leave
  canon marked as not authorized. It now asks for the scope and the check.
- Decisions could be recorded under another person's name on a real brand.
  The seat switch now exists only on the fictional sample.
- The page told a founder his records were "entered with the company, by
  people who can speak for it" when a model had drafted them. A record now
  says in its own words how it was made.
- A rule written for a website was applied to an unreleased can label.
  Rules carry the kind of work they cover, and the question of whether the
  site system governs packaging is put to the person who decides.
- The assistant improved the practitioner's case before proposing it, which
  hid two of the three warnings the reviewer should have seen. Recorded reuse
  is now always shown, evidence counts only where it bears on the material,
  and the skill says to give their reason as they gave it.
- A partner was handed an asset whose headline claim the record said was no
  longer true. Such material is withheld.

## What is real, simulated or missing

- **Real:** the rules, the page, the connector over stdio, packets, the
  private build, per-client folders, the tests above.
- **Simulated:** other people's seats on the fictional brand. There is no
  sign-in, so the page cannot know who is using it.
- **Not built:** reading from Frontify, Figma, a drive or any other source.
  Material enters by hand or through whatever other connectors the assistant
  already has. No model is called by the page or the connector; an assistant
  using the connector is the model.
- **Unverified by a primary source:** almost everything in the public-source
  study, and the vendor facts in CONNECTION-PATH.md. The network policy where this
  was built blocked most publishers, so those rest on search excerpts and
  say so.

## Known gaps

- A packet is believed as written. Nothing is signed.
- The page saves in the browser only. The packet download is the way to keep
  or move work.
- A proposal that is sent back is proposed again; it cannot be edited in
  place. Choices cannot be edited or removed, only reset.
- Two choices that contradict each other are both accepted.
- The connector can name who decides but cannot take a naming back; the page
  can.
- Every date is a day. Two decisions on the same day are ordered by their
  sequence, not by time.
- The Soul Mega record was drafted from files in this repository, not from
  Soul Mega's own records. It is a first pass to correct, not a finding.

## Decisions that are yours

1. **Where this lives.** The repository and this branch are public, and so is
   everything already in it about Soul Mega. The workbench could move to a
   private repository. Until then real brands stay in packets outside it.
2. **Who decides the rest at Soul Mega.** Claims, rights, the offer,
   publishing, product and sound are named to no one. The page asks.
3. **Whether the site system governs packaging.** The record no longer
   assumes it does.
4. **What happens to the public-source study.** It is private. Before anyone
   else sees it, the items it lists as unchecked need reading against their
   sources.
5. **Whether the connector should be offered to anyone else yet.** It works
   for one person on their own machine. Sign-in and signed packets come
   before a second person.
