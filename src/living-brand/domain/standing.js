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

export const pipelineRank = stage => PIPELINE.indexOf(stage);

export const isEffective = (window, asOf) => {
  if (!window) return true;
  if (window.from && asOf < window.from) return false;
  if (window.to && asOf >= window.to) return false;
  return true;
};

// Purpose: { channels: ['owned-web', ...], terms: ['paper-cut'], level, asOf }
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

  // Authorized: approved through the pipeline, not superseded, and current.
  let authorized = true;
  if (item.approval?.status !== 'approved') { authorized = false; reasons.authorized.push(item.approval?.status === 'rejected' ? 'Rejected.' : 'Never approved.'); }
  if (pipelineRank(item.pipeline) < pipelineRank('verified')) { authorized = false; reasons.authorized.push(`Only ${item.pipeline}; not verified.`); }
  if (item.supersededBy) { authorized = false; reasons.authorized.push(`Superseded by ${item.supersededBy}.`); }
  if (asOf && item.period && !isEffective(item.period, asOf) && item.standing === 'canon') { authorized = false; reasons.authorized.push('Outside its effective dates.'); }
  if (authorized) reasons.authorized.push(`Approved by ${item.approval.by} on ${item.approval.date}.`);

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
    const human = c => c.replace('-', ' ');
    if (expired) reasons.reusable.push(`Licence ended ${rights.until}.`);
    else if (missing.length) reasons.reusable.push(`Not licensed for ${missing.map(human).join(', ')}.`);
    else if (lapsesDuring) reasons.reusable.push(`Licence ends ${rights.until}, before the work would finish.`);
    else { reusable = true; reasons.reusable.push(wanted.length ? `Licensed for ${wanted.map(human).join(', ')}.` : 'Rights cleared.'); }
    if (rights.note && !reusable) reasons.reusable.push(rights.note);
  }

  // Authoritative: canon, in force. Reuse and popularity do not count.
  const authoritative = item.standing === 'canon' && authorized;
  reasons.authoritative.push(authoritative
    ? `Canon since ${item.standingRecord?.date || 'unknown'}${item.standingRecord?.scope ? `: ${item.standingRecord.scope}` : ''}.`
    : `${STANDING_CLASSES[item.standing]?.name || 'Unclassified'}${item.reuse?.length ? `, reused ${item.reuse.length} times; reuse confers no authority` : ''}.`);

  return { relevant, authorized, reusable, authoritative, reasons };
}

export function rulesInForce(rules, asOf) {
  return rules.filter(r => isEffective(r.effective, asOf) && r.standing !== 'retired');
}
