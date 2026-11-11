// Inquiry: orientation, tensions, change, precedent transfer and the brief.
// Every finding cites the material it rests on. All of it is deterministic;
// no model is involved, so nothing here should be mistaken for judgment.
// Interpretation that a person wrote (strengths, hypotheses, reasons) lives on
// the engagement and is only shown when the evidence it cites exists.

import { assessStanding, effectiveRules, isPublicStudy, pipelineRank, rulesInForce, uncoveredChannels } from './standing.js';

// Lookups are built without a prototype, so an id or topic such as "constructor" is only ever a key.
const byId = brand => Object.assign(Object.create(null), Object.fromEntries((brand.items || []).map(i => [i.id, i])));
const group = (list, key) => { const out = Object.create(null); for (const x of list) (out[key(x)] ||= []).push(x); return out; };
const decidersOf = (brand, power) => (isPublicStudy(brand) ? [] : (Array.isArray(brand.authority?.[power]) ? brand.authority[power] : []));
const names = (brand, ids) => (ids || []).map(id => brand.people?.[id]?.name || id);
const appliesTo = (rule, workTypes) => !rule.scope || rule.scope.includes('all') || rule.scope.some(s => workTypes.includes(s));

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
      const owners = rs.map(r => r.owner).filter(Boolean);
      out.push({
        id: `t-conflict-${topic}`, kind: 'Conflicting guidance', severity: 'decide',
        title: `Two rules in force disagree: ${rs.map(r => `"${r.statement}"`).join(' and ')}`,
        detail: `${workTypes.length ? `Both apply to this project (${workTypes.join(', ')}). ` : ''}${rs.map(r => `${brand.people?.[r.owner]?.name || 'No named owner'} for the ${r.standing} rule from ${items[r.source]?.title || r.source}`).join('; ')}. Neither outranks the other until someone with authority scopes them.`,
        sources: rs.map(r => r.source), owners, ruleIds: rs.map(r => r.id),
      });
    }
  }

  // Material that does not follow a rule in force. Against canon that is
  // drift. Against a rule nobody has adopted, neither side is wrong yet:
  // someone has to decide which stands. History is not checked.
  for (const item of brand.items) {
    if (item.standing === 'archive') continue;
    const departs = [];
    for (const [topic, value] of Object.entries(item.uses || {})) {
      // A rule binds a piece of work only if its scope covers that kind of work.
      const onTopic = live.filter(r => r.topic === topic && (!r.scope || r.scope.includes('all') || r.scope.includes(item.workType)));
      if (!onTopic.length || onTopic.some(r => r.value === value)) continue;
      const canon = onTopic.find(r => r.standing === 'canon');
      if (!canon) { departs.push({ rule: onTopic[0], has: String(value).replace(/[+]/g, ', ') }); continue; }
      if (canon.value !== value) {
        const retired = allRules.find(r => r.topic === topic && r.value === value && r.effective?.to && asOf && r.effective.to <= asOf);
        out.push({
          id: `t-drift-${item.id}-${topic}`, kind: 'Drift from canon', severity: 'repair',
          title: retired ? `${item.title} still follows a retired rule` : `${item.title} departs from canon`,
          detail: `${retired ? `It matches "${retired.statement}", retired ${retired.effective.to}. ` : `It has ${String(value).replace(/[+]/g, ', ')}. `}Canon: "${canon.statement}"${item.provenance?.origin === 'generated' ? ' This file was written by a model; its defaults are not brand evidence.' : ''}`,
          sources: [item.id, canon.source], owners: authority[`standing.${canon.domain || 'visual'}`],
        });
      }
    }
    if (departs.length) {
      const sourcesOfRules = [...new Set(departs.map(d => d.rule.source).filter(Boolean))];
      const byModel = sourcesOfRules.some(id => items[id]?.provenance?.origin === 'generated');
      out.push({
        id: `t-mismatch-${item.id}`, kind: 'Material and written rule disagree', severity: 'decide',
        title: `${item.title} departs from ${departs.length} written rule${departs.length === 1 ? '' : 's'}`,
        detail: `None of these rules is canon${byModel ? ', and some were written by a model' : ''}, so neither side is wrong yet. Someone has to decide which stands.`,
        points: departs.map(d => ({ rule: d.rule.statement, has: d.has, ruleId: d.rule.id })),
        sources: [item.id, ...sourcesOfRules],
        owners: [...new Set(departs.flatMap(d => authority[`standing.${d.rule.domain || 'visual'}`]))],
      });
    }
  }

  // Claims: contradicted by a later fact, or never checked.
  for (const c of brand.claims || []) {
    const fact = (brand.facts || []).find(f => f.id === c.contradictedBy);
    const usedIn = (c.usedIn || []).map(id => items[id]?.title || id).join(', ');
    // A fact with no date cannot be said to come later. It is a disagreement, not a stale claim.
    const disputed = [...(c.disputedBy || []), ...(fact && !fact.date ? [fact.id] : [])];
    if (fact && fact.date && fact.date <= asOf) {
      out.push({
        id: `t-stale-${c.id}`, kind: study ? 'Claim in tension with a later fact' : 'Stale claim', severity: 'repair',
        title: study ? `"${c.statement}" sits uneasily with a later public fact` : `"${c.statement}" is no longer true`,
        detail: `${fact.statement}${usedIn ? ` The claim ${study ? 'appeared' : 'still appears'} in ${usedIn}.` : ''}${c.tensionNote ? ` ${c.tensionNote}` : ''}`,
        sources: [...(c.usedIn || []), fact.source].filter(Boolean), owners: authority.claims,
      });
    } else if (disputed.length) {
      // Two records say different things. Nothing here says which is right.
      const others = (brand.facts || []).filter(f => disputed.includes(f.id));
      out.push({
        id: `t-disputed-${c.id}`, kind: 'Records disagree', severity: 'decide',
        title: `"${c.statement}" does not match another record`,
        detail: `${others.map(f => f.statement).join(' ')}${usedIn ? ` The claim appears in ${usedIn}.` : ''}${c.tensionNote ? ` ${c.tensionNote}` : ''} Nothing recorded says which is right.`,
        sources: [...(c.usedIn || []), ...others.map(f => f.source)].filter(Boolean), owners: authority.claims,
      });
    } else if (!study && !c.verifiedOn) {
      out.push({
        id: `t-unsupported-${c.id}`, kind: 'Unsupported claim', severity: 'repair',
        title: `"${c.statement}" has no substantiation on file`, detail: `${usedIn ? `Used in ${usedIn}. ` : ''}No one has recorded checking it.${c.tensionNote ? ` ${c.tensionNote}` : ''}`,
        sources: c.usedIn || [], owners: authority.claims,
      });
    }
  }

  // Rights that are unknown for material in use, or that do not cover the plan.
  for (const item of brand.items) {
    if (item.standing === 'archive' && item.approval?.status === 'rejected') continue;
    const r = item.rights || {};
    const isUsedNow = (item.relations || []).some(rel => rel.type === 'derived from') || item.reuse?.length || item.inUse;
    const known = ['cleared', 'restricted', 'expired'].includes(r.status);
    if (!known && (isUsedNow || pipelineRank(item.pipeline) >= pipelineRank('verified'))) {
      out.push({ id: `t-rights-${item.id}`, kind: study ? 'Rights not established' : 'Unknown rights', severity: 'investigate',
        title: study ? `${item.title}: the terms for using it are not visible from public sources` : isUsedNow ? `${item.title} is in use with unreviewed rights` : `${item.title}: its rights have not been reviewed`,
        detail: r.note || (study ? 'Nothing found says what others may do with it.' : 'No licence on file.'), sources: [item.id], owners: authority.rights });
    }
    if (r.until && r.until >= asOf && channels.length && (item.functions || []).length) {
      const missing = uncoveredChannels(r, channels);
      if (missing.length) out.push({ id: `t-licence-${item.id}`, kind: 'Licence does not cover the plan', severity: 'investigate',
        title: `${item.title} is not licensed for ${missing.map(c => c.replace('-', ' ')).join(', ')}`, detail: r.note || `Ends ${r.until}.`, sources: [item.id], owners: authority.rights });
    }
  }

  // Impact claims that outrun their evidence. A record says so explicitly
  // with attribution: 'not-established'; older records are matched by wording.
  for (const item of brand.items) {
    for (const e of item.evidence || []) {
      const flagged = e.attribution === 'not-established' || (e.type === 'observed' && e.basis === 'reported' && /no control|same weeks/i.test(e.statement));
      if (flagged) {
        out.push({ id: `t-impact-${e.id}`, kind: 'Attribution not established', severity: 'investigate',
          title: `${item.title}: "${e.statement.split('.')[0]}" is not evidence the work caused it`,
          detail: e.statement, sources: [item.id, e.source].filter(Boolean) });
      }
    }
  }

  // Missing evidence stays visible.
  for (const item of brand.items) {
    if (item.pipeline === 'discovered') out.push({ id: `t-missing-${item.id}`, kind: 'Missing evidence', severity: 'investigate',
      title: `${item.title}: found, not understood`, detail: `${item.text || ''} Purpose, audience and rights are unknown.`.trim(), sources: [item.id] });
  }

  // Decisions nobody has been named to make, kept as one visible gap.
  const unnamed = unnamedPowers(brand).map(power => POWERS[power]);
  if (unnamed.length) {
    out.push({ id: 't-authority-unnamed', kind: 'No one named to decide', severity: 'decide',
      title: `No one is named to decide ${unnamed.join(', ')} at ${brand.name}`,
      detail: study ? `A public-source study cannot establish this. Only ${brand.name} can say who decides.` : 'Until someone is named, proposals and choices in these areas wait.',
      sources: [], unnamed });
  }
  return out;
}

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
  const dated = facts.filter(f => f.date).sort((a, b) => a.date.localeCompare(b.date));
  return [...dated, ...facts.filter(f => !f.date)];
}

// Hypotheses about the organisation are written by a person on the engagement.
// They are shown only with the evidence they cite, never stated as causes, and
// always routed to whoever decides, if anyone has been named.
export function organizationalHypotheses(brand, engagement = {}) {
  const ev = Object.fromEntries(brand.items.flatMap(i => (i.evidence || []).map(e => [e.id, { ...e, item: i.id }])));
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
      why = `Recognition carries over to people who have seen it before${evidence.length ? `: ${evidence.map(e => e.statement).join(' ')}` : '.'}${st.authorized ? '' : ` It is not authorized: ${st.reasons.authorized.join(' ')}`}${st.reusable ? '' : ` Rights block it for this plan: ${st.reasons.reusable.join(' ')}`}`;
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
    rules: live.map(r => ({ id: r.id, statement: r.statement, standing: r.standing })),
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

export function orientation(brand, engagement, { asOf }) {
  const items = byId(brand);
  const canon = brand.items.filter(i => i.standing === 'canon' && assessStanding(i, { asOf }, brand).authoritative);
  const stages = brand.items.reduce((acc, i) => ({ ...acc, [i.pipeline]: (acc[i.pipeline] || 0) + 1 }), {});
  const tensions = findTensions(brand, { asOf, workTypes: engagement.workTypes || [], channels: engagement.channels || [] });
  // Strengths are the practitioner's interpretation, not extracted fact; each must cite sources that exist.
  const strengths = (engagement.strengths || []).filter(st => Array.isArray(st.sources) && st.sources.length && st.sources.every(id => items[id]));
  // What the record cannot answer yet. Kept visible rather than filled in.
  const unknowns = [...(brand.unknowns || [])];
  const gaps = unnamedPowers(brand);
  if (gaps.length) unknowns.push(`Who decides ${gaps.map(p => POWERS[p]).join(', ')}.`);
  return { intent: brand.intent, canon, stages, strengths, tensions, unknowns, owners: names(brand, brand.intent?.owner ? [brand.intent.owner] : []) };
}
