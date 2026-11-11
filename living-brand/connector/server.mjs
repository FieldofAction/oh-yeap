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

const store = openStore();
const tools = createTools(store);

// The skill travels with the connector for clients that read skills from servers.
let skills = null;
try { skills = await SkillsExtension.load(memorySkillFiles({ 'living-brand/SKILL.md': skillText })); }
catch (error) { console.error(`living-brand: skill not served (${error.message})`); }

serveStdio(() => {
  const server = new McpServer(
    { name: 'living-brand', title: 'Living Brand workbench', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  );
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
        openWorldHint: false, // it reads and writes only the practitioner's own folder
      },
    }, async args => {
      try {
        const result = tool.run(args || {});
        return { content: [{ type: 'text', text: result.text }], structuredContent: result.data };
      } catch (error) {
        // A refusal is an answer the model should read and relay, not a crash.
        return { content: [{ type: 'text', text: `Refused: ${error.message}` }], isError: true };
      }
    });
  }
  try { skills?.attach(server); } catch (error) { console.error(`living-brand: skill not attached (${error.message})`); }
  return server;
}, { onerror: error => console.error(`living-brand: ${error.message}`) });
