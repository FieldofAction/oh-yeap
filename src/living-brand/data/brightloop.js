// Brightloop is a fictional ad-supported streaming service and a direct
// competitor of Fernway. It exists to test client separation: its material
// deliberately shares vocabulary with Fernway's (paper-cut, bedtime, moon).

export const brightloop = {
  id: 'brightloop',
  name: 'Brightloop',
  summary: 'Free, ad-supported streaming for families.',
  intent: { statement: 'Free family entertainment that earns its place on the shared television.', owner: 'maya', effective: { from: '2025-01-01' }, source: 'bl-lanterns-brief' },
  people: {
    maya: { name: 'Maya Chen', title: 'Chief marketing officer' },
    ravi: { name: 'Ravi Patel', title: 'Brand director' },
  },
  authority: { 'standing.visual': ['ravi'], 'standing.verbal': ['ravi'], claims: ['maya'], rights: ['maya'], offer: ['maya'], publish: ['ravi'] },
  facts: [],
  claims: [],
  rules: [
    { id: 'bl-r-moon', topic: 'hero.moon', value: 'always', statement: 'Holiday work features the Brightloop lantern moon.', source: 'bl-lanterns-brief', scope: ['all'], effective: { from: '2026-09-01' }, owner: 'ravi', standing: 'canon', domain: 'visual' },
  ],
  items: [
    {
      id: 'bl-lanterns-brief', title: 'Lanterns, holiday campaign brief', kind: 'Brief', workType: 'Brand campaign', element: 'Brief',
      canvas: 'Document', audience: 'Agency', intendedOutcome: 'Win Fernway lapsed subscribers with a free bedtime offer', level: 'campaign', period: { from: '2026-09-01' },
      exposure: 'Confidential', made: { by: 'Maya Chen', date: '2026-09-01' }, rationale: 'Target parents leaving Fernway after its price rise; borrow a handmade paper-cut look.',
      provenance: { source: 'Brightloop shared drive', origin: 'human', confidential: true }, pipeline: 'approved', standing: 'precedent', domain: 'verbal',
      rights: { status: 'cleared', channels: ['internal'] }, approval: { status: 'approved', by: 'maya', date: '2026-09-01' },
      evidence: [], relations: [], tags: ['paper-cut', 'bedtime', 'moon', 'lapsed', 'conquest', 'small hours', 'lanterns'], visual: { motif: 'papercut', tone: 'amber' },
      text: 'Conquest campaign aimed at Fernway lapsed subscribers. Paper-cut bedtime moon. Free bedtime stories. Launch 1 December.',
    },
    {
      id: 'bl-media-plan', title: 'Lanterns, media plan', kind: 'Media plan', workType: 'Brand campaign', element: 'Spend and flighting',
      canvas: 'Spreadsheet', audience: 'Media agency', intendedOutcome: 'Reach parents in December', level: 'campaign', period: { from: '2026-10-01' },
      exposure: 'Confidential', made: { by: 'Brightloop media', date: '2026-10-01' }, rationale: '$4.2M across connected TV and social, heavy in the first two weeks of December.',
      provenance: { source: 'Brightloop shared drive', origin: 'human', confidential: true }, pipeline: 'approved', standing: 'operational', domain: 'product',
      rights: { status: 'cleared', channels: ['internal'] }, approval: { status: 'approved', by: 'maya', date: '2026-10-01' },
      evidence: [], relations: [], tags: ['media', 'budget', 'december', 'bedtime'], visual: { motif: 'chart', tone: 'amber' },
      text: 'Bedtime media plan. 4.2 million dollars. Connected TV and social. December.',
    },
    {
      id: 'bl-lantern-key', title: 'Lanterns, key visual draft', kind: 'Illustration', workType: 'Brand campaign', element: 'Key visual',
      canvas: 'Connected TV and social', audience: 'Parents', intendedOutcome: 'Free bedtime story starts', level: 'campaign', period: { from: '2026-10-20' },
      exposure: 'Confidential', made: { by: 'Northbound Studio', date: '2026-10-20' }, rationale: 'Paper-cut lantern moon over rooftops.',
      provenance: { source: 'Northbound Studio, Brightloop workspace', origin: 'human', confidential: true }, pipeline: 'interpreted', standing: 'experiment', domain: 'visual',
      rights: { status: 'cleared', channels: ['paid-media', 'owned-social'] }, approval: { status: 'pending' },
      evidence: [], relations: [{ type: 'part of', to: 'bl-lanterns-brief' }], tags: ['paper-cut', 'moon', 'bedtime', 'illustration'], visual: { motif: 'papercut', tone: 'amber' },
      text: 'Paper-cut lantern moon over rooftops. Bedtime.',
    },
  ],
};

// The engagement that once opened this brand. It has ended; tests use it to prove it stays closed.
export const brightloopEngagement = {
    id: 'eng-brightloop', brandId: 'brightloop', clientLabel: 'Brightloop',
    practitioner: 'Freelance creative director', role: 'Concept consultant',
    project: 'Holiday concepts', purpose: 'Concept routes for a holiday campaign.',
    grant: { brandId: 'brightloop', powers: ['read'], expires: '2026-10-30', revokedAt: '2026-10-30' },
    workTypes: ['Brand campaign'], channels: ['paid-media'], asOf: '2026-11-11',
    milestones: [{ date: '2026-12-01', label: 'Launch' }], team: ['Concept consultant'],
  };
