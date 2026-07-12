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
  asof: 'July 12, 2026',
  chip: 'Semi-finals · July 15',

  // Overrides vs the embedded page baseline. Semifinalists → 'SF', losers → 'OUT'.
  statuses: { fra: 'SF', esp: 'SF', eng: 'SF', arg: 'SF', mar: 'OUT', bel: 'OUT', nor: 'OUT', sui: 'OUT' },

  matches: [
    { round: 'Semi-finals', items: [
      { a: 'fra', b: 'esp', prob: [46, 28, 26], note: 'July 15' },
      { a: 'eng', b: 'arg', prob: [35, 26, 39], note: 'July 16 · a rivalry with history' },
    ]},
    { round: 'Quarter-finals · Played', items: [
      { a: 'fra', b: 'mar', sa: 2, sb: 1, note: 'July 9 · a rematch of the 2022 semi-final' },
      { a: 'esp', b: 'bel', sa: 2, sb: 0, note: 'July 10' },
      { a: 'nor', b: 'eng', sa: 1, sb: 2, note: 'July 11' },
      { a: 'arg', b: 'sui', sa: 2, sb: 0, note: 'July 11' },
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

  poly: { asOf: 'July 12, 2026', rows: [['fra', 42.0], ['arg', 24.0], ['esp', 20.0], ['eng', 14.0]] },
};

// ---- write + gate ----------------------------------------------------------
const out = resolve(ROOT, 'public/atlas-data.json');
writeFileSync(out, JSON.stringify(STATE, null, 2) + '\n');
console.log(`wrote ${out.replace(ROOT + '/', '')}`);
execFileSync('node', ['scripts/atlas-data.validate.mjs'], { cwd: ROOT, stdio: 'inherit' });
