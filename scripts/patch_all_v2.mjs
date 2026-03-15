// Patch all truncated essays - V2 with correct body array handling
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

  // Find where real content starts
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length === 0) continue;
    if (lines[i].length > 60 && (lines[i].includes('.') || lines[i].includes(','))) {
      startIdx = i;
      break;
    }
  }
  if (startIdx > 0 && lines[startIdx - 1].length > 0 && lines[startIdx - 1].length < 40) {
    startIdx--;
  }

  // Find end
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
    if (line === 'References') break;
    if (line.startsWith('•') || line.startsWith('\t•')) continue;

    if (isHeader && currentBlock.length > 0) {
      bodyBlocks.push(currentBlock.join('\n\n'));
      currentBlock = [line];
      parasInBlock = 0;
      continue;
    }

    currentBlock.push(line);
    parasInBlock++;

    if (parasInBlock >= 4) {
      bodyBlocks.push(currentBlock.join('\n\n'));
      currentBlock = [];
      parasInBlock = 0;
    }
  }
  if (currentBlock.length > 0) {
    bodyBlocks.push(currentBlock.join('\n\n'));
  }

  return bodyBlocks;
}

function escapeForJS(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

function findBodyArray(seed, titleIdx) {
  // Find "body:[" after the title
  const bodyMarker = 'body:[';
  const bodyIdx = seed.indexOf(bodyMarker, titleIdx);
  if (bodyIdx === -1) return null;

  // Make sure this body:[ belongs to this entry, not the next one
  const nextEntry = seed.indexOf('{ id:uid()', titleIdx + 10);
  if (nextEntry > -1 && bodyIdx > nextEntry) return null;

  const arrayStart = bodyIdx + bodyMarker.length - 1; // position of [

  // Find matching ]
  let depth = 1;
  let i = arrayStart + 1;
  while (i < seed.length && depth > 0) {
    if (seed[i] === '[') depth++;
    if (seed[i] === ']') depth--;
    i++;
  }
  const arrayEnd = i - 1; // position of ]

  return { start: arrayStart, end: arrayEnd };
}

// Main
let seed = readFileSync('src/data/seed.js', 'utf8');

for (const { docx, title } of ESSAYS) {
  console.log(`\nPatching: ${title}`);

  const titleIdx = seed.indexOf(`title:"${title}"`);
  if (titleIdx === -1) { console.log('  NOT FOUND'); continue; }

  const bodyPos = findBodyArray(seed, titleIdx);
  if (!bodyPos) { console.log('  NO BODY ARRAY'); continue; }

  // Extract existing citations
  const existingContent = seed.slice(bodyPos.start + 1, bodyPos.end);
  let citBlock = null;
  const citIdx = existingContent.indexOf('{type:"citations"');
  if (citIdx !== -1) {
    let d = 0;
    let end = citIdx;
    for (let i = citIdx; i < existingContent.length; i++) {
      if (existingContent[i] === '{') d++;
      if (existingContent[i] === '}') { d--; if (d === 0) { end = i + 1; break; } }
    }
    citBlock = existingContent.slice(citIdx, end);
  }

  // Extract content from DOCX
  let blocks;
  try {
    blocks = extractContent(docx);
  } catch(e) {
    console.log(`  ERROR: ${e.message}`);
    continue;
  }

  const words = blocks.join(' ').split(/\s+/).length;
  console.log(`  ${blocks.length} blocks, ~${words} words`);

  // Build new body array content
  const entries = blocks.map(b => `\n    {type:"text",content:"${escapeForJS(b)}"}`);
  let newContent = entries.join(',');
  if (citBlock) {
    newContent += ',\n    ' + citBlock;
  }
  newContent += ',\n  ';

  // Replace body array contents (keep the [ and ])
  seed = seed.slice(0, bodyPos.start + 1) + newContent + seed.slice(bodyPos.end);
  console.log('  OK');
}

writeFileSync('src/data/seed.js', seed);
console.log('\n--- Verifying syntax ---');

try {
  // Quick syntax check
  new Function(seed.replace(/^export default/, 'return').replace(/^import[^;]+;/gm, ''));
  console.log('Syntax OK (Function constructor)');
} catch(e) {
  console.log('Syntax check: ' + e.message);
}
