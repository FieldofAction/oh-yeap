// Tests for the Living Brand connector's storage and tools (living-brand/connector).
// Run: node --test scripts/living-brand-connector-test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../living-brand/connector/store.mjs';
import { createTools } from '../living-brand/connector/tools.mjs';
import { PACKET_FORMAT } from '../src/living-brand/domain/index.js';
import { bundle, BUNDLE, skillInSync } from './living-brand-connector-build.mjs';

process.env.LIVING_BRAND_AS_OF = '2026-11-11';

const fresh = () => {
  const home = mkdtempSync(join(tmpdir(), 'living-brand-'));
  const store = openStore(home);
  const tools = Object.fromEntries(createTools(store).map(t => [t.name, t]));
  return { home, store, call: (name, args = {}) => tools[name].run(args), tools };
};

// A second, invented client that shares Fernway's vocabulary, and whose
// practitioner has been named to decide visual and verbal standing.
const rival = (over = {}) => ({
  format: PACKET_FORMAT,
  brand: {
    id: 'moonhouse', name: 'Moonhouse', basis: 'company-record', summary: 'Invented for tests.',
    intent: { statement: 'Bedtime, unhurried.' }, people: { founder: { name: 'Founder Person', title: 'Creative founder' } },
    authority: { 'standing.visual': ['founder'], 'standing.verbal': ['founder'], claims: [], rights: [], publish: [] },
    facts: [], claims: [], rules: [],
    items: [
      { id: 'mh-secret', title: 'Winter plan, confidential', kind: 'Strategy document', level: 'company', period: { from: '2026-10-01' }, pipeline: 'verified', standing: 'precedent', domain: 'verbal',
        approval: { status: 'approved', by: 'founder', date: '2026-10-01' }, rights: { status: 'cleared', channels: ['internal'] }, evidence: [], relations: [], tags: ['paper-cut', 'bedtime', 'moon'], text: 'Paper-cut bedtime moon campaign. Budget MOONHOUSE-ONLY-MARKER.' },
      { id: 'mh-mark', title: 'Moon mark', kind: 'Logo mark', level: 'brand', period: { from: '2025-01-01' }, pipeline: 'verified', standing: 'experiment', domain: 'visual',
        approval: { status: 'approved', by: 'founder', date: '2025-01-01' }, rights: { status: 'cleared', channels: ['all'] }, evidence: [{ id: 'mh-e1', type: 'contribution', statement: 'Recognised by customers in store interviews.', basis: 'interview' }], relations: [], tags: ['mark'], text: 'A crescent.' },
    ],
  },
  engagement: { id: 'eng-moonhouse', brandId: 'moonhouse', clientLabel: 'Moonhouse', role: 'Creative founder', actor: 'founder', project: 'Winter', practitioner: 'Founder Person',
    grant: { brandId: 'moonhouse', powers: ['read', 'propose', 'steward'] }, workTypes: [], channels: [] },
  ...over,
});
const study = () => { const p = rival(); p.brand = { ...p.brand, id: 'tidewater', name: 'Tidewater', basis: 'public-source', people: {}, authority: { 'standing.visual': [] } }; p.brand.items = p.brand.items.map(i => ({ ...i, id: i.id.replace('mh-', 'tw-'), approval: { status: 'published', by: 'Tidewater' } })); p.engagement = { ...p.engagement, id: 'eng-tidewater', brandId: 'tidewater', actor: undefined, grant: { brandId: 'tidewater', powers: ['read', 'propose'] } }; return p; };

test('first run installs the fictional sample and remembers an ended engagement by name only', () => {
  const { home, call } = fresh();
  const list = call('list_engagements');
  assert.match(list.text, /Fernway \[eng-fernway\].*Open\./);
  assert.match(list.text, /Brightloop.*Ended 2026-10-30; its material is no longer held/);
  assert.deepEqual(readdirSync(join(home, 'engagements')), ['eng-fernway']);
  assert.throws(() => call('open_engagement', { engagement_id: 'eng-brightloop' }), /ended on 2026-10-30/);
  assert.ok(!readFileSync(join(home, 'workbench.json'), 'utf8').includes('paper-cut'), 'the workbench file holds no client material');
});

test('each engagement is its own folder, and one client\'s search never returns another\'s', () => {
  const { home, call } = fresh();
  call('import_packet', { json: JSON.stringify(rival()) });
  assert.deepEqual(readdirSync(join(home, 'engagements')).sort(), ['eng-fernway', 'eng-moonhouse']);
  for (const q of ['paper-cut bedtime moon', 'Moonhouse', 'winter plan confidential', '']) {
    const r = call('search_material', { engagement_id: 'eng-fernway', query: q });
    assert.ok(!JSON.stringify(r).includes('MOONHOUSE-ONLY-MARKER') && !JSON.stringify(r).includes('mh-'), q);
  }
  for (const name of ['open_engagement', 'get_interpretation', 'build_brief', 'export_engagement_package']) {
    assert.ok(!JSON.stringify(call(name, { engagement_id: 'eng-fernway' })).includes('MOONHOUSE-ONLY-MARKER'), name);
  }
  const theirs = call('search_material', { engagement_id: 'eng-moonhouse', query: 'paper-cut' });
  assert.ok(theirs.data.results.every(x => x.id.startsWith('mh-')));
  assert.ok(!readFileSync(join(home, 'engagements/eng-fernway/packet.json'), 'utf8').includes('MOONHOUSE'));
});

test('ids cannot escape the store, and inconsistent packets are refused', () => {
  const { call } = fresh();
  assert.throws(() => call('open_engagement', { engagement_id: '../../etc' }), /No engagement/);
  const bad = rival(); bad.engagement.id = '../escape';
  assert.throws(() => call('import_packet', { json: JSON.stringify(bad) }), /not an engagement id/);
  const cross = rival(); cross.engagement.brandId = 'fernway';
  assert.throws(() => call('import_packet', { json: JSON.stringify(cross) }), /different brand/);
  assert.throws(() => call('import_packet', { json: '{not json' }), /Could not read the packet/);
  assert.throws(() => call('import_packet', {}), /Give a path or the JSON text/);
});

test('the connector decides only as its own practitioner, and only where they are named', () => {
  const { call } = fresh();
  const p = call('propose_standing', { engagement_id: 'eng-fernway', item_id: 'fw-small-hours-hero', to: 'canon', rationale: 'Recognition', evidence_ids: ['e-sh-recall'] });
  assert.match(p.text, /Nothing has changed\. It waits for Priya Raman/);
  assert.throws(() => call('decide_proposal', { engagement_id: 'eng-fernway', proposal_id: p.data.id, outcome: 'adopt' }), /The practitioner cannot change the standing/);
  assert.throws(() => call('decide_proposal', { engagement_id: 'eng-fernway', proposal_id: p.data.id, outcome: 'adopt', acting_as: 'priya' }), /acts only as the practitioner.*their own sign-in/);
  assert.throws(() => call('retire_item', { engagement_id: 'eng-fernway', item_id: 'fw-sound-logo', reason: 'x' }), /decided by Priya Raman/);
  assert.match(call('get_item', { engagement_id: 'eng-fernway', item_id: 'fw-small-hours-hero' }).text, /Standing: Useful precedent/);

  call('import_packet', { json: JSON.stringify(rival()) });
  const mine = call('propose_standing', { engagement_id: 'eng-moonhouse', item_id: 'mh-mark', to: 'canon', rationale: 'It is the mark', evidence_ids: ['mh-e1'] });
  assert.match(call('decide_proposal', { engagement_id: 'eng-moonhouse', proposal_id: mine.data.id, outcome: 'adopt' }).text, /Adopted.*it was experiment, and that is kept/);
  assert.match(call('get_item', { engagement_id: 'eng-moonhouse', item_id: 'mh-mark' }).text, /Before: Experiment until 2026-11-11/);
  assert.throws(() => call('approve_item', { engagement_id: 'eng-fernway', item_id: 'fw-story-builder' }), /The practitioner cannot approve Story Builder generator/);
  assert.throws(() => call('approve_item', { engagement_id: 'eng-moonhouse', item_id: 'mh-mark' }), /already approved/);
  const c = call('record_choice', { engagement_id: 'eng-moonhouse', subject: 'Check the claim', verdict: 'repair', rationale: 'x', needs: 'claims' });
  assert.match(c.text, /no one is named for that at Moonhouse yet/);
  assert.match(call('name_authority', { engagement_id: 'eng-moonhouse', area: 'claims', person_name: 'Founder Person' }).text, /now decides public claims/);
  assert.match(call('open_engagement', { engagement_id: 'eng-moonhouse' }).text, /public claims: Founder Person/);
});

test('reuse and intake never raise standing', () => {
  const { call } = fresh();
  for (let i = 0; i < 12; i++) call('record_reuse', { engagement_id: 'eng-fernway', item_id: 'fw-onboarding-papercut', where: `Place ${i}` });
  assert.match(call('get_item', { engagement_id: 'eng-fernway', item_id: 'fw-onboarding-papercut' }).text, /Standing: Experiment.*[\s\S]*Reused 16 times/);
  assert.throws(() => call('add_source_note', { engagement_id: 'eng-fernway', title: 'x', found_in: 'Drive', pipeline: 'verified' }));
  assert.throws(() => call('add_source_note', { engagement_id: 'eng-fernway', title: 'x', found_in: 'Drive', standing: 'canon' }));
  const note = call('add_source_note', { engagement_id: 'eng-fernway', title: 'Spring header', found_in: 'Drive, Lifecycle', text: 'Email header', pipeline: 'extracted' });
  assert.match(note.text, /extracted, learning archive, rights unknown, not approved/);
  assert.match(call('verify_item', { engagement_id: 'eng-fernway', item_id: note.data.id, how: 'Opened the file with the lifecycle lead' }).text, /still not approved/);
  const st = call('search_material', { engagement_id: 'eng-fernway', query: 'spring header' }).data.results[0];
  assert.deepEqual([st.authorized, st.reusable, st.authoritative], [false, false, false]);
});

test('a public-source study cannot decide, share or be handed back', () => {
  const { call } = fresh();
  call('import_packet', { json: JSON.stringify(study()) });
  assert.match(call('open_engagement', { engagement_id: 'eng-tidewater' }).text, /independent study\. Tidewater did not take part/);
  const p = call('propose_standing', { engagement_id: 'eng-tidewater', item_id: 'tw-mark', to: 'canon', rationale: 'x' });
  assert.match(p.text, /waits for no one named/);
  assert.throws(() => call('decide_proposal', { engagement_id: 'eng-tidewater', proposal_id: p.data.id, outcome: 'adopt' }), /Only Tidewater can/);
  assert.throws(() => call('name_authority', { engagement_id: 'eng-tidewater', area: 'standing.visual', person_name: 'Me' }), /Only Tidewater can name/);
  assert.throws(() => call('issue_context_package', { engagement_id: 'eng-tidewater', partner_name: 'A', assignment: 'x', channels: [], expires: '2027-01-01' }), /holds nothing of Tidewater/);
  assert.throws(() => call('end_engagement', { engagement_id: 'eng-tidewater', confirm: true }), /your own reading of public material/);
});

test('context packages are scoped, stored with their engagement, and revocable', () => {
  const { home, call } = fresh();
  const r = call('issue_context_package', { engagement_id: 'eng-fernway', partner_name: 'Landing agent', assignment: 'Landing page', channels: ['owned-web'], work_types: ['Customer campaign'], expires: '2026-12-31' });
  assert.ok(!JSON.stringify(r.data.package).includes('interviews') && !JSON.stringify(r.data.package).includes('strategy'));
  assert.ok(r.data.withheld > 0);
  assert.ok(existsSync(join(home, 'engagements/eng-fernway/packages.json')));
  assert.match(call('revoke_context_package', { engagement_id: 'eng-fernway', package_id: r.data.package.id }).text, /Valid: no/);
});

test('ending an engagement hands back the record and removes the client\'s material', () => {
  const { home, call } = fresh();
  call('record_choice', { engagement_id: 'eng-fernway', subject: 'Chime', verdict: 'preserve', rationale: 'x' });
  assert.throws(() => call('end_engagement', { engagement_id: 'eng-fernway', confirm: false }), /Not ended/);
  assert.ok(existsSync(join(home, 'engagements/eng-fernway/packet.json')));
  const out = call('end_engagement', { engagement_id: 'eng-fernway', confirm: true });
  assert.equal(out.data.packet.format, PACKET_FORMAT);
  assert.equal(out.data.handoff.choices.length, 1);
  assert.ok(!existsSync(join(home, 'engagements/eng-fernway')));
  assert.throws(() => call('open_engagement', { engagement_id: 'eng-fernway' }), /ended on 2026-11-11/);
  // The handed-back packet reopens somewhere else with the record intact.
  const again = fresh();
  again.call('import_packet', { json: JSON.stringify(out.data.packet) });
  assert.match(again.call('build_brief', { engagement_id: 'eng-fernway' }).text, /Preserve: Chime/);
});

test('methods travel; client names and material do not', () => {
  const { home, call } = fresh();
  assert.throws(() => call('add_method', { method: 'Start with the Fernway interviews' }), /names Fernway/);
  call('add_method', { method: 'Ask who decides before proposing.' });
  const bench = call('get_workbench');
  assert.match(bench.text, /Ask who decides before proposing\./);
  assert.ok(!JSON.stringify(bench.data).includes('fw-'));
  assert.ok(!readFileSync(join(home, 'workbench.json'), 'utf8').includes('Small Hours, hero'));
});

test('each engagement keeps its own log', () => {
  const { home, call } = fresh();
  call('import_packet', { json: JSON.stringify(rival()) });
  call('record_choice', { engagement_id: 'eng-moonhouse', subject: 'Moon mark', verdict: 'preserve', rationale: 'x' });
  const fern = readFileSync(join(home, 'engagements/eng-fernway/log.jsonl'), 'utf8');
  const moon = readFileSync(join(home, 'engagements/eng-moonhouse/log.jsonl'), 'utf8');
  assert.ok(!fern.includes('Moon mark') && moon.includes('Moon mark'));
});

test('a packet can be opened from a file path', () => {
  const { home, call } = fresh();
  const path = join(home, 'moonhouse.packet.json');
  writeFileSync(path, JSON.stringify(rival()));
  assert.match(call('import_packet', { path }).text, /Opened Moonhouse as engagement \[eng-moonhouse\]: 2 items/);
});

test('every tool declares what the directory requires', () => {
  const { tools } = fresh();
  for (const t of Object.values(tools)) {
    assert.ok(t.title && t.description.length > 60 && t.input.type === 'object', t.name);
    assert.ok(/^[a-z_]{3,40}$/.test(t.name), t.name);
  }
  assert.ok(tools.end_engagement.destructive && tools.import_packet.destructive);
  assert.ok(tools.search_material.readOnly && !tools.record_choice.readOnly);
});

test('the committed connector bundle and the project skill are up to date', async () => {
  const built = await bundle({ write: false });
  assert.equal(readFileSync(BUNDLE, 'utf8'), built, 'Run `npm run living-brand:connector:build` and commit the result.');
  assert.ok(skillInSync(), 'Run `npm run living-brand:connector:build` to refresh .claude/skills/living-brand.');
});
