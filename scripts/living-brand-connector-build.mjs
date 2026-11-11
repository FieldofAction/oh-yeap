// Bundles the connector into one file so it runs with no install step:
//   node living-brand/connector/bundle/server.mjs
// The bundle is committed. A test rebuilds it in memory and fails if the
// committed file is out of date.
import { build } from 'esbuild';
import { statSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BUNDLE = resolve(root, 'living-brand/connector/bundle/server.mjs');
const SKILL = resolve(root, 'living-brand/skills/living-brand/SKILL.md');
const PROJECT_SKILL = resolve(root, '.claude/skills/living-brand/SKILL.md');

export async function bundle({ write = true } = {}) {
  const result = await build({
    entryPoints: [resolve(root, 'living-brand/connector/server.mjs')], outfile: BUNDLE, absWorkingDir: root,
    bundle: true, platform: 'node', format: 'esm', target: 'node20', write,
    loader: { '.md': 'text' }, legalComments: 'none', logLevel: 'warning',
    banner: { js: '// Built from living-brand/connector/*.mjs by scripts/living-brand-connector-build.mjs. Do not edit.\nimport { createRequire as __lbRequire } from "node:module"; const require = __lbRequire(import.meta.url);' },
  });
  return write ? readFileSync(BUNDLE, 'utf8') : result.outputFiles[0].text;
}

// The skill has one source. Sessions opened on this repository read the project copy.
export const skillInSync = () => readFileSync(SKILL, 'utf8') === readFileSync(PROJECT_SKILL, 'utf8');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await bundle();
  mkdirSync(dirname(PROJECT_SKILL), { recursive: true });
  copyFileSync(SKILL, PROJECT_SKILL);
  console.log(`Built ${BUNDLE.replace(root + '/', '')}: ${(statSync(BUNDLE).size / 1024).toFixed(0)} KB.`);
}
