// Compare all essay word counts: seed.js vs DOCX source files
import { readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const docxDir = '/Users/danielalfred_1/Downloads/ASU Folder Structure/Cache/Published /';
const seed = readFileSync('src/data/seed.js', 'utf8');

// Map DOCX filenames to seed.js titles
const MAP = {
  'Art of Acceptance': 'Safety Trap',
  'Art of Carrying Response': 'Internet and the Age of Emotion',
  'Art of Collapse': 'Foundation',
  'Art of Composability': 'Leveling Game',
  'Art of Interdependence': 'Freedom',
  'Art of Motion': 'Way of the Wave',
  'Art of Tolerance': 'Art of Tolerance',
  'Field Note Architecture of Coherence': 'Architecture of Coherence',
  'Field Note Beyond Age': 'Beyond Age',
  'Field Note The False Step': 'The False Step',
  'Field Note The Grieving Interface': 'The Grieving Interface',
  'Field Notes After the Bridge': 'After the Bridge',
  'Field Notes Loud Goodbye': 'Loud Goodbye',
  'Field Notes Terms of Visibility': 'Terms of Visibility',
  'Field Notes What Lies Beyond Next': 'What Lies Beyond Next',
  'Beyond Productivity': 'Beyond Productivity',
  'Reshaping Players': 'Reshaping Players',
};

function getSeedWordCount(title) {
  const titleIdx = seed.indexOf(`title:"${title}"`);
  if (titleIdx === -1) return { words: -1, blocks: 0 };

  // Find body array
  let bodyIdx = seed.indexOf('body:[', titleIdx);
  if (bodyIdx === -1) bodyIdx = seed.indexOf('body:', titleIdx);
  if (bodyIdx === -1) return { words: -1, blocks: 0 };

  const bracketIdx = seed.indexOf('[', bodyIdx);
  if (bracketIdx === -1) return { words: -1, blocks: 0 };

  // Find matching ]
  let depth = 1;
  let end = bracketIdx + 1;
  for (let i = end; i < seed.length; i++) {
    if (seed[i] === '[') depth++;
    if (seed[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }

  const bodyContent = seed.slice(bracketIdx + 1, end);
  const textBlocks = bodyContent.match(/type:"text"/g);
  const text = bodyContent.replace(/<[^>]+>/g, ' ').replace(/\\n/g, ' ').replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(w => !w.match(/^(type:|content:|items:|src:|title:|desc:)$/)).length;

  return { words, blocks: textBlocks ? textBlocks.length : 0 };
}

function getDocxWordCount(filename) {
  try {
    const txt = execSync(`textutil -convert txt -stdout "${docxDir}${filename}.docx"`, { encoding: 'utf8' });
    const words = txt.replace(/\s+/g, ' ').trim().split(/\s+/).length;
    return words;
  } catch {
    return -1;
  }
}

console.log('Essay Comparison: DOCX vs seed.js\n');
console.log('Title'.padEnd(35) + 'DOCX'.padStart(8) + 'Seed'.padStart(8) + 'Blocks'.padStart(8) + '  Status');
console.log('-'.repeat(75));

const issues = [];

for (const [docxName, seedTitle] of Object.entries(MAP)) {
  const docxWords = getDocxWordCount(docxName);
  const { words: seedWords, blocks } = getSeedWordCount(seedTitle);

  const ratio = seedWords > 0 && docxWords > 0 ? seedWords / docxWords : 0;
  let status = '';
  if (docxWords === -1) status = 'NO DOCX';
  else if (seedWords === -1) status = 'NOT IN SEED';
  else if (ratio < 0.5) { status = 'TRUNCATED'; issues.push(seedTitle); }
  else if (ratio < 0.8) { status = 'SHORT'; issues.push(seedTitle); }
  else status = 'OK';

  console.log(
    seedTitle.padEnd(35) +
    (docxWords > 0 ? String(docxWords) : '?').padStart(8) +
    (seedWords > 0 ? String(seedWords) : '?').padStart(8) +
    String(blocks).padStart(8) +
    '  ' + status
  );
}

console.log('\n' + (issues.length ? `Issues found: ${issues.join(', ')}` : 'All essays look complete!'));
