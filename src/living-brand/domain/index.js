export * from './standing.js';
export * from './isolation.js';
export * from './inquiry.js';
export * from './governance.js';
export * from './transfer.js';

import { openTenant } from './isolation.js';

// The vault stands in for company-owned storage. Only openTenant reads it.
export function startEngagement(vault, engagement) {
  const tenant = openTenant(vault, engagement);
  return {
    tenant: tenant.tenant,
    brand: JSON.parse(JSON.stringify(tenant.brand)),
    engagement: JSON.parse(JSON.stringify(engagement)),
    choices: [], proposals: [], decisions: [],
  };
}
