// Patch all truncated essays in seed.js from DOCX sources
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const docxDir = '/Users/danielalfred_1/Downloads/ASU Folder Structure/Cache/Published /';

const ESSAYS = [
  { docx: 'Art of Acceptance', title: 'Safety Trap' },
  { docx: 'Art of Carrying Response', title: 'Internet and the Age of Emotion' },
  { docx: 'Art of Collapse', title: 'Foundation' },
  { docx: 'Art of Composability', title: 'Leveling Game' },
  { docx: 'Art of Interdependence', title: 'Freedom' },
  { docx: 'Art of Motion', title: 'Way of the Wave' },
  { docx: 'Art of Tolerance', title: 'Art of Tolerance' },
];

function extractContent(docxName) {
  const txt = execSync(`textutil -convert txt -stdout "${docxDir}${docxName}.docx"`, { encoding: 'utf8' });
  const lines = txt.split('\n').map(l => l.trim());

  // Find where real content starts - skip header metadata
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length === 0) continue;
    if (lines[i].length > 60 && (lines[i].includes('.') || lines[i].includes(','))) {
      startIdx = i;
      break;
    }
  }
  // Include section header if present just before
  if (startIdx > 0 && lines[startIdx - 1].length > 0 && lines[startIdx - 1].length < 40) {
    startIdx--;
  }

  // Find end - skip footer cruft
  let endIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^(Thanks for reading|Subscribe|Share this|Like this post|Ready for more|Start writing|Get the app|Privacy|Terms|Collection notice|© \d{4})/i)) {
      endIdx = i;
      continue;
    }
    break;
  }

  const contentLines = lines.slice(startIdx, endIdx).filter(l => l.length > 0);

  // Group into text blocks
  const bodyBlocks = [];
  let currentBlock = [];
  let parasInBlock = 0;

  for (const line of contentLines) {
    const isHeader = line.length < 40 && !line.endsWith('.') && !line.endsWith(',') && !line.endsWith(';');
    const isRefLine = line.startsWith('•') || line.startsWith('\t•') || line === 'References';

    if (line === 'References') break;
    if (isRefLine) continue;

    if (isHeader && currentBlock.length > 0) {
      bodyBlocks.push(currentBlock.join('\\n\\n'));
      currentBlock = [line];
      parasInBlock = 0;
      continue;
    }

    currentBlock.push(line);
    parasInBlock++;

    if (parasInBlock >= 4) {
      bodyBlocks.push(currentBlock.join('\\n\\n'));
      currentBlock = [];
      parasInBlock = 0;
    }
  }
  if (currentBlock.length > 0) {
    bodyBlocks.push(currentBlock.join('\\n\\n'));
  }

  return bodyBlocks;
}

function patchEssay(seed, title, bodyBlocks) {
  const titleIdx = seed.indexOf(`title:"${title}"`);
  if (titleIdx === -1) { console.log(`  ERROR: "${title}" not found in seed.js`); return seed; }

  // Find body
  let bodyIdx = seed.indexOf('body:[', titleIdx);
  if (bodyIdx === -1) bodyIdx = seed.indexOf('body:', titleIdx);
  if (bodyIdx === -1) { console.log(`  ERROR: body not found for "${title}"`); return seed; }

  const bracketIdx = seed.indexOf('[', bodyIdx);
  if (bracketIdx === -1) { console.log(`  ERROR: bracket not found for "${title}"`); return seed; }

  // Find matching ]
  let depth = 1;
  let end = bracketIdx + 1;
  for (let i = end; i < seed.length; i++) {
    if (seed[i] === '[') depth++;
    if (seed[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }

  // Preserve citations
  const existingBody = seed.slice(bracketIdx + 1, end);
  const citMatch = existingBody.match(/\{type:"citations"[^}]*\{[^}]*\}[^}]*\}/s) ||
                   existingBody.match(/\{type:"citations"[^}]*\}/s);

  // Also look for citations with items array (more complex pattern)
  let citBlock = null;
  const citStart = existingBody.indexOf('{type:"citations"');
  if (citStart !== -1) {
    // Find matching } accounting for nested {}
    let d = 0;
    let citEnd = citStart;
    for (let i = citStart; i < existingBody.length; i++) {
      if (existingBody[i] === '{') d++;
      if (existingBody[i] === '}') { d--; if (d === 0) { citEnd = i + 1; break; } }
    }
    citBlock = existingBody.slice(citStart, citEnd);
  }

  // Escape blocks
  const escapedBlocks = bodyBlocks.map(b => b.replace(/"/g, '\\"'));
  const bodyEntries = escapedBlocks.map(b => `    {type:"text",content:"${b}"}`);

  let newBody = '[\n' + bodyEntries.join(',\n');
  if (citBlock) {
    newBody += ',\n    ' + citBlock;
  }
  newBody += ',\n  ]';

  return seed.slice(0, bracketIdx) + newBody + seed.slice(end + 1);
}

// Main
let seed = readFileSync('src/data/seed.js', 'utf8');

for (const { docx, title } of ESSAYS) {
  console.log(`\nPatching: ${title} (from ${docx}.docx)`);
  try {
    const blocks = extractContent(docx);
    const words = blocks.join(' ').replace(/\\n/g, ' ').split(/\s+/).length;
    console.log(`  ${blocks.length} blocks, ~${words} words`);
    seed = patchEssay(seed, title, blocks);
    console.log(`  Done`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

writeFileSync('src/data/seed.js', seed);
console.log('\nAll essays patched!');
