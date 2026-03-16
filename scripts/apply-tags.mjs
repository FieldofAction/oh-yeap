#!/usr/bin/env node
/**
 * apply-tags.mjs
 *
 * Reads post-tags.json and patches PatioBeach.jsx by adding tag fields
 * (t, clr, mat, cnd) to each post object in the MONTHS data.
 *
 * Usage:  node scripts/apply-tags.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const JSX_PATH = path.join(ROOT, "src/components/PatioBeach.jsx");
const TAGS_PATH = path.join(ROOT, "scripts/post-tags.json");

function main() {
  if (!fs.existsSync(TAGS_PATH)) {
    console.error(`ERROR: ${TAGS_PATH} not found. Run tag-posts.mjs first.`);
    process.exit(1);
  }

  const tags = JSON.parse(fs.readFileSync(TAGS_PATH, "utf-8"));
  const tagCount = Object.keys(tags).length;
  console.log(`Loaded ${tagCount} tags from post-tags.json`);

  let src = fs.readFileSync(JSX_PATH, "utf-8");

  // We need to find each post object `{n:NUM,...}` and inject tag fields.
  // Strategy: regex match each post by its `n:NUM` key, then insert tags
  // right before the closing `}` of that post object.
  //
  // Post objects look like:
  //   {n:123,c:"...",i:[...],d:"..."}
  //   {n:123,c:"...",i:[...],d:"...",by:"..."}
  //
  // We'll match `{n:NUM,` ... `}` within the posts arrays and add fields.

  let applied = 0;
  let skipped = 0;
  let alreadyTagged = 0;

  for (const [nStr, tag] of Object.entries(tags)) {
    const n = Number(nStr);

    // Build a regex that finds the post object starting with `{n:NUM,`
    // We look for `{n:NUM,` and capture everything up to the closing `}`
    // that ends the post object (before `,` or `]`).
    const escapedN = String(n);

    // Match the post object. The post ends with `}` followed by either `,` or `]`.
    // Use a non-greedy match for the inner content.
    const re = new RegExp(
      `(\\{n:${escapedN},(?:(?!\\{n:).)*?)(\\}(?=[,\\]]))`
    );

    const match = src.match(re);
    if (!match) {
      console.warn(`  [SKIP] Post n:${n} not found in source.`);
      skipped++;
      continue;
    }

    // Check if already tagged
    if (match[1].includes(',t:"')) {
      alreadyTagged++;
      continue;
    }

    const tagStr = `,t:"${tag.t}",clr:"${tag.clr}",mat:"${tag.mat}",cnd:"${tag.cnd}"`;
    src = src.replace(re, `$1${tagStr}$2`);
    applied++;
  }

  fs.writeFileSync(JSX_PATH, src, "utf-8");

  console.log(`\nResults:`);
  console.log(`  Applied:        ${applied}`);
  console.log(`  Already tagged: ${alreadyTagged}`);
  console.log(`  Skipped:        ${skipped}`);
  console.log(`\nWrote: ${JSX_PATH}`);
}

main();
