#!/usr/bin/env node
// Soul Mega audience capture: Mailchimp audience setup.
//
//   node scripts/soulmega-mailchimp-setup.mjs           read-only plan (default)
//   node scripts/soulmega-mailchimp-setup.mjs --apply   create only what is missing
//
// Env: MAILCHIMP_API_KEY (required, ends in the datacenter like -us3),
//      MAILCHIMP_AUDIENCE_ID (default 94b16e1a8e).
//
// Idempotent by merge tag and by name. Creates the capture merge fields, the
// "What moves you" interest group, the ctx-* tags the saved segments use, and
// four saved segments. Prints the MAILCHIMP_INTEREST_IDS value for Vercel.
// Never prints the API key.

import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_AUDIENCE_ID, INTEREST_CATEGORY, MERGE_FIELDS, createApi, datacenter, segmentOptions,
} from "../api/_lib/soulmega/mailchimp.js";
import { INTERESTS, INTEREST_LABELS, SEGMENTS, contextTag } from "../api/_lib/soulmega/audience.js";

const MERGE_FIELD_LIMIT = 30;
const norm = (s) => String(s ?? "").trim().toLowerCase();

class SetupError extends Error {}

function describe(method, path, res) {
  const title = res.data?.title ? ` ${res.data.title}` : "";
  const detail = res.data?.detail ? `: ${res.data.detail}` : "";
  const hint =
    res.status === 401
      ? " (check MAILCHIMP_API_KEY; keys made on or after 2026-06-22 expire one year after creation)"
      : "";
  return `Mailchimp ${method} ${path} -> ${res.status}${title}${detail}${hint}`;
}

async function send(request, method, path, body) {
  const res = await request(method, path, body);
  if (res.status !== 200) throw new SetupError(describe(method, path, res));
  return res.data || {};
}

export async function runSetup({ apiKey, audienceId = DEFAULT_AUDIENCE_ID, apply = false, fetchImpl, log = console.log }) {
  const request = createApi({ apiKey, fetchImpl, timeoutMs: 20000 });
  const L = `/lists/${audienceId}`;

  // ---- read what exists ----
  const list = await send(request, "GET", `${L}?fields=id,name,stats.member_count`);
  log(`Audience ${audienceId} "${list.name ?? "?"}" (${list.stats?.member_count ?? "?"} subscribed)`);

  const mf = await send(
    request, "GET",
    `${L}/merge-fields?count=1000&fields=merge_fields.merge_id,merge_fields.tag,merge_fields.name,merge_fields.type,total_items`,
  );
  const fields = mf.merge_fields || [];
  const byTag = new Map(fields.map((f) => [String(f.tag).toUpperCase(), f]));

  const cats = await send(request, "GET", `${L}/interest-categories?count=100&fields=categories.id,categories.title,categories.type`);
  const category = (cats.categories || []).find((c) => norm(c.title) === norm(INTEREST_CATEGORY.title)) || null;
  const interests = category
    ? (await send(request, "GET", `${L}/interest-categories/${category.id}/interests?count=100&fields=interests.id,interests.name`)).interests || []
    : [];

  const segs = await send(request, "GET", `${L}/segments?count=1000&fields=segments.id,segments.name,segments.type,total_items`);
  const segments = segs.segments || [];
  const segByName = new Map(segments.map((s) => [norm(s.name), s]));

  // ---- plan ----
  const actions = [];
  const warnings = [];
  const ids = { categoryId: category?.id || null, interestIds: {}, tagIds: {} };

  for (const f of MERGE_FIELDS) {
    const have = byTag.get(f.tag);
    if (!have) actions.push({ kind: "field", f, label: `merge field ${f.tag} "${f.name}" (text, ${f.public ? "public" : "hidden"})` });
    else if (have.type !== "text") warnings.push(`merge field ${f.tag} exists as ${have.type}; the capture adapter writes text there.`);
  }
  const newFields = actions.length;
  if (fields.length + newFields > MERGE_FIELD_LIMIT) {
    warnings.push(`${fields.length} merge fields exist and ${newFields} are missing; the usual limit is ${MERGE_FIELD_LIMIT}.`);
  }

  if (category && category.type !== INTEREST_CATEGORY.type) {
    warnings.push(`interest group "${category.title}" is ${category.type}; checkboxes lets people edit it in the preference center.`);
  }
  if (!category) {
    actions.push({ kind: "category", label: `interest group "${INTEREST_CATEGORY.title}" (${INTEREST_CATEGORY.type})` });
  }
  for (const k of INTERESTS) {
    const have = interests.find((i) => norm(i.name) === norm(INTEREST_LABELS[k]));
    if (have) ids.interestIds[k] = have.id;
    else actions.push({ kind: "interest", key: k, label: `interest "${INTEREST_LABELS[k]}"` });
  }

  const tagNames = [...new Set(SEGMENTS.flatMap((s) => s.contexts.map(contextTag)))];
  for (const name of tagNames) {
    const have = segByName.get(norm(name));
    if (have?.type === "static") ids.tagIds[name] = have.id;
    else if (have) warnings.push(`"${name}" exists as a ${have.type} segment, not a tag; saved segments need the tag.`);
    else actions.push({ kind: "tag", name, label: `tag ${name} (empty static segment)` });
  }

  for (const seg of SEGMENTS) {
    const have = segByName.get(norm(seg.name));
    if (have && have.type !== "saved") warnings.push(`"${seg.name}" exists as a ${have.type} segment; left alone.`);
    if (!have) actions.push({ kind: "segment", seg, label: `saved segment "${seg.name}" (match any)` });
  }

  // ---- report ----
  log(`Merge fields: ${fields.length} exist. Capture fields present: ${MERGE_FIELDS.filter((f) => byTag.has(f.tag)).map((f) => f.tag).join(" ") || "none"}`);
  log(`Interest group: ${category ? `"${category.title}" (${category.id}), ${interests.length} interests` : "missing"}`);
  log(`Segments and tags: ${segments.length} exist`);
  for (const w of warnings) log(`warning: ${w}`);

  const pending = (label) => `<${label}>`;
  const preview = (seg) =>
    segmentOptions(seg, {
      categoryId: ids.categoryId || pending("new group"),
      interestIds: Object.fromEntries(INTERESTS.map((k) => [k, ids.interestIds[k] || pending(`new ${k}`)])),
      tagIds: Object.fromEntries(tagNames.map((t) => [t, ids.tagIds[t] ?? pending(`new ${t}`)])),
    });

  if (!actions.length) {
    log("Nothing to create. The audience is set up.");
  } else {
    log(`${apply ? "Creating" : "Would create"} ${actions.length}:`);
    for (const a of actions) {
      log(`  + ${a.label}`);
      if (!apply && a.kind === "segment") log(`      ${JSON.stringify(preview(a.seg))}`);
    }
  }

  // ---- apply ----
  if (apply) {
    for (const a of actions) {
      if (a.kind === "field") {
        await send(request, "POST", `${L}/merge-fields`, {
          name: a.f.name, tag: a.f.tag, type: "text", required: false, public: a.f.public,
        });
      } else if (a.kind === "category") {
        const made = await send(request, "POST", `${L}/interest-categories`, INTEREST_CATEGORY);
        ids.categoryId = made.id;
      } else if (a.kind === "interest") {
        const made = await send(request, "POST", `${L}/interest-categories/${ids.categoryId}/interests`, {
          name: INTEREST_LABELS[a.key],
        });
        ids.interestIds[a.key] = made.id;
      } else if (a.kind === "tag") {
        const made = await send(request, "POST", `${L}/segments`, { name: a.name, static_segment: [] });
        ids.tagIds[a.name] = made.id;
      } else if (a.kind === "segment") {
        await send(request, "POST", `${L}/segments`, { name: a.seg.name, options: segmentOptions(a.seg, ids) });
      }
      log(`  created ${a.label}`);
    }
  } else if (actions.length) {
    log("Plan only. Run again with --apply to create these.");
  }

  const complete = INTERESTS.every((k) => ids.interestIds[k]);
  if (complete) {
    log("Set this in Vercel (Production):");
    log(`MAILCHIMP_INTEREST_IDS=${JSON.stringify(ids.interestIds)}`);
  } else {
    log("MAILCHIMP_INTEREST_IDS will be printed once the interest group exists.");
  }
  return { actions: actions.map((a) => a.label), warnings, applied: apply, interestIds: complete ? ids.interestIds : null };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const apiKey = String(process.env.MAILCHIMP_API_KEY || "").trim();
  const audienceId = String(process.env.MAILCHIMP_AUDIENCE_ID || "").trim() || DEFAULT_AUDIENCE_ID;
  if (!apiKey) {
    console.error("soulmega-mailchimp-setup: MAILCHIMP_API_KEY is not set. Create a key in Mailchimp (Profile > Extras > API keys) and export it first.");
    process.exit(1);
  }
  if (!datacenter(apiKey)) {
    console.error("soulmega-mailchimp-setup: MAILCHIMP_API_KEY must end with its datacenter suffix, like -us3.");
    process.exit(1);
  }
  try {
    await runSetup({ apiKey, audienceId, apply });
  } catch (e) {
    console.error(`soulmega-mailchimp-setup: ${e?.message || e}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
