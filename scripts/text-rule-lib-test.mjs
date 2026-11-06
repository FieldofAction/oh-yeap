import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compareWithBaseline, findTextRuleViolations, shrinkBaseline, violationKey } from './text-rule-lib.mjs';

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

test('repeated elements sharing a selector cannot hide a new violation', () => {
  const entry = { page: 'p', rule: 'link-arrow', path: 'nav > a', text: 'Read →' };
  const result = compareWithBaseline([entry, { ...entry, text: 'More →' }], [entry]);
  assert.equal(result.added.length, 1);
  assert.equal(result.tolerated.length, 1);
  assert.equal(result.retired.length, 0);
});

test('retirement counts duplicate occurrences separately', () => {
  const one = { page: 'p', rule: 'link-arrow', path: 'nav > a', text: 'One →' };
  const two = { ...one, text: 'Two →' };
  assert.equal(compareWithBaseline([one], [one, two]).retired.length, 1);
  assert.equal(shrinkBaseline([one], [one, two]).length, 1);
  assert.equal(shrinkBaseline([one], [one, one]).length, 1);
});

test('baseline updates refuse missing baselines and new findings', () => {
  const entry = { page: 'p', rule: 'link-arrow', path: 'nav > a', text: 'Read →' };
  assert.throws(() => shrinkBaseline([entry], null), /No reviewed baseline/);
  assert.throws(() => shrinkBaseline([entry], []), /Cannot accept/);
  assert.throws(() => shrinkBaseline([entry, { ...entry }], [entry]), /Cannot accept/);
  assert.deepEqual(shrinkBaseline([], [entry]), []);
});

test('a baseline retirement preserves reviewed text and never mutates its input', () => {
  const entry = { page: 'p', rule: 'mono-label', path: 'span', text: 'Before' };
  const baseline = Object.freeze([Object.freeze(entry)]);
  assert.deepEqual(shrinkBaseline([{ ...entry, text: 'After' }], baseline), [entry]);
  assert.equal(baseline.length, 1);
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
