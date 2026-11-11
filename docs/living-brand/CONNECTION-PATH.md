# Living Brand: how it connects, and how it travels with a person

Researched 11 November 2026 by four researchers, each followed by an
independent fact-checker told to refute the findings. Companion to
`INVESTIGATION.md`.

## How far to trust this

- **Read directly:** Anthropic's documentation, Claude's connector listings,
  Adobe's developer docs (through their public GitHub source), the MCP and
  Agent Skills specifications on GitHub, and Frontify's developer skills
  repository.
- **Not read directly:** almost every other vendor site was blocked by this
  environment's network rules. Claims about Frontify's help centre, Typeface,
  Bynder, Brandfolder, Figma, Canva, Google, Dropbox, Box, Notion, OpenAI,
  Gemini and Microsoft rest on search-engine excerpts of the vendors' pages.
- **Not read by anyone:** the vendors' terms of use (Frontify, Adobe, Bynder,
  Canva). Read them before building on any of these.
- Nothing was tested against a live vendor account.

No claim was refuted outright. Several were narrowed; the corrections are
folded in below.

## 1. Partnerships are not needed to start

No vendor examined requires a partnership or a sales relationship to read a
consenting client's material. The wording that survives fact-checking is "no
partnership requirement was found", not "none exists".

The pattern is the same everywhere. Access rides on **the client's own
account**: the client's administrator switches on the connection, a person
signs in as themselves, and the tool sees what that person may see. The gate
is the client's administrator and plan, not the vendor's sales team.

### Brand platforms

| Vendor | Route | Who has to say yes | Notes |
|---|---|---|---|
| Frontify | Official connector, listed in Claude's directory since July 2026 (read directly). GraphQL API with personal tokens or an OAuth app | The client's account administrator | Still labelled beta; free during the beta. Read-only depends on the pack the client's administrator activates, or on a viewer-only login. The connection is not scoped to one brand: it sees everything that login can see |
| Typeface | A hosted connector exists | A Typeface customer, which means an enterprise contract | Plan, administrator and permission details unverified |
| Adobe | Brand Intelligence connector; Creative Cloud Libraries API; Firefly Services | Brand Intelligence and Firefly: an enterprise organisation that has bought them. Libraries: self-serve, with Adobe review before production | Brand Intelligence checks assets against guidelines; it does not hand the guidelines over |
| Bynder | A connector on each customer's own portal; REST API | The client's administrator, after Bynder support enables the feature | Unverified |
| Brandfolder | REST API with a personal key | An individual user, with no administrator step | No consent screen, so the client's written permission has to be obtained separately |

Where a conversation with a vendor does come in:

- **One product-wide app across many clients.** Frontify's developer docs say
  a token or OAuth app is valid only in the account that created it, and "for
  multi-account SaaS, contact" their developer address. That is a
  developer-relations email, not a sales contract. The connector route
  appears to avoid it.
- **A test account without a client.** Frontify describes a free sandbox,
  granted on request after review, and names "external partner without access
  to a customer instance" as a valid reason.
- **Enterprise-only platforms.** Typeface and Adobe Brand Intelligence exist
  only inside enterprise accounts. The route in is a client who already has
  them.

### Everyday tools, where most brand material actually lives

| Tool | Building your own integration | Using the vendor's connector inside Claude |
|---|---|---|
| Notion | Easiest. Read-only, user picks the pages, no vendor review at any user count unless you want a marketplace listing | Listed |
| Google Drive | Easy with the per-file scope, where the user picks files. Full read-only access is a restricted scope: Google verification plus a yearly third-party security assessment. Unverified apps are capped at 100 users | Listed |
| Dropbox | Free to 50 linked users, then production approval | Listed |
| Box | The client's Box administrator decides | Listed |
| Figma | Hard. A public app needs Figma review, reported at a month or more through 2026 with no timeframe. Figma's own connector admits only approved client apps | Listed. A viewer seat gets only a handful of reads a month, even through Claude |
| Canva | Self-serve to register | Listed. **Policy problem:** excerpts of Canva's connector policy limit Brand Kit data to making Canva designs and bar exporting or reusing it elsewhere. Do not build the workbench's knowledge on Canva Brand Kit data until the terms, dated 4 November 2026, are read |

For all six, the practitioner can connect the vendor's own connector in their
assistant with no third-party developer in the middle. This session had the
Figma, Canva, Notion, Dropbox, Google Drive and Webflow connectors attached,
and the Soul Mega design system was built by reading the live Webflow site
that way.

### The real gatekeeper

In a managed company, the client's IT administrator decides. Google Workspace
administrators can block third-party apps. Dropbox team administrators can
block app linking. Notion Enterprise owners can restrict connections to an
approved list. On Claude Team and Enterprise plans, only an owner can add a
connector. The adoption ask is therefore "give me a viewer login and switch
on the connector": a request freelancers and agencies already make.

## 2. The portable part does not depend on any vendor

The workbench that travels with a person is two things:

1. **A connector the practitioner owns.** One remote MCP server holding their
   methods, their engagement records and the standing ledger. The domain
   logic in `src/living-brand/domain` is already written as plain functions
   and can sit behind it.
2. **A skill.** A `SKILL.md` folder that tells an assistant how to run an
   engagement with that connector.

The client's material is read live through the client's own connectors,
inside the assistant. The workbench keeps a record per engagement, hands the
package to the client at the end, and deletes its copy. Methods travel;
client material stays. As general information, not legal advice: general
skill, methods and a practitioner's own tools usually travel; confidential
information and assigned deliverables usually stay; the contract decides.

### Where it can be carried

| Surface | Can an individual attach their own connector? | Basis |
|---|---|---|
| Claude, personal plans (Free, Pro, Max, Ultra) | Yes, by URL. Free allows one | Read directly |
| Claude, Team and Enterprise | No. An owner must add it | Read directly |
| Claude Code and other coding agents (Codex, Cursor, VS Code, Gemini CLI) | Yes. They also load the same skill format | Read directly for Gemini CLI and the skill format; excerpts for the rest |
| ChatGPT | Documented for Business and Enterprise workspaces, set up by an administrator. What personal plans allow is reported inconsistently | Unverified |
| Gemini app | Reported for US personal accounts only | Unverified |
| Gemini Enterprise, Microsoft Copilot | Inside the customer's tenant, set up by an administrator | Unverified |

### Marketplaces

- **Claude's connector directory.** Listing is optional; an unlisted
  connector works by URL. Submitting needs a paid plan and is scanned and
  listed as Community. The Verified badge is Anthropic's decision; there is
  no application.
- **Claude Code plugin marketplaces.** Anyone can host one from a git
  repository with no review. A plugin can bundle the skill and the
  connector.
- **ChatGPT.** Custom GPTs are reported to retire on 11 December 2026, with
  GPT actions not migrating. If so, the GPT Store is a dead end. A directory
  listing is reported to need identity and domain verification plus review.
  Unverified.

### What breaks

- **Employees are not free agents.** Someone on their employer's Claude plan
  needs the employer's administrator. A freelancer on a personal plan does
  not. Administrators can also block plugins.
- **Interactive screens inside the chat are not dependable** for a
  self-hosted connector. Every tool has to work as plain text.
- **Skills install separately on each surface.** Anthropic's own pages
  disagree on whether they sync between claude.ai and Claude Code.
- **Each assistant's built-in memory is separate.** The practitioner's
  connector has to hold the knowledge. The MCP specification of July 2026
  also made the protocol stateless.
- **A hosted app cannot use people's Claude subscriptions.** It has to use
  API keys, billed to the developer.

### Precedents

Personal memory tools already keep knowledge in the user's custody:
basic-memory (Markdown files on the user's disk), the MCP reference memory
server, Letta, Supermemory and Mem0's OpenMemory. None was found that carries
a practitioner's methods between clients while fencing off each client's
material.

## 3. Soul Mega as the first real test brand

Soul Mega is a real DC beer brand, founded in 2018, with a live Webflow site.
The repository and the Soul Mega design system artifact already hold:

- positioning and voice: beer as a tool for meeting; three terrains; the
  line "Embody Greatness"
- a documented visual system with rationale and a list of refused directions
- the instructions for the Markus bartender agent
- live sign-up copy with a recorded consent wording
- details that map straight onto standing: a 2023 gold that "should stay out
  of new work", a typeface cut uploaded but unused, older type cuts surviving
  in older sections, and commercial font licences whose terms for Canva
  upload are not recorded

It has no recorded people or authority, no rights records and no outcome
evidence. A first test would therefore show the workbench's "unknown, ask the
owner" behaviour honestly, which is the point of the product.

Before it is used:

- The owner has to say who decides visual, verbal, claims, rights and
  publishing. These must not be invented.
- This repository is public. A real brand's records are kept out of it: they
  live in packets on the practitioner's own machine and in a private page.

## 4. Recommended order

1. **Test what exists.** Walk `/living-brand` in each role. Nothing below
   matters if the engagement flow is wrong.
2. **Soul Mega, privately.** Enter it as a second brand from the repository
   and the design system, with the owner supplying authority and rights.
3. **The portable connector and skill.** Put the tested domain logic behind
   an MCP server and write the skill. Attach it to a personal Claude
   account. A first local test needs no sign-in; the specification makes
   authorisation optional.
4. **Run a Soul Mega engagement conversationally,** reading live through
   connectors already attached (Webflow, Notion, Drive, Figma).
5. **One brand-platform test.** Ask Frontify for a sandbox, or find one
   friendly client with a Frontify account.
6. **Directory listings and vendor conversations** only after a real
   practitioner has used it on a real engagement.

## Sources read directly

- Claude connector listing for Frontify: https://claude.com/marketplace/connectors/frontify
- Claude custom connectors: https://claude.com/docs/connectors/custom/remote-mcp.md
- Claude directory submission: https://claude.com/docs/connectors/building/submission.md
- Claude plugin marketplaces: https://code.claude.com/docs/en/plugins/host-marketplace.md
- Agent Skills overview: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md
- Agent SDK and login rules: https://code.claude.com/docs/en/legal-and-compliance.md
- Claude memory import and export: https://support.claude.com/en/articles/12123587-importing-and-exporting-your-memory
- Adobe Brand Intelligence connector: https://github.com/AdobeDocs/abi-docs/blob/main/src/pages/validate/using-mcp/index.md
- Adobe Creative Cloud Libraries review: https://github.com/AdobeDocs/cc-libraries-api/blob/main/src/pages/go-live/review-process/index.md
- Adobe Firefly Services: https://github.com/AdobeDocs/ff-services-docs/blob/main/src/pages/guides/get-started.md
- Frontify developer skills: https://github.com/Frontify/buildforfrontify
- MCP specification changelog, July 2026: https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2026-07-28/changelog.mdx
- Agent Skills client list: https://raw.githubusercontent.com/agentskills/agentskills/main/docs/snippets/clients.jsx
- basic-memory: https://raw.githubusercontent.com/basicmachines-co/basic-memory/main/README.md

## Pages to read before relying on the rest

- Frontify connector help: https://help.frontify.com/en/articles/14787214-frontify-mcp
- Frontify terms: https://www.frontify.com/en/legal/gtc
- Typeface connector: https://www.typeface.ai/mcp
- Bynder connector: https://support.bynder.com/hc/en-us/articles/39027548047890-Understanding-Bynder-MCP
- Canva connector policy: https://www.canva.dev/docs/mcp/usage-policy/
- Figma connector access: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- Google Drive scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- ChatGPT custom connectors: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- Custom GPT retirement: https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq
