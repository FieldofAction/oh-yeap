// Inquiry: orientation, tensions, change, precedent transfer and the brief.
// Every finding cites the material it rests on. All of it is deterministic;
// no model is involved, so nothing here should be mistaken for judgment.
// Interpretation that a person wrote (strengths, hypotheses, reasons) lives on
// the engagement and is only shown when the evidence it cites exists.

import { assessStanding, classOf, effectiveRules, isPublicStudy, longDate, pipelineRank, rulesInForce, uncoveredChannels } from './standing.js';

// Lookups are built without a prototype, so an id or topic such as "constructor" is only ever a key.
const byId = brand => Object.assign(Object.create(null), Object.fromEntries((brand.items || []).map(i => [i.id, i])));
const group = (list, key) => { const out = Object.create(null); for (const x of list) (out[key(x)] ||= []).push(x); return out; };
const decidersOf = (brand, power) => (isPublicStudy(brand) ? [] : (Array.isArray(brand.authority?.[power]) ? brand.authority[power] : []));
const names = (brand, ids) => (ids || []).map(id => brand.people?.[id]?.name || id);
// With no kind of work named for the project, there is nothing to filter by: every rule is in view.
const appliesTo = (rule, workTypes) => !workTypes.length || !rule.scope || rule.scope.includes('all') || rule.scope.some(s => workTypes.includes(s));
// A quoted line keeps its own words and loses its closing stop, so the sentence around it can end once.
const quote = s => `"${String(s || '').trim().replace(/[.]+$/, '')}"`;
// What a piece of material does on a topic: a plain code, or { value, says } where the record puts it in a sentence.
const usage = v => (v && typeof v === 'object' ? { value: v.value, says: String(v.says || '').trim() } : { value: v, says: '' });
const spoken = v => String(v ?? '').replace(/[+]/g, ', ').replace(/-/g, ' ');

// Tensions are things a practitioner must see before making anything.
// For a public-source study the wording stays short of asserting what only
// the company could know.
export function findTensions(brand, { asOf, workTypes = [], channels = [] }) {
  const out = [];
  const items = byId(brand);
  const allRules = effectiveRules(brand);
  const live = rulesInForce(allRules, asOf);
  const study = isPublicStudy(brand);
  const authority = new Proxy({}, { get: (_, power) => decidersOf(brand, power) });

  // Contradictory rules in force for this project's work types.
  const topics = group(live.filter(r => appliesTo(r, workTypes)), r => r.topic);
  for (const [topic, rs] of Object.entries(topics)) {
    const values = new Set(rs.map(r => r.value));
    if (values.size > 1) {
      const owners = [...new Set(rs.map(r => r.owner).filter(Boolean))];
      const from = r => `the ${r.standing === 'canon' ? 'canon' : 'written'} rule from ${items[r.source]?.title || r.source}`;
      const whose = owners.length === 1 && rs.every(r => r.owner)
        ? `${brand.people?.[owners[0]]?.name || owners[0]} decides both: ${rs.map(from).join(' and ')}.`
        : `${rs.map(r => `${brand.people?.[r.owner]?.name || 'No named owner'} for ${from(r)}`).join('; ')}.`;
      // Written rules that nobody adopted are not in force; they still cannot both be followed.
      const canonCount = rs.filter(r => r.standing === 'canon').length;
      const heading = canonCount === rs.length ? `${rs.length === 2 ? 'Two' : 'Several'} rules in force disagree`
        : canonCount ? 'A rule in force and a written rule disagree' : `${rs.length === 2 ? 'Two' : 'Several'} written rules disagree`;
      out.push({
        id: `t-conflict-${topic}`, kind: 'Conflicting guidance', severity: 'decide',
        title: `${heading}: ${rs.map(r => quote(r.statement)).join(' and ')}`,
        detail: `${workTypes.length ? `Both apply to this project (${workTypes.join(', ')}). ` : ''}${whose} Neither outranks the other until someone with authority scopes them.`,
        sources: [...new Set(rs.map(r => r.source))], owners, ruleIds: rs.map(r => r.id), power: `standing.${rs[0].domain || 'visual'}`,
      });
    }
  }

  // Material that does not follow a rule in force. Against canon that is
  // drift. Against a rule nobody has adopted, neither side is wrong yet:
  // someone has to decide which stands. History is not checked.
  for (const item of brand.items) {
    if (item.standing === 'archive') continue;
    const departs = [];
    const drifts = [];
    const outside = [];
    for (const [topic, raw] of Object.entries(item.uses || {})) {
      const { value, says } = usage(raw);
      // A rule binds a piece of work only if its scope covers that kind of work.
      const reaches = r => !r.scope || r.scope.includes('all') || r.scope.includes(item.workType);
      const onTopic = live.filter(r => r.topic === topic && reaches(r));
      // Canon adopted for other kinds of work does not bind this piece. Where the
      // piece differs from it, that is still worth seeing: it is how a decider
      // learns the canon's reach was drawn short, or rightly.
      if (!onTopic.length && !study) {
        const elsewhere = live.filter(r => r.topic === topic && r.standing === 'canon' && !reaches(r) && r.value !== value);
        if (elsewhere.length && !live.some(r => r.topic === topic && r.value === value)) outside.push({ rule: elsewhere[0], has: spoken(value), says });
      }
      if (!onTopic.length || onTopic.some(r => r.value === value)) continue;
      const canon = onTopic.find(r => r.standing === 'canon');
      if (!canon) { departs.push({ rule: onTopic[0], has: spoken(value), says }); continue; }
      const retired = allRules.find(r => r.topic === topic && r.value === value && r.effective?.to && asOf && r.effective.to <= asOf);
      drifts.push({ canon, retired, has: spoken(value), says });
    }
    // One entry per piece of material, however many canon rules it departs from.
    if (drifts.length) {
      const allRetired = drifts.every(d => d.retired);
      const what = d => (d.retired ? `It matches ${quote(d.retired.statement)}, retired ${longDate(d.retired.effective.to)}.` : d.says || `It has ${d.has}.`);
      out.push({
        id: `t-drift-${item.id}`, kind: study ? 'Differs from what is read as current' : 'Drift from canon', severity: 'repair',
        title: study ? `${item.title} differs from what this study reads as current${drifts.length > 1 ? ` on ${drifts.length} points` : ''}`
          : allRetired ? `${item.title} still follows a retired rule` : `${item.title} departs from canon${drifts.length > 1 ? ` on ${drifts.length} points` : ''}`,
        detail: `${drifts.length === 1 ? `${what(drifts[0])} ${study ? 'Read as current' : 'Canon'}: ${quote(drifts[0].canon.statement)}.` : `Each point is listed with the rule it ${study ? 'differs' : 'departs'} from.`}${item.provenance?.origin === 'generated' ? ' This file was written by a model; its defaults are not brand evidence.' : ''}`,
        points: drifts.length > 1 ? drifts.map(d => ({ rule: d.canon.statement, has: d.has, says: d.retired ? what(d) : d.says, ruleId: d.canon.id })) : undefined,
        sources: [...new Set([item.id, ...drifts.map(d => d.canon.source)])],
        owners: [...new Set(drifts.flatMap(d => authority[`standing.${d.canon.domain || 'visual'}`]))], power: `standing.${drifts[0].canon.domain || 'visual'}`,
      });
    }
    if (outside.length) {
      const kinds = [...new Set(outside.flatMap(d => d.rule.scope || []))];
      out.push({
        id: `t-outside-${item.id}`, kind: 'Outside what canon covers', severity: 'decide',
        title: `${item.title} differs from canon that covers other work`,
        detail: `${outside.length === 1 ? 'This rule is' : 'These rules are'} canon for ${kinds.join(', ').toLowerCase() || 'other work'} only, and this is ${String(item.workType || 'other work').toLowerCase()}. It is not a departure. Whether the canon should reach this work too is a separate decision.`,
        points: outside.map(d => ({ rule: d.rule.statement, has: d.has, says: d.says, ruleId: d.rule.id })),
        sources: [...new Set([item.id, ...outside.map(d => d.rule.source)])],
        owners: [...new Set(outside.flatMap(d => authority[`standing.${d.rule.domain || 'visual'}`]))], power: `standing.${outside[0].rule.domain || 'visual'}`,
      });
    }
    if (departs.length) {
      const sourcesOfRules = [...new Set(departs.map(d => d.rule.source).filter(Boolean))];
      const byModel = sourcesOfRules.some(id => items[id]?.provenance?.origin === 'generated');
      out.push({
        id: `t-mismatch-${item.id}`, kind: 'Material and written rule disagree', severity: 'decide',
        title: `${item.title} departs from ${departs.length} written rule${departs.length === 1 ? '' : 's'}`,
        detail: `None of these rules is canon${byModel ? ', and some were written by a model' : ''}, so neither side is wrong yet. Someone has to decide which stands.`,
        points: departs.map(d => ({ rule: d.rule.statement, has: d.has, says: d.says, ruleId: d.rule.id })),
        sources: [item.id, ...sourcesOfRules],
        owners: [...new Set(departs.flatMap(d => authority[`standing.${d.rule.domain || 'visual'}`]))], power: `standing.${departs[0].rule.domain || 'visual'}`,
      });
    }
  }

  // Claims: contradicted by a later fact, or never checked.
  for (const c of brand.claims || []) {
    const fact = (brand.facts || []).find(f => f.id === c.contradictedBy);
    const usedIn = (c.usedIn || []).map(id => items[id]?.title || id).join(', ');
    // A fact with no date cannot be said to come later. It is a disagreement, not a stale claim.
    const disputed = [...(c.disputedBy || []), ...(fact && !fact.date ? [fact.id] : [])];
    // Quotation marks are for words the record marks as quoted. A paraphrase is given plainly.
    const said = c.isQuote === false ? String(c.statement || '').trim().replace(/[.]+$/, '') : quote(c.statement);
    if (fact && fact.date && fact.date <= asOf) {
      // In a study the pairing is the author's. It is said as a pairing, never as a finding about the company.
      const note = String(c.tensionNote || '').trim();
      const own = /pairing is (this|the) study's/i.test(note) ? '' : ' The pairing is this study\'s own.';
      out.push(study ? {
        id: `t-stale-${c.id}`, kind: 'Statement set beside a later report', severity: 'repair',
        title: `Set beside a later report: ${said}`,
        // Where the study has written the pairing out, that is the whole entry: the note carries the report and its limits.
        detail: `${note || fact.statement}${own}`.trim(),
        sources: [...new Set([...(c.usedIn || []), fact.source].filter(Boolean))], owners: [], power: 'claims',
      } : {
        id: `t-stale-${c.id}`, kind: 'Stale claim', severity: 'repair',
        title: `${said} is no longer true`,
        detail: `${fact.statement}${usedIn ? ` The claim still appears in ${usedIn}.` : ''}${note ? ` ${note}` : ''}`,
        sources: [...new Set([...(c.usedIn || []), fact.source].filter(Boolean))], owners: authority.claims, power: 'claims',
      });
    } else if (disputed.length) {
      // Two records say different things. Nothing here says which is right.
      const others = (brand.facts || []).filter(f => disputed.includes(f.id));
      out.push({
        id: `t-disputed-${c.id}`, kind: 'Records disagree', severity: 'decide',
        title: `${said} does not match another record`,
        detail: `${others.map(f => f.statement).join(' ')}${usedIn ? ` The claim appears in ${usedIn}.` : ''}${c.tensionNote ? ` ${c.tensionNote}` : ' Nothing recorded says which is right.'}`,
        sources: [...new Set([...(c.usedIn || []), ...others.map(f => f.source)].filter(Boolean))], owners: authority.claims, power: 'claims',
      });
    } else if (!study && !c.verifiedOn && c.kind !== 'meaning' && !(brand.facts || []).some(f => f.id === c.supportedBy)) {
      // A claim someone could be asked to back up, with nothing on file that does.
      // What a brand says its own work means is not that kind of claim, and a
      // claim the record already ties to a fact is not unconfirmed.
      out.push({
        id: `t-unsupported-${c.id}`, kind: 'Claim not yet confirmed', severity: 'repair',
        title: `${said} has nothing on file behind it`, detail: `${usedIn ? `Used in ${usedIn}. ` : ''}${c.tensionNote || 'No one has recorded checking it.'}`,
        sources: c.usedIn || [], owners: authority.claims, power: 'claims',
      });
    }
  }

  // Rights that are unknown for material in use, or that do not cover the plan.
  for (const item of brand.items) {
    if (item.standing === 'archive' && item.approval?.status === 'rejected') continue;
    const r = item.rights || {};
    // The record's own word on whether it is in use comes first. Otherwise recorded reuse, or being built on, counts.
    const isUsedNow = typeof item.inUse === 'boolean' ? item.inUse : Boolean((item.relations || []).some(rel => rel.type === 'derived from') || item.reuse?.length);
    const known = ['cleared', 'restricted', 'expired', 'own'].includes(r.status);
    // A study may reuse nothing, so the terms for reusing a piece are not something it has to settle.
    if (!study && !known && (isUsedNow || pipelineRank(item.pipeline) >= pipelineRank('verified'))) {
      out.push({ id: `t-rights-${item.id}`, kind: 'Unknown rights', severity: 'investigate',
        title: isUsedNow ? `${item.title} is in use with unreviewed rights` : `${item.title}: its rights have not been reviewed`,
        detail: r.note || 'No licence on file.', sources: [item.id], owners: authority.rights, power: 'rights' });
    }
    if (r.until && r.until >= asOf && channels.length && (item.functions || []).length) {
      const missing = uncoveredChannels(r, channels);
      if (missing.length) out.push({ id: `t-licence-${item.id}`, kind: 'Licence does not cover the plan', severity: 'investigate',
        title: `${item.title} is not licensed for ${missing.map(c => c.replace('-', ' ')).join(', ')}`, detail: r.note || `Ends ${longDate(r.until)}.`, sources: [item.id], owners: authority.rights, power: 'rights' });
    }
  }

  // Impact claims that outrun their evidence. A record says so explicitly
  // with attribution: 'not-established'; older records are matched by wording.
  for (const item of brand.items) {
    for (const e of item.evidence || []) {
      // Only something that happened can be mistaken for something the work caused.
      // What was intended, and what its maker noted, is not an outcome.
      const outcome = e.type === 'observed' || e.type === 'contribution' || e.type === 'transfer';
      const flagged = outcome && (e.attribution === 'not-established' || (e.type === 'observed' && e.basis === 'reported' && /no control|same weeks/i.test(e.statement)));
      if (flagged) {
        out.push({ id: `t-impact-${e.id}`, kind: 'Attribution not established', severity: 'investigate',
          title: `${item.title}: ${String(e.attributionNote || '').trim().replace(/[.]+$/, '') || 'a result is reported, and nothing recorded ties it to this work'}`,
          detail: `${e.statement}${e.note ? ` ${e.note}` : ''}`, sources: [...new Set([item.id, e.source].filter(Boolean))] });
      }
    }
  }

  // Missing evidence stays visible.
  for (const item of brand.items) {
    if (item.pipeline === 'discovered') out.push({ id: `t-missing-${item.id}`, kind: 'Missing evidence', severity: 'investigate',
      title: `${item.title}: found, not understood`, detail: `${item.text || ''} Purpose, audience and rights are unknown.`.trim(), sources: [item.id] });
  }

  // Decisions nobody has been named to make, kept as one visible gap. A study
  // says once, where it describes itself, that it cannot know who decides.
  const unnamed = study ? [] : unnamedPowers(brand).map(power => POWERS[power]);
  if (unnamed.length) {
    out.push({ id: 't-authority-unnamed', kind: 'No one named to decide', severity: 'decide',
      title: `No one is named to decide ${unnamed.join(', ')} at ${brand.name}`,
      detail: study ? `A public-source study cannot establish this. Only ${brand.name} can say who decides.` : 'Until someone is named, proposals and choices in these areas wait.',
      sources: [], unnamed });
  }
  // Read in the order they matter: records that contradict each other, then
  // departures, then what is unconfirmed or unreviewed, then the standing gap
  // in who decides. Within a kind, the entry with the most points comes first.
  const rank = t => { const k = TENSION_ORDER.indexOf(t.kind); return k < 0 ? TENSION_ORDER.length : k; };
  return out.map((t, k) => [t, k]).sort(([a, i], [b, j]) => rank(a) - rank(b) || (b.points?.length || 0) - (a.points?.length || 0) || i - j).map(([t]) => t);
}

export const TENSION_ORDER = [
  'Conflicting guidance', 'Records disagree', 'Stale claim', 'Statement set beside a later report', 'Drift from canon', 'Differs from what is read as current', 'Material and written rule disagree', 'Outside what canon covers',
  'Claim not yet confirmed', 'Licence does not cover the plan', 'Unknown rights', 'Attribution not established', 'Missing evidence', 'No one named to decide',
];

// Every area of decision is either held by a named person or it is a gap.
// A brand that records no authority at all has every gap.
export const unnamedPowers = brand => Object.keys(POWERS).filter(power => !decidersOf(brand, power).length);

export const POWERS = {
  'standing.visual': 'visual standing', 'standing.verbal': 'verbal standing', 'standing.sonic': 'sonic standing',
  'standing.product': 'product standing', claims: 'public claims', rights: 'usage rights', offer: 'the offer', publish: 'publishing',
};

// What changed, read from the record itself: material that replaced other
// material, and rules whose value changed over time.
export function changeLedger(brand, { asOf } = {}) {
  const items = byId(brand);
  const replaced = (brand.items || []).filter(i => i.supersededBy && items[i.supersededBy]).map(i => {
    const next = items[i.supersededBy];
    return { kind: 'material', before: i, after: next, when: next.period?.from || next.made?.date || null, rationale: next.rationale || '' };
  }).filter(c => !asOf || !c.when || c.when <= asOf); // a replacement that has not happened yet is not history
  const rules = [];
  for (const [topic, rs] of Object.entries(group(brand.rules || [], r => r.topic))) {
    const ended = rs.filter(r => r.effective?.to && (!asOf || r.effective.to <= asOf));
    for (const old of ended) {
      // The rule that took over is the earliest one to start at or after the old one's end.
      const next = rs.filter(r => r !== old && r.value !== old.value && r.effective?.from && r.effective.from >= old.effective.to)
        .sort((a, b) => a.effective.from.localeCompare(b.effective.from))[0];
      if (next) rules.push({ kind: 'rule', topic, before: old, after: next, when: next.effective.from });
    }
  }
  return [...replaced, ...rules].sort((a, b) => String(a.when || '').localeCompare(String(b.when || '')));
}

// What happened, in order: the dated facts on record, then the undated ones.
// A change is easier to read against the events around it.
export function timeline(brand, { asOf } = {}) {
  const items = byId(brand);
  const facts = (brand.facts || []).map(f => ({ id: f.id, date: f.date || '', statement: f.statement, source: items[f.source] ? f.source : null, links: f.links || [], ahead: Boolean(asOf && f.date && f.date > asOf) }));
  const key = d => { const [y, m = '99', day = '99'] = String(d).split('-'); return `${y}-${m}-${day}`; };
  const dated = facts.filter(f => f.date).sort((a, b) => key(a.date).localeCompare(key(b.date)));
  return [...dated, ...facts.filter(f => !f.date)];
}

// Hypotheses about the organisation are written by a person on the engagement.
// They are shown only with the evidence they cite, never stated as causes, and
// always routed to whoever decides, if anyone has been named.
export function organizationalHypotheses(brand, engagement = {}) {
  // Evidence is cited to the piece it came from, where the record names one; otherwise to the piece it is recorded on.
  const known = new Set(brand.items.map(i => i.id));
  const ev = Object.fromEntries(brand.items.flatMap(i => (i.evidence || []).map(e => [e.id, { ...e, item: known.has(e.source) ? e.source : i.id }])));
  return (engagement.hypotheses || []).map(h => {
    const evidence = (h.evidenceIds || []).filter(id => ev[id]).map(id => ({ id, statement: ev[id].statement, item: ev[id].item, basis: ev[id].basis }));
    const required = h.requires || [];
    if (!evidence.length || !required.every(id => ev[id])) return null;
    return { id: h.id, title: h.title, statement: h.statement, evidence, uncertainty: h.uncertainty, test: h.test, decision: h.decision, owner: brand.authority?.[h.decision]?.[0] || null };
  }).filter(Boolean);
}

// What carries forward from a precedent into a new brief, element by element.
// Each verdict states the goal change that produced it.
const VERDICTS = {
  preserve: 'Preserve', adapt: 'Adapt', reverse: 'Reverse', retire: 'Retire', investigate: 'Investigate first',
};

export function carryForward(brand, engagement, { asOf }) {
  const carry = engagement.carry;
  if (!carry) return null;
  const items = byId(brand);
  const old = items[carry.precedentId]?.brief;
  const newBrief = engagement.newBrief;
  // Without both briefs there is nothing to compare, and nothing is invented.
  if (!old || !newBrief) return null;
  const also = new Set(carry.also || []);
  const parts = brand.items.filter(i => also.has(i.id) || (i.relations || []).some(r => r.type === 'part of' && r.to === carry.precedentId));
  if (!parts.length) return null;
  const changes = Object.keys(old).filter(k => JSON.stringify(old[k]) !== JSON.stringify(newBrief[k])).map(k => ({ field: k, before: old[k], after: newBrief[k] }));
  const staleFacts = Object.create(null);
  for (const c of brand.claims || []) {
    const fact = (brand.facts || []).find(f => f.id === c.contradictedBy);
    if (fact && fact.date && fact.date <= asOf) for (const id of c.usedIn || []) staleFacts[id] = fact;
  }

  const rows = parts.map(item => {
    const fn = item.functions || (item.standing === 'canon' ? ['recognition'] : []);
    const st = assessStanding(item, { channels: newBrief.channels, asOf, until: newBrief.until }, brand);
    const evidence = (item.evidence || []).filter(e => e.type === 'contribution');
    let verdict, why;
    if (fn.includes('trust-claim') && staleFacts[item.id]) {
      verdict = 'retire'; why = `Its claim no longer holds. ${staleFacts[item.id].statement}`;
    } else if (fn.includes('discovery') && old.goal !== newBrief.goal) {
      verdict = 'reverse'; why = carry.reverseReason || `Made for ${old.goal}. This brief is for ${newBrief.goal}, so the message has to turn around.`;
    } else if (fn.includes('recognition')) {
      // Recognition is only worth carrying if the thing may be used: sanctioned, and licensed for this plan.
      verdict = st.authorized && st.reusable ? 'preserve' : 'investigate';
      why = `Recognition carries over to people who have seen it before${evidence.length ? `: ${evidence.map(e => e.statement).join(' ')}` : '.'}${st.authorized ? '' : ` It is not authorized: ${st.reasons.authorized.join(' ')}`}${st.reusable ? '' : ` It cannot be reused for this plan as it stands: ${st.reasons.reusable.join(' ')}`}`;
    } else {
      verdict = 'adapt'; why = 'Context changed; transfer needs an argument.';
    }
    return { item, verdict, verdictName: VERDICTS[verdict], why, standing: st, evidence };
  });

  return { changes, rows, evidenceNote: carry.evidenceNote || '' };
}

// A brief sets evaluation expectations before work starts and freezes the
// exact sources it rests on.
export function buildBrief(brand, engagement, decisions, { asOf }) {
  const items = byId(brand);
  const sources = new Set();
  decisions = decisions.filter(d => d.status !== 'withdrawn');
  decisions.forEach(d => (d.sources || []).forEach(s => sources.add(s)));
  (engagement.materials || []).forEach(s => sources.add(s));
  const live = rulesInForce(effectiveRules(brand), asOf).filter(r => appliesTo(r, engagement.workTypes || []));
  live.forEach(r => sources.add(r.source));
  const snapshot = [...sources].filter(id => items[id]).map(id => ({
    id, title: items[id].title, pipeline: items[id].pipeline, standing: items[id].standing,
    fingerprint: fingerprint(items[id]),
  }));
  return {
    title: engagement.project,
    objective: engagement.objective,
    audience: engagement.audience,
    channels: engagement.channels,
    // A rule carries what it binds and whether its decider held it back, so no reader takes it for more than it is.
    rules: live.map(r => ({ id: r.id, statement: r.statement, standing: r.standing, ...(isPublicStudy(brand) ? { readAs: classOf(r.standing, brand).name } : {}), ...(Array.isArray(r.scope) ? { covers: r.scope } : {}), ...(r.heldBack ? { heldBack: true } : {}) })),
    decisions: decisions.map(d => ({ verdict: d.verdict, subject: d.subject, rationale: d.rationale, by: d.by, status: d.status })),
    evaluation: engagement.evaluation || [],
    snapshot, frozenAt: asOf,
  };
}

// Stable content fingerprint so a later reader can tell whether a source changed.
export function fingerprint(obj) {
  const s = JSON.stringify(obj, Object.keys(flatKeys(obj)).sort());
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
function flatKeys(o, acc = {}) {
  if (o && typeof o === 'object') for (const k of Object.keys(o)) { acc[k] = 1; flatKeys(o[k], acc); }
  return acc;
}

// An entry is decided when the person named for it has recorded a choice about it,
// or accepted one. It is then no longer waiting for a decision; carrying the
// decision out is separate work.
export const decidedEntries = choices => new Set((choices || []).filter(c => c.about && c.status === 'accepted').map(c => c.about));

export function orientation(brand, engagement, { asOf, answers = [], choices = [] }) {
  const items = byId(brand);
  const canon = brand.items.filter(i => i.standing === 'canon' && assessStanding(i, { asOf }, brand).authoritative);
  const stages = brand.items.reduce((acc, i) => ({ ...acc, [i.pipeline]: (acc[i.pipeline] || 0) + 1 }), {});
  const tensions = findTensions(brand, { asOf, workTypes: engagement.workTypes || [], channels: engagement.channels || [] });
  // What to look at first: one of each kind before a second of any, with
  // disagreements that someone has to settle ahead of the rest.
  const done = decidedEntries(choices);
  const waiting = tensions.filter(t => !done.has(t.id));
  const seen = new Set();
  const first = waiting.filter(t => !seen.has(t.kind) && seen.add(t.kind));
  const attention = [...first, ...waiting.filter(t => !first.includes(t))];
  // Strengths are the practitioner's interpretation, not extracted fact; each must cite sources that exist.
  const strengths = (engagement.strengths || []).filter(st => Array.isArray(st.sources) && st.sources.length && st.sources.every(id => items[id]));
  // What the record cannot answer yet. Kept visible rather than filled in.
  const answered = new Set((answers || []).map(a => a.question));
  const unknowns = (brand.unknowns || []).filter(u => !answered.has(u));
  const gaps = isPublicStudy(brand) ? [] : unnamedPowers(brand);
  if (gaps.length) unknowns.push(`Who decides ${gaps.map(p => POWERS[p]).join(', ').replace(/, ([^,]*)$/, ' and $1')}?`);
  return { intent: brand.intent, canon, stages, strengths, tensions, attention, decided: tensions.filter(t => done.has(t.id)), unknowns, owners: names(brand, brand.intent?.owner ? [brand.intent.owner] : []) };
}
