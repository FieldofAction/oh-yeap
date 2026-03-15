// Re-apply audioSrc to seed.js entries
import { readFileSync, writeFileSync } from 'fs';

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

let seed = readFileSync('src/data/seed.js', 'utf8');
let count = 0;

for (const [title, audioSrc] of Object.entries(AUDIO_MAP)) {
  const marker = `title:"${title}"`;
  const idx = seed.indexOf(marker);
  if (idx === -1) { console.log(`  SKIP: ${title} not found`); continue; }

  // Check if audioSrc already exists for this entry
  const nextEntry = seed.indexOf('{ id:uid()', idx + 1);
  const entrySlice = seed.slice(idx, nextEntry > -1 ? nextEntry : idx + 2000);
  if (entrySlice.includes('audioSrc:')) { console.log(`  SKIP: ${title} already has audioSrc`); continue; }

  // Insert audioSrc before body:
  const bodyIdx = seed.indexOf('body:', idx);
  if (bodyIdx === -1) { console.log(`  SKIP: ${title} no body found`); continue; }
  seed = seed.slice(0, bodyIdx) + `audioSrc:"${audioSrc}", ` + seed.slice(bodyIdx);
  count++;
}

writeFileSync('src/data/seed.js', seed);
console.log(`Added audioSrc to ${count} entries`);
