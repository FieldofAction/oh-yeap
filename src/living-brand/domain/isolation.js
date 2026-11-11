// Client separation is structural, not a prompt instruction. An engagement
// receives a tenant index built only from its own brand's partition. Search
// never sees the multi-tenant store, and every record is re-checked against
// the tenant stamp at query time.

import { assessStanding, searchText, termHits, wordsOf } from './standing.js';

export class IsolationError extends Error {}

const deepFreeze = obj => {
  Object.values(obj).forEach(v => { if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v); });
  return Object.freeze(obj);
};

// vault: { [brandId]: brand }. Credentials are the engagement's grant.
// asOf is today's date, supplied by whoever opens the engagement. A grant
// with an end date cannot be opened without it.
export function openTenant(vault, engagement, { asOf } = {}) {
  const tenant = engagement.brandId;
  const today = asOf || engagement.asOf;
  if (typeof tenant !== 'string' || !tenant) throw new IsolationError('The engagement names no brand.');
  if (!engagement.grant || engagement.grant.brandId !== tenant) throw new IsolationError('Engagement grant does not match its brand.');
  if (engagement.grant.revokedAt) throw new IsolationError('Access to this brand was revoked.');
  if (engagement.grant.expires) {
    if (!today) throw new IsolationError('Cannot tell whether access to this brand has expired: no date was given.');
    if (today > engagement.grant.expires) throw new IsolationError(`Access to this brand expired on ${engagement.grant.expires}.`);
  }
  if (!vault || !Object.hasOwn(vault, tenant)) throw new IsolationError(`No brand ${tenant}.`);
  const brand = vault[tenant];
  if (!brand || brand.id !== tenant) throw new IsolationError(`The record stored for ${tenant} is for a different brand.`);
  // Copy the partition. Nothing outside it is reachable from the returned object.
  const partition = JSON.parse(JSON.stringify(brand));
  partition.items = partition.items || [];
  partition.items.forEach(i => { i._tenant = tenant; });
  partition.rules = partition.rules || [];
  partition.rules.forEach(r => { r._tenant = tenant; });
  return deepFreeze({ tenant, brand: partition, log: [] });
}

// Words of any script, two characters or longer.
const termsOf = query => String(query || '').toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter(t => t.length > 1);

export function search(tenantIndex, query, purpose = {}) {
  const terms = termsOf(query);
  const results = [];
  // Something was typed, but none of it is a word: that matches nothing, not everything.
  if (String(query || '').trim() && !terms.length) return results;
  for (const item of tenantIndex.brand.items) {
    if (item._tenant !== tenantIndex.tenant) throw new IsolationError('Foreign record in tenant index.');
    const hay = wordsOf(searchText(item));
    const matched = terms.filter(t => termHits(t, hay));
    if (!terms.length || matched.length) {
      // Relevance is decided here, once, over the same text that was searched.
      const standing = assessStanding(item, { ...purpose, terms: undefined }, tenantIndex.brand);
      standing.relevant = true;
      standing.asked = terms.length > 0;
      standing.reasons.relevant = [matched.length ? `Matches ${matched.join(', ')}.` : 'No question asked.'];
      results.push({ item, score: matched.length, standing });
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
