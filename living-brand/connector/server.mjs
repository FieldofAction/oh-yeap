// Living Brand connector: an MCP server over stdio.
// It runs where the practitioner's assistant runs and keeps its records in
// the practitioner's own folder. It sends nothing anywhere and calls no model.
//
// Source of truth for behaviour: tools.mjs (tools) and store.mjs (storage).
// This file only speaks the protocol. `npm run living-brand:connector:build`
// bundles it, with the SDK and the skill, into living-brand/connector/bundle.
import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { SkillsExtension, memorySkillFiles } from '@modelcontextprotocol/server/ext/skills';
import skillText from '../skills/living-brand/SKILL.md';
import { openStore } from './store.mjs';
import { createTools } from './tools.mjs';

const VERSION = '0.2.0';
const INSTRUCTIONS = [
  'Living Brand keeps, for every piece of a brand\'s material, what it was for and what it may do now.',
  'Work in ONE engagement at a time: call list_engagements, then open_engagement, before anything else.',
  'Relevant, authorized, reusable and authoritative are four separate answers; say which one you rely on.',
  'Never carry anything from one engagement into another. Never decide or name an authority on someone else\'s behalf.',
  'If a result does not contain a fact, it is not recorded. Say so rather than filling it in.',
  'A public-source study is the practitioner\'s reading, never the company\'s record.',
].join(' ');

// If the workbench folder cannot be opened the server still starts, and every
// tool says why, instead of the connection simply dying.
let tools = [];
let unavailable = null;
try { tools = createTools(openStore()); }
catch (error) { unavailable = `The workbench folder could not be opened: ${error.message}`; console.error(`living-brand: ${unavailable}`); }

// A refusal is the record saying no, and the assistant should relay it. A
// fault is the connector failing, and must not be mistaken for a refusal.
const FAULTS = new Set(['TypeError', 'ReferenceError', 'RangeError', 'SyntaxError']);
const failure = error => (FAULTS.has(error?.name)
  ? `The connector failed while doing this, and nothing was changed by this call: ${error.message}. This is a fault in the connector or a damaged record, not a refusal.`
  : `Refused: ${error.message}`);

// The skill travels with the connector for clients that read skills from servers.
let skills = null;
try { skills = await SkillsExtension.load(memorySkillFiles({ 'living-brand/SKILL.md': skillText })); }
catch (error) { console.error(`living-brand: skill not served (${error.message})`); }

serveStdio(() => {
  const server = new McpServer(
    { name: 'living-brand', title: 'Living Brand workbench', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  );
  if (unavailable) {
    server.registerTool('list_engagements', { title: 'List engagements', description: 'List the practitioner\'s engagements.', inputSchema: fromJsonSchema({ type: 'object', properties: {} }), annotations: { title: 'List engagements', readOnlyHint: true, openWorldHint: false } },
      async () => ({ content: [{ type: 'text', text: unavailable }], isError: true }));
  }
  for (const tool of tools) {
    server.registerTool(tool.name, {
      title: tool.title,
      description: tool.description,
      inputSchema: fromJsonSchema(tool.input),
      annotations: {
        title: tool.title,
        readOnlyHint: Boolean(tool.readOnly),
        destructiveHint: Boolean(tool.destructive),
        idempotentHint: Boolean(tool.readOnly),
        openWorldHint: false, // no network; it reads and writes the practitioner's own folder, and a packet file they point it to
      },
    }, async args => {
      try {
        const result = tool.run(args || {});
        // Some clients show the assistant the text, others only the structured
        // form. The readable account is the whole answer, so it travels in
        // both: as the text, and first among the structured fields.
        return { content: [{ type: 'text', text: result.text }], structuredContent: { account: result.text, ...(result.data || {}) } };
      } catch (error) {
        // A refusal is an answer, and a client that shows only the structured half should see it.
        const text = failure(error);
        return { content: [{ type: 'text', text }], structuredContent: { account: text, refused: true }, isError: true };
      }
    });
  }
  try { skills?.attach(server); } catch (error) { console.error(`living-brand: skill not attached (${error.message})`); }
  return server;
}, { onerror: error => console.error(`living-brand: ${error.message}`) });
