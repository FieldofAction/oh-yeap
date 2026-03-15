// FINAL PATCH: Apply all fixes to seed.js in one pass
// 1. Add audioSrc to 15 entries
// 2. Patch 7 truncated essays with full DOCX content
// 3. Add src to 3 Reshaping Players artworks
// 4. Add Techno-Expressionism field note entry

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let seed = readFileSync('src/data/seed.js', 'utf8');
const originalLen = seed.length;
console.log(`Original seed.js: ${seed.length} chars, ${seed.split('\n').length} lines`);

// ===== STEP 1: Add audioSrc =====
console.log('\n--- STEP 1: Audio Sources ---');

const AUDIO_MAP = {
  'Leveling Game': '/audio/art_of_composability.m4a',
  'Freedom': '/audio/art_of_interdependence.m4a',
  'Internet and the Age of Emotion': '/audio/art_of_carrying_response.m4a',
  'Foundation': '/audio/art_of_collapse.m4a',
  'Art of Tolerance': '/audio/art_of_tolerance.m4a',
  'Safety Trap': '/audio/art_of_acceptance.m4a',
  'Way of the Wave': '/audio/art_of_motion.m4a',
  'Architecture of Coherence': '/audio/field_note_architecture_of_coherence.m4a',
  'Beyond Age': '/audio/field_note_beyond_age.m4a',
  'The False Step': '/audio/field_note_the_false_step.m4a',
  'The Grieving Interface': '/audio/field_note_the_grieving_interface.m4a',
  'After the Bridge': '/audio/field_note_after_the_bridge.m4a',
  'Loud Goodbye': '/audio/field_notes_loud_goodbye.m4a',
  'Terms of Visibility': '/audio/field_notes_terms_of_visibility.m4a',
  'What Lies Beyond Next': '/audio/field_notes_what_lies_beyond_next.m4a',
};

let audioCount = 0;
for (const [title, audioSrc] of Object.entries(AUDIO_MAP)) {
  const marker = `title:"${title}"`;
  const idx = seed.indexOf(marker);
  if (idx === -1) { console.log(`  SKIP: ${title} not found`); continue; }

  // Find body:[ for this entry (not beyond next entry)
  const nextEntry = seed.indexOf('{ id:uid()', idx + 10);
  const searchEnd = nextEntry > -1 ? nextEntry : idx + 3000;
  const bodyIdx = seed.indexOf('body:[', idx);
  if (bodyIdx === -1 || bodyIdx > searchEnd) { console.log(`  SKIP: ${title} no body`); continue; }

  // Check if already has audioSrc
  const entrySlice = seed.slice(idx, bodyIdx);
  if (entrySlice.includes('audioSrc:')) continue;

  // Insert before body:[
  seed = seed.slice(0, bodyIdx) + `audioSrc:"${audioSrc}", ` + seed.slice(bodyIdx);
  audioCount++;
}
console.log(`  Added audioSrc to ${audioCount} entries`);

// ===== STEP 2: Patch truncated essays =====
console.log('\n--- STEP 2: Essay Content ---');

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

  let endIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^(Thanks for reading|Subscribe|Share this|Like this post|Ready for more|Start writing|Get the app|Privacy|Terms|Collection notice|© \d{4})/i)) {
      endIdx = i;
      continue;
    }
    break;
  }

  const contentLines = lines.slice(startIdx, endIdx).filter(l => l.length > 0);
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
  if (currentBlock.length > 0) bodyBlocks.push(currentBlock.join('\n\n'));
  return bodyBlocks;
}

function escapeForJS(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

for (const { docx, title } of ESSAYS) {
  const titleIdx = seed.indexOf(`title:"${title}"`);
  if (titleIdx === -1) { console.log(`  SKIP: ${title} not found`); continue; }

  // Find body:[ — must be between this title and the next entry
  const nextEntry = seed.indexOf('{ id:uid()', titleIdx + 10);
  const bodyMarker = 'body:[';
  const bodyIdx = seed.indexOf(bodyMarker, titleIdx);
  if (bodyIdx === -1 || (nextEntry > -1 && bodyIdx > nextEntry)) {
    console.log(`  SKIP: ${title} no body array`);
    continue;
  }

  const arrayStart = bodyIdx + bodyMarker.length - 1; // position of [

  // Find matching ] with bracket counting
  let depth = 1;
  let pos = arrayStart + 1;
  while (pos < seed.length && depth > 0) {
    if (seed[pos] === '[') depth++;
    if (seed[pos] === ']') depth--;
    pos++;
  }
  const arrayEnd = pos - 1; // position of ]

  // Preserve citations
  const existingContent = seed.slice(arrayStart + 1, arrayEnd);
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

  let blocks;
  try { blocks = extractContent(docx); } catch(e) { console.log(`  ERROR ${title}: ${e.message}`); continue; }

  const entries = blocks.map(b => `\n    {type:"text",content:"${escapeForJS(b)}"}`);
  let newContent = entries.join(',');
  if (citBlock) newContent += ',\n    ' + citBlock;
  newContent += ',\n  ';

  seed = seed.slice(0, arrayStart + 1) + newContent + seed.slice(arrayEnd);
  const words = blocks.join(' ').split(/\s+/).length;
  console.log(`  ${title}: ${blocks.length} blocks, ~${words} words`);
}

// ===== STEP 3: Reshaping Players artwork src =====
console.log('\n--- STEP 3: Artwork Images ---');

const ARTWORKS = [
  { alt: 'Pattern language shaping engagement', src: 'https://substackcdn.com/image/fetch/w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4e81fae2-e863-460f-8168-61c6201f4a84_1050x644.heic' },
  { alt: 'Immersive choice and traces of engagement', src: 'https://substackcdn.com/image/fetch/w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F63d7e301-effe-4ebb-abb7-a9f5baaeeed8_1050x644.heic' },
  { alt: 'Relational system of play and perception', src: 'https://substackcdn.com/image/fetch/w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F2ec486e3-caf5-45ba-8cfa-846b8b8f6494_1050x644.heic' },
];

let artCount = 0;
for (const { alt, src } of ARTWORKS) {
  // Find the art entry by its unique alt text
  const altMarker = `alt:"${alt}"`;
  const altIdx = seed.indexOf(altMarker);
  if (altIdx === -1) { console.log(`  SKIP: ${alt.slice(0,30)} not found`); continue; }

  // Find the {type:"art" that precedes this alt
  const artTypeIdx = seed.lastIndexOf('{type:"art"', altIdx);
  if (artTypeIdx === -1 || altIdx - artTypeIdx > 300) { console.log(`  SKIP: no art type near ${alt.slice(0,30)}`); continue; }

  // Check if src already present between {type:"art" and this alt
  const between = seed.slice(artTypeIdx, altIdx);
  if (between.includes('src:"')) { console.log(`  SKIP: ${alt.slice(0,30)} already has src`); continue; }

  // Insert src:"..." right after {type:"art",
  const insertAt = artTypeIdx + '{type:"art",'.length;
  seed = seed.slice(0, insertAt) + `src:"${src}",` + seed.slice(insertAt);
  artCount++;
  console.log(`  Added src for: ${alt.slice(0, 40)}`);
}
console.log(`  ${artCount} artwork images added`);

// ===== STEP 4: Techno-Expressionism entry =====
console.log('\n--- STEP 4: Techno-Expressionism ---');

// Check if it already exists
if (seed.includes('title:"Techno-Expressionism"')) {
  console.log('  Already exists, skipping');
} else {
  // Find the last field-note entry and insert after it
  const allFieldNotes = [];
  let searchFrom = 0;
  while (true) {
    const idx = seed.indexOf('writeType:"field-note"', searchFrom);
    if (idx === -1) break;
    allFieldNotes.push(idx);
    searchFrom = idx + 1;
  }

  if (allFieldNotes.length === 0) {
    console.log('  ERROR: No field-note entries found');
  } else {
    const lastFN = allFieldNotes[allFieldNotes.length - 1];
    // Find the { that starts this entry
    const entryStart = seed.lastIndexOf('{ id:uid()', lastFN);
    // Find its matching }
    let depth = 0;
    let entryEnd = entryStart;
    for (let i = entryStart; i < seed.length; i++) {
      if (seed[i] === '{') depth++;
      if (seed[i] === '}') { depth--; if (depth === 0) { entryEnd = i + 1; break; } }
    }

    const newEntry = `,\n  { id:uid(), section:"writing", writeType:"field-note", title:"Techno-Expressionism", coverImg:"", subtitle:"Field Note", desc:"Technology as emotional medium. Expression through digital craft.", year:"2025", status:"live", tags:["Technology","Expression","Culture"], relations:["The Grieving Interface","Internet and the Age of Emotion"], hasVisual:false, readMin:8, audioDur:"8:00", substackUrl:"", audioSrc:"/audio/field_note_techno-expressionism.m4a", body:[\n    {type:"text",content:"Audio field note. Listen above."},\n  ]}`;

    seed = seed.slice(0, entryEnd) + newEntry + seed.slice(entryEnd);
    console.log('  Added Techno-Expressionism entry');
  }
}

// ===== SAVE & VERIFY =====
writeFileSync('src/data/seed.js', seed);
console.log(`\nFinal seed.js: ${seed.length} chars (was ${originalLen})`);

// Syntax verification
try {
  execSync('node --input-type=module -e "import { SEED } from \'./src/data/seed.js\'; const w = SEED.filter(i => i.section===\'writing\'); console.log(SEED.length + \' items, \' + w.length + \' writing entries\'); w.forEach(e => { const b = e.body?.filter(x=>x.type===\'text\')?.length||0; const a = e.audioSrc ? \'audio\' : \'\'; console.log(\'  \' + e.title.padEnd(35) + b + \' blocks \' + a); })"', { stdio: 'inherit' });
} catch(e) {
  console.log('VERIFICATION FAILED: ' + e.message);
}
