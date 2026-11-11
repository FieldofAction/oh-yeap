// Governance: how knowledge gains, keeps and loses standing. State is plain
// data; every function returns a new state and never mutates its input.
// Authority comes from the brand, not from the engagement or the viewer.

import { STANDING_CLASSES } from './standing.js';

export class AuthorityError extends Error {}

const clone = s => JSON.parse(JSON.stringify(s));
let seq = 0;
const nextId = (prefix, asOf) => `${prefix}-${asOf}-${(++seq).toString(36)}`;

export function canDecide(brand, personId, power) {
  return (brand.authority[power] || []).includes(personId);
}

const powerFor = item => `standing.${item.domain || 'visual'}`;

// Anyone with the propose grant may propose. Proposing changes nothing.
export function propose(state, { itemId, to, rationale, evidenceIds = [], by, scope, asOf }) {
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  if (!STANDING_CLASSES[to]) throw new Error(`Unknown standing ${to}.`);
  if (!s.engagement.grant.powers.includes('propose')) throw new AuthorityError('This engagement may read, not propose.');
  const allEvidence = s.brand.items.flatMap(i => (i.evidence || []).map(e => ({ ...e, on: i.id, origin: i.provenance?.origin })));
  const cited = allEvidence.filter(e => evidenceIds.includes(e.id));
  const warnings = [];
  const independent = cited.filter(e => e.origin !== 'generated' && e.basis !== 'reuse');
  if (to === 'canon') {
    if (!independent.length) warnings.push('No independent evidence. Repetition and reuse are not evidence.');
    if (cited.length && cited.every(e => e.basis === 'reported')) warnings.push('All cited evidence is self-reported.');
    if (item.rights?.status !== 'cleared') warnings.push(`Rights are ${item.rights?.status || 'unknown'}; canon that cannot be used is a trap.`);
    if (item.reuse?.length && !independent.length) warnings.push(`Reused ${item.reuse.length} times. Frequency is a reason to review, not a reason to adopt.`);
  }
  s.proposals.push({
    id: nextId('p', asOf), itemId, from: item.standing, to, rationale, evidenceIds, by, scope, date: asOf,
    status: 'open', warnings, reviewer: s.brand.authority[powerFor(item)] || [],
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
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(`${s.brand.people[by]?.name || by} cannot decide ${powerFor(item)} for ${s.brand.name}.`);
  if (!['adopt', 'reject', 'revise'].includes(outcome)) throw new Error('Outcome must be adopt, reject or revise.');
  const decision = { id: nextId('d', asOf), proposalId, itemId: item.id, outcome, by, note, date: asOf, from: item.standing, to: outcome === 'adopt' ? p.to : item.standing, evidenceIds: p.evidenceIds, scope: p.scope };
  if (outcome === 'adopt') {
    item.standingHistory = [...(item.standingHistory || []), { standing: item.standing, record: item.standingRecord || null, until: effectiveFrom || asOf }];
    item.standing = p.to;
    item.standingRecord = { by, date: effectiveFrom || asOf, scope: p.scope, decisionId: decision.id, evidenceIds: p.evidenceIds, rationale: p.rationale };
  }
  p.status = outcome === 'adopt' ? 'adopted' : outcome === 'reject' ? 'rejected' : 'revise';
  s.decisions.push(decision);
  return s;
}

export function retire(state, itemId, { by, reason, asOf }) {
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(`${s.brand.people[by]?.name || by} cannot retire ${item.title}.`);
  item.standingHistory = [...(item.standingHistory || []), { standing: item.standing, record: item.standingRecord || null, until: asOf }];
  item.standing = 'archive';
  item.standingRecord = { by, date: asOf, scope: `Retired: ${reason}` };
  s.decisions.push({ id: nextId('d', asOf), itemId, outcome: 'retire', by, note: reason, date: asOf });
  return s;
}

// Reuse is recorded for review. It never changes standing.
export function recordReuse(state, itemId, { where, asOf }) {
  const s = clone(state);
  const item = s.brand.items.find(i => i.id === itemId);
  item.reuse = [...(item.reuse || []), { date: asOf, where }];
  return s;
}

// The practitioner's engagement choices. A choice is a record, not a change
// to the company's knowledge; changes to standing go through propose/decide.
export const CHOICES = {
  preserve: 'Preserve', investigate: 'Investigate', repair: 'Repair', evolve: 'Evolve', invent: 'Invent',
};

export function recordChoice(state, { subject, verdict, rationale, sources = [], by, needs, asOf }) {
  if (!CHOICES[verdict]) throw new Error(`Unknown choice ${verdict}.`);
  const s = clone(state);
  const owner = needs ? s.brand.authority[needs]?.[0] : null;
  s.choices.push({ id: nextId('c', asOf), subject, verdict, rationale, sources, by, date: asOf, needs: needs || null, owner, status: needs ? 'awaiting decision' : 'recorded' });
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
