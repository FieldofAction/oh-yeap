#!/usr/bin/env node
/** Plain-language contract checks. Fixtures stay in temporary directories. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ROOT, SECTIONS, GROUPS, loadEntries, renderBlocks } from './experiments-lib.mjs';

const heading = '## Simple Application / Plain-Language Read';
const labels = ['In simple terms', 'Simple example', 'Why it matters'];
const raw = readFileSync(resolve(ROOT, 'content/experiments/_TEMPLATE.md'), 'utf8');
assert.ok(raw.includes(heading), 'the authoring template includes the closing section');
const base = raw.slice(0, raw.indexOf(heading))
  .replace(/^id: .*$/m, 'id: FIXTURE-PLAIN-READ')
  .replace(/^experiment_date: .*$/m, 'experiment_date: 2026-09-16')
  .replace(/^published: .*$/m, 'published: 2026-09-17')
  .replace(/^status: .*$/m, 'status: published');
const part = labels.map((label) => `**${label}:**\n\nA short fixture explanation.`).join('\n\n');
const dir = mkdtempSync(join(tmpdir(), 'experiments-plain-read-'));
function check(body) {
  writeFileSync(join(dir, 'plain-read-fixture.md'), body);
  return loadEntries(dir);
}
try {
  let result = check(`${base}${heading}\n\n${part}\n`);
  assert.deepEqual(result.errors, [], 'the three-part closing section validates');
  assert.equal(result.published.length, 1);
  const html = renderBlocks(result.published[0].sections.plain_language);
  for (const label of labels) assert.ok(html.includes(`<strong>${label}:</strong>`));
  assert.equal(SECTIONS.at(-1).key, 'plain_language', 'the closing section is ordered last');
  assert.equal(Object.keys(GROUPS).at(-1), 'plain_language', 'its rendering band follows support');
  for (const label of labels) {
    result = check(`${base}${heading}\n\n${part.replace(`**${label}:**`, '**Other:**')}\n`);
    assert.ok(result.errors.some((e) => e.includes('exactly once, in that order')), `missing ${label} fails`);
  }
  result = check(`${base}${heading}\n\n${part}\n\n**In simple terms:**\n\nDuplicate.\n`);
  assert.ok(result.errors.some((e) => e.includes('exactly once, in that order')), 'duplicate labels fail');
  const reversed = [...labels].reverse().map((label) => `**${label}:**\n\nText.`).join('\n\n');
  result = check(`${base}${heading}\n\n${reversed}\n`);
  assert.ok(result.errors.some((e) => e.includes('exactly once, in that order')), 'wrong order fails');
  result = check(`${base}${heading}\n\n${part.replace('**Why it matters:**\n\nA short fixture explanation.', '**Why it matters:**')}\n`);
  assert.ok(result.errors.some((e) => e.includes('cannot be empty')), 'an empty piece fails');
  assert.deepEqual(check(base).errors, [], 'legacy entries without the new section still validate');
  writeFileSync(join(dir, '_closing-only-draft.md'), `${heading}\n\n${part}\n`);
  assert.equal(loadEntries(dir).entries.length, 1, 'underscore-prefixed fragments cannot publish');
  console.log('  ✓ plain-language section: template, parsing, labels, rendering, ordering, and legacy compatibility');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
