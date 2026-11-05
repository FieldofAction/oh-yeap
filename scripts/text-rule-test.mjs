/** Checks the built pages against the page-text rule in CLAUDE.md.
 * Run after `npm run build`. Fails on any finding not already in the baseline.
 * `--update-baseline` rewrites the baseline from what is found now; it should only ever shrink.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import { BASELINE_PATH, SMALL_TEXT_PX, compareWithBaseline, findTextRuleViolations, formatViolation } from './text-rule-lib.mjs';

const update = process.argv.includes('--update-baseline');
const targets = [
  { name: 'home', path: '/', ready: '.ix-title' },
  { name: 'writing', path: '/', ready: '.ix-wr-feat-card', click: '.ix-wr-feat-card', final: '.rd-title' },
  { name: 'workbench', path: '/#item/workbench', ready: '.cs-body' },
  { name: 'about', path: '/#about', ready: '.ab-h' },
  { name: 'colophon', path: '/#colophon', ready: '.co-h' },
  { name: 'relational-design', path: '/#relational-design', ready: '.ph-h' },
  { name: 'materials', path: '/#materials-in-relation', ready: '.mir h1' },
  { name: 'experiment-index', path: '/experiments/index.html', ready: '.x-row' },
  { name: 'experiment-010', path: '/experiments/structural-afterimage.html', ready: '.x-prose' },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174'], { stdio: 'inherit' });
const found = [];
const errors = [];
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch('http://127.0.0.1:4174'); if (r.ok) break; } catch {}
    if (i === 59) throw new Error('Preview server did not start.');
    await sleep(500);
  }
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const target of targets) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    try {
      await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(`http://127.0.0.1:4174${target.path}`, { waitUntil: 'networkidle2', timeout: 45000 });
      await page.waitForSelector(target.ready, { timeout: 15000 });
      if (target.click) { await page.click(target.click); await page.waitForSelector(target.final, { timeout: 15000 }); }
      await sleep(400);
      const violations = await page.evaluate(findTextRuleViolations, SMALL_TEXT_PX);
      for (const v of violations) found.push({ page: target.name, ...v });
      console.log(`${target.name}: ${violations.length} finding(s)`);
    } catch (error) {
      errors.push(`${target.name}: ${error.message}`);
    } finally { await context.close(); }
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (update) {
  mkdirSync(new URL('./', BASELINE_PATH), { recursive: true });
  writeFileSync(BASELINE_PATH, JSON.stringify(found, null, 2) + '\n');
  console.log(`Baseline written with ${found.length} tolerated finding(s). Commit scripts/fixtures/text-rule-baseline.json.`);
  process.exit(0);
}
if (!existsSync(BASELINE_PATH)) {
  console.error(`No baseline yet. ${found.length} finding(s):\n${found.map(formatViolation).join('\n')}\nRun \`npm run text:baseline\` and commit the file to accept these as the starting point.`);
  process.exit(1);
}
const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const { added, tolerated, retired } = compareWithBaseline(found, baseline);
if (retired.length) console.log(`${retired.length} baseline entr${retired.length === 1 ? 'y' : 'ies'} no longer found; run \`npm run text:baseline\` to shrink the file:\n${retired.map(formatViolation).join('\n')}`);
if (added.length) {
  console.error(`FAIL: ${added.length} new finding(s) under the page-text rule:\n${added.map(formatViolation).join('\n')}\nRemove the text (CLAUDE.md, "Text on the page"); the baseline is not for new entries.`);
  process.exit(1);
}
console.log(`PASS: no new findings (${tolerated.length} tolerated from baseline).`);
