// Inquiry: orientation, tensions, precedent transfer and the contextual brief.
// Every finding cites the material it rests on. All of it is deterministic;
// no model is involved, so nothing here should be mistaken for judgment.

import { assessStanding, isEffective, pipelineRank, rulesInForce } from './standing.js';

const byId = brand => Object.fromEntries(brand.items.map(i => [i.id, i]));

const appliesTo = (rule, workTypes) => rule.scope.includes('all') || rule.scope.some(s => workTypes.includes(s));

// Tensions are things a practitioner must see before making anything.
export function findTensions(brand, { asOf, workTypes = [], channels = [] }) {
  const out = [];
  const items = byId(brand);
  const live = rulesInForce(brand.rules, asOf);

  // Contradictory rules in force for this project's work types.
  const topics = {};
  for (const r of live) if (appliesTo(r, workTypes)) (topics[r.topic] ||= []).push(r);
  for (const [topic, rs] of Object.entries(topics)) {
    const values = new Set(rs.map(r => r.value));
    if (values.size > 1) {
      out.push({
        id: `t-conflict-${topic}`, kind: 'Conflicting guidance', severity: 'decide',
        title: `Two rules in force disagree: ${rs.map(r => `"${r.statement}"`).join(' and ')}`,
        detail: `Both apply to this project (${workTypes.join(', ')}). ${rs.map(r => `${brand.people[r.owner]?.name} owns the ${r.standing} rule from ${items[r.source]?.title || r.source}`).join('; ')}. Neither outranks the other until someone with authority scopes them.`,
        sources: rs.map(r => r.source), owners: rs.map(r => r.owner), ruleIds: rs.map(r => r.id),
      });
    }
  }

  // Operational material drifting from canon (including model-generated drift).
  for (const item of brand.items) {
    for (const [topic, value] of Object.entries(item.uses || {})) {
      const canon = live.find(r => r.topic === topic && r.standing === 'canon');
      if (canon && canon.value !== value) {
        const retired = brand.rules.find(r => r.topic === topic && r.value === value && !isEffective(r.effective, asOf));
        out.push({
          id: `t-drift-${item.id}`, kind: 'Drift from canon', severity: 'repair',
          title: `${item.title} still follows a ${retired ? 'retired' : 'non-canon'} rule`,
          detail: `${retired ? `It matches "${retired.statement}", retired ${retired.effective.to}.` : ''} Canon: "${canon.statement}"${item.provenance?.origin === 'generated' ? ' This file was written by a model; its defaults are not brand evidence.' : ''}`,
          sources: [item.id, canon.source],
        });
      }
    }
  }

  // Claims: stale (contradicted by a later fact), unverified, or overdue.
  for (const c of brand.claims) {
    const fact = brand.facts.find(f => f.id === c.contradictedBy);
    if (fact && fact.date <= asOf) {
      out.push({ id: `t-stale-${c.id}`, kind: 'Stale claim', severity: 'repair',
        title: `"${c.statement}" is no longer true`, detail: `${fact.statement} The claim still appears in ${c.usedIn.map(id => items[id]?.title || id).join(', ')}.`,
        sources: [...c.usedIn, fact.source], owners: brand.authority.claims });
    } else if (!c.verifiedOn) {
      out.push({ id: `t-unsupported-${c.id}`, kind: 'Unsupported claim', severity: 'repair',
        title: `"${c.statement}" has no substantiation on file`, detail: `Used in ${c.usedIn.map(id => items[id]?.title || id).join(', ')}. No one has verified it.`,
        sources: c.usedIn, owners: brand.authority.claims });
    }
  }

  // Rights that block the intended channels or lapse soon.
  for (const item of brand.items) {
    if (item.standing === 'archive' && item.approval?.status === 'rejected') continue;
    const r = item.rights || {};
    const isUsedNow = (item.relations || []).some(rel => rel.type === 'derived from') || item.reuse?.length;
    if (r.status === 'unknown' && (isUsedNow || pipelineRank(item.pipeline) >= pipelineRank('verified'))) {
      out.push({ id: `t-rights-${item.id}`, kind: 'Unknown rights', severity: 'investigate',
        title: `${item.title} is in use with unreviewed rights`, detail: r.note || 'No licence on file.', sources: [item.id], owners: brand.authority.rights });
    }
    if (r.until && r.until >= asOf && channels.length && (item.functions || []).length) {
      const missing = channels.filter(ch => !(r.channels || []).includes(ch));
      if (missing.length) out.push({ id: `t-licence-${item.id}`, kind: 'Licence does not cover the plan', severity: 'investigate',
        title: `${item.title} is not licensed for ${missing.map(c => c.replace('-', ' ')).join(', ')}`, detail: r.note || `Ends ${r.until}.`, sources: [item.id], owners: brand.authority.rights });
    }
  }

  // Impact claims that outrun their evidence.
  for (const item of brand.items) {
    for (const e of item.evidence || []) {
      if (e.type === 'observed' && e.basis === 'reported' && /no control|same weeks/i.test(e.statement)) {
        out.push({ id: `t-impact-${e.id}`, kind: 'Attribution not established', severity: 'investigate',
          title: `${item.title}: "${e.statement.split('.')[0]}" is not evidence the work caused it`,
          detail: e.statement, sources: [item.id, e.source] });
      }
    }
  }

  // Missing evidence stays visible.
  for (const item of brand.items) {
    if (item.pipeline === 'discovered') out.push({ id: `t-missing-${item.id}`, kind: 'Missing evidence', severity: 'investigate',
      title: `${item.title}: found, not understood`, detail: `${item.text} Purpose, audience and rights are unknown.`, sources: [item.id] });
  }
  return out;
}

// Offer-level hypotheses: never stated as causes, always routed to the owner.
export function organizationalHypotheses(brand) {
  const ev = Object.fromEntries(brand.items.flatMap(i => (i.evidence || []).map(e => [e.id, { ...e, item: i.id }])));
  const out = [];
  if (ev['e-int-price'] && ev['e-churn']) {
    out.push({
      id: 'h-offer', title: 'The retention problem may be an offer problem before it is a campaign problem',
      statement: 'Churn rose after the March price rise, and most lapsed parents interviewed named price. Another acquisition campaign would refill a leaking plan.',
      evidence: ['e-churn', 'e-int-price', 'e-sh-conversion'].filter(id => ev[id]).map(id => ({ id, statement: ev[id].statement, item: ev[id].item, basis: ev[id].basis })),
      uncertainty: 'Twelve interviews and a correlation in time. The free tier, a seasonal pattern or the video change could explain part of it. Not proof of cause.',
      test: 'A reactivation offer to a held-out sample of lapsed accounts before the campaign launches.',
      owner: brand.authority.offer?.[0], decision: 'offer',
    });
  }
  if (ev['e-int-ads']) {
    out.push({
      id: 'h-trust', title: 'Confusion about ads is a trust problem the work can repair',
      statement: 'Some lapsed parents believe ads will reach the paid plan. The old "Ad-free, always" claim makes the confusion worse.',
      evidence: [{ id: 'e-int-ads', statement: ev['e-int-ads'].statement, item: ev['e-int-ads'].item, basis: 'interview' }],
      uncertainty: '5 of 12 interviews. Size in the subscriber base unknown.',
      test: 'A clear plan comparison on the cancellation page, measured against cancellation rate.',
      owner: brand.authority.claims?.[0], decision: 'claims',
    });
  }
  return out;
}

// What carries forward from a precedent into a new brief, element by element.
// Each verdict states the goal change that produced it.
const VERDICTS = {
  preserve: 'Preserve', adapt: 'Adapt', reverse: 'Reverse', retire: 'Retire', investigate: 'Investigate first',
};

export function carryForward(brand, precedentBriefId, newBrief, { asOf }) {
  const items = byId(brand);
  const old = items[precedentBriefId]?.brief;
  if (!old) throw new Error('Precedent has no recorded brief.');
  const parts = brand.items.filter(i => (i.relations || []).some(r => r.type === 'part of' && r.to === precedentBriefId) || i.id === 'fw-sound-logo');
  const changes = Object.keys(old).filter(k => JSON.stringify(old[k]) !== JSON.stringify(newBrief[k])).map(k => ({ field: k, before: old[k], after: newBrief[k] }));
  const staleClaims = new Set(findTensions(brand, { asOf }).filter(t => t.kind === 'Stale claim').flatMap(t => t.sources));

  const rows = parts.map(item => {
    const fn = item.functions || (item.standing === 'canon' ? ['recognition'] : []);
    const st = assessStanding(item, { channels: newBrief.channels, asOf, until: newBrief.until });
    const evidence = (item.evidence || []).filter(e => e.type === 'contribution');
    let verdict, why;
    if (fn.includes('trust-claim') && staleClaims.has(item.id)) {
      verdict = 'retire'; why = 'Its claim is no longer true after the ad-supported tier launched.';
    } else if (fn.includes('discovery') && old.goal !== newBrief.goal) {
      verdict = 'reverse'; why = `Written to introduce Fernway to strangers (${old.goal}). Lapsed parents already know it; the message has to speak to return and routine (${newBrief.goal}).`;
    } else if (fn.includes('recognition')) {
      verdict = st.reusable ? 'preserve' : 'investigate';
      why = `Recognition carries over to people who have seen it before${evidence.length ? `: ${evidence.map(e => e.statement).join(' ')}` : '.'}${st.reusable ? '' : ` Rights block it for this plan: ${st.reasons.reusable.join(' ')}`}`;
    } else {
      verdict = 'adapt'; why = 'Context changed; transfer needs an argument.';
    }
    return { item, verdict, verdictName: VERDICTS[verdict], why, standing: st, evidence };
  });

  const evidenceNote = 'Last year\'s 18% rise in trial starts was measured on strangers, without a control, during a price promotion. It says little about lapsed subscribers and sets no expectation for this brief.';
  return { changes, rows, evidenceNote };
}

// A brief sets evaluation expectations before work starts and freezes the
// exact sources it rests on.
export function buildBrief(brand, engagement, decisions, { asOf }) {
  const items = byId(brand);
  const sources = new Set();
  decisions.forEach(d => (d.sources || []).forEach(s => sources.add(s)));
  (engagement.materials || []).forEach(s => sources.add(s));
  const live = rulesInForce(brand.rules, asOf).filter(r => appliesTo(r, engagement.workTypes));
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
    evaluation: engagement.evaluation,
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
  const canon = brand.items.filter(i => i.standing === 'canon' && assessStanding(i, { asOf }).authoritative);
  const stages = brand.items.reduce((acc, i) => ({ ...acc, [i.pipeline]: (acc[i.pipeline] || 0) + 1 }), {});
  const tensions = findTensions(brand, { asOf, workTypes: engagement.workTypes, channels: engagement.channels });
  // Strengths are the practitioner's interpretation, not extracted fact; each must cite sources that exist.
  const strengths = (engagement.strengths || []).filter(st => st.sources.every(id => items[id]));
  return { intent: brand.intent, canon, stages, strengths, tensions };
}
