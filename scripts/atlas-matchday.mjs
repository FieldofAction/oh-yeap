#!/usr/bin/env node
/**
 * World Cup Atlas — matchday scaffold.
 *
 * The seam: WHO won and the scorelines are authored (yours — Freedom Embassy).
 * Everything downstream is mechanical and lives here: edit STATE below, run this,
 * and it writes public/atlas-data.json (which overrides the embedded snapshot at
 * load) and runs the gate. The page HTML never changes on matchday.
 *
 *   node scripts/atlas-matchday.mjs      # write + validate
 *   git add public/atlas-data.json && git commit
 *
 * Matchday edit pattern:
 *   - a fixture that was played: add sa/sb, drop prob   → { a, b, sa, sb, note }
 *   - a resolved slot:           replace { tbd } with   → { a, b, prob:[...], note }
 *   - a knocked-out team:        statuses[id] = 'OUT'   (QF/SF losers use 'OUT')
 *   - a round change:            update chip + asof, refresh poly.rows
 *   - a NEW status (SF/F/W):     add it to STATUS_LABEL in world-cup-atlas.html FIRST,
 *                                or the gate will reject it (and the label would render blank)
 */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---- authored state --------------------------------------------------------
const STATE = {
  asof: 'July 10, 2026',
  chip: 'Quarter-finals · July 11',

  // Overrides vs the embedded page baseline. QF losers → 'OUT'.
  statuses: { mar: 'OUT', bel: 'OUT' },

  matches: [
    { round: 'Quarter-finals', items: [
      { a: 'fra', b: 'mar', sa: 2, sb: 1, note: 'July 9 · a rematch of the 2022 semi-final' },
      { a: 'esp', b: 'bel', sa: 2, sb: 0, note: 'July 10' },
      { a: 'nor', b: 'eng', prob: [23.8, 25.7, 50.5], note: 'July 11' },
      { a: 'arg', b: 'sui', prob: [60.5, 24.5, 15], note: 'July 11' },
    ]},
    { round: 'Round of 16 · Played', items: [
      { a: 'arg', b: 'egy', sa: 3, sb: 2, note: 'July 7' },
      { a: 'sui', b: 'col', sa: 1, sb: 1, note: 'July 7 · Switzerland advance on penalties' },
      { a: 'mar', b: 'can', sa: 3, sb: 0, note: 'July 4' },
      { a: 'fra', b: 'par', sa: 1, sb: 0, note: 'July 4' },
      { a: 'nor', b: 'bra', sa: 2, sb: 1, note: 'July 5 · Brazil eliminated' },
      { a: 'eng', b: 'mex', sa: 3, sb: 2, note: 'July 5' },
      { a: 'por', b: 'esp', sa: 0, sb: 1, note: 'July 6' },
      { a: 'usa', b: 'bel', sa: 1, sb: 4, note: 'July 6' },
    ]},
    { round: 'Round of 32 · Selected results', items: [
      { a: 'esp', b: 'aut', sa: 3, sb: 0, note: 'July 2' },
      { a: 'por', b: 'cro', sa: 2, sb: 1, note: 'July 2' },
      { a: 'sui', b: 'alg', sa: 2, sb: 0, note: 'July 2' },
      { a: 'usa', b: 'bih', sa: 2, sb: 0, note: '' },
      { a: 'can', b: 'rsa', sa: 1, sb: 0, note: 'Eustáquio in stoppage time' },
      { a: 'egy', b: 'aus', sa: 1, sb: 1, note: 'July 3 · Egypt advance on penalties' },
      { a: 'arg', b: 'cpv', sa: 3, sb: 2, note: 'July 3 · a debutant pushes the champions' },
      { a: 'col', b: 'gha', sa: 1, sb: 0, note: 'July 3' },
    ]},
  ],

  poly: { asOf: 'July 10, 2026', rows: [['fra', 38.6], ['arg', 17.8], ['esp', 17.3], ['eng', 16.0], ['nor', 5.9]] },
};

// ---- write + gate ----------------------------------------------------------
const out = resolve(ROOT, 'public/atlas-data.json');
writeFileSync(out, JSON.stringify(STATE, null, 2) + '\n');
console.log(`wrote ${out.replace(ROOT + '/', '')}`);
execFileSync('node', ['scripts/atlas-data.validate.mjs'], { cwd: ROOT, stdio: 'inherit' });
