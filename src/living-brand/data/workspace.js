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
    searchHint: 'paper-cut bedtime',
    project: 'Small Hours, return season',
    purpose: 'Bring lapsed subscribers back to the bedtime routine this winter, without repeating last year\'s acquisition campaign.',
    invitedBy: 'priya', mode: 'investigation', modesCompleted: ['orientation'],
    scope: 'Campaign concept and brief. Brand knowledge may be read and proposals made; nothing is adopted or published from this engagement.',
    constraints: ['Launch 12 January 2027', 'Owned channels plus paid social', 'Budget roughly a third of 2025'],
    started: '2026-11-02', asOf: '2026-11-11',
    grant: { brandId: 'fernway', powers: ['read', 'propose', 'share'], expires: '2027-03-31', revokedAt: null },
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
    carry: {
      precedentId: 'fw-small-hours-brief',
      also: ['fw-sound-logo'],
      reverseReason: 'Written to introduce Fernway to strangers (acquisition). Lapsed parents already know it; the message has to speak to return and routine (retention).',
      evidenceNote: 'Last year\'s 18% rise in trial starts was measured on strangers, without a control, during a price promotion. It says little about lapsed subscribers and sets no expectation for this brief.',
    },
    hypotheses: [
      {
        id: 'h-offer', decision: 'offer', title: 'The retention problem may be an offer problem before it is a campaign problem',
        statement: 'Churn rose after the March price rise, and most lapsed parents interviewed named price. Another acquisition campaign would refill a leaking plan.',
        evidenceIds: ['e-churn', 'e-int-price', 'e-sh-conversion'], requires: ['e-churn', 'e-int-price'],
        uncertainty: 'Twelve interviews and a correlation in time. The free tier, a seasonal pattern or the video change could explain part of it. Not proof of cause.',
        test: 'A reactivation offer to a held-out sample of lapsed accounts before the campaign launches.',
      },
      {
        id: 'h-trust', decision: 'claims', title: 'Confusion about ads is a trust problem the work can repair',
        statement: 'Some lapsed parents believe ads will reach the paid plan. The old "Ad-free, always" claim makes the confusion worse.',
        evidenceIds: ['e-int-ads'], requires: ['e-int-ads'],
        uncertainty: '5 of 12 interviews. Size in the subscriber base unknown.',
        test: 'A clear plan comparison on the cancellation page, measured against cancellation rate.',
      },
    ],
    reading: {
      orient: { headline: 'Fernway wants to be the calm part of a family evening', deck: 'The chief executive set that intent in 2024 and the 2023 guidelines are built on it. Since then the price rose, an ad-supported tier launched and bedtime mode added video. The question for this engagement is whether the work and the offer still keep the promise.' },
      interpret: { headline: 'Last year\'s campaign worked for strangers. This year\'s audience already left.', deck: 'Small Hours was built to introduce Fernway. The return season has to bring back people who know it and chose to go. Some of it carries forward; some of it has to be turned around.', carryHeading: 'What carries forward from Small Hours', carryColumns: ['2025', 'Return season'] },
      transfer: { headline: 'Leave Fernway more capable than you found it', deck: 'The engagement package belongs to Fernway. It keeps the sources with their provenance, the interpretation, every choice and proposal, and the questions still open, so the next person starts here instead of from the archive.' },
    },
    suggestedChoices: [
      { subject: 'Paper-cut visual language', verdict: 'preserve', rationale: 'Lapsed parents recognise it; it signals the calm Fernway they remember. Conditional on extending the illustration licence to owned channels.', sources: ['fw-small-hours-hero', 'fw-interviews-2026'], needs: 'rights' },
      { subject: 'Three-note chime', verdict: 'preserve', rationale: 'Canon, cleared everywhere, and the most remembered element.', sources: ['fw-sound-logo'] },
      { subject: 'Copy strategy', verdict: 'evolve', rationale: 'From "Discover the small hours" to returning to a routine the family already had.', sources: ['fw-small-hours-film', 'fw-interviews-2026'] },
      { subject: '"Ad-free, always" and "Screen-free bedtime"', verdict: 'repair', rationale: 'Both are untrue since April and July. Replace with a plain statement of what each plan includes.', sources: ['fw-small-hours-endcard', 'fw-website-home', 'fw-pricing-2026'], needs: 'claims' },
      { subject: 'Reactivation offer before the campaign', verdict: 'invent', rationale: 'Price was the reason most often given for leaving. Test an offer on a held-out group so the campaign\'s effect can be read separately.', sources: ['fw-interviews-2026', 'fw-pricing-2026'], needs: 'offer' },
      { subject: 'Hero screens in lifecycle email', verdict: 'investigate', rationale: 'The guidelines and the playbook disagree about hero screens in customer campaigns. Ask the owners to scope them before email design starts.', sources: ['fw-guidelines-v3', 'fw-pm-playbook-2025'], needs: 'standing.visual' },
    ],
    partner: { id: 'lp-agent', name: 'Landing page agent, external', assignment: 'Return-season landing page', channels: ['owned-web'], workTypes: ['Customer campaign'], expires: '2026-12-31' },
    questions: [
      'Does the illustrator agreement cover the paper-cut style, or only the 2025 artworks?',
      'Will the company test a reactivation offer before or alongside the campaign?',
      'Which rule governs a lifecycle email that is also brand work: no screens, or lead with the screen?',
    ],
    milestones: [{ date: '2026-11-20', label: 'Concept review' }, { date: '2026-12-08', label: 'Brief sign-off' }, { date: '2027-01-12', label: 'Launch' }],
    team: ['Creative director', 'Copywriter, two days a week'],
  },
};

// An engagement that has ended is a line in the practitioner's history: who,
// in what role, and when access ended. Nothing else about it is kept here.
export const closed = [
  { id: 'eng-brightloop', clientLabel: 'Brightloop', role: 'Concept consultant', brandId: 'brightloop', grant: { brandId: 'brightloop', revokedAt: '2026-10-30' } },
];

// An agency workspace that holds both clients. The coordination view must
// show dates and people, never strategy.
export const agency = {
  id: 'northbound', name: 'Northbound Studio',
  engagements: [
    { id: 'nb-client-a', clientLabel: 'Client A', milestones: [{ date: '2026-11-20', label: 'Concept review' }, { date: '2027-01-12', label: 'Launch' }], team: ['Lead designer', 'Producer'] },
    { id: 'nb-client-b', clientLabel: 'Client B', milestones: [{ date: '2026-12-01', label: 'Launch' }], team: ['Lead designer', 'Illustrator'] },
  ],
};

// What a visitor should know about this page before trusting anything on it.
export const note = 'Everything on this page is fictional. The material was entered by hand, the reading was written by a person, no model is called, and nothing is published.';
