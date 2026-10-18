import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { FIELD_STANDARD_CSS, FIELD_STANDARD_STYLE_ID, withFieldStandard } from './field-standard-lib.mjs';

const css = FIELD_STANDARD_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const declarations = [...css.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)(?=[;}])/gm)]
  .map(([, property, value]) => ({ property, value: value.trim() }));
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const allowed = new Set([
  'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform',
  'overflow-wrap', 'white-space', 'min-width', 'max-width',
  'margin-top', 'margin-bottom', 'padding', 'padding-top', 'padding-bottom',
  'gap', 'grid-template-columns', 'grid-column', 'flex-wrap',
]);

test('the stylesheet contains substantive, parsed role mappings', () => {
  assert.ok(declarations.length > 100);
  for (const selector of ['.ix-title', '.rd-body-text', '.cs-body', '.ab-body', '.ph-body-text', '.mir h1', '.x-prose']) {
    assert.ok(css.includes(selector), `Missing ${selector}`);
  }
});

test('only typography and bounded layout properties may be added', () => {
  for (const { property } of declarations) {
    assert.ok(property.startsWith('--foa-') || allowed.has(property), `Out-of-scope property: ${property}`);
  }
});

test('existing fonts, colors, motion and surfaces cannot be redeclared', () => {
  assert.doesNotMatch(css, /(?:^|[;{])\s*(?:color|background[\w-]*|opacity|font-family|font|border[\w-]*|filter|box-shadow|animation[\w-]*|transition[\w-]*)\s*:/m);
  assert.doesNotMatch(css, /(?:^|[;{])\s*--(?:bg|fg|fm|ff|bd|sf|sfh|cbg|ch|ac1|ac2|sans|display|mono)\s*:/m);
  assert.doesNotMatch(css, /!important|@font-face|url\s*\(/i);
});

test('fluid sizes retain relative units and respect the root font preference', () => {
  for (const { property, value } of declarations) {
    if (property === 'font-size' || property.startsWith('--foa-type-')) assert.doesNotMatch(value, /\dpx\b/);
  }
  assert.doesNotMatch(css, /(?:^|\})\s*(?:html|body|h1|p|\*)\s*\{/m);
});

test('all referenced typography variables are declared', () => {
  const defined = new Set(declarations.filter(d => d.property.startsWith('--foa-')).map(d => d.property));
  for (const [, name] of css.matchAll(/var\((--foa-[\w-]+)\)/g)) assert.ok(defined.has(name), `Undefined ${name}`);
});

test('typography is imported after the public app and its component styles', () => {
  const main = read('src/main.jsx');
  assert.ok(main.indexOf("import './styles/field-standard.css'") > main.indexOf("import PublicApp"));
});

test('the builder styles both the index and each experiment', () => {
  const build = read('scripts/experiments-build.mjs');
  assert.ok(build.includes('withFieldStandard(renderIndexPage(published))'));
  assert.ok(build.includes('withFieldStandard(renderEntryPage(entry, byId))'));
});

test('experiment injection uses exactly the same CSS as the public app', () => {
  const html = withFieldStandard('<html><head><title>Test</title></head><body>Original</body></html>');
  assert.ok(html.includes(`<style id="${FIELD_STANDARD_STYLE_ID}">\n${FIELD_STANDARD_CSS}\n</style>`));
});

test('content, existing styles, metadata and links survive injection byte-for-byte', () => {
  const original = '<!doctype html><html><head><style>:root{--bg:#0C0D10}</style><link rel="canonical" href="/experiments/example"></head><body><h1>Original title</h1><p>Original research.</p></body></html>';
  const styled = withFieldStandard(original);
  const restored = styled.replace(`<style id="${FIELD_STANDARD_STYLE_ID}">\n${FIELD_STANDARD_CSS}\n</style>\n`, '');
  assert.equal(restored, original);
});

test('injection is idempotent', () => {
  const once = withFieldStandard('<head></head><body>Unchanged</body>');
  assert.equal(withFieldStandard(once), once);
});

test('invalid inputs fail explicitly rather than emitting partial pages', () => {
  assert.throws(() => withFieldStandard(null), TypeError);
  assert.throws(() => withFieldStandard('<body>No head</body>'), /without/);
});

test('tag layout is content-aware rather than relying on a fixed field position', () => {
  assert.ok(css.includes('.x-fact:has(.x-tags)'));
  assert.doesNotMatch(css, /\.x-fact:nth-child/);
  assert.ok(css.includes('minmax(0, 1fr)'));
});
