#!/usr/bin/env node
/**
 * Experiments — HTML rendering.
 *
 * Two page kinds, both generated: the index (newest first) and one page per
 * entry. The entry layout is the reusable template — section order and the
 * observed/interpretation split come from SECTIONS in experiments-lib.mjs, not
 * from the order in which a file happens to be written.
 *
 * Type, colour and spacing follow the site's Threshold theme
 * (src/data/themes.js) and font stack (src/styles/main.css) so a generated page
 * reads as part of fieldofaction.org rather than a bolt-on.
 */
import { GROUPS, SECTIONS, SECTION_BASE, SITE_ORIGIN, escapeHtml, renderBlocks, renderInline } from './experiments-lib.mjs';

const SECTION_TITLE = 'Experiments';
const SECTION_DECK = 'Daily material experiments — recipe, process, environment, and what was actually observed.';
const SECTION_SUMMARY = 'Material-first experiment abstracts from Field of Action: what was mixed, how it was run, what was observed, and how much confidence the record carries.';
const AUTHOR = 'Alfred (Daniel) Dickson II';
const FONTS = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&family=Schibsted+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-09-14` → `14 Sep 2026`, without touching the local timezone. */
export function humanDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const timeTag = (iso, cls = '') =>
  `<time${cls ? ` class="${cls}"` : ''} datetime="${escapeHtml(iso)}">${escapeHtml(humanDate(iso))}</time>`;

// ── Shared stylesheet ──────────────────────────────────────────────────────
const CSS = `
:root{
  --bg:#0C0D10; --fg:#E8EAF0; --fm:#868B94; --ff:#565A62;
  --bd:#1C1E24; --sf:#12131A; --cbg:#101118;
  --sans:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
  --display:'Schibsted Grotesk','Hanken Grotesk',system-ui,sans-serif;
  --mono:'Space Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  background:var(--bg); color:var(--fg); font-family:var(--sans);
  font-size:15px; line-height:1.5; -webkit-font-smoothing:antialiased;
  min-height:100vh; text-rendering:optimizeLegibility;
}
::selection{background:var(--fg); color:var(--bg)}
a{color:inherit; text-decoration:none}
:where(a,button):focus-visible{outline:1px solid var(--fg); outline-offset:3px}

.x-shell{max-width:840px; margin:0 auto; padding:0 clamp(20px,5vw,40px) 120px}
.x-bar{
  display:flex; align-items:baseline; justify-content:space-between; gap:16px;
  flex-wrap:wrap; padding:24px 0 0;
}
.x-kicker{
  font-family:var(--sans); font-size:9px; font-weight:500; letter-spacing:.14em;
  text-transform:uppercase; color:var(--ff);
}
a.x-kicker{transition:color .2s}
a.x-kicker:hover{color:var(--fg)}

/* ── Masthead ── */
.x-head{border-top:1px solid var(--fg); margin-top:20px; padding-top:20px}
.x-meta{
  display:flex; gap:8px 18px; flex-wrap:wrap; align-items:baseline;
  font-family:var(--mono); font-size:11px; letter-spacing:.02em; color:var(--fm);
}
.x-meta .x-id{color:var(--fg)}
.x-title{
  font-family:var(--display); font-weight:500;
  font-size:clamp(34px,6.4vw,62px); line-height:1.02; letter-spacing:-.03em;
  margin:clamp(18px,3vw,28px) 0 0; text-wrap:balance; max-width:18ch;
}
.x-deck{
  font-size:clamp(17px,2.2vw,21px); font-weight:300; line-height:1.45;
  letter-spacing:-.01em; color:var(--fm); margin:clamp(16px,2.4vw,22px) 0 0; max-width:46ch;
}

/* ── Key/value strip ── */
.x-facts{
  display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
  border-top:1px solid var(--bd); border-left:1px solid var(--bd);
  margin-top:clamp(28px,4vw,44px);
}
.x-fact{
  background:var(--cbg); padding:14px 16px; display:flex; flex-direction:column; gap:6px;
  border-right:1px solid var(--bd); border-bottom:1px solid var(--bd);
}
.x-fact dt{font-size:9px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--ff)}
.x-fact dd{font-family:var(--mono); font-size:12px; color:var(--fg); line-height:1.45}
.x-tags{display:flex; flex-wrap:wrap; gap:6px}
.x-tag{
  font-family:var(--mono); font-size:10px; letter-spacing:.02em; color:var(--fm);
  border:1px solid var(--bd); padding:3px 7px; white-space:nowrap;
}
.x-chip{
  font-family:var(--mono); font-size:10px; letter-spacing:.06em; text-transform:uppercase;
  border:1px solid var(--ff); color:var(--fm); padding:2px 7px;
}
.x-chip[data-plain]{text-transform:none; letter-spacing:.02em}
.x-chip[data-level="high"]{color:var(--fg); border-color:var(--fg)}
.x-chip[data-draft]{color:var(--bg); background:var(--fm); border-color:var(--fm)}

/* ── Bands ── */
.x-band{margin-top:clamp(48px,7vw,84px)}
.x-band-head{border-top:1px solid var(--fg); padding-top:16px}
.x-band-label{
  font-family:var(--display); font-size:13px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; color:var(--fg);
}
.x-band-note{font-size:13px; font-weight:300; color:var(--ff); margin-top:6px; max-width:52ch; line-height:1.5}
.x-sec{border-top:1px solid var(--bd); padding:26px 0 0; margin-top:26px}
.x-sec:first-of-type{border-top:none; margin-top:22px; padding-top:0}
.x-sec h3{
  font-family:var(--sans); font-size:10px; font-weight:600; letter-spacing:.14em;
  text-transform:uppercase; color:var(--fm); margin-bottom:12px;
}
.x-prose{font-size:16px; font-weight:300; line-height:1.62; color:var(--fg); max-width:62ch}
.x-prose p+p,.x-prose p+ul,.x-prose p+ol,.x-prose ul+p,.x-prose ol+p,.x-prose blockquote+p{margin-top:14px}
.x-prose a{color:var(--fg); border-bottom:1px solid var(--ff); transition:border-color .2s}
.x-prose a:hover{border-color:var(--fg)}
.x-prose strong{font-weight:600}
.x-prose code{font-family:var(--mono); font-size:13.5px; background:var(--sf); padding:1px 5px; border:1px solid var(--bd)}
.x-prose blockquote{border-left:1px solid var(--ff); padding-left:16px; color:var(--fm)}
ul.x-list,ol.x-list{padding-left:20px}
ul.x-list li,ol.x-list li{margin-bottom:6px}
ul.x-list li::marker,ol.x-list li::marker{color:var(--ff)}

/* ── Index rows ── */
.x-rows{margin-top:clamp(28px,4vw,40px); border-top:1px solid var(--bd)}
.x-row{
  display:grid; grid-template-columns:1fr; gap:10px;
  border-bottom:1px solid var(--bd); padding:22px 0; transition:background .2s;
}
@media(min-width:720px){
  .x-row{grid-template-columns:minmax(0,150px) minmax(0,1fr); gap:clamp(20px,4vw,40px); align-items:start}
}
.x-row:hover{background:var(--sf)}
.x-row-aside{display:flex; flex-direction:column; gap:6px}
.x-row-date{font-family:var(--mono); font-size:11px; color:var(--fm)}
.x-row-id{font-family:var(--mono); font-size:10px; color:var(--ff); letter-spacing:.04em}
.x-row-title{
  font-family:var(--display); font-size:clamp(20px,2.8vw,26px); font-weight:500;
  line-height:1.15; letter-spacing:-.02em; color:var(--fg); text-wrap:balance;
}
.x-row-sum{font-size:15px; font-weight:300; line-height:1.55; color:var(--fm); margin-top:8px; max-width:58ch}
.x-row-foot{display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-top:12px}

/* ── Empty state ── */
.x-empty{
  border:1px solid var(--bd); background:var(--cbg);
  margin-top:clamp(28px,4vw,40px); padding:clamp(28px,5vw,48px);
}
.x-empty h2{font-family:var(--display); font-size:22px; font-weight:500; letter-spacing:-.02em; margin-bottom:12px}
.x-empty p{font-size:15px; font-weight:300; line-height:1.6; color:var(--fm); max-width:56ch}
.x-empty p+p{margin-top:12px}

/* ── Related + footer ── */
.x-related{display:flex; flex-direction:column; gap:1px; background:var(--bd); border:1px solid var(--bd); margin-top:22px}
.x-related a,.x-related span{
  background:var(--cbg); padding:14px 16px; display:flex; gap:14px;
  align-items:baseline; flex-wrap:wrap; transition:background .2s;
}
.x-related a:hover{background:var(--sf)}
.x-related .x-row-id{flex:0 0 auto}
.x-foot{
  border-top:1px solid var(--bd); margin-top:clamp(56px,8vw,96px); padding-top:20px;
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; align-items:baseline;
}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`.trim();

// ── Page shell ─────────────────────────────────────────────────────────────
function shell({ title, description, canonical, bodyHtml, jsonLd, ogType = 'article' }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const ld = jsonLd
    ? `\n<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}">
<meta name="author" content="${escapeHtml(AUTHOR)}">
<link rel="canonical" href="${safeCanonical}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0C0D10">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Field of Action">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:url" content="${safeCanonical}">
<meta property="og:image" content="${escapeHtml(SITE_ORIGIN)}/og-image.png?v=3">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
<meta name="twitter:image" content="${escapeHtml(SITE_ORIGIN)}/og-image.png?v=3">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<style>${CSS}</style>${ld}
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

const topBar = (here) => `  <nav class="x-bar">
    <a class="x-kicker" href="/">Field of Action</a>
    ${here === 'index' ? '<span class="x-kicker">Experiments</span>' : `<a class="x-kicker" href="${SECTION_BASE}">All experiments</a>`}
  </nav>`;

const footer = (right) => `  <footer class="x-foot">
    <a class="x-kicker" href="${SECTION_BASE}">← Experiments index</a>
    <span class="x-kicker">${right}</span>
  </footer>`;

const tagList = (tags) =>
  tags.map((t) => `<span class="x-tag">${escapeHtml(t)}</span>`).join('');

// ── Entry page ─────────────────────────────────────────────────────────────
export function renderEntryPage(entry, byId) {
  const bands = [];
  for (const [group, meta] of Object.entries(GROUPS)) {
    const present = SECTIONS.filter((s) => s.group === group && entry.sections[s.key]);
    if (!present.length) continue;
    const secs = present.map((s) => `      <section class="x-sec">
        <h3>${escapeHtml(s.heading)}</h3>
        <div class="x-prose">
${renderBlocks(entry.sections[s.key]).split('\n').map((l) => `          ${l}`).join('\n')}
        </div>
      </section>`).join('\n');
    bands.push(`    <div class="x-band">
      <div class="x-band-head">
        <h2 class="x-band-label">${escapeHtml(meta.label)}</h2>
        <p class="x-band-note">${escapeHtml(meta.note)}</p>
      </div>
${secs}
    </div>`);
  }

  const relatedHtml = entry.related.length
    ? `    <div class="x-band">
      <div class="x-band-head">
        <h2 class="x-band-label">Related experiments</h2>
      </div>
      <div class="x-related">
${entry.related.map((id) => {
    const target = byId.get(id);
    const label = `<span class="x-row-id">${escapeHtml(id)}</span><span>${escapeHtml(target ? target.title : id)}</span>`;
    return target && target.status === 'published'
      ? `        <a href="${escapeHtml(target.url)}">${label}</a>`
      : `        <span>${label}<span class="x-chip" data-draft>unpublished</span></span>`;
  }).join('\n')}
      </div>
    </div>`
    : '';

  const facts = [
    ['Experiment ID', `<span class="x-row-id">${escapeHtml(entry.id)}</span>`],
    ['Experiment run', timeTag(entry.experimentDate)],
    ['Published', timeTag(entry.published)],
    ['Updated', timeTag(entry.updated)],
    ['Version', escapeHtml(entry.version)],
  ];
  if (entry.confidenceLevel) {
    facts.push(['Confidence', `<span class="x-chip" data-level="${escapeHtml(entry.confidenceLevel)}">${escapeHtml(entry.confidenceLevel)}</span>`]);
  }
  if (entry.tags.length) facts.push(['Tags', `<span class="x-tags">${tagList(entry.tags)}</span>`]);

  const bodyHtml = `<main class="x-shell">
${topBar('entry')}
  <header class="x-head">
    <div class="x-meta">
      <span class="x-id">${escapeHtml(entry.id)}</span>
      <span>v${escapeHtml(entry.version)}</span>
      <span>${escapeHtml(humanDate(entry.experimentDate))}</span>
      ${entry.status === 'draft' ? '<span class="x-chip" data-draft>draft</span>' : ''}
    </div>
    <h1 class="x-title">${escapeHtml(entry.title)}</h1>
    <p class="x-deck">${escapeHtml(entry.summary)}</p>
    <dl class="x-facts">
${facts.map(([label, value]) => `      <div class="x-fact"><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`).join('\n')}
    </dl>
  </header>
${bands.join('\n')}
${relatedHtml}
${footer(`Updated ${escapeHtml(humanDate(entry.updated))}`)}
</main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.summary,
    identifier: entry.id,
    url: entry.canonical,
    datePublished: entry.published,
    dateModified: entry.updated,
    version: entry.version,
    isPartOf: { '@type': 'CreativeWorkSeries', name: `${SECTION_TITLE} — Field of Action`, url: `${SITE_ORIGIN}${SECTION_BASE}` },
    author: { '@type': 'Person', name: AUTHOR },
    publisher: { '@type': 'Organization', name: 'Field of Action', url: `${SITE_ORIGIN}/` },
    ...(entry.tags.length ? { keywords: entry.tags.join(', ') } : {}),
  };

  return shell({
    title: `${entry.title} — Experiments — Field of Action`,
    description: entry.summary,
    canonical: entry.canonical,
    bodyHtml,
    jsonLd,
  });
}

// ── Index page ─────────────────────────────────────────────────────────────
export function renderIndexPage(published) {
  const rows = published.map((entry) => `      <a class="x-row" href="${escapeHtml(entry.url)}">
        <div class="x-row-aside">
          ${timeTag(entry.experimentDate, 'x-row-date')}
          <span class="x-row-id">${escapeHtml(entry.id)}</span>
        </div>
        <div>
          <h2 class="x-row-title">${escapeHtml(entry.title)}</h2>
          <p class="x-row-sum">${escapeHtml(entry.summary)}</p>
          <div class="x-row-foot">
            <span class="x-chip" data-plain>v${escapeHtml(entry.version)}</span>
            ${entry.confidenceLevel ? `<span class="x-chip" data-level="${escapeHtml(entry.confidenceLevel)}">${escapeHtml(entry.confidenceLevel)} confidence</span>` : ''}
            ${tagList(entry.tags)}
          </div>
        </div>
      </a>`).join('\n');

  const listing = published.length
    ? `    <div class="x-rows">
${rows}
    </div>`
    : `    <div class="x-empty">
      <h2>No experiments published yet.</h2>
      <p>This section carries FOA Material Experiment Abstracts: the recipe or mixture, the process, the environment it ran in, the phenomenon actually observed, the confidence that record carries, and any anomaly — kept separate from what the material might be doing.</p>
      <p>The first approved entry will appear here, newest first.</p>
    </div>`;

  const bodyHtml = `<main class="x-shell">
${topBar('index')}
  <header class="x-head">
    <div class="x-meta">
      <span class="x-id">FOA Material Experiment Abstracts</span>
      <span>${published.length} published</span>
    </div>
    <h1 class="x-title">${escapeHtml(SECTION_TITLE)}</h1>
    <p class="x-deck">${escapeHtml(SECTION_DECK)}</p>
  </header>
${listing}
  <footer class="x-foot">
    <a class="x-kicker" href="/">← Field of Action</a>
    <span class="x-kicker">Observation before interpretation</span>
  </footer>
</main>`;

  return shell({
    title: `${SECTION_TITLE} — Field of Action`,
    description: SECTION_SUMMARY,
    canonical: `${SITE_ORIGIN}${SECTION_BASE}`,
    ogType: 'website',
    bodyHtml,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${SECTION_TITLE} — Field of Action`,
      description: SECTION_SUMMARY,
      url: `${SITE_ORIGIN}${SECTION_BASE}`,
      isPartOf: { '@type': 'WebSite', name: 'Field of Action', url: `${SITE_ORIGIN}/` },
    },
  });
}
