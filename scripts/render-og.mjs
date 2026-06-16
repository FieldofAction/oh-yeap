/* Render public/og-card-motion.html to public/og-image.png at 1200x630.
   Seeks the background video to a fixed frame so the export is reproducible. */
import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'public', 'og-card-motion.html');
const out = path.join(root, 'public', 'og-image.png');
const FRAME_TIME = 2.0; // seconds into the loop

const browser = await puppeteer.launch({ headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.goto('file://' + src, { waitUntil: 'networkidle0' });
await page.evaluate(async (t) => {
  const v = document.querySelector('.card-video');
  try { await v.play(); } catch (e) {}
  v.currentTime = t;
  await new Promise(r => { v.onseeked = r; setTimeout(r, 1500); });
}, FRAME_TIME);
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: out, type: 'png', omitBackground: false, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('Wrote', out);
