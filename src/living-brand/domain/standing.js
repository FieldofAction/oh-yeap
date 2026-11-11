// Standing: the four separate questions every piece of brand material answers
// for a given purpose. Relevant, authorized, reusable and authoritative are
// never collapsed into one score.

export const PIPELINE = ['discovered', 'extracted', 'interpreted', 'verified', 'approved'];

export const STANDING_CLASSES = {
  canon: { name: 'Institutional canon', job: 'Governs future work until revised or retired.' },
  precedent: { name: 'Useful precedent', job: 'Worth consulting; does not bind.' },
  contextual: { name: 'Contextual success', job: 'Worked where it was made; transfer must be argued.' },
  experiment: { name: 'Experiment', job: 'Being tried; carries no authority yet.' },
  operational: { name: 'Operational material', job: 'Used to get work done; not a statement of the brand.' },
  archive: { name: 'Learning archive', job: 'Kept for what it teaches, including rejections.' },
};

// How the brand's knowledge was obtained. It changes what can be claimed.
export const BASES = {
  fictional: { name: 'Fictional', note: 'Invented for demonstration.' },
  'company-record': { name: 'Company record', note: 'Entered with the company, by people who can speak for it.' },
  'public-source': { name: 'Public-source study', note: 'Read from public material only. Not the company\'s own record.' },
};

export const isPublicStudy = brand => brand?.basis === 'public-source';

export const pipelineRank = stage => PIPELINE.indexOf(stage);

export const isEffective = (window, asOf) => {
  if (!window) return true;
  if (window.from && asOf && asOf < window.from) return false;
  if (window.to && asOf && asOf >= window.to) return false;
  return true;
};

const human = c => c.replace('-', ' ');

// Purpose: { channels: ['owned-web', ...], terms: ['paper-cut'], asOf, until }
export function assessStanding(item, purpose = {}) {
  const asOf = purpose.asOf;
  const reasons = { relevant: [], authorized: [], reusable: [], authoritative: [] };

  // Relevant: does it bear on the question? Says nothing about permission.
  const hay = `${item.title} ${item.text || ''} ${(item.tags || []).join(' ')} ${item.rationale || ''}`.toLowerCase();
  const matched = (purpose.terms || []).filter(t => hay.includes(t.toLowerCase()));
  const relevant = !purpose.terms?.length || matched.length > 0;
  reasons.relevant.push(relevant
    ? (matched.length ? `Matches ${matched.join(', ')}.` : 'No query given.')
    : 'Does not match the question.');

  // Authorized: sanctioned by the company, checked, not superseded, and current.
  // "Published" means the company put it out on its own channel: evidence of
  // sanction, but not an approval anyone in this system recorded.
  let authorized = true;
  const status = item.approval?.status;
  if (status !== 'approved' && status !== 'published') {
    authorized = false;
    reasons.authorized.push(status === 'rejected' ? 'Rejected.' : status === 'pending' ? 'Approval pending.' : 'Never approved.');
  }
  if (pipelineRank(item.pipeline) < pipelineRank('verified')) { authorized = false; reasons.authorized.push(`Only ${item.pipeline}; not checked against its source.`); }
  if (item.supersededBy) { authorized = false; reasons.authorized.push(`Superseded by ${item.supersededBy}.`); }
  // A campaign's flight ending does not withdraw its approval; canon leaving its effective dates does.
  if (asOf && item.standing === 'canon' && item.period && !isEffective(item.period, asOf)) { authorized = false; reasons.authorized.push('Outside its effective dates.'); }
  if (authorized) {
    reasons.authorized.push(status === 'published'
      ? `Published by ${item.approval.by || 'the company'}${item.approval.date ? ` on ${item.approval.date}` : ''}. No internal approval record seen.`
      : `Approved by ${item.approval.by} on ${item.approval.date}.`);
  }

  // Reusable: rights cover the intended channels on the intended date.
  const rights = item.rights || { status: 'unknown' };
  let reusable = false;
  if (rights.status === 'unknown') reasons.reusable.push('Rights unknown.' + (rights.note ? ` ${rights.note}` : ''));
  else if (rights.status === 'expired') reasons.reusable.push('Rights expired.');
  else {
    const allowed = rights.channels || [];
    const wanted = purpose.channels || [];
    const missing = wanted.filter(c => !allowed.includes(c) && !allowed.includes('all'));
    const expired = rights.until && asOf && asOf > rights.until;
    const lapsesDuring = rights.until && purpose.until && purpose.until > rights.until;
    if (expired) reasons.reusable.push(`Licence ended ${rights.until}.`);
    else if (missing.length) reasons.reusable.push(`Not licensed for ${missing.map(human).join(', ')}.`);
    else if (lapsesDuring) reasons.reusable.push(`Licence ends ${rights.until}, before the work would finish.`);
    else { reusable = true; reasons.reusable.push(wanted.length ? `Licensed for ${wanted.map(human).join(', ')}.` : 'Rights cleared.'); }
    if (rights.note && !reusable) reasons.reusable.push(rights.note);
  }

  // Authoritative: canon, in force. Reuse and popularity do not count.
  const authoritative = item.standing === 'canon' && authorized;
  const record = item.standingRecord;
  reasons.authoritative.push(authoritative
    ? (record?.basis === 'reading'
      ? `Read as canon from public material${record.scope ? `: ${record.scope}` : ''}. The company has not confirmed it here.`
      : `Canon since ${record?.date || 'unknown'}${record?.scope ? `: ${record.scope}` : ''}.`)
    : `${STANDING_CLASSES[item.standing]?.name || 'Unclassified'}${item.standing === 'canon' ? ', but not authorized' : ''}${item.reuse?.length ? `, reused ${item.reuse.length} times; reuse confers no authority` : ''}.`);

  return { relevant, authorized, reusable, authoritative, reasons };
}

export function rulesInForce(rules, asOf) {
  return rules.filter(r => isEffective(r.effective, asOf) && r.standing !== 'retired');
}
