// What the public page may open: the fictional brand, and nothing else.
// Other clients appear here only as engagement metadata, never as material.
import { fernway } from './data/fernway.js';
import { engagements, closed, practitioner, agency, connections, AS_OF } from './data/workspace.js';

export const publicCatalog = {
  asOf: AS_OF,
  practitioner,
  open: [{ brand: fernway, engagement: engagements['eng-fernway'] }],
  closed,
  agency,
  connections,
};
