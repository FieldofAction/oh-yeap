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
  'company-record': { name: 'Company record', note: 'The company\'s own material. Each record says where it came from and whether anyone has checked it.' },
  'public-source': { name: 'Public-source study', note: 'Read from public material only. Not the company\'s own record.' },
};

export const isPublicStudy = brand => brand?.basis === 'public-source';

// In a study the same six classes are an outsider's reading, and are named as
// one. Nothing in a study may be taken for the company's own classification.
export const STUDY_CLASSES = {
  canon: { name: 'Read as current', job: 'This study reads it as what the company uses now. Only the company can say what governs.' },
  precedent: { name: 'Read as earlier work', job: 'This study reads it as work that came before what is used now.' },
  contextual: { name: 'Seen in use, standing unclear', job: 'It has been seen in use. Whether the company treats it as settled is not known.' },
  experiment: { name: 'Read as a trial', job: 'This study reads it as something being tried.' },
  operational: { name: 'On the public record', job: 'Something the company did or published. It is not read here as a statement of the brand.' },
  archive: { name: 'Read as past', job: 'This study reads it as no longer in use.' },
};
export const classOf = (standing, brand) => (isPublicStudy(brand) ? STUDY_CLASSES : STANDING_CLASSES)[standing] || { name: 'Unclassified', job: '' };

// A record may say in its own words how it was put together. That replaces the general note.
export const basisNote = brand => String(brand?.basisNote || '').trim() || BASES[brand?.basis]?.note || '';

// Reasons are read by people: names, not ids, and dates written out.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function longDate(d) {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(d || ''));
  if (!m) return String(d || 'an unrecorded date');
  if (!m[2]) return m[1];
  const month = MONTHS[Number(m[2]) - 1] || m[2];
  return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`;
}
// "on 11 November 2026", "in July 2020", "in 2020": the preposition follows how much of the date is known.
export const onDate = d => (/^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? `on ${longDate(d)}` : /^\d{4}/.test(String(d || '')) ? `in ${longDate(d)}` : `on ${longDate(d)}`);
const nameOf = (brand, id, me) => (me && id === me ? 'you' : brand?.people?.[id]?.name || id || 'someone unrecorded');
const times = n => `${n} time${n === 1 ? '' : 's'}`;

export const pipelineRank = stage => PIPELINE.indexOf(stage);

export const isEffective = (window, asOf) => {
  if (!window) return true;
  if (window.from && asOf && asOf < window.from) return false;
  if (window.to && asOf && asOf >= window.to) return false;
  return true;
};

const human = c => c.replace('-', ' ');

// Matching is by whole word, so "IPA" does not find "participation". A
// hyphenated word also answers to its parts and to its joined form, and a
// term of four letters or more finds words that begin with it.
export const searchText = item => [item.title, item.text, (item.tags || []).join(' '), item.rationale, item.kind, item.element, item.workType, item.period?.from?.slice(0, 4)].filter(Boolean).join(' ');
// Words that are in everything find nothing worth finding.
export const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'has', 'have', 'not', 'but', 'its', 'our', 'your', 'you', 'all', 'any', 'can', 'into', 'than', 'then', 'what', 'when', 'who', 'how', 'why', 'out', 'one', 'of', 'to', 'in', 'on', 'at', 'by', 'an', 'as', 'is', 'it', 'or', 'be', 'we', 'no', 'so', 'if', 'up', 'do']);
export function wordsOf(text) {
  const raw = String(text || '').toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter(Boolean);
  return new Set(raw.flatMap(w => [w, w.replace(/-/g, ''), ...w.split('-')]).filter(Boolean));
}
export function termHits(term, words) {
  const t = String(term || '').toLowerCase();
  if (!t) return false;
  if (words.has(t) || words.has(t.replace(/-/g, ''))) return true;
  if (t.length < 4) return false;
  for (const w of words) if (w.startsWith(t)) return true;
  return false;
}

// Which of the wanted channels a licence does not cover. "all" covers everything.
export function uncoveredChannels(rights, wanted = []) {
  const allowed = rights?.channels || [];
  if (allowed.includes('all')) return [];
  return wanted.filter(c => !allowed.includes(c));
}

// Purpose: { channels: ['owned-web', ...], terms: ['paper-cut'], asOf, until }
// Pass the brand as well when you have it, so a replacement that has not yet
// taken effect does not retire the thing it will replace.
export function assessStanding(item, purpose = {}, brand = null) {
  const asOf = purpose.asOf;
  const reasons = { relevant: [], authorized: [], reusable: [], authoritative: [] };

  // Relevant: does it bear on the question? Says nothing about permission.
  const hay = wordsOf(searchText(item));
  const matched = (purpose.terms || []).filter(t => termHits(t, hay));
  // With no question asked, relevance has no answer; asked says which case this is.
  const asked = Boolean(purpose.terms?.length);
  const relevant = !asked || matched.length > 0;
  reasons.relevant.push(relevant
    ? (matched.length ? `Matches ${matched.join(', ')}.` : 'No question asked.')
    : 'Does not match the question.');

  // Authorized: sanctioned by the company, checked, not replaced, not retired, and current.
  // "Published" means the company put it out on its own channel: evidence of
  // sanction, but not an approval anyone in this system recorded.
  const study = isPublicStudy(brand);
  let authorized = true;
  const status = item.approval?.status;
  if (status !== 'approved' && status !== 'published') {
    authorized = false;
    reasons.authorized.push(status === 'rejected' ? 'Rejected.' : status === 'pending' ? 'Approval pending.' : 'Never approved.');
  }
  if (pipelineRank(item.pipeline) < pipelineRank('verified')) { authorized = false; reasons.authorized.push(`Only ${item.pipeline || 'found'}; not checked against its source.`); }
  if (item.retired) { authorized = false; reasons.authorized.push(`Retired ${onDate(item.retired.date)}.`); }
  if (item.supersededBy) {
    const successor = brand?.items?.find(i => i.id === item.supersededBy);
    const pending = successor?.period?.from && asOf && asOf < successor.period.from;
    if (!pending) { authorized = false; reasons.authorized.push(`Superseded by ${successor?.title || item.supersededBy}.`); }
  }
  // A campaign's flight ending does not withdraw its approval; canon leaving its effective dates does.
  // Canon set by a decision recorded here runs from that decision: the dates the work ran are its flight, not its term.
  const term = item.effective || (item.standingRecord?.decisionId ? null : item.period);
  if (asOf && item.standing === 'canon' && term && !isEffective(term, asOf)) { authorized = false; reasons.authorized.push('Outside its effective dates.'); }
  if (authorized) {
    reasons.authorized.push(status === 'published'
      ? `Published by ${item.approval.by || 'the company'}${item.approval.date ? ` ${onDate(item.approval.date)}` : ''}. No internal approval record seen.`
      : `Approved by ${nameOf(brand, item.approval.by, purpose.me)} ${onDate(item.approval.date)}.`);
  }
  // A study is an outsider's reading. Publication is not an authorization
  // given to its author, and checking a record against its source changes
  // what the author knows, not what the company has allowed.
  if (study) {
    authorized = false;
    reasons.authorized = [`${brand.name} has authorized nothing for this study.`];
  }

  // Reusable: rights are known, and cover the intended channels for the intended dates.
  // Anything not positively cleared is not reusable.
  const rights = item.rights || { status: 'unknown' };
  const wanted = purpose.channels || [];
  let reusable = false;
  // Material that carries a claim the record says is no longer true cannot be reused as it stands.
  const untrue = study ? [] : (brand?.claims || []).filter(c => (c.usedIn || []).includes(item.id)).filter(c => {
    const fact = (brand?.facts || []).find(f => f.id === c.contradictedBy);
    return fact?.date && asOf && fact.date <= asOf;
  });
  if (rights.status === 'own') {
    // The brand's own rules and values: nothing in it is anyone else's to license.
    reusable = true; reasons.reusable.push(rights.note || 'The brand\'s own rules and values. Nothing in it is licensed from anyone else.');
  } else if (rights.status === 'cleared' || rights.status === 'restricted') {
    const missing = uncoveredChannels(rights, wanted);
    const expired = rights.until && asOf && asOf > rights.until;
    const lapsesDuring = rights.until && purpose.until && purpose.until > rights.until;
    const scope = (rights.channels || []).includes('all') ? 'every channel' : (rights.channels || []).map(human).join(', ') || 'no channel';
    if (expired) reasons.reusable.push(`Licence ended ${longDate(rights.until)}.`);
    // Cleared with no channel named is a clearance without channel limits.
    else if (rights.status === 'cleared' && !(rights.channels || []).length) { reusable = true; reasons.reusable.push(study ? 'A public licence covers it.' : 'Cleared, with no channel limits recorded.'); }
    else if (missing.length) reasons.reusable.push(`Not licensed for ${missing.map(human).join(', ')}. ${rights.status === 'cleared' ? 'Cleared' : 'Licensed'} for ${scope} only.`);
    else if (lapsesDuring) reasons.reusable.push(`Licence ends ${longDate(rights.until)}, before the work would finish.`);
    else if (rights.status === 'restricted' && !(rights.channels || []).length) reasons.reusable.push('Its use is restricted, and no permitted use is recorded.');
    else if (!wanted.length && rights.status === 'restricted') reasons.reusable.push(`No channel named for this use. Licensed for ${scope} only.`);
    else { reusable = true; reasons.reusable.push(study ? 'A public licence covers it.' : wanted.length ? `Licensed for ${wanted.map(human).join(', ')}.` : `Rights cleared for ${scope}.`); }
    // What the licence does and does not cover is said either way.
    if (rights.note) reasons.reusable.push(rights.note);
  } else if (rights.status === 'expired') {
    reasons.reusable.push('Rights expired.');
  } else {
    reasons.reusable.push((rights.status && rights.status !== 'unknown' ? `Rights recorded as "${rights.status}", which is not a status this record recognises.` : 'Rights unknown.') + (rights.note ? ` ${rights.note}` : ''));
  }

  // Whatever the licence says, material carrying a claim that is no longer true is not reused as it stands. Both are said.
  if (untrue.length) {
    reusable = false;
    reasons.reusable.unshift(...untrue.map(c => `Carries a claim that is no longer true: "${String(c.statement).replace(/[.]+$/, '')}".`));
  }

  // Authoritative: canon, in force. Reuse and popularity do not count.
  // In a study nothing is authoritative: what governs is the company's to say.
  const authoritative = !study && item.standing === 'canon' && authorized;
  const record = item.standingRecord;
  reasons.authoritative.push(study
    ? `${STUDY_CLASSES[item.standing]?.name || 'Unclassified'}. That is this study's reading; only ${brand.name} can say what governs.`
    : authoritative
      ? `Canon since ${record?.date ? longDate(record.date) : 'an unrecorded date'}${record?.scope ? `: ${record.scope}` : ''}.`
      : `${STANDING_CLASSES[item.standing]?.name || 'Unclassified'}${item.standing === 'canon' ? ', but not authorized' : ''}${item.reuse?.length ? `, reused ${times(item.reuse.length)}; reuse confers no authority` : ''}.`);

  return { relevant, asked, authorized, reusable, authoritative, reasons };
}

// A rule is a statement made by some piece of material. Unless it carries a
// standing of its own, it has the standing of that material: adopting the
// source as canon is what makes its rules canon.
// A rule whose source has been retired no longer binds, whatever it says of itself.
export function effectiveRules(brand) {
  const items = new Map((brand.items || []).map(i => [i.id, i]));
  return (brand.rules || []).map(r => {
    const source = items.get(r.source);
    if (source?.retired) return { ...r, standing: 'archive', inherited: true };
    if (r.standing) return r;
    // The person who adopted the source said which kinds of work it covers. That, not the scope the record arrived with, is what its rules bind.
    const covers = source?.standing === 'canon' ? source.standingRecord?.covers : null;
    return { ...r, standing: source?.standing || 'operational', inherited: true, ...(Array.isArray(covers) && covers.length ? { scope: covers } : {}) };
  });
}

export function rulesInForce(rules, asOf) {
  return rules.filter(r => isEffective(r.effective, asOf) && r.standing !== 'retired' && r.standing !== 'archive');
}
