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

Nothing is sent anywhere. The connector calls no model and no network. It
reads and writes one folder, `~/.living-brand` by default:

```
workbench.json                     your methods, preferences, list of engagements
engagements/<id>/packet.json       one client's material and record
engagements/<id>/log.jsonl         what was done in that engagement
engagements/<id>/packages.json     context packages issued from it
```

Each tool call names one engagement and opens only that folder. Ending an
engagement hands back its record and deletes the folder. `workbench.json`
holds no client material.

Set `LIVING_BRAND_HOME` to keep the folder somewhere else, and
`LIVING_BRAND_PRACTITIONER` to set your name on first run.

On first run the folder is created with one fictional engagement (Fernway),
so there is something to try.

A cloud session's home folder does not outlast the session. There, export the
packet before you finish (`export_engagement_package` with `include_packet`)
and import it next time.

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
  ~/brands/acme.packet.json". The `import_packet` tool checks it and
  refuses anything inconsistent.
- The page's Transfer stage and the `export_engagement_package` tool both
  produce packets, so an engagement can move between the page and the
  connector.
- `npm run living-brand:private -- --packets <dir> --out <file.html>` builds
  a single-file page from a folder of packets. It refuses to read from or
  write into this repository.

## What the tools do

| Tool | Changes anything? |
|---|---|
| `list_engagements`, `open_engagement`, `search_material`, `get_item`, `get_interpretation`, `build_brief`, `export_engagement_package`, `get_workbench` | No |
| `add_source_note`, `verify_item`, `record_reuse`, `record_choice`, `propose_standing` | Adds to the record. Never raises standing |
| `approve_item`, `decide_proposal`, `retire_item`, `name_authority` | Only where the practitioner has been named by the company |
| `issue_context_package`, `revoke_context_package` | Issues or withdraws a read-only package for a partner |
| `import_packet` | Adds one engagement, replacing any with the same id |
| `add_method` | Adds a general method. Refuses anything naming a client |
| `end_engagement` | Deletes that client's material after handing back its record. Needs confirmation |

The connector acts as one person: the practitioner whose workbench it is. It
has no sign-in, so it cannot decide as anyone else. Asked to, it refuses and
says so.

## Limits

- No sign-in and no sharing. One person, one machine.
- Separation between clients is separate folders and a per-record check, on
  one machine. It is not separate credentials or encryption.
- Interpretation is deterministic or written by a person. The connector does
  not reason; the assistant using it does, under the skill's rules.
- Not listed in any directory.

## Develop

```
npm run living-brand:test              # domain, storage and tool tests
npm run living-brand:connector:test    # builds the bundle, then drives it with the official client
```

`connector/bundle/server.mjs` is built from `connector/*.mjs` and committed so
the connector runs with no install step. Rebuild it after changing the
connector, the domain or the skill; the build also refreshes the project copy
of the skill.
