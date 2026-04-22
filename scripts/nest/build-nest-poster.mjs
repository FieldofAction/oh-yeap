/*
 * Build the NEST index poster as a composite PNG/JPG from the Patio Beach archive.
 *
 * - Reads /instagram/patio-beach-archive.jsx (repo root)
 * - Extracts the primary image path from each of the 486 posts
 * - Lays them out in an 18×27 typology grid (= 486 cells, exact 2:3 ratio)
 * - Adds editorial typography: NEST header, subheader, bottom metadata stack, edition stamp
 * - Renders via puppeteer to public/images/nest/poster-hero.jpg (web hero)
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

// ── 1. Parse the archive: extract the first image path from each post ──────
const archiveSrc = fs.readFileSync(archivePath, 'utf8');
// Each post has shape: {n:NNN,c:"...",i:["media/posts/YYYYMM/HASH.jpg", ...], d:"..."}
// A handful of posts lead with a .mp4; for those we pick the next .jpg/.png in the array.
const IMG_RE = /\.(jpe?g|png)$/i;
const arrayMatches = [...archiveSrc.matchAll(/i:\[([^\]]+)\]/g)];
const allPaths = arrayMatches
  .map(m => {
    const items = [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
    return items.find(p => IMG_RE.test(p)) || null;
  })
  .filter(Boolean);

// Verify each file exists on disk; skip missing ones (shouldn't happen, but be defensive)
const verified = [];
for (const rel of allPaths) {
  const abs = path.join(mediaRoot, rel);
  if (fs.existsSync(abs)) verified.push({ rel, abs });
}

console.log(`Parsed ${allPaths.length} image paths from archive, verified ${verified.length} on disk.`);

if (verified.length < 486) {
  console.warn(`WARNING: expected 486, got ${verified.length}. Grid will be padded with empty cells if short.`);
}

// Take exactly 486 (or fewer, padded)
const GRID_COLS = 18;
const GRID_ROWS = 27;
const GRID_CELLS = GRID_COLS * GRID_ROWS;
const cells = verified.slice(0, GRID_CELLS);
while (cells.length < GRID_CELLS) cells.push(null); // pad

// ── 2. Build the HTML document ─────────────────────────────────────────────
// Output dimensions: 1800 × 2700 (exact 2:3 aspect — matches 24×36 poster)
const W = 1800;
const H = 2700;

// Convert abs paths to file:// URLs for puppeteer
const thumbUrls = cells.map(c => c ? 'file://' + c.abs : null);

const cellHtml = thumbUrls
  .map((u, i) => u
    ? `<div class="cell"><img src="${u}" alt="" loading="eager" decoding="sync"/></div>`
    : `<div class="cell cell-empty"></div>`)
  .join('');

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; }
  body {
    background: #F5EFE2;               /* warm paper */
    font-family: 'IBM Plex Mono', monospace;
    color: #1A1714;                     /* warm near-black */
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: 120px 130px 140px 130px;
    position: relative;
  }

  /* subtle paper vignette */
  body::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(120,100,70,0.06) 100%);
    pointer-events: none;
  }

  /* ── Header ── */
  header {
    text-align: center;
    margin-bottom: 56px;
  }
  .title {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 180px;
    letter-spacing: -0.02em;
    line-height: 0.9;
    color: #1A1714;
  }
  .subtitle {
    margin-top: 22px;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 400;
    font-size: 15px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #5C5247;
  }

  /* ── Grid ── */
  .grid {
    display: grid;
    grid-template-columns: repeat(${GRID_COLS}, 1fr);
    grid-template-rows: repeat(${GRID_ROWS}, 1fr);
    gap: 4px;
    margin-bottom: 48px;
    min-height: 0;                 /* allow grid to shrink inside body grid row */
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
    filter: saturate(0.92) contrast(1.02);
  }
  .cell-empty {
    background: #EADFC8;
  }

  /* ── Footer metadata ── */
  footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 48px;
    padding-top: 18px;
    border-top: 1px solid #1A1714;
  }
  .meta-left {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #1A1714;
    line-height: 1.7;
  }
  .meta-left .dim { color: #7A6F5F; }
  .meta-center {
    text-align: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #1A1714;
  }
  .edition {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.14em;
  }
  .edition .blank {
    display: inline-block;
    width: 64px;
    border-bottom: 1.5px solid #1A1714;
    height: 1em;
  }
  .meta-center .sig-line {
    margin-top: 18px;
    width: 180px;
    border-bottom: 1px solid #1A1714;
    margin-left: auto;
    margin-right: auto;
    height: 18px;
  }
  .meta-center .sig-label {
    font-size: 9px;
    letter-spacing: 0.3em;
    color: #7A6F5F;
    margin-top: 4px;
  }
  .meta-right {
    text-align: right;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #5C5247;
    line-height: 1.8;
  }
  .meta-right .hotel {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    letter-spacing: 0.08em;
    text-transform: none;
    color: #1A1714;
    font-weight: 500;
    font-style: italic;
    margin-top: 2px;
  }
</style>
</head>
<body>
  <header>
    <div class="title">NEST</div>
    <div class="subtitle">Patio Beach &nbsp;·&nbsp; Index &nbsp;·&nbsp; Edition 01</div>
  </header>

  <div class="grid">
    ${cellHtml}
  </div>

  <footer>
    <div class="meta-left">
      486 Sites<br/>
      Brooklyn &amp; Manhattan<br/>
      <span class="dim">2016 — 2021</span>
    </div>
    <div class="meta-center">
      <div class="edition"><span class="blank"></span>&nbsp;/&nbsp;100</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signed</div>
    </div>
    <div class="meta-right">
      Earth Day 2026<br/>
      <span class="hotel">A Hotel release</span>
    </div>
  </footer>
</body>
</html>`;

// ── 3. Render via puppeteer ────────────────────────────────────────────────
fs.mkdirSync(outDir, { recursive: true });
const tmpHtml = path.join(outDir, '.poster-hero.tmp.html');
fs.writeFileSync(tmpHtml, html);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0', timeout: 120_000 });

// Extra safety: wait for fonts + all images decoded
await page.evaluate(async () => {
  await document.fonts.ready;
  const imgs = [...document.images];
  await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
    img.addEventListener('load', res, { once: true });
    img.addEventListener('error', res, { once: true });
  })));
});

await page.screenshot({
  path: outPath,
  type: 'jpeg',
  quality: 92,
  clip: { x: 0, y: 0, width: W, height: H },
});

await browser.close();
fs.unlinkSync(tmpHtml);

const stat = fs.statSync(outPath);
console.log(`Wrote ${outPath} (${(stat.size / 1024).toFixed(1)} KB, ${W}×${H})`);
