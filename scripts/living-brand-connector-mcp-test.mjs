// Drives the BUILT connector over stdio with the official MCP client, in both
// protocol eras. Run after `npm run living-brand:connector:build`.
//   node --test scripts/living-brand-connector-mcp-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const SERVER = new URL('../living-brand/connector/bundle/server.mjs', import.meta.url).pathname;

async function connect(mode) {
  const home = mkdtempSync(join(tmpdir(), 'living-brand-mcp-'));
  const transport = new StdioClientTransport({ command: process.execPath, args: [SERVER], env: { ...process.env, LIVING_BRAND_HOME: home, LIVING_BRAND_AS_OF: '2026-11-11' }, stderr: 'pipe' });
  const client = new Client({ name: 'living-brand-test', version: '0' }, mode ? { versionNegotiation: { mode } } : {});
  await client.connect(transport);
  return { client, home };
}
const text = r => r.content.map(c => c.text).join('\n');

for (const mode of [undefined, 'auto']) {
  const era = mode ? 'current protocol' : 'earlier protocol';

  test(`${era}: lists every tool with a title, a schema and honest annotations`, async () => {
    const { client } = await connect(mode);
    try {
      const { tools } = await client.listTools();
      assert.equal(tools.length, 26);
      for (const t of tools) {
        assert.ok(t.title && t.description && t.inputSchema?.type === 'object', t.name);
        assert.equal(typeof t.annotations.readOnlyHint, 'boolean', t.name);
        assert.equal(t.annotations.openWorldHint, false, t.name);
      }
      const byName = Object.fromEntries(tools.map(t => [t.name, t]));
      assert.equal(byName.search_material.annotations.readOnlyHint, true);
      assert.equal(byName.record_choice.annotations.readOnlyHint, false);
      assert.equal(byName.end_engagement.annotations.destructiveHint, true);
      assert.equal(byName.decide_proposal.annotations.destructiveHint, false);
      assert.match(client.getInstructions() || '', /ONE engagement at a time/);
    } finally { await client.close(); }
  });

  test(`${era}: an engagement can be opened, searched and changed, and refusals come back as readable errors`, async () => {
    const { client, home } = await connect(mode);
    try {
      assert.match(text(await client.callTool({ name: 'list_engagements', arguments: {} })), /Fernway \[eng-fernway\]/);
      const opened = await client.callTool({ name: 'open_engagement', arguments: { engagement_id: 'eng-fernway' } });
      assert.match(text(opened), /Who decides:[\s\S]*visual standing: Priya Raman/);
      assert.ok(opened.structuredContent.tensionCount > 5);
      // A client that shows only the structured form still gets the whole account.
      assert.equal(opened.structuredContent.account, opened.content[0].text);
      assert.match(opened.structuredContent.account, /Stated intent:[\s\S]*You are not named to decide anything in this engagement[\s\S]*Needs attention before anything is made/);
      const found = await client.callTool({ name: 'search_material', arguments: { engagement_id: 'eng-fernway', query: 'paper-cut', channels: ['owned-web'] } });
      assert.match(text(found), /relevant yes; authorized yes; reusable here no; authoritative no/);
      const proposal = await client.callTool({ name: 'propose_standing', arguments: { engagement_id: 'eng-fernway', item_id: 'fw-onboarding-papercut', to: 'canon', rationale: 'Used everywhere' } });
      assert.match(text(proposal), /Nothing has changed/);
      const refused = await client.callTool({ name: 'decide_proposal', arguments: { engagement_id: 'eng-fernway', proposal_id: proposal.structuredContent.id, outcome: 'adopt' } });
      assert.equal(refused.isError, true);
      assert.match(text(refused), /^Refused: The practitioner cannot change the standing/);
      const ended = await client.callTool({ name: 'open_engagement', arguments: { engagement_id: 'eng-brightloop' } });
      assert.equal(ended.isError, true);
      assert.match(text(ended), /no longer held/);
      // The change was written to that engagement's own folder.
      assert.ok(readFileSync(join(home, 'engagements/eng-fernway/packet.json'), 'utf8').includes('Used everywhere'));
      // Arguments that do not fit the schema are refused before any tool runs.
      const invalid = await client.callTool({ name: 'record_choice', arguments: { engagement_id: 'eng-fernway', subject: 'x', verdict: 'promote', rationale: 'x' } }).catch(e => ({ isError: true, content: [{ text: e.message }] }));
      assert.equal(invalid.isError, true);
      // A damaged record is reported as a fault of the store, never as a refusal by the brand.
      const { writeFileSync } = await import('node:fs');
      writeFileSync(join(home, 'workbench.json'), '{"practitioner": ');
      const damaged = await client.callTool({ name: 'list_engagements', arguments: {} });
      assert.equal(damaged.isError, true);
      assert.match(text(damaged), /workbench index cannot be read; the file is damaged/);
    } finally { await client.close(); }
  });
}

test('the bundle is self-contained and holds no other client or real brand', () => {
  const src = readFileSync(SERVER, 'utf8');
  assert.ok(statSync(SERVER).size > 200_000);
  assert.ok(!/from ["']@modelcontextprotocol/.test(src), 'the SDK is bundled in');
  for (const marker of ['Lanterns', 'Conquest campaign', 'Maya Chen', 'Soul Mega', 'soulmega', 'Reddit']) assert.ok(!src.includes(marker), marker);
  assert.ok(src.includes('Running a brand engagement'), 'the skill travels inside the connector');
  const skill = readFileSync(new URL('../living-brand/skills/living-brand/SKILL.md', import.meta.url), 'utf8');
  assert.equal(readFileSync(new URL('../.claude/skills/living-brand/SKILL.md', import.meta.url), 'utf8'), skill, 'the project copy of the skill matches its source');
  const description = skill.match(/^description: (.*)$/m)[1];
  assert.ok(description.length <= 1024, 'the description fits where skills are listed');
  assert.ok(skill.split('\n').length < 500);
  for (const file of ['.mcp.json', 'living-brand/.mcp.json', 'living-brand/.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
});
