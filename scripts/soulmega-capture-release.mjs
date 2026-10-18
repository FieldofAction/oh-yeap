#!/usr/bin/env node
// Release the Soul Mega capture module as an immutable, versioned file.
//
//   npm run soulmega:release
//   node scripts/soulmega-capture-release.mjs --out <dir> [--src <file>]
//
// Reads `const VERSION = '<x.y.z>'` from public/soulmega/capture/sm-capture.js,
// copies the file to sm-capture-<VERSION>.js next to it (or into --out), and
// prints the sha384 SRI hash plus the payload for registering the file as a
// Webflow hosted script. A version is written once: if the target exists with
// different bytes the script refuses, because browsers and Webflow's SRI check
// have cached the old bytes under that name. Bump VERSION instead.
//
// This script writes one local file and prints. It never calls Webflow.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CAPTURE_DIR = join(ROOT, "public/soulmega/capture");
const HOSTED_BASE = "https://www.fieldofaction.org/soulmega/capture/";
const DISPLAY_NAME = "sm_capture";

function usage(code) {
  console.log(
    [
      "Usage: node scripts/soulmega-capture-release.mjs [--out <dir>] [--src <file>]",
      "",
      "  --out <dir>   write sm-capture-<VERSION>.js into <dir> (default public/soulmega/capture)",
      "  --src <file>  release this file (default public/soulmega/capture/sm-capture.js)",
    ].join("\n"),
  );
  process.exit(code);
}

// Repo-relative when the file is inside the repo, absolute otherwise.
function display(file) {
  const rel = relative(ROOT, file);
  return rel && !rel.startsWith("..") ? rel : file;
}

function fail(message) {
  console.error(`✗ soulmega-release: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { out: CAPTURE_DIR, src: join(CAPTURE_DIR, "sm-capture.js") };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--help" || flag === "-h") usage(0);
    if (flag !== "--out" && flag !== "--src") fail(`unknown argument ${flag}`);
    const value = argv[++i];
    if (!value || value.startsWith("--")) fail(`${flag} needs a value`);
    args[flag.slice(2)] = resolve(value);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!existsSync(args.src)) fail(`${display(args.src)} does not exist`);
const bytes = readFileSync(args.src);
const source = bytes.toString("utf8");

const match = /\bconst\s+VERSION\s*=\s*(["'])([^"']+)\1/.exec(source);
if (!match) fail(`no \`const VERSION = '<x.y.z>'\` found in ${basename(args.src)}`);
const version = match[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`VERSION "${version}" is not a semantic version (x.y.z)`);
}

const fileName = `sm-capture-${version}.js`;
const target = join(args.out, fileName);
const integrity = `sha384-${createHash("sha384").update(bytes).digest("base64")}`;
const shown = display(target);

let state;
if (existsSync(target)) {
  if (!readFileSync(target).equals(bytes)) {
    fail(
      `${shown} already exists with different bytes. Released versions are immutable: ` +
        "bump VERSION in sm-capture.js and run this again.",
    );
  }
  state = "unchanged (already released with these exact bytes)";
} else {
  mkdirSync(args.out, { recursive: true });
  writeFileSync(target, bytes);
  state = "written";
}

const payload = {
  hostedLocation: `${HOSTED_BASE}${fileName}`,
  integrityHash: integrity,
  version,
  displayName: DISPLAY_NAME,
};

console.log(`✓ ${shown}: ${state}`);
console.log(`  version    ${version}`);
console.log(`  bytes      ${bytes.length}`);
console.log(`  integrity  ${integrity}`);
console.log("");
console.log("Webflow register_hosted_script payload:");
console.log(JSON.stringify(payload, null, 2));
console.log("");
console.log("Next steps:");
console.log(`  1. Commit ${fileName} and deploy, then check that`);
console.log(`     ${payload.hostedLocation} answers 200 with`);
console.log("     cache-control: public, max-age=31536000, immutable.");
console.log("  2. Register it with register_hosted_script using the payload above.");
console.log("  3. Apply it with add_site_script: the registered script id, location \"footer\",");
console.log(`     version "${version}". Never use set_site_scripts. It replaces the whole list and`);
console.log("     would drop footer_reveal_repair.");
console.log("  4. Publish to soulmega.webflow.io only. On soulmega.com the script stays dormant");
console.log('     until config.json has "live": true, set after the launch checklist.');
console.log("     A Webflow publish also ships any Designer work that is staged but unpublished.");
console.log("     Check with the Soul Mega team before publishing.");
console.log("");
console.log("Script tag equivalent, for testing outside Webflow:");
console.log(
  `  <script src="${payload.hostedLocation}" integrity="${integrity}" crossorigin="anonymous"></script>`,
);
