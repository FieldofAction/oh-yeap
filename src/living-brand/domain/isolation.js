// Client separation is structural, not a prompt instruction. An engagement
// receives a tenant index built only from its own brand's partition. Search
// never sees the multi-tenant store, and every record is re-checked against
// the tenant stamp at query time.

import { assessStanding } from './standing.js';

export class IsolationError extends Error {}

const deepFreeze = obj => {
  Object.values(obj).forEach(v => { if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v); });
  return Object.freeze(obj);
};

// vault: { [brandId]: brand }. Credentials are the engagement's grant.
export function openTenant(vault, engagement) {
  const tenant = engagement.brandId;
  if (!engagement.grant || engagement.grant.brandId !== tenant) throw new IsolationError('Engagement grant does not match its brand.');
  if (engagement.grant.revokedAt) throw new IsolationError('Access to this brand was revoked.');
  if (engagement.grant.expires && engagement.asOf && engagement.asOf > engagement.grant.expires) throw new IsolationError('Access to this brand has expired.');
  const brand = vault[tenant];
  if (!brand) throw new IsolationError(`No brand ${tenant}.`);
  // Copy the partition. Nothing outside it is reachable from the returned object.
  const partition = JSON.parse(JSON.stringify(brand));
  partition.items.forEach(i => { i._tenant = tenant; });
  partition.rules.forEach(r => { r._tenant = tenant; });
  return deepFreeze({ tenant, brand: partition, log: [] });
}

export function search(tenantIndex, query, purpose = {}) {
  const terms = String(query || '').toLowerCase().split(/[^a-z0-9-]+/).filter(t => t.length > 2);
  const results = [];
  for (const item of tenantIndex.brand.items) {
    if (item._tenant !== tenantIndex.tenant) throw new IsolationError('Foreign record in tenant index.');
    const hay = `${item.title} ${item.text} ${(item.tags || []).join(' ')} ${item.rationale} ${item.kind} ${item.element}`.toLowerCase();
    const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
    if (!terms.length || score > 0) {
      const matched = terms.filter(t => hay.includes(t));
      results.push({ item, score, standing: assessStanding(item, { ...purpose, terms: matched.length ? matched : undefined }) });
    }
  }
  return results.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
}

// An agency sees across clients only what coordination needs: dates and people.
export function coordinationView(engagements) {
  return engagements.map(e => ({
    client: e.clientLabel,
    milestones: (e.milestones || []).map(m => ({ date: m.date, label: m.label })),
    people: e.team || [],
  }));
}

// What a practitioner may carry between clients: methods and preferences only.
export function exportWorkbench(practitioner) {
  return {
    practitioner: practitioner.name,
    methods: practitioner.methods,
    preferences: practitioner.preferences,
    engagements: practitioner.engagements.map(e => ({ client: e.clientLabel, role: e.role, ended: e.ended || null })),
  };
}
