/** Compare committed allowances with the PR's base, not just today's findings. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { compareWithBaseline } from './text-rule-lib.mjs';

const base = process.env.TEXT_RULE_BASE_SHA;
assert.match(base || '', /^[a-f0-9]{40}$/, 'TEXT_RULE_BASE_SHA must be the full PR base commit SHA.');
const paths = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', base], { encoding: 'utf8' }).trim().split('\n'));
for (const path of ['scripts/text-on-the-page-baseline.json', 'scripts/fixtures/text-rule-baseline.json']) {
  if (!paths.has(path)) {
    console.log(`${path}: no inherited baseline; any initial allowance list requires review. The page check still fails without its reviewed baseline.`);
    continue;
  }
  assert.ok(existsSync(path), `Do not delete the inherited baseline: ${path}`);
  const before = JSON.parse(execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8' }));
  const after = JSON.parse(readFileSync(path, 'utf8'));
  const normalize = entries => entries.map(entry => typeof entry === 'string' ? { page: 'source', rule: 'small-uppercase', path: entry } : entry);
  const { added } = compareWithBaseline(normalize(after), normalize(before));
  assert.deepEqual(added, [], `${path}: committed allowances may only shrink.`);
  console.log(`${path}: no new committed allowances.`);
}
