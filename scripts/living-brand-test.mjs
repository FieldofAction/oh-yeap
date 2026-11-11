// Domain tests for the Living Brand workbench (src/living-brand).
// Run: node --test scripts/living-brand-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startEngagement, openTenant, search, IsolationError, assessStanding, findTensions, carryForward,
  organizationalHypotheses, propose, decide, retire, recordReuse, recordChoice, AuthorityError, viewFor,
  buildBrief, buildContextPackage, revokePackage, packageValid, buildHandoff, coordinationView, exportWorkbench, orientation,
  verifyItem, approveItem, effectiveRules, timeline, packetAssertions, addSourceNote, nameAuthority, changeLedger, toPacket, readPacket, startFromPacket, PACKET_FORMAT,
  rulesStatedBy, answerChoice, unnameAuthority, basisNote, longDate, classOf, withdrawChoice, carryOver, recordAnswer, powerFor, describeItem, kindsOfWork,
} from '../src/living-brand/domain/index.js';
import { fernway } from '../src/living-brand/data/fernway.js';
import { brightloop, brightloopEngagement } from '../src/living-brand/data/brightloop.js';
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
  assert.throws(() => openTenant(vault, brightloopEngagement), /revoked/);
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
  for (const k of ['Conflicting guidance', 'Stale claim', 'Claim not yet confirmed', 'Drift from canon', 'Unknown rights', 'Attribution not established', 'Missing evidence', 'Licence does not cover the plan']) assert.ok(kinds.has(k), k);
  assert.ok(t.find(x => x.id === 't-conflict-hero.screens'));
  assert.ok(t.find(x => x.id === 't-stale-c-ad-free'));
  assert.ok(t.find(x => x.id === 't-stale-c-screen-free'));
  assert.ok(!t.find(x => x.id === 't-stale-c-made-calm'));
  assert.match(t.find(x => x.id === 't-drift-fw-voice-prompt-v1').detail, /written by a model/);
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
  assert.throws(() => decide(s, pid, { by: 'priya', outcome: 'adopt', asOf }), /Say which kinds of work this canon covers/, 'the scope a proposal arrived with is not the decider\'s word');
  assert.throws(() => decide(s, pid, { by: 'priya', outcome: 'adopt', covers: ['Everything nice'], asOf }), /is not a kind of work in Fernway's material/);
  const s2 = decide(s, pid, { by: 'priya', outcome: 'adopt', covers: ['Brand campaign'], scope: 'Seasonal work only', asOf });
  assert.equal(s2.brand.items.find(i => i.id === 'fw-small-hours-hero').standingRecord.scope, 'Brand campaign. Seasonal work only');
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
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'priya', outcome: 'adopt', scope: 'Product illustration', asOf }), /Say which kinds of work this canon covers/, 'words alone name no kind of work');
  s = decide(s, s.proposals[0].id, { by: 'priya', outcome: 'adopt', covers: ['Product feature'], asOf });
  assert.equal(s.proposals[1].status, 'superseded', 'the other open proposal is closed, not left to block');
  assert.throws(() => decide(s, s.proposals[1].id, { by: 'priya', outcome: 'adopt', asOf }), /closed when the item's standing changed/);
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

test('public-source study: nothing is ever authorized or authoritative, checked or not', () => {
  let s = study();
  const mark = () => s.brand.items.find(i => i.id === 'h-mark-new');
  let st = assessStanding(mark(), { asOf }, s.brand);
  assert.deepEqual([st.authorized, st.authoritative], [false, false]);
  assert.throws(() => verifyItem(s, 'h-mark-new', { by: 'practitioner', how: ' ', asOf }), /what you checked/);
  s = verifyItem(s, 'h-mark-new', { by: 'practitioner', how: 'Opened the brand page on 11 November 2026', asOf });
  st = assessStanding(mark(), { asOf }, s.brand);
  // Checking a record against its source changes what the author knows, not what the company has allowed.
  assert.deepEqual([st.authorized, st.authoritative], [false, false]);
  assert.equal(st.reasons.authorized.join(' '), 'Halden has authorized nothing for this study.', 'a date known only from reports is not stated as when the company published');
  assert.match(st.reasons.authoritative.join(' '), /^Read as current\. That is this study's reading; only Halden can say what governs\.$/);
  assert.equal(st.reusable, false, 'restricted material is not reusable');
  assert.match(st.reasons.reusable.join(' '), /Its use is restricted, and no permitted use is recorded/);
  assert.equal(assessStanding(mark(), { asOf, channels: ['paid-media'] }, s.brand).reusable, false, 'public is not permission');
  assert.equal(mark().verification.by, 'practitioner');
  assert.throws(() => verifyItem(s, 'h-mark-new', { by: 'practitioner', how: 'again', asOf }), /already verified/);
  assert.equal(classOf('canon', s.brand).name, 'Read as current');
  assert.equal(classOf('canon', fresh().brand).name, 'Institutional canon');
  assert.throws(() => recordReuse(s, 'h-mark-new', { where: 'A pitch deck', asOf }), /A study may not reuse Halden's material/);
});

test('public-source study: no one can adopt or retire, and the refusal says why', () => {
  let s = study();
  s = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'x', by: 'practitioner', asOf });
  assert.deepEqual(s.proposals[0].reviewer, []);
  assert.ok(s.proposals[0].warnings.some(w => /A study cannot establish who decides at Halden\. This is a note to yourself\./.test(w)));
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'practitioner', outcome: 'adopt', asOf }), /public-source study cannot name them. Only Halden can/);
  assert.throws(() => retire(s, 'h-mark-new', { by: 'practitioner', reason: 'x', asOf }), AuthorityError);
  assert.throws(() => nameAuthority(s, { power: 'standing.visual', person: { id: 'me', name: 'Me' }, by: 'practitioner', asOf }), /Only Halden can name/);
  assert.throws(() => buildContextPackage(s, { partner: { id: 'a' }, channels: [], workTypes: [], asOf }), /public-source study holds nothing/);
});

test('public-source study: tensions are worded short of what only the company knows', () => {
  const t = findTensions(study().brand, { asOf });
  const claim = t.find(x => x.id === 't-stale-hc-open');
  assert.equal(claim.kind, 'Statement set beside a later report');
  assert.match(claim.title, /^Set beside a later report: /);
  assert.match(claim.detail, /The pairing is this study's own\.$/);
  assert.ok(!/no longer true|sits uneasily/.test(claim.title + claim.detail));
  assert.ok(!t.find(x => x.kind === 'Claim not yet confirmed'), 'an outsider cannot know what is on file');
  assert.ok(!t.find(x => x.kind === 'No one named to decide'), 'a study says once, where it describes itself, that it cannot know who decides');
  assert.ok(t.find(x => x.id === 't-drift-h-about'));
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
  assert.match(findTensions(s.brand, { asOf }).find(x => x.kind === 'No one named to decide').title, /sonic standing, product standing, public claims, usage rights, the offer, publishing at Halden/);
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

test('a written rule nobody adopted does not outrank the work that breaks it', () => {
  const brand = { ...halden, basis: 'company-record', people: { dd: { name: 'Founder' } }, authority: { 'standing.visual': ['dd'], claims: [] },
    rules: [{ id: 'hr-type', topic: 'type.families', value: 'two', statement: 'Two type families.', source: 'h-system', scope: ['all'], effective: {}, standing: 'operational', domain: 'visual' }],
    claims: [{ id: 'hc-founded', statement: 'Founded in 2018.', usedIn: ['h-about'], disputedBy: ['hf-origin'], tensionNote: 'An anniversary event implies 2019.' }],
    facts: [{ id: 'hf-origin', statement: 'The site says: started 2011, launched 2019.', date: '', source: 'h-about' }],
    items: [
      { id: 'h-system', title: 'Design system file', kind: 'Design system', level: 'brand', pipeline: 'extracted', standing: 'operational', domain: 'visual', provenance: { source: 'Read from the site', origin: 'generated' }, approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'Two families.' },
      { id: 'h-about', title: 'Live site', kind: 'Web page', level: 'brand', pipeline: 'extracted', standing: 'operational', domain: 'visual', uses: { 'type.families': 'three' }, approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'Three families.' },
      { id: 'h-old', title: 'Old site', kind: 'Web page', level: 'brand', pipeline: 'extracted', standing: 'archive', domain: 'visual', uses: { 'type.families': 'five' }, approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'Old.' },
    ] };
  let s = startEngagement({ halden: brand }, { ...haldenEng, actor: 'dd', grant: { brandId: 'halden', powers: ['read', 'propose', 'steward'] } });
  const t = findTensions(s.brand, { asOf });
  const mismatch = t.find(x => x.id === 't-mismatch-h-about');
  assert.equal(mismatch.kind, 'Material and written rule disagree');
  assert.match(mismatch.title, /departs from 1 written rule$/);
  assert.deepEqual(mismatch.points, [{ rule: 'Two type families.', has: 'three', says: '', ruleId: 'hr-type' }]);
  assert.match(mismatch.detail, /is canon, and some were written by a model, so neither side is wrong yet/);
  assert.deepEqual(mismatch.owners, ['dd']);
  assert.ok(!t.find(x => x.kind === 'Drift from canon'));
  assert.ok(!t.some(x => x.id.includes('h-old')), 'history is not checked against today\'s rules');
  const dispute = t.find(x => x.id === 't-disputed-hc-founded');
  assert.equal(dispute.kind, 'Records disagree');
  assert.match(dispute.detail, /started 2011, launched 2019.*An anniversary event implies 2019\.$/, 'the record\'s own note closes the entry');
  assert.ok(!/no longer true/.test(dispute.title));

  // The founder approves the system file; approval is not canon, and others cannot approve.
  assert.equal(assessStanding(s.brand.items[0], { asOf }).authorized, false);
  assert.throws(() => approveItem(s, 'h-system', { by: 'practitioner', asOf }), /cannot approve Design system file/);
  assert.throws(() => approveItem(s, 'h-system', { by: 'dd', asOf }), /has not been checked against its source. Check it first/, 'approval does not skip the check');
  s = verifyItem(s, 'h-system', { by: 'dd', how: 'Compared with the live stylesheet', asOf });
  s = approveItem(s, 'h-system', { by: 'dd', note: 'This is the system', asOf });
  const system = s.brand.items[0];
  assert.deepEqual([system.pipeline, system.approval.status, system.standing], ['approved', 'approved', 'operational']);
  const st = assessStanding(system, { asOf });
  assert.deepEqual([st.authorized, st.authoritative], [true, false], 'approved is not canon');
  assert.equal(s.decisions.at(-1).outcome, 'approve');
  assert.throws(() => approveItem(s, 'h-system', { by: 'dd', asOf }), /already approved/);
});

test('adopting a source as canon is what makes its rules canon', () => {
  const brand = { ...halden, basis: 'company-record', people: { dd: { name: 'Founder' } }, authority: { 'standing.visual': ['dd'] }, claims: [], facts: [],
    rules: [{ id: 'hr-type', topic: 'type.families', value: 'two', statement: 'Two type families.', source: 'h-system', scope: ['all'], effective: {}, domain: 'visual' }],
    items: [
      { id: 'h-system', title: 'Design system file', kind: 'Design system', level: 'brand', pipeline: 'extracted', standing: 'operational', domain: 'visual', approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'Two.' },
      { id: 'h-site', title: 'Live site', kind: 'Web page', level: 'brand', pipeline: 'extracted', standing: 'operational', domain: 'visual', uses: { 'type.families': 'three' }, approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'Three.' },
    ] };
  let s = startEngagement({ halden: brand }, { ...haldenEng, actor: 'dd', grant: { brandId: 'halden', powers: ['read', 'propose', 'steward'] } });
  assert.equal(effectiveRules(s.brand)[0].standing, 'operational');
  assert.ok(findTensions(s.brand, { asOf }).find(x => x.kind === 'Material and written rule disagree'));
  s = propose(s, { itemId: 'h-system', to: 'canon', rationale: 'This is the system', by: 'intake', asOf });
  assert.ok(s.proposals[0].warnings.some(w => /Not yet checked against its source/.test(w)));
  assert.deepEqual(rulesStatedBy(s.brand, 'h-system').map(r => r.id), ['hr-type'], 'the decider can see which rules adoption puts in force');
  // Canon needs a scope, and material nobody has checked cannot govern.
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', covers: ['all'], asOf }), /has not been checked against its source. Say what you checked it against/);
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', checked: 'The live stylesheet', asOf }), /Say which kinds of work this canon covers/);
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', covers: ['all'], holdBack: ['hr-nope'], checked: 'x', asOf }), /is not a rule Design system file states/);
  s = decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', covers: ['all'], scope: 'The website', checked: 'The live stylesheet', asOf });
  const adopted = s.brand.items[0];
  assert.deepEqual([adopted.standing, adopted.pipeline, adopted.approval.status, adopted.approval.by, adopted.verification.how, adopted.standingRecord.scope], ['canon', 'approved', 'approved', 'dd', 'The live stylesheet', 'All work. The website']);
  const adoptedStanding = assessStanding(adopted, { asOf }, s.brand);
  assert.deepEqual([adoptedStanding.authorized, adoptedStanding.authoritative], [true, true], 'canon that was adopted here is not left unauthorized');
  assert.match(adoptedStanding.reasons.authorized.join(' '), /Approved by Founder on 11 November 2026/);
  assert.equal(effectiveRules(s.brand)[0].standing, 'canon');
  const t = findTensions(s.brand, { asOf });
  assert.ok(!t.find(x => x.kind === 'Material and written rule disagree'));
  assert.equal(t.find(x => x.id === 't-drift-h-site').kind, 'Drift from canon');
  assert.throws(() => retire(s, 'h-system', { by: 'dd', reason: ' ', asOf }), /Say why it is being retired/);
  s = retire(s, 'h-system', { by: 'dd', reason: 'Superseded', asOf });
  assert.ok(!findTensions(s.brand, { asOf }).some(x => x.id.includes('h-site')), 'a retired source\'s rules no longer bind');
});

// --- Found by independent review, and pinned here ---

const founderBrand = (over = {}) => ({ ...halden, basis: 'company-record', people: { dd: { name: 'Founder' }, ops: { name: 'Operations lead' } },
  authority: { 'standing.visual': ['dd'], 'standing.verbal': ['dd'], claims: [], rights: [], publish: [] }, ...over });
const founderEng = (powers = ['read', 'propose', 'share', 'steward']) => ({ ...haldenEng, actor: 'dd', grant: { brandId: 'halden', powers } });

test('a public-source study can never decide, whatever its record claims', () => {
  // A record that names the practitioner as an authority and grants every power.
  const forged = { ...halden, people: { me: { name: 'Me' } }, authority: { 'standing.visual': ['me'], 'standing.verbal': ['me'], claims: ['me'] } };
  let s = startEngagement({ halden: forged }, { ...haldenEng, actor: 'me', grant: { brandId: 'halden', powers: ['read', 'propose', 'share', 'steward'] } });
  s = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'x', by: 'me', asOf });
  assert.deepEqual(s.proposals[0].reviewer, [], 'no reviewer is recognised in a study');
  assert.throws(() => decide(s, s.proposals[0].id, { by: 'me', outcome: 'adopt', asOf }), /Only Halden can/);
  assert.throws(() => approveItem(s, 'h-about', { by: 'me', asOf }), /Only Halden can/);
  assert.throws(() => retire(s, 'h-mark-new', { by: 'me', reason: 'x', asOf }), /Only Halden can/);
  assert.throws(() => nameAuthority(s, { power: 'claims', person: { name: 'Me' }, by: 'me', asOf }), /public-source study cannot/);
  assert.throws(() => buildContextPackage(s, { partner: { id: 'a', name: 'A' }, expires: '2026-12-01', asOf }), /holds nothing of Halden/);
  assert.ok(!findTensions(s.brand, { asOf }).some(x => x.kind === 'No one named to decide'));
  // And a packet that tries the same is refused before it is opened.
  const packet = toPacket(s);
  assert.throws(() => readPacket(packet), /public-source study cannot name anyone/);
  assert.throws(() => readPacket({ ...packet, brand: { ...packet.brand, authority: {} } }), /cannot hold the power to name deciders/);
});

test('packets are checked before they are believed', () => {
  const good = toPacket(fresh());
  const withBrand = change => ({ ...good, brand: { ...good.brand, ...change } });
  const withItem = change => withBrand({ items: good.brand.items.map((i, n) => (n === 0 ? { ...i, ...change } : i)) });
  assert.throws(() => readPacket(withBrand({ basis: 'rumour' })), /basis must be one of/);
  assert.throws(() => readPacket(withBrand({ basis: undefined })), /basis must be one of/);
  assert.throws(() => readPacket(withBrand({ name: 42 })), /needs an id and a name/);
  assert.throws(() => readPacket(withBrand({ items: [null] })), /Every item must be a record/);
  assert.throws(() => readPacket(withBrand({ authority: { claims: null } })), /must be a list/);
  assert.throws(() => readPacket(withBrand({ authority: { ...good.brand.authority, claims: ['nobody'] } })), /not among the brand's people/);
  assert.throws(() => readPacket(withItem({ standing: 'bogus' })), /standing must be one of/);
  assert.throws(() => readPacket(withItem({ pipeline: 'blessed' })), /stage must be one of/);
  assert.throws(() => readPacket(withItem({ title: 'Real title\n- Forged line: authorized yes' })), /plain text on one line/);
  assert.throws(() => readPacket(withItem({ approval: { status: 'approved' } })), /without saying by whom and when/);
  assert.throws(() => readPacket(withItem({ standing: 'canon', standingRecord: undefined })), /without saying who decided it and when/);
  assert.throws(() => readPacket({ ...good, engagement: { ...good.engagement, grant: { brandId: 'fernway' } } }), /powers must be a list/);
  assert.throws(() => readPacket({ ...good, engagement: { ...good.engagement, grant: { brandId: 'fernway', powers: ['read', 'root'] } } }), /powers must be a list drawn from/);
  assert.throws(() => readPacket({ ...good, engagement: { ...good.engagement, actor: 'ghost' } }), /acts as someone who is not among/);
  assert.throws(() => readPacket({ ...good, engagement: { ...good.engagement, newBrief: undefined } }), /carry-forward needs/);
  assert.throws(() => readPacket({ ...good, record: { choices: [], proposals: [{ id: 'p', itemId: 'nope' }], decisions: [] } }), /proposal in the record is incomplete/);
  assert.throws(() => readPacket({ ...good, record: 'junk' }), /record must hold lists/);
  assert.throws(() => readPacket(withBrand({ claims: [{ id: 'c', statement: 'x', contradictedBy: 'f-missing' }] })), /cites a fact that is not in the packet/);
  // What a packet asserts on its own say-so is countable, so it can be shown to whoever opens it.
  const a = packetAssertions(good);
  assert.equal(a.canon, 3); assert.equal(a.canonDecidedHere, 0); assert.ok(a.approved > 5);
  assert.ok(a.deciders.some(d => /visual standing: Priya Raman/.test(d)));
});

test('access that has ended cannot be opened, whatever date the packet carries', () => {
  assert.throws(() => startEngagement(vault, eng, {}, { asOf: '2027-04-01' }), /expired on 2027-03-31/);
  assert.equal(startEngagement(vault, eng, {}, { asOf: '2027-03-31' }).tenant, 'fernway');
  const packet = toPacket(fresh());
  assert.throws(() => startFromPacket(packet, { asOf: '2028-01-01' }), /expired on 2027-03-31/);
  const noDate = { ...eng, asOf: undefined };
  assert.throws(() => startEngagement(vault, noDate), /no date was given/);
  assert.throws(() => openTenant({ fernway: { ...fernway, id: 'other' } }, eng), /different brand/);
  for (const id of ['constructor', '__proto__', 'toString']) assert.throws(() => openTenant(vault, { ...eng, brandId: id, grant: { brandId: id, powers: [] } }), IsolationError);
});

test('retiring a source ends its rules, its authorization and its place in packages', () => {
  let s = fresh();
  const before = buildContextPackage(s, { partner: { id: 'a', name: 'A' }, assignment: 'x', channels: [], workTypes: ['Brand campaign'], expires: '2026-12-31', asOf }).package;
  assert.ok(before.included.some(i => i.id === 'fw-sound-logo'));
  assert.ok(before.rules.some(r => r.id === 'r-chime'));
  s = propose(s, { itemId: 'fw-sound-logo', to: 'precedent', rationale: 'x', by: 'practitioner', asOf });
  s = retire(s, 'fw-sound-logo', { by: 'priya', reason: 'Replaced', asOf });
  assert.equal(s.proposals[0].status, 'superseded');
  const chime = s.brand.items.find(i => i.id === 'fw-sound-logo');
  const st = assessStanding(chime, { asOf }, s.brand);
  assert.deepEqual([st.authorized, st.authoritative], [false, false]);
  assert.match(st.reasons.authorized.join(' '), /Retired on 11 November 2026/);
  assert.equal(effectiveRules(s.brand).find(r => r.id === 'r-chime').standing, 'archive', 'an explicit canon rule does not outlive its source');
  const after = buildContextPackage(s, { partner: { id: 'a', name: 'A' }, assignment: 'x', channels: [], workTypes: ['Brand campaign'], expires: '2026-12-31', asOf }).package;
  assert.ok(!after.included.some(i => i.id === 'fw-sound-logo') && !after.rules.some(r => r.id === 'r-chime'));
  assert.throws(() => retire(s, 'fw-sound-logo', { by: 'priya', reason: 'again', asOf }), /already retired/);
  assert.throws(() => approveItem(s, 'fw-sound-logo', { by: 'priya', asOf }), /is retired/);
});

test('a stale proposal can be turned down, and does not block a new one', () => {
  let s = startEngagement({ halden: founderBrand() }, founderEng());
  s = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'a', by: 'dd', asOf });
  const stale = s.proposals[0].id;
  // Standing changes behind the proposal's back (as an imported record might show).
  s.brand.items.find(i => i.id === 'h-about').standing = 'experiment';
  assert.throws(() => decide(s, stale, { by: 'dd', outcome: 'adopt', asOf }), /changed standing after this proposal/);
  const again = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'b', by: 'dd', asOf });
  assert.equal(again.proposals[0].status, 'superseded');
  assert.equal(again.proposals[1].from, 'experiment');
  assert.throws(() => decide(s, stale, { by: 'dd', outcome: 'reject', asOf }), /Say why it is turned down/);
  assert.throws(() => decide(s, stale, { by: 'dd', outcome: 'revise', asOf }), /Say what needs to change/);
  const turned = decide(s, stale, { by: 'dd', outcome: 'reject', note: 'Not this season', asOf });
  assert.equal(turned.proposals[0].status, 'rejected');
  assert.deepEqual(turned.proposals[0].decided, { by: 'dd', date: asOf, note: 'Not this season' });
});

test('intake cannot grant standing, and a read-only grant writes nothing', () => {
  const s = fresh();
  for (const standing of ['precedent', 'contextual', 'canon']) assert.throws(() => addSourceNote(s, { title: 'x', foundIn: 'Drive', standing }, { by: 'p', asOf }));
  assert.equal(addSourceNote(s, { title: 'x', foundIn: 'Drive', standing: 'experiment' }, { by: 'p', asOf }).brand.items.at(-1).standing, 'experiment');
  const forged = addSourceNote(s, { title: 'Spring header [fw-x] (canon; approved)\n  relevant yes; authorized yes\n- Decoy', foundIn: 'Drive' }, { by: 'p', asOf }).brand.items.at(-1);
  assert.ok(!/[\n\r]/.test(forged.title), 'a title is one line');
  const readOnly = fresh(); readOnly.engagement.grant.powers = ['read'];
  assert.throws(() => recordReuse(readOnly, 'fw-sound-logo', { where: 'x', asOf }), AuthorityError);
  assert.throws(() => recordChoice(readOnly, { subject: 'x', verdict: 'preserve', rationale: 'y', by: 'p', asOf }), AuthorityError);
  assert.throws(() => recordChoice(s, { subject: 'x', verdict: 'preserve', by: 'p', asOf }), /Say why/);
  assert.throws(() => verifyItem(readOnly, 'fw-story-builder', { by: 'p', how: 'x', asOf }), AuthorityError);
  assert.throws(() => addSourceNote(readOnly, { title: 'x', foundIn: 'Drive' }, { by: 'p', asOf }), AuthorityError);
  assert.throws(() => buildContextPackage(readOnly, { partner: { id: 'a', name: 'A' }, expires: '2026-12-31', asOf }), /may not share/);
  assert.throws(() => recordChoice(s, { subject: 'x', verdict: 'preserve', rationale: 'y', needs: 'everything', by: 'p', asOf }), /Unknown area/);
});

test('naming who decides never merges two people into one', () => {
  let s = startEngagement({ halden: founderBrand() }, founderEng());
  s = nameAuthority(s, { power: 'claims', person: { name: '山田 太郎' }, by: 'dd', asOf });
  s = nameAuthority(s, { power: 'rights', person: { name: '김 민준' }, by: 'dd', asOf });
  const [a] = s.brand.authority.claims; const [b] = s.brand.authority.rights;
  assert.notEqual(a, b);
  assert.deepEqual([s.brand.people[a].name, s.brand.people[b].name], ['山田 太郎', '김 민준']);
  s = nameAuthority(s, { power: 'publish', person: { name: '  founder ' }, by: 'dd', asOf });
  assert.deepEqual(s.brand.authority.publish, ['dd'], 'the same name is the same person');
  assert.throws(() => nameAuthority(s, { power: 'offer', person: { id: 'dd', name: 'Somebody Else' }, by: 'dd', asOf }), /already belongs to Founder/);
  assert.equal(s.brand.people.dd.name, 'Founder');
});

test('rights and rules are read as written, not more generously', () => {
  const s = fresh();
  const all = { rights: { status: 'cleared', channels: ['all'], until: '2027-12-31' }, functions: ['recognition'] };
  const brand = { ...s.brand, items: s.brand.items.map(i => (i.id === 'fw-sound-logo' ? { ...i, ...all } : i)) };
  assert.ok(!findTensions(brand, { asOf, channels: ['owned-web', 'email'] }).some(t => t.id === 't-licence-fw-sound-logo'), 'a licence for all channels covers every channel');
  const odd = assessStanding({ ...s.brand.items[0], rights: { status: 'probably fine' } }, { asOf });
  assert.equal(odd.reusable, false);
  assert.match(odd.reasons.reusable.join(' '), /not a status this record recognises/);
  // A scoped rule binds only the kinds of work it names.
  const scoped = { ...s.brand, items: [...s.brand.items, { id: 'fw-x', title: 'Sales one-pager', workType: 'Sales material', pipeline: 'extracted', standing: 'operational', uses: { 'hero.screens': 'lead' }, approval: { status: 'none' }, rights: { status: 'unknown' } }] };
  assert.ok(!findTensions(scoped, { asOf }).some(t => t.id.startsWith('t-drift-fw-x')), 'the no-screens rule covers campaigns, not sales material');
  // A replacement that has not started yet does not retire what it will replace.
  const pending = { ...halden, basis: 'company-record', items: halden.items.map(i => (i.id === 'h-mark-new' ? { ...i, period: { from: '2027-01-01' } } : i.id === 'h-mark-old' ? { ...i, pipeline: 'verified' } : i)) };
  const old = pending.items.find(i => i.id === 'h-mark-old');
  assert.ok(!assessStanding(old, { asOf }, pending).reasons.authorized.join(' ').includes('Superseded'));
  assert.ok(assessStanding(old, { asOf: '2027-02-01' }, pending).reasons.authorized.join(' ').includes('Superseded by Mark, 2025'));
  assert.ok(!changeLedger(pending, { asOf }).some(c => c.kind === 'material'), 'not history yet');
});

test('a claim set against an undated fact is a disagreement, not a stale claim', () => {
  const brand = founderBrand({ facts: [{ id: 'hf-origin', statement: 'The site gives a different founding year.', date: '', source: 'h-about' }],
    claims: [{ id: 'hc-year', statement: 'Founded in 2018.', usedIn: ['h-about'], contradictedBy: 'hf-origin' }] });
  const t = findTensions(brand, { asOf });
  assert.equal(t.find(x => x.id === 't-disputed-hc-year').kind, 'Records disagree');
  assert.ok(!t.some(x => x.id === 't-stale-hc-year'));
});

test('the timeline puts dated facts in order and keeps undated ones visible', () => {
  const brand = { ...halden, facts: [{ id: 'b', statement: 'Later.', date: '2025-06-01', source: 'h-pricing' }, { id: 'u', statement: 'Undated.', date: '' }, { id: 'a', statement: 'Earlier.', date: '2019', source: 'gone' }, { id: 'f', statement: 'Announced for next year.', date: '2027-02' }] };
  const t = timeline(brand, { asOf });
  assert.deepEqual(t.map(f => f.id), ['a', 'b', 'f', 'u']);
  assert.equal(t[0].source, null, 'a source that is not in the record is not linked');
  assert.equal(t[2].ahead, true);
});

test('search reads short and non-Latin words, and a hit is always marked relevant', () => {
  let s = fresh();
  s = addSourceNote(s, { title: '月の絵 TV spot', foundIn: 'Drive', text: 'A 15 second cut for TV.', kind: 'Film' }, { by: 'p', asOf });
  assert.equal(search(s, '月の絵', { asOf })[0].item.title, '月の絵 TV spot');
  const tv = search(s, 'TV', { asOf });
  assert.ok(tv.length >= 1 && tv.every(r => r.standing.relevant));
  assert.ok(search(s, 'Film', { asOf }).every(r => r.standing.relevant), 'a match on the kind of work is still a match');
});

test('ids never repeat, even when a record arrives without its counter', () => {
  let s = fresh();
  s = recordChoice(s, { subject: 'One', verdict: 'preserve', rationale: 'r', by: 'p', asOf });
  s = recordChoice(s, { subject: 'Two', verdict: 'preserve', rationale: 'r', by: 'p', asOf });
  const packet = toPacket(s); delete packet.record.seq;
  let again = startFromPacket(packet);
  again = recordChoice(again, { subject: 'Three', verdict: 'preserve', rationale: 'r', by: 'p', asOf });
  assert.equal(new Set(again.choices.map(c => c.id)).size, 3);
});

// --- Found by operator testing, and pinned here ---

test('a campaign piece adopted as canon is not put outside its dates by its own flight', () => {
  let s = fresh();
  const hero = () => s.brand.items.find(i => i.id === 'fw-small-hours-hero');
  assert.ok(hero().period.to < asOf, 'the flight is over');
  s = propose(s, { itemId: 'fw-small-hours-hero', to: 'canon', rationale: 'It set the look', by: 'practitioner', asOf });
  s = decide(s, s.proposals[0].id, { by: 'priya', outcome: 'adopt', covers: ['Brand campaign'], scope: 'Seasonal campaigns', asOf });
  const st = assessStanding(hero(), { asOf }, s.brand);
  assert.deepEqual([st.authorized, st.authoritative], [true, true]);
  assert.match(st.reasons.authoritative.join(' '), /Canon since 11 November 2026: Brand campaign\. Seasonal campaigns/);
  assert.match(assessStanding(hero(), { asOf, me: 'priya' }, s.brand).reasons.authorized.join(' '), /Approved by you on/);
});

test('what was only found, or was rejected, cannot be proposed for any standing but the archive', () => {
  let s = fresh();
  const found = s.brand.items.find(i => i.pipeline === 'discovered');
  const rejected = s.brand.items.find(i => i.approval?.status === 'rejected');
  assert.ok(found && rejected, 'the sample holds one of each');
  for (const to of ['canon', 'precedent', 'contextual', 'experiment', 'operational']) {
    if (to !== found.standing) assert.throws(() => propose(s, { itemId: found.id, to, rationale: 'x', by: 'practitioner', asOf }), /has only been found\. Nobody has recorded what it is.*Say what it is first/);
    if (to !== rejected.standing) assert.throws(() => propose(s, { itemId: rejected.id, to, rationale: 'x', by: 'practitioner', asOf }), /was rejected on .*It cannot be given a standing while that stands/);
  }
  assert.equal(s.proposals.length, 0, 'nothing that could never be adopted is put in front of a decider');
  if (found.standing !== 'archive') s = propose(s, { itemId: found.id, to: 'archive', rationale: 'Nobody knows what it is', by: 'practitioner', asOf });
});

test('evidence counts only where it bears on the material, and recorded reuse is always shown', () => {
  let s = fresh();
  // Evidence recorded on unrelated research does not answer for the onboarding scenes.
  s = propose(s, { itemId: 'fw-onboarding-papercut', to: 'canon', rationale: 'x', evidenceIds: ['e-int-calm'], by: 'practitioner', asOf });
  const far = s.proposals[0].warnings.join(' ');
  assert.match(far, /recorded on other material/);
  assert.match(far, /No independent evidence/);
  assert.match(far, /Reused 4 times/);
  // Its own observed figure counts, but the reviewer still sees the reuse and what the figure does not show.
  let own = propose(fresh(), { itemId: 'fw-onboarding-papercut', to: 'canon', rationale: 'x', evidenceIds: ['e-onb-complete'], by: 'practitioner', asOf });
  const near = own.proposals[0].warnings.join(' ');
  assert.ok(!/No independent evidence/.test(near));
  assert.match(near, /shows what happened, not that this work caused it/);
  assert.match(near, /Reused 4 times/);
  // What a brief intended is not evidence.
  own = propose(fresh(), { itemId: 'fw-small-hours-hero', to: 'canon', rationale: 'x', evidenceIds: ['e-sh-intent'], by: 'practitioner', asOf });
  assert.match(own.proposals[0].warnings.join(' '), /No independent evidence/);
  assert.throws(() => propose(fresh(), { itemId: 'fw-small-hours-hero', to: 'canon', rationale: '  ', by: 'practitioner', asOf }), /Say why/);
});

test('a routed choice is answered by the person named for it, and by no one else', () => {
  let s = fresh();
  s = recordChoice(s, { subject: 'Reactivation offer', verdict: 'invent', rationale: 'Price came up most', needs: 'offer', by: 'practitioner', asOf });
  const id = s.choices[0].id;
  assert.deepEqual([s.choices[0].status, s.choices[0].owner], ['awaiting decision', 'tom']);
  assert.throws(() => answerChoice(s, id, { by: 'practitioner', outcome: 'accept', asOf }), AuthorityError);
  assert.throws(() => answerChoice(s, id, { by: 'priya', outcome: 'accept', asOf }), /The offer at Fernway is decided by Tom Ekwueme/);
  assert.throws(() => answerChoice(s, id, { by: 'tom', outcome: 'decline', asOf }), /Say why it is declined/);
  s = answerChoice(s, id, { by: 'tom', outcome: 'decline', note: 'Not before the board meets', asOf });
  assert.deepEqual([s.choices[0].status, s.choices[0].answer.by, s.choices[0].answer.note], ['declined', 'tom', 'Not before the board meets']);
  assert.equal(s.decisions.at(-1).outcome, 'decline-choice');
  assert.throws(() => answerChoice(s, id, { by: 'tom', outcome: 'accept', asOf }), /already been answered/);
  assert.equal(readPacket(toPacket(s)).record.choices[0].status, 'declined', 'the answer travels in the packet');
  // Someone who records a choice in their own area has decided it by recording it.
  let f = startEngagement({ halden: founderBrand() }, founderEng());
  f = recordChoice(f, { subject: 'Keep the mark', verdict: 'preserve', rationale: 'It is ours', needs: 'standing.visual', by: 'dd', asOf });
  assert.deepEqual([f.choices[0].status, f.choices[0].owner, f.choices[0].answer.by], ['accepted', 'dd', 'dd']);
});

test('a naming can be taken back, and what waited for that person waits again', () => {
  let s = startEngagement({ halden: founderBrand() }, founderEng());
  s = nameAuthority(s, { power: 'claims', person: { name: 'Operations lead' }, by: 'dd', asOf });
  s = recordChoice(s, { subject: 'Founding date', verdict: 'investigate', rationale: 'Two dates on file', needs: 'claims', by: 'dd', asOf });
  assert.equal(s.choices[0].owner, 'ops');
  assert.throws(() => unnameAuthority(s, { power: 'claims', personId: 'dd', by: 'dd', asOf }), /not named to decide public claims/);
  s = unnameAuthority(s, { power: 'claims', personId: 'ops', by: 'dd', asOf });
  assert.deepEqual(s.brand.authority.claims, []);
  assert.equal(s.choices[0].owner, null);
  assert.equal(s.decisions.at(-1).outcome, 'unname-authority');
  assert.throws(() => unnameAuthority(study(), { power: 'claims', personId: 'x', by: 'practitioner', asOf }), AuthorityError);
});

test('an item may name the area that decides it, and that area decides', () => {
  const brand = founderBrand();
  brand.items = brand.items.map(i => (i.id === 'h-about' ? { ...i, power: 'claims', pipeline: 'verified' } : i));
  const s = startEngagement({ halden: brand }, founderEng());
  assert.throws(() => approveItem(s, 'h-about', { by: 'dd', asOf }), /No one has been named to decide public claims at Halden/);
  assert.throws(() => readPacket({ ...toPacket(s), brand: { ...toPacket(s).brand, items: toPacket(s).brand.items.map(i => (i.id === 'h-about' ? { ...i, power: 'everything' } : i)) } }), /not an area of decision/);
});

test('a context package withholds material carrying a claim that is no longer true', () => {
  const s = fresh();
  const { package: pkg, audit } = buildContextPackage(s, { partner: { id: 'a', name: 'A' }, assignment: 'x', channels: ['owned-web'], workTypes: ['Customer campaign'], expires: '2026-12-31', asOf });
  assert.ok(!pkg.included.some(i => i.id === 'fw-small-hours-endcard'));
  assert.match(audit.withheld.find(w => w.id === 'fw-small-hours-endcard').reasons.join(' '), /Carries a claim that is no longer true: "Ad-free, always"/);
});

test('the handoff holds the interpretation and the packages issued, and ends only when ended', () => {
  const s = fresh();
  const { package: pkg } = buildContextPackage(s, { partner: { id: 'a', name: 'Agent' }, assignment: 'Landing page', channels: ['owned-web'], workTypes: ['Customer campaign'], expires: '2026-12-31', asOf });
  const open = buildHandoff(s, { brief: {}, asOf, packages: [pkg] });
  assert.equal(open.engagement.ended, null);
  assert.equal(open.written, asOf);
  assert.ok(open.interpretation.strengths.length && open.interpretation.hypotheses.length && open.interpretation.carryForward.length);
  assert.deepEqual(open.contextPackages.map(p => [p.id, p.partner, p.expires, p.revokedAt]), [[pkg.id, 'Agent', '2026-12-31', null]]);
  assert.equal(buildHandoff(s, { brief: {}, asOf, ended: asOf }).engagement.ended, asOf);
});

test('search matches whole words, and a query with no words matches nothing', () => {
  const t = openTenant(vault, eng, { asOf });
  assert.equal(search(t, '!!!').length, 0);
  assert.equal(search(t, 'a').length, 0);
  assert.equal(search(t, '').length, t.brand.items.length, 'no question asked lists everything');
  assert.equal(search(t, '')[0].standing.asked, false);
  assert.ok(search(t, 'papercut').length > 0 && search(t, 'papercut').length === search(t, 'paper-cut').length);
  assert.ok(search(t, 'illus').length > 0, 'four letters or more find words that begin with them');
  assert.ok(!search(t, 'ion').length, 'a fragment inside other words finds nothing');
});

test('the basis of a record can be put in its own words, and dates in reasons are written out', () => {
  assert.match(basisNote({ basis: 'company-record' }), /Each record says where it came from/);
  assert.equal(basisNote({ basis: 'company-record', basisNote: ' Drafted from files. ' }), 'Drafted from files.');
  assert.deepEqual([longDate('2026-11-11'), longDate('2025-03'), longDate('2024'), longDate('')], ['11 November 2026', 'March 2025', '2024', 'an unrecorded date']);
  assert.throws(() => readPacket({ ...toPacket(fresh()), brand: { ...toPacket(fresh()).brand, basisNote: 'x'.repeat(401) } }), /one short paragraph/);
});

test('rules that nobody adopted are not called in force, and one person is not listed twice', () => {
  const brand = founderBrand({ claims: [], facts: [],
    rules: [
      { id: 'r1', topic: 'content.frame', value: 'pillars', statement: 'Four pillars organise content.', source: 'h-about', scope: ['all'], effective: {}, owner: 'dd', standing: 'operational', domain: 'verbal' },
      { id: 'r2', topic: 'content.frame', value: 'terrains', statement: 'Three terrains.', source: 'h-mark-new', scope: ['all'], effective: {}, owner: 'dd', standing: 'operational', domain: 'verbal' },
    ] });
  const t = findTensions(startEngagement({ halden: brand }, founderEng()).brand, { asOf }).find(x => x.kind === 'Conflicting guidance');
  assert.match(t.title, /^Two written rules disagree: "Four pillars organise content" and "Three terrains"$/);
  assert.match(t.detail, /^Founder decides both: /);
  assert.deepEqual(t.owners, ['dd']);
});

// --- Found by the second operator round and the fairness review, and pinned here ---

test('the kinds of work a decider names are what the canon then binds', () => {
  const brand = founderBrand({ claims: [], facts: [],
    rules: [
      { id: 'hr-face', topic: 'type.face', value: 'wide', statement: 'One wide display face.', source: 'h-system', scope: ['Marketing website'], effective: {}, domain: 'visual' },
      { id: 'hr-corner', topic: 'shape.corner', value: 'pill', statement: 'Corners are pills.', source: 'h-system', scope: ['Marketing website'], effective: {}, domain: 'visual' },
    ],
    items: [
      { id: 'h-system', title: 'Design system file', kind: 'Design system', workType: 'Brand system', level: 'brand', pipeline: 'extracted', standing: 'operational', domain: 'visual', approval: { status: 'none' }, rights: { status: 'own' }, evidence: [], relations: [], text: 'x' },
      { id: 'h-site', title: 'Live site', kind: 'Web page', workType: 'Marketing website', level: 'brand', pipeline: 'extracted', standing: 'operational', domain: 'visual', uses: { 'type.face': 'narrow', 'shape.corner': 'square' }, approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'x' },
      { id: 'h-can', title: 'Can label', kind: 'Label', workType: 'Packaging', level: 'product', pipeline: 'extracted', standing: 'operational', domain: 'visual', uses: { 'type.face': 'narrow' }, approval: { status: 'none' }, rights: { status: 'unknown' }, evidence: [], relations: [], text: 'x' },
    ] });
  const open = () => propose(startEngagement({ halden: brand }, founderEng()), { itemId: 'h-system', to: 'canon', rationale: 'It is the system', by: 'dd', asOf });
  const drift = s => findTensions(s.brand, { asOf }).filter(t => t.kind === 'Drift from canon').map(t => t.id);
  // Covering packaging only: the site is no longer judged against it, and the can is.
  let s = open();
  s = decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', covers: ['Packaging'], checked: 'The live file', asOf });
  assert.deepEqual(drift(s), ['t-drift-h-can']);
  // What the site does differently does not vanish: it is listed as outside the canon's reach, not as a departure.
  const out = findTensions(s.brand, { asOf }).find(t => t.id === 't-outside-h-site');
  assert.equal(out.kind, 'Outside what canon covers');
  assert.match(out.title, /^Live site differs from canon that covers other work$/);
  assert.match(out.detail, /These rules are canon for packaging only, and this is marketing website\. It is not a departure\./);
  assert.deepEqual(out.points.map(x => x.ruleId), ['hr-face', 'hr-corner']);
  assert.ok(!findTensions(s.brand, { asOf }).find(t => t.id === 't-outside-h-can'));
  assert.equal(s.brand.items[0].standingRecord.scope, 'Packaging');
  assert.deepEqual(effectiveRules(s.brand).map(r => r.scope), [['Packaging'], ['Packaging']]);
  // Covering the website, and holding one rule back: only the rule adopted is in force.
  s = open();
  s = decide(s, s.proposals[0].id, { by: 'dd', outcome: 'adopt', covers: ['Marketing website'], holdBack: ['hr-corner'], checked: 'The live file', asOf });
  assert.deepEqual(effectiveRules(s.brand).map(r => [r.id, r.standing]), [['hr-face', 'canon'], ['hr-corner', 'operational']]);
  assert.deepEqual(s.decisions.at(-1).heldBack, ['hr-corner']);
  const t = findTensions(s.brand, { asOf });
  assert.deepEqual(t.find(x => x.id === 't-drift-h-site').sources.includes('h-site'), true);
  assert.ok(!t.find(x => x.id === 't-drift-h-site').points, 'one point of drift: the held-back rule is not among them');
  assert.ok(t.find(x => x.id === 't-mismatch-h-site'), 'the held-back rule is still only written down');
  // Its own rules and values carry no licence to be unknown.
  assert.equal(assessStanding(s.brand.items[0], { asOf }, s.brand).reusable, true);
  assert.ok(!t.some(x => x.id === 't-rights-h-system'));
  assert.equal(readPacket(toPacket(s)).brand.items[0].standingRecord.covers[0], 'Marketing website');
});

test('a proposal already on record for found or rejected material is still refused when decided', () => {
  // A packet can arrive carrying such a proposal. The decision is where it stops.
  let s = fresh();
  const found = s.brand.items.find(i => i.pipeline === 'discovered');
  const rejected = s.brand.items.find(i => i.approval?.status === 'rejected');
  const by = id => s.brand.authority[powerFor(s.brand.items.find(i => i.id === id))][0];
  s.proposals.push({ id: 'p-old-1', itemId: found.id, from: found.standing, to: 'precedent', rationale: 'x', evidenceIds: [], by: 'practitioner', date: asOf, status: 'open', warnings: [], reviewer: [by(found.id)] });
  s.proposals.push({ id: 'p-old-2', itemId: rejected.id, from: rejected.standing, to: 'operational', rationale: 'x', evidenceIds: [], by: 'practitioner', date: asOf, status: 'open', warnings: [], reviewer: [by(rejected.id)] });
  assert.throws(() => decide(s, 'p-old-1', { by: by(found.id), outcome: 'adopt', asOf }), /has only been found/);
  assert.throws(() => decide(s, 'p-old-2', { by: by(rejected.id), outcome: 'adopt', asOf }), /was rejected/);
});

test('evidence on a related piece speaks for the family, not for the piece', () => {
  const s = fresh();
  const item = s.brand.items.find(i => (i.relations || []).length && !(i.evidence || []).some(e => e.type !== 'intended'));
  const relative = s.brand.items.find(i => item.relations.some(r => r.to === i.id) && (i.evidence || []).some(e => e.type !== 'intended'));
  assert.ok(item && relative, 'the sample holds a piece with evidence only on a relative');
  const p = propose(s, { itemId: item.id, to: 'canon', rationale: 'x', evidenceIds: [relative.evidence.find(e => e.type !== 'intended').id], by: 'practitioner', asOf }).proposals[0];
  assert.match(p.warnings.join(' '), new RegExp(`recorded on related material \\(${relative.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\), not on this piece`));
  assert.match(p.warnings.join(' '), /No independent evidence/);
});

test('material carrying a claim that is no longer true is not reusable, whatever its licence', () => {
  const s = fresh();
  const st = assessStanding(s.brand.items.find(i => i.id === 'fw-small-hours-endcard'), { asOf, channels: ['paid-media'] }, s.brand);
  assert.equal(st.reusable, false);
  assert.match(st.reasons.reusable.join(' '), /Carries a claim that is no longer true: "Ad-free, always"/);
});

test('a choice is the person\'s own: it needs a reason, can be tied to what it answers, and can be withdrawn', () => {
  let s = fresh();
  assert.throws(() => recordChoice(s, { subject: 'x', verdict: 'repair', rationale: ' ', by: 'practitioner', asOf }), /Say why/);
  s = recordChoice(s, { subject: 'The screens rule', verdict: 'investigate', rationale: 'Two rules cannot both hold', about: 't-conflict-hero.screens', by: 'practitioner', asOf });
  assert.equal(s.choices[0].about, 't-conflict-hero.screens');
  assert.equal(findTensions(s.brand, { asOf, workTypes: eng.workTypes }).find(t => t.id === 't-conflict-hero.screens').power, 'standing.visual');
  assert.throws(() => withdrawChoice(s, s.choices[0].id, { by: 'priya', asOf }), AuthorityError);
  s = withdrawChoice(s, s.choices[0].id, { by: 'practitioner', asOf });
  assert.equal(s.choices[0].status, 'withdrawn');
  assert.equal(buildBrief(s.brand, s.engagement, s.choices, { asOf }).decisions.length, 0, 'a withdrawn choice is not carried by the brief');
  assert.throws(() => withdrawChoice(s, s.choices[0].id, { by: 'practitioner', asOf }), /already withdrawn/);
});

test('answers and choices come across a rebuild; decisions about material do not', () => {
  let old = startEngagement({ halden: founderBrand() }, founderEng());
  old = recordAnswer(old, { question: 'Which founding date is right?', answer: 'Started 2011, launched 2019.', by: 'dd', asOf });
  old = recordChoice(old, { subject: 'Keep the mark', verdict: 'preserve', rationale: 'It is ours', sources: ['h-mark-new', 'gone-item'], needs: 'standing.visual', by: 'dd', asOf });
  old = propose(old, { itemId: 'h-about', to: 'precedent', rationale: 'x', by: 'dd', asOf });
  old = decide(old, old.proposals[0].id, { by: 'dd', outcome: 'adopt', asOf });
  const fresh2 = startEngagement({ halden: founderBrand() }, founderEng());
  const r = carryOver(fresh2, old);
  assert.deepEqual(r.carried, { answers: 1, choices: 1 });
  assert.equal(r.left.decisions, old.decisions.length);
  assert.deepEqual(r.state.choices[0].sources, ['h-mark-new'], 'a source that no longer exists is dropped');
  assert.equal(r.state.brand.items.find(i => i.id === 'h-about').standing, fresh2.brand.items.find(i => i.id === 'h-about').standing, 'standing is not carried');
  assert.deepEqual(carryOver(r.state, old).carried, { answers: 0, choices: 0 }, 'bringing it over twice adds nothing');
  // What has been answered is no longer listed as unknown or open.
  const answered = recordAnswer(startEngagement({ halden: founderBrand({ unknowns: ['Who drew the mark?'] }) }, { ...founderEng(), questions: ['Who drew the mark?'] }), { question: 'Who drew the mark?', answer: 'A friend, in 2019.', by: 'dd', asOf });
  assert.deepEqual(orientation(answered.brand, answered.engagement, { asOf, answers: answered.answers }).unknowns.filter(u => /drew/.test(u)), []);
  const handed = buildHandoff(answered, { brief: {}, asOf });
  assert.deepEqual([handed.openQuestions, handed.unknowns, handed.answers.length], [[], [], 1]);
});

test('a study\'s handoff names every standing as its own reading', () => {
  const h = buildHandoff(study(), { brief: {}, asOf });
  assert.match(h.standingNote, /this study's reading of public material\. None of it is Halden's own classification/);
  assert.ok(h.sources.every(x => typeof x.readAs === 'string' && !/canon/i.test(x.readAs)));
  assert.equal(buildHandoff(fresh(), { brief: {}, asOf }).standingNote, undefined);
});

test('a month sorts after the days in it, and a year after its months', () => {
  const brand = founderBrand({ facts: [
    { id: 'a', statement: 'Year only.', date: '2023' }, { id: 'b', statement: 'A day in June.', date: '2023-06-09' },
    { id: 'c', statement: 'June.', date: '2023-06' }, { id: 'd', statement: 'A day in July.', date: '2023-07-01' },
  ] });
  assert.deepEqual(timeline(brand, { asOf }).map(f => f.id), ['b', 'c', 'd', 'a']);
});

test('common words find nothing, and the year on a card is searchable', () => {
  const t = openTenant(vault, eng, { asOf });
  assert.equal(search(t, 'the').length, 0);
  assert.equal(search(t, 'and for with').length, 0);
  const in2025 = t.brand.items.filter(i => i.period?.from?.startsWith('2025')).length;
  assert.ok(in2025 > 0 && search(t, '2025').length >= in2025);
});

// --- Found by the third verification pass, and pinned here ---

test('rules written with a standing of their own are offered at adoption, and come into force with it', () => {
  let s = fresh();
  assert.deepEqual(rulesStatedBy(s.brand, 'fw-pm-playbook-2025').map(r => r.id), ['r-lead-with-screen'], 'an operational rule is still a rule the playbook states');
  assert.deepEqual(rulesStatedBy(s.brand, 'fw-guidelines-v3'), [], 'rules already canon are not offered again');
  s = propose(s, { itemId: 'fw-pm-playbook-2025', to: 'canon', rationale: 'Launch work follows it', by: 'practitioner', asOf });
  const decider = s.brand.authority[powerFor(s.brand.items.find(i => i.id === 'fw-pm-playbook-2025'))][0];
  const adopted = decide(s, s.proposals[0].id, { by: decider, outcome: 'adopt', covers: ['Product launch'], asOf });
  const rule = effectiveRules(adopted.brand).find(r => r.id === 'r-lead-with-screen');
  assert.deepEqual([rule.standing, rule.scope], ['canon', ['Product launch']]);
  const held = decide(s, s.proposals[0].id, { by: decider, outcome: 'adopt', covers: ['Product launch'], holdBack: ['r-lead-with-screen'], asOf });
  assert.equal(effectiveRules(held.brand).find(r => r.id === 'r-lead-with-screen').standing, 'operational');
});

test('a rule in force set against a written one is called that, and every kind of work named is checked', () => {
  let s = fresh();
  const conflict = st => findTensions(st.brand, { asOf, workTypes: ['Brand campaign', 'Customer campaign'] }).find(t => t.kind === 'Conflicting guidance');
  assert.match(conflict(s).title, /^A rule in force and a written rule disagree: /, 'the playbook rule is written down, not adopted');
  // Every kind the record knows can be named: what material is filed under, what rules were written for, what this project makes.
  const kinds = kindsOfWork(s.brand, s.engagement);
  for (const k of ['Customer campaign', 'Product launch', 'Brand campaign']) assert.ok(kinds.includes(k), `${k} can be named`);
  assert.ok(!kinds.includes('all'));
  s = propose(s, { itemId: 'fw-pm-playbook-2025', to: 'canon', rationale: 'Launch work follows it', by: 'practitioner', asOf });
  const decider = s.brand.authority[powerFor(s.brand.items.find(i => i.id === 'fw-pm-playbook-2025'))][0];
  assert.throws(() => decide(s, s.proposals[0].id, { by: decider, outcome: 'adopt', covers: ['all', 'Nonsense type'], asOf }), /"Nonsense type" is not a kind of work in Fernway's material/);
  const both = decide(s, s.proposals[0].id, { by: decider, outcome: 'adopt', covers: ['Customer campaign'], asOf });
  assert.match(conflict(both).title, /^Two rules in force disagree: /);
});

test('a study raises no question of rights, checked or not, and a proposal to precedent shows the rights', () => {
  let s = startEngagement({ halden }, haldenEng);
  const before = findTensions(s.brand, { asOf }).length;
  for (const i of s.brand.items) if (i.pipeline !== 'verified' && i.pipeline !== 'approved') s = verifyItem(s, i.id, { by: 'practitioner', how: 'Opened the page', asOf });
  const after = findTensions(s.brand, { asOf });
  assert.ok(!after.some(t => /^t-rights-/.test(t.id)), 'a study may reuse nothing, so it does not ask what the terms are');
  assert.equal(after.length, before);
  const p = propose(fresh(), { itemId: 'fw-onboarding-papercut', to: 'precedent', rationale: 'x', by: 'practitioner', asOf }).proposals[0];
  assert.match(p.warnings.join(' '), /Rights are unknown\. Work that follows it may not be free to use what it shows\./);
});

test('a proposal cannot cite evidence that is not in the record, and warnings follow the case made, not the target', () => {
  const s = fresh();
  assert.throws(() => propose(s, { itemId: 'fw-onboarding-papercut', to: 'precedent', rationale: 'x', evidenceIds: ['e-nope'], by: 'practitioner', asOf }), /No evidence with the id "e-nope"/);
  const p = propose(s, { itemId: 'fw-onboarding-papercut', to: 'precedent', rationale: 'x', evidenceIds: ['e-sh-trials'], by: 'practitioner', asOf }).proposals[0];
  assert.match(p.warnings.join(' '), /recorded on related material/);
  assert.match(p.warnings.join(' '), /Reused 4 times/);
});

test('saying what a found piece is lets its standing be proposed, and changes nothing else', () => {
  let s = fresh();
  const found = s.brand.items.find(i => i.pipeline === 'discovered');
  assert.throws(() => describeItem(s, found.id, { what: '  ', by: 'practitioner', asOf }), /Say what it is: what was made, when, and for whom/);
  const before = { standing: found.standing, approval: found.approval?.status };
  s = describeItem(s, found.id, { what: 'Photographs from the 2019 family shoot, made for the launch site.', by: 'practitioner', asOf });
  const now = s.brand.items.find(i => i.id === found.id);
  assert.deepEqual([now.pipeline, now.described.by, now.described.what, now.standing, now.approval?.status], ['extracted', 'practitioner', 'Photographs from the 2019 family shoot, made for the launch site.', before.standing, before.approval]);
  assert.throws(() => describeItem(s, found.id, { what: 'again', by: 'practitioner', asOf }), /has already been described/);
  s = propose(s, { itemId: found.id, to: 'operational', rationale: 'It is what the team works from', by: 'practitioner', asOf });
  assert.equal(s.proposals.length, 1);
  // Saying what it is does not check it: canon still needs the decider's own check.
  const canon = propose(s, { itemId: found.id, to: 'canon', rationale: 'x', by: 'practitioner', asOf });
  assert.match(canon.proposals.at(-1).warnings.join(' '), /Not yet checked against its source/);
});

test('an answer on reuse gives every reason, and a clearance with no channels named is a clearance', () => {
  const s = fresh();
  const hero = assessStanding(s.brand.items.find(i => i.id === 'fw-small-hours-hero'), { asOf, channels: ['owned-web'] }, s.brand);
  assert.equal(hero.reusable, false);
  assert.match(hero.reasons.reusable.join(' '), /Carries a claim that is no longer true: "Screen-free bedtime"\..*Not licensed for owned web/);
  // A reference document cleared for internal and agency use says so, and is not called licensed for media it was never meant for.
  const guide = assessStanding(s.brand.items.find(i => i.id === 'fw-guidelines-v3'), { asOf, channels: ['owned-web'] }, s.brand);
  assert.match(guide.reasons.reusable.join(' '), /It can be worked from, not published\. Cleared for internal, agency only\./);
  const open = assessStanding({ ...s.brand.items.find(i => i.id === 'fw-guidelines-v3'), rights: { status: 'cleared', channels: [] } }, { asOf, channels: ['owned-web'] }, s.brand);
  assert.equal(open.reusable, true);
  assert.match(open.reasons.reusable.join(' '), /Cleared, with no channel limits recorded/);
});

// --- Found by the fifth independent round, and pinned here ---

test('a study\'s file uses a study\'s words, and reads back to the same record', () => {
  let s = study();
  s = propose(s, { itemId: 'h-about', to: 'precedent', rationale: 'It reads as earlier work', by: 'practitioner', asOf });
  assert.deepEqual(s.proposals[0].warnings, ['A study cannot establish who decides at Halden. This is a note to yourself.'], 'a note carries no reviewer\'s warnings');
  const file = toPacket(s);
  const text = JSON.stringify(file);
  assert.ok(!/contradictedBy|tensionNote/.test(text), 'the file never says a statement was contradicted');
  assert.equal(file.brand.claims.find(c => c.id === 'hc-open').setBeside, 'hf-fee');
  assert.match(file.note, /"setBeside" on a statement names a later report this study set beside it; it asserts no contradiction\./);
  assert.deepEqual([file.record.proposals.length, file.record.notes.length, file.record.notes[0].status, file.record.notes[0].warnings], [0, 1, undefined, undefined]);
  const back = startFromPacket(JSON.parse(text), { asOf });
  assert.equal(back.brand.claims.find(c => c.id === 'hc-open').contradictedBy, 'hf-fee');
  assert.deepEqual([back.proposals.length, back.proposals[0].status, back.proposals[0].to], [1, 'open', 'precedent']);
  assert.ok(findTensions(back.brand, { asOf }).find(t => t.id === 't-stale-hc-open'), 'the pairing is still read as a pairing');
  // A company's own record keeps its own words.
  assert.ok(/contradictedBy/.test(JSON.stringify(toPacket(fresh()))));
});

test('someone naming themselves says "me", and is never turned into a stranger', () => {
  let s = startEngagement({ halden: founderBrand() }, founderEng());
  const before = Object.keys(s.brand.people).length;
  for (const word of ['me', 'Myself', 'founder']) s = nameAuthority(s, { power: 'claims', person: { name: word }, by: 'dd', asOf });
  assert.deepEqual(s.brand.authority.claims, ['dd']);
  assert.equal(Object.keys(s.brand.people).length, before, 'nobody new was created');
  // Where the record does not know who is typing, "me" is refused, not recorded as a name.
  const visitor = startEngagement({ halden: founderBrand() }, { ...founderEng(), actor: 'practitioner' });
  assert.throws(() => nameAuthority(visitor, { power: 'claims', person: { name: 'me' }, by: 'practitioner', asOf }), /Give the name\. This record does not know who "me" is\./);
});

test('an entry its decider has decided leaves the list of what needs attention', () => {
  const brand = founderBrand({ authority: { 'standing.visual': ['dd'], 'standing.verbal': ['dd'], claims: ['dd'] } });
  let s = startEngagement({ halden: brand }, founderEng());
  const entry = findTensions(s.brand, { asOf }).find(t => t.power === 'claims');
  assert.ok(entry, 'the sample holds an entry about a claim');
  assert.ok(orientation(s.brand, s.engagement, { asOf, choices: s.choices }).attention.some(t => t.id === entry.id));
  s = recordChoice(s, { subject: 'The claim', verdict: 'repair', rationale: 'Use the later line', needs: 'claims', about: entry.id, by: 'dd', asOf });
  const o = orientation(s.brand, s.engagement, { asOf, choices: s.choices });
  assert.ok(!o.attention.some(t => t.id === entry.id), 'decided is not waiting');
  assert.deepEqual(o.decided.map(t => t.id), [entry.id], 'and it is still on record as decided, not erased');
  // A choice by someone not named for it decides nothing.
  let other = startEngagement({ halden: founderBrand() }, founderEng());
  other = recordChoice(other, { subject: 'The claim', verdict: 'repair', rationale: 'x', needs: 'claims', about: entry.id, by: 'dd', asOf });
  assert.ok(orientation(other.brand, other.engagement, { asOf, choices: other.choices }).attention.some(t => t.id === entry.id));
});

test('a proposal for a piece carrying a claim that no longer holds says so, and a package says what each rule binds', () => {
  const s = fresh();
  const p = propose(s, { itemId: 'fw-small-hours-endcard', to: 'canon', rationale: 'x', by: 'practitioner', asOf }).proposals[0];
  assert.match(p.warnings.join(' '), /It carries a claim the record says is no longer true: "Ad-free, always"\./);
  const pkg = buildContextPackage({ ...s, engagement: { ...s.engagement, grant: { ...s.engagement.grant, powers: ['read', 'propose', 'share'] } } }, { partner: { id: 'a', name: 'A' }, assignment: 'x', channels: ['owned-web'], workTypes: ['Customer campaign'], expires: '2026-12-31', asOf }).package;
  assert.deepEqual(pkg.rules.find(r => r.id === 'r-no-screens').covers, ['Brand campaign', 'Customer campaign']);
  assert.equal(pkg.rules.find(r => r.id === 'r-chime').covers, undefined, 'a rule for all work needs no list');
});
