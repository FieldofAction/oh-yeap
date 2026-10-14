import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { preview } from 'vite';
import puppeteer from 'puppeteer';

// Run against a production build. Flags describe the intended branch surface:
// node scripts/navigation-test.mjs [--materials] [--simplified] [--studio]
// PUPPETEER_EXECUTABLE_PATH may select an existing Chrome installation.
const flags = new Set(process.argv.slice(2));
const materials = flags.has('--materials');
const simplified = flags.has('--simplified');
const studio = flags.has('--studio');
const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
const base = `http://127.0.0.1:${server.httpServer.address().port}/`;
const browser = await puppeteer.launch({
  headless: true,
  ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
  args: process.getuid?.() === 0 ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
});
const errors = [];
const pause = () => new Promise(resolve => setTimeout(resolve, 300));
const page = await browser.newPage();
page.setDefaultTimeout(8000);
page.on('pageerror', error => errors.push(error.message));
await page.setRequestInterception(true);
page.on('request', request => {
  // Navigation checks are local and should not depend on fonts, media hosts or APIs.
  if (/^https?:/.test(request.url()) && !request.url().startsWith(base)) request.abort();
  else request.continue();
});
const hash = () => new URL(page.url()).hash;
const waitHash = async expected => {
  await page.waitForFunction(value => location.hash === value, {}, expected);
  await pause();
};
const openMenu = async () => {
  await page.click('.sb-toggle');
  await page.waitForSelector('.sb-open');
  await pause();
};
const clickNav = async text => {
  await page.evaluate(label => [...document.querySelectorAll('.sb .sb-link')]
    .find(el => el.textContent.replace(/^[·\s]+/, "").trim() === label).click(), text);
};
const assertClosed = async () => {
  assert.equal(await page.$eval('.sb', el => el.inert), true);
  assert.equal(await page.$eval('.sb-toggle', el => el.getAttribute('aria-expanded')), 'false');
  assert.equal(await page.$('.sb-backdrop'), null);
};

try {
  for (const width of [1280, 390, 320]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(`${base}#relational-design`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cn-subnav');
    await assertClosed();
    await openMenu();
    assert.equal(await page.$eval('.sb-toggle', el => el.getAttribute('aria-expanded')), 'true');
    assert.equal(await page.$eval('.sb', el => el.getAttribute('aria-modal')), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Close menu');
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    assert.equal(await page.evaluate(() => document.activeElement === [...document.querySelectorAll('.sb a[href], .sb button')].at(-1)), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Close menu');
    await page.keyboard.press('Escape');
    await assertClosed();
    assert.equal(await page.evaluate(() => document.activeElement.matches('.sb-toggle')), true);
    await openMenu();
    const labels = await page.$$eval('.sb-tier .sb-link', els => els.map(el => el.textContent.replace(/^[·\s]+/, "").trim().replace(/\s*↗$/, '')));
    if (simplified && !studio) {
      assert.deepEqual(labels, ['Practice', 'Writing', 'Relational Design', ...(materials ? ['Materials in Relation'] : []), 'About', 'Substack', 'LinkedIn']);
      assert.equal(await page.$eval('.ft-notes a[href="https://studio.fieldofaction.org"]', el => el.textContent.includes('Workshop')), true);
      assert.equal(await page.$('.ft-notes a[href="#hotel/nest"]') !== null, true);
    }
    assert.equal(labels.filter(label => label === 'Materials in Relation').length, materials ? 1 : 0);
    if (materials) {
      const parent = '.sb a[href="#relational-design"]';
      const child = '.sb a[href="#materials-in-relation"]';
      assert.equal(await page.$eval(parent, el => el.getAttribute('aria-current')), 'page');
      assert.equal(await page.$eval(child, el => el.getAttribute('aria-current')), null);
      assert.equal(await page.$eval(child, el => el.closest('ul').parentElement.querySelector(':scope > a').textContent), 'Relational Design');
      assert.equal(await page.$eval(child, el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }))), true);
      await page.focus(parent); await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#materials-in-relation');
      await page.keyboard.press('Enter');
      await waitHash('#materials-in-relation'); await page.waitForSelector('.mir-page');
      await assertClosed();
      assert.equal(await page.title(), 'Materials in Relation — Field of Action');
      assert.equal(await page.$eval('h1', el => el.textContent), 'Materials in Relation');
      assert.equal(await page.$eval('.mir-page', el => el.scrollWidth <= el.clientWidth + 1), true);
      await openMenu();
      assert.equal(await page.$eval(parent, el => el.classList.contains('on')), true);
      assert.equal(await page.$eval(parent, el => el.getAttribute('aria-current')), null);
      assert.equal(await page.$eval(child, el => el.getAttribute('aria-current')), 'page');
      assert.equal(await page.$$eval('.sb [aria-current="page"]', els => els.length), 1);
      const before = await page.evaluate(() => history.length);
      await clickNav('Materials in Relation'); await pause(); await assertClosed();
      assert.equal(await page.evaluate(() => history.length), before);
      await page.click('.mir-breadcrumb a'); await waitHash('#relational-design');
      assert.equal(await page.$('.mir-page'), null);
      await page.goBack(); await waitHash('#materials-in-relation'); await page.waitForSelector('.mir-page');
      await page.goForward(); await waitHash('#relational-design');
      await page.click('.cn-instrument a'); await waitHash('#materials-in-relation');
      await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('.mir-page');
      await page.goto(`${base}#/materials-in-relation`, { waitUntil: 'networkidle0' }); await page.waitForSelector('.mir-page');
      if (process.env.NAV_SCREENSHOT_DIR) {
        await mkdir(process.env.NAV_SCREENSHOT_DIR, { recursive: true });
        await openMenu();
        await page.screenshot({ path: path.join(process.env.NAV_SCREENSHOT_DIR, `${studio ? 'studio' : 'public'}-${width}.png`) });
        await page.keyboard.press('Escape');
      }
    } else {
      await clickNav('About'); await waitHash('#about'); await assertClosed();
    }
    // Back must cancel an in-flight 200ms click and retain the forward entry.
    await page.goto(`${base}#relational-design`, { waitUntil: 'networkidle0' });
    await openMenu(); await clickNav('About'); await waitHash('#about');
    await openMenu();
    await page.evaluate(() => {
      [...document.querySelectorAll('.sb .sb-link')].find(el => el.textContent.replace(/^[·\s]+/, "").trim() === 'Practice').click();
      history.back();
    });
    await waitHash('#relational-design'); await page.waitForSelector('.cn-subnav');
    await page.goForward(); await waitHash('#about');
    // Manual hashes also cancel delayed menu navigation.
    await openMenu();
    await page.evaluate(() => {
      [...document.querySelectorAll('.sb .sb-link')].find(el => el.textContent.replace(/^[·\s]+/, "").trim() === 'Practice').click();
      location.hash = '#relational-design';
    });
    await waitHash('#relational-design'); await page.waitForSelector('.cn-subnav');
    await openMenu();
    await page.mouse.click(width - 10, 400); await assertClosed();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    console.log(`PASS ${studio ? 'Studio' : 'Public'} ${width}px navigation, drawer, keyboard and history`);
  }
  if (!studio) {
    await page.goto(`${base}#studio`, { waitUntil: 'networkidle0' });
    assert.equal(await page.$('.sb-gate-overlay'), null);
    assert.equal(await page.$('.mir-page'), null);
    if (!materials) {
      await page.goto(`${base}#materials-in-relation`, { waitUntil: 'networkidle0' });
      assert.equal(await page.$('.mir-page'), null);
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS no page runtime errors');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
