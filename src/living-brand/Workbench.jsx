import { useEffect, useMemo, useRef, useState } from 'react';
import {
  startEngagement, openTenant, search, assessStanding, findTensions, carryForward, changeLedger, organizationalHypotheses,
  propose, decide, retire, recordReuse, recordChoice, verifyItem, approveItem, nameAuthority, viewFor, buildBrief, buildContextPackage,
  revokePackage, packageValid, buildHandoff, toPacket, coordinationView, exportWorkbench, orientation, canDecide, powerFor,
  deciders, effectiveRules, fingerprint, isPublicStudy, pipelineRank, STANDING_CLASSES, PIPELINE, CHOICES, POWERS, BASES,
} from './domain/index.js';
import Plate from './Plate.jsx';

// One workbench, any brand. The catalog says which engagements can be opened;
// each opens only its own brand partition.
const STORE = 'living-brand-state-v3';
const PLACE_KEY = 'living-brand-place-v3';

const STAGES = [
  ['enter', 'Enter'], ['orient', 'Orient'], ['investigate', 'Investigate'], ['interpret', 'Interpret'],
  ['choose', 'Choose'], ['organize', 'Organize'], ['transfer', 'Transfer'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmt = d => {
  if (!d) return 'Unknown';
  const [y, m, day] = String(d).split('-').map(Number);
  if (!m) return String(y);
  if (!day) return `${MONTHS[m - 1]} ${y}`;
  return `${day} ${MONTHS[m - 1]} ${y}`;
};
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const lower = s => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const person = (brand, id) => brand.people?.[id]?.name || (id === 'practitioner' ? 'The practitioner' : id === 'intake' ? 'the intake reading' : id);
const who = (brand, ids) => (ids?.length ? ids.map(id => person(brand, id)).join(' or ') : 'no one named');

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };

const begin = entry => ({ state: startEngagement({ [entry.brand.id]: entry.brand }, entry.engagement), pkg: null });

export default function Workbench({ catalog }) {
  const asOf = catalog.asOf;
  const place = read(PLACE_KEY) || {};
  const [engId, setEngId] = useState(catalog.open.some(e => e.engagement.id === place.engagement) ? place.engagement : catalog.open[0].engagement.id);
  const entry = catalog.open.find(e => e.engagement.id === engId);
  // Saved work is tied to the exact data it was made from, so corrected records never hide behind stale state.
  const storeKey = `${STORE}:${engId}:${fingerprint({ b: entry.brand, e: entry.engagement })}`;
  const [all, setAll] = useState(() => { const saved = read(storeKey); return saved?.state ? saved : begin(entry); });
  const [loadedKey, setLoadedKey] = useState(storeKey);
  if (loadedKey !== storeKey) { const saved = read(storeKey); setAll(saved?.state ? saved : begin(entry)); setLoadedKey(storeKey); }
  const { state, pkg } = all;

  const [viewer, setViewer] = useState(place.viewer || 'practitioner');
  const [stage, setStage] = useState(STAGES.some(s => s[0] === place.stage) ? place.stage : 'enter');
  const [openId, setOpenId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => { if (loadedKey === storeKey) write(storeKey, { state, pkg }); }, [state, pkg, storeKey, loadedKey]);
  useEffect(() => { write(PLACE_KEY, { engagement: engId, viewer, stage }); }, [engId, viewer, stage]);

  const brand = state.brand;
  const actor = state.engagement.actor || 'practitioner';
  const holders = useMemo(() => [...new Set(Object.values(brand.authority || {}).flat())].filter(id => id !== actor), [brand, actor]);
  const viewers = [
    ['practitioner', state.engagement.practitioner || 'The practitioner'],
    ...holders.map(id => [`person:${id}`, `${person(brand, id)}${brand.people?.[id]?.title ? `, ${lower(brand.people[id].title)}` : ''}`]),
    ...(state.engagement.partner ? [['partner', state.engagement.partner.name]] : []),
    ...(catalog.agency ? [['agency', `Agency lead, ${catalog.agency.name}`]] : []),
  ];
  const view = viewers.some(v => v[0] === viewer) ? viewer : 'practitioner';

  const act = (fn, ok) => {
    try { const next = fn(state); setAll(a => ({ ...a, state: next })); const text = typeof ok === 'function' ? ok(next) : ok; setNotice(text ? { kind: 'ok', text } : null); return true; }
    catch (e) { setNotice({ kind: 'refused', text: e.message }); return false; }
  };
  const setPkg = p => setAll(a => ({ ...a, pkg: p }));
  const reset = () => { setAll(begin(entry)); setNotice({ kind: 'ok', text: 'Engagement reset to its starting material.' }); };
  const switchTo = id => { setEngId(id); setOpenId(null); setNotice(null); setViewer('practitioner'); setStage('enter'); window.scrollTo(0, 0); };

  const items = useMemo(() => Object.fromEntries(brand.items.map(i => [i.id, i])), [brand]);
  const tensions = useMemo(() => findTensions(brand, { asOf, workTypes: state.engagement.workTypes || [], channels: state.engagement.channels || [] }), [brand, state.engagement, asOf]);
  const open = openId ? items[openId] : null;
  const go = k => { setStage(k); window.scrollTo(0, 0); };
  const ctx = { catalog, asOf, state, brand, items, tensions, act, actor, setOpenId, go, pkg, setPkg, setNotice, switchTo };

  return (
    <div className="lb">
      <header className="lb-top">
        {catalog.homeHref === null
          ? <span className="lb-home lb-home-plain">{catalog.homeLabel}</span>
          : <a className="lb-home" href={catalog.homeHref || '/'}>{catalog.homeLabel || 'Field of Action'}</a>}
        <div className="lb-controls">
          {catalog.open.length > 1 && (
            <label className="lb-viewer">
              <span>Engagement</span>
              <select value={engId} onChange={e => switchTo(e.target.value)}>
                {catalog.open.map(e => <option key={e.engagement.id} value={e.engagement.id}>{e.brand.name}: {e.engagement.project}</option>)}
              </select>
            </label>
          )}
          {viewers.length > 1 && (
            <label className="lb-viewer">
              <span>Viewing as</span>
              <select value={view} onChange={e => { setViewer(e.target.value); setNotice(null); }}>
                {viewers.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
              </select>
            </label>
          )}
        </div>
      </header>

      {isPublicStudy(brand) && (
        <p className="lb-basis">An independent study of {brand.name} from public sources. {brand.name} did not take part and has not reviewed it. Nothing here is {brand.name}'s own record.</p>
      )}

      {notice && (
        <div className={`lb-notice lb-notice-${notice.kind}`} role="status">
          <p>{notice.kind === 'refused' ? `Refused: ${notice.text}` : notice.text}</p>
          <button onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      {view === 'practitioner' && (
        <div className="lb-shell">
          <nav className="lb-stages" aria-label="Engagement stages">
            {STAGES.map(([k, n]) => (
              <button key={k} className={stage === k ? 'is-on' : ''} aria-current={stage === k ? 'step' : undefined} onClick={() => go(k)}>{n}</button>
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
      {view.startsWith('person:') && <main className="lb-main lb-solo"><PersonView {...ctx} personId={view.slice(7)} /></main>}
      {view === 'partner' && <main className="lb-main lb-solo"><Partner {...ctx} /></main>}
      {view === 'agency' && <main className="lb-main lb-solo"><Agency {...ctx} /></main>}

      {open && <Drawer key={open.id} item={open} {...ctx} canWork={view === 'practitioner'} actingAs={view === 'practitioner' ? actor : view.startsWith('person:') ? view.slice(7) : null} />}
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
function Enter({ catalog, asOf, state, brand, items, act, actor, setOpenId, go, setNotice, switchTo, reset }) {
  const e = state.engagement;
  const study = isPublicStudy(brand);
  const canName = e.grant?.powers?.includes('steward');
  const [naming, setNaming] = useState({ power: '', name: '' });
  const tryOpen = closed => {
    try { openTenant({}, { ...closed, asOf }); setNotice({ kind: 'ok', text: 'Opened.' }); }
    catch (err) { setNotice({ kind: 'refused', text: err.message }); }
  };
  const areas = Object.entries(POWERS).filter(([power]) => power in (brand.authority || {}));
  const unnamed = areas.filter(([power]) => !brand.authority[power].length);
  const done = e.modesCompleted || [];
  return (
    <article>
      <h1>{e.project}</h1>
      <p className="lb-deck">{e.purpose}</p>

      <section className="lb-section">
        <h2>Where this engagement sits</h2>
        <Nesting catalog={catalog} brand={brand} engagement={e} />
      </section>

      <section className="lb-section lb-two">
        <div>
          <h2>Role and authority</h2>
          <dl className="lb-facts">
            <dt>Role</dt><dd>{e.role}{e.invitedBy ? `, invited by ${person(brand, e.invitedBy)}` : ''}</dd>
            <dt>Basis</dt><dd>{BASES[brand.basis || 'company-record'].name}. {BASES[brand.basis || 'company-record'].note}</dd>
            {study ? (<>
              <dt>May</dt><dd>Read public material and record a reading of it</dd>
              <dt>May not</dt><dd>Speak for {brand.name}, adopt or retire anything, or reuse its assets</dd>
              <dt>Access</dt><dd>None granted. Public sources, read on {fmt(e.started || asOf)}</dd>
            </>) : (<>
              <dt>May</dt><dd>{e.grant.powers.includes('steward') ? 'Read, propose, and name who decides' : e.grant.powers.includes('propose') ? 'Read the brand\'s material and propose changes to it' : 'Read the brand\'s material'}</dd>
              <dt>May not</dt><dd>Adopt, retire or publish anything except where named below. Those decisions stay with the people the company names.</dd>
              <dt>Access ends</dt><dd>{e.grant.expires ? fmt(e.grant.expires) : 'No end date set'}</dd>
            </>)}
            {e.scope && (<><dt>Scope</dt><dd>{e.scope}</dd></>)}
          </dl>
        </div>
        <div>
          {e.constraints?.length > 0 && (<><h2>Constraints</h2><ul className="lb-list">{e.constraints.map(c => <li key={c}>{c}</li>)}</ul></>)}
          {e.materials?.length > 0 && (<><h3>Material to start from</h3><Cites ids={e.materials} items={items} setOpenId={setOpenId} /></>)}
          <h3>Kind of work</h3>
          <p>{e.modeNote || `This is ${e.mode === 'audit' ? 'a brand audit' : e.mode === 'planning' ? 'execution planning' : e.mode === 'orientation' ? 'a rapid orientation' : 'a creative investigation'}. ${done.length ? `${cap(done.join(' and '))} is done. ` : ''}Finishing this does not finish the other kinds of work.`}</p>
        </div>
      </section>

      {areas.length > 0 && (
        <section className="lb-section">
          <h2>Who decides at {brand.name}</h2>
          <table className="lb-table">
            <thead><tr><th>Decision</th><th>Decided by</th></tr></thead>
            <tbody>{areas.map(([power, label]) => <tr key={power}><td>{cap(label)}</td><td>{who(brand, brand.authority[power])}</td></tr>)}</tbody>
          </table>
          {study && <p className="lb-body">A public-source study cannot establish any of this. It is the first thing to ask {brand.name}.</p>}
          {canName && unnamed.length > 0 && (
            <form className="lb-form lb-inline" onSubmit={ev => {
              ev.preventDefault();
              const name = naming.name.trim(); const power = naming.power || unnamed[0][0];
              if (!name) return;
              const existing = Object.entries(brand.people || {}).find(([, p]) => p.name.toLowerCase() === name.toLowerCase());
              const id = existing ? existing[0] : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              if (act(s => nameAuthority(s, { power, person: { id, name }, by: actor, asOf }), `${name} now decides ${POWERS[power]}.`)) setNaming({ power: '', name: '' });
            }}>
              <h3>Name who decides</h3>
              <label>Decision<select value={naming.power || unnamed[0][0]} onChange={ev => setNaming({ ...naming, power: ev.target.value })}>{unnamed.map(([power, label]) => <option key={power} value={power}>{cap(label)}</option>)}</select></label>
              <label>Person<input value={naming.name} onChange={ev => setNaming({ ...naming, name: ev.target.value })} /></label>
              <div className="lb-actions"><button className="lb-primary" type="submit">Name them</button></div>
            </form>
          )}
        </section>
      )}

      <section className="lb-section">
        <h2>Your engagements</h2>
        <table className="lb-table">
          <thead><tr><th>Client</th><th>Role</th><th>Access</th><th>Open</th></tr></thead>
          <tbody>
            {catalog.open.map(o => (
              <tr key={o.engagement.id}><td>{o.brand.name}</td><td>{o.engagement.role}</td>
                <td>{isPublicStudy(o.brand) ? 'Public sources only' : o.engagement.grant.expires ? `Until ${fmt(o.engagement.grant.expires)}` : 'Open'}</td>
                <td>{o.engagement.id === e.id ? 'Open now' : <button className="lb-link" onClick={() => switchTo(o.engagement.id)}>Open {o.brand.name}</button>}</td></tr>
            ))}
            {(catalog.closed || []).map(c => (
              <tr key={c.id}><td>{c.clientLabel}</td><td>{c.role}</td><td>Ended {fmt(c.grant.revokedAt)}</td>
                <td><button className="lb-link" onClick={() => tryOpen(c)}>Try to open {c.clientLabel}</button></td></tr>
            ))}
          </tbody>
        </table>
        <p className="lb-body">Each engagement opens its own partition. Searching one never reaches another, even where two clients use the same words. Your methods travel with you; their material does not.</p>
      </section>

      {catalog.connections?.length > 0 && (
        <section className="lb-section">
          <h2>Connections in this build</h2>
          <table className="lb-table">
            <thead><tr><th>Connection</th><th>State</th><th>Use</th></tr></thead>
            <tbody>{catalog.connections.map(c => <tr key={c.name}><td>{c.name}</td><td><span className={`lb-state lb-state-${c.state}`}>{c.state}</span></td><td>{c.note}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <div className="lb-actions">
        <button className="lb-primary" onClick={() => go('orient')}>Begin orientation</button>
        <button onClick={reset}>Reset engagement</button>
      </div>
    </article>
  );
}

function Nesting({ catalog, brand, engagement }) {
  const study = isPublicStudy(brand);
  const others = [...catalog.open.filter(o => o.engagement.id !== engagement.id).map(o => ({ name: o.brand.name, note: isPublicStudy(o.brand) ? 'A public-source study.' : 'A separate partition.', closed: false })),
    ...(catalog.closed || []).map(c => ({ name: c.clientLabel, note: 'Ended. Access revoked.', closed: true }))];
  return (
    <div className="lb-nest" role="img" aria-label={`The practitioner's workbench holds bounded engagements. This one opens a window onto ${brand.name}.`}>
      <div className="lb-nest-box lb-nest-bench">
        <h3>Your workbench</h3>
        <p>Methods, preferences, engagement history. Yours; carried between clients.</p>
        <div className="lb-nest-row">
          <div className="lb-nest-box lb-nest-eng">
            <h3>{study ? 'Study' : 'Engagement'}: {brand.name}</h3>
            <p>{study ? 'Your reading of public material, your choices and your questions. It stays with you.' : `Goals, role, grant, choices, brief. Ends; the package stays with ${brand.name}.`}</p>
          </div>
          {others.map(o => (
            <div key={o.name} className={`lb-nest-box lb-nest-eng${o.closed ? ' is-closed' : ''}`}><h3>{o.name}</h3><p>{o.note}</p></div>
          ))}
        </div>
      </div>
      <div className="lb-nest-box lb-nest-co">
        <h3>{study ? `${brand.name}, as the public can see it` : `${brand.name}'s living brand system`}</h3>
        <p>{study
          ? `What ${brand.name} has published and what others have reported. Its own records, rights and decision-makers are out of reach.`
          : `Material, rules, claims, rights, decisions and the people with authority. ${brand.name}'s; persists after you leave.`}</p>
        <div className="lb-nest-row">
          <div className="lb-nest-box"><h3>Brand intelligence</h3><p>Retrieval, standing, tensions, proposals. Reads the record; changes nothing on its own.</p></div>
        </div>
      </div>
    </div>
  );
}

/* Orient ----------------------------------------------------------------- */
function Orient({ asOf, state, brand, items, setOpenId, tensions, go }) {
  const o = orientation(brand, state.engagement, { asOf });
  const reading = state.engagement.reading?.orient || {};
  const urgent = tensions.filter(t => t.severity !== 'investigate' || t.kind === 'Unknown rights').slice(0, 5);
  const rules = effectiveRules(brand).filter(r => !r.effective?.to && r.standing !== 'archive');
  const canonRules = rules.filter(r => r.standing === 'canon');
  const otherRules = rules.filter(r => r.standing !== 'canon');
  return (
    <article>
      <h1>{reading.headline || `What ${brand.name} says it is for`}</h1>
      <p className="lb-deck">{reading.deck || o.intent?.statement}</p>
      {o.intent?.statement && reading.deck && (
        <section className="lb-section">
          <h2>Stated intent</h2>
          <p className="lb-body">{o.intent.statement}</p>
          {o.intent.source && <Cite id={o.intent.source} items={items} setOpenId={setOpenId} />}
        </section>
      )}
      {o.strengths.length > 0 && (
        <section className="lb-section">
          <h2>What holds</h2>
          <ul className="lb-findings">
            {o.strengths.map(s => <li key={s.statement}><p>{s.statement}</p><Cites ids={s.sources} items={items} setOpenId={setOpenId} /></li>)}
          </ul>
        </section>
      )}
      {canonRules.length > 0 && (
        <section className="lb-section">
          <h2>What governs work now</h2>
          <ul className="lb-findings">
            {canonRules.map(r => (
              <li key={r.id}><p>{r.statement}</p><span className="lb-meta">{STANDING_CLASSES[r.standing]?.name || cap(r.standing)}{r.owner ? `, owned by ${person(brand, r.owner)}` : ''}{r.effective?.from ? `, since ${fmt(r.effective.from)}` : ''}</span> <Cite id={r.source} items={items} setOpenId={setOpenId} /></li>
            ))}
          </ul>
        </section>
      )}
      {otherRules.length > 0 && (
        <section className="lb-section">
          <h2>{canonRules.length ? 'Written down, not adopted' : 'Nothing is canon yet. These rules are written down, not adopted'}</h2>
          <RuleGroups rules={otherRules} brand={brand} items={items} setOpenId={setOpenId} />
        </section>
      )}
      {urgent.length > 0 && (
        <section className="lb-section">
          <h2>What needs attention before anything is made</h2>
          <ul className="lb-findings">{urgent.map(t => <li key={t.id}><p><strong>{t.kind}.</strong> {t.title}.</p><Cites ids={t.sources} items={items} setOpenId={setOpenId} /></li>)}</ul>
          <div className="lb-actions"><button onClick={() => go('interpret')}>See all {tensions.length} tensions in Interpret</button></div>
        </section>
      )}
      {o.unknowns.length > 0 && (
        <section className="lb-section">
          <h2>What is not known</h2>
          <ul className="lb-list">{o.unknowns.map(u => <li key={u}>{u}</li>)}</ul>
        </section>
      )}
      <section className="lb-section">
        <h2>How well the material is understood</h2>
        <ol className="lb-pipeline">
          {PIPELINE.map(p => <li key={p}><span className="lb-pipe-n">{o.stages[p] || 0}</span> {p}</li>)}
        </ol>
        <p className="lb-body">Found is not understood. A record counts as verified only once someone has checked it against its source, and as approved only once someone with authority has said so. Nothing here was promoted by being extracted or reused.</p>
      </section>
    </article>
  );
}

// Rules grouped under the material that states them, so forty rules read as a handful of sources.
function RuleGroups({ rules, brand, items, setOpenId }) {
  const bySource = rules.reduce((a, r) => ({ ...a, [r.source]: [...(a[r.source] || []), r] }), {});
  return (
    <ul className="lb-findings">
      {Object.entries(bySource).map(([source, list]) => (
        <li key={source}>
          <p><strong><Cite id={source} items={items} setOpenId={setOpenId} /></strong> <span className="lb-meta">{STANDING_CLASSES[list[0].standing]?.name || cap(list[0].standing)}{items[source]?.provenance?.origin === 'generated' ? ', written by a model' : ''}{list[0].owner ? `; ${person(brand, list[0].owner)} decides` : ''}</span></p>
          <ul className="lb-list">{list.map(r => <li key={r.id}>{r.statement}</li>)}</ul>
        </li>
      ))}
    </ul>
  );
}

/* Investigate ------------------------------------------------------------ */
function Investigate({ asOf, state, brand, setOpenId }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => search(state, q, { channels: state.engagement.channels || [], asOf }), [state, q, asOf]);
  return (
    <article>
      <h1>The work itself</h1>
      <p className="lb-deck">Every piece keeps its purpose, audience, canvas, dates, rights and standing. Search answers four separate questions: is it relevant, authorized, reusable, authoritative.</p>
      <label className="lb-search">
        <span>Search {brand.name}'s material</span>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={state.engagement.searchHint || ''} />
      </label>
      {q && !results.length && <p className="lb-body">Nothing in {brand.name}'s material matches. Other clients' material is not searched.</p>}
      <ul className="lb-grid">
        {results.map(({ item, standing }) => (
          <li key={item.id}>
            <button className="lb-card" onClick={() => setOpenId(item.id)}>
              <Plate item={item} />
              <span className="lb-card-title">{item.title}</span>
              <span className="lb-card-ctx">{[item.workType, item.period?.from?.slice(0, 4)].filter(Boolean).join(', ')}</span>
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

const SOURCE_BASIS = {
  primary_read: 'read on the publisher\'s own page', search_excerpt: 'seen in a search excerpt of the page', third_party: 'reported by a third party',
  'recorded-by-practitioner': 'recorded by the practitioner', repo: 'from the company\'s own files',
};

function Drawer({ asOf, item, state, brand, items, act, actor, setOpenId, canWork, actingAs }) {
  const e = state.engagement;
  const st = assessStanding(item, { channels: e.channels || [], asOf, until: e.newBrief?.until });
  const [to, setTo] = useState(item.standing === 'canon' ? 'precedent' : 'canon');
  const [why, setWhy] = useState('');
  const [ev, setEv] = useState([]);
  const [where, setWhere] = useState('');
  const [how, setHow] = useState('');
  const closeRef = useRef(null);
  const allEvidence = brand.items.flatMap(i => (i.evidence || []).map(x => ({ ...x, on: i.id })));
  const evidenceTypes = [['intended', 'Intended impact'], ['observed', 'Observed outcome'], ['contribution', 'This element\'s contribution'], ['transfer', 'Transfer to other situations']];
  const reviewers = deciders(brand, powerFor(item)).map(p => p.name);
  const canVerify = canWork && item.pipeline !== 'discovered' && pipelineRank(item.pipeline) < pipelineRank('verified');
  const canApprove = actingAs && canDecide(brand, actingAs, powerFor(item)) && item.pipeline !== 'discovered' && !['approved', 'published'].includes(item.approval?.status);
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = k => k.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [setOpenId]);
  const facts = [
    ['Work type', item.workType], ['Element', item.element], ['Canvas', item.canvas], ['Audience', item.audience], ['Meant to', item.intendedOutcome],
    ['Level', cap(item.level)], ['Dates', item.period?.from ? `${fmt(item.period.from)}${item.period.to ? ` to ${fmt(item.period.to)}` : ''}` : null],
    ['Exposure', item.exposure], ['Made by', item.made?.by],
    ['Found in', item.provenance?.source ? `${item.provenance.source}${item.provenance.origin === 'generated' ? '. Written by a model.' : ''}${item.provenance.confidential ? '. Confidential.' : ''}` : null],
    ['Released', item.released && item.released !== 'public' ? cap(item.released) : null],
  ].filter(([, v]) => v);
  return (
    <div className="lb-drawer-wrap" onClick={x => x.target === x.currentTarget && setOpenId(null)}>
      <aside className="lb-drawer" role="dialog" aria-modal="true" aria-label={item.title} onKeyDown={k => {
        if (k.key !== 'Tab') return;
        const f = [...k.currentTarget.querySelectorAll('button, a[href], input, select, textarea')].filter(x => !x.disabled);
        if (!f.length) return;
        if (k.shiftKey && document.activeElement === f[0]) { k.preventDefault(); f.at(-1).focus(); }
        else if (!k.shiftKey && document.activeElement === f.at(-1)) { k.preventDefault(); f[0].focus(); }
      }}>
        <button className="lb-close" ref={closeRef} onClick={() => setOpenId(null)}>Close</button>
        <Plate item={item} large />
        <h2>{item.title}</h2>
        <p className="lb-body">{item.rationale || item.text || 'No rationale recorded.'}</p>
        <dl className="lb-facts">{facts.map(([k, v]) => <div key={k} className="lb-fact"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>

        <h3>For this project</h3>
        <Answers st={st} />

        <h3>Standing</h3>
        <p className="lb-body"><strong>{STANDING_CLASSES[item.standing].name}.</strong> {STANDING_CLASSES[item.standing].job}
          {item.standingRecord?.basis === 'reading' && ` This is a reading of public material${item.standingRecord.scope ? `: ${lower(item.standingRecord.scope)}` : ''}. It is not ${brand.name}'s own classification.`}
          {item.standingRecord && item.standingRecord.basis !== 'reading' && ` Set by ${person(brand, item.standingRecord.by)} on ${fmt(item.standingRecord.date)}${item.standingRecord.scope ? `: ${item.standingRecord.scope}` : ''}.`}</p>
        {item.readingWhy && <p className="lb-body">{item.readingWhy}</p>}
        {item.standingHistory?.length > 0 && <p className="lb-body">Before: {item.standingHistory.map(h => `${STANDING_CLASSES[h.standing].name} until ${fmt(h.until)}`).join('; ')}.</p>}
        <ol className="lb-pipeline lb-pipeline-item">
          {PIPELINE.map(p => <li key={p} className={PIPELINE.indexOf(p) <= PIPELINE.indexOf(item.pipeline) ? 'is-reached' : ''}>{p}</li>)}
        </ol>
        {item.verification && <p className="lb-body">Checked by {person(brand, item.verification.by)} on {fmt(item.verification.date)}: {item.verification.how}</p>}

        {item.sources?.length > 0 && (<>
          <h3>Sources</h3>
          <ul className="lb-list">{item.sources.map(s => (
            <li key={s.url}>{/^https?:/.test(s.url) ? <a href={s.url} target="_blank" rel="noreferrer noopener">{s.publisher || s.url}</a> : (s.publisher || s.url)}{s.date ? `, ${s.date}` : ''} <span className="lb-meta">{SOURCE_BASIS[s.basis] || s.basis}</span></li>
          ))}</ul>
        </>)}

        {canVerify && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => verifyItem(s, item.id, { by: actor, how, asOf }), 'Marked as checked against its source. That is not approval.')) setHow(''); }}>
            <label>What you checked it against
              <input value={how} onChange={x => setHow(x.target.value)} placeholder="Opened the source page today" />
            </label>
            <div className="lb-actions"><button type="submit">Mark as checked</button></div>
          </form>
        )}

        {canApprove && (
          <div className="lb-form">
            <p className="lb-body">You decide {POWERS[powerFor(item)]} at {brand.name}. Approving says this may be used. It does not make it canon.</p>
            <div className="lb-actions"><button className="lb-primary" onClick={() => act(s => approveItem(s, item.id, { by: actingAs, asOf }), 'Approved. Its standing is unchanged.')}>Approve this</button></div>
          </div>
        )}
        {item.approval?.status === 'approved' && <p className="lb-body">Approved by {person(brand, item.approval.by)} on {fmt(item.approval.date)}.</p>}

        <h3>Evidence</h3>
        {evidenceTypes.map(([k, n]) => {
          const list = (item.evidence || []).filter(x => x.type === k);
          return <div key={k} className="lb-ev"><h4>{n}</h4>{list.length ? <ul>{list.map(x => <li key={x.id}>{x.statement} <span className="lb-meta">{String(x.basis).replace(/_/g, ' ')}</span>{/^https?:/.test(x.url || '') && <> <a href={x.url} target="_blank" rel="noreferrer noopener">source</a></>}</li>)}</ul> : <p className="lb-missing">None recorded.</p>}</div>;
        })}

        <h3>Rights</h3>
        <p className="lb-body"><strong>{cap(item.rights?.status || 'unknown')}.</strong> {item.rights?.note || ''} {item.rights?.holder ? `Holder: ${item.rights.holder}.` : ''}</p>

        {item.relations?.length > 0 && (<><h3>Related</h3>
          <ul className="lb-list">{item.relations.map(r => <li key={r.type + r.to}>{cap(r.type)} <Cite id={r.to} items={items} setOpenId={setOpenId} /></li>)}</ul></>)}
        {item.supersededBy && <p className="lb-body">Replaced by <Cite id={item.supersededBy} items={items} setOpenId={setOpenId} />.</p>}

        {item.reuse?.length > 0 && (<><h3>Reused</h3>
          <ul className="lb-list">{item.reuse.map((r, k) => <li key={k}>{r.where}, {fmt(r.date)}</li>)}</ul></>)}

        {canWork && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => propose(s, { itemId: item.id, to, rationale: why || 'No rationale given', evidenceIds: ev, by: actor, scope: 'As proposed', asOf }), next => { const p = next.proposals.at(-1); return `Proposal recorded${p.reviewer.length ? ` for ${who(brand, p.reviewer)}` : ''}. Nothing has changed yet.${p.warnings.length ? ` Noted: ${p.warnings.join(' ')}` : ''}`; })) { setWhy(''); setEv([]); } }}>
            <h3>Propose a change of standing</h3>
            <p className="lb-body">{reviewers.length ? `Decided by ${reviewers.join(' or ')}.` : `No one is named to decide this at ${brand.name}. A proposal will wait.`}</p>
            <label>New standing
              <select value={to} onChange={x => setTo(x.target.value)}>{Object.entries(STANDING_CLASSES).filter(([k]) => k !== item.standing).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            </label>
            <label>Why
              <textarea value={why} onChange={x => setWhy(x.target.value)} rows={2} />
            </label>
            {allEvidence.some(x => x.type !== 'intended') && (
              <fieldset><legend>Evidence to attach</legend>
                {allEvidence.filter(x => x.type !== 'intended').map(x => (
                  <label key={x.id} className="lb-check"><input type="checkbox" checked={ev.includes(x.id)} onChange={c => setEv(c.target.checked ? [...ev, x.id] : ev.filter(i => i !== x.id))} />{x.statement}</label>
                ))}
              </fieldset>
            )}
            <div className="lb-actions"><button className="lb-primary" type="submit">Record proposal</button></div>
            <label>Reused where
              <input value={where} onChange={x => setWhere(x.target.value)} />
            </label>
            <div className="lb-actions">
              <button type="button" onClick={() => { if (act(s => recordReuse(s, item.id, { where, asOf }), 'Reuse recorded. Standing is unchanged: reuse does not confer authority.')) setWhere(''); }}>Record the reuse</button>
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

function Interpret({ asOf, state, brand, items, setOpenId, tensions }) {
  const e = state.engagement;
  const reading = e.reading?.interpret || {};
  const cf = carryForward(brand, e, { asOf });
  const ledger = changeLedger(brand, { asOf });
  const hyps = organizationalHypotheses(brand, e);
  const groups = tensions.reduce((a, t) => ({ ...a, [t.kind]: [...(a[t.kind] || []), t] }), {});
  return (
    <article>
      <h1>{reading.headline || `What changed at ${brand.name}, and what it left unresolved`}</h1>
      <p className="lb-deck">{reading.deck || 'Read from the record: what replaced what, where the material disagrees with itself, and what nobody has decided.'}</p>

      {cf && (
        <section className="lb-section">
          <h2>{reading.carryHeading || 'What carries forward'}</h2>
          <table className="lb-table lb-carry">
            <thead><tr><th>Brief</th><th>{reading.carryColumns?.[0] || 'Before'}</th><th>{reading.carryColumns?.[1] || 'Now'}</th></tr></thead>
            <tbody>{cf.changes.map(c => <tr key={c.field}><td>{FIELD_NAMES[c.field] || c.field}</td><td>{show(c.before)}</td><td>{show(c.after)}</td></tr>)}</tbody>
          </table>
          <ul className="lb-carry-rows">
            {cf.rows.map(r => (
              <li key={r.item.id} className={`lb-verdict-${r.verdict}`}>
                <button className="lb-carry-plate" onClick={() => setOpenId(r.item.id)} aria-label={`Open ${r.item.title}`}><Plate item={r.item} /></button>
                <div>
                  <h3>{r.verdictName}: {r.item.title}</h3>
                  <p>{r.why}</p>
                </div>
              </li>
            ))}
          </ul>
          {cf.evidenceNote && <p className="lb-body">{cf.evidenceNote}</p>}
        </section>
      )}

      {ledger.length > 0 && (
        <section className="lb-section">
          <h2>What replaced what</h2>
          <ul className="lb-findings">
            {ledger.map((c, k) => c.kind === 'material' ? (
              <li key={k}>
                <p><strong>{c.when ? `${fmt(c.when)}. ` : ''}</strong><Cite id={c.before.id} items={items} setOpenId={setOpenId} /> gave way to <Cite id={c.after.id} items={items} setOpenId={setOpenId} />.</p>
                {c.rationale && <p>{c.rationale}</p>}
              </li>
            ) : (
              <li key={k}>
                <p><strong>{fmt(c.when)}.</strong> "{c.before.statement}" became "{c.after.statement}"</p>
                <Cites ids={[c.before.source, c.after.source].filter(Boolean)} items={items} setOpenId={setOpenId} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hyps.length > 0 && (
        <section className="lb-section">
          <h2>Beyond the creative work</h2>
          {hyps.map(h => (
            <div key={h.id} className="lb-hyp">
              <h3>{h.title}</h3>
              <p>{h.statement}</p>
              <ul className="lb-list">{h.evidence.map(x => <li key={x.id}>{x.statement} <Cite id={x.item} items={items} setOpenId={setOpenId} /></li>)}</ul>
              <p><strong>Uncertain because</strong> {lower(h.uncertainty)}</p>
              {h.test && <p><strong>Could be tested by</strong> {lower(h.test)}</p>}
              <p><strong>Decided by</strong> {h.owner ? person(brand, h.owner) : `no one named yet at ${brand.name}`}. A recommendation from this engagement is not authority to act.</p>
            </div>
          ))}
        </section>
      )}

      <section className="lb-section">
        <h2>Tensions in the material</h2>
        {!tensions.length && <p className="lb-missing">None found in what has been entered.</p>}
        {Object.entries(groups).map(([kind, list]) => (
          <div key={kind} className="lb-tension-group">
            <h3>{kind}</h3>
            <ul className="lb-findings">
              {list.map(t => (
                <li key={t.id}>
                  <p><strong>{t.title}.</strong> {t.detail}</p>
                  {t.points?.length > 0 && <ul className="lb-list">{t.points.map(pt => <li key={pt.ruleId}>{pt.rule} <span className="lb-meta">It has {pt.has}.</span></li>)}</ul>}
                  <Cites ids={t.sources} items={items} setOpenId={setOpenId} />{t.owners?.length > 0 && <span className="lb-meta"> Resolved by {who(brand, t.owners)}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}

/* Choose ----------------------------------------------------------------- */
function Choose({ asOf, state, brand, items, act, actor, setOpenId }) {
  const [form, setForm] = useState({ subject: '', verdict: 'preserve', rationale: '' });
  const recorded = new Set(state.choices.map(c => c.subject));
  const suggested = state.engagement.suggestedChoices || [];
  const study = isPublicStudy(brand);
  return (
    <article>
      <h1>Choose what to keep, repair, change and invent</h1>
      <p className="lb-deck">{study
        ? `A choice here is your judgment as an outsider. None of it binds ${brand.name}, and anything that would need its authority waits until someone there is named.`
        : 'A choice is a record of this engagement\'s judgment. Where it needs someone else\'s authority, it is routed to them and waits.'}</p>

      {suggested.length > 0 && (
        <section className="lb-section">
          <h2>Drawn from the interpretation</h2>
          <ul className="lb-findings">
            {suggested.map(c => (
              <li key={c.subject}>
                <p><strong>{CHOICES[c.verdict]}: {c.subject}.</strong> {c.rationale}</p>
                <Cites ids={c.sources || []} items={items} setOpenId={setOpenId} />
                <div className="lb-actions">
                  {recorded.has(c.subject)
                    ? <span className="lb-meta">Recorded</span>
                    : <button onClick={() => act(s => recordChoice(s, { ...c, by: actor, asOf }), next => { const made = next.choices.at(-1); return made.needs ? (made.owner ? `Recorded and routed to ${person(brand, made.owner)}.` : `Recorded. It needs a decision on ${POWERS[made.needs]}, and no one is named for that yet.`) : 'Recorded.'; })}>Record this choice</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="lb-form lb-section" onSubmit={x => { x.preventDefault(); if (!form.subject.trim()) return; if (act(s => recordChoice(s, { ...form, by: actor, asOf }), 'Recorded.')) setForm({ subject: '', verdict: 'preserve', rationale: '' }); }}>
        <h2>Record your own</h2>
        <label>Subject<input value={form.subject} onChange={x => setForm({ ...form, subject: x.target.value })} /></label>
        <label>Choice<select value={form.verdict} onChange={x => setForm({ ...form, verdict: x.target.value })}>{Object.entries(CHOICES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>Reason<textarea rows={2} value={form.rationale} onChange={x => setForm({ ...form, rationale: x.target.value })} /></label>
        <div className="lb-actions"><button className="lb-primary" type="submit">Record</button></div>
      </form>

      <section className="lb-section">
        <h2>Recorded</h2>
        {state.choices.length ? (
          <table className="lb-table">
            <thead><tr><th>Choice</th><th>Subject</th><th>Status</th></tr></thead>
            <tbody>{state.choices.map(c => <tr key={c.id}><td>{CHOICES[c.verdict]}</td><td>{c.subject}</td><td>{cap(c.status)}{c.needs ? `, ${c.owner ? person(brand, c.owner) : 'no one named'}` : ''}</td></tr>)}</tbody>
          </table>
        ) : <p className="lb-missing">Nothing recorded yet.</p>}
      </section>

      <section className="lb-section">
        <h2>Proposals to the brand</h2>
        <Proposals asOf={asOf} state={state} brand={brand} items={items} setOpenId={setOpenId} act={act} decider={actor} />
        <p className="lb-body">Open any piece of work to propose a change to its standing.</p>
      </section>
    </article>
  );
}

function Proposals({ asOf, state, brand, items, setOpenId, act, decider, only }) {
  const list = state.proposals.filter(p => !only || only(p));
  if (!list.length) return <p className="lb-missing">No proposals.</p>;
  return (
    <ul className="lb-findings">
      {list.map(p => {
        const item = items[p.itemId];
        const mine = decider && item && canDecide(brand, decider, powerFor(item));
        return (
          <li key={p.id}>
            <p><strong><Cite id={p.itemId} items={items} setOpenId={setOpenId} />: {STANDING_CLASSES[p.from].name} to {STANDING_CLASSES[p.to].name}.</strong> {p.rationale}</p>
            <p className="lb-meta">Proposed by {person(brand, p.by)} on {fmt(p.date)}. {p.status === 'open' ? `Waiting for ${who(brand, p.reviewer)}.` : `Status: ${p.status}.`}</p>
            {p.evidenceIds.length > 0 && <ul className="lb-list">{brand.items.flatMap(i => i.evidence || []).filter(x => p.evidenceIds.includes(x.id)).map(x => <li key={x.id}>{x.statement} <span className="lb-meta">{String(x.basis).replace(/_/g, ' ')}</span></li>)}</ul>}
            {p.warnings.length > 0 && <ul className="lb-warnings">{p.warnings.map(w => <li key={w}>{w}</li>)}</ul>}
            {p.status === 'open' && mine && (
              <div className="lb-actions">
                <button className="lb-primary" onClick={() => act(s => decide(s, p.id, { by: decider, outcome: 'adopt', note: 'Adopted', asOf }), 'Adopted. The previous standing is kept in the record.')}>Adopt</button>
                <button onClick={() => act(s => decide(s, p.id, { by: decider, outcome: 'revise', note: 'Needs a narrower scope', asOf }), 'Sent back for revision.')}>Ask for revision</button>
                <button onClick={() => act(s => decide(s, p.id, { by: decider, outcome: 'reject', note: 'Rejected', asOf }), 'Rejected. The proposal stays on record.')}>Reject</button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* Organize --------------------------------------------------------------- */
function Organize({ asOf, state, brand, items, setOpenId, pkg, setPkg, setNotice }) {
  const e = state.engagement;
  const brief = buildBrief(brand, e, state.choices, { asOf });
  const study = isPublicStudy(brand);
  const partner = e.partner;
  const issue = () => {
    try { setPkg(buildContextPackage(state, { partner: { id: partner.id, name: partner.name }, assignment: partner.assignment, channels: partner.channels, workTypes: partner.workTypes, powers: ['read'], expires: partner.expires, asOf })); setNotice({ kind: 'ok', text: `Context package issued. Switch the viewer to ${partner.name} to see what it receives.` }); }
    catch (err) { setNotice({ kind: 'refused', text: err.message }); }
  };
  return (
    <article>
      <h1>{e.reading?.organize?.headline || `${brief.title}: the brief`}</h1>
      <p className="lb-deck">{e.reading?.organize?.deck || [brief.objective, brief.audience ? `For ${lower(brief.audience)}.` : ''].filter(Boolean).join(' ')}</p>

      {brief.evaluation.length > 0 && (
        <section className="lb-section">
          <h2>How it will be judged, decided now</h2>
          <table className="lb-table">
            <thead><tr><th>Outcome</th><th>Measure</th><th>Compared with</th><th>Limit</th></tr></thead>
            <tbody>{brief.evaluation.map(x => <tr key={x.outcome}><td>{x.outcome}</td><td>{x.measure}</td><td>{x.baseline}</td><td>{x.limit}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <section className="lb-section">
        <h2>Choices it carries</h2>
        {brief.decisions.length ? <ul className="lb-list">{brief.decisions.map(d => <li key={d.subject}><strong>{CHOICES[d.verdict]}: {d.subject}.</strong> {d.rationale} {d.status !== 'recorded' && <em>({d.status})</em>}</li>)}</ul>
          : <p className="lb-missing">No choices recorded yet. Record them in Choose.</p>}
      </section>

      {brief.rules.length > 0 && (
        <section className="lb-section">
          <h2>Rules that apply</h2>
          <ul className="lb-list">{brief.rules.map(r => <li key={r.id}>{r.statement} <span className="lb-meta">{STANDING_CLASSES[r.standing]?.name || cap(r.standing)}</span></li>)}</ul>
        </section>
      )}

      {(e.questions?.length > 0 || (brand.unknowns || []).length > 0) && (
        <section className="lb-section">
          <h2>Questions for {brand.name}</h2>
          <ul className="lb-list">{[...(e.questions || []), ...(study ? brand.unknowns || [] : [])].map(q => <li key={q}>{q}</li>)}</ul>
        </section>
      )}

      {brief.snapshot.length > 0 && (
        <section className="lb-section">
          <h2>Sources, frozen on {fmt(brief.frozenAt)}</h2>
          <table className="lb-table">
            <thead><tr><th>Source</th><th>Standing</th><th>Stage</th><th>Fingerprint</th></tr></thead>
            <tbody>{brief.snapshot.map(s => <tr key={s.id}><td><Cite id={s.id} items={items} setOpenId={setOpenId} /></td><td>{STANDING_CLASSES[s.standing].name}</td><td>{cap(s.pipeline)}</td><td><code>{s.fingerprint}</code></td></tr>)}</tbody>
          </table>
        </section>
      )}

      {partner && !study && (
        <section className="lb-section">
          <h2>Collaborators</h2>
          <p className="lb-body">{partner.name} needs the rules and cleared material for its assignment, not the research or the strategy. Its package is read-only, expires on {fmt(partner.expires)}, and can be revoked.</p>
          <div className="lb-actions">
            {!pkg && <button className="lb-primary" onClick={issue}>Issue a context package</button>}
            {pkg && !pkg.package.revokedAt && <button onClick={() => { setPkg({ ...pkg, package: revokePackage(pkg.package, asOf) }); setNotice({ kind: 'ok', text: 'Package revoked.' }); }}>Revoke the package</button>}
            {pkg?.package.revokedAt && <button onClick={issue}>Issue a new package</button>}
          </div>
          {pkg && (
            <div className="lb-two">
              <div><h3>Included ({pkg.package.included.length})</h3><ul className="lb-list">{pkg.package.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></div>
              <div><h3>Withheld ({pkg.audit.withheld.length})</h3><ul className="lb-list">{pkg.audit.withheld.map(i => <li key={i.id}>{i.title}: {i.reasons[0]}</li>)}</ul></div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

/* Transfer --------------------------------------------------------------- */
function Transfer({ catalog, asOf, state, brand }) {
  const e = state.engagement;
  const brief = buildBrief(brand, e, state.choices, { asOf });
  const handoff = buildHandoff(state, { brief, asOf });
  const bench = exportWorkbench(catalog.practitioner);
  const study = isPublicStudy(brand);
  const slug = brand.id;
  const [shown, setShown] = useState(null);
  const offer = (name, data) => {
    const text = JSON.stringify(data, null, 2);
    setShown({ name, text });
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
    } catch { /* a viewer that blocks downloads still gets the text below */ }
  };
  return (
    <article>
      <h1>{e.reading?.transfer?.headline || (study ? `What a study of ${brand.name} can and cannot hand over` : `Leave ${brand.name} more capable than you found it`)}</h1>
      <p className="lb-deck">{e.reading?.transfer?.deck || (study
        ? `This package is yours. ${brand.name} did not commission it. It keeps every source with its link, your reading, your choices and the questions only ${brand.name} can answer.`
        : `The engagement package belongs to ${brand.name}. It keeps the sources with their provenance, the interpretation, every choice and proposal, and the questions still open.`)}</p>
      <section className="lb-section lb-two">
        <div>
          <h2>{study ? 'The study holds' : `${brand.name} keeps`}</h2>
          <ul className="lb-list">
            <li>{handoff.sources.length} sources with provenance, stage, rights and fingerprint</li>
            <li>{handoff.choices.length} choices and {handoff.proposals.length} proposals, with who decides each</li>
            <li>{handoff.openTensions.length} tensions not yet resolved</li>
            <li>The brief{brief.evaluation.length ? ', with its evaluation set before the work' : ''}</li>
          </ul>
          {handoff.openQuestions.length > 0 && (<><h3>Still open</h3><ul className="lb-list">{handoff.openQuestions.map(q => <li key={q}>{q}</li>)}</ul></>)}
          <h3>Not done by this engagement</h3>
          <p className="lb-body">{cap(handoff.notCompleted.join(', '))}.{handoff.completed.length ? ` ${cap(handoff.completed.join(' and '))} is complete; the rest are separate pieces of work.` : ''}</p>
          <div className="lb-actions">
            <button className="lb-primary" onClick={() => offer(`${slug}-engagement-package.json`, handoff)}>Download the engagement package</button>
            <button onClick={() => offer(`${slug}.packet.json`, toPacket(state))}>Download the portable packet</button>
          </div>
          <p className="lb-body">The packet is the whole record in plain JSON. The connector opens it, so this engagement can continue in conversation.</p>
        </div>
        <div>
          <h2>You keep</h2>
          <ul className="lb-list">{bench.methods.map(m => <li key={m}>{m}</li>)}</ul>
          <p className="lb-body">Your methods and preferences, and a record that the engagements happened.{study ? '' : ` No ${brand.name} material leaves with you.`}</p>
          <div className="lb-actions"><button onClick={() => offer('workbench.json', bench)}>Download your workbench</button></div>
        </div>
      </section>
      {shown && (
        <section className="lb-section">
          <h2>{shown.name}</h2>
          <p className="lb-body">If nothing downloaded, copy it from here.</p>
          <textarea className="lb-export" readOnly rows={12} value={shown.text} aria-label={shown.name} onFocus={x => x.target.select()} />
        </section>
      )}
    </article>
  );
}

/* Other viewers ---------------------------------------------------------- */
function PersonView({ asOf, state, brand, items, act, setOpenId, personId }) {
  const powers = Object.entries(brand.authority || {}).filter(([, ids]) => ids.includes(personId)).map(([p]) => p);
  const mine = p => items[p.itemId] && canDecide(brand, personId, powerFor(items[p.itemId]));
  const routed = state.choices.filter(c => c.owner === personId);
  const hyps = organizationalHypotheses(brand, state.engagement).filter(h => h.owner === personId);
  const canon = brand.items.filter(i => i.standing === 'canon' && canDecide(brand, personId, powerFor(i)));
  const reused = brand.items.filter(i => (i.reuse?.length || 0) >= 3 && i.standing !== 'canon' && canDecide(brand, personId, powerFor(i)));
  const others = state.proposals.filter(p => p.status === 'open' && !mine(p));
  const company = viewFor('executive', brand).filter(i => i.level === 'company');
  const waiting = state.proposals.filter(p => p.status === 'open' && mine(p)).length + routed.filter(c => c.status === 'awaiting decision').length;
  return (
    <article>
      <h1>{waiting ? `${waiting} ${waiting === 1 ? 'decision is' : 'decisions are'} waiting for ${person(brand, personId)}` : `Nothing is waiting for ${person(brand, personId)}`}</h1>
      <p className="lb-deck">{person(brand, personId)} decides {powers.map(p => POWERS[p]).join(', ')} at {brand.name}. Each decision keeps its evidence, scope, date and what it replaced.</p>

      <section className="lb-section">
        <h2>Proposals you can decide</h2>
        <Proposals asOf={asOf} state={state} brand={brand} items={items} setOpenId={setOpenId} act={act} decider={personId} only={mine} />
      </section>

      {routed.length > 0 && (
        <section className="lb-section">
          <h2>Choices routed to you</h2>
          <ul className="lb-findings">{routed.map(c => <li key={c.id}><p><strong>{CHOICES[c.verdict]}: {c.subject}.</strong> {c.rationale}</p><Cites ids={c.sources || []} items={items} setOpenId={setOpenId} /></li>)}</ul>
        </section>
      )}

      {hyps.map(h => (
        <section key={h.id} className="lb-section lb-hyp">
          <h2>{h.title}</h2>
          <p>{h.statement}</p>
          <ul className="lb-list">{h.evidence.map(x => <li key={x.id}>{x.statement} <Cite id={x.item} items={items} setOpenId={setOpenId} /></li>)}</ul>
          <p><strong>Uncertain because</strong> {lower(h.uncertainty)}</p>
          {h.test && <p><strong>Could be tested by</strong> {lower(h.test)}</p>}
        </section>
      ))}

      {reused.length > 0 && (
        <section className="lb-section">
          <h2>Reused often, never reviewed</h2>
          <ul className="lb-findings">{reused.map(i => <li key={i.id}><p><Cite id={i.id} items={items} setOpenId={setOpenId} /> has been reused {i.reuse.length} times and is still {lower(STANDING_CLASSES[i.standing].name)}. Frequency is a reason to look, not a reason to adopt.</p></li>)}</ul>
        </section>
      )}

      {canon.length > 0 && (
        <section className="lb-section">
          <h2>Canon you can retire</h2>
          <ul className="lb-findings">{canon.map(i => <li key={i.id}><p><Cite id={i.id} items={items} setOpenId={setOpenId} />{i.standingRecord?.date ? `, since ${fmt(i.standingRecord.date)}` : ''}</p>
            <div className="lb-actions"><button onClick={() => act(s => retire(s, i.id, { by: personId, reason: 'Retired in review', asOf }), 'Retired to the learning archive. Its history is kept.')}>Retire</button></div></li>)}</ul>
        </section>
      )}

      {company.length > 0 && powers.includes('offer') && (
        <section className="lb-section">
          <h2>Company-level material</h2>
          <ul className="lb-list">{company.map(i => <li key={i.id}><Cite id={i.id} items={items} setOpenId={setOpenId} /></li>)}</ul>
        </section>
      )}

      {others.length > 0 && (
        <section className="lb-section">
          <h2>Outside your authority</h2>
          <p className="lb-body">These belong to someone else. Trying anyway is refused, and the refusal is shown.</p>
          {others.map(p => (
            <div className="lb-actions" key={p.id}><button onClick={() => act(s => decide(s, p.id, { by: personId, outcome: 'adopt', asOf }))}>Adopt {items[p.itemId].title} as {lower(STANDING_CLASSES[p.to].name)}</button></div>
          ))}
        </section>
      )}
    </article>
  );
}

function Partner({ asOf, pkg: issued, brand }) {
  const pkg = issued?.package;
  if (!pkg) return (<article><h1>No context package has been issued to you</h1><p className="lb-deck">{brand.name}'s material is reachable only through a package the engagement issues. Switch back to the practitioner and issue one in Organize.</p></article>);
  if (!packageValid(pkg, asOf)) return (<article><h1>Your access to {brand.name} was revoked</h1><p className="lb-deck">Revoked on {fmt(pkg.revokedAt)}. Nothing from the package remains readable here.</p></article>);
  return (
    <article>
      <h1>{pkg.assignment}</h1>
      <p className="lb-deck">For {pkg.brand}. You may read what is below. You may not publish or change the brand's knowledge; work returns to {pkg.review.reviewer || 'the company'} for review. Access ends {fmt(pkg.expires)}.</p>
      <section className="lb-section"><h2>Rules</h2><ul className="lb-list">{pkg.rules.map(r => <li key={r.id}>{r.statement}</li>)}</ul></section>
      <section className="lb-section"><h2>Material you may use</h2><ul className="lb-list">{pkg.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></section>
      {pkg.open.length > 0 && <section className="lb-section"><h2>Unresolved, ask before relying on</h2><ul className="lb-list">{pkg.open.map(o => <li key={o.title}>{o.title}. Ask {o.ask}.</li>)}</ul></section>}
      <section className="lb-section"><h2>Not shared with you</h2><p className="lb-body">{pkg.withheldCount} items are withheld. This package does not name them.</p></section>
    </article>
  );
}

function Agency({ catalog }) {
  const rows = coordinationView(catalog.agency.engagements);
  return (
    <article>
      <h1>Two clients, one calendar, no shared knowledge</h1>
      <p className="lb-deck">{catalog.agency.name} works for competing clients. Across them the lead sees dates and people. Strategy, briefs and files stay inside each client's workspace.</p>
      <section className="lb-section">
        <table className="lb-table">
          <thead><tr><th>Client</th><th>Milestones</th><th>People</th></tr></thead>
          <tbody>{rows.map(v => <tr key={v.client}><td>{v.client}</td><td>{v.milestones.map(m => `${m.label}, ${fmt(m.date)}`).join('; ')}</td><td>{v.people.join(', ')}</td></tr>)}</tbody>
        </table>
        <p className="lb-body">Where one person appears on both, that is a capacity question the lead can see and act on without either client's plans being visible to the other.</p>
      </section>
    </article>
  );
}
