/** The page-text rule (CLAUDE.md, "Text on the page"), as something a browser can check.
 * findTextRuleViolations runs inside the page (puppeteer serialises it), so it must not
 * close over anything from this module. The baseline helpers run in Node.
 */

export const SMALL_TEXT_PX = 12;
export const BASELINE_PATH = new URL('./fixtures/text-rule-baseline.json', import.meta.url);

/** @returns {{ rule: string, path: string, text: string }[]} */
export function findTextRuleViolations(smallTextPx) {
  const MONO_ALLOWED = 'code, pre, kbd, samp, input, textarea, [data-mono]';
  const ARROWS = /[←-⇿➔➜⟵-⟿]/;
  const found = [];
  const seen = new Set();
  const describe = el => {
    const parts = [];
    for (let node = el; node && node !== document.body && parts.length < 4; node = node.parentElement) {
      const cls = [...node.classList].slice(0, 2).join('.');
      parts.unshift(node.tagName.toLowerCase() + (cls ? '.' + cls : ''));
    }
    return parts.join(' > ');
  };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  const visible = el => {
    if (!el.getClientRects().length) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.opacity !== '0';
  };
  const report = (rule, el, text) => {
    const path = describe(el);
    const key = rule + '|' + path;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ rule, path, text: text.slice(0, 60) });
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('script, style, noscript, svg')) continue;
    const text = ownText(el);
    if (!text || !visible(el)) continue;
    const s = getComputedStyle(el);
    const size = parseFloat(s.fontSize);
    const small = size <= smallTextPx;
    const next = el.nextElementSibling;
    if (small && next && /^H[1-3]$/.test(next.tagName)) report('eyebrow', el, text);
    if (small && s.textTransform === 'uppercase') report('small-uppercase', el, text);
    if (/mono|courier|consolas|menlo/i.test(s.fontFamily.split(',')[0]) && !el.closest(MONO_ALLOWED)) report('mono-label', el, text);
    const control = el.closest('a, button');
    if (control && ARROWS.test(text)) report('link-arrow', el, text);
  }
  return found;
}

export const violationKey = v => `${v.page}|${v.rule}|${v.path}`;

/** Splits findings into what the baseline already tolerates, what is new, and what it lists but no longer exists. */
export function compareWithBaseline(found, baseline) {
  const allowed = new Set(baseline.map(violationKey));
  const present = new Set(found.map(violationKey));
  return {
    added: found.filter(v => !allowed.has(violationKey(v))),
    tolerated: found.filter(v => allowed.has(violationKey(v))),
    retired: baseline.filter(v => !present.has(violationKey(v))),
  };
}

export function formatViolation(v) {
  return `${v.page}  ${v.rule}  ${v.path}  “${v.text}”`;
}
