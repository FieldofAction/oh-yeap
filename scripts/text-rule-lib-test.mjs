import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compareWithBaseline, findTextRuleViolations, violationKey } from './text-rule-lib.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the checker is self-contained so it can be serialised into a page', () => {
  const source = findTextRuleViolations.toString();
  for (const name of ['SMALL_TEXT_PX', 'BASELINE_PATH', 'import', 'require']) assert.ok(!source.includes(name), `Closes over ${name}`);
});

test('a finding not in the baseline is reported as new; a baseline entry no longer found is retired', () => {
  const baseline = [
    { page: 'home', rule: 'eyebrow', path: 'div.hero > span.eyebrow', text: 'Generative' },
    { page: 'about', rule: 'mono-label', path: 'div.ab > span.ab-sl', text: '01' },
  ];
  const found = [
    { page: 'home', rule: 'eyebrow', path: 'div.hero > span.eyebrow', text: 'Generative, now reworded' },
    { page: 'home', rule: 'link-arrow', path: 'nav > a', text: 'Writing ↗' },
  ];
  const { added, tolerated, retired } = compareWithBaseline(found, baseline);
  assert.deepEqual(added.map(violationKey), ['home|link-arrow|nav > a']);
  assert.deepEqual(tolerated.map(violationKey), ['home|eyebrow|div.hero > span.eyebrow']);
  assert.deepEqual(retired.map(violationKey), ['about|mono-label|div.ab > span.ab-sl']);
});

test('text changes alone do not create new findings', () => {
  const entry = { page: 'p', rule: 'small-uppercase', path: 'div > span', text: 'before' };
  const { added } = compareWithBaseline([{ ...entry, text: 'after' }], [entry]);
  assert.equal(added.length, 0);
});

test('the rule and its enforcement are documented where tools read them', () => {
  const claude = read('CLAUDE.md').replace(/\s+/g, ' ');
  const cursor = read('.cursor/rules/text-on-the-page.mdc').replace(/\s+/g, ' ');
  for (const line of ['says the idea', 'names the thing', 'operates a control', 'Delete the CSS']) {
    assert.ok(claude.includes(line), `CLAUDE.md missing "${line}"`);
    assert.ok(cursor.includes(line), `Cursor rule missing "${line}"`);
  }
  assert.ok(claude.includes('text-rule-baseline.json'));
});
