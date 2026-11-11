// The practitioner's workbench and the engagements nested in it. Fictional.

export const AS_OF = '2026-11-11';

export const practitioner = {
  id: 'dd',
  name: 'Freelance creative director',
  // Portable: general methods the practitioner is entitled to carry.
  methods: [
    'Read the work before the guidelines.',
    'Separate intended impact, observed outcome, contribution and transfer.',
    'Ask who can decide before proposing what should change.',
  ],
  preferences: { reviewCadence: 'weekly', handoffFormat: 'package and walkthrough' },
  engagements: [
    { id: 'eng-fernway', clientLabel: 'Fernway', role: 'Creative director, contract' },
    { id: 'eng-brightloop', clientLabel: 'Brightloop', role: 'Concept consultant', ended: '2026-10-30' },
  ],
};

export const engagements = {
  'eng-fernway': {
    id: 'eng-fernway', brandId: 'fernway', clientLabel: 'Fernway',
    practitioner: 'Freelance creative director', role: 'Creative director, contract',
    project: 'Small Hours, return season',
    purpose: 'Bring lapsed subscribers back to the bedtime routine this winter, without repeating last year\'s acquisition campaign.',
    invitedBy: 'priya', mode: 'investigation', modesCompleted: ['orientation'],
    scope: 'Campaign concept and brief. Brand knowledge may be read and proposals made; nothing is adopted or published from this engagement.',
    constraints: ['Launch 12 January 2027', 'Owned channels plus paid social', 'Budget roughly a third of 2025'],
    started: '2026-11-02', asOf: '2026-11-11',
    grant: { brandId: 'fernway', powers: ['read', 'propose'], expires: '2027-03-31', revokedAt: null },
    workTypes: ['Brand campaign', 'Customer campaign'],
    channels: ['owned-social', 'owned-web', 'email', 'paid-media'],
    objective: 'Reactivate lapsed subscribers and keep them past 90 days.',
    audience: 'Parents who cancelled in 2026',
    materials: ['fw-guidelines-v3', 'fw-small-hours-brief', 'fw-small-hours-hero', 'fw-interviews-2026'],
    newBrief: { goal: 'retention', audience: 'lapsed subscribers', channels: ['owned-social', 'owned-web', 'email', 'paid-media'], message: 'return and routine', measure: 'Reactivations and 90-day retention', until: '2027-03-31' },
    evaluation: [
      { outcome: 'Reactivations among lapsed accounts', measure: 'Against a held-out 10% of lapsed accounts', baseline: 'Natural return rate, about 2% a month', limit: 'Any offer change will confound the campaign effect unless tested separately.' },
      { outcome: '90-day retention of reactivated accounts', measure: 'Cohort retention', baseline: '2025 trial cohort, 27% conversion', limit: 'Different audience; a comparison, not a target.' },
      { outcome: 'Recognition of the routine', measure: 'Short survey of returners', baseline: 'None', limit: 'Self-report.' },
    ],
    strengths: [
      { statement: 'A sound signature parents remember.', sources: ['fw-sound-logo', 'fw-interviews-2026'] },
      { statement: 'A clear position, the calm option at bedtime, that lapsed parents still use to describe it.', sources: ['fw-strategy-2024', 'fw-guidelines-v3', 'fw-interviews-2026'] },
      { statement: 'A handmade paper-cut language people recognise, already spreading into the product.', sources: ['fw-small-hours-hero', 'fw-onboarding-papercut'] },
    ],
    questions: [
      'Does the illustrator agreement cover the paper-cut style, or only the 2025 artworks?',
      'Will the company test a reactivation offer before or alongside the campaign?',
      'Which rule governs a lifecycle email that is also brand work: no screens, or lead with the screen?',
    ],
    milestones: [{ date: '2026-11-20', label: 'Concept review' }, { date: '2026-12-08', label: 'Brief sign-off' }, { date: '2027-01-12', label: 'Launch' }],
    team: ['Creative director', 'Copywriter, two days a week'],
  },
  'eng-brightloop': {
    id: 'eng-brightloop', brandId: 'brightloop', clientLabel: 'Brightloop',
    practitioner: 'Freelance creative director', role: 'Concept consultant',
    project: 'Holiday concepts', purpose: 'Concept routes for a holiday campaign.',
    grant: { brandId: 'brightloop', powers: ['read'], expires: '2026-10-30', revokedAt: '2026-10-30' },
    workTypes: ['Brand campaign'], channels: ['paid-media'], asOf: '2026-11-11',
    milestones: [{ date: '2026-12-01', label: 'Launch' }], team: ['Concept consultant'],
  },
};

// An agency workspace that holds both clients. The coordination view must
// show dates and people, never strategy.
export const agency = {
  id: 'northbound', name: 'Northbound Studio',
  engagements: [
    { id: 'nb-fernway', brandId: 'fernway', clientLabel: 'Client A', milestones: [{ date: '2026-11-20', label: 'Concept review' }, { date: '2027-01-12', label: 'Launch' }], team: ['Lead designer', 'Producer'], strategy: 'Win back lapsed subscribers' },
    { id: 'nb-brightloop', brandId: 'brightloop', clientLabel: 'Client B', milestones: [{ date: '2026-12-01', label: 'Launch' }], team: ['Lead designer', 'Illustrator'], strategy: 'Conquest of a competitor\'s lapsed subscribers' },
  ],
};

// Connections, labelled by what actually exists in this build.
export const connections = [
  { name: 'Manual source notes and file references', state: 'working', note: 'How material enters this build.' },
  { name: 'Frontify MCP server', state: 'proposed', note: 'Official beta; 52 tools including writes. Read guidelines and assets; never write from an engagement.' },
  { name: 'Figma MCP server', state: 'proposed', note: 'Read design context from files the client shares. Writes need a paid seat.' },
  { name: 'Google Drive, Box, Notion', state: 'proposed', note: 'Read-only discovery of selected folders, with provenance attached.' },
  { name: 'Typeface Arc Graph', state: 'proposed', note: 'Where a client already runs it, read its rules rather than duplicate them.' },
  { name: 'Frontier model reasoning', state: 'simulated', note: 'Interpretation here is deterministic and authored. No model is called.' },
  { name: 'Publishing and distribution', state: 'excluded', note: 'An engagement never publishes. Publishing stays with the company\'s own tools.' },
];
