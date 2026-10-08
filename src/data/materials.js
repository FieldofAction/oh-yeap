// Working vocabularies for Materials in Relation, not exhaustive taxonomies.
export const MATERIAL_DOMAINS = [
  {
    id: 'physical', name: 'Physical', center: 'Making', practice: 'Observe · handle · construct',
    note: 'The seven workshop materials in Gropius’s curriculum diagram, used here as a starting vocabulary. Color is a perceptual study as well as a material practice.',
    items: [
      { id: 'stone', name: 'Stone', behavior: 'Mass, grain, hardness, thermal behavior.', resistance: 'Weight and extraction carry costs; permanence can make adaptation difficult.', move: 'Compare a fixed boundary with a movable one.', question: 'What should endure, and what needs to remain changeable?' },
      { id: 'wood', name: 'Wood', behavior: 'Grain, stiffness, joinery, wear.', resistance: 'Species, finish, moisture, and construction change its behavior.', move: 'Rearrange a set of wooden seats without changing the room.', question: 'Which arrangement supports approach, rest, or withdrawal?' },
      { id: 'metal', name: 'Metal', behavior: 'Strength, ductility, conductivity, reflection.', resistance: 'Edges, heat, resonance, and weight require specific attention.', move: 'Compare two joints: one permanent, one reversible.', question: 'Where does a connection need strength, flexibility, or release?' },
      { id: 'textiles', name: 'Textiles', behavior: 'Weave, stretch, drape, porosity, sound absorption.', resistance: 'A fabric can filter without fully separating; performance depends on construction.', move: 'Try a permeable screen in place of a solid partition.', question: 'What should pass through this boundary?' },
      { id: 'color', name: 'Color', behavior: 'Contrast, adjacency, light, perceptual emphasis.', resistance: 'Perception varies with lighting, context, and the observer.', move: 'Change one contrast while preserving the other cues.', question: 'What becomes easier to notice, and for whom?' },
      { id: 'glass', name: 'Glass', behavior: 'Transparency, reflection, refraction, brittleness.', resistance: 'Visibility can coexist with physical exclusion; glare can obscure.', move: 'Compare clear, translucent, and opaque boundaries.', question: 'Who can see, enter, and choose privacy?' },
      { id: 'clay', name: 'Clay', behavior: 'Plasticity, moisture, shrinkage, hardening.', resistance: 'Firing commits a form; later revision has different costs.', move: 'Make and revise a form before fixing it.', question: 'When should a decision become durable?' },
    ],
  },
  {
    id: 'digital', name: 'Digital', center: 'Interaction', practice: 'Specify · respond · adapt',
    note: 'A working vocabulary informed by Google’s Material Design. This circular chart is our interpretation, not an official Google diagram.',
    items: [
      { id: 'surface', name: 'Surface', behavior: 'Layer, elevation, containment, affordance.', resistance: 'Visual depth can suggest actions that the system does not support.', move: 'Clarify which surface can be acted on and what lies behind it.', question: 'Can someone tell what is available before acting?' },
      { id: 'color', name: 'Color', behavior: 'Emphasis, grouping, contrast, state.', resistance: 'Color alone cannot carry essential information for everyone.', move: 'Pair a state color with an explicit text label.', question: 'Does the meaning survive when the color cue is unavailable?' },
      { id: 'typography', name: 'Typography', behavior: 'Hierarchy, reading pace, density, voice.', resistance: 'Small type and fixed measures can exclude readers.', move: 'Rewrite and resize one invitation at its actual reading distance.', question: 'Is the next action understandable without prior knowledge?' },
      { id: 'shape', name: 'Shape', behavior: 'Contour, grouping, boundaries, recognition.', resistance: 'Similar shapes can imply equivalent behavior when none exists.', move: 'Compare how two control shapes communicate the same action.', question: 'Does the form accurately promise its behavior?' },
      { id: 'layout', name: 'Layout', behavior: 'Sequence, spacing, proximity, orientation.', resistance: 'A visible route may still hide alternatives or impose a hierarchy.', move: 'Make entry, pause, and exit equally findable.', question: 'Which path is privileged by this arrangement?' },
      { id: 'motion', name: 'Motion', behavior: 'Duration, continuity, direction, change.', resistance: 'Movement can distract or discomfort; reduced motion needs an equivalent cue.', move: 'Make a state change legible with and without animation.', question: 'Does the transition explain what changed?' },
      { id: 'state', name: 'State', behavior: 'Readiness, progress, error, recovery, persistence.', resistance: 'A displayed state can misrepresent what the system has actually done.', move: 'Expose waiting, failure, and recovery alongside success.', question: 'Does the interface tell the truth about what is happening?' },
    ],
  },
  {
    id: 'relational', name: 'Relational', center: 'Possibility', practice: 'Attend · invite · respond',
    note: 'Provisional qualities of interaction. These are things to notice and work with; their effects depend on participants, history, power, and setting.',
    items: [
      { id: 'presence', name: 'Presence', behavior: 'Availability, acknowledgment, absence, shared attention.', resistance: 'Being visible can become surveillance; absence need not mean disengagement.', move: 'Offer a way to signal availability without requiring continuous visibility.', question: 'Who can be present on their own terms?' },
      { id: 'attention', name: 'Attention', behavior: 'Focus, interruption, distribution, recovery.', resistance: 'Attention is finite and unevenly available; capture can displace care.', move: 'Remove one interruption and watch what becomes easier to notice.', question: 'Whose attention is being asked for, and at what cost?' },
      { id: 'tone', name: 'Tone', behavior: 'Register, warmth, directness, implied expectation.', resistance: 'The same expression can carry different meanings across relationships.', move: 'Compare two invitations with participants, preserving a real option to decline.', question: 'Does this sound like an invitation or an obligation?' },
      { id: 'rhythm', name: 'Rhythm', behavior: 'Pace, turn-taking, pauses, repetition.', resistance: 'One person’s useful tempo can exhaust or exclude another.', move: 'Add a pause before asking for a response.', question: 'Who gains room, and who loses continuity?' },
      { id: 'proximity', name: 'Proximity', behavior: 'Distance, access, intimacy, exposure.', resistance: 'Closeness is not always welcome; visibility and access are different.', move: 'Offer several degrees of closeness and a legible way to leave.', question: 'Can people adjust their distance without penalty?' },
      { id: 'feedback', name: 'Feedback', behavior: 'Response, delay, interpretation, correction.', resistance: 'Feedback can discipline people into pleasing the system; silence is ambiguous.', move: 'Ask what a response means to its recipient before tuning its intensity.', question: 'Who can correct the system, and does it respond?' },
      { id: 'participation', name: 'Participation', behavior: 'Invitation, permission, contribution, refusal, withdrawal.', resistance: 'Formal access does not ensure felt permission or shared power.', move: 'Make observing, contributing, and declining legitimate options.', question: 'Who decides the terms, and who can change them?' },
    ],
  },
];

export const CONNECTION_STUDIES = [
  { id: 'invitation', name: 'Invitation', selected: { physical: 'wood', digital: 'layout', relational: 'participation' },
    question: 'What makes entering possible without making participation compulsory?',
    connection: 'The arrangement of seats, the route through an arrival page, and a host’s invitation may all influence how someone enters a gathering.',
    limit: 'An open seat and an available button do not establish felt permission. Ask how the invitation was experienced.' },
  { id: 'rhythm', name: 'Rhythm', selected: { physical: 'textiles', digital: 'motion', relational: 'rhythm' },
    question: 'What pace lets different participants stay with the experience?',
    connection: 'Acoustic conditions, interface transitions, and pauses between turns may together affect the pace people can sustain.',
    limit: 'These timings are not equivalent. A quieter room or slower animation may help one person and hinder another.' },
  { id: 'feedback', name: 'Feedback', selected: { physical: 'metal', digital: 'state', relational: 'feedback' },
    question: 'How does a response become legible and open to correction?',
    connection: 'A joint’s movement, a visible system state, and a person’s reply each provide information about a connection.',
    limit: 'This begins as an analogy. Mechanical resistance, software status, and someone’s account require different forms of interpretation.', status: 'analogy' },
  { id: 'boundaries', name: 'Boundaries', selected: { physical: 'glass', digital: 'surface', relational: 'proximity' },
    question: 'Who can control what is visible, accessible, or private?',
    connection: 'A glass partition, a digital permission boundary, and a norm about personal space can expose or protect different parts of an experience.',
    limit: 'Transparency does not guarantee access, consent, or trust. Check who can change each boundary.' },
];

export const STUDY_FIELDS = [
  ['situation', 'Situation'], ['intention', 'What should become possible, and for whom?'],
  ['participants', 'People, systems, and surroundings'], ['power', 'Who sets the terms?'],
  ['physicalNote', 'Physical condition'], ['digitalNote', 'Digital condition'], ['relationalNote', 'Relational condition'],
  ['connection', 'Proposed connection'], ['change', 'One change to try'], ['expectation', 'What do you expect, and why?'],
  ['notice', 'What would support or challenge that expectation?'], ['review', 'When and with whom will you review?'],
  ['stop', 'What would make you stop or reverse the change?'],
  ['observation', 'What actually happened?'], ['accounts', 'What did participants say?'],
  ['surprise', 'Unexpected effects, costs, or disagreement'], ['revision', 'What will you keep, change, or stop?'],
];

export function blankStudy() {
  return { version: 1, ...Object.fromEntries(STUDY_FIELDS.map(([key]) => [key, ''])),
    selected: { physical: 'wood', digital: 'layout', relational: 'participation' },
    connectionStatus: 'hypothesis', history: [] };
}

export const INVITATION_EXAMPLE = {
  ...blankStudy(),
  situation: 'A small public gathering. Some people arrive alone and do not know the host.',
  intention: 'Let a newcomer choose to join, observe, or leave without needing an introduction.',
  participants: 'Newcomers, returning guests, host, arrival page, seating, doorway, background noise. Check physical access with the venue.',
  power: 'The host controls seating and introductions. Returning guests already know the social rules. Ask newcomers how they want to enter; declining is a valid outcome.',
  physicalNote: 'Wooden chairs arranged with a visible opening and room to sit at the edge.',
  digitalNote: 'The arrival page shows where to go, what to expect, and that observing is welcome.',
  relationalNote: 'The host offers an introduction and accepts a no without explanation.',
  connection: CONNECTION_STUDIES[0].connection,
  change: 'At the next gathering, offer a choice to join a conversation or settle in quietly. Keep the page and seating unchanged for this first trial.',
  expectation: 'An explicit choice may reduce uncertainty for people arriving alone. The existing seating and page may support or contradict that choice.',
  notice: 'Notice requests for clarification and whether offered choices are usable. Invite voluntary feedback about pressure or ease. Do not treat silence, leaving, or joining as proof of comfort.',
  review: 'After the gathering, with the host and any guests who choose to share an account.',
  stop: 'Stop the invitation if it draws unwanted attention to someone. Respect refusal immediately.',
};

export function materialName(domain, id) {
  return MATERIAL_DOMAINS.find(d => d.id === domain)?.items.find(m => m.id === id)?.name || '';
}

// Stored notes are untrusted input; ignore unknown fields and malformed versions.
export function normalizeStudy(value, includeHistory = true) {
  if (!value || value.version !== 1) return blankStudy();
  const result = blankStudy();
  for (const [key] of STUDY_FIELDS) if (typeof value[key] === 'string') result[key] = value[key].slice(0, 20000);
  for (const domain of MATERIAL_DOMAINS) {
    if (domain.items.some(item => item.id === value.selected?.[domain.id])) result.selected[domain.id] = value.selected[domain.id];
  }
  if (['analogy', 'hypothesis', 'observation'].includes(value.connectionStatus)) result.connectionStatus = value.connectionStatus;
  if (includeHistory && Array.isArray(value.history)) result.history = value.history.filter(h => h && typeof h.recordedAt === 'string' && h.version === 1).map(h => ({ ...normalizeStudy(h, false), recordedAt: h.recordedAt }));
  return result;
}

export function studyMarkdown(study) {
  const body = record => [
    `Connection status: ${record.connectionStatus}`,
    MATERIAL_DOMAINS.map(d => `${d.name}: ${materialName(d.id, record.selected[d.id])}`).join('\n\n'),
    ...STUDY_FIELDS.map(([key, label]) => `### ${label}\n\n${record[key].trim() || 'Not yet recorded.'}`),
  ].join('\n\n');
  return `# Materials in Relation\n\nField of Action · Working study\n\n${body(study)}\n\n` +
    study.history.map((h, i) => `## Recorded iteration ${i + 1}\n\n${h.recordedAt}\n\n${body(h)}`).join('\n\n') +
    '\n\nInstrument: https://www.fieldofaction.org/#relational-design\n';
}
