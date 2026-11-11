// Domain tests for the Living Brand workbench (src/living-brand).
// Run: node --test scripts/living-brand-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startEngagement, openTenant, search, IsolationError, assessStanding, findTensions, carryForward,
  organizationalHypotheses, propose, decide, retire, recordReuse, recordChoice, AuthorityError, viewFor,
  buildBrief, buildContextPackage, revokePackage, packageValid, buildHandoff, coordinationView, exportWorkbench, orientation,
  verifyItem, addSourceNote, nameAuthority, changeLedger, toPacket, readPacket, startFromPacket, PACKET_FORMAT,
} from '../src/living-brand/domain/index.js';
import { fernway } from '../src/living-brand/data/fernway.js';
import { brightloop } from '../src/living-brand/data/brightloop.js';
import { engagements, agency, practitioner, AS_OF } from '../src/living-brand/data/workspace.js';

const vault = { fernway, brightloop };
const eng = engagements['eng-fernway'];
const fresh = () => startEngagement(vault, eng);
const asOf = AS_OF;
const serialized = x => JSON.stringify(x);
const BRIGHTLOOP_MARKERS = ['bl-', 'Brightloop', 'Lanterns', 'lantern', '4.2', 'Maya', 'Ravi', 'conquest', 'Conquest'];

test('wrong-client retrieval: shared vocabulary never crosses tenants', () => {
  const s = fresh();
  for (const q of ['paper-cut bedtime moon', 'Lanterns', 'Brightloop conquest lapsed', 'lantern moon rooftops']) {
    const results = search(s, q, { asOf });
    for (const r of results) assert.ok(fernway.items.some(i => i.id === r.item.id) && r.item._tenant === 'fernway', `${q} returned ${r.item.id}`);
    assert.ok(!results.some(r => r.item.id.startsWith('bl-')));
  }
  assert.equal(search(s, 'lanterns rooftops', { asOf }).length, 0);
});

test('wrong-client retrieval: a grant for one brand cannot open another', () => {
  assert.throws(() => openTenant(vault, { ...eng, brandId: 'brightloop' }), IsolationError);
  assert.throws(() => openTenant(vault, engagements['eng-brightloop']), /revoked/);
  assert.throws(() => openTenant(vault, { ...eng, asOf: '2027-04-01' }), /expired/);
});

test('tenant index rejects a foreign record even if one is smuggled in', () => {
  const s = fresh();
  const poisoned = { ...s, brand: { ...s.brand, items: [...s.brand.items, { ...brightloop.items[0], _tenant: 'brightloop' }] } };
  assert.throws(() => search(poisoned, 'paper-cut'), IsolationError);
});

test('exports and packages contain no other client material', () => {
  let s = fresh();
  s = recordChoice(s, { subject: 'Paper-cut language', verdict: 'preserve', rationale: 'Recognition', sources: ['fw-small-hours-hero'], by: 'practitioner', asOf });
  const brief = buildBrief(s.brand, s.engagement, s.choices, { asOf });
  const handoff = buildHandoff(s, { brief, asOf });
  const { package: pkg } = buildContextPackage(s, { partner: { id: 'mp', name: 'Production agent' }, assignment: 'Landing page', channels: ['owned-web'], workTypes: ['Customer campaign'], expires: '2026-12-31', asOf });
  for (const out of [handoff, pkg, brief]) for (const m of BRIGHTLOOP_MARKERS) assert.ok(!serialized(out).includes(m), `found ${m}`);
});

test('agency coordination shows dates and people, never strategy', () => {
  const view = serialized(coordinationView(agency.engagements));
  assert.ok(view.includes('2027-01-12'));
  assert.ok(!view.includes('lapsed') && !view.includes('Conquest') && !view.includes('fernway') && !view.includes('brightloop'));
});

test('portable workbench carries methods, not client knowledge', () => {
  const out = serialized(exportWorkbench(practitioner));
  assert.ok(out.includes('Read the work before the guidelines.'));
  for (const m of ['paper-cut', 'churn', 'price', 'Ad-free', 'Lanterns', 'interview']) assert.ok(!out.toLowerCase().includes(m.toLowerCase()), m);
});

test('relevant, authorized, reusable and authoritative are separate answers', () => {
  const s = fresh();
  const get = id => s.brand.items.find(i => i.id === id);
  const hero = assessStanding(get('fw-small-hours-hero'), { terms: ['paper-cut'], channels: ['owned-web'], asOf });
  assert.deepEqual([hero.relevant, hero.authorized, hero.reusable, hero.authoritative], [true, true, false, false]);
  const onboarding = assessStanding(get('fw-onboarding-papercut'), { terms: ['paper-cut'], channels: ['owned-web'], asOf });
  assert.equal(onboarding.reusable, false);
  assert.match(onboarding.reasons.authoritative.join(' '), /reuse confers no authority/);
  const chime = assessStanding(get('fw-sound-logo'), { channels: ['owned-web'], asOf });
  assert.deepEqual([chime.authorized, chime.reusable, chime.authoritative], [true, true, true]);
  const site = assessStanding(get('fw-website-home'), { channels: ['owned-web'], asOf });
  assert.equal(site.reusable, false, 'public is not permission');
  const v2 = assessStanding(get('fw-guidelines-v2'), { asOf });
  assert.equal(v2.authoritative, false);
  assert.match(v2.reasons.authorized.join(' '), /Superseded/);
});

test('licence lapsing before the work finishes is not reusable', () => {
  const s = fresh();
  const hero = s.brand.items.find(i => i.id === 'fw-small-hours-hero');
  const st = assessStanding(hero, { channels: ['paid-media'], asOf, until: '2027-03-31' });
  assert.equal(st.reusable, false);
  assert.match(st.reasons.reusable.join(' '), /before the work would finish/);
});

test('tensions: contradictory rules, stale claims, drift, unknown rights, unsupported impact, missing evidence', () => {
  const s = fresh();
  const t = findTensions(s.brand, { asOf, workTypes: eng.workTypes, channels: eng.channels });
  const kinds = new Set(t.map(x => x.kind));
  for (const k of ['Conflicting guidance', 'Stale claim', 'Unsupported claim', 'Drift from canon', 'Unknown rights', 'Attribution not established', 'Missing evidence', 'Licence does not cover the plan']) assert.ok(kinds.has(k), k);
  assert.ok(t.find(x => x.id === 't-conflict-hero.screens'));
  assert.ok(t.find(x => x.id === 't-stale-c-ad-free'));
  assert.ok(t.find(x => x.id === 't-stale-c-screen-free'));
  assert.ok(!t.find(x => x.id === 't-stale-c-made-calm'));
  assert.match(t.find(x => x.id === 't-drift-fw-voice-prompt-v1-wordmark.case').detail, /written by a model/);
  // The retired lowercase rule is not a live conflict with title case.
  assert.ok(!t.find(x => x.id === 't-conflict-wordmark.case'));
  // For product launches alone, there is no hero-screen conflict.
  const launch = findTensions(s.brand, { asOf, workTypes: ['Product launch'] });
  assert.ok(!launch.find(x => x.kind === 'Conflicting guidance'));
});

test('time matters: before the ad tier launched the claim was not stale', () => {
  const s = fresh();
  const t = findTensions(s.brand, { asOf: '2026-01-15', workTypes: eng.workTypes });
  assert.ok(!t.find(x => x.id === 't-stale-c-ad-free'));
});

test('what carries forward: keep recognition, reverse discovery, retire the stale claim', () => {
  const s = fresh();
  const cf = carryForward(s.brand, s.engagement, { asOf });
  const v = Object.fromEntries(cf.rows.map(r => [r.item.id, r.verdict]));
  assert.equal(v['fw-sound-logo'], 'preserve');
  assert.equal(v['fw-small-hours-film'], 'reverse');
  assert.equal(v['fw-small-hours-endcard'], 'retire');
  assert.equal(v['fw-small-hours-hero'], 'investigate', 'recognition is worth keeping but the licence blocks owned channels');
  assert.ok(cf.changes.find(c => c.field === 'goal' && c.before === 'acquisition' && c.after === 'retention'));
  assert.match(cf.evidenceNote, /without a control/);
});

test('organizational hypotheses are hypotheses with an owner, not causes', () => {
  const h = organizationalHypotheses(fresh().brand, eng);
  const offer = h.find(x => x.id === 'h-offer');
  assert.match(offer.uncertainty, /Not proof of cause/);
  assert.equal(offer.owner, 'tom');
  assert.ok(offer.evidence.length >= 2 && offer.test);
});

test('accidental promotion: proposing does nothing; reuse never raises standing', () => {
  let s = fresh();
  for (let i = 0; i < 25; i++) s = recordReuse(s, 'fw-onboarding-papercut', { where: `Reuse ${i}`, asOf });
  assert.equal(s.brand.items.find(i => i.id === 'fw-onboarding-papercut').standing, 'experiment');
  s = propose(s, { itemId: 'fw-onboarding-papercut', to: 'canon', rationale: 'Used everywhere', evidenceIds: [], by: 'practitioner', scope: 'All illustration', asOf });
  const p = s.proposals[0];
  assert.equal(s.brand.items.find(i => i.id === 'fw-onboarding-papercut').standing, 'experiment');
  assert.ok(p.warnings.some(w => /Repetition and reuse are not evidence/.test(w)));
  assert.ok(p.warnings.some(w => /Rights are unknown/.test(w)));
  assert.ok(p.warnings.some(w => /Frequency/.test(w)));
});

test('only the brand authority can adopt; the practitioner and other executives cannot', () => {
  let s = fresh();
  s = propose(s, { itemId: 'fw-small-hours-hero', to: 'canon', rationale: 'Recognition', evidenceIds: ['e-sh-recall'], by: 'practitioner', scope: 'Seasonal illustration', asOf });
  const pid = s.proposals[0].id;
  assert.throws(() => decide(s, pid, { by: 'practitioner', outcome: 'adopt', asOf }), AuthorityError);
  assert.throws(() => decide(s, pid, { by: 'tom', outcome: 'adopt', asOf }), AuthorityError, 'the CEO decides the offer, not visual canon');
  const s2 = decide(s, pid, { by: 'priya', outcome: 'adopt', note: 'Scoped to seasonal work', asOf });
  const hero = s2.brand.items.find(i => i.id === 'fw-small-hours-hero');
  assert.equal(hero.standing, 'canon');
  assert.equal(hero.standingRecord.decisionId, s2.decisions[0].id);
  assert.deepEqual(hero.standingRecord.evidenceIds, ['e-sh-recall']);
  assert.equal(hero.standingHistory.at(-1).standing, 'precedent', 'prior standing kept');
  assert.equal(s.brand.items.find(i => i.id === 'fw-small-hours-hero').standing, 'precedent', 'input state untouched');
  assert.throws(() => decide(s2, pid, { by: 'priya', outcome: 'adopt', asOf }), /already decided/);
});

test('a read-only grant cannot propose', () => {
  const s = fresh();
  s.engagement.grant.powers = ['read'];
  assert.throws(() => propose(s, { itemId: 'fw-sound-logo', to: 'archive', rationale: 'x', by: 'p', asOf }), AuthorityError);
});

test('retirement keeps history and requires authority', () => {
  let s = fresh();
  assert.throws(() => retire(s, 'fw-sound-logo', { by: 'lena', reason: 'x', asOf }), AuthorityError);
  s = retire(s, 'fw-sound-logo', { by: 'priya', reason: 'Test', asOf });
  const chime = s.brand.items.find(i => i.id === 'fw-sound-logo');
  assert.equal(chime.standing, 'archive');
  assert.equal(chime.standingHistory[0].standing, 'canon');
});

test('personal views reorder and never edit', () => {
  const s = fresh();
  const before = serialized(s.brand);
  const exec = viewFor('executive', s.brand);
  assert.equal(exec[0].level, 'company');
  viewFor('steward', s.brand);
  assert.equal(serialized(s.brand), before);
});

test('brief sets evaluation before work and freezes its sources', () => {
  let s = fresh();
  s = recordChoice(s, { subject: 'Copy strategy', verdict: 'evolve', rationale: 'Return, not discovery', sources: ['fw-small-hours-film'], by: 'practitioner', asOf });
  const brief = buildBrief(s.brand, s.engagement, s.choices, { asOf });
  assert.equal(brief.evaluation.length, 3);
  assert.ok(brief.evaluation.every(e => e.limit));
  const film = brief.snapshot.find(x => x.id === 'fw-small-hours-film');
  assert.ok(film && /^[0-9a-f]{8}$/.test(film.fingerprint));
  // A later edit to the source changes its fingerprint, so drift is detectable.
  const edited = { ...s, brand: { ...s.brand, items: s.brand.items.map(i => i.id === 'fw-small-hours-film' ? { ...i, rationale: 'changed' } : i) } };
  const later = buildBrief(edited.brand, edited.engagement, edited.choices, { asOf });
  assert.notEqual(later.snapshot.find(x => x.id === 'fw-small-hours-film').fingerprint, film.fingerprint);
});

test('choices that need company authority are routed, not enacted', () => {
  let s = fresh();
  s = recordChoice(s, { subject: 'Test a reactivation offer', verdict: 'invent', rationale: 'Offer before campaign', by: 'practitioner', needs: 'offer', asOf });
  assert.equal(s.choices[0].owner, 'tom');
  assert.equal(s.choices[0].status, 'awaiting decision');
});

test('partner context package: scoped, rights-checked, expiring, revocable', () => {
  const s = fresh();
  const { package: pkg, audit } = buildContextPackage(s, { partner: { id: 'agent', name: 'Landing page agent' }, assignment: 'Return-season landing page', channels: ['owned-web'], workTypes: ['Customer campaign'], expires: '2026-12-31', asOf });
  const ids = pkg.included.map(i => i.id);
  assert.ok(ids.includes('fw-guidelines-v3') && ids.includes('fw-sound-logo'));
  for (const id of ['fw-interviews-2026', 'fw-strategy-2024', 'fw-small-hours-hero', 'fw-website-home', 'fw-shoot-2019', 'fw-guidelines-v2', 'fw-neon-night']) assert.ok(!ids.includes(id), id);
  assert.ok(audit.withheld.find(w => w.id === 'fw-interviews-2026').reasons.includes('Confidential'));
  assert.ok(!serialized(pkg).includes('interviews') && !serialized(pkg).includes('strategy'), 'partner package does not even name withheld items');
  assert.equal(pkg.withheldCount, audit.withheld.length);
  assert.deepEqual(pkg.powers, ['read']);
  assert.ok(pkg.open.length > 0, 'unresolved conflicts travel with the package');
  assert.ok(packageValid(pkg, '2026-12-01'));
  assert.ok(!packageValid(pkg, '2027-01-02'));
  assert.ok(!packageValid(revokePackage(pkg, '2026-11-12'), '2026-11-13'));
  assert.throws(() => buildContextPackage(s, { partner: { id: 'x' }, powers: ['read', 'publish'], channels: [], workTypes: [], asOf }));
});

test('handoff records what was and was not completed', () => {
  const s = fresh();
  const h = buildHandoff(s, { brief: buildBrief(s.brand, s.engagement, [], { asOf }), asOf });
  assert.deepEqual(h.completed, ['orientation']);
  assert.ok(h.notCompleted.includes('audit') && h.notCompleted.includes('planning'));
  assert.ok(h.sources.every(x => x.fingerprint && x.pipeline));
  assert.ok(h.openTensions.length > 0);
});

test('orientation works with only a few materials and keeps missing evidence visible', () => {
  const sparse = { ...fernway, items: fernway.items.filter(i => ['fw-guidelines-v3', 'fw-small-hours-hero', 'fw-shoot-2019'].includes(i.id)) };
  const s = startEngagement({ fernway: sparse }, eng);
  const o = orientation(s.brand, s.engagement, { asOf });
  assert.ok(o.canon.find(i => i.id === 'fw-guidelines-v3'));
  assert.equal(o.strengths.length, 0, 'no strength survives without its sources');
  assert.ok(o.tensions.find(t => t.kind === 'Missing evidence'));
});

test('duplicate proposals and stale decisions are refused', () => {
  let s = fresh();
  const args = { itemId: 'fw-onboarding-papercut', to: 'canon', rationale: 'x', evidenceIds: ['e-onb-complete'], by: 'practitioner', asOf };
  s = propose(s, args);
  assert.throws(() => propose(s, args), /already asks/);
  s = propose(s, { ...args, to: 'precedent' });
  s = decide(s, s.proposals[0].id, { by: 'priya', outcome: 'adopt', asOf });
  assert.throws(() => decide(s, s.proposals[1].id, { by: 'priya', outcome: 'adopt', asOf }), /changed standing/);
  assert.throws(() => propose(s, { ...args, to: 'canon' }), /already has that standing/);
});

test('refusals name who decides, in plain words', () => {
  let s = fresh();
  s = propose(s, { itemId: 'fw-small-hours-hero', to: 'canon', rationale: 'x', by: 'practitioner', asOf });
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'tom', outcome: 'adopt', asOf }), /decided by Priya Raman/);
});

test('empty reuse and whitespace choices are refused', () => {
  const s = fresh();
  assert.throws(() => recordReuse(s, 'fw-sound-logo', { where: '  ', asOf }));
  assert.throws(() => recordChoice(s, { subject: '   ', verdict: 'preserve', by: 'p', asOf }));
});

test('the public page never imports another client or a real brand', async () => {
  const { readFileSync } = await import('node:fs');
  for (const file of ['Workbench.jsx', 'catalog.js', 'main.jsx', 'Plate.jsx']) {
    const src = readFileSync(new URL(`../src/living-brand/${file}`, import.meta.url), 'utf8');
    assert.ok(!/brightloop\.js|soul ?mega|reddit/i.test(src), `${file} must hold no other client's or real brand's material`);
  }
  const { publicCatalog } = await import('../src/living-brand/catalog.js');
  assert.deepEqual(publicCatalog.open.map(o => o.brand.id), ['fernway']);
  assert.equal(publicCatalog.open[0].brand.basis, 'fictional');
  for (const m of ['Lanterns', 'Conquest', 'Maya', '4.2']) assert.ok(!JSON.stringify(publicCatalog).includes(m), m);
});


// --- Real brands: unknown authority, public-source studies, intake, packets ---

// A small invented company, shaped the way a public-source study is shaped.
const halden = {
  id: 'halden', name: 'Halden', basis: 'public-source', summary: 'Invented for tests.',
  intent: { statement: 'Stated on its own site.', source: 'h-about' },
  people: {}, authority: { 'standing.visual': [], 'standing.verbal': [], claims: [], rights: [], publish: [] },
  unknowns: ['Whether the 2025 mark is final.'],
  facts: [{ id: 'hf-fee', statement: 'Halden began charging for its API on 1 June 2025.', date: '2025-06-01', source: 'h-pricing' }],
  claims: [{ id: 'hc-open', statement: 'Open to everyone, always.', usedIn: ['h-about'], contradictedBy: 'hf-fee' }, { id: 'hc-fast', statement: 'The fastest.', usedIn: ['h-about'] }],
  rules: [
    { id: 'hr-old', topic: 'logo.colour', value: 'blue', statement: 'The mark is blue.', source: 'h-mark-old', scope: ['all'], effective: { from: '2019-01-01', to: '2025-03-01' }, standing: 'canon', domain: 'visual' },
    { id: 'hr-new', topic: 'logo.colour', value: 'green', statement: 'The mark is green.', source: 'h-mark-new', scope: ['all'], effective: { from: '2025-03-01' }, standing: 'canon', domain: 'visual' },
  ],
  items: [
    { id: 'h-mark-old', title: 'Mark, 2019', kind: 'Logo mark', level: 'brand', period: { from: '2019-01-01', to: '2025-03-01' }, pipeline: 'extracted', standing: 'archive', domain: 'visual', supersededBy: 'h-mark-new',
      approval: { status: 'published', by: 'Halden' }, rights: { status: 'restricted', channels: [] }, evidence: [], relations: [], tags: ['mark'], text: 'Blue mark.', sources: [{ url: 'https://example.com/old', publisher: 'Example', basis: 'third_party' }] },
    { id: 'h-mark-new', title: 'Mark, 2025', kind: 'Logo mark', level: 'brand', period: { from: '2025-03-01' }, pipeline: 'extracted', standing: 'canon', standingRecord: { basis: 'reading', scope: 'Shown as current on its site' }, domain: 'visual', rationale: 'A calmer colour.',
      approval: { status: 'published', by: 'Halden', date: '2025-03-01' }, rights: { status: 'restricted', channels: [], note: 'Its terms allow editorial reference only.' }, evidence: [], relations: [], tags: ['mark'], text: 'Green mark.', sources: [{ url: 'https://example.com/new', publisher: 'Halden', basis: 'search_excerpt' }] },
    { id: 'h-about', title: 'About page', kind: 'Web page', level: 'company', period: { from: '2024-01-01' }, pipeline: 'extracted', standing: 'operational', domain: 'verbal', uses: { 'logo.colour': 'blue' },
      approval: { status: 'published', by: 'Halden' }, rights: { status: 'unknown', channels: [] }, evidence: [], relations: [], tags: [], text: 'Open to everyone, always.' },
    { id: 'h-pricing', title: 'API pricing', kind: 'Offer record', level: 'company', period: { from: '2025-06-01' }, pipeline: 'extracted', standing: 'operational', domain: 'product',
      approval: { status: 'published', by: 'Halden' }, rights: { status: 'unknown', channels: [] }, evidence: [], relations: [], tags: [], text: 'Paid API.' },
  ],
};
const haldenEng = { id: 'eng-halden', brandId: 'halden', clientLabel: 'Halden', role: 'Independent study', project: 'Halden study', asOf,
  grant: { brandId: 'halden', powers: ['read', 'propose'] }, workTypes: [], channels: [] };
const study = () => startEngagement({ halden }, haldenEng);

test('public-source study: published is not authorized until checked against its source', () => {
  let s = study();
  const mark = () => s.brand.items.find(i => i.id === 'h-mark-new');
  let st = assessStanding(mark(), { asOf });
  assert.equal(st.authorized, false);
  assert.match(st.reasons.authorized.join(' '), /not checked against its source/);
  assert.equal(st.authoritative, false, 'canon that is not authorized is not authoritative');
  assert.throws(() => verifyItem(s, 'h-mark-new', { by: 'practitioner', how: ' ', asOf }), /what you checked/);
  s = verifyItem(s, 'h-mark-new', { by: 'practitioner', how: 'Opened the brand page on 11 November 2026', asOf });
  st = assessStanding(mark(), { asOf });
  assert.equal(st.authorized, true);
  assert.match(st.reasons.authorized.join(' '), /Published by Halden.*No internal approval record seen/);
  assert.match(st.reasons.authoritative.join(' '), /Read as canon from public material/);
  assert.equal(st.reusable, true, 'no channels asked for');
  assert.equal(assessStanding(mark(), { asOf, channels: ['paid-media'] }).reusable, false, 'public is not permission');
  assert.equal(mark().verification.by, 'practitioner');
  assert.throws(() => verifyItem(s, 'h-mark-new', { by: 'practitioner', how: 'again', asOf }), /already verified/);
  assert.equal(assessStanding(s.brand.items.find(i => i.id === 'h-mark-old'), { asOf }).authorized, false, 'superseded');
});

test('public-source study: no one can adopt or retire, and the refusal says why', () => {
  let s = study();
  s = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'x', by: 'practitioner', asOf });
  assert.deepEqual(s.proposals[0].reviewer, []);
  assert.ok(s.proposals[0].warnings.some(w => /No one is named/.test(w)));
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'practitioner', outcome: 'adopt', asOf }), /public-source study cannot name them. Only Halden can/);
  assert.throws(() => retire(s, 'h-mark-new', { by: 'practitioner', reason: 'x', asOf }), AuthorityError);
  assert.throws(() => nameAuthority(s, { power: 'standing.visual', person: { id: 'me', name: 'Me' }, by: 'practitioner', asOf }), /Only Halden can name/);
  assert.throws(() => buildContextPackage(s, { partner: { id: 'a' }, channels: [], workTypes: [], asOf }), /public-source study holds nothing/);
});

test('public-source study: tensions are worded short of what only the company knows', () => {
  const t = findTensions(study().brand, { asOf });
  const claim = t.find(x => x.id === 't-stale-hc-open');
  assert.equal(claim.kind, 'Claim in tension with a later fact');
  assert.match(claim.title, /sits uneasily with a later public fact/);
  assert.ok(!/no longer true/.test(claim.title));
  assert.ok(!t.find(x => x.kind === 'Unsupported claim'), 'an outsider cannot know what is on file');
  const who = t.find(x => x.kind === 'No one named to decide');
  assert.match(who.detail, /Only Halden can say who decides/);
  assert.ok(t.find(x => x.id === 't-drift-h-about-logo.colour'));
  assert.ok(!t.find(x => x.kind === 'Conflicting guidance'), 'the retired rule is not a live conflict');
});

test('change ledger reads what replaced what from the record', () => {
  const ledger = changeLedger(study().brand, { asOf });
  const material = ledger.find(c => c.kind === 'material');
  assert.equal(material.before.id, 'h-mark-old');
  assert.equal(material.after.id, 'h-mark-new');
  assert.equal(material.rationale, 'A calmer colour.');
  const rule = ledger.find(c => c.kind === 'rule');
  assert.deepEqual([rule.before.value, rule.after.value, rule.when], ['blue', 'green', '2025-03-01']);
  const fw = changeLedger(fresh().brand, { asOf });
  assert.ok(fw.find(c => c.kind === 'rule' && c.topic === 'wordmark.case'));
  assert.ok(fw.find(c => c.kind === 'material' && c.before.id === 'fw-guidelines-v2'));
});

test('a company record with unnamed authority waits, and the company can name someone', () => {
  const brand = { ...halden, basis: 'company-record', people: { dd: { name: 'Founder', title: 'Creative founder' } }, authority: { 'standing.visual': ['dd'], 'standing.verbal': ['dd'], claims: [], rights: [], publish: [] } };
  let s = startEngagement({ halden: brand }, { ...haldenEng, grant: { brandId: 'halden', powers: ['read', 'propose', 'steward'] } });
  assert.match(findTensions(s.brand, { asOf }).find(x => x.kind === 'No one named to decide').title, /public claims, usage rights, publishing/);
  s = recordChoice(s, { subject: 'Fix the claim', verdict: 'repair', rationale: 'x', by: 'dd', needs: 'claims', asOf });
  assert.equal(s.choices[0].owner, null);
  assert.equal(s.choices[0].status, 'awaiting decision');
  s = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'x', by: 'dd', asOf });
  s = decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', asOf });
  assert.equal(s.brand.items.find(i => i.id === 'h-about').standing, 'precedent', 'the founder decides verbal standing');
  assert.throws(() => retire(s, 'h-pricing', { by: 'dd', reason: 'x', asOf }), /No one has been named to decide product standing/);
  s = nameAuthority(s, { power: 'claims', person: { id: 'dd', name: 'Founder' }, by: 'dd', asOf });
  assert.equal(s.choices[0].owner, 'dd');
  assert.ok(!findTensions(s.brand, { asOf }).find(x => x.kind === 'No one named to decide').title.includes('public claims'));
  assert.equal(s.decisions.at(-1).outcome, 'name-authority');
});

test('intake: new material arrives found or extracted, never verified, approved or canon', () => {
  let s = fresh();
  assert.throws(() => addSourceNote(s, { title: 'x', foundIn: '' }, { by: 'p', asOf }), /where it was found/);
  assert.throws(() => addSourceNote(s, { title: 'x', foundIn: 'Drive', pipeline: 'approved' }, { by: 'p', asOf }), /has to be earned/);
  assert.throws(() => addSourceNote(s, { title: 'x', foundIn: 'Drive', standing: 'canon' }, { by: 'p', asOf }), /cannot arrive as canon/);
  s = addSourceNote(s, { title: 'Spring email header', foundIn: 'Drive, Lifecycle/2026', text: 'Paper-cut header.', pipeline: 'extracted', origin: 'generated' }, { by: 'practitioner', asOf });
  const note = s.brand.items.at(-1);
  assert.equal(note._tenant, 'fernway');
  assert.deepEqual([note.pipeline, note.standing, note.rights.status, note.approval.status, note.provenance.origin], ['extracted', 'archive', 'unknown', 'none', 'generated']);
  const st = assessStanding(note, { asOf });
  assert.deepEqual([st.authorized, st.reusable, st.authoritative], [false, false, false]);
  assert.ok(search(s, 'spring email header', { asOf }).some(r => r.item.id === note.id), 'searchable in its own tenant');
  const found = addSourceNote(s, { title: 'Found only', foundIn: 'Box' }, { by: 'p', asOf });
  assert.equal(found.brand.items.at(-1).pipeline, 'discovered');
  assert.throws(() => verifyItem(found, found.brand.items.at(-1).id, { by: 'p', how: 'looked', asOf }), /only been found/);
});

test('packets round-trip one brand and refuse anything inconsistent', () => {
  let s = fresh();
  s = recordChoice(s, { subject: 'Chime', verdict: 'preserve', rationale: 'x', by: 'practitioner', asOf });
  s = propose(s, { itemId: 'fw-small-hours-hero', to: 'canon', rationale: 'x', evidenceIds: ['e-sh-recall'], by: 'practitioner', asOf });
  const packet = JSON.parse(JSON.stringify(toPacket(s)));
  assert.equal(packet.format, PACKET_FORMAT);
  assert.ok(!serialized(packet).includes('_tenant'));
  for (const m of BRIGHTLOOP_MARKERS) assert.ok(!serialized(packet).includes(m), m);
  const reopened = startFromPacket(packet);
  assert.equal(reopened.choices.length, 1);
  assert.equal(reopened.proposals[0].itemId, 'fw-small-hours-hero');
  assert.ok(reopened.brand.items.every(i => i._tenant === 'fernway'));
  const next = recordChoice(reopened, { subject: 'Another', verdict: 'evolve', rationale: 'x', by: 'practitioner', asOf });
  assert.notEqual(next.choices[1].id, next.choices[0].id, 'ids continue after reopening');
  assert.throws(() => readPacket({ ...packet, format: 'something-else' }), /Format is something-else/);
  assert.throws(() => readPacket({ ...packet, engagement: { ...packet.engagement, brandId: 'brightloop' } }), /different brand/);
  assert.throws(() => readPacket({ ...packet, brand: { ...packet.brand, items: [...packet.brand.items, { ...packet.brand.items[0] }] } }), /Duplicate item/);
  assert.throws(() => readPacket({ ...packet, brand: { ...packet.brand, items: packet.brand.items.filter(i => i.id !== 'fw-guidelines-v3') } }), /not in the packet/);
});

test('written hypotheses appear only with the evidence they cite', () => {
  const s = fresh();
  assert.equal(organizationalHypotheses(s.brand, eng).length, 2);
  const thin = { ...s.brand, items: s.brand.items.filter(i => i.id !== 'fw-interviews-2026') };
  assert.equal(organizationalHypotheses(thin, eng).length, 0, 'no interviews, no hypothesis');
  assert.equal(organizationalHypotheses(s.brand, {}).length, 0);
  assert.equal(carryForward(s.brand, { ...eng, carry: undefined }, { asOf }), null);
});

test('the handoff of a study stays with whoever made it', () => {
  const s = study();
  const h = buildHandoff(s, { brief: buildBrief(s.brand, s.engagement, [], { asOf }), asOf });
  assert.equal(h.basis, 'public-source');
  assert.match(h.retained.company, /did not commission this/);
  assert.deepEqual(h.unknowns, ['Whether the 2025 mark is final.']);
  assert.ok(h.sources.find(x => x.id === 'h-mark-new').links.includes('https://example.com/new'));
});
