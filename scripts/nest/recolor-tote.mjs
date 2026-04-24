/*
 * Recolor the black NEST tote photos to French Navy (Stanley/Stella C727, ~#1F2A44)
 * while preserving the cream backdrop, the cream print, and the fabric's shadow/
 * highlight texture.
 *
 * Strategy: a duotone pixel remap inside puppeteer's canvas. For each pixel we
 * treat "dark + low-saturation" as bag fabric and lerp it onto a navy ramp
 * keyed off the original luminance; everything else is left alone. A soft band
 * between fabric and background blends to avoid a hard edge.
 *
 * Run from worktree root:  node scripts/nest/recolor-tote.mjs
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const worktreeRoot = path.resolve(__dirname, '..', '..');
const toteDir = path.join(worktreeRoot, 'public', 'images', 'nest');

// Per-image tuning. The flat-lay and detail shots sit on a clean cream sweep
// and the bag is the only dark region, so wide thresholds are safe. The
// in-situ is a golden-hour street scene — mid-gray crosswalk paint and
// sidewalk will pick up a blue tint if the ceiling is too high, so we clamp
// tighter and fade out faster.
const INPUTS = [
  { name: 'tote-front.jpg',         spreadMax: 40, lumCeil: 120, lumFade: 50 },
  { name: 'tote-back.jpg',          spreadMax: 40, lumCeil: 120, lumFade: 50 },
  { name: 'tote-detail-handle.jpg', spreadMax: 40, lumCeil: 120, lumFade: 50 },
  { name: 'tote-detail-label.jpg',  spreadMax: 40, lumCeil: 120, lumFade: 50 },
  { name: 'tote-insitu.jpg',        spreadMax: 22, lumCeil: 70,  lumFade: 20 },
];

// Build one HTML page that loads a given image, recolors pixels on a canvas,
// and returns a JPEG data URL.
const pageHtml = `<!doctype html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0">
<canvas id="c"></canvas>
<script>
window.recolor = async function(src, opts) {
  const { spreadMax, lumCeil, lumFade } = opts;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const c = document.getElementById('c');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgd = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgd.data;

  // French Navy anchor (roughly Stanley/Stella C727 / #1F2A44)
  const NR = 31, NG = 42, NB = 68;
  const lumFadeStart = lumCeil - lumFade;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const spread = maxC - minC;                 // low = achromatic
    const lum = 0.299*r + 0.587*g + 0.114*b;    // 0..255

    // Classify: is this a fabric pixel (black cotton)?
    //  - low chromaticity (close to gray)
    //  - reasonably dark
    // Use a soft weight so we don't get a hard edge against the cream.
    let wFabric = 0;
    if (spread < spreadMax && lum < lumCeil) {
      const wSpread = 1 - Math.min(spread / spreadMax, 1);
      const wLum    = 1 - Math.max((lum - lumFadeStart) / lumFade, 0);
      wFabric = wSpread * wLum;
    }

    if (wFabric <= 0.001) continue;

    // Duotone target: scale navy by original luminance so texture is preserved.
    // lum 0    -> very deep navy (~0,0,0 tinted blue)
    // lum 40   -> ~french navy (31,42,68)
    // lum 80   -> lighter navy highlight
    const k = lum / 42;                          // preserve local brightness
    const tR = Math.min(NR * k, 255);
    const tG = Math.min(NG * k, 255);
    const tB = Math.min(NB * k + lum * 0.15, 255); // gentle blue bias in highlights

    d[i]   = Math.round(r * (1 - wFabric) + tR * wFabric);
    d[i+1] = Math.round(g * (1 - wFabric) + tG * wFabric);
    d[i+2] = Math.round(b * (1 - wFabric) + tB * wFabric);
  }

  ctx.putImageData(imgd, 0, 0);
  return c.toDataURL('image/jpeg', 0.93);
};
</script>
</body></html>`;

const tmpHtml = path.join(toteDir, '.recolor-tote.tmp.html');
fs.writeFileSync(tmpHtml, pageHtml);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});
const page = await browser.newPage();
await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0' });

const onlyArg = process.argv[2];      // optional single-file filter
for (const input of INPUTS) {
  if (onlyArg && input.name !== onlyArg) continue;
  const abs = path.join(toteDir, input.name);
  if (!fs.existsSync(abs)) {
    console.warn(`skip ${input.name} — not found`);
    continue;
  }
  const bytes = fs.readFileSync(abs);
  const srcDataUrl = 'data:image/jpeg;base64,' + bytes.toString('base64');
  const opts = { spreadMax: input.spreadMax, lumCeil: input.lumCeil, lumFade: input.lumFade };
  const outDataUrl = await page.evaluate((s, o) => window.recolor(s, o), srcDataUrl, opts);
  const b64 = outDataUrl.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFileSync(abs, Buffer.from(b64, 'base64'));
  const kb = (fs.statSync(abs).size / 1024).toFixed(1);
  console.log(`recolored ${input.name} (${kb} KB)`);
}

await browser.close();
fs.unlinkSync(tmpHtml);
