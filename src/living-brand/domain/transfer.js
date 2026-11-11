// Transfer: scoped context for collaborators, the engagement package that is
// left behind, and the portable packet a brand partition travels in.

import { assessStanding, basisNote, classOf, effectiveRules, rulesInForce, isPublicStudy, BASES, STANDING_CLASSES, PIPELINE } from './standing.js';
import { carryForward, findTensions, fingerprint, organizationalHypotheses, POWERS } from './inquiry.js';

// A partner (agency, freelancer, agent) receives only what its assignment
// needs: approved, rights-compatible material and the rules that apply.
// Confidential research and strategy stay behind. Powers are explicit.
export function buildContextPackage(state, { partner, assignment, channels = [], workTypes = [], powers = ['read'], expires, asOf, seq }) {
  if (!Array.isArray(powers) || powers.some(p => p !== 'read')) throw new Error('A context package carries the power to read, and nothing else.');
  if (isPublicStudy(state.brand)) throw new Error(`A public-source study holds nothing of ${state.brand.name}'s to share. A context package needs the company's grant.`);
  if (!state.engagement.grant?.powers?.includes('share')) throw new Error(`This engagement may not share ${state.brand.name}'s material with anyone else.`);
  if (!partner?.id || !partner?.name) throw new Error('Name the partner.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(expires || ''))) throw new Error('A context package needs an end date, as YYYY-MM-DD.');
  if (asOf && expires < asOf) throw new Error(`That end date, ${expires}, has already passed.`);
  if (state.engagement.grant.expires && expires > state.engagement.grant.expires) throw new Error(`A package cannot outlast the engagement, which ends ${state.engagement.grant.expires}.`);
  const included = [];
  const withheld = [];
  // Material that carries a claim the record says is no longer true is not handed to anyone.
  const untrue = Object.create(null);
  for (const c of state.brand.claims || []) {
    const fact = (state.brand.facts || []).find(f => f.id === c.contradictedBy);
    if (fact?.date && asOf && fact.date <= asOf) for (const id of c.usedIn || []) (untrue[id] ||= []).push(c.statement);
  }
  for (const item of state.brand.items) {
    const st = assessStanding(item, { channels, asOf, until: expires }, state.brand);
    const reasons = [];
    if (item.provenance?.confidential) reasons.push('Confidential');
    for (const statement of untrue[item.id] || []) reasons.push(`Carries a claim that is no longer true: "${statement.replace(/[.]+$/, '')}"`);
    if (item.released && item.released !== 'public') reasons.push(item.released === 'unreleased' ? 'Unreleased' : 'Internal');
    if (!st.authorized) reasons.push(...st.reasons.authorized);
    if (!st.reusable && item.kind !== 'Guidelines') reasons.push(...st.reasons.reusable);
    if (reasons.length) withheld.push({ id: item.id, title: item.title, reasons: [...new Set(reasons.map(r => String(r).replace(/[.]+$/, '')))] });
    else included.push({ id: item.id, title: item.title, standing: item.standing, rights: item.rights, fingerprint: fingerprint(item) });
  }
  const rules = rulesInForce(effectiveRules(state.brand), asOf)
    .filter(r => !r.scope || r.scope.includes('all') || r.scope.some(s => workTypes.includes(s)))
    .map(r => ({ id: r.id, statement: r.statement, standing: r.standing }));
  const open = findTensions(state.brand, { asOf, workTypes, channels }).filter(t => t.kind === 'Conflicting guidance' || t.kind === 'Stale claim')
    .map(t => ({ title: t.title, ask: (t.owners || []).map(o => state.brand.people?.[o]?.name).filter(Boolean).join(' or ') || 'whoever the company names' }));
  const reviewer = state.brand.people?.[state.brand.authority?.publish?.[0]]?.name || null;
  const pkg = {
    id: `pkg-${partner.id}-${asOf}${seq ? `-${seq}` : ''}`, brand: state.brand.name, partner, assignment, powers: ['read'],
    issued: asOf, expires, revokedAt: null,
    included, withheldCount: withheld.length, rules, open,
    review: { reviewer, note: 'Outputs return for review. The partner cannot publish or change brand knowledge.' },
  };
  // The audit of what was withheld stays with the issuer; the partner receives only the package.
  return { package: pkg, audit: { packageId: pkg.id, withheld } };
}

export const revokePackage = (pkg, asOf) => ({ ...pkg, revokedAt: asOf });
export const packageValid = (pkg, asOf) => !pkg.revokedAt && (!pkg.expires || asOf <= pkg.expires);

const MODES = ['orientation', 'audit', 'investigation', 'planning'];

// The handoff: what is left behind when the engagement ends. For a company
// engagement the company keeps it. A public-source study stays with whoever
// made it, and says plainly what only the company could confirm.
export function buildHandoff(state, { brief, asOf, ended = null, packages = [] }) {
  const { brand, engagement } = state;
  const carried = carryForward(brand, engagement, { asOf });
  const study = isPublicStudy(brand);
  const answered = new Set((state.answers || []).map(a => a.question));
  // Someone the brand names as deciding is not a visitor with methods to take away.
  const owner = !study && Object.values(brand.authority || {}).some(l => Array.isArray(l) && l.includes(engagement.actor));
  const tensions = findTensions(brand, { asOf, workTypes: engagement.workTypes || [], channels: engagement.channels || [] });
  return {
    format: 'living-brand.engagement/0.2',
    company: brand.name,
    basis: brand.basis || 'company-record',
    basisNote: basisNote({ ...brand, basis: brand.basis || 'company-record' }),
    // In a study every standing below is the author's reading, named as one.
    ...(study ? { standingNote: `Every standing in this file is this study's reading of public material. None of it is ${brand.name}'s own classification, approval or decision.` } : {}),
    // Written on the day it is exported. The engagement has ended only if it says so.
    written: asOf,
    engagement: {
      project: engagement.project, role: engagement.role, practitioner: engagement.practitioner,
      purpose: engagement.purpose, mode: engagement.mode, scope: engagement.scope, started: engagement.started, ended,
    },
    brief,
    interpretation: {
      note: engagement.modeNote || '',
      strengths: (engagement.strengths || []).map(s => ({ statement: s.statement, sources: s.sources })),
      hypotheses: organizationalHypotheses(brand, engagement).map(h => ({ title: h.title, statement: h.statement, uncertainty: h.uncertainty, test: h.test, evidence: h.evidence.map(e => e.statement), decidedBy: h.owner ? brand.people?.[h.owner]?.name || h.owner : null })),
      carryForward: carried ? carried.rows.map(r => ({ item: r.item.id, title: r.item.title, verdict: r.verdictName, why: r.why })) : [],
    },
    // Context handed to partners during the engagement, and whether each can still be read.
    contextPackages: (packages || []).map(p => ({ id: p.id, partner: p.partner?.name, assignment: p.assignment, issued: p.issued, expires: p.expires, revokedAt: p.revokedAt || null, included: (p.included || []).map(i => i.title) })),
    choices: state.choices,
    proposals: state.proposals,
    decisions: state.decisions,
    openTensions: tensions.map(t => ({ kind: t.kind, title: t.title, sources: t.sources })),
    // A question that has been answered is no longer open; the answer is below with who gave it.
    openQuestions: (engagement.questions || []).filter(q => !answered.has(q)),
    answers: state.answers || [],
    unknowns: (brand.unknowns || []).filter(u => !answered.has(u)),
    sources: brand.items.map(i => ({
      id: i.id, title: i.title, pipeline: i.pipeline, standing: i.standing, ...(study ? { readAs: classOf(i.standing, brand).name } : {}), rights: i.rights?.status,
      provenance: i.provenance?.source, origin: i.provenance?.origin, fingerprint: fingerprint(i),
      links: (i.sources || []).map(s => s.url), verification: i.verification || null,
    })),
    retained: study
      ? { company: `Nothing. ${brand.name} did not commission this and has not seen it.`, practitioner: 'The study: public sources, the reading of them, and the questions only the company can answer.' }
      : owner
        ? { company: 'Everything in this file: sources, interpretation, choices, proposals, decisions, answers and the brief.', practitioner: 'Nothing separate. The person who made this pass is one of the people who decide here.' }
        : { company: 'Everything above: sources, interpretation, choices, proposals and the brief.', practitioner: 'General methods listed in the practitioner\'s workbench. No client material.' },
    completed: engagement.modesCompleted || [],
    notCompleted: MODES.filter(m => !(engagement.modesCompleted || []).includes(m)),
  };
}

// A packet is one brand partition and one engagement, in plain JSON, so it can
// be exported, read by a person, and opened by another tool. It carries no
// other client's material and no practitioner methods.
export const PACKET_FORMAT = 'living-brand.packet/0.2';

export function toPacket(state) {
  const strip = ({ _tenant, ...rest }) => { void _tenant; return rest; };
  const brand = JSON.parse(JSON.stringify(state.brand));
  brand.items = brand.items.map(strip);
  brand.rules = (brand.rules || []).map(strip);
  return {
    format: PACKET_FORMAT, brand, engagement: JSON.parse(JSON.stringify(state.engagement)),
    record: { choices: state.choices, proposals: state.proposals, decisions: state.decisions, answers: state.answers || [], seq: state.seq || 0 },
  };
}

// A packet is read as its author's statement, and it is checked before it is
// believed: every reference has to resolve, every value has to be one this
// record knows, and a public-source study cannot arrive naming anyone as able
// to decide. What cannot be checked is who wrote it; see the README.
const isText = v => typeof v === 'string' && v.trim().length > 0;
// eslint-disable-next-line no-control-regex
const hasControl = v => /[\u0000-\u001f\u007f]/.test(v);
const isList = v => Array.isArray(v);
const GRANT_POWERS = ['read', 'propose', 'share', 'steward'];
const APPROVALS = ['approved', 'published', 'pending', 'rejected', 'none'];

export function readPacket(packet) {
  const problems = [];
  const bad = message => { if (problems.length < 12) problems.push(message); };
  if (!packet || typeof packet !== 'object' || isList(packet)) throw new Error('Not a packet.');
  if (packet.format !== PACKET_FORMAT) bad(`Format is ${isText(packet.format) ? String(packet.format).slice(0, 40) : 'missing'}; expected ${PACKET_FORMAT}.`);
  const { brand, engagement } = packet;
  if (!brand || typeof brand !== 'object') throw new Error('Packet refused: it holds no brand.');
  if (!engagement || typeof engagement !== 'object') throw new Error('Packet refused: it holds no engagement.');

  if (!isText(brand.id) || !isText(brand.name) || hasControl(brand.id + brand.name)) bad('The brand needs an id and a name, as plain text.');
  if (!Object.hasOwn(BASES, brand.basis)) bad(`The brand's basis must be one of ${Object.keys(BASES).join(', ')}.`);
  if (brand.basisNote !== undefined && (!isText(brand.basisNote) || hasControl(brand.basisNote) || brand.basisNote.length > 400)) bad('The note on how the record was put together must be one short paragraph of plain text.');
  if (!isList(brand.items)) bad('The brand needs a list of items.');
  for (const key of ['rules', 'claims', 'facts', 'unknowns']) if (brand[key] !== undefined && !isList(brand[key])) bad(`The brand's ${key} must be a list.`);
  for (const key of ['people', 'authority']) if (brand[key] !== undefined && (typeof brand[key] !== 'object' || brand[key] === null || isList(brand[key]))) bad(`The brand's ${key} must be a record of entries.`);

  const people = brand.people && typeof brand.people === 'object' ? brand.people : {};
  for (const [id, p] of Object.entries(people)) if (!p || !isText(p.name) || hasControl(p.name)) bad(`Person ${id} needs a name.`);
  const authority = brand.authority && typeof brand.authority === 'object' ? brand.authority : {};
  for (const [power, list] of Object.entries(authority)) {
    if (!Object.hasOwn(POWERS, power)) bad(`"${String(power).slice(0, 40)}" is not an area of decision.`);
    else if (!isList(list)) bad(`Who decides ${POWERS[power]} must be a list.`);
    else for (const id of list) if (!Object.hasOwn(people, id)) bad(`${POWERS[power]} names ${String(id).slice(0, 40)}, who is not among the brand's people.`);
  }
  const study = brand.basis === 'public-source';
  if (study && Object.values(authority).some(list => isList(list) && list.length)) bad('A public-source study cannot name anyone as deciding for the company.');

  if (!isText(engagement.id)) bad('The engagement needs an id.');
  for (const key of ['project', 'role']) if (!isText(engagement[key]) || hasControl(engagement[key])) bad(`The engagement needs a ${key}.`);
  if (engagement.brandId !== brand.id) bad('The engagement is for a different brand than the packet holds.');
  const grant = engagement.grant;
  if (!grant || grant.brandId !== brand.id) bad('The engagement\'s grant is for a different brand.');
  if (!isList(grant?.powers) || grant.powers.some(p => !GRANT_POWERS.includes(p))) bad(`The grant's powers must be a list drawn from ${GRANT_POWERS.join(', ')}.`);
  else if (study && (grant.powers.includes('steward') || grant.powers.includes('share'))) bad('A public-source study cannot hold the power to name deciders or to share the company\'s material.');
  if (engagement.actor !== undefined && engagement.actor !== 'practitioner' && !Object.hasOwn(people, engagement.actor)) bad('The engagement acts as someone who is not among the brand\'s people.');
  for (const key of ['workTypes', 'channels', 'constraints', 'materials', 'questions', 'strengths', 'hypotheses', 'suggestedChoices', 'evaluation']) if (engagement[key] !== undefined && !isList(engagement[key])) bad(`The engagement's ${key} must be a list.`);
  for (const st of isList(engagement.strengths) ? engagement.strengths : []) if (!st || !isText(st.statement) || !isList(st.sources)) bad('Each strength needs a statement and a list of sources.');

  const ids = new Set();
  const items = isList(brand.items) ? brand.items : [];
  for (const item of items) {
    if (!item || typeof item !== 'object') { bad('Every item must be a record.'); continue; }
    if (!isText(item.id) || !isText(item.title) || hasControl(item.id + item.title)) { bad('Every item needs an id and a title, as plain text on one line.'); continue; }
    if (ids.has(item.id)) bad(`Duplicate item ${item.id}.`);
    ids.add(item.id);
    if (!Object.hasOwn(STANDING_CLASSES, item.standing)) bad(`${item.id}: standing must be one of ${Object.keys(STANDING_CLASSES).join(', ')}.`);
    if (!PIPELINE.includes(item.pipeline)) bad(`${item.id}: stage must be one of ${PIPELINE.join(', ')}.`);
    for (const key of ['tags', 'evidence', 'relations', 'sources', 'reuse']) if (item[key] !== undefined && !isList(item[key])) bad(`${item.id}: ${key} must be a list.`);
    const approval = item.approval?.status;
    if (approval !== undefined && !APPROVALS.includes(approval)) bad(`${item.id}: approval must be one of ${APPROVALS.join(', ')}.`);
    if (approval === 'approved' && (!isText(item.approval.by) || !isText(item.approval.date))) bad(`${item.id} is marked approved without saying by whom and when.`);
    if (approval === 'approved' && study) bad(`${item.id}: nothing in a public-source study can be marked approved; at most it was published.`);
    if (item.standing === 'canon' && !study && !(isText(item.standingRecord?.by) && isText(item.standingRecord?.date))) bad(`${item.id} is marked canon without saying who decided it and when.`);
    if (item.standing === 'canon' && study && item.standingRecord?.basis !== 'reading') bad(`${item.id}: canon in a public-source study can only be a reading of public material.`);
    if (item.brief !== undefined && (typeof item.brief !== 'object' || item.brief === null)) bad(`${item.id}: its brief must be a record.`);
    if (item.power !== undefined && !Object.hasOwn(POWERS, item.power)) bad(`${item.id}: "${String(item.power).slice(0, 40)}" is not an area of decision.`);
    if (item.uses !== undefined && (typeof item.uses !== 'object' || item.uses === null || isList(item.uses))) bad(`${item.id}: what it uses must be a record of topics.`);
    if (item.standingRecord?.covers !== undefined && !isList(item.standingRecord.covers)) bad(`${item.id}: what its canon covers must be a list of kinds of work.`);
  }
  for (const item of items) {
    if (!item || typeof item !== 'object' || !isText(item.id)) continue;
    if (item.supersededBy && !ids.has(item.supersededBy)) bad(`${item.id} is superseded by ${item.supersededBy}, which is not in the packet.`);
    for (const r of isList(item.relations) ? item.relations : []) if (!r || !ids.has(r.to)) bad(`${item.id} relates to ${r?.to}, which is not in the packet.`);
  }
  const factIds = new Set();
  for (const f of isList(brand.facts) ? brand.facts : []) {
    if (!f || !isText(f.id) || !isText(f.statement)) { bad('Every fact needs an id and a statement.'); continue; }
    factIds.add(f.id);
  }
  for (const r of isList(brand.rules) ? brand.rules : []) {
    if (!r || !isText(r.id) || !isText(r.topic) || !isText(r.statement) || r.value === undefined) { bad('Every rule needs an id, a topic, a value and a statement.'); continue; }
    if (r.source && !ids.has(r.source)) bad(`Rule ${r.id} cites ${r.source}, which is not in the packet.`);
    if (r.scope !== undefined && !isList(r.scope)) bad(`Rule ${r.id}: scope must be a list.`);
    if (r.standing !== undefined && r.standing !== 'retired' && !Object.hasOwn(STANDING_CLASSES, r.standing)) bad(`Rule ${r.id}: unknown standing.`);
  }
  for (const c of isList(brand.claims) ? brand.claims : []) {
    if (!c || !isText(c.id) || !isText(c.statement)) { bad('Every claim needs an id and a statement.'); continue; }
    if (c.usedIn !== undefined && !isList(c.usedIn)) bad(`Claim ${c.id}: usedIn must be a list.`);
    for (const id of isList(c.usedIn) ? c.usedIn : []) if (!ids.has(id)) bad(`Claim ${c.id} is used in ${id}, which is not in the packet.`);
    if (c.contradictedBy && !factIds.has(c.contradictedBy)) bad(`Claim ${c.id} cites a fact that is not in the packet.`);
    if (c.supportedBy && !factIds.has(c.supportedBy)) bad(`Claim ${c.id} cites a fact that is not in the packet.`);
    for (const id of isList(c.disputedBy) ? c.disputedBy : []) if (!factIds.has(id)) bad(`Claim ${c.id} cites a fact that is not in the packet.`);
  }
  if (engagement.carry !== undefined) {
    const precedent = items.find(i => i && i.id === engagement.carry?.precedentId);
    if (!precedent?.brief || !engagement.newBrief || typeof engagement.newBrief !== 'object') bad('A carry-forward needs a precedent with a recorded brief, and a new brief.');
  }

  const record = packet.record === undefined ? { choices: [], proposals: [], decisions: [], seq: 0 } : packet.record;
  if (!record || typeof record !== 'object' || ['choices', 'proposals', 'decisions'].some(k => !isList(record[k]))) bad('The record must hold lists of choices, proposals and decisions.');
  else {
    for (const p of record.proposals) {
      if (!p || !isText(p.id) || !ids.has(p.itemId) || !Object.hasOwn(STANDING_CLASSES, p.from) || !Object.hasOwn(STANDING_CLASSES, p.to) || !isList(p.evidenceIds) || !isList(p.warnings) || !isList(p.reviewer) || !isText(p.status)) bad('A proposal in the record is incomplete or points at an item that is not in the packet.');
    }
    for (const c of record.choices) {
      if (!c || !isText(c.id) || !isText(c.subject) || !isText(c.verdict)) { bad('A choice in the record is incomplete.'); continue; }
      // A choice that says it was accepted or declined has to say by whom, and that person has to be among the brand's people.
      if (['accepted', 'declined'].includes(c.status) && !(isText(c.answer?.by) && Object.hasOwn(people, c.answer.by))) bad(`Choice ${c.id} is marked ${c.status} without saying who, among the brand's people, answered it.`);
    }
    for (const d of record.decisions) if (!d || !isText(d.id) || !isText(d.outcome)) bad('A decision in the record is incomplete.');
    if (record.answers !== undefined && (!isList(record.answers) || record.answers.some(a => !a || !isText(a.id) || !isText(a.question) || !isText(a.answer)))) bad('An answer in the record is incomplete.');
    if (study && record.decisions.some(d => d && ['adopt', 'retire', 'approve', 'name-authority', 'unname-authority', 'accept-choice', 'decline-choice'].includes(d.outcome))) bad('A public-source study cannot carry decisions made for the company.');
  }

  if (problems.length) throw new Error(`Packet refused: ${[...new Set(problems)].join(' ')}`);
  return {
    brand: { rules: [], claims: [], facts: [], people: {}, authority: {}, ...JSON.parse(JSON.stringify(brand)) },
    engagement: JSON.parse(JSON.stringify(engagement)),
    record: { choices: [], proposals: [], decisions: [], answers: [], seq: 0, ...JSON.parse(JSON.stringify(record)) },
  };
}

// What a packet asserts on its own say-so, for whoever opens it to see:
// standing and approvals that were not decided in this record.
export function packetAssertions(packet) {
  const { brand, record } = readPacket(packet);
  const decided = new Set((record.decisions || []).map(d => d.id));
  const canon = brand.items.filter(i => i.standing === 'canon');
  return {
    canon: canon.length,
    canonDecidedHere: canon.filter(i => decided.has(i.standingRecord?.decisionId)).length,
    approved: brand.items.filter(i => i.approval?.status === 'approved').length,
    deciders: Object.entries(brand.authority || {}).filter(([, l]) => l.length).map(([power, l]) => `${POWERS[power]}: ${l.map(id => brand.people?.[id]?.name || id).join(', ')}`),
    decisions: (record.decisions || []).length,
  };
}
