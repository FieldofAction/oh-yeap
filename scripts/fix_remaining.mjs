// Fix remaining issues: artwork URLs + Techno-Expressionism entry
import { readFileSync, writeFileSync } from 'fs';

let seed = readFileSync('src/data/seed.js', 'utf8');

// 1. Add src to Reshaping Players Meta-Diagrams
const artworks = [
  {
    find: 'title:"Meta-Diagram: Coherence",desc:"Pattern language shaping engagement"',
    src: 'https://substackcdn.com/image/fetch/w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4e81fae2-e863-460f-8168-61c6201f4a84_1050x644.heic',
  },
  {
    find: 'title:"Meta-Diagram: Integration",desc:"Immersive choice and traces of engagement"',
    src: 'https://substackcdn.com/image/fetch/w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F63d7e301-effe-4ebb-abb7-a9f5baaeeed8_1050x644.heic',
  },
  {
    find: 'title:"Meta-Diagram: Orchestration",desc:"Relational system of play and perception"',
    src: 'https://substackcdn.com/image/fetch/w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F2ec486e3-caf5-45ba-8cfa-846b8b8f6494_1050x644.heic',
  },
];

let artCount = 0;
for (const { find, src } of artworks) {
  const idx = seed.indexOf(find);
  if (idx === -1) { console.log(`  SKIP: ${find.slice(0, 40)} not found`); continue; }
  // Check if src already exists
  const before = seed.slice(Math.max(0, idx - 200), idx);
  if (before.includes('src:"https://')) { console.log(`  SKIP: already has src`); continue; }
  // Insert src before title
  seed = seed.slice(0, idx) + `src:"${src}",` + seed.slice(idx);
  artCount++;
  console.log(`  Added src for ${find.slice(7, 35)}`);
}
console.log(`\nArtwork: ${artCount} images added`);

// 2. Add Techno-Expressionism Field Note entry
// Find where to insert — after the last field-note entry
const lastFieldNote = seed.lastIndexOf('writeType:"field-note"');
if (lastFieldNote === -1) {
  console.log('ERROR: No field-note entries found');
} else {
  // Find the end of this entry's object (matching closing })
  const entryStart = seed.lastIndexOf('{ id:uid()', lastFieldNote);
  let depth = 0;
  let entryEnd = entryStart;
  for (let i = entryStart; i < seed.length; i++) {
    if (seed[i] === '{') depth++;
    if (seed[i] === '}') { depth--; if (depth === 0) { entryEnd = i + 1; break; } }
  }

  const newEntry = `,
  { id:uid(), section:"writing", writeType:"field-note", title:"Techno-Expressionism", coverImg:"", subtitle:"Field Note", desc:"Technology as emotional medium. Expression through digital craft.", year:"2025", status:"live", tags:["Technology","Expression","Culture"], relations:["The Grieving Interface","Internet and the Age of Emotion"], hasVisual:false, readMin:8, audioDur:"8:00", substackUrl:"", audioSrc:"/audio/field_note_techno-expressionism.m4a", body:[
    {type:"text",content:"Audio field note. Listen above."},
  ]}`;

  seed = seed.slice(0, entryEnd) + newEntry + seed.slice(entryEnd);
  console.log('Added Techno-Expressionism field note entry');
}

writeFileSync('src/data/seed.js', seed);

// Verify
try {
  const { execSync } = await import('child_process');
  execSync('node --input-type=module -e "import { SEED } from \'./src/data/seed.js\'; console.log(SEED.length + \' items loaded\')"', { stdio: 'inherit' });
} catch(e) {
  console.log('Verification failed: ' + e.message);
}
