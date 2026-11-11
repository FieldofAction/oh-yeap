import { useEffect, useMemo, useState } from 'react';
import {
  startEngagement, openTenant, search, assessStanding, findTensions, carryForward, organizationalHypotheses,
  propose, decide, retire, recordReuse, recordChoice, viewFor, buildBrief, buildContextPackage, revokePackage,
  packageValid, buildHandoff, coordinationView, exportWorkbench, orientation, STANDING_CLASSES, PIPELINE, CHOICES,
} from './domain/index.js';
import { fernway } from './data/fernway.js';
import { brightloop } from './data/brightloop.js';
import { engagements, practitioner, agency, connections, AS_OF } from './data/workspace.js';
import Plate from './Plate.jsx';

const VAULT = { fernway, brightloop };
const ENG = engagements['eng-fernway'];
const STORE_KEY = 'living-brand-state-v1';
const asOf = AS_OF;

const STAGES = [
  ['enter', 'Enter'], ['orient', 'Orient'], ['investigate', 'Investigate'], ['interpret', 'Interpret'],
  ['choose', 'Choose'], ['organize', 'Organize'], ['transfer', 'Transfer'],
];
const VIEWERS = [
  ['practitioner', 'Freelance creative director'],
  ['steward', 'Priya Raman, brand steward'],
  ['executive', 'Tom Ekwueme, chief executive'],
  ['partner', 'Landing page agent, external'],
  ['agency', 'Agency lead, Northbound Studio'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmt = d => { if (!d) return 'Unknown'; const [y, m, day] = d.split('-').map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };
const person = (brand, id) => brand.people[id]?.name || (id === 'practitioner' ? 'Freelance creative director' : id);

const load = () => {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch { /* storage unavailable */ }
  return null;
};
const initial = () => {
  const saved = load();
  return saved?.state ? saved : { state: startEngagement(VAULT, ENG), pkg: null };
};

export default function Workbench() {
  const [{ state, pkg }, setAll] = useState(initial);
  const [viewer, setViewer] = useState('practitioner');
  const [stage, setStage] = useState('enter');
  const [openId, setOpenId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ state, pkg })); } catch { /* storage unavailable */ }
  }, [state, pkg]);

  const act = (fn, ok) => {
    try { const next = fn(state); setAll(a => ({ ...a, state: next })); setNotice(ok ? { kind: 'ok', text: ok } : null); }
    catch (e) { setNotice({ kind: 'refused', text: e.message }); }
  };
  const setPkg = p => setAll(a => ({ ...a, pkg: p }));
  const reset = () => { setAll({ state: startEngagement(VAULT, ENG), pkg: null }); setNotice({ kind: 'ok', text: 'Engagement reset to its starting materials.' }); };

  const items = useMemo(() => Object.fromEntries(state.brand.items.map(i => [i.id, i])), [state]);
  const tensions = useMemo(() => findTensions(state.brand, { asOf, workTypes: state.engagement.workTypes, channels: state.engagement.channels }), [state]);
  const open = openId ? items[openId] : null;
  const ctx = { state, items, tensions, act, setOpenId, setStage, pkg, setPkg, setNotice };

  return (
    <div className="lb">
      <header className="lb-top">
        <a className="lb-home" href="/">Field of Action</a>
        <label className="lb-viewer">
          <span>Viewing as</span>
          <select value={viewer} onChange={e => { setViewer(e.target.value); setNotice(null); }}>
            {VIEWERS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </label>
      </header>

      {notice && (
        <div className={`lb-notice lb-notice-${notice.kind}`} role="status">
          <p>{notice.kind === 'refused' ? `Refused: ${notice.text}` : notice.text}</p>
          <button onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      {viewer === 'practitioner' && (
        <div className="lb-shell">
          <nav className="lb-stages" aria-label="Engagement stages">
            {STAGES.map(([k, n]) => (
              <button key={k} className={stage === k ? 'is-on' : ''} aria-current={stage === k ? 'step' : undefined} onClick={() => { setStage(k); window.scrollTo(0, 0); }}>{n}</button>
            ))}
          </nav>
          <main className="lb-main">
            {stage === 'enter' && <Enter {...ctx} reset={reset} />}
            {stage === 'orient' && <Orient {...ctx} />}
            {stage === 'investigate' && <Investigate {...ctx} />}
            {stage === 'interpret' && <Interpret {...ctx} />}
            {stage === 'choose' && <Choose {...ctx} />}
            {stage === 'organize' && <Organize {...ctx} />}
            {stage === 'transfer' && <Transfer {...ctx} />}
          </main>
        </div>
      )}
      {viewer === 'steward' && <main className="lb-main lb-solo"><Steward {...ctx} /></main>}
      {viewer === 'executive' && <main className="lb-main lb-solo"><Executive {...ctx} /></main>}
      {viewer === 'partner' && <main className="lb-main lb-solo"><Partner {...ctx} /></main>}
      {viewer === 'agency' && <main className="lb-main lb-solo"><Agency /></main>}

      {open && <Drawer item={open} {...ctx} canPropose={viewer === 'practitioner'} />}
    </div>
  );
}

function Cite({ id, items, setOpenId }) {
  const it = items[id];
  if (!it) return <span className="lb-cite is-missing">{id}</span>;
  return <button className="lb-cite" onClick={() => setOpenId(id)}>{it.title}</button>;
}
const Cites = ({ ids, ...p }) => <span className="lb-cites">{[...new Set(ids)].map(id => <Cite key={id} id={id} {...p} />)}</span>;

/* Enter ------------------------------------------------------------------ */
function Enter({ state, items, setOpenId, setStage, setNotice, reset }) {
  const e = state.engagement;
  const tryOpen = id => {
    try { openTenant(VAULT, engagements[id]); setNotice({ kind: 'ok', text: 'Opened.' }); }
    catch (err) { setNotice({ kind: 'refused', text: err.message }); }
  };
  return (
    <article>
      <h1>{e.project}</h1>
      <p className="lb-deck">{e.purpose}</p>

      <section className="lb-section">
        <h2>Where this engagement sits</h2>
        <Nesting />
      </section>

      <section className="lb-section lb-two">
        <div>
          <h2>Role and authority</h2>
          <dl className="lb-facts">
            <dt>Role</dt><dd>{e.role}, invited by {person(state.brand, e.invitedBy)}</dd>
            <dt>May</dt><dd>Read the brand's material and propose changes to it</dd>
            <dt>May not</dt><dd>Adopt, retire or publish anything. Those decisions stay with the people the company names.</dd>
            <dt>Access ends</dt><dd>{fmt(e.grant.expires)}</dd>
            <dt>Scope</dt><dd>{e.scope}</dd>
          </dl>
        </div>
        <div>
          <h2>Constraints</h2>
          <ul className="lb-list">{e.constraints.map(c => <li key={c}>{c}</li>)}</ul>
          <h3>Materials to start from</h3>
          <Cites ids={e.materials} items={items} setOpenId={setOpenId} />
          <h3>Kind of work</h3>
          <p>This is a creative investigation. Orientation is done; an audit of the whole brand and an execution plan are not, and finishing this does not finish them.</p>
        </div>
      </section>

      <section className="lb-section">
        <h2>Your other engagements</h2>
        <table className="lb-table">
          <thead><tr><th>Client</th><th>Role</th><th>Access</th><th></th></tr></thead>
          <tbody>
            <tr><td>Fernway</td><td>{e.role}</td><td>Until {fmt(e.grant.expires)}</td><td>Open now</td></tr>
            <tr><td>Brightloop</td><td>{engagements['eng-brightloop'].role}</td><td>Ended {fmt(engagements['eng-brightloop'].grant.revokedAt)}</td>
              <td><button className="lb-link" onClick={() => tryOpen('eng-brightloop')}>Try to open Brightloop</button></td></tr>
          </tbody>
        </table>
        <p className="lb-body">Each engagement opens its own partition of company storage. Fernway's search cannot reach Brightloop's files, even where both talk about paper-cut moons at bedtime. Your methods travel with you; their material does not.</p>
      </section>

      <section className="lb-section">
        <h2>Connections in this build</h2>
        <table className="lb-table">
          <thead><tr><th>Connection</th><th>State</th><th>Use</th></tr></thead>
          <tbody>{connections.map(c => <tr key={c.name}><td>{c.name}</td><td><span className={`lb-state lb-state-${c.state}`}>{c.state}</span></td><td>{c.note}</td></tr>)}</tbody>
        </table>
      </section>

      <div className="lb-actions">
        <button className="lb-primary" onClick={() => setStage('orient')}>Begin orientation</button>
        <button onClick={reset}>Reset engagement</button>
      </div>
    </article>
  );
}

function Nesting() {
  return (
    <div className="lb-nest" role="img" aria-label="The practitioner's workbench holds bounded engagements. Each engagement opens a scoped window into one company's living brand system, which the company owns.">
      <div className="lb-nest-box lb-nest-bench">
        <h3>Your workbench</h3>
        <p>Methods, preferences, engagement history. Yours; carried between clients.</p>
        <div className="lb-nest-row">
          <div className="lb-nest-box lb-nest-eng">
            <h3>Engagement: Fernway</h3>
            <p>Goals, role, grant, choices, brief. Ends; the package stays with Fernway.</p>
          </div>
          <div className="lb-nest-box lb-nest-eng is-closed">
            <h3>Engagement: Brightloop</h3>
            <p>Ended. Access revoked.</p>
          </div>
        </div>
      </div>
      <div className="lb-nest-box lb-nest-co">
        <h3>Fernway's living brand system</h3>
        <p>Material, rules, claims, rights, decisions and the people with authority. Fernway's; persists after you leave.</p>
        <div className="lb-nest-row">
          <div className="lb-nest-box"><h3>Brand intelligence</h3><p>Retrieval, standing, tensions, proposals. Reads the system; changes nothing on its own.</p></div>
        </div>
      </div>
    </div>
  );
}

/* Orient ----------------------------------------------------------------- */
function Orient({ state, items, setOpenId, tensions }) {
  const o = orientation(state.brand, state.engagement, { asOf });
  const counts = tensions.reduce((a, t) => ({ ...a, [t.kind]: (a[t.kind] || 0) + 1 }), {});
  return (
    <article>
      <h1>Fernway wants to be the calm part of a family evening</h1>
      <p className="lb-deck">{o.intent.statement} That is the chief executive's statement from 2024, and the 2023 guidelines are built on it. The question for this engagement is whether the work and the offer still keep that promise.</p>
      <section className="lb-section">
        <h2>What holds</h2>
        <ul className="lb-findings">
          {o.strengths.map(s => <li key={s.statement}><p>{s.statement}</p><Cites ids={s.sources} items={items} setOpenId={setOpenId} /></li>)}
        </ul>
      </section>
      <section className="lb-section">
        <h2>What governs work now</h2>
        <ul className="lb-findings">
          {state.brand.rules.filter(r => !r.effective.to).map(r => (
            <li key={r.id}><p>{r.statement}</p><span className="lb-meta">{STANDING_CLASSES[r.standing].name}, owned by {person(state.brand, r.owner)}, since {fmt(r.effective.from)}</span> <Cite id={r.source} items={items} setOpenId={setOpenId} /></li>
          ))}
        </ul>
      </section>
      <section className="lb-section">
        <h2>What needs attention before anything is made</h2>
        <ul className="lb-list">{Object.entries(counts).map(([k, n]) => <li key={k}>{k}: {n}</li>)}</ul>
      </section>
      <section className="lb-section">
        <h2>How well the material is understood</h2>
        <ol className="lb-pipeline">
          {PIPELINE.map(p => <li key={p}><span className="lb-pipe-n">{o.stages[p] || 0}</span> {p}</li>)}
        </ol>
        <p className="lb-body">Found is not understood. A file counts as approved only once someone with authority has said so; nothing here was promoted by being extracted or reused.</p>
      </section>
    </article>
  );
}

/* Investigate ------------------------------------------------------------ */
function Investigate({ state, setOpenId }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => search(state, q, { channels: state.engagement.channels, asOf }), [state, q]);
  return (
    <article>
      <h1>The work itself</h1>
      <p className="lb-deck">Every piece keeps its brief, audience, canvas, dates, rights and standing. Search answers four separate questions for this project: is it relevant, authorized, reusable, authoritative.</p>
      <label className="lb-search">
        <span>Search Fernway's material</span>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="paper-cut bedtime" />
      </label>
      {q && !results.length && <p className="lb-body">Nothing in Fernway's material matches. Other clients' material is not searched.</p>}
      <ul className="lb-grid">
        {results.map(({ item, standing }) => (
          <li key={item.id}>
            <button className="lb-card" onClick={() => setOpenId(item.id)}>
              <Plate item={item} />
              <span className="lb-card-title">{item.title}</span>
              <span className="lb-card-ctx">{item.workType}, {item.period?.from?.slice(0, 4)}</span>
              <Answers st={standing} compact />
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Answers({ st, compact }) {
  const rows = [['relevant', 'Relevant'], ['authorized', 'Authorized'], ['reusable', 'Reusable here'], ['authoritative', 'Authoritative']];
  if (compact) return (
    <span className="lb-answers">{rows.map(([k, n]) => <span key={k} className={st[k] ? 'is-yes' : 'is-no'}>{n} {st[k] ? 'yes' : 'no'}</span>)}</span>
  );
  return (
    <dl className="lb-answers-full">
      {rows.map(([k, n]) => (
        <div key={k} className={st[k] ? 'is-yes' : 'is-no'}><dt>{n}: {st[k] ? 'yes' : 'no'}</dt><dd>{st.reasons[k].join(' ')}</dd></div>
      ))}
    </dl>
  );
}

function Drawer({ item, state, items, act, setOpenId, canPropose }) {
  const st = assessStanding(item, { channels: state.engagement.channels, asOf, until: state.engagement.newBrief.until });
  const [to, setTo] = useState('canon');
  const [why, setWhy] = useState('');
  const [ev, setEv] = useState([]);
  const allEvidence = state.brand.items.flatMap(i => (i.evidence || []).map(e => ({ ...e, on: i.id })));
  const evidenceTypes = [['intended', 'Intended impact'], ['observed', 'Observed outcome'], ['contribution', 'This element\'s contribution'], ['transfer', 'Transfer to other situations']];
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpenId]);
  return (
    <div className="lb-drawer-wrap" onClick={e => e.target === e.currentTarget && setOpenId(null)}>
      <aside className="lb-drawer" aria-label={item.title}>
        <button className="lb-close" onClick={() => setOpenId(null)}>Close</button>
        <Plate item={item} large />
        <h2>{item.title}</h2>
        <p className="lb-body">{item.rationale || 'No rationale recorded.'}</p>
        <dl className="lb-facts">
          <dt>Work type</dt><dd>{item.workType}</dd>
          <dt>Element</dt><dd>{item.element}</dd>
          <dt>Canvas</dt><dd>{item.canvas}</dd>
          <dt>Audience</dt><dd>{item.audience}</dd>
          <dt>Meant to</dt><dd>{item.intendedOutcome}</dd>
          <dt>Level</dt><dd>{item.level}</dd>
          <dt>Dates</dt><dd>{fmt(item.period?.from)}{item.period?.to ? ` to ${fmt(item.period.to)}` : ''}</dd>
          <dt>Exposure</dt><dd>{item.exposure}</dd>
          <dt>Made by</dt><dd>{item.made?.by}</dd>
          <dt>Found in</dt><dd>{item.provenance?.source}{item.provenance?.origin === 'generated' ? '. Written by a model.' : ''}{item.provenance?.confidential ? '. Confidential.' : ''}</dd>
        </dl>

        <h3>For this project</h3>
        <Answers st={st} />

        <h3>Standing</h3>
        <p className="lb-body"><strong>{STANDING_CLASSES[item.standing].name}.</strong> {STANDING_CLASSES[item.standing].job}
          {item.standingRecord && ` Set by ${person(state.brand, item.standingRecord.by)} on ${fmt(item.standingRecord.date)}: ${item.standingRecord.scope}.`}</p>
        {item.standingHistory?.length > 0 && <p className="lb-body">Before: {item.standingHistory.map(h => `${STANDING_CLASSES[h.standing].name} until ${fmt(h.until)}`).join('; ')}.</p>}
        <ol className="lb-pipeline lb-pipeline-item">
          {PIPELINE.map(p => <li key={p} className={PIPELINE.indexOf(p) <= PIPELINE.indexOf(item.pipeline) ? 'is-reached' : ''}>{p}</li>)}
        </ol>

        <h3>Evidence</h3>
        {evidenceTypes.map(([k, n]) => {
          const list = (item.evidence || []).filter(e => e.type === k);
          return <div key={k} className="lb-ev"><h4>{n}</h4>{list.length ? <ul>{list.map(e => <li key={e.id}>{e.statement} <span className="lb-meta">{e.basis}</span></li>)}</ul> : <p className="lb-missing">None recorded.</p>}</div>;
        })}

        <h3>Rights</h3>
        <p className="lb-body"><strong>{item.rights?.status}.</strong> {item.rights?.note || ''} {item.rights?.holder ? `Holder: ${item.rights.holder}.` : ''}</p>

        {item.relations?.length > 0 && (<><h3>Related</h3>
          <ul className="lb-list">{item.relations.map(r => <li key={r.type + r.to}>{r.type} <Cite id={r.to} items={items} setOpenId={setOpenId} /></li>)}</ul></>)}

        {item.reuse?.length > 0 && (<><h3>Reused</h3>
          <ul className="lb-list">{item.reuse.map((r, k) => <li key={k}>{r.where}, {fmt(r.date)}</li>)}</ul></>)}

        {canPropose && (
          <form className="lb-form" onSubmit={e => { e.preventDefault(); act(s => propose(s, { itemId: item.id, to, rationale: why || 'No rationale given', evidenceIds: ev, by: 'practitioner', scope: 'As proposed', asOf }), `Proposal sent to ${(state.brand.authority[`standing.${item.domain}`] || []).map(p => person(state.brand, p)).join(' or ')}. Nothing has changed yet.`); setWhy(''); setEv([]); }}>
            <h3>Propose a change of standing</h3>
            <label>New standing
              <select value={to} onChange={e => setTo(e.target.value)}>{Object.entries(STANDING_CLASSES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            </label>
            <label>Why
              <textarea value={why} onChange={e => setWhy(e.target.value)} rows={2} />
            </label>
            <fieldset><legend>Evidence to attach</legend>
              {allEvidence.filter(e => e.type !== 'intended').map(e => (
                <label key={e.id} className="lb-check"><input type="checkbox" checked={ev.includes(e.id)} onChange={x => setEv(x.target.checked ? [...ev, e.id] : ev.filter(i => i !== e.id))} />{e.statement}</label>
              ))}
            </fieldset>
            <div className="lb-actions">
              <button className="lb-primary" type="submit">Send proposal</button>
              <button type="button" onClick={() => act(s => recordReuse(s, item.id, { where: 'Return season sketch', asOf }), 'Reuse recorded. Standing is unchanged: reuse does not confer authority.')}>Record a reuse</button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

/* Interpret -------------------------------------------------------------- */
const FIELD_NAMES = { goal: 'Goal', audience: 'Audience', channels: 'Channels', message: 'Message', measure: 'Measure', until: 'Runs until' };
const CHANNEL_NAMES = { 'paid-media': 'paid media', 'owned-social': 'owned social', 'owned-web': 'owned web', email: 'email' };
const show = v => v == null ? 'Not set' : Array.isArray(v) ? v.map(c => CHANNEL_NAMES[c] || c).join(', ') : /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmt(v) : String(v);
function Interpret({ state, items, setOpenId, tensions }) {
  const cf = carryForward(state.brand, 'fw-small-hours-brief', state.engagement.newBrief, { asOf });
  const hyps = organizationalHypotheses(state.brand);
  const groups = tensions.reduce((a, t) => ({ ...a, [t.kind]: [...(a[t.kind] || []), t] }), {});
  return (
    <article>
      <h1>Last year's campaign worked for strangers. This year's audience already left.</h1>
      <p className="lb-deck">Small Hours was built to introduce Fernway. The return season has to bring back people who know it and chose to go. Some of it carries forward; some of it has to be turned around.</p>

      <section className="lb-section">
        <h2>What carries forward from Small Hours</h2>
        <table className="lb-table lb-carry">
          <thead><tr><th>Brief</th><th>2025</th><th>Return season</th></tr></thead>
          <tbody>{cf.changes.map(c => <tr key={c.field}><td>{FIELD_NAMES[c.field] || c.field}</td><td>{show(c.before)}</td><td>{show(c.after)}</td></tr>)}</tbody>
        </table>
        <ul className="lb-carry-rows">
          {cf.rows.map(r => (
            <li key={r.item.id} className={`lb-verdict-${r.verdict}`}>
              <button className="lb-carry-plate" onClick={() => setOpenId(r.item.id)}><Plate item={r.item} /></button>
              <div>
                <h3>{r.verdictName}: {r.item.title}</h3>
                <p>{r.why}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="lb-body">{cf.evidenceNote}</p>
      </section>

      <section className="lb-section">
        <h2>Beyond the campaign</h2>
        {hyps.map(h => (
          <div key={h.id} className="lb-hyp">
            <h3>{h.title}</h3>
            <p>{h.statement}</p>
            <ul className="lb-list">{h.evidence.map(e => <li key={e.id}>{e.statement} <Cite id={e.item} items={items} setOpenId={setOpenId} /></li>)}</ul>
            <p><strong>Uncertain because</strong> {h.uncertainty}</p>
            <p><strong>Could be tested by</strong> {h.test.charAt(0).toLowerCase() + h.test.slice(1)}</p>
            <p><strong>Decided by</strong> {person(state.brand, h.owner)}. A recommendation from this engagement is not authority to act.</p>
          </div>
        ))}
      </section>

      <section className="lb-section">
        <h2>Tensions in the material</h2>
        {Object.entries(groups).map(([kind, list]) => (
          <div key={kind} className="lb-tension-group">
            <h3>{kind}</h3>
            <ul className="lb-findings">
              {list.map(t => <li key={t.id}><p><strong>{t.title}.</strong> {t.detail}</p><Cites ids={t.sources} items={items} setOpenId={setOpenId} />{t.owners && <span className="lb-meta"> Resolved by {t.owners.map(o => person(state.brand, o)).join(' or ')}</span>}</li>)}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}

/* Choose ----------------------------------------------------------------- */
const SUGGESTED = [
  { subject: 'Paper-cut visual language', verdict: 'preserve', rationale: 'Lapsed parents recognise it; it signals the calm Fernway they remember. Conditional on extending the illustration licence to owned channels.', sources: ['fw-small-hours-hero', 'fw-interviews-2026'], needs: 'rights' },
  { subject: 'Three-note chime', verdict: 'preserve', rationale: 'Canon, cleared everywhere, and the most remembered element.', sources: ['fw-sound-logo'] },
  { subject: 'Copy strategy', verdict: 'evolve', rationale: 'From "Discover the small hours" to returning to a routine the family already had.', sources: ['fw-small-hours-film', 'fw-interviews-2026'] },
  { subject: '"Ad-free, always" and "Screen-free bedtime"', verdict: 'repair', rationale: 'Both are untrue since April and July. Replace with a plain statement of what each plan includes.', sources: ['fw-small-hours-endcard', 'fw-website-home', 'fw-pricing-2026'], needs: 'claims' },
  { subject: 'Reactivation offer before the campaign', verdict: 'invent', rationale: 'Price was the reason most often given for leaving. Test an offer on a held-out group so the campaign\'s effect can be read separately.', sources: ['fw-interviews-2026', 'fw-pricing-2026'], needs: 'offer' },
  { subject: 'Hero screens in lifecycle email', verdict: 'investigate', rationale: 'Two rules in force disagree for customer campaigns. Ask the owners to scope them before email design starts.', sources: ['fw-guidelines-v3', 'fw-pm-playbook-2025'], needs: 'standing.visual' },
];

function Choose({ state, items, act, setOpenId }) {
  const [form, setForm] = useState({ subject: '', verdict: 'preserve', rationale: '' });
  const recorded = new Set(state.choices.map(c => c.subject));
  return (
    <article>
      <h1>Choose what to keep, repair, change and invent</h1>
      <p className="lb-deck">A choice is a record of this engagement's judgment. Where it needs someone else's authority, it is routed to them and waits.</p>

      <section className="lb-section">
        <h2>Drawn from the interpretation</h2>
        <ul className="lb-findings">
          {SUGGESTED.map(c => (
            <li key={c.subject}>
              <p><strong>{CHOICES[c.verdict]}: {c.subject}.</strong> {c.rationale}</p>
              <Cites ids={c.sources} items={items} setOpenId={setOpenId} />
              <div className="lb-actions">
                {recorded.has(c.subject)
                  ? <span className="lb-meta">Recorded</span>
                  : <button onClick={() => act(s => recordChoice(s, { ...c, by: 'practitioner', asOf }), c.needs ? `Recorded and sent to ${person(state.brand, state.brand.authority[c.needs][0])}.` : 'Recorded.')}>Record this choice</button>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form className="lb-form lb-section" onSubmit={e => { e.preventDefault(); if (!form.subject) return; act(s => recordChoice(s, { ...form, by: 'practitioner', asOf }), 'Recorded.'); setForm({ subject: '', verdict: 'preserve', rationale: '' }); }}>
        <h2>Record your own</h2>
        <label>Subject<input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></label>
        <label>Choice<select value={form.verdict} onChange={e => setForm({ ...form, verdict: e.target.value })}>{Object.entries(CHOICES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>Reason<textarea rows={2} value={form.rationale} onChange={e => setForm({ ...form, rationale: e.target.value })} /></label>
        <div className="lb-actions"><button className="lb-primary" type="submit">Record</button></div>
      </form>

      <section className="lb-section">
        <h2>Recorded</h2>
        {state.choices.length ? (
          <table className="lb-table">
            <thead><tr><th>Choice</th><th>Subject</th><th>Status</th></tr></thead>
            <tbody>{state.choices.map(c => <tr key={c.id}><td>{CHOICES[c.verdict]}</td><td>{c.subject}</td><td>{c.status}{c.owner ? `, ${person(state.brand, c.owner)}` : ''}</td></tr>)}</tbody>
          </table>
        ) : <p className="lb-missing">Nothing recorded yet.</p>}
      </section>

      <section className="lb-section">
        <h2>Proposals to the brand</h2>
        <Proposals state={state} items={items} setOpenId={setOpenId} />
        <p className="lb-body">Open any piece of work to propose a change to its standing.</p>
      </section>
    </article>
  );
}

function Proposals({ state, items, setOpenId, actions }) {
  if (!state.proposals.length) return <p className="lb-missing">No proposals.</p>;
  return (
    <ul className="lb-findings">
      {state.proposals.map(p => (
        <li key={p.id}>
          <p><strong><Cite id={p.itemId} items={items} setOpenId={setOpenId} />: {STANDING_CLASSES[p.from].name} to {STANDING_CLASSES[p.to].name}.</strong> {p.rationale}</p>
          <p className="lb-meta">Proposed by {person(state.brand, p.by)} on {fmt(p.date)}. {p.status === 'open' ? `Waiting for ${p.reviewer.map(r => person(state.brand, r)).join(' or ')}.` : `Status: ${p.status}.`}</p>
          {p.evidenceIds.length > 0 && <ul className="lb-list">{state.brand.items.flatMap(i => i.evidence || []).filter(e => p.evidenceIds.includes(e.id)).map(e => <li key={e.id}>{e.statement} <span className="lb-meta">{e.basis}</span></li>)}</ul>}
          {p.warnings.length > 0 && <ul className="lb-warnings">{p.warnings.map(w => <li key={w}>{w}</li>)}</ul>}
          {actions && p.status === 'open' && actions(p)}
        </li>
      ))}
    </ul>
  );
}

/* Organize --------------------------------------------------------------- */
function Organize({ state, items, setOpenId, pkg, setPkg, setNotice }) {
  const brief = buildBrief(state.brand, state.engagement, state.choices, { asOf });
  const issue = () => {
    try { setPkg(buildContextPackage(state, { partner: { id: 'lp-agent', name: 'Landing page agent, external' }, assignment: 'Return-season landing page', channels: ['owned-web'], workTypes: ['Customer campaign'], powers: ['read'], expires: '2026-12-31', asOf })); setNotice({ kind: 'ok', text: 'Context package issued. Switch the viewer to the landing page agent to see what it receives.' }); }
    catch (e) { setNotice({ kind: 'refused', text: e.message }); }
  };
  return (
    <article>
      <h1>{brief.title}: the brief</h1>
      <p className="lb-deck">{brief.objective} For {brief.audience.toLowerCase()}.</p>

      <section className="lb-section">
        <h2>How it will be judged, decided now</h2>
        <table className="lb-table">
          <thead><tr><th>Outcome</th><th>Measure</th><th>Compared with</th><th>Limit</th></tr></thead>
          <tbody>{brief.evaluation.map(e => <tr key={e.outcome}><td>{e.outcome}</td><td>{e.measure}</td><td>{e.baseline}</td><td>{e.limit}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="lb-section">
        <h2>Choices it carries</h2>
        {brief.decisions.length ? <ul className="lb-list">{brief.decisions.map(d => <li key={d.subject}><strong>{CHOICES[d.verdict]}: {d.subject}.</strong> {d.rationale} {d.status !== 'recorded' && <em>({d.status})</em>}</li>)}</ul>
          : <p className="lb-missing">No choices recorded yet. Record them in Choose.</p>}
      </section>

      <section className="lb-section">
        <h2>Rules that apply</h2>
        <ul className="lb-list">{brief.rules.map(r => <li key={r.id}>{r.statement} <span className="lb-meta">{STANDING_CLASSES[r.standing].name}</span></li>)}</ul>
      </section>

      <section className="lb-section">
        <h2>Sources, frozen on {fmt(brief.frozenAt)}</h2>
        <table className="lb-table">
          <thead><tr><th>Source</th><th>Standing</th><th>Stage</th><th>Fingerprint</th></tr></thead>
          <tbody>{brief.snapshot.map(s => <tr key={s.id}><td><Cite id={s.id} items={items} setOpenId={setOpenId} /></td><td>{STANDING_CLASSES[s.standing].name}</td><td>{s.pipeline}</td><td><code>{s.fingerprint}</code></td></tr>)}</tbody>
        </table>
      </section>

      <section className="lb-section">
        <h2>Collaborators</h2>
        <p className="lb-body">A landing page agent needs the rules and cleared material, not the research or the strategy. Its package is read-only, expires on 31 December 2026, and can be revoked.</p>
        <div className="lb-actions">
          {!pkg && <button className="lb-primary" onClick={issue}>Issue a context package</button>}
          {pkg && !pkg.revokedAt && <button onClick={() => { setPkg(revokePackage(pkg, asOf)); setNotice({ kind: 'ok', text: 'Package revoked.' }); }}>Revoke the package</button>}
          {pkg?.revokedAt && <button onClick={issue}>Issue a new package</button>}
        </div>
        {pkg && <PackageSummary pkg={pkg} />}
      </section>
    </article>
  );
}

function PackageSummary({ pkg }) {
  return (
    <div className="lb-two">
      <div><h3>Included ({pkg.included.length})</h3><ul className="lb-list">{pkg.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></div>
      <div><h3>Withheld ({pkg.withheld.length})</h3><ul className="lb-list">{pkg.withheld.map(i => <li key={i.id}>{i.title}: {i.reasons[0]}</li>)}</ul></div>
    </div>
  );
}

/* Transfer --------------------------------------------------------------- */
function Transfer({ state }) {
  const brief = buildBrief(state.brand, state.engagement, state.choices, { asOf });
  const handoff = buildHandoff(state, { brief, asOf });
  const bench = exportWorkbench(practitioner);
  const download = (name, data) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <article>
      <h1>Leave Fernway more capable than you found it</h1>
      <p className="lb-deck">The engagement package belongs to Fernway. It keeps the sources with their provenance, the interpretation, every choice and proposal, and the questions still open, so the next person starts here instead of from the archive.</p>
      <section className="lb-section lb-two">
        <div>
          <h2>Fernway keeps</h2>
          <ul className="lb-list">
            <li>{handoff.sources.length} sources with provenance, stage, rights and fingerprint</li>
            <li>{handoff.choices.length} choices and {handoff.proposals.length} proposals, with who decides each</li>
            <li>{handoff.openTensions.length} tensions not yet resolved</li>
            <li>The brief, with its evaluation set before the work</li>
          </ul>
          <h3>Still open</h3>
          <ul className="lb-list">{handoff.openQuestions.map(q => <li key={q}>{q}</li>)}</ul>
          <h3>Not done by this engagement</h3>
          <p className="lb-body">{handoff.notCompleted.join(', ')}. Orientation is complete; the rest are separate pieces of work.</p>
          <div className="lb-actions"><button className="lb-primary" onClick={() => download('fernway-return-season-package.json', handoff)}>Download the engagement package</button></div>
        </div>
        <div>
          <h2>You keep</h2>
          <ul className="lb-list">{bench.methods.map(m => <li key={m}>{m}</li>)}</ul>
          <p className="lb-body">Your methods and preferences, and a record that the engagements happened. No Fernway material leaves with you.</p>
          <div className="lb-actions"><button onClick={() => download('workbench.json', bench)}>Download your workbench</button></div>
        </div>
      </section>
    </article>
  );
}

/* Other viewers ---------------------------------------------------------- */
function Steward({ state, items, act, setOpenId }) {
  const canon = state.brand.items.filter(i => i.standing === 'canon');
  const reused = state.brand.items.filter(i => (i.reuse?.length || 0) >= 3 && i.standing !== 'canon');
  return (
    <article>
      <h1>Proposals waiting for you</h1>
      <p className="lb-deck">You decide visual, verbal and sonic standing for Fernway. Each decision keeps its evidence, scope, date and what it replaced.</p>
      <section className="lb-section">
        <Proposals state={state} items={items} setOpenId={setOpenId} actions={p => (
          <div className="lb-actions">
            <button className="lb-primary" onClick={() => act(s => decide(s, p.id, { by: 'priya', outcome: 'adopt', note: 'Adopted', asOf }), 'Adopted. The previous standing is kept in the record.')}>Adopt</button>
            <button onClick={() => act(s => decide(s, p.id, { by: 'priya', outcome: 'revise', note: 'Needs a narrower scope', asOf }), 'Sent back for revision.')}>Ask for revision</button>
            <button onClick={() => act(s => decide(s, p.id, { by: 'priya', outcome: 'reject', note: 'Rejected', asOf }), 'Rejected. The proposal stays on record.')}>Reject</button>
          </div>
        )} />
      </section>
      {reused.length > 0 && (
        <section className="lb-section">
          <h2>Reused often, never reviewed</h2>
          <ul className="lb-findings">{reused.map(i => <li key={i.id}><p><Cite id={i.id} items={items} setOpenId={setOpenId} /> has been reused {i.reuse.length} times and is still {STANDING_CLASSES[i.standing].name.toLowerCase()}. Frequency is a reason to look, not a reason to adopt.</p></li>)}</ul>
        </section>
      )}
      <section className="lb-section">
        <h2>Canon in force</h2>
        <ul className="lb-findings">{canon.map(i => <li key={i.id}><p><Cite id={i.id} items={items} setOpenId={setOpenId} />, since {fmt(i.standingRecord?.date)}</p>
          <div className="lb-actions"><button onClick={() => act(s => retire(s, i.id, { by: 'priya', reason: 'Retired in review', asOf }), 'Retired to the learning archive. Its history is kept.')}>Retire</button></div></li>)}</ul>
      </section>
    </article>
  );
}

function Executive({ state, items, setOpenId, act }) {
  const mine = state.choices.filter(c => c.owner === 'tom');
  const hyps = organizationalHypotheses(state.brand);
  const ordered = viewFor('executive', state.brand).filter(i => i.level === 'company');
  return (
    <article>
      <h1>One decision is yours: whether to test an offer before the campaign</h1>
      <p className="lb-deck">The return season can bring lapsed families back. Whether they stay depends partly on price, which a campaign cannot change.</p>
      <section className="lb-section">
        <h2>Routed to you</h2>
        {mine.length ? <ul className="lb-findings">{mine.map(c => <li key={c.id}><p><strong>{c.subject}.</strong> {c.rationale}</p><Cites ids={c.sources} items={items} setOpenId={setOpenId} /></li>)}</ul>
          : <p className="lb-missing">Nothing routed yet. The creative director has not recorded the offer choice.</p>}
      </section>
      {hyps.map(h => (
        <section key={h.id} className="lb-section lb-hyp">
          <h2>{h.title}</h2>
          <p>{h.statement}</p>
          <p><strong>Uncertain because</strong> {h.uncertainty}</p>
          <p><strong>Decided by</strong> {person(state.brand, h.owner)}</p>
        </section>
      ))}
      <section className="lb-section">
        <h2>Company-level material</h2>
        <ul className="lb-list">{ordered.map(i => <li key={i.id}><Cite id={i.id} items={items} setOpenId={setOpenId} /></li>)}</ul>
      </section>
      <section className="lb-section">
        <h2>What you cannot decide here</h2>
        <p className="lb-body">Visual canon belongs to Priya Raman. Trying anyway is refused and the refusal is shown, not hidden.</p>
        {state.proposals.filter(p => p.status === 'open').slice(0, 1).map(p => (
          <div className="lb-actions" key={p.id}><button onClick={() => act(s => decide(s, p.id, { by: 'tom', outcome: 'adopt', asOf }))}>Adopt {items[p.itemId].title} as canon</button></div>
        ))}
      </section>
    </article>
  );
}

function Partner({ pkg, setOpenId }) {
  void setOpenId;
  if (!pkg) return (<article><h1>No context package has been issued to you</h1><p className="lb-deck">Fernway's material is reachable only through a package the engagement issues. Switch back to the creative director and issue one in Organize.</p></article>);
  if (!packageValid(pkg, asOf)) return (<article><h1>Your access to Fernway was revoked</h1><p className="lb-deck">Revoked on {fmt(pkg.revokedAt)}. Nothing from the package remains readable here.</p></article>);
  return (
    <article>
      <h1>{pkg.assignment}</h1>
      <p className="lb-deck">For {pkg.brand}. You may read what is below. You may not publish or change the brand's knowledge; work returns to {pkg.review.reviewer} for review. Access ends {fmt(pkg.expires)}.</p>
      <section className="lb-section"><h2>Rules</h2><ul className="lb-list">{pkg.rules.map(r => <li key={r.id}>{r.statement}</li>)}</ul></section>
      <section className="lb-section"><h2>Material you may use</h2><ul className="lb-list">{pkg.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></section>
      <section className="lb-section"><h2>Unresolved, ask before relying on</h2><ul className="lb-list">{pkg.open.map(o => <li key={o.title}>{o.title}. Ask {o.ask}.</li>)}</ul></section>
      <section className="lb-section"><h2>Not shared with you</h2><p className="lb-body">{pkg.withheld.length} items, including research and strategy, are withheld. Their titles are not listed here.</p></section>
    </article>
  );
}

function Agency() {
  const view = coordinationView(agency.engagements);
  return (
    <article>
      <h1>Two clients, one calendar, no shared knowledge</h1>
      <p className="lb-deck">Northbound Studio works for two competing streaming services. Across clients the lead sees dates and people. Strategy, briefs and files stay inside each client's workspace.</p>
      <section className="lb-section">
        <table className="lb-table">
          <thead><tr><th>Client</th><th>Milestones</th><th>People</th></tr></thead>
          <tbody>{view.map(v => <tr key={v.client}><td>{v.client}</td><td>{v.milestones.map(m => `${m.label}, ${fmt(m.date)}`).join('; ')}</td><td>{v.people.join(', ')}</td></tr>)}</tbody>
        </table>
        <p className="lb-body">The Lead designer appears on both. That is a capacity question the lead can see and act on without either client's plans being visible to the other.</p>
      </section>
    </article>
  );
}
