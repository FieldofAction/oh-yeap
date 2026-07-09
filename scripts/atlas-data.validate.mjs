#!/usr/bin/env node
/**
 * World Cup Atlas — matchday data gate (the Grace step, as code).
 *
 * Validates public/atlas-data.json against the contract in ATLAS.md, deriving
 * the source of truth (team ids, status labels, MATCHES item shape) directly
 * from public/world-cup-atlas.html so the check can never drift from the page.
 *
 * Also runs a structural guard on the HTML: it must stay a single self-contained
 * file (one <script>, one <style>, the key consts intact) — i.e. no formatter,
 * minifier, or split touched it.
 *
 * Usage:  node scripts/atlas-data.validate.mjs [path-to-atlas-data.json]
 * Exit 0 = clean (including "no data file, embedded snapshot stands"); 1 = fail.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = resolve(ROOT, 'public/world-cup-atlas.html');
const DATA = resolve(ROOT, process.argv[2] || 'public/atlas-data.json');

const errors = [];
const fail = (m) => errors.push(m);

// ---- source of truth, pulled from the page --------------------------------
if (!existsSync(HTML)) {
  console.error(`✗ cannot find ${HTML}`);
  process.exit(1);
}
const html = readFileSync(HTML, 'utf8');

// team ids: each row of `const T=[` starts a line with ['xxx',
const TEAM_IDS = new Set([...html.matchAll(/^\['([a-z]{3})',/gm)].map((m) => m[1]));
// status labels: keys of const STATUS_LABEL={...}
const slBlock = html.match(/const STATUS_LABEL=\{([^}]*)\}/);
const STATUSES = new Set(
  slBlock ? [...slBlock[1].matchAll(/(\w+):/g)].map((m) => m[1]) : []
);

if (TEAM_IDS.size !== 48) fail(`expected 48 team ids in the page, found ${TEAM_IDS.size}`);
if (STATUSES.size === 0) fail('could not read STATUS_LABEL from the page');

// ---- structural guard on the HTML -----------------------------------------
const count = (re) => (html.match(re) || []).length;
if (count(/<script\b/g) !== 1) fail('HTML no longer has exactly one <script> (formatter/split?)');
if (count(/<\/script>/g) !== 1) fail('HTML no longer has exactly one </script>');
if (count(/<style>/g) !== 1) fail('HTML no longer has exactly one <style>');
for (const sentinel of ['const T=[', 'const MATCHES=', 'const STATUS_LABEL=', 'function glyphSVG', 'id="fieldWrap"']) {
  if (!html.includes(sentinel)) fail(`HTML missing sentinel \`${sentinel}\` — structure compromised`);
}

// ---- the data file (optional override) ------------------------------------
if (!existsSync(DATA)) {
  report('no atlas-data.json — embedded snapshot stands (valid).');
}

let data;
try {
  data = JSON.parse(readFileSync(DATA, 'utf8'));
} catch (e) {
  console.error(`✗ ${DATA} is not valid JSON: ${e.message}`);
  process.exit(1);
}

const ALLOWED_TOP = new Set(['asof', 'chip', 'statuses', 'matches', 'poly']);
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const id = (v) => (TEAM_IDS.has(v) ? null : `unknown team id "${v}"`);

if (typeof data !== 'object' || data === null || Array.isArray(data)) {
  fail('root must be a JSON object');
} else {
  for (const k of Object.keys(data)) if (!ALLOWED_TOP.has(k)) fail(`unknown top-level key "${k}"`);

  if ('asof' in data && !isStr(data.asof)) fail('asof must be a string');
  if ('chip' in data && !isStr(data.chip)) fail('chip must be a string');

  // statuses: { teamId: STATUS }
  if ('statuses' in data) {
    const s = data.statuses;
    if (typeof s !== 'object' || s === null || Array.isArray(s)) fail('statuses must be an object');
    else for (const [k, v] of Object.entries(s)) {
      const e = id(k); if (e) fail(`statuses: ${e}`);
      if (!STATUSES.has(v)) fail(`statuses.${k}: "${v}" is not in STATUS_LABEL (${[...STATUSES].join(', ')}) — add it to the page first`);
    }
  }

  // matches: [ { round, items:[ ... ] } ]
  if ('matches' in data) {
    if (!Array.isArray(data.matches)) fail('matches must be an array');
    else data.matches.forEach((g, gi) => {
      const at = `matches[${gi}]`;
      if (!isStr(g?.round)) fail(`${at}.round must be a string`);
      if (!Array.isArray(g?.items)) { fail(`${at}.items must be an array`); return; }
      g.items.forEach((it, ii) => {
        const iat = `${at}.items[${ii}]`;
        if (it && isStr(it.tbd)) return; // unresolved slot: { tbd, note? }
        if (!it || id(it.a) || id(it.b)) { fail(`${iat}: needs valid "a"/"b" team ids or a "tbd" string`); return; }
        if (it.a === it.b) fail(`${iat}: a and b are the same team`);
        const played = 'sa' in it || 'sb' in it;
        if (played && !(isNum(it.sa) && isNum(it.sb))) fail(`${iat}: sa/sb must both be numbers`);
        if ('prob' in it) {
          const p = it.prob;
          if (!Array.isArray(p) || p.length !== 3 || !p.every(isNum)) fail(`${iat}.prob must be [win, draw, loss] numbers`);
          else if (Math.abs(p[0] + p[1] + p[2] - 100) > 1.5) fail(`${iat}.prob should sum to ~100 (got ${(p[0]+p[1]+p[2]).toFixed(1)})`);
        }
        if ('note' in it && !isStr(it.note)) fail(`${iat}.note must be a string`);
      });
    });
  }

  // poly: { asOf?, rows: [ [teamId, pct], ... ] }
  if ('poly' in data) {
    const p = data.poly;
    if (typeof p !== 'object' || p === null || Array.isArray(p)) fail('poly must be an object');
    else {
      if ('asOf' in p && !isStr(p.asOf)) fail('poly.asOf must be a string');
      if (!Array.isArray(p.rows)) fail('poly.rows must be an array');
      else p.rows.forEach((row, ri) => {
        if (!Array.isArray(row) || row.length !== 2) { fail(`poly.rows[${ri}] must be [teamId, pct]`); return; }
        const e = id(row[0]); if (e) fail(`poly.rows[${ri}]: ${e}`);
        if (!isNum(row[1]) || row[1] < 0 || row[1] > 100) fail(`poly.rows[${ri}]: pct must be 0–100`);
      });
    }
  }
}

report();

function report(note) {
  if (errors.length) {
    console.error(`✗ atlas-data.json failed ${errors.length} check(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ atlas gate passed${note ? ` — ${note}` : ` (${DATA.split('/').pop()})`}`);
  process.exit(0);
}
