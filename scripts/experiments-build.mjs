#!/usr/bin/env node
/**
 * Experiments — page generation.
 *
 * Reads content/experiments/*.md and writes public/experiments/ (index.html
 * plus one <slug>.html per published entry). Vite copies public/ into dist/,
 * so this runs as `prebuild`/`predev` — no component ever has to be edited to
 * add or remove an entry.
 *
 * The output directory is generated, and git-ignored. Do not hand-edit it.
 *
 * Usage:  node scripts/experiments-build.mjs
 * Exit 0 = written; 1 = validation failed, nothing written.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { CONTENT_DIR, ROOT, loadEntries } from './experiments-lib.mjs';
import { renderEntryPage, renderIndexPage } from './experiments-render.mjs';

const OUT_DIR = resolve(ROOT, 'public/experiments');

const { entries, published, byId, errors, warnings } = loadEntries(CONTENT_DIR);

for (const warning of warnings) console.warn(`⚠ ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`✗ ${error}`);
  console.error(`\n✗ experiments: ${errors.length} error${errors.length === 1 ? '' : 's'} — no pages generated.`);
  process.exit(1);
}

// Rebuild from scratch so a deleted or renamed entry cannot leave a stale page.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(join(OUT_DIR, 'index.html'), renderIndexPage(published), 'utf8');
for (const entry of published) {
  writeFileSync(join(OUT_DIR, `${entry.slug}.html`), renderEntryPage(entry, byId), 'utf8');
}

const drafts = entries.length - published.length;
console.log(
  `✓ experiments: wrote ${published.length + 1} page${published.length ? 's' : ''} to ${relative(ROOT, OUT_DIR)}/`
  + ` (${published.length} published${drafts ? `, ${drafts} draft skipped` : ''}).`
);
