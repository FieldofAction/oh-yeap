// Governance: how knowledge gains, keeps and loses standing. State is plain
// data; every function returns a new state and never mutates its input.
// Authority comes from the brand, not from the engagement or the viewer.
// Where the brand has named no one, nothing can be adopted or retired.

import { STANDING_CLASSES, pipelineRank, isPublicStudy } from './standing.js';
import { POWERS } from './inquiry.js';

export class AuthorityError extends Error {}

const clone = s => JSON.parse(JSON.stringify(s));
const nextId = (s, prefix, asOf) => { s.seq = (s.seq || 0) + 1; return `${prefix}-${asOf}-${s.seq.toString(36)}`; };

export function canDecide(brand, personId, power) {
  return ((brand.authority || {})[power] || []).includes(personId);
}

export const powerFor = item => `standing.${item.domain || 'visual'}`;

export function deciders(brand, power) {
  return ((brand.authority || {})[power] || []).map(id => ({ id, name: brand.people?.[id]?.name || id }));
}

const refusal = (brand, by, item) => {
  const power = powerFor(item);
  const who = deciders(brand, power).map(p => p.name);
  const area = `${(item.domain || 'visual').replace(/^./, c => c.toUpperCase())} standing at ${brand.name}`;
  const actor = brand.people?.[by]?.name || (by === 'practitioner' ? 'The practitioner' : 'This viewer');
  if (!who.length) {
    return `${actor} cannot change the standing of ${item.title}. No one has been named to decide ${area.toLowerCase()}${isPublicStudy(brand) ? `, and a public-source study cannot name them. Only ${brand.name} can.` : '.'}`;
  }
  return `${actor} cannot change the standing of ${item.title}. ${area} is decided by ${who.join(' or ')}.`;
};

// Anyone with the propose grant may propose. Proposing changes nothing.
export function propose(state, { itemId, to, rationale, evidenceIds = [], by, scope, asOf }) {
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  if (!STANDING_CLASSES[to]) throw new Error(`Unknown standing ${to}.`);
  if (!s.engagement.grant?.powers?.includes('propose')) throw new AuthorityError('This engagement may read, not propose.');
  if (s.proposals.some(p => p.itemId === itemId && p.to === to && p.status === 'open')) throw new Error(`An open proposal already asks for ${item.title} to become ${STANDING_CLASSES[to].name.toLowerCase()}.`);
  if (item.standing === to) throw new Error(`${item.title} already has that standing.`);
  const allEvidence = s.brand.items.flatMap(i => (i.evidence || []).map(e => ({ ...e, on: i.id, origin: i.provenance?.origin })));
  const cited = allEvidence.filter(e => evidenceIds.includes(e.id));
  const warnings = [];
  const independent = cited.filter(e => e.origin !== 'generated' && e.basis !== 'reuse');
  if (to === 'canon') {
    if (!independent.length) warnings.push('No independent evidence. Repetition and reuse are not evidence.');
    if (cited.length && cited.every(e => ['reported', 'company_reported'].includes(e.basis))) warnings.push('All cited evidence is self-reported.');
    if (item.rights?.status !== 'cleared') warnings.push(`Rights are ${item.rights?.status || 'unknown'}; canon that cannot be used is a trap.`);
    if (item.reuse?.length && !independent.length) warnings.push(`Reused ${item.reuse.length} times. Frequency is a reason to review, not a reason to adopt.`);
    if (pipelineRank(item.pipeline) < pipelineRank('verified')) warnings.push(`Only ${item.pipeline}. Check it against its source before it governs anything.`);
  }
  const reviewer = (s.brand.authority || {})[powerFor(item)] || [];
  if (!reviewer.length) warnings.push('No one is named to decide this. The proposal waits until someone is.');
  s.proposals.push({
    id: nextId(s, 'p', asOf), itemId, from: item.standing, to, rationale, evidenceIds, by, scope, date: asOf,
    status: 'open', warnings, reviewer,
  });
  return s;
}

// Only the brand's named authority can adopt, reject or revise.
export function decide(state, proposalId, { by, outcome, note, effectiveFrom, asOf }) {
  const s = clone(state);
  const p = s.proposals.find(x => x.id === proposalId);
  if (!p) throw new Error('No such proposal.');
  if (p.status !== 'open') throw new Error('Proposal already decided.');
  const item = s.brand.items.find(i => i.id === p.itemId);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(refusal(s.brand, by, item));
  if (item.standing !== p.from) throw new Error(`${item.title} changed standing after this proposal was made. Review it again.`);
  if (!['adopt', 'reject', 'revise'].includes(outcome)) throw new Error('Outcome must be adopt, reject or revise.');
  const decision = { id: nextId(s, 'd', asOf), proposalId, itemId: item.id, outcome, by, note, date: asOf, from: item.standing, to: outcome === 'adopt' ? p.to : item.standing, evidenceIds: p.evidenceIds, scope: p.scope };
  if (outcome === 'adopt') {
    item.standingHistory = [...(item.standingHistory || []), { standing: item.standing, record: item.standingRecord || null, until: effectiveFrom || asOf }];
    item.standing = p.to;
    item.standingRecord = { by, date: effectiveFrom || asOf, scope: p.scope, decisionId: decision.id, evidenceIds: p.evidenceIds, rationale: p.rationale, basis: 'decision' };
  }
  p.status = outcome === 'adopt' ? 'adopted' : outcome === 'reject' ? 'rejected' : 'revise';
  s.decisions.push(decision);
  return s;
}

export function retire(state, itemId, { by, reason, asOf }) {
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(refusal(s.brand, by, item));
  item.standingHistory = [...(item.standingHistory || []), { standing: item.standing, record: item.standingRecord || null, until: asOf }];
  item.standing = 'archive';
  item.standingRecord = { by, date: asOf, scope: `Retired: ${reason}`, basis: 'decision' };
  s.decisions.push({ id: nextId(s, 'd', asOf), itemId, outcome: 'retire', by, note: reason, date: asOf });
  return s;
}

// Reuse is recorded for review. It never changes standing.
export function recordReuse(state, itemId, { where, asOf }) {
  if (!String(where || '').trim()) throw new Error('Say where it was reused.');
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  item.reuse = [...(item.reuse || []), { date: asOf, where: String(where).trim() }];
  return s;
}

// Checking a record against its source moves it to "verified" and records who
// checked and how. It is not approval: approval stays with the brand's authority.
export function verifyItem(state, itemId, { by, how, asOf }) {
  if (!String(how || '').trim()) throw new Error('Say what you checked it against.');
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  if (pipelineRank(item.pipeline) >= pipelineRank('verified')) throw new Error(`${item.title} is already ${item.pipeline}.`);
  if (item.pipeline === 'discovered') throw new Error(`${item.title} has only been found. Record what it is before checking it.`);
  item.pipelineHistory = [...(item.pipelineHistory || []), { stage: item.pipeline, until: asOf }];
  item.pipeline = 'verified';
  item.verification = { by, how: String(how).trim(), date: asOf };
  return s;
}

// Approval is the company saying a piece of material may be used. Only the
// person named for its area can give it, and only for material that has been
// understood. It does not make the material canon.
export function approveItem(state, itemId, { by, note, asOf }) {
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(refusal(s.brand, by, item).replace('change the standing of', 'approve'));
  if (item.pipeline === 'discovered') throw new Error(`${item.title} has only been found. Record what it is before approving it.`);
  if (item.approval?.status === 'approved') throw new Error(`${item.title} is already approved.`);
  item.pipelineHistory = [...(item.pipelineHistory || []), { stage: item.pipeline, until: asOf }];
  item.pipeline = 'approved';
  item.approval = { status: 'approved', by, date: asOf, note: note || '' };
  s.decisions.push({ id: nextId(s, 'd', asOf), itemId, outcome: 'approve', by, note: note || '', date: asOf });
  return s;
}

// Progressive intake: a source note enters as discovered or extracted, with
// where it was found. It can never arrive verified, approved or as canon.
const INTAKE_STAGES = ['discovered', 'extracted', 'interpreted'];
export function addSourceNote(state, note, { by, asOf }) {
  const title = String(note.title || '').trim();
  const source = String(note.foundIn || '').trim();
  if (!title) throw new Error('A source note needs a title.');
  if (!source) throw new Error('Say where it was found.');
  const pipeline = note.pipeline || 'discovered';
  if (!INTAKE_STAGES.includes(pipeline)) throw new Error(`New material enters as ${INTAKE_STAGES.join(', ')}; ${pipeline} has to be earned.`);
  const standing = note.standing || 'archive';
  if (standing === 'canon') throw new Error('New material cannot arrive as canon. Propose it once it is understood.');
  if (!STANDING_CLASSES[standing]) throw new Error(`Unknown standing ${standing}.`);
  const s = clone(state);
  const id = nextId(s, `${s.tenant}-note`, asOf);
  s.brand.items.push({
    id, _tenant: s.tenant, title, kind: note.kind || 'Source note', workType: note.workType || 'Unknown', element: note.element || 'Unknown',
    canvas: note.canvas || 'Unknown', audience: note.audience || 'Unknown', intendedOutcome: note.intendedOutcome || 'Unknown', level: note.level || 'execution',
    period: note.from ? { from: note.from } : {}, exposure: note.exposure || 'Unknown', made: { by: note.madeBy || 'Unknown', date: note.from || null },
    rationale: note.rationale || '', provenance: { source, origin: note.origin === 'generated' ? 'generated' : 'human', addedBy: by, addedOn: asOf },
    pipeline, standing, domain: note.domain || 'visual',
    rights: { status: 'unknown', channels: [], note: note.rightsNote || 'Not reviewed.' }, approval: { status: 'none' },
    evidence: [], relations: [], tags: note.tags || [], sources: note.url ? [{ url: note.url, publisher: note.publisher || '', date: note.sourceDate || '', basis: 'recorded-by-practitioner' }] : [],
    visual: { motif: 'document', tone: 'paper' }, text: String(note.text || '').trim(),
  });
  return s;
}

// The company says who decides. In an engagement this needs the steward power,
// which a visiting practitioner does not have and a public-source study never has.
export function nameAuthority(state, { power, person, by, asOf }) {
  if (!POWERS[power]) throw new Error(`Unknown area ${power}.`);
  if (!state.engagement.grant?.powers?.includes('steward')) throw new AuthorityError(`Only ${state.brand.name} can name who decides ${POWERS[power]}. This engagement cannot.`);
  if (!person?.id || !person?.name) throw new Error('Name the person.');
  const s = clone(state);
  s.brand.people = { ...(s.brand.people || {}), [person.id]: { ...(s.brand.people?.[person.id] || {}), name: person.name, title: person.title || s.brand.people?.[person.id]?.title || '' } };
  s.brand.authority = { ...(s.brand.authority || {}) };
  s.brand.authority[power] = [...new Set([...(s.brand.authority[power] || []), person.id])];
  s.decisions.push({ id: nextId(s, 'd', asOf), outcome: 'name-authority', power, person: person.id, by, date: asOf, note: `${person.name} named to decide ${POWERS[power]}.` });
  // Choices and proposals that were waiting for an owner now have one.
  for (const c of s.choices) if (c.needs === power && !c.owner) c.owner = person.id;
  for (const p of s.proposals) {
    const item = s.brand.items.find(i => i.id === p.itemId);
    if (p.status === 'open' && item && powerFor(item) === power) { p.reviewer = s.brand.authority[power]; p.warnings = p.warnings.filter(w => !/No one is named/.test(w)); }
  }
  return s;
}

// The practitioner's engagement choices. A choice is a record, not a change
// to the company's knowledge; changes to standing go through propose/decide.
export const CHOICES = {
  preserve: 'Preserve', investigate: 'Investigate', repair: 'Repair', evolve: 'Evolve', invent: 'Invent',
};

export function recordChoice(state, { subject, verdict, rationale, sources = [], by, needs, asOf }) {
  if (!CHOICES[verdict]) throw new Error(`Unknown choice ${verdict}.`);
  subject = String(subject || '').trim();
  if (!subject) throw new Error('A choice needs a subject.');
  const s = clone(state);
  const owner = needs ? (s.brand.authority || {})[needs]?.[0] || null : null;
  s.choices.push({ id: nextId(s, 'c', asOf), subject, verdict, rationale, sources, by, date: asOf, needs: needs || null, owner, status: needs ? 'awaiting decision' : 'recorded' });
  return s;
}

// A personal view reorders; it never edits. Returned items are the same objects.
export function viewFor(role, brand) {
  const weight = {
    executive: i => (i.level === 'company' ? 0 : i.level === 'brand' ? 1 : 2),
    steward: i => (i.standing === 'canon' ? 0 : i.standing === 'experiment' ? 1 : 2),
    practitioner: i => (i.level === 'campaign' || i.level === 'execution' ? 0 : 1),
  }[role] || (() => 0);
  return [...brand.items].sort((a, b) => weight(a) - weight(b));
}

