// Governance: how knowledge gains, keeps and loses standing. State is plain
// data; every function returns a new state and never mutates its input.
// Authority comes from the brand, not from the engagement or the viewer.
// Where the brand has named no one, nothing can be adopted or retired, and a
// public-source study can never decide anything, whatever its record says.

import { STANDING_CLASSES, pipelineRank, isPublicStudy, onDate } from './standing.js';
import { POWERS } from './inquiry.js';

export class AuthorityError extends Error {}

const clone = s => JSON.parse(JSON.stringify(s));

// Ids continue from the record's counter and never repeat one already in use,
// even when a record arrives without its counter.
const nextId = (s, prefix, asOf) => {
  const used = new Set([...s.choices, ...s.proposals, ...s.decisions, ...(s.answers || []), ...s.brand.items].map(x => x.id));
  let id;
  // Every id says whose record it belongs to, so the same number at two clients is never the same name.
  const stem = s.tenant && !prefix.startsWith(`${s.tenant}-`) ? `${s.tenant}-${prefix}` : prefix;
  do { s.seq = (s.seq || 0) + 1; id = `${stem}-${asOf}-${s.seq.toString(36)}`; } while (used.has(id));
  return id;
};

export function canDecide(brand, personId, power) {
  if (isPublicStudy(brand)) return false;
  const list = (brand.authority || {})[power];
  return Array.isArray(list) && list.includes(personId);
}

// Most material is decided by whoever holds standing in its domain. A record
// may name another area instead: consent wording is a public claim, a company
// strategy belongs with the offer, whatever kind of words they are written in.
export const powerFor = item => (item.power && POWERS[item.power] ? item.power : `standing.${item.domain || 'visual'}`);

export function deciders(brand, power) {
  if (isPublicStudy(brand)) return [];
  const list = (brand.authority || {})[power];
  return (Array.isArray(list) ? list : []).map(id => ({ id, name: brand.people?.[id]?.name || id }));
}

const actorName = (brand, by) => brand.people?.[by]?.name || (by === 'practitioner' ? 'The practitioner' : 'This viewer');

const refusal = (brand, by, item, verb = 'change the standing of') => {
  const area = `${POWERS[powerFor(item)]} at ${brand.name}`;
  if (isPublicStudy(brand)) {
    return `${actorName(brand, by)} cannot ${verb} ${item.title}. No one can decide ${area} from outside, and a public-source study cannot name them. Only ${brand.name} can.`;
  }
  const who = deciders(brand, powerFor(item)).map(p => p.name);
  if (!who.length) return `${actorName(brand, by)} cannot ${verb} ${item.title}. No one has been named to decide ${area}.`;
  return `${actorName(brand, by)} cannot ${verb} ${item.title}. ${area.replace(/^./, c => c.toUpperCase())} is decided by ${who.join(' or ')}.`;
};

// Writing anything into an engagement's record needs the propose power.
// A read-only grant reads.
const requireWrite = (state, doing) => {
  if (!state.engagement.grant?.powers?.includes('propose')) throw new AuthorityError(`This engagement may read, not ${doing}.`);
};

const findItem = (s, itemId) => {
  const item = s.brand.items.find(i => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId}.`);
  return item;
};

// When an item's standing changes, proposals written against its old standing
// no longer describe it. They are closed, not left to block the next one.
const closeStale = (s, item, decisionId, asOf) => {
  for (const p of s.proposals) {
    if (p.itemId === item.id && p.status === 'open') { p.status = 'superseded'; p.closedBy = decisionId; p.closedOn = asOf; }
  }
};

// Anyone with the propose grant may propose. Proposing changes nothing.
export function propose(state, { itemId, to, rationale, evidenceIds = [], by, scope, asOf }) {
  const s = clone(state);
  const item = findItem(s, itemId);
  if (!STANDING_CLASSES[to]) throw new Error(`Unknown standing ${to}.`);
  requireWrite(s, 'propose');
  if (item.standing === to) throw new Error(`${item.title} already has that standing.`);
  rationale = String(rationale || '').trim();
  if (!rationale) throw new Error('Say why its standing should change.');
  // A proposal written against a standing the item no longer has is closed first.
  for (const p of s.proposals) if (p.itemId === itemId && p.status === 'open' && p.from !== item.standing) { p.status = 'superseded'; p.closedOn = asOf; }
  if (s.proposals.some(p => p.itemId === itemId && p.to === to && p.status === 'open')) throw new Error(`An open proposal already asks for ${item.title} to become ${STANDING_CLASSES[to].name.toLowerCase()}.`);
  const allEvidence = s.brand.items.flatMap(i => (i.evidence || []).map(e => ({ ...e, on: i.id, origin: i.provenance?.origin })));
  const cited = allEvidence.filter(e => (evidenceIds || []).includes(e.id));
  const warnings = [];
  // Evidence bears on a piece of material only if it was recorded on it, comes
  // from it, or sits on material the record relates to it. What a brief
  // intended is not evidence of anything, and neither is the proposer's own note.
  // Only evidence recorded on the piece itself, or naming it as its source,
  // speaks for the piece. Evidence on a related piece speaks for the family.
  const near = new Set([...(item.relations || []).map(r => r.to), ...s.brand.items.filter(i => (i.relations || []).some(r => r.to === item.id)).map(i => i.id)]);
  const own = cited.filter(e => e.on === item.id || e.source === item.id);
  const related = cited.filter(e => !own.includes(e) && near.has(e.on));
  const independent = own.filter(e => e.origin !== 'generated' && e.basis !== 'reuse' && e.type !== 'intended');
  // Anything that would have the material consulted or obeyed is a promotion.
  const promotion = ['canon', 'precedent', 'contextual'].includes(to);
  if (promotion && to !== 'canon') {
    if (item.pipeline === 'discovered') warnings.push('Only found. Nobody has recorded what it is.');
    if (item.approval?.status === 'rejected') warnings.push(`It was rejected${item.approval.date ? ` ${onDate(item.approval.date)}` : ''}.`);
  }
  if (to === 'canon') {
    if (cited.length && !own.length && !related.length) warnings.push('The evidence cited was recorded on other material and does not bear on this.');
    if (related.length) warnings.push(`Some of the evidence cited was recorded on related material (${[...new Set(related.map(e => s.brand.items.find(i => i.id === e.on)?.title || e.on))].join(', ')}), not on this piece.`);
    if (!independent.length) warnings.push('No independent evidence. Repetition and reuse are not evidence.');
    else if (!independent.some(e => e.type === 'contribution' || e.type === 'transfer')) warnings.push('The evidence cited shows what happened, not that this work caused it.');
    if (cited.length && cited.every(e => ['reported', 'company_reported'].includes(e.basis))) warnings.push('All cited evidence is self-reported.');
    if (!['cleared', 'own'].includes(item.rights?.status)) warnings.push(`Rights are ${item.rights?.status || 'unknown'}; canon that cannot be used is a trap.`);
    // Recorded reuse is always put in front of the reviewer, whatever else is cited.
    if (item.reuse?.length) warnings.push(`Reused ${item.reuse.length} time${item.reuse.length === 1 ? '' : 's'}. Frequency is a reason to review, not a reason to adopt.`);
    if (item.approval?.status === 'rejected') warnings.push(`It was rejected${item.approval.date ? ` ${onDate(item.approval.date)}` : ''}.`);
    if (pipelineRank(item.pipeline) < pipelineRank('verified')) warnings.push(`Only ${item.pipeline}. Check it against its source before it governs anything.`);
    if (item.provenance?.origin === 'generated') warnings.push('This was written by a model. Its wording is a description, not a decision.');
  }
  const reviewer = deciders(s.brand, powerFor(item)).map(p => p.id);
  if (!reviewer.length) warnings.push(isPublicStudy(s.brand) ? `No one is named to decide this, and only ${s.brand.name} can name them. In a study this is a note to yourself.` : 'No one is named to decide this. The proposal waits until someone is.');
  s.proposals.push({
    id: nextId(s, 'p', asOf), itemId, from: item.standing, to, rationale, evidenceIds: cited.map(e => e.id), by, scope, date: asOf,
    status: 'open', warnings, reviewer,
  });
  return s;
}

// The rules a piece of material states, which adopting it as canon would put in force.
export const rulesStatedBy = (brand, itemId) => (brand.rules || []).filter(r => r.source === itemId && !r.standing);

// Only the brand's named authority can adopt, reject or revise.
// Turning a proposal down, or sending it back, needs a reason in the decider's
// own words. Adopting as canon needs the material to have been checked against
// its source: the decider may say here what they checked it against. The scope
// is theirs to set, and adoption as canon is also their approval of it.
// covers: the kinds of work the canon binds (or ['all']). holdBack: rules the
// material states that the decider is not putting in force with it.
export function decide(state, proposalId, { by, outcome, note, scope, covers, holdBack, checked, effectiveFrom, asOf }) {
  const s = clone(state);
  const p = s.proposals.find(x => x.id === proposalId);
  if (!p) throw new Error('No such proposal.');
  if (p.status !== 'open') throw new Error(p.status === 'superseded' ? 'That proposal was closed when the item\'s standing changed.' : 'Proposal already decided.');
  if (!['adopt', 'reject', 'revise'].includes(outcome)) throw new Error('Outcome must be adopt, reject or revise.');
  const item = findItem(s, p.itemId);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(refusal(s.brand, by, item));
  // A proposal written against an older standing can still be turned down, but not adopted.
  if (outcome === 'adopt' && item.standing !== p.from) throw new Error(`${item.title} changed standing after this proposal was made. Review it again.`);
  note = oneLine(note);
  if (outcome !== 'adopt' && !note) throw new Error(outcome === 'reject' ? 'Say why it is turned down.' : 'Say what needs to change.');
  covers = [...new Set((Array.isArray(covers) ? covers : []).map(oneLine).filter(Boolean))];
  if (covers.includes('all')) covers = ['all'];
  // The scope is what the decider says it covers. Kinds of work, where given, are what the record can apply.
  scope = oneLine(scope) || (covers.length ? (covers[0] === 'all' ? 'All work' : covers.join(', ')) : oneLine(p.scope));
  checked = oneLine(checked);
  const toCanon = outcome === 'adopt' && p.to === 'canon';
  if (outcome === 'adopt' && ['canon', 'precedent', 'contextual'].includes(p.to)) {
    if (item.pipeline === 'discovered') throw new Error(`${item.title} has only been found. Nobody has recorded what it is, so it cannot be given that standing yet.`);
    if (item.approval?.status === 'rejected') throw new Error(`${item.title} was rejected. It cannot be given that standing while that stands.`);
  }
  if (toCanon) {
    if (pipelineRank(item.pipeline) < pipelineRank('verified') && !checked) throw new Error(`${item.title} has not been checked against its source. Say what you checked it against.`);
    if (!scope) throw new Error('Say what this canon covers.');
  }
  const stated = toCanon ? (s.brand.rules || []).filter(r => r.source === item.id && !r.standing) : [];
  const held = stated.filter(r => (Array.isArray(holdBack) ? holdBack : []).includes(r.id));
  const decision = { id: nextId(s, 'd', asOf), proposalId, itemId: item.id, outcome, by, note, date: asOf, from: item.standing, to: outcome === 'adopt' ? p.to : item.standing, evidenceIds: p.evidenceIds, scope,
    ...(toCanon && covers.length ? { covers } : {}), ...(toCanon && checked ? { checked } : {}), ...(held.length ? { heldBack: held.map(r => r.id) } : {}) };
  p.status = outcome === 'adopt' ? 'adopted' : outcome === 'reject' ? 'rejected' : 'revise';
  p.decided = { by, date: asOf, note };
  if (outcome === 'adopt') {
    if (toCanon) {
      if (pipelineRank(item.pipeline) < pipelineRank('verified')) {
        item.pipelineHistory = [...(item.pipelineHistory || []), { stage: item.pipeline, until: asOf }];
        item.pipeline = 'verified';
        item.verification = { by, how: checked, date: asOf };
      }
      if (item.approval?.status !== 'approved' && item.approval?.status !== 'published') {
        item.pipelineHistory = [...(item.pipelineHistory || []), { stage: item.pipeline, until: asOf }];
        item.pipeline = 'approved';
        item.approval = { status: 'approved', by, date: asOf, note: 'Approved with its adoption as canon.' };
      }
    }
    item.standingHistory = [...(item.standingHistory || []), { standing: item.standing, record: item.standingRecord || null, until: effectiveFrom || asOf }];
    item.standing = p.to;
    item.standingRecord = { by, date: effectiveFrom || asOf, scope, decisionId: decision.id, evidenceIds: p.evidenceIds, rationale: p.rationale, basis: 'decision', ...(toCanon && covers.length ? { covers } : {}) };
    // A rule held back keeps the standing it had as written, and says who held it back.
    for (const r of held) { r.standing = 'operational'; r.heldBack = { by, date: asOf, decisionId: decision.id }; }
    if (p.to !== 'archive') delete item.retired;
    closeStale(s, item, decision.id, asOf);
  }
  s.decisions.push(decision);
  return s;
}

export function retire(state, itemId, { by, reason, asOf }) {
  const s = clone(state);
  const item = findItem(s, itemId);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(refusal(s.brand, by, item));
  if (item.retired) throw new Error(`${item.title} is already retired.`);
  if (!oneLine(reason)) throw new Error('Say why it is being retired.');
  const id = nextId(s, 'd', asOf);
  item.standingHistory = [...(item.standingHistory || []), { standing: item.standing, record: item.standingRecord || null, until: asOf }];
  item.standing = 'archive';
  item.retired = { by, date: asOf, reason: oneLine(reason) };
  item.standingRecord = { by, date: asOf, scope: `Retired: ${item.retired.reason}`, decisionId: id, basis: 'decision' };
  closeStale(s, item, id, asOf);
  s.decisions.push({ id, itemId, outcome: 'retire', by, note: item.retired.reason, date: asOf });
  return s;
}

// Reuse is recorded for review. It never changes standing.
export function recordReuse(state, itemId, { where, asOf }) {
  if (!String(where || '').trim()) throw new Error('Say where it was reused.');
  if (isPublicStudy(state.brand)) throw new AuthorityError(`A study may not reuse ${state.brand.name}'s material, so there is no reuse of yours to record. What you saw others do with it belongs in a source note.`);
  requireWrite(state, 'record reuse');
  const s = clone(state);
  const item = findItem(s, itemId);
  item.reuse = [...(item.reuse || []), { date: asOf, where: String(where).trim() }];
  return s;
}

// Checking a record against its source moves it to "verified" and records who
// checked and how. It is not approval: approval stays with the brand's authority.
export function verifyItem(state, itemId, { by, how, asOf }) {
  if (!String(how || '').trim()) throw new Error('Say what you checked it against.');
  requireWrite(state, 'mark material as checked');
  const s = clone(state);
  const item = findItem(s, itemId);
  if (pipelineRank(item.pipeline) >= pipelineRank('verified')) throw new Error(`${item.title} is already ${item.pipeline}.`);
  if (item.pipeline === 'discovered') throw new Error(`${item.title} has only been found. Nobody has recorded what it is, so there is nothing yet to check.`);
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
  const item = findItem(s, itemId);
  if (!canDecide(s.brand, by, powerFor(item))) throw new AuthorityError(refusal(s.brand, by, item, 'approve'));
  if (item.pipeline === 'discovered') throw new Error(`${item.title} has only been found. Nobody has recorded what it is, so it cannot be approved yet.`);
  if (item.retired) throw new Error(`${item.title} is retired.`);
  if (item.approval?.status === 'approved') throw new Error(`${item.title} is already approved.`);
  // Approving a record nobody has checked approves a description, not the work.
  if (pipelineRank(item.pipeline) < pipelineRank('verified')) throw new Error(`${item.title} has not been checked against its source. Check it first, then approve it.`);
  item.pipelineHistory = [...(item.pipelineHistory || []), { stage: item.pipeline, until: asOf }];
  item.pipeline = 'approved';
  item.approval = { status: 'approved', by, date: asOf, note: note || '' };
  s.decisions.push({ id: nextId(s, 'd', asOf), itemId, outcome: 'approve', by, note: note || '', date: asOf });
  return s;
}

// eslint-disable-next-line no-control-regex
const oneLine = v => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();

// Progressive intake: a source note enters as discovered, extracted or
// interpreted, with where it was found. It can never arrive verified or
// approved, and it can never arrive with a standing that asks to be consulted
// or obeyed: those are proposed, and decided by someone else.
const INTAKE_STAGES = ['discovered', 'extracted', 'interpreted'];
const INTAKE_STANDINGS = ['archive', 'experiment', 'operational'];

export function addSourceNote(state, note, { by, asOf }) {
  requireWrite(state, 'add material');
  const title = oneLine(note.title);
  const source = oneLine(note.foundIn);
  if (!title) throw new Error('A source note needs a title.');
  if (title.length > 160) throw new Error('Keep the title under 160 characters; put the rest in the description.');
  if (!source) throw new Error('Say where it was found.');
  const pipeline = note.pipeline || 'discovered';
  if (!INTAKE_STAGES.includes(pipeline)) throw new Error(`New material enters as ${INTAKE_STAGES.join(', ')}; ${pipeline} has to be earned.`);
  const standing = note.standing || 'archive';
  if (standing === 'canon') throw new Error('New material cannot arrive as canon. Propose it once it is understood.');
  if (!INTAKE_STANDINGS.includes(standing)) throw new Error(`New material enters as ${INTAKE_STANDINGS.join(', ')}. Anything more is proposed and decided.`);
  const s = clone(state);
  const id = nextId(s, `${s.tenant}-note`, asOf);
  s.brand.items.push({
    id, _tenant: s.tenant, title, kind: oneLine(note.kind) || 'Source note', workType: oneLine(note.workType) || 'Unknown', element: oneLine(note.element) || 'Unknown',
    canvas: oneLine(note.canvas) || 'Unknown', audience: oneLine(note.audience) || 'Unknown', intendedOutcome: oneLine(note.intendedOutcome) || 'Unknown',
    level: ['company', 'brand', 'product', 'campaign', 'execution'].includes(note.level) ? note.level : 'execution',
    period: note.from ? { from: oneLine(note.from) } : {}, exposure: oneLine(note.exposure) || 'Unknown', made: { by: oneLine(note.madeBy) || 'Unknown', date: note.from ? oneLine(note.from) : null },
    rationale: oneLine(note.rationale), provenance: { source, origin: note.origin === 'generated' ? 'generated' : 'human', addedBy: by, addedOn: asOf },
    pipeline, standing, domain: ['visual', 'verbal', 'sonic', 'product'].includes(note.domain) ? note.domain : 'visual',
    rights: { status: 'unknown', channels: [], note: oneLine(note.rightsNote) || 'Not reviewed.' }, approval: { status: 'none' },
    evidence: [], relations: [], tags: (Array.isArray(note.tags) ? note.tags : []).map(oneLine).filter(Boolean),
    sources: /^https?:\/\//.test(note.url || '') ? [{ url: oneLine(note.url), publisher: oneLine(note.publisher), date: oneLine(note.sourceDate), basis: 'recorded-by-practitioner' }] : [],
    visual: { motif: 'document', tone: 'paper' }, text: oneLine(note.text),
  });
  return s;
}

// The company says who decides. In an engagement this needs the steward power,
// which a visiting practitioner does not have. A public-source study can never
// name anyone, whatever its grant says.
export function nameAuthority(state, { power, person, by, asOf }) {
  if (!POWERS[power]) throw new Error(`Unknown area ${power}.`);
  if (isPublicStudy(state.brand)) throw new AuthorityError(`Only ${state.brand.name} can name who decides ${POWERS[power]}. A public-source study cannot.`);
  if (!state.engagement.grant?.powers?.includes('steward')) throw new AuthorityError(`Only ${state.brand.name} can name who decides ${POWERS[power]}. This engagement cannot.`);
  const name = oneLine(person?.name);
  if (!name) throw new Error('Name the person.');
  const s = clone(state);
  const people = { ...(s.brand.people || {}) };
  // The same name is the same person; a new name is a new person. An id is
  // never derived from the name, so two people cannot collapse into one.
  const same = k => oneLine(people[k].name).toLowerCase() === name.toLowerCase();
  if (person.id && Object.hasOwn(people, person.id) && !same(person.id)) throw new Error(`That id already belongs to ${people[person.id].name}. Name a different person.`);
  let id = person.id && Object.hasOwn(people, person.id) ? person.id : Object.keys(people).find(same);
  if (!id) { let n = Object.keys(people).length; do { n += 1; id = `person-${n}`; } while (Object.hasOwn(people, id)); }
  people[id] = { ...(people[id] || {}), name: people[id]?.name || name, title: oneLine(person.title) || people[id]?.title || '' };
  s.brand.people = people;
  s.brand.authority = { ...(s.brand.authority || {}) };
  const current = Array.isArray(s.brand.authority[power]) ? s.brand.authority[power] : [];
  s.brand.authority[power] = [...new Set([...current, id])];
  s.decisions.push({ id: nextId(s, 'd', asOf), outcome: 'name-authority', power, person: id, by, date: asOf, note: `${people[id].name} named to decide ${POWERS[power]}.` });
  // Choices and proposals that were waiting for an owner now have one.
  for (const c of s.choices) if (c.needs === power && !c.owner) c.owner = id;
  for (const p of s.proposals) {
    const item = s.brand.items.find(i => i.id === p.itemId);
    if (p.status === 'open' && item && powerFor(item) === power) { p.reviewer = s.brand.authority[power]; p.warnings = p.warnings.filter(w => !/No one is named/.test(w)); }
  }
  return s;
}

// A naming can be taken back by the same power that made it. Whatever was
// waiting for that person waits for whoever is left, or for no one.
export function unnameAuthority(state, { power, personId, by, asOf }) {
  if (!POWERS[power]) throw new Error(`Unknown area ${power}.`);
  if (isPublicStudy(state.brand) || !state.engagement.grant?.powers?.includes('steward')) throw new AuthorityError(`Only ${state.brand.name} can change who decides ${POWERS[power]}. This engagement cannot.`);
  const current = Array.isArray(state.brand.authority?.[power]) ? state.brand.authority[power] : [];
  if (!current.includes(personId)) throw new Error(`That person is not named to decide ${POWERS[power]}.`);
  const s = clone(state);
  s.brand.authority = { ...(s.brand.authority || {}), [power]: current.filter(id => id !== personId) };
  const left = s.brand.authority[power];
  s.decisions.push({ id: nextId(s, 'd', asOf), outcome: 'unname-authority', power, person: personId, by, date: asOf, note: `${s.brand.people?.[personId]?.name || personId} no longer named to decide ${POWERS[power]}.` });
  for (const c of s.choices) if (c.needs === power && c.owner === personId && c.status === 'awaiting decision') c.owner = left[0] || null;
  for (const p of s.proposals) {
    const item = s.brand.items.find(i => i.id === p.itemId);
    if (p.status !== 'open' || !item || powerFor(item) !== power) continue;
    p.reviewer = left;
    if (!left.length && !p.warnings.some(w => /No one is named/.test(w))) p.warnings.push('No one is named to decide this. The proposal waits until someone is.');
  }
  return s;
}

// The practitioner's engagement choices. A choice is a record, not a change
// to the company's knowledge; changes to standing go through propose/decide.
export const CHOICES = {
  preserve: 'Preserve', investigate: 'Investigate', repair: 'Repair', evolve: 'Evolve', invent: 'Invent',
};

export function recordChoice(state, { subject, verdict, rationale, sources = [], by, needs, about, asOf }) {
  if (!CHOICES[verdict]) throw new Error(`Unknown choice ${verdict}.`);
  if (needs && !POWERS[needs]) throw new Error(`Unknown area ${needs}.`);
  subject = oneLine(subject);
  if (!subject) throw new Error('A choice needs a subject.');
  // A choice is a judgment, and a judgment has a reason. It is the person's own, so it is theirs to give.
  if (!String(rationale || '').trim()) throw new Error('Say why. A choice is your judgment, and the reason is part of it.');
  requireWrite(state, 'record choices');
  const s = clone(state);
  // A choice that needs someone's decision is routed to them. If the person
  // recording it is the one named to decide, recording it is the decision.
  const mine = Boolean(needs) && canDecide(s.brand, by, needs);
  const owner = needs ? (mine ? by : deciders(s.brand, needs)[0]?.id || null) : null;
  const choice = { id: nextId(s, 'c', asOf), subject, verdict, rationale: String(rationale || '').trim(), sources: Array.isArray(sources) ? sources : [], by, date: asOf, needs: needs || null, owner, status: needs ? (mine ? 'accepted' : 'awaiting decision') : 'recorded', ...(oneLine(about) ? { about: oneLine(about) } : {}) };
  if (mine) choice.answer = { by, date: asOf, note: '' };
  s.choices.push(choice);
  return s;
}

// A choice can be taken back by the person who recorded it. It stays in the
// record as withdrawn; nothing is erased.
export function withdrawChoice(state, choiceId, { by, asOf }) {
  const found = state.choices.find(c => c.id === choiceId);
  if (!found) throw new Error('No such choice.');
  if (found.by !== by) throw new AuthorityError('Only the person who recorded a choice can withdraw it.');
  if (found.status === 'withdrawn') throw new Error('That choice was already withdrawn.');
  const s = clone(state);
  const c = s.choices.find(x => x.id === choiceId);
  c.status = 'withdrawn';
  c.withdrawn = { by, date: asOf };
  return s;
}

// When the records behind a page are rebuilt, what a person wrote in their own
// words can come across: their answers, and the choices that were theirs
// alone. Decisions about material do not, because the material may have
// changed under them; those are made again against the new record.
export function carryOver(state, earlier) {
  const s = clone(state);
  const ids = new Set(s.brand.items.map(i => i.id));
  const used = new Set([...s.choices, ...s.proposals, ...s.decisions, ...(s.answers || [])].map(x => x.id));
  const fresh = list => (list || []).filter(x => x && typeof x.id === 'string' && !used.has(x.id));
  const answers = fresh(earlier?.answers).filter(a => a.question && a.answer);
  const choices = fresh(earlier?.choices).filter(c => c.subject && CHOICES[c.verdict] && c.status !== 'withdrawn')
    .map(c => ({ ...c, sources: (c.sources || []).filter(id => ids.has(id)), carried: true }));
  s.answers = [...(s.answers || []), ...answers];
  s.choices = [...s.choices, ...choices];
  s.seq = Math.max(s.seq || 0, earlier?.seq || 0);
  return { state: s, carried: { answers: answers.length, choices: choices.length }, left: { decisions: (earlier?.decisions || []).length } };
}

// The person named for a choice's area accepts or declines it. Nobody else can.
export function answerChoice(state, choiceId, { by, outcome, note, asOf }) {
  if (!['accept', 'decline'].includes(outcome)) throw new Error('Outcome must be accept or decline.');
  const found = state.choices.find(c => c.id === choiceId);
  if (!found) throw new Error('No such choice.');
  if (!found.needs) throw new Error('That choice is not waiting for anyone.');
  if (found.status !== 'awaiting decision') throw new Error('That choice has already been answered.');
  if (!canDecide(state.brand, by, found.needs)) {
    const who = deciders(state.brand, found.needs).map(p => p.name);
    throw new AuthorityError(`${actorName(state.brand, by)} cannot answer this. ${who.length ? `${POWERS[found.needs].replace(/^./, c => c.toUpperCase())} at ${state.brand.name} is decided by ${who.join(' or ')}.` : `No one has been named to decide ${POWERS[found.needs]} at ${state.brand.name}.`}`);
  }
  note = oneLine(note);
  if (outcome === 'decline' && !note) throw new Error('Say why it is declined.');
  const s = clone(state);
  const c = s.choices.find(x => x.id === choiceId);
  c.status = outcome === 'accept' ? 'accepted' : 'declined';
  c.owner = by;
  c.answer = { by, date: asOf, note };
  s.decisions.push({ id: nextId(s, 'd', asOf), outcome: `${outcome}-choice`, choiceId, by, note, date: asOf });
  return s;
}

// A question the record asks can be answered in place. The answer is a note
// with who gave it and when. It changes no standing and decides nothing.
export function recordAnswer(state, { question, answer, by, asOf }) {
  question = oneLine(question);
  answer = oneLine(answer);
  if (!question) throw new Error('Say which question this answers.');
  if (!answer) throw new Error('Write the answer.');
  requireWrite(state, 'record answers');
  const s = clone(state);
  s.answers = [...(s.answers || []), { id: nextId(s, 'a', asOf), question, answer, by, date: asOf }];
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
