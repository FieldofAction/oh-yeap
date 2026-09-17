#!/usr/bin/env node
/**
 * Experiments — validator and renderer tests.
 *
 * Each case is a directory of entry files under scripts/fixtures/experiments/.
 * They live outside content/experiments/ on purpose: fixtures must never be
 * mistaken for, or published as, real experiments.
 *
 * Invalid cases assert that a specific error is raised. Valid cases assert the
 * opposite — that every form the publishing document promises is accepted and
 * renders — so the restrictions cannot quietly become over-restrictions.
 *
 * Usage:  node scripts/experiments-test.mjs
 * Exit 0 = all cases pass; 1 = at least one failed.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ROOT, loadEntries } from './experiments-lib.mjs';
import { renderEntryPage, renderIndexPage } from './experiments-render.mjs';

const FIXTURES = resolve(ROOT, 'scripts/fixtures/experiments');

/** Invalid cases: the directory must fail, with an error matching `expect`. */
const REJECTS = [
  ['reserved-slug-index', /reserved slug "index"/, 'an entry named index.md cannot overwrite the section index'],
  ['unsupported-table', /tables are not supported/, 'a Markdown table is refused, not flattened to a paragraph'],
  ['unsupported-image', /images are not supported/, 'image syntax is refused, not rendered as stray punctuation'],
  ['unsupported-footnote', /footnotes are not supported/, 'footnote syntax is refused'],
  ['unsupported-fenced-code', /fenced code blocks are not supported/, 'a fenced code block is refused'],
  ['unsupported-rule', /horizontal rules are not supported/, 'a thematic break is refused'],
  ['duplicate-id', /duplicate id "FIXTURE-DUP"/, 'two entries cannot share an id'],
  ['missing-section', /missing required section "## Anomaly"/, 'a required section cannot be omitted'],
  ['unresolved-related', /related id "FIXTURE-DOES-NOT-EXIST" does not match/, 'related ids must resolve'],
];

let failures = 0;
const pass = (what) => console.log(`  ✓ ${what}`);
const fail = (what, detail) => { failures += 1; console.error(`  ✗ ${what}\n      ${detail}`); };

console.log('rejects malformed entries');
for (const [dir, expected, what] of REJECTS) {
  const { errors } = loadEntries(resolve(FIXTURES, dir));
  if (!errors.length) fail(what, 'expected an error, got none');
  else if (!errors.some((e) => expected.test(e))) fail(what, `no error matched ${expected}\n      got: ${errors.join('\n           ')}`);
  else pass(what);
}

console.log('accepts the documented subset');
{
  const { entries, published, errors, byId } = loadEntries(resolve(FIXTURES, 'valid-markdown-subset'));
  if (errors.length) {
    fail('every promised Markdown form validates', `unexpected errors:\n      ${errors.join('\n      ')}`);
  } else if (published.length !== 1) {
    fail('every promised Markdown form validates', `expected 1 published entry, got ${published.length}`);
  } else {
    pass('every promised Markdown form validates');

    const html = renderEntryPage(published[0], byId);
    const expectations = [
      [/<p>A paragraph with <strong>bold<\/strong>/, 'paragraphs with bold'],
      [/<em>italic<\/em>/, 'italic'],
      [/<code>inline code<\/code>/, 'inline code'],
      [/<a href="https:\/\/example\.org\/a" target="_blank" rel="noopener noreferrer">link<\/a>/, 'links'],
      [/<ul class="x-list"><li>one bullet<\/li>/, 'bullet lists'],
      [/<ol class="x-list"><li>first step<\/li>/, 'numbered lists'],
      [/<blockquote>A quotation/, 'quotations'],
      [/Material record[\s\S]*Interpretation/, 'the observed band renders before the interpretation band'],
    ];
    for (const [re, what] of expectations) {
      if (re.test(html)) pass(`renders ${what}`);
      else fail(`renders ${what}`, `no match for ${re}`);
    }
    if (entries.length === published.length) pass('no fixture is treated as a draft');
  }
}

// The template teaches the contract. If the two drift apart, an author follows
// the template and the validator rejects the result — so bind them here.
console.log('ships a template that satisfies the contract');
{
  const raw = readFileSync(resolve(ROOT, 'content/experiments/_TEMPLATE.md'), 'utf8');
  const filled = raw
    .replace(/^id: .*$/m, 'id: FIXTURE-TEMPLATE')
    .replace(/^experiment_date: .*$/m, 'experiment_date: 2026-09-16')
    .replace(/^published: .*$/m, 'published: 2026-09-17')
    .replace(/^status: .*$/m, 'status: published');

  const dir = mkdtempSync(join(tmpdir(), 'experiments-template-'));
  try {
    writeFileSync(join(dir, 'validator-fixture-from-template.md'), filled);
    const { published, errors, byId } = loadEntries(dir);
    if (errors.length) {
      fail('the shipped _TEMPLATE.md validates once its placeholders are filled',
        `the template teaches something the validator rejects:\n      ${errors.join('\n      ')}`);
    } else if (published.length !== 1) {
      fail('the shipped _TEMPLATE.md validates once its placeholders are filled', `expected 1 entry, got ${published.length}`);
    } else {
      pass('the shipped _TEMPLATE.md validates once its placeholders are filled');
      const html = renderEntryPage(published[0], byId);
      const bands = ['Material record', 'Interpretation', 'Support'];
      const missing = bands.filter((b) => !html.includes(b));
      if (missing.length) fail('the template renders all three bands', `missing: ${missing.join(', ')}`);
      else pass('the template renders all three bands');
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log('renders the empty state');
{
  const html = renderIndexPage([]);
  if (/No experiments published yet\./.test(html)) pass('an empty section states that it is empty');
  else fail('an empty section states that it is empty', 'empty-state copy missing');
}

if (failures) {
  console.error(`\n✗ experiments: ${failures} test${failures === 1 ? '' : 's'} failed.`);
  process.exit(1);
}
console.log('\n✓ experiments: all tests passed.');
