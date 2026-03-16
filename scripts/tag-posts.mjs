#!/usr/bin/env node
/**
 * tag-posts.mjs
 *
 * Reads the MONTHS data from PatioBeach.jsx, sends each post's first image
 * + caption to Claude for classification, and writes tags to post-tags.json.
 *
 * Usage:  ANTHROPIC_API_KEY=sk-... node scripts/tag-posts.mjs
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.resolve(import.meta.dirname, "..");
const JSX_PATH = path.join(ROOT, "src/components/PatioBeach.jsx");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_PATH = path.join(ROOT, "scripts/post-tags.json");

const BATCH_SIZE = 5;
const DELAY_MS = 1200; // pause between batches to stay under rate limits
const MODEL = "claude-sonnet-4-20250514";

// ── Tag taxonomies ──
const TAG_TYPES = [
  "Furniture","Toys","Packaging","Clothing","Electronics",
  "Food/Drink","Tools","Receptacles","Signage","Misc"
];
const TAG_COLORS = [
  "Red","Orange","Yellow","Green","Blue","Purple",
  "Pink","Brown","Black","White","Grey","Multi"
];
const TAG_MATERIALS = [
  "Wood","Metal","Plastic","Fabric","Paper","Glass","Rubber","Organic","Mixed"
];
const TAG_CONDITIONS = [
  "Crushed","Broken","Intact","Decayed","Arranged","Scattered"
];

// ── Helpers ──

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Extract all posts from the MONTHS object inside PatioBeach.jsx.
 * We eval a trimmed version of the JS to get the data directly.
 */
function extractPosts() {
  const src = fs.readFileSync(JSX_PATH, "utf-8");
  // MONTHS starts at line 3 and ends at the first `};`
  const startIdx = src.indexOf("const MONTHS = {");
  const endIdx = src.indexOf("};", startIdx) + 2;
  const monthsBlock = src.slice(startIdx, endIdx);

  // Convert to something we can evaluate
  const evalStr = monthsBlock.replace("const MONTHS = ", "globalThis.__MONTHS__ = ");
  // eslint-disable-next-line no-eval
  new Function(evalStr)();
  const MONTHS = globalThis.__MONTHS__;
  delete globalThis.__MONTHS__;

  const posts = [];
  for (const [, month] of Object.entries(MONTHS)) {
    for (const post of month.posts) {
      posts.push(post);
    }
  }
  return posts;
}

/**
 * Load the first image of a post as a base64 data-url payload for the API.
 * Skips .mp4 files (returns null).
 */
function loadImage(post) {
  const firstImg = post.i[0];
  if (!firstImg || firstImg.endsWith(".mp4")) return null;

  const absPath = path.join(PUBLIC_DIR, firstImg);
  if (!fs.existsSync(absPath)) {
    console.warn(`  [WARN] Image not found: ${absPath}`);
    return null;
  }
  const buf = fs.readFileSync(absPath);
  const ext = path.extname(firstImg).slice(1).toLowerCase();
  const mediaType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
  return { type: "base64", media_type: mediaType, data: buf.toString("base64") };
}

const SYSTEM_PROMPT = `You are a visual classifier for discarded objects found on sidewalks.
Return ONLY a JSON object with these four fields (no markdown, no explanation):

{
  "t": "<Object Type>",
  "clr": "<Color>",
  "mat": "<Material>",
  "cnd": "<Condition>"
}

Object Type must be one of: ${TAG_TYPES.join(", ")}
Color must be one of: ${TAG_COLORS.join(", ")}
Material must be one of: ${TAG_MATERIALS.join(", ")}
Condition must be one of: ${TAG_CONDITIONS.join(", ")}`;

async function tagPost(client, post) {
  const imgPayload = loadImage(post);
  const caption = post.c || "(no caption)";

  const content = [];
  if (imgPayload) {
    content.push({ type: "image", source: imgPayload });
  }
  content.push({
    type: "text",
    text: `Caption: "${caption}"\nClassify this discarded object.`,
  });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 120,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const raw = resp.content[0].text.trim();
  try {
    const parsed = JSON.parse(raw);
    return {
      t: TAG_TYPES.includes(parsed.t) ? parsed.t : "Misc",
      clr: TAG_COLORS.includes(parsed.clr) ? parsed.clr : "Multi",
      mat: TAG_MATERIALS.includes(parsed.mat) ? parsed.mat : "Mixed",
      cnd: TAG_CONDITIONS.includes(parsed.cnd) ? parsed.cnd : "Scattered",
    };
  } catch {
    console.warn(`  [WARN] Could not parse response for post ${post.n}: ${raw}`);
    return { t: "Misc", clr: "Multi", mat: "Mixed", cnd: "Scattered" };
  }
}

// ── Main ──

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ERROR: Set ANTHROPIC_API_KEY environment variable.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log("Reading posts from PatioBeach.jsx ...");
  const posts = extractPosts();
  console.log(`Found ${posts.length} posts.`);

  // Load existing tags for resume support
  let existing = {};
  if (fs.existsSync(OUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
    console.log(`Loaded ${Object.keys(existing).length} existing tags (will skip).`);
  }

  const toProcess = posts.filter((p) => !existing[String(p.n)]);
  console.log(`${toProcess.length} posts to process.\n`);

  if (toProcess.length === 0) {
    console.log("Nothing to do — all posts already tagged.");
    return;
  }

  let completed = 0;
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches}  (posts ${batch.map((p) => p.n).join(", ")})`);

    const results = await Promise.all(
      batch.map(async (post) => {
        try {
          const tags = await tagPost(client, post);
          return { n: post.n, tags };
        } catch (err) {
          console.error(`  [ERROR] Post ${post.n}: ${err.message}`);
          return { n: post.n, tags: null };
        }
      })
    );

    for (const r of results) {
      if (r.tags) {
        existing[String(r.n)] = r.tags;
        completed++;
      }
    }

    // Write after every batch so progress is saved
    fs.writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
    console.log(`  -> Saved. Total tagged: ${Object.keys(existing).length}\n`);

    // Rate-limit pause between batches
    if (i + BATCH_SIZE < toProcess.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`Done! Tagged ${completed} new posts. Total: ${Object.keys(existing).length}`);
  console.log(`Output: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
