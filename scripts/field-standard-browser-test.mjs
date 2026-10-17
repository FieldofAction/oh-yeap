/** Full production-build review; screenshots contain no credentials or font files. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const out = 'qa-field-standard';
mkdirSync(out, { recursive: true });
const report = { commit: process.env.GITHUB_SHA, pages: [], failures: [], interactions: [], production: null };
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const targets = [
  { name: 'home-threshold', path: '/', ready: '.ix-title', reading: '.content-section' },
  { name: 'home-daylight', path: '/', ready: '.ix-title', reading: '.content-section', light: true },
  { name: 'writing', path: '/', ready: '.ix-wr-feat-card', click: '.ix-wr-feat-card', final: '.rd-title', reading: '.rd-body-text' },
  { name: 'workbench', path: '/#item/workbench', ready: '.cs-body', reading: '.cs-body' },
  { name: 'about', path: '/#about', ready: '.ab-h', reading: '.ab-body' },
  { name: 'colophon', path: '/#colophon', ready: '.co-h', reading: '.co-section' },
  { name: 'relational-design', path: '/#relational-design', ready: '.ph-h', reading: '.ph-body-heading' },
  { name: 'materials', path: '/#materials-in-relation', ready: '.mir h1', reading: '.mir-lead' },
  { name: 'experiment-index', path: '/experiments/index.html', ready: '.x-row', reading: '.x-rows' },
  { name: 'experiment-010', path: '/experiments/structural-afterimage.html', ready: '.x-prose', reading: '.x-band' },
];
const selectors = '.content-section-h,.ix-title,.ix-sub,.ix-tag,.ix-wr-title,.ix-wr-feat-title,.ix-wr-feat-sub,.rd-title,.rd-body-text,.rd-section-heading,.cs-body,.cs-cap,.ab-h,.ab-body,.ab-sl,.co-h,.co-item-v,.ph-h,.ph-body-heading,.ph-body-text,.mir h1,.mir-lead,.x-title,.x-deck,.x-band-label,.x-prose,.x-sec h3,.x-fact,.x-tag,.sb-brand-logo,.topbar';
async function fonts(page) {
  const names = ['Hanken Grotesk', 'Schibsted Grotesk', 'Space Mono'];
  // A failed optional local() face can reject FontFaceSet.load even when the
  // downloaded face renders correctly. Verify the actual painted glyphs instead.
  await page.evaluate(async names => {
    for (const [i, name] of names.entries()) {
      const el = document.createElement('span');
      el.id = `foa-font-probe-${i}`;
      el.textContent = 'Field of Action 012345';
      Object.assign(el.style, { position: 'fixed', left: '0', top: '0', opacity: '0', pointerEvents: 'none', fontFamily: `"${name}"`, fontSize: '18px', fontWeight: '400' });
      document.body.appendChild(el);
      try { await document.fonts.load(`400 18px "${name}"`, el.textContent); } catch {}
    }
    await document.fonts.ready;
  }, names);
  const client = await page.createCDPSession();
  const loaded = [];
  try {
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    const { root } = await client.send('DOM.getDocument');
    for (const [i, name] of names.entries()) {
      const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#foa-font-probe-${i}` });
      const { fonts: painted } = await client.send('CSS.getPlatformFontsForNode', { nodeId });
      const normalize = v => v.toLowerCase().replace(/[^a-z]/g, '');
      assert.ok(painted.some(f => f.isCustomFont && f.glyphCount > 0 && normalize(f.familyName).includes(normalize(name))), `Expected ${name}, actual painted fonts: ${JSON.stringify(painted)}`);
      loaded.push({ family: name, painted });
    }
  } finally {
    await page.evaluate(() => document.querySelectorAll('[id^="foa-font-probe-"]').forEach(el => el.remove()));
    await client.detach();
  }
  return loaded;
}
async function inspect(page) {
  return page.evaluate(selectors => {
    const properties = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'opacity', 'fontFamily'];
    const nodes = [...document.querySelectorAll(selectors)];
    const snapshot = () => nodes.map(el => {
      const s = getComputedStyle(el);
      return { text: el.textContent, tag: el.className, styles: properties.map(k => s[k]) };
    });
    const after = snapshot();
    const sizes = nodes.slice(0, 16).map(el => ({ role: el.className, size: getComputedStyle(el).fontSize, family: getComputedStyle(el).fontFamily }));
    const afterWidth = document.documentElement.scrollWidth;
    const overflows = nodes.filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2).map(el => ({ role: el.className, width: el.clientWidth, content: el.scrollWidth }));
    const removed = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = [...sheet.cssRules]; } catch { continue; }
      const start = rules.findIndex(r => r.style?.getPropertyValue('--foa-type-page'));
      if (start < 0) continue;
      const tail = rules.slice(start).map(r => r.cssText);
      for (let i = rules.length - 1; i >= start; i--) sheet.deleteRule(i);
      removed.push({ sheet, start, tail });
    }
    if (!removed.length) throw new Error('Shared Field Standard stylesheet is missing from the built page.');
    const before = snapshot();
    const beforeWidth = document.documentElement.scrollWidth;
    const baselineOverflows = nodes.filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2).map(el => el.className);
    for (const { sheet, start, tail } of removed) tail.forEach((r, i) => sheet.insertRule(r, start + i));
    const differences = after.map((v, i) => JSON.stringify(v) === JSON.stringify(before[i]) ? null : { after: v, before: before[i] }).filter(Boolean);
    const work = document.querySelector('.ix-title'), category = document.querySelector('.content-section-h');
    const hierarchy = !work || !category || parseFloat(getComputedStyle(work).fontSize) > parseFloat(getComputedStyle(category).fontSize);
    return { differences, sizes, hierarchy, afterWidth, beforeWidth, viewport: innerWidth, overflows, baselineOverflows };
  }, selectors);
}
try {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch('http://127.0.0.1:4173'); if (r.ok) break; } catch {}
    if (i === 59) throw new Error('Preview server did not start.');
    await sleep(500);
  }
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const target of targets) {
    const widths = target.name.startsWith('home-') || target.name === 'experiment-010' ? [320, 390, 768, 1200] : [390, 1200];
    for (const width of widths) {
      const name = `${target.name}-${width}`;
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      try {
        await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await page.evaluateOnNewDocument(light => { localStorage.setItem('foa-work-light', light ? '1' : '0'); }, Boolean(target.light));
        await page.goto(`http://127.0.0.1:4173${target.path}`, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.waitForSelector(target.ready, { timeout: 15000 });
        if (target.click) { await page.click(target.click); await page.waitForSelector(target.final, { timeout: 15000 }); }
        const loaded = await fonts(page);
        await sleep(400);
        const data = await inspect(page);
        assert.equal(data.differences.length, 0, `Protected colors/fonts/content changed: ${JSON.stringify(data.differences.slice(0, 2))}`);
        assert.ok(data.hierarchy, 'Category overwhelms the work title.');
        assert.ok(data.afterWidth <= Math.max(data.viewport, data.beforeWidth) + 2, `New page overflow: ${data.afterWidth} vs ${data.beforeWidth}`);
        const newOverflows = data.overflows.filter(v => !data.baselineOverflows.includes(v.role));
        assert.equal(newOverflows.length, 0, `New content clipping: ${JSON.stringify(newOverflows)}`);
        assert.equal(pageErrors.length, 0, `Runtime errors: ${pageErrors.join('; ')}`);
        if (width === 390 || width === 1200) {
          await page.screenshot({ path: `${out}/${name}-top.png` });
          if (await page.$(target.reading)) {
            await page.$eval(target.reading, el => el.scrollIntoView({ block: 'start' }));
            await sleep(500);
            await page.screenshot({ path: `${out}/${name}-reading.png` });
          }
        }
        if (target.name.startsWith('home-') || target.name === 'experiment-010') {
          await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
          const zoom = await inspect(page);
          assert.equal(zoom.differences.length, 0, 'Colors/content change under large text.');
          assert.ok(zoom.afterWidth <= Math.max(zoom.viewport, zoom.beforeWidth) + 2, `New overflow with doubled text: ${zoom.afterWidth}`);
          data.largeText = { afterWidth: zoom.afterWidth, beforeWidth: zoom.beforeWidth, overflows: zoom.overflows };
        }
        report.pages.push({ name, fonts: loaded, ...data });
        console.log(`PASS ${name}: actual fonts loaded; protected properties unchanged; hierarchy and reflow checked`);
      } catch (error) {
        report.failures.push({ name, error: error.message });
        console.error(`FAIL ${name}: ${error.stack}`);
        await page.screenshot({ path: `${out}/${name}-failure.png` }).catch(() => {});
      } finally { await context.close(); }
    }
  }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });
  await page.click('.sb-toggle');
  await page.waitForSelector('.sb-open');
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => document.querySelector('.sb-open').contains(document.activeElement)), 'Menu focus left its drawer.');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.sb-open'));
  assert.ok(await page.evaluate(() => document.activeElement.classList.contains('sb-toggle')), 'Menu focus did not return.');
  report.interactions.push('Mobile menu opens, traps keyboard focus, closes on Escape and restores focus.');
  // Read-only production smoke test after the authorized merge, using the public URL.
  if (process.env.GITHUB_REF === 'refs/heads/main') {
    let found = false;
    for (let i = 0; i < 24; i++) {
      await page.goto('https://fieldofaction.org', { waitUntil: 'networkidle2', timeout: 45000 });
      found = await page.evaluate(() => !!getComputedStyle(document.documentElement).getPropertyValue('--foa-type-page'));
      if (found) break;
      await sleep(5000);
    }
    assert.ok(found, 'Production has not served the typography layer yet.');
    const loaded = await fonts(page);
    const home = await inspect(page);
    await page.screenshot({ path: `${out}/production-home.png` });
    await page.goto('https://fieldofaction.org/experiments/structural-afterimage', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#foa-field-standard');
    const experiment = await inspect(page);
    report.production = { url: 'https://fieldofaction.org', fonts: loaded, home, experiment };
    await page.screenshot({ path: `${out}/production-experiment.png` });
    console.log('PASS production: homepage and experiment serve Field Standard.');
  }
} catch (error) {
  report.failures.push({ name: 'suite', error: error.stack });
  console.error(error.stack);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ pages: report.pages.length, failures: report.failures, interactions: report.interactions, production: Boolean(report.production) }));
if (report.failures.length) process.exitCode = 1;
