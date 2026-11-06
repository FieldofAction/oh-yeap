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
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.visibility === 'hidden' || s.visibility === 'collapse' || s.opacity === '0') return false;
    }
    return true;
  };
  const report = (rule, el, text) => {
    const path = describe(el);
    // Keep each occurrence: repeated cards/links often share the same class path.
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
  const remaining = new Map();
  for (const entry of baseline) {
    const key = violationKey(entry);
    if (!remaining.has(key)) remaining.set(key, []);
    remaining.get(key).push(entry);
  }
  const added = [], tolerated = [];
  for (const entry of found) {
    const matches = remaining.get(violationKey(entry));
    if (matches?.length) {
      matches.pop();
      tolerated.push(entry);
    } else added.push(entry);
  }
  return { added, tolerated, retired: [...remaining.values()].flat() };
}

/** Updating is retirement only. The initial baseline requires a reviewed audit. */
export function shrinkBaseline(found, baseline) {
  if (!Array.isArray(baseline)) throw new Error('No reviewed baseline. Review the audit before creating one.');
  const { added } = compareWithBaseline(found, baseline);
  if (added.length) throw new Error(`Cannot accept ${added.length} new finding(s) into the baseline. Remove the violations first.`);
  const remaining = new Map();
  for (const entry of found) {
    const key = violationKey(entry);
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  return baseline.filter(entry => {
    const key = violationKey(entry), count = remaining.get(key) || 0;
    if (!count) return false;
    remaining.set(key, count - 1);
    return true;
  });
}

export function formatViolation(v) {
  return `${v.page}  ${v.rule}  ${v.path}  “${v.text}”`;
}
