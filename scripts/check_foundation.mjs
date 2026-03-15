// Extract Foundation essay body from seed.js and save to a file for inspection
import { readFileSync, writeFileSync } from 'fs';

const seed = readFileSync('src/data/seed.js', 'utf8');

// Find the Foundation entry - it's Memo 6 with subtitle "Art of Collapse"
const titleMatch = seed.indexOf('title:"Foundation"');
if (titleMatch === -1) {
  console.log('Could not find Foundation entry');
  process.exit(1);
}

// Find the body of this entry
const bodyStart = seed.indexOf('body:', titleMatch);
if (bodyStart === -1) {
  console.log('Could not find body for Foundation');
  process.exit(1);
}

// Parse the body string - it starts with a backtick template literal
const openTick = seed.indexOf('`', bodyStart);
let depth = 0;
let i = openTick + 1;
let bodyEnd = -1;

// Find the matching closing backtick (not inside ${})
while (i < seed.length) {
  if (seed[i] === '\\') { i += 2; continue; }
  if (seed[i] === '$' && seed[i+1] === '{') { depth++; i += 2; continue; }
  if (depth > 0 && seed[i] === '{') { depth++; }
  if (depth > 0 && seed[i] === '}') { depth--; }
  if (depth === 0 && seed[i] === '`') { bodyEnd = i; break; }
  i++;
}

if (bodyEnd === -1) {
  console.log('Could not find end of body');
  process.exit(1);
}

const body = seed.slice(openTick + 1, bodyEnd);

// Strip HTML tags for word count
const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = text.split(/\s+/).length;

writeFileSync('/tmp/foundation_body.txt', body);
console.log(`Foundation body: ${body.length} chars, ~${words} words`);
console.log(`Saved to /tmp/foundation_body.txt`);
console.log('\n--- LAST 500 CHARS ---');
console.log(body.slice(-500));
