export * from './standing.js';
export * from './isolation.js';
export * from './inquiry.js';
export * from './governance.js';
export * from './transfer.js';

import { openTenant } from './isolation.js';
import { readPacket } from './transfer.js';

// The vault stands in for company-owned storage. Only openTenant reads it.
export function startEngagement(vault, engagement, record = {}, { asOf } = {}) {
  const tenant = openTenant(vault, engagement, { asOf });
  return {
    tenant: tenant.tenant,
    brand: JSON.parse(JSON.stringify(tenant.brand)),
    engagement: JSON.parse(JSON.stringify(engagement)),
    choices: record?.choices || [], proposals: record?.proposals || [], decisions: record?.decisions || [], answers: record?.answers || [], seq: record?.seq || 0,
  };
}

// Open a packet: one brand partition and its engagement, and nothing else.
export function startFromPacket(packet, { asOf } = {}) {
  const { brand, engagement, record } = readPacket(packet);
  return startEngagement({ [brand.id]: brand }, engagement, record, { asOf });
}
