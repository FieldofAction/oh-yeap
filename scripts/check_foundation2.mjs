// Find Foundation entry and extract its full body array
import { readFileSync, writeFileSync } from 'fs';

const seed = readFileSync('src/data/seed.js', 'utf8');
const titleIdx = seed.indexOf('title:"Foundation"');

// Walk backwards to find the opening { of this entry
let braces = 0;
let entryStart = titleIdx;
for (let i = titleIdx; i >= 0; i--) {
  if (seed[i] === '{') {
    braces++;
    if (braces === 1) { entryStart = i; break; }
  }
  if (seed[i] === '}') braces--;
}

// Walk forward to find the matching closing }
braces = 0;
let entryEnd = titleIdx;
for (let i = entryStart; i < seed.length; i++) {
  if (seed[i] === '{') braces++;
  if (seed[i] === '}') {
    braces--;
    if (braces === 0) { entryEnd = i + 1; break; }
  }
}

const entry = seed.slice(entryStart, entryEnd);

// Count text content sections
const textMatches = entry.match(/type:"text"/g);
const artMatches = entry.match(/type:"art"/g);
const pullMatches = entry.match(/type:"pull"/g);

console.log(`Entry length: ${entry.length} chars`);
console.log(`Text blocks: ${textMatches ? textMatches.length : 0}`);
console.log(`Art blocks: ${artMatches ? artMatches.length : 0}`);
console.log(`Pull blocks: ${pullMatches ? pullMatches.length : 0}`);

// Extract just the text content and count words
const textContents = [];
const re = /type:"text",content:"((?:[^"\\]|\\.)*)"/g;
let m;
while ((m = re.exec(entry)) !== null) {
  textContents.push(m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
}

const allText = textContents.join('\n\n');
const words = allText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
console.log(`\nTotal text words: ${words}`);

// Show last 3 text blocks
console.log('\n--- LAST 3 TEXT BLOCKS ---');
textContents.slice(-3).forEach((t, i) => {
  const preview = t.length > 200 ? t.slice(0, 200) + '...' : t;
  console.log(`\n[Block ${textContents.length - 3 + i + 1}]: ${preview}`);
});

// Show last 300 chars of the entry to see how it ends
console.log('\n--- ENTRY ENDING (last 500 chars) ---');
console.log(entry.slice(-500));

writeFileSync('/tmp/foundation_full.txt', allText);
console.log('\nFull text saved to /tmp/foundation_full.txt');
