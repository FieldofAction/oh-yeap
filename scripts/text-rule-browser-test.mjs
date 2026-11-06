/** Exercise the actual serialized DOM checker, independently of site content. */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import puppeteer from 'puppeteer';
import { compareWithBaseline, findTextRuleViolations, SMALL_TEXT_PX } from './text-rule-lib.mjs';

let browser;
before(async () => {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
});
after(async () => { await browser?.close(); });

async function inspect(html, setup) {
  const page = await browser.newPage();
  try {
    await page.setContent(`<style>body{font:16px Arial,sans-serif}</style>${html}`);
    if (setup) await page.evaluate(setup);
    return await page.evaluate(findTextRuleViolations, SMALL_TEXT_PX);
  } finally { await page.close(); }
}

test('runtime-generated nested arrow text is caught', async () => {
  const found = await inspect('<a href="/">Read <span></span></a>', () => {
    document.querySelector('span').textContent = '→';
  });
  assert.deepEqual(found.map(v => v.rule), ['link-arrow']);
});

test('repeated DOM paths retain their multiplicity', async () => {
  const found = await inspect('<nav><a href="/">One →</a><a href="/">Two →</a></nav>');
  assert.equal(found.length, 2);
  const entries = found.map(v => ({ page: 'fixture', ...v }));
  assert.equal(compareWithBaseline(entries, entries.slice(0, 1)).added.length, 1);
});

test('computed relative units and variables are checked at the inclusive threshold', async () => {
  const found = await inspect('<style>:root{font-size:16px;--small:.75rem}.label{font-size:var(--small);text-transform:uppercase}</style><span class="label">Research</span>');
  assert.deepEqual(found.map(v => v.rule), ['small-uppercase']);
});

test('hidden text, including opacity on ancestors, is not rendered evidence', async () => {
  const found = await inspect('<div style="opacity:0"><a href="/">Read →</a></div><a hidden href="/">More →</a>');
  assert.deepEqual(found, []);
});

test('code and genuine indices keep the mono exception; labels do not', async () => {
  const found = await inspect('<code>const x = 1</code><span data-mono style="font-family:monospace">01</span><label style="font-family:monospace">Name</label>');
  assert.deepEqual(found.map(v => v.rule), ['mono-label']);
  assert.equal(found[0].text, 'Name');
});

test('a small label directly above a heading is caught', async () => {
  const found = await inspect('<div style="font-size:12px">Research</div><h1>What changes?</h1>');
  assert.deepEqual(found.map(v => v.rule), ['eyebrow']);
});

test('ordinary functional labels, links and body copy remain valid', async () => {
  assert.deepEqual(await inspect('<h1>What changes?</h1><p>The argument.</p><label>Name <input></label><a href="/">Read</a>'), []);
});

// CSS text-transform can be inherited by a functional symbol or index.
test('uppercase without cased letters is not a typography violation', async () => {
  const found = await inspect('<span style="font-size:10px;text-transform:uppercase">● 01</span><a href="/" style="font-size:10px;text-transform:uppercase">→</a>');
  assert.deepEqual(found.map(v => v.rule), ['link-arrow']);
});
