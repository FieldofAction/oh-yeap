import { Component, useEffect, useMemo, useRef, useState } from 'react';
import {
  startEngagement, openTenant, search, assessStanding, findTensions, carryForward, changeLedger, organizationalHypotheses,
  propose, decide, retire, recordReuse, recordChoice, answerChoice, recordAnswer, verifyItem, approveItem, nameAuthority, unnameAuthority,
  viewFor, buildBrief, buildContextPackage, revokePackage, packageValid, buildHandoff, toPacket, coordinationView, exportWorkbench,
  orientation, canDecide, powerFor, deciders, effectiveRules, rulesInForce, rulesStatedBy, timeline, fingerprint, isPublicStudy, basisNote,
  pipelineRank, STANDING_CLASSES, PIPELINE, CHOICES, POWERS, BASES,
} from './domain/index.js';
import Plate from './Plate.jsx';

// One workbench, any brand. The catalog says which engagements can be opened;
// each opens only its own brand partition.
const STORE = 'living-brand-state-v4';
const PLACE_KEY = 'living-brand-place-v4';

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
const person = (brand, id) => brand.people?.[id]?.name || (id === 'practitioner' ? 'the practitioner' : id === 'intake' ? 'the intake reading' : id);
const who = (brand, ids) => (ids?.length ? ids.map(id => person(brand, id)).join(' or ') : 'no one named');
const stop = s => String(s || '').replace(/[.]+$/, '');

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const drop = key => { try { localStorage.removeItem(key); } catch { /* nothing to remove */ } };
// Saved work is only used if it has the shape of a record; anything else is ignored, not drawn.
const usable = saved => Boolean(saved?.state?.brand?.items && saved.state.engagement && ['choices', 'proposals', 'decisions'].every(k => Array.isArray(saved.state[k])));
const worked = state => Boolean(state.decisions.length || state.choices.length || (state.answers || []).length);

const save = (name, data) => {
  const text = JSON.stringify(data, null, 2);
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  } catch { /* a viewer that blocks downloads still gets the text */ }
  return { name, text };
};

// A packet may arrive with a record already in it (proposals waiting, choices made).
// Opening is refused when access has ended; the refusal is shown, not worked around.
const begin = (entry, asOf) => {
  try { return { state: startEngagement({ [entry.brand.id]: entry.brand }, entry.engagement, entry.record, { asOf }), pkg: null }; }
  catch (error) { return { state: null, pkg: null, refused: error.message }; }
};

// One stage failing to draw must not blank the page or hide the others.
class StageBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (<article><h1>This part of the record could not be shown</h1><p className="lb-deck">Something in the record is not in a shape this page can read: {this.state.error.message}. The other stages still work, and nothing was changed.</p></article>);
  }
}

function Export({ file }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView?.({ block: 'nearest' }); }, [file]);
  return (
    <section className="lb-section" ref={ref}>
      <h2>{file.name}</h2>
      <p className="lb-body">If nothing downloaded, copy it from here.</p>
      <textarea className="lb-export" readOnly rows={12} value={file.text} aria-label={file.name} onFocus={x => x.target.select()} />
    </section>
  );
}

export default function Workbench({ catalog }) {
  const asOf = catalog.asOf;
  const place = read(PLACE_KEY) || {};
  const [engId, setEngId] = useState(catalog.open.some(e => e.engagement.id === place.engagement) ? place.engagement : catalog.open[0].engagement.id);
  const entry = catalog.open.find(e => e.engagement.id === engId);
  // Saved work is tied to the exact records it was made from. When the records
  // change, earlier work is set aside under its own key: never applied to
  // records it was not made from, and never silently lost.
  const print = fingerprint({ b: entry.brand, e: entry.engagement, r: entry.record || null });
  const storeKey = `${STORE}:${engId}`;
  const earlierKey = `${storeKey}:earlier`;
  const restore = () => {
    const fresh = begin(entry, asOf);
    if (fresh.refused) return fresh;
    const saved = read(storeKey);
    if (!usable(saved)) return fresh;
    if (saved.print === print) return { state: saved.state, pkg: saved.pkg || null };
    if (worked(saved.state)) write(earlierKey, saved);
    return fresh;
  };
  const [all, setAll] = useState(restore);
  const [loadedKey, setLoadedKey] = useState(storeKey);
  if (loadedKey !== storeKey) { setAll(restore()); setLoadedKey(storeKey); }
  const { state, pkg } = all;

  const [viewer, setViewer] = useState(place.viewer || 'practitioner');
  const [stage, setStage] = useState(STAGES.some(s => s[0] === place.stage) ? place.stage : 'enter');
  const [openId, setOpenId] = useState(null);
  const [notice, setNotice] = useState(null);
  // Whether this browser keeps anything at all is known at once; a write that fails later is reported when it fails.
  const [unsaved, setUnsaved] = useState(() => { const ok = write(`${STORE}:probe`, 1); drop(`${STORE}:probe`); return !ok; });
  const [setAside, setSetAside] = useState(0);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(null);
  const topRef = useRef(null);
  const navRef = useRef(null);

  // Read after restore has run, so work set aside in this render is seen.
  const earlier = useMemo(() => { void setAside; void loadedKey; const saved = read(earlierKey); return usable(saved) ? saved : null; }, [earlierKey, setAside, loadedKey]);

  useEffect(() => {
    if (loadedKey !== storeKey || !state) return;
    if (!write(storeKey, { state, pkg, print })) queueMicrotask(() => setUnsaved(true));
  }, [state, pkg, storeKey, loadedKey, print]);
  useEffect(() => { write(PLACE_KEY, { engagement: engId, viewer, stage }); }, [engId, viewer, stage]);
  // The stage strip sits under the header, however tall the header is.
  const shown = Boolean(state);
  useEffect(() => {
    const el = topRef.current;
    if (!el) return undefined;
    const set = () => el.parentElement?.style.setProperty('--lb-top-h', `${el.offsetHeight}px`);
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, [shown]);
  useEffect(() => { navRef.current?.querySelector('.is-on')?.scrollIntoView?.({ inline: 'center', block: 'nearest' }); }, [stage, shown]);

  // Hooks run on every render, including when access has been refused and there is no state.
  const brand = state?.brand || null;
  const actor = state?.engagement.actor || 'practitioner';
  // Other people's seats can be tried only on the fictional brand. On a real
  // one, a decision is recorded by the person who makes it, from their own session.
  const demo = brand?.basis === 'fictional';
  const holders = useMemo(() => (brand && demo ? [...new Set(Object.keys(POWERS).flatMap(power => deciders(brand, power).map(d => d.id)))].filter(id => id !== actor) : []), [brand, actor, demo]);
  const items = useMemo(() => Object.assign(Object.create(null), Object.fromEntries((brand?.items || []).map(i => [i.id, i]))), [brand]);
  const tensions = useMemo(() => (state ? findTensions(state.brand, { asOf, workTypes: state.engagement.workTypes || [], channels: state.engagement.channels || [] }) : []), [state, asOf]);

  if (!state) {
    return (
      <div className="lb">
        <header className="lb-top">
          <span className="lb-home lb-home-plain">{catalog.homeLabel || 'Living Brand workbench'}</span>
          {catalog.open.length > 1 && (
            <label className="lb-viewer"><span>Engagement</span>
              <select value={engId} onChange={e => setEngId(e.target.value)}>{catalog.open.map(e => <option key={e.engagement.id} value={e.engagement.id}>{e.brand.name}: {e.engagement.project}</option>)}</select>
            </label>
          )}
        </header>
        <main className="lb-main lb-solo"><article>
          <h1>{entry.brand.name} cannot be opened</h1>
          <p className="lb-deck">{all.refused} Its material is not shown. Ask {entry.brand.name} to renew the access, or for the engagement package if the work has ended.</p>
        </article></main>
      </div>
    );
  }

  const study = isPublicStudy(brand);
  // Someone the brand names as deciding something is at home here; anyone else is visiting.
  const stance = study ? 'study' : (actor !== 'practitioner' && Object.values(brand.authority || {}).some(l => Array.isArray(l) && l.includes(actor))) ? 'owner' : 'visitor';

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
  const reset = () => { setAll(begin(entry, asOf)); setNotice({ kind: 'ok', text: 'Reset to the starting material.' }); };
  const switchTo = id => { setEngId(id); setOpenId(null); setNotice(null); setFile(null); setDraft(null); setViewer('practitioner'); setStage('enter'); window.scrollTo(0, 0); };

  const open = openId ? items[openId] : null;
  const go = k => { setStage(k); setNotice(null); window.scrollTo(0, 0); };
  const ctx = { catalog, asOf, state, brand, items, tensions, act, actor, setOpenId, go, pkg, setPkg, setNotice, switchTo, stance, demo, draft, setDraft };

  return (
    <div className="lb">
      <header className="lb-top" ref={topRef}>
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

      {study && (
        <p className="lb-basis">An independent study of {brand.name} from public sources. {brand.name} did not take part and has not reviewed it. Nothing here is {brand.name}'s own record.</p>
      )}
      {unsaved && (
        <p className="lb-basis">This browser is not saving your work. Download the packet in Transfer before you close the page.</p>
      )}
      {earlier && (
        <div className="lb-basis">
          <p>The records behind this page were rebuilt after your last session on it. What you recorded then is kept, and is not applied to the new records.</p>
          <div className="lb-actions">
            <button onClick={() => setFile(save(`${brand.id}-earlier-session.packet.json`, toPacket(earlier.state)))}>Download the earlier session</button>
            <button onClick={() => { drop(earlierKey); setSetAside(n => n + 1); setFile(null); }}>Discard it</button>
          </div>
          {file && file.name.includes('earlier-session') && <Export file={file} />}
        </div>
      )}

      {view === 'practitioner' && (
        <div className="lb-shell">
          <nav className="lb-stages" aria-label="Engagement stages" ref={navRef}>
            {STAGES.map(([k, n]) => (
              <button key={k} className={stage === k ? 'is-on' : ''} aria-current={stage === k ? 'step' : undefined} onClick={() => go(k)}>{n}</button>
            ))}
          </nav>
          <main className="lb-main"><StageBoundary resetKey={`${engId}:${stage}`}>
            {stage === 'enter' && <Enter {...ctx} reset={reset} />}
            {stage === 'orient' && <Orient {...ctx} />}
            {stage === 'investigate' && <Investigate {...ctx} />}
            {stage === 'interpret' && <Interpret {...ctx} />}
            {stage === 'choose' && <Choose {...ctx} />}
            {stage === 'organize' && <Organize {...ctx} />}
            {stage === 'transfer' && <Transfer {...ctx} />}
          </StageBoundary></main>
        </div>
      )}
      {view !== 'practitioner' && (
        <main className="lb-main lb-solo"><StageBoundary resetKey={`${engId}:${view}`}>
          {view.startsWith('person:') && <PersonView {...ctx} personId={view.slice(7)} />}
          {view === 'partner' && <Partner {...ctx} />}
          {view === 'agency' && <Agency {...ctx} />}
        </StageBoundary></main>
      )}

      {open && <Drawer key={open.id} item={open} {...ctx} canWork={view === 'practitioner'} actingAs={view === 'practitioner' ? actor : view.startsWith('person:') ? view.slice(7) : null} />}

      {notice && (
        <div className={`lb-notice lb-notice-${notice.kind}`} role="status">
          <p>{notice.kind === 'refused' ? `Refused: ${notice.text}` : notice.text}</p>
          <button onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

function Cite({ id, items, setOpenId }) {
  const it = items[id];
  if (!it) return <span className="lb-cite is-missing">{id}</span>;
  return <button className="lb-cite" onClick={() => setOpenId(id)}>{it.title}</button>;
}
const Cites = ({ ids, ...p }) => <span className="lb-cites">{[...new Set(ids)].map(id => <Cite key={id} id={id} {...p} />)}</span>;

// A reading written at intake is a snapshot. Once decisions have been recorded, say so.
const sinceNote = (state, reading) => (reading && state.decisions.length
  ? `This reading was written on ${fmt(state.engagement.started)}, before the decisions recorded since. The sections below reflect them.`
  : null);

/* Enter ------------------------------------------------------------------ */
function Enter({ catalog, asOf, state, brand, items, act, actor, setOpenId, go, setNotice, switchTo, reset, stance }) {
  const e = state.engagement;
  const study = stance === 'study';
  const canName = !study && e.grant?.powers?.includes('steward');
  const [naming, setNaming] = useState({ power: '', name: '' });
  const [resetting, setResetting] = useState(false);
  const tryOpen = closed => {
    try { openTenant({}, { ...closed, asOf }); setNotice({ kind: 'ok', text: 'Opened.' }); }
    catch (err) { setNotice({ kind: 'refused', text: err.message }); }
  };
  const areas = Object.entries(POWERS);
  const unnamed = areas.filter(([power]) => !deciders(brand, power).length);
  const done = e.modesCompleted || [];
  const powers = e.grant?.powers || [];
  const may = stance === 'owner'
    ? 'Read, propose, name who decides, and decide in the areas where you are named below'
    : powers.includes('steward') ? 'Read, propose, and name who decides' : powers.includes('propose') ? 'Read the brand\'s material and propose changes to it' : 'Read the brand\'s material';
  const mayNot = stance === 'owner'
    ? 'Decide anything in an area where someone else, or no one, is named'
    : 'Adopt, retire or publish anything. Those decisions stay with the people the company names.';
  return (
    <article>
      <h1>{e.project}</h1>
      <p className="lb-deck">{e.purpose}</p>

      {stance === 'visitor' && (
        <section className="lb-section">
          <h2>Where this engagement sits</h2>
          <Nesting catalog={catalog} brand={brand} engagement={e} />
        </section>
      )}

      <section className="lb-section lb-two">
        <div>
          <h2>Role and authority</h2>
          <dl className="lb-facts">
            <dt>Role</dt><dd>{e.role}{e.invitedBy ? `, invited by ${person(brand, e.invitedBy)}` : ''}</dd>
            <dt>Basis</dt><dd>{BASES[brand.basis || 'company-record'].name}. {basisNote({ ...brand, basis: brand.basis || 'company-record' })}</dd>
            {study ? (<>
              <dt>May</dt><dd>Read public material and record a reading of it</dd>
              <dt>May not</dt><dd>Speak for {brand.name}, adopt or retire anything, or reuse its assets</dd>
              <dt>Access</dt><dd>None granted. Public sources, read on {fmt(e.started || asOf)}</dd>
            </>) : (<>
              <dt>May</dt><dd>{may}</dd>
              <dt>May not</dt><dd>{mayNot}</dd>
              {e.grant.expires && (<><dt>Access ends</dt><dd>{fmt(e.grant.expires)}</dd></>)}
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

      <section className="lb-section">
        <h2>Who decides at {brand.name}</h2>
        <table className="lb-table">
          <thead><tr><th>Decision</th><th>Decided by</th></tr></thead>
          <tbody>{areas.map(([power, label]) => {
            const named = deciders(brand, power);
            return (
              <tr key={power}><td>{cap(label)}</td><td>
                {named.length ? named.map(d => (
                  <span key={d.id} className="lb-named">{d.name}{canName && <> <button className="lb-link" onClick={() => act(s => unnameAuthority(s, { power, personId: d.id, by: actor, asOf }), `${d.name} is no longer named for ${label}.`)}>Remove</button></>}</span>
                )) : 'no one named'}
              </td></tr>
            );
          })}</tbody>
        </table>
        {study && <p className="lb-body">A public-source study cannot establish any of this. It is the first thing to ask {brand.name}.</p>}
        {canName && unnamed.length > 0 && (
          <form className="lb-form lb-inline" onSubmit={ev => {
            ev.preventDefault();
            const name = naming.name.trim(); const power = naming.power || unnamed[0][0];
            if (!name) { setNotice({ kind: 'refused', text: 'Name the person.' }); return; }
            if (act(s => nameAuthority(s, { power, person: { name }, by: actor, asOf }), `${name} now decides ${POWERS[power]}.`)) setNaming({ power: '', name: '' });
          }}>
            <h3>Name who decides</h3>
            <label>Decision<select value={naming.power || unnamed[0][0]} onChange={ev => setNaming({ ...naming, power: ev.target.value })}>{unnamed.map(([power, label]) => <option key={power} value={power}>{cap(label)}</option>)}</select></label>
            <label>Person<input value={naming.name} onChange={ev => setNaming({ ...naming, name: ev.target.value })} /></label>
            <div className="lb-actions"><button className="lb-primary" type="submit">Name them</button></div>
          </form>
        )}
      </section>

      {stance === 'visitor' && (
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
      )}

      {catalog.connections?.length > 0 && (
        <section className="lb-section">
          <h2>What is real in this build</h2>
          <table className="lb-table">
            <thead><tr><th>Part</th><th>In this build</th></tr></thead>
            <tbody>{catalog.connections.map(c => <tr key={c.name}><td>{c.name}</td><td>{cap(c.state)}. {c.note}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <div className="lb-actions">
        <button className="lb-primary" onClick={() => go('orient')}>Begin orientation</button>
      </div>

      <section className="lb-section">
        <h2>Start over</h2>
        <p className="lb-body">Resetting removes every choice, proposal, decision and answer recorded on this page and returns to the starting material. Download the packet in Transfer first if you want to keep them.</p>
        <div className="lb-actions">
          {!resetting && <button onClick={() => setResetting(true)}>Reset this engagement</button>}
          {resetting && (<>
            <button onClick={() => { reset(); setResetting(false); }}>Yes, remove what was recorded</button>
            <button onClick={() => setResetting(false)}>Keep it</button>
          </>)}
        </div>
      </section>
    </article>
  );
}

function Nesting({ catalog, brand, engagement }) {
  const others = [...catalog.open.filter(o => o.engagement.id !== engagement.id).map(o => ({ name: o.brand.name, note: isPublicStudy(o.brand) ? 'A public-source study.' : 'A separate partition.' })),
    ...(catalog.closed || []).map(c => ({ name: c.clientLabel, note: `Ended ${fmt(c.grant.revokedAt)}. Its material can no longer be opened.` }))];
  return (
    <div className="lb-nest" role="img" aria-label={`The practitioner's workbench holds bounded engagements. This one opens a window onto ${brand.name}.`}>
      <div className="lb-nest-box lb-nest-bench">
        <h3>Your workbench</h3>
        <p>Methods, preferences, engagement history. Yours; carried between clients.</p>
        <div className="lb-nest-row">
          <div className="lb-nest-box lb-nest-eng">
            <h3>Engagement: {brand.name}</h3>
            <p>Goals, role, grant, choices, brief. Ends; the package stays with {brand.name}.</p>
          </div>
          {others.map(o => (
            <div key={o.name} className="lb-nest-box lb-nest-eng"><h3>{o.name}</h3><p>{o.note}</p></div>
          ))}
        </div>
      </div>
      <div className="lb-nest-box lb-nest-co">
        <h3>{brand.name}'s living brand system</h3>
        <p>Material, rules, claims, rights, decisions and the people with authority. {brand.name}'s; persists after you leave.</p>
      </div>
    </div>
  );
}

/* Orient ----------------------------------------------------------------- */
function Orient({ asOf, state, brand, items, setOpenId, go, stance }) {
  const o = orientation(brand, state.engagement, { asOf });
  const reading = state.engagement.reading?.orient || {};
  const study = stance === 'study';
  const urgent = o.attention.filter(t => t.severity !== 'investigate' || /rights/i.test(t.kind)).slice(0, 5);
  const rules = rulesInForce(effectiveRules(brand), asOf);
  const canonRules = rules.filter(r => r.standing === 'canon');
  const otherRules = rules.filter(r => r.standing !== 'canon');
  const counted = PIPELINE.filter(p => o.stages[p]).reverse();
  const stale = sinceNote(state, reading.deck);
  return (
    <article>
      <h1>{reading.headline || `What ${brand.name} says it is for`}</h1>
      <p className="lb-deck">{reading.deck || o.intent?.statement}</p>
      {stale && <p className="lb-body">{stale}</p>}
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
          <h2>{study ? 'What appears to govern work now' : 'What governs work now'}</h2>
          <RuleGroups rules={canonRules} brand={brand} items={items} setOpenId={setOpenId} canon study={study} />
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
          <ul className="lb-findings">{urgent.map(t => <li key={t.id}><p><strong>{stop(t.title)}.</strong> {t.detail}</p><Cites ids={t.sources} items={items} setOpenId={setOpenId} /></li>)}</ul>
          <div className="lb-actions"><button onClick={() => go('interpret')}>See every tension in Interpret</button></div>
        </section>
      )}
      {o.unknowns.length > 0 && (
        <section className="lb-section">
          <h2>{stance === 'owner' ? 'What these files do not say' : 'What is not known'}</h2>
          <ul className="lb-list">{o.unknowns.slice(0, 8).map(u => <li key={u}>{u}</li>)}</ul>
          {o.unknowns.length > 8 && (
            <details><summary>The rest of the list</summary><ul className="lb-list">{o.unknowns.slice(8).map(u => <li key={u}>{u}</li>)}</ul></details>
          )}
          {stance === 'owner' && <div className="lb-actions"><button onClick={() => go('organize')}>Answer them in Organize</button></div>}
        </section>
      )}
      <section className="lb-section">
        <h2>How well the material is understood</h2>
        <p className="lb-body">Of {brand.items.length} pieces, {counted.map(p => `${o.stages[p]} ${p === 'discovered' ? 'only found' : p === 'verified' ? 'checked against their source' : p}`).join(', ')}. A record counts as checked only once someone has compared it with its source, and as approved only once someone with authority has said so. Nothing here was promoted by being extracted or reused.</p>
      </section>
    </article>
  );
}

// Rules grouped under the material that states them, so forty rules read as a handful of sources.
function RuleGroups({ rules, brand, items, setOpenId, canon = false, study = false }) {
  const bySource = rules.reduce((a, r) => ({ ...a, [r.source]: [...(a[r.source] || []), r] }), {});
  return (
    <ul className="lb-findings">
      {Object.entries(bySource).map(([source, list]) => {
        const since = items[source]?.standingRecord?.date || list.map(r => r.effective?.from).filter(Boolean).sort()[0];
        const decides = [...new Set(list.map(r => r.owner).filter(Boolean))];
        const meta = canon
          ? [since ? `${study ? 'Read as current since' : 'Since'} ${fmt(since)}` : null, decides.length ? `${who(brand, decides)} decides` : null]
          : [STANDING_CLASSES[list[0].standing]?.name || cap(list[0].standing), items[source]?.provenance?.origin === 'generated' ? 'written by a model' : null, decides.length ? `${who(brand, decides)} decides` : null];
        // A long rulebook reads as its sources first; each opens to its rules.
        if (rules.length > 12) return (
          <li key={source}>
            <details>
              <summary><strong>{items[source]?.title || source}</strong> <span className="lb-meta">{list.length === 1 ? 'one rule' : `${list.length} rules`}; {lower(meta.filter(Boolean).join('; '))}</span></summary>
              <ul className="lb-list">{list.map(r => <li key={r.id}>{r.statement}</li>)}</ul>
              <Cite id={source} items={items} setOpenId={setOpenId} />
            </details>
          </li>
        );
        return (
          <li key={source}>
            <p><strong><Cite id={source} items={items} setOpenId={setOpenId} /></strong> <span className="lb-meta">{meta.filter(Boolean).join('; ')}</span></p>
            <ul className="lb-list">{list.map(r => <li key={r.id}>{r.statement}</li>)}</ul>
          </li>
        );
      })}
    </ul>
  );
}

/* Investigate ------------------------------------------------------------ */
function Investigate({ asOf, state, brand, setOpenId, stance }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => search(state, q, { channels: state.engagement.channels || [], asOf }), [state, q, asOf]);
  const hint = state.engagement.searchHint;
  return (
    <article>
      <h1>The work itself</h1>
      <p className="lb-deck">Every piece keeps its purpose, audience, canvas, dates, rights and standing. Each answers separately whether it is authorized, reusable and authoritative, and a search adds whether it is relevant. The pictures are drawn stand-ins, not the work.</p>
      <label className="lb-search">
        <span>Search {brand.name}'s material</span>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={hint ? `Try ${hint}` : ''} />
      </label>
      {q.trim() && !results.length && <p className="lb-body">Nothing in {brand.name}'s material matches.{stance === 'visitor' ? ' Other clients\' material is not searched.' : ''}</p>}
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
  // Relevance is an answer only when a question was asked.
  const rows = [['relevant', 'Relevant'], ['authorized', 'Authorized'], ['reusable', 'Reusable here'], ['authoritative', 'Authoritative']].filter(([k]) => k !== 'relevant' || st.asked);
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

// Where a record stands between being found and being approved, in a sentence.
function stageLine(item, brand, study) {
  const v = item.verification;
  const checked = v ? `Checked against its source by ${person(brand, v.by)} on ${fmt(v.date)}: ${stop(v.how)}.` : 'Checked against its source.';
  switch (item.pipeline) {
    case 'discovered': return 'Only found. Nobody has recorded what it is.';
    case 'extracted': return 'Read out of its source. Nobody has checked the record against it.';
    case 'interpreted': return 'Read and described. Nobody has checked the description against its source.';
    case 'verified': return study ? checked : `${checked} Not yet approved.`;
    default: return checked;
  }
}

function Drawer({ asOf, item, state, brand, items, act, actor, setOpenId, canWork, actingAs, stance }) {
  const e = state.engagement;
  const study = stance === 'study';
  const st = assessStanding(item, { channels: e.channels || [], asOf, until: e.newBrief?.until }, brand);
  const [to, setTo] = useState(item.standing === 'canon' ? 'precedent' : 'canon');
  const [why, setWhy] = useState('');
  const [scope, setScope] = useState('');
  const [ev, setEv] = useState([]);
  const [where, setWhere] = useState('');
  const [how, setHow] = useState('');
  const closeRef = useRef(null);
  // Evidence that can be offered for this piece: its own, and that of material the record relates to it.
  const near = new Set([item.id, ...(item.relations || []).map(r => r.to), ...brand.items.filter(i => (i.relations || []).some(r => r.to === item.id)).map(i => i.id)]);
  const offered = brand.items.filter(i => near.has(i.id)).flatMap(i => (i.evidence || []).filter(x => x.type !== 'intended'));
  const evidenceTypes = [['intended', 'Intended impact'], ['observed', 'Observed outcome'], ['contribution', 'This element\'s contribution'], ['transfer', 'Transfer to other situations']]
    .map(([k, n]) => [n, (item.evidence || []).filter(x => x.type === k)]).filter(([, list]) => list.length);
  const reviewers = deciders(brand, powerFor(item)).map(p => p.name);
  const checkedYet = pipelineRank(item.pipeline) >= pipelineRank('verified');
  const canVerify = canWork && item.pipeline !== 'discovered' && !checkedYet;
  const mine = actingAs && canDecide(brand, actingAs, powerFor(item));
  const awaitingApproval = mine && item.pipeline !== 'discovered' && !item.retired && !['approved', 'published'].includes(item.approval?.status);
  const proposals = state.proposals.filter(p => p.itemId === item.id);
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
    ['About the dates', item.periodNote],
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
        <figure className="lb-figure">
          <Plate item={item} large />
          <figcaption className="lb-meta">A drawn stand-in, not the work itself.</figcaption>
        </figure>
        <h2>{item.title}</h2>
        <p className="lb-body">{item.rationale || item.text || 'No rationale recorded.'}</p>
        <dl className="lb-facts">{facts.map(([k, v]) => <div key={k} className="lb-fact"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>

        <h3>For this project</h3>
        <Answers st={st} />

        <h3>Standing</h3>
        <p className="lb-body"><strong>{STANDING_CLASSES[item.standing].name}.</strong> {STANDING_CLASSES[item.standing].job}
          {item.standingRecord?.basis === 'reading' && ` This is a reading of public material${item.standingRecord.scope ? `: ${lower(item.standingRecord.scope)}` : ''}. It is not ${brand.name}'s own classification.`}
          {item.standingRecord && item.standingRecord.basis !== 'reading' && ` Set by ${person(brand, item.standingRecord.by)} on ${fmt(item.standingRecord.date)}${item.standingRecord.scope ? `. It covers: ${lower(stop(item.standingRecord.scope))}` : ''}.`}</p>
        {item.readingWhy && !item.standingRecord?.decisionId && <p className="lb-body">{item.readingWhy}</p>}
        {item.standingHistory?.length > 0 && <p className="lb-body">Before: {item.standingHistory.map(h => `${STANDING_CLASSES[h.standing].name} until ${fmt(h.until)}`).join('; ')}.</p>}
        <p className="lb-body">{stageLine(item, brand, study)}</p>
        {proposals.length > 0 && (
          <ul className="lb-list">{proposals.map(p => (
            <li key={p.id}>{p.status === 'open' ? `A proposal to make it ${lower(STANDING_CLASSES[p.to].name)} is waiting for ${who(brand, p.reviewer)}.` : proposalOutcome(p, brand)}</li>
          ))}</ul>
        )}

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

        {awaitingApproval && (
          <div className="lb-form">
            {checkedYet
              ? (<>
                <p className="lb-body">You decide {POWERS[powerFor(item)]} at {brand.name}. Approving says this may be used. It does not make it canon.</p>
                <div className="lb-actions"><button className="lb-primary" onClick={() => act(s => approveItem(s, item.id, { by: actingAs, asOf }), 'Approved. Its standing is unchanged.')}>Approve this</button></div>
              </>)
              : <p className="lb-body">You decide {POWERS[powerFor(item)]} at {brand.name}. It can be approved once it has been checked against its source.</p>}
          </div>
        )}

        <h3>Evidence</h3>
        {evidenceTypes.length === 0 && <p className="lb-missing">None recorded.</p>}
        {evidenceTypes.map(([n, list]) => (
          <div key={n} className="lb-ev"><h4>{n}</h4><ul>{list.map(x => <li key={x.id}>{x.statement} <span className="lb-meta">{String(x.basis).replace(/_/g, ' ')}</span>{/^https?:/.test(x.url || '') && <> <a href={x.url} target="_blank" rel="noreferrer noopener">source</a></>}</li>)}</ul></div>
        ))}

        <h3>Rights</h3>
        <p className="lb-body"><strong>{cap(item.rights?.status || 'unknown')}.</strong> {item.rights?.note || ''} {item.rights?.holder ? `Holder: ${item.rights.holder}.` : ''}</p>

        {item.relations?.length > 0 && (<><h3>Related</h3>
          <ul className="lb-list">{item.relations.map(r => <li key={r.type + r.to}>{cap(r.type)} <Cite id={r.to} items={items} setOpenId={setOpenId} /></li>)}</ul></>)}
        {item.supersededBy && <p className="lb-body">Replaced by <Cite id={item.supersededBy} items={items} setOpenId={setOpenId} />.</p>}

        {item.reuse?.length > 0 && (<><h3>Reused</h3>
          <ul className="lb-list">{item.reuse.map((r, k) => <li key={k}>{r.where}, {fmt(r.date)}</li>)}</ul></>)}

        {canWork && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => propose(s, { itemId: item.id, to, rationale: why, evidenceIds: ev, by: actor, scope, asOf }), next => { const p = next.proposals.at(-1); return `Proposal recorded${p.reviewer.length ? ` for ${who(brand, p.reviewer)}` : ''}. Nothing has changed yet.${p.warnings.length ? ` Noted: ${p.warnings.join(' ')}` : ''}`; })) { setWhy(''); setScope(''); setEv([]); } }}>
            <h3>Propose a change of standing</h3>
            <p className="lb-body">{study ? `In a study this is a note to yourself. Only ${brand.name} can decide it.` : reviewers.length ? `Decided by ${reviewers.join(' or ')}.` : `No one is named to decide this at ${brand.name}. A proposal will wait.`}</p>
            <label>New standing
              <select value={to} onChange={x => setTo(x.target.value)}>{Object.entries(STANDING_CLASSES).filter(([k]) => k !== item.standing).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            </label>
            <label>Why
              <textarea value={why} onChange={x => setWhy(x.target.value)} rows={2} />
            </label>
            <label>What it would cover
              <input value={scope} onChange={x => setScope(x.target.value)} />
            </label>
            {offered.length > 0 && (
              <fieldset><legend>Evidence to attach</legend>
                {offered.map(x => (
                  <label key={x.id} className="lb-check"><input type="checkbox" checked={ev.includes(x.id)} onChange={c => setEv(c.target.checked ? [...ev, x.id] : ev.filter(i => i !== x.id))} />{x.statement}</label>
                ))}
              </fieldset>
            )}
            <div className="lb-actions"><button className="lb-primary" type="submit">Record proposal</button></div>
          </form>
        )}

        {canWork && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => recordReuse(s, item.id, { where, asOf }), 'Reuse recorded. Standing is unchanged: reuse does not confer authority.')) setWhere(''); }}>
            <h3>Record a reuse</h3>
            <label>Where it was reused
              <input value={where} onChange={x => setWhere(x.target.value)} />
            </label>
            <div className="lb-actions"><button type="submit">Record the reuse</button></div>
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

function Tension({ t, brand, items, setOpenId, shared, onChoose, onName }) {
  return (
    <li>
      <p><strong>{stop(t.title)}.</strong>{shared ? '' : ` ${t.detail}`}</p>
      {t.points?.length > 0 && <ul className="lb-list">{t.points.map(pt => <li key={pt.ruleId}>{pt.rule} <span className="lb-meta">{pt.says || `It has ${pt.has}.`}</span></li>)}</ul>}
      <Cites ids={t.sources} items={items} setOpenId={setOpenId} />{t.owners?.length > 0 && <span className="lb-meta"> For {who(brand, t.owners)} to resolve</span>}
      {onChoose && <div className="lb-actions"><button onClick={onChoose}>Record a choice about this</button></div>}
      {onName && <div className="lb-actions"><button onClick={onName}>Name them in Enter</button></div>}
    </li>
  );
}

function Interpret({ asOf, state, brand, items, setOpenId, tensions, go, setDraft, stance }) {
  const e = state.engagement;
  const reading = e.reading?.interpret || {};
  const cf = carryForward(brand, e, { asOf });
  const ledger = changeLedger(brand, { asOf });
  const events = timeline(brand, { asOf });
  const hyps = organizationalHypotheses(brand, e);
  const groups = Object.entries(tensions.reduce((a, t) => ({ ...a, [t.kind]: [...(a[t.kind] || []), t] }), {}));
  const stale = sinceNote(state, reading.deck);
  const canWrite = e.grant?.powers?.includes('propose');
  // A gap in who decides is closed by naming someone, not by recording a choice about it.
  const onChoose = canWrite ? t => (t.unnamed ? null : () => { setDraft({ subject: stop(t.title), sources: t.sources || [] }); go('choose'); }) : () => null;
  const canName = stance !== 'study' && e.grant?.powers?.includes('steward');
  return (
    <article>
      <h1>{reading.headline || `What changed at ${brand.name}, and what it left unresolved`}</h1>
      <p className="lb-deck">{reading.deck || 'Read from the record: what replaced what, where the material disagrees with itself, and what nobody has decided.'}</p>
      {stale && <p className="lb-body">{stale}</p>}

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

      <section className="lb-section">
        <h2>{stance === 'owner' ? 'What needs deciding' : 'Tensions in the material'}</h2>
        {!tensions.length && <p className="lb-missing">None found in what has been entered.</p>}
        {groups.map(([kind, list]) => {
          // One entry of a kind says what it is in its own first sentence. Several get a heading,
          // and a caveat every entry shares is said once under it.
          const shared = list.length > 1 && list.every(t => t.detail === list[0].detail) ? list[0].detail : null;
          return (
            <div key={kind} className="lb-tension-group">
              {list.length > 1 && <h3>{kind}</h3>}
              {shared && <p className="lb-body">{shared}</p>}
              <ul className="lb-findings">{list.map(t => <Tension key={t.id} t={t} brand={brand} items={items} setOpenId={setOpenId} shared={Boolean(shared)} onChoose={onChoose(t)} onName={t.unnamed && canName ? () => go('enter') : null} />)}</ul>
            </div>
          );
        })}
      </section>

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
              <p><strong>Decided by</strong> {h.owner ? person(brand, h.owner) : `no one named yet at ${brand.name}`}.</p>
            </div>
          ))}
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
                <p><strong>{fmt(c.when)}.</strong> "{stop(c.before.statement)}" became "{stop(c.after.statement)}".</p>
                <Cites ids={[c.before.source, c.after.source].filter(Boolean)} items={items} setOpenId={setOpenId} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section className="lb-section">
          <h2>What happened, in order</h2>
          {/* A long record opens on request, so the reading above it stays within reach. */}
          {events.length > 30
            ? <details><summary>The full record, {events[0].date ? fmt(events[0].date) : 'undated'} to {fmt(events.filter(f => f.date).at(-1)?.date)}</summary><Timeline events={events} items={items} setOpenId={setOpenId} /></details>
            : <Timeline events={events} items={items} setOpenId={setOpenId} />}
        </section>
      )}
    </article>
  );
}

function Timeline({ events, items, setOpenId }) {
  return (
    <ol className="lb-timeline">
      {events.map(f => (
        <li key={f.id}>
          <time>{f.date ? fmt(f.date) : 'Undated'}</time>
          <div>
            <p>{f.statement}{f.ahead ? ' This is still ahead.' : ''}</p>
            {f.source && <Cite id={f.source} items={items} setOpenId={setOpenId} />}
            {f.links.filter(u => /^https?:/.test(u)).slice(0, 2).map(u => <a key={u} className="lb-cite" href={u} target="_blank" rel="noreferrer noopener">{u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>)}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* Choose ----------------------------------------------------------------- */
const choiceStatus = (c, brand) => {
  if (c.status === 'accepted' || c.status === 'declined') return `${cap(c.status)} by ${person(brand, c.answer?.by || c.owner)} on ${fmt(c.answer?.date || c.date)}${c.answer?.note ? `: ${stop(c.answer.note)}` : ''}`;
  if (c.needs) return c.owner ? `Waiting for ${person(brand, c.owner)}` : `Needs a decision on ${POWERS[c.needs]}; no one is named`;
  return 'Recorded';
};

function Choose({ asOf, state, brand, items, act, actor, setOpenId, setNotice, stance, draft, setDraft }) {
  const blank = { subject: '', verdict: 'investigate', rationale: '', needs: '', sources: [] };
  const [form, setForm] = useState(draft ? { ...blank, ...draft } : blank);
  const [declining, setDeclining] = useState({ id: null, note: '' });
  const formRef = useRef(null);
  useEffect(() => { if (draft) { formRef.current?.scrollIntoView?.({ block: 'center' }); setDraft(null); } }, [draft, setDraft]);
  const recorded = new Set(state.choices.map(c => c.subject));
  const suggested = state.engagement.suggestedChoices || [];
  const said = next => { const made = next.choices.at(-1); return made.status === 'accepted' ? 'Recorded. It is yours to decide, so it is decided.' : made.needs ? (made.owner ? `Recorded and routed to ${person(brand, made.owner)}.` : `Recorded. It needs a decision on ${POWERS[made.needs]}, and no one is named for that yet.`) : 'Recorded.'; };
  return (
    <article>
      <h1>Choose what to keep, repair, change and invent</h1>
      <p className="lb-deck">{stance === 'study'
        ? `A choice here is your judgment as an outsider. None of it binds ${brand.name}, and anything that would need its authority waits until someone there is named.`
        : stance === 'owner'
          ? 'A choice is your judgment, on record. Where it falls in an area you decide, recording it decides it. Anything else waits for whoever is named.'
          : 'A choice is a record of this engagement\'s judgment. Where it needs someone else\'s authority, it is routed to them and waits.'}</p>

      <section className="lb-section">
        <h2>Proposals to the brand</h2>
        <Proposals asOf={asOf} state={state} brand={brand} items={items} setOpenId={setOpenId} act={act} decider={actor} />
        <p className="lb-body">Open any piece of work to propose a change to its standing.</p>
      </section>

      {suggested.length > 0 && (
        <section className="lb-section">
          <h2>Drawn from the interpretation</h2>
          <ul className="lb-findings">
            {suggested.map(c => (
              <li key={c.subject}>
                <p><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale}</p>
                <Cites ids={c.sources || []} items={items} setOpenId={setOpenId} />
                <div className="lb-actions">
                  {recorded.has(c.subject)
                    ? <span className="lb-meta">Recorded</span>
                    : <button onClick={() => act(s => recordChoice(s, { ...c, by: actor, asOf }), said)}>Record this choice</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form ref={formRef} className="lb-form lb-section" onSubmit={x => {
        x.preventDefault();
        if (!form.subject.trim()) { setNotice({ kind: 'refused', text: 'A choice needs a subject.' }); return; }
        if (act(s => recordChoice(s, { ...form, needs: form.needs || undefined, by: actor, asOf }), said)) setForm(blank);
      }}>
        <h2>Record your own</h2>
        <label>Subject<input value={form.subject} onChange={x => setForm({ ...form, subject: x.target.value })} /></label>
        <label>Choice<select value={form.verdict} onChange={x => setForm({ ...form, verdict: x.target.value })}>{Object.entries(CHOICES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>Reason<textarea rows={2} value={form.rationale} onChange={x => setForm({ ...form, rationale: x.target.value })} /></label>
        <label>Whose decision it needs<select value={form.needs} onChange={x => setForm({ ...form, needs: x.target.value })}><option value="">No one else's</option>{Object.entries(POWERS).map(([k, n]) => <option key={k} value={k}>{cap(n)}</option>)}</select></label>
        <div className="lb-actions"><button className="lb-primary" type="submit">Record</button></div>
      </form>

      <section className="lb-section">
        <h2>Recorded</h2>
        {state.choices.length ? (
          <ul className="lb-findings">
            {state.choices.map(c => {
              const mine = c.status === 'awaiting decision' && c.needs && canDecide(brand, actor, c.needs);
              return (
                <li key={c.id}>
                  <p><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale}</p>
                  <p className="lb-meta">{choiceStatus(c, brand)}.</p>
                  {mine && declining.id !== c.id && (
                    <div className="lb-actions">
                      <button className="lb-primary" onClick={() => act(s => answerChoice(s, c.id, { by: actor, outcome: 'accept', asOf }), 'Accepted.')}>Accept</button>
                      <button onClick={() => setDeclining({ id: c.id, note: '' })}>Decline</button>
                    </div>
                  )}
                  {mine && declining.id === c.id && (
                    <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => answerChoice(s, c.id, { by: actor, outcome: 'decline', note: declining.note, asOf }), 'Declined. The choice stays on record.')) setDeclining({ id: null, note: '' }); }}>
                      <label>Why it is declined<input value={declining.note} onChange={x => setDeclining({ ...declining, note: x.target.value })} /></label>
                      <div className="lb-actions"><button type="submit">Decline it</button><button type="button" onClick={() => setDeclining({ id: null, note: '' })}>Cancel</button></div>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <p className="lb-missing">Nothing recorded yet.</p>}
      </section>
    </article>
  );
}

const proposalOutcome = (p, brand) => {
  const by = p.decided ? ` by ${person(brand, p.decided.by)} on ${fmt(p.decided.date)}` : '';
  const note = p.decided?.note ? `: ${stop(p.decided.note)}` : '';
  if (p.status === 'adopted') return `Adopted${by}${note}.`;
  if (p.status === 'rejected') return `Turned down${by}${note}.`;
  if (p.status === 'revise') return `Sent back${by}${note}. It can be proposed again with the change.`;
  if (p.status === 'superseded') return 'Closed when the standing of this material changed.';
  return `${cap(p.status)}.`;
};

function Proposals({ asOf, state, brand, items, setOpenId, act, decider, only }) {
  const [doing, setDoing] = useState({ id: null, outcome: null, scope: '', checked: '', note: '' });
  const list = state.proposals.filter(p => !only || only(p));
  if (!list.length) return <p className="lb-missing">No proposals.</p>;
  const none = { id: null, outcome: null, scope: '', checked: '', note: '' };
  // A note every waiting proposal carries is said once, above them.
  const waiting = list.filter(p => p.status === 'open');
  const common = waiting.length > 1 ? waiting[0].warnings.filter(w => waiting.every(p => p.warnings.includes(w))) : [];
  return (<>
    {common.length > 0 && (<>
      <p className="lb-body">Every proposal waiting here carries these notes:</p>
      <ul className="lb-warnings lb-warnings-common">{common.map(w => <li key={w}>{w}</li>)}</ul>
    </>)}
    <ul className="lb-findings">
      {list.map(p => {
        const item = items[p.itemId];
        const mine = decider && item && canDecide(brand, decider, powerFor(item));
        const stated = item && p.to === 'canon' ? rulesStatedBy(brand, item.id) : [];
        const unchecked = item && pipelineRank(item.pipeline) < pipelineRank('verified');
        const open = p.status === 'open';
        const here = doing.id === p.id;
        return (
          <li key={p.id}>
            <p><strong><Cite id={p.itemId} items={items} setOpenId={setOpenId} />: {STANDING_CLASSES[p.from].name} to {STANDING_CLASSES[p.to].name}.</strong> {p.rationale}</p>
            <p className="lb-meta">{p.by !== 'intake' ? `Proposed by ${person(brand, p.by)} on ${fmt(p.date)}. ` : ''}{open ? `Waiting for ${who(brand, p.reviewer)}.` : proposalOutcome(p, brand)}{p.scope && open ? ` It would cover: ${lower(stop(p.scope))}.` : ''}</p>
            {p.evidenceIds.length > 0 && <ul className="lb-list">{brand.items.flatMap(i => i.evidence || []).filter(x => p.evidenceIds.includes(x.id)).map(x => <li key={x.id}>{x.statement} <span className="lb-meta">{String(x.basis).replace(/_/g, ' ')}</span></li>)}</ul>}
            {open && p.warnings.some(w => !common.includes(w)) && <ul className="lb-warnings">{p.warnings.filter(w => !common.includes(w)).map(w => <li key={w}>{w}</li>)}</ul>}
            {open && stated.length > 0 && (<>
              <p className="lb-body">Adopting it puts these rules in force:</p>
              <ul className="lb-list">{stated.map(r => <li key={r.id}>{r.statement}</li>)}</ul>
            </>)}
            {open && mine && !here && (
              <div className="lb-actions">
                <button className="lb-primary" onClick={() => setDoing({ ...none, id: p.id, outcome: 'adopt', scope: p.scope || '' })}>Adopt</button>
                <button onClick={() => setDoing({ ...none, id: p.id, outcome: 'revise' })}>Ask for revision</button>
                <button onClick={() => setDoing({ ...none, id: p.id, outcome: 'reject' })}>Reject</button>
              </div>
            )}
            {open && mine && here && doing.outcome === 'adopt' && (
              <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => decide(s, p.id, { by: decider, outcome: 'adopt', scope: doing.scope, checked: doing.checked, asOf }), 'Adopted. The previous standing is kept in the record.')) setDoing(none); }}>
                {p.to === 'canon' && <label>What this canon covers<input value={doing.scope} onChange={x => setDoing({ ...doing, scope: x.target.value })} placeholder="The website only" /></label>}
                {p.to === 'canon' && unchecked && <label>What you checked this record against<input value={doing.checked} onChange={x => setDoing({ ...doing, checked: x.target.value })} placeholder="The live site, today" /></label>}
                {p.to === 'canon' && <p className="lb-body">Adopting it as canon also records your approval of it.</p>}
                <div className="lb-actions"><button className="lb-primary" type="submit">Adopt it</button><button type="button" onClick={() => setDoing(none)}>Cancel</button></div>
              </form>
            )}
            {open && mine && here && doing.outcome !== 'adopt' && (
              <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => decide(s, p.id, { by: decider, outcome: doing.outcome, note: doing.note, asOf }), doing.outcome === 'revise' ? 'Sent back for revision.' : 'Turned down. The proposal stays on record.')) setDoing(none); }}>
                <label>{doing.outcome === 'revise' ? 'What needs to change' : 'Why it is turned down'}<input value={doing.note} onChange={x => setDoing({ ...doing, note: x.target.value })} /></label>
                <div className="lb-actions"><button type="submit">{doing.outcome === 'revise' ? 'Send it back' : 'Turn it down'}</button><button type="button" onClick={() => setDoing(none)}>Cancel</button></div>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  </>);
}

/* Organize --------------------------------------------------------------- */
function Questions({ asOf, state, brand, act, actor, stance }) {
  const e = state.engagement;
  const [open, setOpen] = useState({ q: null, text: '' });
  // A study's unknowns are questions for the company. An owner's are questions for them.
  const all = [...new Set([...(e.questions || []), ...(stance !== 'visitor' ? brand.unknowns || [] : [])])];
  if (!all.length) return null;
  const answers = state.answers || [];
  const canWrite = e.grant?.powers?.includes('propose');
  return (
    <section className="lb-section">
      <h2>{stance === 'owner' ? 'Questions only you can answer' : `Questions for ${brand.name}`}</h2>
      <ul className="lb-findings">
        {all.map(q => {
          const given = answers.filter(a => a.question === q);
          return (
            <li key={q}>
              <p>{q}</p>
              {given.map(a => <p key={a.id}><strong>Answered by {person(brand, a.by)} on {fmt(a.date)}.</strong> {a.answer}</p>)}
              {canWrite && open.q !== q && <div className="lb-actions"><button onClick={() => setOpen({ q, text: '' })}>{given.length ? 'Add to the answer' : 'Answer'}</button></div>}
              {canWrite && open.q === q && (
                <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => recordAnswer(s, { question: q, answer: open.text, by: actor, asOf }), 'Answer recorded.')) setOpen({ q: null, text: '' }); }}>
                  <label>{stance === 'study' ? 'What you found' : 'Your answer'}<textarea rows={2} value={open.text} onChange={x => setOpen({ ...open, text: x.target.value })} /></label>
                  <div className="lb-actions"><button className="lb-primary" type="submit">Record the answer</button><button type="button" onClick={() => setOpen({ q: null, text: '' })}>Cancel</button></div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Organize({ asOf, state, brand, items, act, actor, setOpenId, pkg, setPkg, setNotice, stance }) {
  const e = state.engagement;
  const brief = buildBrief(brand, e, state.choices, { asOf });
  const study = stance === 'study';
  const partner = e.partner;
  const ask = seq => buildContextPackage(state, { partner: { id: partner.id, name: partner.name }, assignment: partner.assignment, channels: partner.channels, workTypes: partner.workTypes, powers: ['read'], expires: partner.expires, asOf, seq });
  const issue = () => {
    try {
      const issued = (pkg?.issued || 0) + 1;
      setPkg({ ...ask(issued), issued });
      setNotice({ kind: 'ok', text: `Context package issued. Switch the viewer to ${partner.name} to see what it receives.` });
    } catch (err) { setNotice({ kind: 'refused', text: err.message }); }
  };
  const revoked = pkg?.package.revokedAt;
  const lapsed = pkg && !revoked && !packageValid(pkg.package, asOf);
  // What the package holds that the record would no longer hand over today.
  let gone = [];
  if (pkg && !revoked && !lapsed) { try { const now = ask(pkg.issued); gone = pkg.package.included.filter(i => !now.package.included.some(n => n.id === i.id)); } catch { gone = []; } }
  return (
    <article>
      <h1>{e.reading?.organize?.headline || `${brief.title}: the brief`}</h1>
      <p className="lb-deck">{e.reading?.organize?.deck || [brief.objective, brief.audience ? `For ${lower(brief.audience)}.` : ''].filter(Boolean).join(' ')}</p>

      <Questions asOf={asOf} state={state} brand={brand} act={act} actor={actor} stance={stance} />

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
        {state.choices.length ? <ul className="lb-list">{state.choices.map(c => <li key={c.id}><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale} {c.status !== 'recorded' && <em>({lower(choiceStatus(c, brand))})</em>}</li>)}</ul>
          : <p className="lb-missing">No choices recorded yet. Record them in Choose.</p>}
      </section>

      {brief.rules.length > 0 && (
        <section className="lb-section">
          <h2>Rules that apply</h2>
          <ul className="lb-list">{brief.rules.map(r => <li key={r.id}>{r.statement} <span className="lb-meta">{STANDING_CLASSES[r.standing]?.name || cap(r.standing)}</span></li>)}</ul>
        </section>
      )}

      {brief.snapshot.length > 0 && (
        <section className="lb-section">
          <h2>Sources, as they stood on {fmt(brief.frozenAt)}</h2>
          <table className="lb-table">
            <thead><tr><th>Source</th><th>Standing</th><th>Stage</th></tr></thead>
            <tbody>{brief.snapshot.map(s => <tr key={s.id}><td><Cite id={s.id} items={items} setOpenId={setOpenId} /></td><td>{STANDING_CLASSES[s.standing].name}</td><td>{cap(s.pipeline)}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {partner && !study && e.grant?.powers?.includes('share') && (
        <section className="lb-section">
          <h2>Collaborators</h2>
          <p className="lb-body">{partner.name} needs the rules and cleared material for its assignment, not the research or the strategy. Its package is read-only, expires on {fmt(partner.expires)}, and can be revoked.</p>
          {revoked && <p className="lb-body">The package was revoked on {fmt(revoked)}. {partner.name} can no longer read it. What it held is listed below.</p>}
          {lapsed && <p className="lb-body">The package issued earlier ended on {fmt(pkg.package.expires)}. {partner.name} can no longer read it.</p>}
          {gone.length > 0 && <p className="lb-body">Since the package was issued, {gone.map(i => i.title).join(', ')} {gone.length === 1 ? 'is' : 'are'} no longer cleared to share. Revoke it and issue a new one.</p>}
          <div className="lb-actions">
            {!pkg && <button className="lb-primary" onClick={issue}>Issue a context package</button>}
            {pkg && !revoked && !lapsed && <button onClick={() => { setPkg({ ...pkg, package: revokePackage(pkg.package, asOf) }); setNotice({ kind: 'ok', text: 'Package revoked.' }); }}>Revoke the package</button>}
            {(revoked || lapsed) && <button onClick={issue}>Issue a new package</button>}
          </div>
          {pkg && (
            <div className="lb-two">
              <div><h3>Included</h3><ul className="lb-list">{pkg.package.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></div>
              <div><h3>Withheld</h3><ul className="lb-list">{pkg.audit.withheld.map(i => <li key={i.id}>{i.title}: {i.reasons[0]}</li>)}</ul></div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

/* Transfer --------------------------------------------------------------- */
function Transfer({ catalog, asOf, state, brand, pkg, stance }) {
  const e = state.engagement;
  const brief = buildBrief(brand, e, state.choices, { asOf });
  const handoff = buildHandoff(state, { brief, asOf, packages: pkg ? [pkg.package] : [] });
  const bench = exportWorkbench(catalog.practitioner);
  const study = stance === 'study';
  const slug = brand.id;
  const [shown, setShown] = useState(null);
  const offer = (name, data) => setShown(save(name, data));
  return (
    <article>
      <h1>{e.reading?.transfer?.headline || (study ? `What a study of ${brand.name} can and cannot hand over` : stance === 'owner' ? `The record of this pass, for ${brand.name} to keep` : `Leave ${brand.name} more capable than you found it`)}</h1>
      <p className="lb-deck">{e.reading?.transfer?.deck || (study
        ? `This package is yours. ${brand.name} did not commission it. It keeps every source with its link, your reading, your choices and the questions only ${brand.name} can answer.`
        : `The engagement package belongs to ${brand.name}. It keeps the sources with their provenance, the interpretation, every choice, proposal and decision, and the questions still open.`)}</p>
      <section className="lb-section lb-two">
        <div>
          <h2>{study ? 'The study holds' : `${brand.name} keeps`}</h2>
          <ul className="lb-list">
            <li>Every source, with where it came from, its stage and its rights</li>
            <li>Every choice, proposal, decision and answer, with who made it</li>
            <li>The tensions not yet resolved, and the questions still open</li>
            <li>The interpretation{brief.evaluation.length ? ', and the brief with its evaluation set before the work' : ' and the brief'}</li>
          </ul>
          {handoff.notCompleted.length > 0 && (<>
            <h3>Not done here</h3>
            <p className="lb-body">{cap(handoff.notCompleted.join(', '))}. {handoff.completed.length ? `${cap(handoff.completed.join(' and '))} is what this was; the rest are separate pieces of work.` : 'Each is a separate piece of work.'}</p>
          </>)}
          <div className="lb-actions">
            <button className="lb-primary" onClick={() => offer(`${slug}.packet.json`, toPacket(state))}>Download the packet</button>
            <button onClick={() => offer(`${slug}-engagement-package.json`, handoff)}>Download the engagement package</button>
          </div>
          <p className="lb-body">What you record on this page is saved in this browser only. The packet is the whole record in one plain file: download it to keep your work, to move it, or to carry on in conversation through the connector. The engagement package is the same record written out for someone to read.</p>
        </div>
        {stance === 'visitor' && (
          <div>
            <h2>You keep</h2>
            <ul className="lb-list">{bench.methods.map(m => <li key={m}>{m}</li>)}</ul>
            <p className="lb-body">Your methods and preferences, and a record that the engagements happened. No {brand.name} material leaves with you.</p>
            <div className="lb-actions"><button onClick={() => offer('workbench.json', bench)}>Download your workbench</button></div>
          </div>
        )}
      </section>
      {shown && <Export file={shown} />}
    </article>
  );
}

/* Other viewers ---------------------------------------------------------- */
function PersonView({ asOf, state, brand, items, act, setOpenId, personId }) {
  const [asking, setAsking] = useState({ id: null, kind: null, note: '' });
  const none = { id: null, kind: null, note: '' };
  const powers = Object.entries(brand.authority || {}).filter(([, ids]) => ids.includes(personId)).map(([p]) => p);
  const mine = p => items[p.itemId] && canDecide(brand, personId, powerFor(items[p.itemId]));
  const routed = state.choices.filter(c => c.owner === personId && c.needs);
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
          <ul className="lb-findings">{routed.map(c => (
            <li key={c.id}>
              <p><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale}</p>
              <Cites ids={c.sources || []} items={items} setOpenId={setOpenId} />
              {c.status !== 'awaiting decision' && <p className="lb-meta">{choiceStatus(c, brand)}.</p>}
              {c.status === 'awaiting decision' && asking.id !== c.id && (
                <div className="lb-actions">
                  <button className="lb-primary" onClick={() => act(s => answerChoice(s, c.id, { by: personId, outcome: 'accept', asOf }), 'Accepted.')}>Accept</button>
                  <button onClick={() => setAsking({ id: c.id, kind: 'decline', note: '' })}>Decline</button>
                </div>
              )}
              {c.status === 'awaiting decision' && asking.id === c.id && (
                <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => answerChoice(s, c.id, { by: personId, outcome: 'decline', note: asking.note, asOf }), 'Declined. The choice stays on record.')) setAsking(none); }}>
                  <label>Why it is declined<input value={asking.note} onChange={x => setAsking({ ...asking, note: x.target.value })} /></label>
                  <div className="lb-actions"><button type="submit">Decline it</button><button type="button" onClick={() => setAsking(none)}>Cancel</button></div>
                </form>
              )}
            </li>
          ))}</ul>
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
          <ul className="lb-findings">{reused.map(i => <li key={i.id}><p><Cite id={i.id} items={items} setOpenId={setOpenId} /> has been reused {i.reuse.length} times and is still {/^[aeiou]/i.test(STANDING_CLASSES[i.standing].name) ? 'an' : 'a'} {lower(STANDING_CLASSES[i.standing].name)}. Frequency is a reason to look, not a reason to adopt.</p></li>)}</ul>
        </section>
      )}

      {canon.length > 0 && (
        <section className="lb-section">
          <h2>Canon you can retire</h2>
          <ul className="lb-findings">{canon.map(i => (
            <li key={i.id}>
              <p><Cite id={i.id} items={items} setOpenId={setOpenId} />{i.standingRecord?.date ? `, since ${fmt(i.standingRecord.date)}` : ''}</p>
              {asking.id !== i.id && <div className="lb-actions"><button onClick={() => setAsking({ id: i.id, kind: 'retire', note: '' })}>Retire</button></div>}
              {asking.id === i.id && (
                <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => retire(s, i.id, { by: personId, reason: asking.note, asOf }), 'Retired to the learning archive. Its history is kept.')) setAsking(none); }}>
                  <label>Why it is being retired<input value={asking.note} onChange={x => setAsking({ ...asking, note: x.target.value })} /></label>
                  <div className="lb-actions"><button type="submit">Retire it</button><button type="button" onClick={() => setAsking(none)}>Cancel</button></div>
                </form>
              )}
            </li>
          ))}</ul>
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
          {others.map(p => (
            <div className="lb-actions" key={p.id}><button onClick={() => act(s => decide(s, p.id, { by: personId, outcome: 'adopt', scope: p.scope || 'As proposed', asOf }))}>Try to adopt {items[p.itemId].title} as {lower(STANDING_CLASSES[p.to].name)}</button></div>
          ))}
        </section>
      )}
    </article>
  );
}

function Partner({ asOf, pkg: issued, brand }) {
  const pkg = issued?.package;
  if (!pkg) return (<article><h1>No context package has been issued to you</h1><p className="lb-deck">{brand.name}'s material is reachable only through a package the engagement issues. Switch back to the practitioner and issue one in Organize.</p></article>);
  if (pkg.revokedAt) return (<article><h1>Your access to {brand.name} was revoked</h1><p className="lb-deck">Revoked on {fmt(pkg.revokedAt)}. Nothing from the package remains readable here.</p></article>);
  if (!packageValid(pkg, asOf)) return (<article><h1>Your access to {brand.name} has ended</h1><p className="lb-deck">The package ended on {fmt(pkg.expires)}. Nothing from it remains readable here.</p></article>);
  return (
    <article>
      <h1>{pkg.assignment}</h1>
      <p className="lb-deck">For {pkg.brand}. You may read what is below. You may not publish or change the brand's knowledge; work returns to {pkg.review.reviewer || 'the company'} for review. Access ends {fmt(pkg.expires)}.</p>
      <section className="lb-section"><h2>Rules</h2><ul className="lb-list">{pkg.rules.map(r => <li key={r.id}>{r.statement} <span className="lb-meta">{STANDING_CLASSES[r.standing]?.name || cap(r.standing)}</span></li>)}</ul></section>
      <section className="lb-section"><h2>Material you may use</h2><ul className="lb-list">{pkg.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></section>
      {pkg.open.length > 0 && <section className="lb-section"><h2>Unresolved, ask before relying on</h2><ul className="lb-list">{pkg.open.map(o => <li key={o.title}>{stop(o.title)}. Ask {o.ask}.</li>)}</ul></section>}
      <section className="lb-section"><h2>Not shared with you</h2><p className="lb-body">Some of {pkg.brand}'s material is withheld. This package does not name it.</p></section>
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
