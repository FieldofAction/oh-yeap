// Transfer: scoped context for collaborators, and the engagement package the
// company keeps.

import { assessStanding, rulesInForce } from './standing.js';
import { findTensions, fingerprint } from './inquiry.js';

// A partner (agency, freelancer, agent) receives only what its assignment
// needs: approved, rights-compatible material and the rules that apply.
// Confidential research and strategy stay behind. Powers are explicit.
export function buildContextPackage(state, { partner, assignment, channels, workTypes, powers = ['read'], expires, asOf }) {
  if (powers.includes('decide') || powers.includes('publish')) throw new Error('Context packages cannot carry decision or publishing powers.');
  const included = [];
  const withheld = [];
  for (const item of state.brand.items) {
    const st = assessStanding(item, { channels, asOf });
    const reasons = [];
    if (item.provenance?.confidential) reasons.push('Confidential');
    if (!st.authorized) reasons.push(...st.reasons.authorized);
    if (!st.reusable && item.kind !== 'Guidelines') reasons.push(...st.reasons.reusable);
    if (reasons.length) withheld.push({ id: item.id, title: item.title, reasons });
    else included.push({ id: item.id, title: item.title, standing: item.standing, rights: item.rights, fingerprint: fingerprint(item) });
  }
  const rules = rulesInForce(state.brand.rules, asOf)
    .filter(r => r.scope.includes('all') || r.scope.some(s => workTypes.includes(s)))
    .map(r => ({ id: r.id, statement: r.statement, standing: r.standing }));
  const open = findTensions(state.brand, { asOf, workTypes, channels }).filter(t => t.kind === 'Conflicting guidance' || t.kind === 'Stale claim')
    .map(t => ({ title: t.title, ask: t.owners?.map(o => state.brand.people[o]?.name).join(' or ') }));
  return {
    id: `pkg-${partner.id}-${asOf}`, brand: state.brand.name, partner, assignment, powers,
    issued: asOf, expires, revokedAt: null,
    included, withheld, rules, open,
    review: { reviewer: state.brand.people[state.brand.authority.publish?.[0]]?.name, note: 'Outputs return for review. The partner cannot publish or change brand knowledge.' },
  };
}

export const revokePackage = (pkg, asOf) => ({ ...pkg, revokedAt: asOf });
export const packageValid = (pkg, asOf) => !pkg.revokedAt && (!pkg.expires || asOf <= pkg.expires);

// The handoff: what the company retains when the engagement ends.
export function buildHandoff(state, { brief, asOf }) {
  const { brand, engagement } = state;
  const tensions = findTensions(brand, { asOf, workTypes: engagement.workTypes, channels: engagement.channels });
  const resolved = new Set(state.choices.flatMap(c => c.tensionIds || []));
  return {
    format: 'living-brand.engagement/0.1',
    company: brand.name,
    engagement: {
      project: engagement.project, role: engagement.role, practitioner: engagement.practitioner,
      purpose: engagement.purpose, mode: engagement.mode, scope: engagement.scope, started: engagement.started, ended: asOf,
    },
    brief,
    choices: state.choices,
    proposals: state.proposals,
    decisions: state.decisions,
    openTensions: tensions.filter(t => !resolved.has(t.id)).map(t => ({ kind: t.kind, title: t.title, sources: t.sources })),
    openQuestions: engagement.questions || [],
    sources: brand.items.map(i => ({
      id: i.id, title: i.title, pipeline: i.pipeline, standing: i.standing, rights: i.rights?.status,
      provenance: i.provenance?.source, origin: i.provenance?.origin, fingerprint: fingerprint(i),
    })),
    retained: {
      company: 'Everything above: sources, interpretation, choices, proposals and the brief.',
      practitioner: 'General methods listed in the practitioner\'s workbench. No client material.',
    },
    completed: engagement.modesCompleted || [],
    notCompleted: ['orientation', 'audit', 'investigation', 'planning'].filter(m => !(engagement.modesCompleted || []).includes(m)),
  };
}
