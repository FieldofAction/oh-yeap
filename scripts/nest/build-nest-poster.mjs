/*
 * Build the NEST index poster — revised layout.
 *
 * - Reads /instagram/patio-beach-archive.jsx and extracts 486 primary image paths
 * - Lays them in an 18×27 typology grid
 * - Renders inside a warm-paper "sheet" with a deckle (torn) left edge
 * - Three-column editorial footer (left metadata / center NEST lockup / right imprint)
 * - Hero output: public/images/nest/poster-hero.jpg (2400×3600, 2:3)
 *
 * Run from worktree root:  node scripts/nest/build-nest-poster.mjs
 */

import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const worktreeRoot = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(worktreeRoot, '..', '..', '..');
const archivePath = path.join(repoRoot, 'instagram', 'patio-beach-archive.jsx');
const mediaRoot = path.join(worktreeRoot, 'public');
const outDir = path.join(worktreeRoot, 'public', 'images', 'nest');
const outPath = path.join(outDir, 'poster-hero.jpg');

// ── 1. Parse the archive: first image per post ────────────────────────────
const archiveSrc = fs.readFileSync(archivePath, 'utf8');
const IMG_RE = /\.(jpe?g|png)$/i;
const arrayMatches = [...archiveSrc.matchAll(/i:\[([^\]]+)\]/g)];
const allPaths = arrayMatches
  .map(m => {
    const items = [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
    return items.find(p => IMG_RE.test(p)) || null;
  })
  .filter(Boolean);

const verified = [];
for (const rel of allPaths) {
  const abs = path.join(mediaRoot, rel);
  if (fs.existsSync(abs)) verified.push({ rel, abs });
}
console.log(`Parsed ${allPaths.length} image paths, verified ${verified.length} on disk.`);

const GRID_COLS = 18;
const GRID_ROWS = 27;
const GRID_CELLS = GRID_COLS * GRID_ROWS;
const cells = verified.slice(0, GRID_CELLS);
while (cells.length < GRID_CELLS) cells.push(null);

// ── 2. Canvas + sheet geometry ────────────────────────────────────────────
const W = 2400;          // canvas width
const H = 3600;          // canvas height (exact 2:3)

const SHEET_INSET_X = 160;   // backdrop margin on each side
const SHEET_INSET_TOP = 180;
const SHEET_INSET_BOT = 180;
const SHEET_W = W - SHEET_INSET_X * 2;   // 2080
const SHEET_H = H - SHEET_INSET_TOP - SHEET_INSET_BOT; // 3240

// ── 3. Deckle-edge clip-path (left side of sheet) ─────────────────────────
// Deterministic "randomness" so rebuilds produce the same edge shape.
function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(486);

function buildDeckleClipPath(heightPx, steps = 70, maxInset = 22) {
  // Points clockwise starting top-left, using the sheet's own coord system.
  const pts = [];
  pts.push(`${(rand() * maxInset).toFixed(1)}px 0`);   // top-left with tiny inset
  pts.push(`100% 0`);
  pts.push(`100% 100%`);
  pts.push(`${(rand() * maxInset).toFixed(1)}px 100%`); // bottom-left with tiny inset
  // Left edge going up from near-bottom to near-top
  for (let i = steps - 1; i >= 1; i--) {
    const y = (i / steps) * heightPx;
    // Use cubic-ish variance to cluster values near 0 with occasional deeper bites
    const r = rand();
    const inset = Math.pow(r, 1.6) * maxInset;
    pts.push(`${inset.toFixed(1)}px ${y.toFixed(1)}px`);
  }
  return `polygon(${pts.join(', ')})`;
}

const deckleClipPath = buildDeckleClipPath(SHEET_H);

// ── 4. Build cell HTML ────────────────────────────────────────────────────
const cellHtml = cells
  .map(c => c
    ? `<div class="cell"><img src="file://${c.abs}" alt="" loading="eager" decoding="sync"/></div>`
    : `<div class="cell cell-empty"></div>`)
  .join('');

// ── 5. HTML document ──────────────────────────────────────────────────────
const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; }
  body {
    background: #E4D8BF;   /* warm tan backdrop behind the sheet */
    font-family: 'IBM Plex Mono', monospace;
    color: #1A1714;
    position: relative;
    overflow: hidden;
  }

  /* ── Sheet: warm paper with deckle edge on left ── */
  .sheet {
    position: absolute;
    top: ${SHEET_INSET_TOP}px;
    left: ${SHEET_INSET_X}px;
    width: ${SHEET_W}px;
    height: ${SHEET_H}px;
    background: #F1E8D2;              /* slightly brighter cream */
    clip-path: ${deckleClipPath};
    display: flex;
    flex-direction: column;
    padding: 300px 220px 200px 220px;  /* generous top margin, balanced sides */
  }

  /* Subtle drop-shadow approximation — render a second sheet behind for shadow */
  .shadow {
    position: absolute;
    top: ${SHEET_INSET_TOP + 4}px;
    left: ${SHEET_INSET_X + 4}px;
    width: ${SHEET_W}px;
    height: ${SHEET_H}px;
    background: rgba(60, 45, 20, 0.18);
    clip-path: ${deckleClipPath};
    filter: blur(18px);
    z-index: 0;
  }
  .sheet { z-index: 1; }

  /* ── Grid (18 × 27 square cells) ── */
  .grid {
    width: 100%;
    aspect-ratio: ${GRID_COLS} / ${GRID_ROWS};
    display: grid;
    grid-template-columns: repeat(${GRID_COLS}, 1fr);
    grid-template-rows: repeat(${GRID_ROWS}, 1fr);
    gap: 5px;
    margin: 0 auto;
  }
  .cell {
    position: relative;
    overflow: hidden;
    background: #E8DFCF;
  }
  .cell img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .cell-empty { background: #EADFC8; }

  /* ── Footer: three columns, baseline-aligned ── */
  footer {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 80px;
    padding-top: 60px;
  }
  .meta-left,
  .meta-right {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 22px;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #1A1714;
    line-height: 1.6;
  }
  .meta-right { text-align: right; }
  .meta-right .imprint {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 26px;
    letter-spacing: 0;
    text-transform: none;
    color: #1A1714;
    margin-top: 4px;
  }
  .lockup {
    text-align: center;
  }
  .lockup .nest {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 52px;
    letter-spacing: 0.02em;
    color: #1A1714;
    line-height: 1;
  }
  .lockup .sub {
    margin-top: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 400;
    font-size: 18px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #1A1714;
  }
</style>
</head>
<body>
  <div class="shadow"></div>
  <div class="sheet">
    <div class="grid">
      ${cellHtml}
    </div>

    <footer>
      <div class="meta-left">
        486 Sites<br/>
        Brooklyn &amp; Manhattan<br/>
        2016 — 2021
      </div>
      <div class="lockup">
        <div class="nest">NEST</div>
        <div class="sub">Patio Beach</div>
      </div>
      <div class="meta-right">
        Earth Day 2026
        <div class="imprint">A Hotel release</div>
      </div>
    </footer>
  </div>
</body>
</html>`;

// ── 6. Render via puppeteer ──────────────────────────────────────────────
fs.mkdirSync(outDir, { recursive: true });
const tmpHtml = path.join(outDir, '.poster-hero.tmp.html');
fs.writeFileSync(tmpHtml, html);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0', timeout: 180_000 });

// Wait for fonts + image decode + a render frame
await page.evaluate(async () => {
  await document.fonts.ready;
  const imgs = [...document.images];
  await Promise.all(imgs.map(img => img.complete && img.naturalWidth > 0
    ? Promise.resolve()
    : new Promise(res => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
    })
  ));
  // additional decode pass to be safe
  await Promise.all(imgs.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  // two RAFs to settle
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
});

await page.screenshot({
  path: outPath,
  type: 'jpeg',
  quality: 95,
  clip: { x: 0, y: 0, width: W, height: H },
});

await browser.close();
fs.unlinkSync(tmpHtml);

const stat = fs.statSync(outPath);
console.log(`Wrote ${outPath} (${(stat.size / 1024).toFixed(1)} KB, ${W}×${H})`);
