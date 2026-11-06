/* Text on the page — build guard. See CLAUDE.md.
 *
 * Static checks over the public source (src/ minus gated views, and the
 * standalone pages in public/*.html). No browser needed, so it runs in
 * `prebuild` on every deploy.
 *
 *  1. No class name that names a label: eyebrow, kicker, overline,
 *     tagline, crumb, or a "-pre" suffix.
 *  2. No small label rendered directly above a heading: a <div>/<span>
 *     whose class is in the known label set, immediately followed by an
 *     h1–h3 or a *-title/-heading/-h element.
 *  3. No arrow glyph or entity in the text of a link or button.
 *  4. No new small-uppercase CSS rule (uppercase under 12px) beyond the
 *     frozen baseline. Removing one from the CSS is always fine.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const rel = (p) => relative(root, p);

// Match file names, not arbitrary path substrings: PublicSidebar.jsx is public.
// Philosophy.jsx is deprecated/unimported; the public route lives in Canon.jsx.
const GATED = /^(?:(?:Studio|Backstage|Playbook|FOAGenerator|ExplorationEditor|FieldConsole|DevModeBar|Atrium.*|Incandescant.*|NestCompositor|NestReel|BreakgroundCard|ArtOfModel|Philosophy|Sidebar)\.jsx|studio-main\.jsx)$/;
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
const sources = [
  ...walk(join(root, 'src')).filter((p) => /\.(jsx|js|css)$/.test(p) && !GATED.test(basename(p)) && !/\/data\//.test(p)),
  ...readdirSync(join(root, 'public')).filter((n) => n.endsWith('.html')).map((n) => join(root, 'public', n)),
  join(root, 'scripts/experiments-render.mjs'),
];
const read = (p) => readFileSync(p, 'utf8');

test('no class name that names a label', () => {
  const bad = [];
  for (const p of sources) {
    const s = read(p);
    for (const m of s.matchAll(/class(?:Name)?=["'`]([^"'`]*)["'`]/g)) {
      for (const cls of m[1].split(/\s+/)) {
        if (/(^|-)(eyebrow|kicker|overline|tagline|crumb)(-|$)|-pre$/.test(cls)) bad.push(`${rel(p)}: .${cls}`);
      }
    }
    if (p.endsWith('.css') || p.endsWith('.html') || p.endsWith('.mjs')) {
      for (const m of s.matchAll(/\.((?:[\w-]*-)?(?:eyebrow|kicker|overline|tagline|crumb)(?:-[\w-]*)?|[\w-]+-pre)\s*[{,.:\s]/g)) bad.push(`${rel(p)}: .${m[1]} (css)`);
    }
  }
  assert.deepEqual([...new Set(bad)], [], 'Label-named classes found');
});

// Index numbers (-num) sit beside their titles by grid, by decision (see CLAUDE.md);
// pager direction labels (-nav-) are controls. Everything else in this set is a label.
const LABEL_CLASS = /\b(?:[\w-]*(?:label|meta|badge|status|type|pre|sub|tag|id)|hero-dash-label)\b/;
const EXEMPT = /-num\b|-nav-/;
test('no small label rendered directly above a heading', () => {
  const bad = [];
  for (const p of sources.filter((p) => /\.(jsx|html|mjs)$/.test(p))) {
    const s = read(p);
    const re = /<(div|span|p)\s+class(?:Name)?=["'`]([^"'`]+)["'`][^>]*>[^<]{0,80}<\/\1>\s*(?:\{[^}]*\})?\s*<(h[1-3]|div|span)\s+class(?:Name)?=["'`]([^"'`]*(?:-title|-heading|-h|-name)\b[^"'`]*)["'`]/g;
    for (const m of s.matchAll(re)) {
      if (LABEL_CLASS.test(m[2]) && !EXEMPT.test(m[2]) && !/-meta\b|-row\b/.test(m[2])) bad.push(`${rel(p)}: .${m[2].split(' ')[0]} above .${m[4].split(' ')[0]}`);
    }
    for (const m of s.matchAll(/<(div|span)\s+class(?:Name)?=["'`]([^"'`]+)["'`][^>]*>[^<]{0,80}<\/\1>\s*<h[1-3][\s>]/g)) {
      if (LABEL_CLASS.test(m[2]) && !EXEMPT.test(m[2])) bad.push(`${rel(p)}: .${m[2].split(' ')[0]} above h1–h3`);
    }
  }
  assert.deepEqual([...new Set(bad)], [], 'Labels above headings found');
});

test('no arrows in link or button text', () => {
  const bad = [];
  for (const p of sources.filter((p) => /\.(jsx|html|mjs)$/.test(p))) {
    const s = read(p);
    for (const m of s.matchAll(/<(a|button|Link)\b[^>]*>([^<]*(?:<span[^>]*>[^<]*<\/span>[^<]*)*)<\/\1>/g)) {
      if (/[↗→←]|&(?:larr|rarr|nearr|uarr|darr);/.test(m[2])) bad.push(`${rel(p)}: ${m[2].trim().slice(0, 50)}`);
    }
  }
  assert.deepEqual([...new Set(bad)], [], 'Arrows in link/button text found');
});

const baselinePath = join(root, 'scripts/text-on-the-page-baseline.json');
const smallCaps = () => {
  const found = new Set();
  for (const p of sources.filter((p) => p.endsWith('.css') || p.endsWith('.html') || p.endsWith('.mjs'))) {
    const s = read(p).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of s.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = m[2];
      if (!/text-transform\s*:\s*uppercase/.test(body)) continue;
      const fs = body.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/);
      if (fs && parseFloat(fs[1]) < 12) {
        const sel = m[1].trim().split('\n').pop().trim().replace(/\s+/g, ' ');
        found.add(`${rel(p)} ${sel}`);
      }
    }
  }
  return [...found].sort();
};
test('small uppercase rules do not grow beyond the baseline', () => {
  const now = smallCaps();
  // A missing baseline is an error. Builds never create, accept or rewrite debt.
  const base = new Set(JSON.parse(read(baselinePath)));
  const added = now.filter((x) => !base.has(x));
  assert.deepEqual(added, [], 'New small-uppercase rules (under 12px). Remove them, or set them 12px+ in sentence case.');
  const removed = [...base].filter((x) => !now.includes(x));
  if (removed.length) console.log(`Retire ${removed.length} unused small-uppercase baseline entries in review.`);
});
