// Transfer: scoped context for collaborators, the engagement package that is
// left behind, and the portable packet a brand partition travels in.

import { assessStanding, effectiveRules, rulesInForce, isPublicStudy, BASES } from './standing.js';
import { findTensions, fingerprint } from './inquiry.js';

// A partner (agency, freelancer, agent) receives only what its assignment
// needs: approved, rights-compatible material and the rules that apply.
// Confidential research and strategy stay behind. Powers are explicit.
export function buildContextPackage(state, { partner, assignment, channels, workTypes, powers = ['read'], expires, asOf }) {
  if (powers.includes('decide') || powers.includes('publish')) throw new Error('Context packages cannot carry decision or publishing powers.');
  if (isPublicStudy(state.brand)) throw new Error(`A public-source study holds nothing of ${state.brand.name}'s to share. A context package needs the company's grant.`);
  const included = [];
  const withheld = [];
  for (const item of state.brand.items) {
    const st = assessStanding(item, { channels, asOf });
    const reasons = [];
    if (item.provenance?.confidential) reasons.push('Confidential');
    if (item.released && item.released !== 'public') reasons.push(item.released === 'unreleased' ? 'Unreleased' : 'Internal');
    if (!st.authorized) reasons.push(...st.reasons.authorized);
    if (!st.reusable && item.kind !== 'Guidelines') reasons.push(...st.reasons.reusable);
    if (reasons.length) withheld.push({ id: item.id, title: item.title, reasons });
    else included.push({ id: item.id, title: item.title, standing: item.standing, rights: item.rights, fingerprint: fingerprint(item) });
  }
  const rules = rulesInForce(effectiveRules(state.brand), asOf)
    .filter(r => !r.scope || r.scope.includes('all') || r.scope.some(s => workTypes.includes(s)))
    .map(r => ({ id: r.id, statement: r.statement, standing: r.standing }));
  const open = findTensions(state.brand, { asOf, workTypes, channels }).filter(t => t.kind === 'Conflicting guidance' || t.kind === 'Stale claim')
    .map(t => ({ title: t.title, ask: (t.owners || []).map(o => state.brand.people?.[o]?.name).filter(Boolean).join(' or ') || 'whoever the company names' }));
  const reviewer = state.brand.people?.[state.brand.authority?.publish?.[0]]?.name || null;
  const pkg = {
    id: `pkg-${partner.id}-${asOf}`, brand: state.brand.name, partner, assignment, powers,
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
export function buildHandoff(state, { brief, asOf }) {
  const { brand, engagement } = state;
  const study = isPublicStudy(brand);
  const tensions = findTensions(brand, { asOf, workTypes: engagement.workTypes || [], channels: engagement.channels || [] });
  return {
    format: 'living-brand.engagement/0.2',
    company: brand.name,
    basis: brand.basis || 'company-record',
    basisNote: BASES[brand.basis || 'company-record']?.note,
    engagement: {
      project: engagement.project, role: engagement.role, practitioner: engagement.practitioner,
      purpose: engagement.purpose, mode: engagement.mode, scope: engagement.scope, started: engagement.started, ended: asOf,
    },
    brief,
    choices: state.choices,
    proposals: state.proposals,
    decisions: state.decisions,
    openTensions: tensions.map(t => ({ kind: t.kind, title: t.title, sources: t.sources })),
    openQuestions: engagement.questions || [],
    unknowns: brand.unknowns || [],
    sources: brand.items.map(i => ({
      id: i.id, title: i.title, pipeline: i.pipeline, standing: i.standing, rights: i.rights?.status,
      provenance: i.provenance?.source, origin: i.provenance?.origin, fingerprint: fingerprint(i),
      links: (i.sources || []).map(s => s.url), verification: i.verification || null,
    })),
    retained: study
      ? { company: `Nothing. ${brand.name} did not commission this and has not seen it.`, practitioner: 'The study: public sources, the reading of them, and the questions only the company can answer.' }
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
    record: { choices: state.choices, proposals: state.proposals, decisions: state.decisions, seq: state.seq || 0 },
  };
}

export function readPacket(packet) {
  const problems = [];
  if (!packet || typeof packet !== 'object') throw new Error('Not a packet.');
  if (packet.format !== PACKET_FORMAT) problems.push(`Format is ${packet.format || 'missing'}; expected ${PACKET_FORMAT}.`);
  const { brand, engagement } = packet;
  if (!brand?.id || !brand?.name) problems.push('The brand needs an id and a name.');
  if (!Array.isArray(brand?.items)) problems.push('The brand needs a list of items.');
  if (!engagement?.id) problems.push('The engagement needs an id.');
  if (engagement?.brandId !== brand?.id) problems.push('The engagement is for a different brand than the packet holds.');
  if (engagement?.grant?.brandId !== brand?.id) problems.push('The engagement\'s grant is for a different brand.');
  const ids = new Set();
  for (const item of brand?.items || []) {
    if (!item.id || !item.title) problems.push('Every item needs an id and a title.');
    if (ids.has(item.id)) problems.push(`Duplicate item ${item.id}.`);
    ids.add(item.id);
    if (!item.pipeline || !item.standing) problems.push(`${item.id} needs a pipeline stage and a standing.`);
  }
  for (const item of brand?.items || []) {
    if (item.supersededBy && !ids.has(item.supersededBy)) problems.push(`${item.id} is superseded by ${item.supersededBy}, which is not in the packet.`);
    for (const r of item.relations || []) if (!ids.has(r.to)) problems.push(`${item.id} relates to ${r.to}, which is not in the packet.`);
  }
  for (const r of brand?.rules || []) if (r.source && !ids.has(r.source)) problems.push(`Rule ${r.id} cites ${r.source}, which is not in the packet.`);
  for (const c of brand?.claims || []) for (const id of c.usedIn || []) if (!ids.has(id)) problems.push(`Claim ${c.id} is used in ${id}, which is not in the packet.`);
  if (problems.length) throw new Error(`Packet refused: ${[...new Set(problems)].join(' ')}`);
  return {
    brand: { rules: [], claims: [], facts: [], people: {}, authority: {}, ...JSON.parse(JSON.stringify(brand)) },
    engagement: JSON.parse(JSON.stringify(engagement)),
    record: packet.record || { choices: [], proposals: [], decisions: [], seq: 0 },
  };
}
