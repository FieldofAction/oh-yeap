#!/usr/bin/env node
/**
 * Experiments — content contract (parse + validate + inline rendering).
 *
 * One Markdown file per experiment in content/experiments/. Files whose name
 * starts with `_` are ignored (that is how _TEMPLATE.md stays out of the site).
 * Nothing here touches application code: adding a file is the whole publishing
 * action. See EXPERIMENTS-PUBLISHING.md.
 *
 * Deliberately dependency-free. The accepted Markdown is a small, documented
 * subset, and anything outside it is a validation error rather than a silent
 * mis-render.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve } from 'node:path';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = resolve(ROOT, 'content/experiments');
export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://fieldofaction.org').replace(/\/+$/, '');
export const SECTION_BASE = '/experiments';

// ── Front-matter contract ──────────────────────────────────────────────────
export const REQUIRED_KEYS = ['id', 'title', 'summary', 'experiment_date', 'published', 'version'];
export const OPTIONAL_SCALAR_KEYS = ['slug', 'updated', 'status', 'confidence_level'];
export const LIST_KEYS = ['tags', 'related'];
export const ALL_KEYS = [...REQUIRED_KEYS, ...OPTIONAL_SCALAR_KEYS, ...LIST_KEYS];

export const STATUSES = ['published', 'draft'];
export const CONFIDENCE_LEVELS = ['low', 'moderate', 'high'];

// ── Body contract ──────────────────────────────────────────────────────────
// `group` fixes the order and the framing on the page: what was observed is
// rendered before, and apart from, what is inferred from it.
export const SECTIONS = [
  { key: 'recipe', heading: 'Recipe', group: 'observed', required: true },
  { key: 'process', heading: 'Process', group: 'observed', required: true },
  { key: 'environment', heading: 'Environment', group: 'observed', required: true },
  { key: 'phenomenon', heading: 'Observed Phenomenon', group: 'observed', required: true },
  { key: 'confidence', heading: 'Confidence', group: 'observed', required: true },
  { key: 'anomaly', heading: 'Anomaly', group: 'observed', required: true },
  { key: 'behavior', heading: 'Possible Behavior', group: 'interpretation', required: false },
  { key: 'evidence', heading: 'Evidence', group: 'support', required: false },
  { key: 'sources', heading: 'Sources', group: 'support', required: false },
  { key: 'limitations', heading: 'Limitations', group: 'support', required: false },
  { key: 'next_test', heading: 'Next Test', group: 'support', required: false },
  // Required by the authoring policy for new runs; optional for legacy records.
  { key: 'plain_language', heading: 'Simple Application / Plain-Language Read', group: 'plain_language', required: false },
];

export const GROUPS = {
  observed: {
    label: 'Material record',
    note: 'Recorded during the run. Observation only — no interpretation in this band.',
  },
  interpretation: {
    label: 'Interpretation',
    note: 'Possible human behaviour, drawn from the record above. A hypothesis — not an observation, and not a result.',
  },
  support: {
    label: 'Support',
    note: 'What backs the record, what it does not cover, and what comes next.',
  },
  plain_language: {
    label: 'Plain-language read',
    note: 'An explanation and illustration of the reported finding. Examples are not additional experiments; possible implications are not demonstrated outcomes.',
  },
};

const HEADING_LOOKUP = new Map(SECTIONS.map((s) => [s.heading.toLowerCase(), s]));

// Slugs the generator itself owns. `index.md` would pass the slug pattern, but
// the build writes index.html for the section index and then <slug>.html for
// every entry — so an entry called "index" would silently overwrite the index.
export const RESERVED_SLUGS = new Set(['index']);

// Markdown the publishing document does not promise. Each of these renders as
// something misleading if it slips through (a table flattens to a paragraph, an
// image to stray punctuation), so they are refused with a pointer to the
// supported alternative rather than silently flattened.
const UNSUPPORTED_FORMS = [
  {
    test: (l) => /^\|.*\|$/.test(l) || /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(l),
    hint: 'tables are not supported — use a list, or one labelled line per row',
  },
  {
    test: (l) => /!\[[^\]]*\]\([^)]*\)/.test(l),
    hint: 'images are not supported — describe the evidence in text, or link to it under "## Sources"',
  },
  {
    test: (l) => /\[\^[^\]]+\]/.test(l),
    hint: 'footnotes are not supported — put the reference under "## Sources"',
  },
  {
    test: (l) => /^(?:```|~~~)/.test(l),
    hint: 'fenced code blocks are not supported — use `inline code`',
  },
  {
    test: (l) => /^([-*_])\1{2,}$/.test(l),
    hint: 'horizontal rules are not supported — the "## " sections are the only dividers',
  },
];

const ID_RE = /^[A-Z0-9][A-Z0-9._-]{2,63}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_RE = /^\d+(?:\.\d+){0,2}$/;
const SAFE_HREF_RE = /^(?:https?:\/\/|mailto:|\/)[^\s<>]*$/i;

// Placeholder marker for protected code spans. Uses a private-use character
// rather than a control character so it survives any editor round-trip.
const CODE_MARK = '';

// ── HTML helpers ───────────────────────────────────────────────────────────
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Inline Markdown subset: `code`, [text](href), **bold**, *em* / _em_.
 * Everything is escaped first, so the only HTML that reaches the page is the
 * tags this function emits.
 */
export function renderInline(raw) {
  let text = escapeHtml(raw);

  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_m, code) => `${CODE_MARK}${codes.push(code) - 1}${CODE_MARK}`);

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) => {
    if (!SAFE_HREF_RE.test(href)) return whole;
    const external = /^https?:/i.test(href) && !href.startsWith(`${SITE_ORIGIN}/`);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });

  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^\w_])_([^_\n]+)_(?![\w_])/g, '$1<em>$2</em>');

  const restore = new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, 'g');
  return text.replace(restore, (_m, i) => `<code>${codes[Number(i)]}</code>`);
}

/** Block subset: paragraphs, `- ` bullets, `1. ` numbers, `> ` quotes. */
export function renderBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .map((lines) => {
      if (lines.every((l) => /^[-*]\s+/.test(l))) {
        const items = lines.map((l) => `<li>${renderInline(l.replace(/^[-*]\s+/, ''))}</li>`);
        return `<ul class="x-list">${items.join('')}</ul>`;
      }
      if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
        const items = lines.map((l) => `<li>${renderInline(l.replace(/^\d+[.)]\s+/, ''))}</li>`);
        return `<ol class="x-list">${items.join('')}</ol>`;
      }
      if (lines.every((l) => /^>\s?/.test(l))) {
        return `<blockquote>${renderInline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</blockquote>`;
      }
      return `<p>${renderInline(lines.join(' '))}</p>`;
    })
    .join('\n');
}

// ── Parsing ────────────────────────────────────────────────────────────────
const unquote = (v) => v.replace(/^(['"])([\s\S]*)\1$/, '$2').trim();

function parseFrontMatter(lines, fail) {
  const data = {};
  let listKey = null;
  for (const line of lines) {
    if (!line.trim() || /^\s*#/.test(line)) continue;

    const item = line.match(/^\s*-\s+(.*)$/);
    if (item) {
      if (!listKey) fail(`list item "${item[1].trim()}" has no key above it`);
      else data[listKey].push(unquote(item[1].trim()));
      continue;
    }

    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!kv) {
      fail(`cannot parse front-matter line: "${line.trim()}" (expected "key: value")`);
      continue;
    }
    const key = kv[1].toLowerCase();
    const value = kv[2].trim();
    if (key in data) fail(`duplicate front-matter key "${key}"`);

    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (/^\[[\s\S]*\]$/.test(value)) {
      data[key] = value.slice(1, -1).split(',').map((v) => unquote(v.trim())).filter(Boolean);
      listKey = null;
    } else {
      data[key] = unquote(value);
      listKey = null;
    }
  }
  return data;
}

function parseSections(body, fail) {
  const found = new Map();
  let current = null;
  let currentHeading = '';

  for (const rawLine of body.split('\n')) {
    const heading = rawLine.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const def = HEADING_LOOKUP.get(heading[1].toLowerCase());
      if (!def) {
        fail(`unknown section "## ${heading[1]}" — allowed: ${SECTIONS.map((s) => s.heading).join(', ')}`);
        current = null;
        continue;
      }
      if (found.has(def.key)) fail(`duplicate section "## ${def.heading}"`);
      current = [];
      currentHeading = def.heading;
      found.set(def.key, current);
      continue;
    }
    if (/^#{1,6}\s/.test(rawLine)) {
      fail(`"${rawLine.trim()}" is not a section heading — entries use "## " headings only`);
      continue;
    }
    if (current) {
      const line = rawLine.trim();
      const unsupported = line && UNSUPPORTED_FORMS.find((form) => form.test(line));
      if (unsupported) fail(`under "## ${currentHeading}": ${unsupported.hint} (at "${line.slice(0, 60)}")`);
      current.push(rawLine);
    } else if (rawLine.trim()) {
      fail(`text outside a section: "${rawLine.trim().slice(0, 60)}" — every line must sit under a "## " heading`);
    }
  }

  const sections = {};
  for (const [key, lines] of found) sections[key] = lines.join('\n').trim();
  return sections;
}

const isRealDate = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

/** Parse and self-validate one file. Returns { entry, errors, warnings }. */
export function parseEntry(filePath) {
  const file = basename(filePath);
  const errors = [];
  const warnings = [];
  const fail = (m) => errors.push(`${file}: ${m}`);
  const warn = (m) => warnings.push(`${file}: ${m}`);

  const raw = readFileSync(filePath, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');

  if (lines[0]?.trim() !== '---') {
    fail('must open with a "---" front-matter fence on line 1');
    return { entry: null, errors, warnings };
  }
  let i = 1;
  while (i < lines.length && lines[i].trim() !== '---') i += 1;
  if (i >= lines.length) {
    fail('front matter is never closed with "---"');
    return { entry: null, errors, warnings };
  }

  const data = parseFrontMatter(lines.slice(1, i), fail);
  const sections = parseSections(lines.slice(i + 1).join('\n'), fail);

  for (const key of Object.keys(data)) {
    if (!ALL_KEYS.includes(key)) fail(`unknown front-matter key "${key}" — allowed: ${ALL_KEYS.join(', ')}`);
  }
  for (const key of REQUIRED_KEYS) {
    const value = data[key];
    if (typeof value !== 'string' || !value) fail(`missing required field "${key}"`);
  }
  for (const key of LIST_KEYS) {
    if (key in data && !Array.isArray(data[key])) {
      data[key] = String(data[key]).split(',').map((v) => v.trim()).filter(Boolean);
    }
  }

  const fileSlug = file.replace(/\.md$/i, '');
  if (!SLUG_RE.test(fileSlug)) {
    fail(`filename "${file}" is not a valid slug (lowercase words joined by single hyphens, e.g. refusal-drift-under-role-framing.md)`);
  } else if (RESERVED_SLUGS.has(fileSlug)) {
    fail(`filename "${file}" uses the reserved slug "${fileSlug}" — the build writes ${fileSlug}.html for the section index, so this entry would overwrite it`);
  }
  if (typeof data.slug === 'string' && data.slug && data.slug !== fileSlug) {
    fail(`slug "${data.slug}" does not match the filename — rename the file or drop the slug field (the filename is the URL)`);
  }

  if (typeof data.id === 'string' && data.id && !ID_RE.test(data.id)) {
    fail(`id "${data.id}" must be 3-64 chars of A-Z, 0-9, dot, dash or underscore (e.g. FOA-EXP-2026-001)`);
  }
  for (const key of ['experiment_date', 'published', 'updated']) {
    const value = data[key];
    if (typeof value !== 'string' || !value) continue;
    if (!DATE_RE.test(value) || !isRealDate(value)) {
      fail(`"${key}" must be a real calendar date as YYYY-MM-DD, got "${value}"`);
    }
  }
  if (typeof data.version === 'string' && data.version && !VERSION_RE.test(data.version)) {
    fail(`version "${data.version}" must look like 1, 1.2 or 1.2.3`);
  }

  const status = data.status || 'published';
  if (!STATUSES.includes(status)) fail(`status "${status}" must be one of: ${STATUSES.join(', ')}`);
  if (data.confidence_level && !CONFIDENCE_LEVELS.includes(data.confidence_level)) {
    fail(`confidence_level "${data.confidence_level}" must be one of: ${CONFIDENCE_LEVELS.join(', ')}`);
  }

  const updated = data.updated || data.published;
  if (data.published && updated && DATE_RE.test(data.published) && DATE_RE.test(updated) && updated < data.published) {
    fail(`updated (${updated}) is before published (${data.published})`);
  }
  if (data.published && data.experiment_date && DATE_RE.test(data.published) && DATE_RE.test(data.experiment_date)
      && data.experiment_date > data.published) {
    fail(`experiment_date (${data.experiment_date}) is after published (${data.published}) — an experiment cannot be published before it was run`);
  }

  if (typeof data.summary === 'string') {
    if (data.summary.length > 300) {
      fail(`summary is ${data.summary.length} characters — keep it under 300, it is the page's meta description`);
    } else if (data.summary.length > 180) {
      warn(`summary is ${data.summary.length} characters — search results truncate around 160`);
    }
  }

  for (const def of SECTIONS) {
    if (def.required && !sections[def.key]) fail(`missing required section "## ${def.heading}"`);
  }
  // Legacy entries may omit the closing section. When supplied, all three
  // labelled pieces must be present, in order, and contain actual text.
  if (Object.hasOwn(sections, 'plain_language')) {
    const text = sections.plain_language;
    const expected = ['In simple terms', 'Simple example', 'Why it matters'];
    const labels = [...text.matchAll(/^\*\*(In simple terms|Simple example|Why it matters):\*\*[ \t]*/gm)];
    if (labels.length !== expected.length || labels.some((m, n) => m[1] !== expected[n])) {
      fail('"## Simple Application / Plain-Language Read" needs **In simple terms:**, **Simple example:**, and **Why it matters:** exactly once, in that order');
    } else {
      labels.forEach((m, n) => {
        const part = text.slice(m.index + m[0].length, labels[n + 1]?.index ?? text.length).trim();
        if (!part) fail(`"## Simple Application / Plain-Language Read": "${m[1]}" cannot be empty`);
      });
    }
  }
  if (sections.behavior && !sections.evidence) {
    warn('has "## Possible Behavior" but no "## Evidence" — a hypothesis with nothing behind it');
  }

  if (errors.length) return { entry: null, errors, warnings };

  return {
    entry: {
      file,
      slug: fileSlug,
      id: data.id,
      title: data.title,
      summary: data.summary,
      experimentDate: data.experiment_date,
      published: data.published,
      updated,
      version: data.version,
      status,
      confidenceLevel: data.confidence_level || '',
      tags: data.tags || [],
      related: data.related || [],
      sections,
      url: `${SECTION_BASE}/${fileSlug}`,
      canonical: `${SITE_ORIGIN}${SECTION_BASE}/${fileSlug}`,
    },
    errors,
    warnings,
  };
}

/**
 * Newest first: experiment date, then publication date, then id.
 * The id tiebreak descends too. Entries run on the same day are numbered in
 * the order they were run, so ascending ids there would put the older run on
 * top and contradict the section's promise.
 */
export const byNewest = (a, b) => (
  b.experimentDate.localeCompare(a.experimentDate)
  || b.published.localeCompare(a.published)
  || b.id.localeCompare(a.id)
);

/**
 * Read every entry file. No central list to edit — the directory is the index.
 * Returns { entries (all, newest first), published, byId, errors, warnings }.
 */
export function loadEntries(dir = CONTENT_DIR) {
  const errors = [];
  const warnings = [];
  let files = [];
  try {
    files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md') && !f.startsWith('_')).sort();
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    warnings.push(`content directory ${dir} does not exist yet — treating the section as empty`);
  }

  const entries = [];
  for (const file of files) {
    const result = parseEntry(join(dir, file));
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (result.entry) entries.push(result.entry);
  }

  const byId = new Map();
  const bySlug = new Map();
  for (const entry of entries) {
    if (byId.has(entry.id)) errors.push(`duplicate id "${entry.id}" in ${byId.get(entry.id).file} and ${entry.file}`);
    else byId.set(entry.id, entry);
    if (bySlug.has(entry.slug)) errors.push(`duplicate slug "${entry.slug}" in ${bySlug.get(entry.slug).file} and ${entry.file}`);
    else bySlug.set(entry.slug, entry);
  }
  for (const entry of entries) {
    for (const rel of entry.related) {
      if (rel === entry.id) errors.push(`${entry.file}: related lists its own id "${rel}"`);
      else if (!byId.has(rel)) errors.push(`${entry.file}: related id "${rel}" does not match any experiment`);
    }
  }

  entries.sort(byNewest);
  return {
    entries,
    published: entries.filter((e) => e.status === 'published'),
    byId,
    errors,
    warnings,
  };
}
