/** Checks the built pages against the page-text rule in CLAUDE.md.
 * Run after `npm run build`. Fails on any finding not already in the baseline.
 * `--update-baseline` can only retire entries from an existing reviewed baseline.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { preview } from 'vite';
import puppeteer from 'puppeteer';
import { BASELINE_PATH, SMALL_TEXT_PX, compareWithBaseline, findTextRuleViolations, formatViolation, shrinkBaseline } from './text-rule-lib.mjs';

const update = process.argv.includes('--update-baseline');
const targets = [
  { name: 'home', path: '/', ready: '.ix-title' },
  { name: 'navigation', path: '/', ready: '.sb-toggle', click: '.sb-toggle', final: '.sb-open' },
  { name: 'writing', path: '/', ready: '.ix-wr-feat-card', click: '.ix-wr-feat-card', final: '.rd-title' },
  { name: 'workbench', path: '/#item/workbench', ready: '.cs-body' },
  { name: 'about', path: '/#about', ready: '.ab-h' },
  { name: 'colophon', path: '/#colophon', ready: '.co-h' },
  { name: 'relational-design', path: '/#relational-design', ready: '.ph-h' },
  { name: 'materials', path: '/#materials-in-relation', ready: '.mir h1' },
  { name: 'experiment-index', path: '/experiments/index.html', ready: '.x-row' },
  { name: 'living-brand', path: '/living-brand.html', ready: '.lb-main h1' },
  { name: 'living-brand-interpret', path: '/living-brand.html', ready: '.lb-stages', click: '.lb-stages button:nth-child(4)', final: '.lb-carry-rows' },
  { name: 'living-brand-investigate', path: '/living-brand.html', ready: '.lb-stages', click: '.lb-stages button:nth-child(3)', final: '.lb-grid' },
  { name: 'experiment-010', path: '/experiments/structural-afterimage.html', ready: '.x-prose' },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const scenarios = targets.flatMap(target => [390, 1200].flatMap(width => [false, true].map(light => ({
  ...target, width, light, name: `${target.name}-${width}-${light ? 'light' : 'dark'}`,
}))));
const found = [];
const errors = [];
const inspected = [];
let browser, server;
try {
  // Own the server and its port; never accidentally inspect a stale preview.
  server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } });
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const target of scenarios) {
    const { name, width, light } = target;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    try {
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.evaluateOnNewDocument(light => localStorage.setItem('foa-work-light', light ? '1' : '0'), light);
      const response = await page.goto(`${origin}${target.path}`, { waitUntil: 'networkidle2', timeout: 45000 });
      if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status()}`);
      await page.waitForSelector(target.ready, { timeout: 15000 });
      if (target.click) { await page.click(target.click); await page.waitForSelector(target.final, { timeout: 15000 }); }
      await page.evaluate(() => document.fonts.ready);
      await sleep(400);
      // Visit the content naturally so scroll-revealed text participates in the audit.
      // Do not force visibility or change page styles to manufacture a passing result.
      for (const selector of ['html', '.rd-overlay', '.cs-overlay', '.sb-open']) {
        const geometry = await page.evaluate(selector => {
          const el = document.querySelector(selector);
          return el && { height: el.clientHeight, total: el.scrollHeight };
        }, selector);
        if (!geometry || geometry.total <= geometry.height) continue;
        const step = Math.max(200, Math.floor(geometry.height * .8));
        if (geometry.total / step > 200) throw new Error(`Scroll audit too long: ${selector}`);
        for (let top = 0; top < geometry.total; top += step) {
          await page.evaluate(({ selector, top }) => document.querySelector(selector).scrollTo(0, top), { selector, top });
          await sleep(60);
        }
        await page.evaluate(selector => document.querySelector(selector).scrollTo(0, 0), selector);
      }
      await sleep(400);
      if (pageErrors.length) throw new Error(`Runtime errors: ${pageErrors.join('; ')}`);
      const violations = await page.evaluate(findTextRuleViolations, SMALL_TEXT_PX);
      for (const v of violations) found.push({ page: name, ...v });
      inspected.push(name);
      console.log(`${name}: ${violations.length} finding(s)`);
    } catch (error) {
      errors.push(`${name}: ${error.message}`);
    } finally { await context.close(); }
  }
} catch (error) {
  errors.push(`suite: ${error.message}`);
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
  mkdirSync('qa-text-rule', { recursive: true });
  writeFileSync('qa-text-rule/results.json', JSON.stringify({ inspected, found, errors }, null, 2) + '\n');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (update) {
  const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : null;
  const smaller = shrinkBaseline(found, baseline);
  writeFileSync(BASELINE_PATH, JSON.stringify(smaller, null, 2) + '\n');
  console.log(`Baseline retired ${baseline.length - smaller.length} finding(s). No new entries accepted.`);
  process.exit(0);
}
if (!existsSync(BASELINE_PATH)) {
  console.error(`No reviewed baseline. ${found.length} finding(s):\n${found.map(formatViolation).join('\n')}\nReview qa-text-rule/results.json, remove decorative text and correct false positives before committing an initial baseline. text:baseline cannot bootstrap or grow it.`);
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
