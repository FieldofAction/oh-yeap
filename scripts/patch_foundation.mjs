// Patch Foundation essay in seed.js with full content from DOCX source
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Convert DOCX to text on the fly — no temp files needed
const docxPath = '/Users/danielalfred_1/Downloads/ASU Folder Structure/Cache/Published /Art of Collapse.docx';
execSync(`textutil -convert txt -stdout "${docxPath}" > /tmp/_foundation.txt`);
const essayText = readFileSync('/tmp/_foundation.txt', 'utf8');

// Split by single newlines since that's how the text file is formatted
const lines = essayText.split('\n').map(l => l.trim());

// Find where real content starts - skip header metadata
// Headers: "Art of Collapse", "Alfred (Daniel) Dickson", "Foundation", "Art of Collapse", author, date
let startIdx = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].length === 0) continue;
  // Look for the first long sentence paragraph (actual essay content)
  if (lines[i].length > 60 && (lines[i].includes('.') || lines[i].includes(','))) {
    startIdx = i;
    break;
  }
}

// Also check for section headers like "Easy There" right before content
if (startIdx > 0 && lines[startIdx - 1].length > 0 && lines[startIdx - 1].length < 30) {
  // This is a section header, include it
  startIdx = startIdx - 1;
}

// Find where content ends - skip footer/references metadata
let endIdx = lines.length;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].match(/^(Thanks for reading|Subscribe|Share this|Like this post|Ready for more|Start writing|Get the app|Privacy|Terms|Collection notice|© \d{4})/i)) {
    endIdx = i;
    continue;
  }
  break;
}

// Grab content lines, filtering empty ones
const contentLines = lines.slice(startIdx, endIdx).filter(l => l.length > 0);
console.log(`Content lines: ${contentLines.length} (from index ${startIdx} to ${endIdx})`);
console.log(`First: "${contentLines[0].slice(0, 80)}"`);
console.log(`Last: "${contentLines[contentLines.length-1].slice(0, 80)}"`);

// Group into text blocks - use section headers and natural breaks
// Detect section headers: short lines (<40 chars) that don't end with common sentence endings
const bodyBlocks = [];
let currentBlock = [];
let parasInBlock = 0;

for (const line of contentLines) {
  const isHeader = line.length < 40 && !line.endsWith('.') && !line.endsWith(',') && !line.endsWith(';');
  const isRefLine = line.startsWith('•') || line.startsWith('\t•') || line.startsWith('References');

  // Skip references section entirely (we have citations already)
  if (isRefLine || line === 'References') {
    // Check if this is the start of references
    if (line === 'References') break;
    continue;
  }

  // Section header starts a new block
  if (isHeader && currentBlock.length > 0) {
    bodyBlocks.push(currentBlock.join('\\n\\n'));
    currentBlock = [line];
    parasInBlock = 0;
    continue;
  }

  currentBlock.push(line);
  parasInBlock++;

  // Split every 3-4 paragraphs for readability
  if (parasInBlock >= 4) {
    bodyBlocks.push(currentBlock.join('\\n\\n'));
    currentBlock = [];
    parasInBlock = 0;
  }
}
if (currentBlock.length > 0) {
  bodyBlocks.push(currentBlock.join('\\n\\n'));
}

console.log(`\nGenerated ${bodyBlocks.length} text blocks`);

// Preview blocks
bodyBlocks.forEach((b, i) => {
  const preview = b.slice(0, 100).replace(/\\n/g, ' | ');
  const words = b.replace(/\\n/g, ' ').split(/\s+/).length;
  console.log(`  Block ${i+1}: ~${words} words — "${preview}..."`);
});

// Escape content for JS string literals
const escapedBlocks = bodyBlocks.map(b =>
  b.replace(/"/g, '\\"')
);

// Build the body array entries
const bodyEntries = escapedBlocks.map(b => `    {type:"text",content:"${b}"}`);

// Read seed.js
let seed = readFileSync('src/data/seed.js', 'utf8');

// Find Foundation entry
const titleIdx = seed.indexOf('title:"Foundation"');
if (titleIdx === -1) { console.log('ERROR: Foundation not found'); process.exit(1); }

// Find body: for this entry (may be "body:[" or "body:\n")
let bodyIdx = seed.indexOf('body:[', titleIdx);
if (bodyIdx === -1) bodyIdx = seed.indexOf('body:', titleIdx);
if (bodyIdx === -1) { console.log('ERROR: body not found'); process.exit(1); }

// Find the opening [ of the body array
const bracketIdx = seed.indexOf('[', bodyIdx);
if (bracketIdx === -1) { console.log('ERROR: body bracket not found'); process.exit(1); }
const bodyArrayStart = bracketIdx; // position of [
let depth = 1;
let bodyArrayEnd = bodyArrayStart + 1;
for (let i = bodyArrayEnd; i < seed.length; i++) {
  if (seed[i] === '[') depth++;
  if (seed[i] === ']') {
    depth--;
    if (depth === 0) { bodyArrayEnd = i; break; }
  }
}

// Extract existing citations block if present
const existingBody = seed.slice(bodyArrayStart + 1, bodyArrayEnd);
const citMatch = existingBody.match(/\{type:"citations"[^}]*\}/s);
const citBlock = citMatch ? citMatch[0] : null;

// Build new body content
let newBodyContent = '\n' + bodyEntries.join(',\n');
if (citBlock) {
  newBodyContent += ',\n    ' + citBlock;
}
newBodyContent += ',\n  ]';

// Replace
const newSeed = seed.slice(0, bodyArrayStart) + newBodyContent + seed.slice(bodyArrayEnd + 1);

writeFileSync('src/data/seed.js', newSeed);

// Verify
const totalWords = bodyBlocks.join(' ').replace(/\\n/g, ' ').split(/\s+/).length;
console.log(`\nPatched seed.js — ~${totalWords} words in ${bodyBlocks.length} blocks`);
if (citBlock) console.log('Citations block preserved');
