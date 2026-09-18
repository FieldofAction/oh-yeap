#!/usr/bin/env node
/**
 * Experiments — content gate.
 *
 * Checks every file in content/experiments/ against the contract in
 * experiments-lib.mjs: required fields, field formats, duplicate ids and slugs,
 * unresolved related ids, required sections, and unknown keys or headings.
 *
 * Usage:  node scripts/experiments-validate.mjs [content-dir]
 * Exit 0 = clean (including "no entries yet"); 1 = fail.
 */
import { CONTENT_DIR, loadEntries } from './experiments-lib.mjs';

const dir = process.argv[2] || CONTENT_DIR;
const { entries, published, errors, warnings } = loadEntries(dir);

for (const warning of warnings) console.warn(`⚠ ${warning}`);

if (errors.length) {
  for (const error of errors) console.error(`✗ ${error}`);
  console.error(`\n✗ experiments: ${errors.length} error${errors.length === 1 ? '' : 's'} — nothing was generated.`);
  process.exit(1);
}

const drafts = entries.length - published.length;
console.log(
  `✓ experiments: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} valid`
  + ` (${published.length} published${drafts ? `, ${drafts} draft` : ''})`
  + `${warnings.length ? ` — ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : ''}.`
);
