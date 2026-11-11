// Builds a single-file workbench page from brand packets kept OUTSIDE this
// repository. The repository is public; real brands' records are not, so they
// are never committed and never enter the public /living-brand bundle.
//
//   node scripts/living-brand-private-build.mjs --packets <dir> --out <file.html> [--title "Name"]
//
// Every *.packet.json in <dir> becomes an engagement that can be opened.
// The output is page content with inline CSS and JS, ready to publish as a
// private page or to open from disk behind a minimal HTML shell (--shell).
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync, realpathSync, existsSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { readPacket } from '../src/living-brand/domain/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const arg = name => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : null; };
const packetsDir = arg('packets');
const out = arg('out');
const title = arg('title') || 'Living Brand Workbench';
const asOf = arg('as-of') || new Date().toISOString().slice(0, 10);
const shell = process.argv.includes('--shell');
if (!packetsDir || !out) { console.error('Usage: --packets <dir> --out <file.html> [--title "Name"] [--as-of YYYY-MM-DD] [--shell]'); process.exit(1); }
// Real paths are compared, so a symlink or the repository root itself cannot slip a real brand's records into it.
const real = path => { try { return realpathSync(path); } catch { return resolve(path); } };
const inside = path => { const p = real(path); const r = real(root); return p === r || p.startsWith(r + sep); };
if (!existsSync(packetsDir) || !lstatSync(real(packetsDir)).isDirectory()) { console.error(`No folder at ${packetsDir}.`); process.exit(1); }
if (inside(packetsDir) || inside(dirname(resolve(out))) || (existsSync(out) && (lstatSync(out).isSymbolicLink() || inside(out)))) {
  console.error('Refused: packets and output must live outside this repository, which is public.'); process.exit(1);
}

const files = readdirSync(packetsDir).filter(f => f.endsWith('.packet.json')).sort();
if (!files.length) { console.error(`No *.packet.json files in ${packetsDir}.`); process.exit(1); }
const open = files.map(f => {
  const packet = JSON.parse(readFileSync(join(packetsDir, f), 'utf8'));
  const { brand, engagement, record } = readPacket(packet); // refuses anything inconsistent
  return { brand, engagement, record };
});
const ids = open.map(o => o.brand.id);
if (new Set(ids).size !== ids.length) { console.error('Two packets hold the same brand.'); process.exit(1); }

const first = open[0].engagement;
const catalog = {
  asOf, homeHref: null, homeLabel: title,
  practitioner: {
    name: first.practitioner || 'Practitioner',
    // Methods are the practitioner's own. A page built from packets has none to show until they write some.
    methods: [],
    preferences: {},
    engagements: open.map(o => ({ id: o.engagement.id, clientLabel: o.brand.name, role: o.engagement.role })),
  },
  open, closed: [], agency: null,
};

// The page's code and the brands' records are kept apart: the code is bundled
// on its own, and the records travel as inert JSON that the code reads at
// start. Nothing written in a record can end up being run as script.
const work = mkdtempSync(join(tmpdir(), 'living-brand-build-'));
const entry = join(work, 'entry.jsx');
writeFileSync(entry, `import { createRoot } from 'react-dom/client';
import Workbench from ${JSON.stringify(join(root, 'src/living-brand/Workbench.jsx'))};
import ${JSON.stringify(join(root, 'src/living-brand/workbench.css'))};
const catalog = JSON.parse(document.getElementById('lb-catalog').textContent);
createRoot(document.getElementById('root')).render(<Workbench catalog={catalog} />);
`);

const result = await build({
  entryPoints: [entry], bundle: true, minify: true, write: false, outdir: work, format: 'iife', target: 'es2020',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, nodePaths: [join(root, 'node_modules')], logLevel: 'warning',
});
rmSync(work, { recursive: true, force: true });
const js = result.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
// Every "<" in the records is written as an escape, so no record text can open or close a tag.
const data = JSON.stringify(catalog).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const css = result.outputFiles.find(f => f.path.endsWith('.css')).text;

// A hosted page runs edge to edge on phones; keep content clear of system bars.
const frame = `
body { padding-left: env(safe-area-inset-left, 0px); padding-right: env(safe-area-inset-right, 0px); }
.lb-top { top: env(safe-area-inset-top, 0px); padding-left: max(16px, clamp(1rem, 3vw, 2rem)); padding-right: max(16px, clamp(1rem, 3vw, 2rem)); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--lb-bg); }
.lb { min-height: 0; }`;

const page = `<title>${title.replace(/</g, '&lt;')}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Schibsted+Grotesk:wght@500;600;700&display=swap">
<style>${css}${frame}</style>
<div id="root"></div>
<script type="application/json" id="lb-catalog">${data}</script>
<script>${js}</script>
`;
writeFileSync(out, shell ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>${page}</body></html>` : page);
console.log(`Built ${out}: ${open.map(o => `${o.brand.name} (${o.brand.items.length} items)`).join(', ')}; ${(page.length / 1024).toFixed(0)} KB.`);
