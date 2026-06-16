/* Burn the og_card_layout vector overlay onto card-motion.mp4 to produce a
   shareable MP4 (the moving card, text included) for messaging.
   Requires ffmpeg-static: npm i -D ffmpeg-static
   Output: public/images/foa/card-share.mp4 (2400x1260, H.264). */
import puppeteer from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const layout = path.join(root, 'public', 'images', 'foa', 'og_card_layout.svg');
const video = path.join(root, 'public', 'images', 'foa', 'card-motion.mp4');
const overlay = path.join(root, 'public', 'images', 'foa', '_overlay.png');
const out = path.join(root, 'public', 'images', 'foa', 'card-share.mp4');

// 1. Rasterize the vector layout to a transparent 2400x1260 PNG.
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.goto('file://' + layout, { waitUntil: 'networkidle0' });
await page.screenshot({ path: overlay, omitBackground: true, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

// 2. Cover-crop the video to the card ratio and overlay the layout.
execFileSync(ffmpegPath, [
  '-y',
  '-i', video,
  '-i', overlay,
  '-filter_complex',
  '[0:v]scale=2400:1260:force_original_aspect_ratio=increase,crop=2400:1260[bg];[bg][1:v]overlay=0:0,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', '-an',
  out,
], { stdio: 'inherit' });

console.log('Wrote', out);
