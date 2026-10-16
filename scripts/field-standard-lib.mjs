/** Shared Field Standard stylesheet for static experiment pages.
 * React imports the same CSS file. No second scale and no generated CSS to edit.
 */
import { readFileSync } from 'node:fs';

export const FIELD_STANDARD_CSS = readFileSync(
  new URL('../src/styles/field-standard.css', import.meta.url), 'utf8'
);
export const FIELD_STANDARD_STYLE_ID = 'foa-field-standard';

if (/<\/style\s*>/i.test(FIELD_STANDARD_CSS)) {
  throw new Error('Field Standard CSS must not contain a closing style tag.');
}

export function withFieldStandard(html) {
  if (typeof html !== 'string') throw new TypeError('Expected an HTML string.');
  if (html.includes(`id="${FIELD_STANDARD_STYLE_ID}"`)) return html;
  if (!html.includes('</head>')) throw new Error('Cannot style an HTML page without </head>.');
  return html.replace('</head>', `<style id="${FIELD_STANDARD_STYLE_ID}">\n${FIELD_STANDARD_CSS}\n</style>\n</head>`);
}
