# Living Brand workbench: the connector and the skill

The part of Living Brand that travels with a practitioner. It has two pieces:

- **A connector** (`connector/`): a small server, speaking the Model Context
  Protocol, that an assistant such as Claude can call. It holds the
  practitioner's methods and one folder of records per engagement.
- **A skill** (`skills/living-brand/SKILL.md`): instructions that tell the
  assistant how to run an engagement with the connector. The connector also
  serves this skill itself, for clients that read skills from servers.

This folder is also a Claude Code plugin (`.claude-plugin/plugin.json`), so
both pieces install together.

The same domain logic drives the page at `/living-brand` and the connector
(`src/living-brand/domain`). Design notes are in `docs/living-brand`.

## What it keeps, and where

The connector uses no network and calls no model. It reads and writes one
folder, `~/.living-brand` by default, readable only by the account that runs
it:

```
workbench.json                     your methods and preferences, and an index of engagements
engagements/<id>/packet.json       one client's material and record
engagements/<id>/log.jsonl         what was changed in that engagement
engagements/<id>/packages.json     context packages issued from it
handed-over/<id>-<date>.json       the final record of an ended engagement
exports/                           packages saved on request
```

Each tool call names one engagement and opens only that folder.
`workbench.json` holds no client material, but it does hold each client's
name, your role and the project title, for open and ended engagements alike.

Ending an engagement writes its whole final record (handoff package, portable
packet, context packages issued and the log) to one file in `handed-over/`,
and only then deletes that client's folder. That file is yours to give to the
client and then delete.

Set `LIVING_BRAND_HOME` to keep the folder somewhere else, and
`LIVING_BRAND_PRACTITIONER` to set your name on first run.

On first run the folder is created with one fictional engagement (Fernway),
so there is something to try. If `workbench.json` is ever lost, the index is
rebuilt from the engagement folders; nothing is overwritten.

A cloud session's home folder does not outlast the session. There, save the
record before you finish (`save_engagement_package`) and import the packet
next time.

## Try it

### In Claude Code, on this repository

The repository's `.mcp.json` registers the connector, and
`.claude/skills/living-brand` is a copy of the skill, so a Claude Code session
opened here has both. Approve the `living-brand` server if asked, then say,
for example:

> Open my Fernway engagement and tell me what carries forward from last
> year's campaign.

### Anywhere else you run Claude Code

Install it as a plugin from this repository's marketplace:

```
/plugin install living-brand --marketplace FieldofAction/oh-yeap
```

Or try it without installing, from a clone:

```
claude --plugin-dir ./living-brand
```

### In Claude Desktop

Add the server to the app's MCP configuration with the command `node` and
the absolute path of `living-brand/connector/bundle/server.mjs` as its
argument.

### As a hosted connector, by URL

Not built yet. Claude's personal plans accept a connector by URL, which needs
this server hosted over HTTPS with sign-in. That is the next step once the
local version has been used on a real engagement; see
`docs/living-brand/CONNECTION-PATH.md`.

## Real brands

This repository is public, so it holds only the fictional sample. A real
brand's records live in a **packet**: one JSON file holding one brand and one
engagement (format `living-brand.packet/0.2`). Keep packets outside the
repository.

- Ask the assistant to open one: "import the packet at
  ~/brands/acme.packet.json". The `import_packet` tool checks it, refuses
  anything inconsistent, and says what the packet asserts on its own say-so.
- The page's Transfer stage and the export tools both produce packets, so an
  engagement can move between the page and the connector.
- `npm run living-brand:private -- --packets <dir> --out <file.html>` builds
  a single-file page from a folder of packets. It refuses to read from or
  write into this repository.

## What the tools do

| Tool | Changes anything? |
|---|---|
| `list_engagements`, `open_engagement`, `search_material`, `get_item`, `get_interpretation`, `build_brief`, `export_engagement_package`, `get_workbench` | No. They write nothing, not even a log |
| `add_source_note`, `verify_item`, `record_reuse`, `record_choice`, `record_answer`, `propose_standing` | Adds to the record, where the engagement's grant allows writing. Never raises standing |
| `approve_item`, `decide_proposal`, `answer_choice`, `retire_item`, `name_authority` | Only where the practitioner has been named by the company. Never in a public-source study |
| `issue_context_package`, `revoke_context_package` | Records a read-only package for a partner, or its withdrawal. Needs the power to share |
| `save_engagement_package` | Writes the handoff package and packet to a file in `exports/` |
| `import_packet` | Adds one engagement. Never replaces another client's. Replaces the same client's open record only when told to, and never if that would change who may decide |
| `add_method` | Adds a general method. Refuses one that names a client or a project |
| `end_engagement` | Writes the final record to a file, then deletes that client's folder. Needs confirmation |

Access that has ended (a grant past its date) cannot be opened, except to
export the record or end the engagement.

Three rules hold in every tool and on the page. Material has to be checked
against its source before it can be approved. Adopting something as canon
needs a scope in the decider's words, and a check if nobody has made one; it
also records their approval. Turning a proposal down, sending it back,
declining a choice or retiring material needs a reason.

## Limits

This is a local tool for one person, with no sign-in. Read these before
trusting it with anything that matters.

- **A packet is believed as written.** Who is named as deciding, who the
  engagement acts as, the grant's powers, and every standing and approval in
  it are not signed. Anyone who can write a packet, or edit the files in the
  folder, can state whatever standing they like. The check that only a named
  person can decide proves what the record says, not who is typing.
- **Whoever runs the connector is the practitioner.** It cannot decide as
  anyone else, and asked to, it refuses. It also cannot tell two people apart.
- **A public-source study can decide nothing**, whatever its packet claims,
  and cannot be ended by a tool: it is your own reading, kept until you
  delete its folder.
- **`import_packet` reads a file you point it to.** It reads only an ordinary
  `.json` file under 25 MB and never echoes what it could not parse, but give
  it only paths you supplied.
- **Ending removes one folder with an ordinary delete.** Copies remain
  wherever they were made: the same brand imported under another engagement
  id, exported and handed-over files, a private page, backups, and the
  assistant's conversation.
- **Text in a record reaches the assistant as text.** A packet or a source
  note copied from a web page can contain instructions. The skill tells the
  assistant to treat records as material, not as direction.
- **A naming can be taken back on the page, not yet through the connector.**
  `name_authority` adds a person; removing one is done on the page's Enter
  stage, or by editing the packet.
- **The page saves in the browser only.** Download the packet to keep work or
  move it. If the records behind a private page are rebuilt, earlier work is
  set aside and offered as a download; it is not applied to the new records.
- **On a real brand the page acts as one person**, the one the engagement
  names. The switch that lets a visitor try other people's seats exists only
  for the fictional sample.
- **Each result has a readable text and a structured form.** They carry the
  same facts; which one the assistant sees depends on the client.
- **Context packages are records only.** Nothing is sent to the partner, and
  nothing outside `packages.json` enforces an end date or a revocation.
- **Separation between clients is separate folders** and a per-record check,
  on one machine, under one account. It is not separate credentials or
  encryption.
- **The private page holds every packet it was built from in one file**, so
  whoever has the page has every brand in it. It loads its typefaces from
  Google Fonts.
- **The log records changes, not reads or refusals**, and is handed back and
  then deleted with the engagement.
- **`LIVING_BRAND_AS_OF` sets the date the connector believes.** It exists
  for tests.
- **Interpretation is deterministic or written by a person.** The connector
  does not reason; the assistant using it does, under the skill's rules.
- **Not listed in any directory.**

## Develop

```
npm run living-brand:test              # domain, storage and tool tests
npm run living-brand:connector:test    # builds the bundle, then drives it with the official client
```

`connector/bundle/server.mjs` is built from `connector/*.mjs` and committed so
the connector runs with no install step. Rebuild it after changing the
connector, the domain or the skill; the build also refreshes the project copy
of the skill, and a test fails if either is out of date.
