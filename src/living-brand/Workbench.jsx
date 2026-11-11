import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  startEngagement, openTenant, search, assessStanding, findTensions, carryForward, changeLedger, organizationalHypotheses,
  propose, decide, retire, recordReuse, recordChoice, answerChoice, withdrawChoice, carryOver, recordAnswer, verifyItem, approveItem, nameAuthority, unnameAuthority,
  viewFor, buildBrief, buildContextPackage, revokePackage, packageValid, buildHandoff, toPacket, coordinationView, exportWorkbench,
  orientation, canDecide, powerFor, deciders, effectiveRules, rulesInForce, rulesStatedBy, timeline, fingerprint, isPublicStudy, basisNote,
  pipelineRank, classOf, kindsOfWork, whyNoStanding, describeItem, decidedEntries, STANDING_CLASSES, PIPELINE, CHOICES, POWERS, BASES,
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
// The person reading the page is "you", wherever the record names them.
const nameFor = (brand, id, me) => (id === me ? 'you' : person(brand, id));
const whoFor = (brand, ids, me) => (ids?.length ? ids.map(id => nameFor(brand, id, me)).join(' or ') : 'no one named');
const plural = (n, one, many) => (n === 1 ? one : many.replace('%', n));
const countWord = n => (['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n));
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
    if (saved.print === print) return { state: saved.state, pkg: saved.pkg || null, pkgs: saved.pkgs || [] };
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
  // A notice is put in the half of the screen the last action was not in, so it never sits on the control just used.
  const lastY = useRef(null);
  const [notice, setNoticeRaw] = useState(null);
  const setNotice = useCallback(n => setNoticeRaw(typeof n === 'function' ? n : n ? { ...n, top: lastY.current != null && lastY.current > window.innerHeight / 2 } : null), []);
  useEffect(() => {
    // The next tap anywhere else ends a notice; the tap itself still does what it was meant to.
    const point = e => { lastY.current = e.clientY; if (!e.target?.closest?.('.lb-notice')) setNoticeRaw(null); };
    const key = () => { const r = document.activeElement?.getBoundingClientRect?.(); if (r && r.height) lastY.current = r.top + r.height / 2; };
    document.addEventListener('pointerdown', point, true);
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('pointerdown', point, true); document.removeEventListener('keydown', key, true); };
  }, []);
  // Whether this browser keeps anything at all is known at once; a write that fails later is reported when it fails.
  const [unsaved, setUnsaved] = useState(() => { const ok = write(`${STORE}:probe`, 1); drop(`${STORE}:probe`); return !ok; });
  const [setAside, setSetAside] = useState(0);
  const [file, setFile] = useState(null);
  const [discarding, setDiscarding] = useState(false);
  const topRef = useRef(null);
  const navRef = useRef(null);

  // Read after restore has run, so work set aside in this render is seen.
  const earlier = useMemo(() => { void setAside; void loadedKey; const saved = read(earlierKey); return usable(saved) ? saved : null; }, [earlierKey, setAside, loadedKey]);
  // That it was brought across is kept with the earlier session, so the offer does not come back on a reload.
  const brought = Boolean(earlier?.brought);

  useEffect(() => {
    if (loadedKey !== storeKey || !state) return;
    if (!write(storeKey, { state, pkg, pkgs: all.pkgs || [], print })) queueMicrotask(() => setUnsaved(true));
  }, [state, pkg, all.pkgs, storeKey, loadedKey, print]);
  // A confirmation has done its job after a few seconds. A refusal stays longer, and either goes at the next action.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(n => (n === notice ? null : n)), notice.kind === 'refused' ? 12000 : 6000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);
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
  // After a change of stage or seat, focus is on the new headline, so a keyboard or a screen reader starts where the eye does.
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const h = document.querySelector('.lb-main h1');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }, [stage, viewer, engId]);

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
            <label className="lb-viewer"><span>Brand</span>
              <select value={engId} onChange={e => setEngId(e.target.value)}>{catalog.open.map(e => <option key={e.engagement.id} value={e.engagement.id}>{e.brand.name}</option>)}</select>
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
  // Every package issued is kept, the revoked ones too: the list is the record of what was handed out.
  const setPkg = p => setAll(a => ({ ...a, pkg: p, pkgs: p ? [...(a.pkgs || []).filter(x => x.package.id !== p.package.id), p] : (a.pkgs || []) }));
  const bring = () => {
    try {
      const r = carryOver(state, earlier.state);
      setAll(a => ({ ...a, state: r.state }));
      write(earlierKey, { ...earlier, brought: true }); setSetAside(n => n + 1);
      const came = [r.carried.answers ? plural(r.carried.answers, 'one answer', '% answers') : null, r.carried.choices ? plural(r.carried.choices, 'one choice', '% choices') : null].filter(Boolean).join(' and ');
      setNotice({ kind: 'ok', text: `${came ? `${cap(came)} brought across.` : 'There were no answers or choices to bring across.'}${r.left.decisions ? ' Decisions about material were not: make them again against these records.' : ''}` });
    } catch (e) { setNotice({ kind: 'refused', text: e.message }); }
  };
  const reset = () => { setAll(begin(entry, asOf)); setNotice({ kind: 'ok', text: 'Reset to the starting material.' }); };
  const switchTo = id => { setEngId(id); setOpenId(null); setNotice(null); setFile(null); setViewer('practitioner'); setStage('enter'); window.scrollTo(0, 0); };

  const open = openId ? items[openId] : null;
  const go = k => { moved.current = true; setStage(k); setNotice(null); window.scrollTo(0, 0); };
  const ctx = { catalog, asOf, state, brand, items, tensions, act, actor, me: actor, setOpenId, go, pkg, pkgs: all.pkgs || [], setPkg, setNotice, switchTo, stance, demo };

  return (
    <div className="lb">
      <header className="lb-top" ref={topRef}>
        <div className="lb-brandline">
          {catalog.homeHref === null
            ? <span className="lb-home lb-home-plain">{catalog.homeLabel}</span>
            : <a className="lb-home" href={catalog.homeHref || '/'}>{catalog.homeLabel || 'Field of Action'}</a>}
          {/* The one line that must never scroll away on a study. */}
          {study && <span className="lb-study">A study of {brand.name}. Not its record.</span>}
        </div>
        <div className="lb-controls">
          {catalog.open.length > 1 && (
            <label className="lb-viewer">
              <span>Brand</span>
              <select value={engId} onChange={e => switchTo(e.target.value)}>
                {catalog.open.map(e => <option key={e.engagement.id} value={e.engagement.id}>{e.brand.name}</option>)}
              </select>
            </label>
          )}
          {viewers.length > 1 && (
            <label className="lb-viewer">
              <span>Viewing as</span>
              <select value={view} onChange={e => { moved.current = true; setViewer(e.target.value); setNotice(null); setOpenId(null); window.scrollTo(0, 0); }}>
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
          <p>{brought
            ? 'The records behind this page were rebuilt after your last session on it. Your answers and choices from that session have been brought across. Its decisions about material were not; the earlier session is kept until you discard it.'
            : 'The records behind this page were rebuilt after your last session on it. What you recorded then is kept. Your answers and choices can be brought across. Decisions about material have to be made again, because the material may have changed under them.'}</p>
          <div className="lb-actions">
            {!brought && <button onClick={bring}>Bring over my answers and choices</button>}
            <button onClick={() => setFile(save(`${brand.id}-earlier-session.packet.json`, toPacket(earlier.state)))}>Download the earlier session</button>
            {!discarding && <button onClick={() => setDiscarding(true)}>Discard it</button>}
            {discarding && (<>
              <button autoFocus onClick={() => { drop(earlierKey); setSetAside(n => n + 1); setFile(null); setDiscarding(false); setNotice({ kind: 'ok', text: 'The earlier session was discarded.' }); }}>Yes, discard the earlier session</button>
              <button onClick={() => setDiscarding(false)}>Keep it</button>
            </>)}
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
        <div className={`lb-notice lb-notice-${notice.kind}${notice.top ? ' is-top' : ''}`} role="status">
          <p>{notice.text}</p>
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

/* Enter ------------------------------------------------------------------ */
// A section a first reading does not need. Its heading is the control that opens it.
function Closed({ title, children }) {
  return (
    <details className="lb-section lb-closed">
      <summary><h2>{title}</h2></summary>
      <div className="lb-closed-body">{children}</div>
    </details>
  );
}

function Enter({ catalog, asOf, state, brand, items, act, actor, setOpenId, go, setNotice, switchTo, reset, stance }) {
  const e = state.engagement;
  const study = stance === 'study';
  const canName = !study && e.grant?.powers?.includes('steward');
  const [naming, setNaming] = useState({ open: false, power: '', name: '' });
  const [resetting, setResetting] = useState(false);
  const [removing, setRemoving] = useState(null);
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
  // What the reader may do here, and who decides. Written once; which comes first depends on the seat.
  const role = (
      <section className="lb-section">
        <h2>Role and authority</h2>
        <dl className="lb-facts">
          <dt>Role</dt><dd>{e.role}{e.invitedBy ? `, invited by ${person(brand, e.invitedBy)}` : ''}</dd>
          <dt>Basis</dt><dd>{BASES[brand.basis || 'company-record'].name}. {basisNote({ ...brand, basis: brand.basis || 'company-record' })}</dd>
          {study ? (<>
            <dt>May</dt><dd>Read public material and record a reading of it</dd>
            <dt>May not</dt><dd>Speak for {brand.name}, adopt or retire anything, or use its marks and artwork</dd>
            <dt>Access</dt><dd>None granted. Public sources, read on {fmt(e.started || asOf)}</dd>
          </>) : (<>
            <dt>May</dt><dd>{may}</dd>
            <dt>May not</dt><dd>{mayNot}</dd>
            {e.grant.expires && (<><dt>Access ends</dt><dd>{fmt(e.grant.expires)}</dd></>)}
          </>)}
          {e.scope && (<><dt>Scope</dt><dd>{e.scope}</dd></>)}
          {e.constraints?.length > 0 && (<><dt>Constraints</dt><dd>{e.constraints.map(c => stop(c)).join('. ')}.</dd></>)}
        </dl>
        <p className="lb-body">{e.modeNote || `This is ${e.mode === 'audit' ? 'a brand audit' : e.mode === 'planning' ? 'execution planning' : e.mode === 'orientation' ? 'a rapid orientation' : 'a creative investigation'}. ${done.length ? `${cap(done.join(' and '))} is done. ` : ''}Finishing this does not finish the other kinds of work.`}</p>
        {catalog.note && <p className="lb-body">{catalog.note}</p>}
        {e.materials?.length > 0 && (<><h3>Material to start from</h3><Cites ids={e.materials} items={items} setOpenId={setOpenId} /></>)}
      </section>
  );
  const who = (
      <section className="lb-section">
        <h2>Who decides at {brand.name}</h2>
        {study && <p className="lb-body">This study does not know who decides {areas.map(([, label]) => label).join(', ').replace(/, ([^,]*)$/, ' or $1')} at {brand.name}, and a study from public sources cannot establish it. It is the first thing to ask {brand.name}.</p>}
        {!study && (
          <table className="lb-table">
            <thead><tr><th>Decision</th><th>Decided by</th></tr></thead>
            <tbody>{areas.map(([power, label]) => {
              const named = deciders(brand, power);
              return (
                <tr key={power}><td>{cap(label)}</td><td>
                  {named.length ? named.map(d => {
                    const key = `${power}:${d.id}`;
                    return (
                      <span key={d.id} className="lb-named">{stance === 'owner' && d.id === actor ? 'You' : d.name}
                        {canName && removing !== key && <> <button className="lb-link" onClick={() => setRemoving(key)}>Remove</button></>}
                        {canName && removing === key && (<>
                          {' '}<button autoFocus className="lb-link" onClick={() => { act(s => unnameAuthority(s, { power, personId: d.id, by: actor, asOf }), d.id === actor ? `You are no longer named for ${label}. What was waiting for you waits again.` : `${d.name} is no longer named for ${label}. What was waiting for them waits again.`); setRemoving(null); }}>{stance === 'owner' && d.id === actor ? 'Yes, remove me' : `Yes, remove ${d.name}`}</button>
                          {' '}<button className="lb-link" onClick={() => setRemoving(null)}>Keep</button>
                        </>)}
                      </span>
                    );
                  }) : 'No one named'}
                </td></tr>
              );
            })}</tbody>
          </table>
        )}
        {canName && unnamed.length > 0 && !naming.open && <div className="lb-actions"><button onClick={() => setNaming({ ...naming, open: true })}>Name who decides</button></div>}
        {canName && unnamed.length > 0 && naming.open && (
          <form className="lb-form lb-inline" onSubmit={ev => {
            ev.preventDefault();
            const name = naming.name.trim(); const power = naming.power || unnamed[0][0];
            if (!name) { setNotice({ kind: 'refused', text: 'Name the person.' }); return; }
            if (act(s => nameAuthority(s, { power, person: { name }, by: actor, asOf }), next => (next.brand.authority[power].includes(actor) ? `You now decide ${POWERS[power]}.` : `${next.brand.people[next.brand.authority[power].at(-1)].name} now decides ${POWERS[power]}.`))) setNaming({ open: false, power: '', name: '' });
          }}>
            <p className="lb-body">You hold the power to name who decides each area, yourself included: for yourself, write "me". A naming is recorded with the date and can be taken back.</p>
            <label>Decision<select value={naming.power || unnamed[0][0]} onChange={ev => setNaming({ ...naming, power: ev.target.value })}>{unnamed.map(([power, label]) => <option key={power} value={power}>{cap(label)}</option>)}</select></label>
            <label>Person<input autoFocus value={naming.name} onChange={ev => setNaming({ ...naming, name: ev.target.value })} /></label>
            <div className="lb-actions"><button className="lb-primary" type="submit">Name them</button><button type="button" onClick={() => setNaming({ open: false, power: '', name: '' })}>Cancel</button></div>
          </form>
        )}
      </section>
  );
  return (
    <article>
      <h1>{e.project}</h1>
      <p className="lb-deck">{e.purpose}</p>

      {/* What is waiting comes first. For someone who decides here that is who decides; for anyone else, what they may do. */}
      {stance === 'owner' ? <>{who}{role}</> : <>{role}{who}</>}

      {stance === 'visitor' && (
        <Closed title="Where this engagement sits">
          <Nesting catalog={catalog} brand={brand} engagement={e} />
        </Closed>
      )}

      {stance === 'visitor' && (
        <Closed title="Your engagements">
          <table className="lb-table lb-table-stack">
            <thead><tr><th>Client</th><th>Role</th><th>Access</th><th>Open</th></tr></thead>
            <tbody>
              {catalog.open.map(o => (
                <tr key={o.engagement.id}><td>{o.brand.name}</td><td data-th="Role">{o.engagement.role}</td>
                  <td data-th="Access">{isPublicStudy(o.brand) ? 'Public sources only' : o.engagement.grant.expires ? `Until ${fmt(o.engagement.grant.expires)}` : 'Open'}</td>
                  <td>{o.engagement.id === e.id ? 'Open now' : <button className="lb-link" onClick={() => switchTo(o.engagement.id)}>Open {o.brand.name}</button>}</td></tr>
              ))}
              {(catalog.closed || []).map(c => (
                <tr key={c.id}><td>{c.clientLabel}</td><td data-th="Role">{c.role}</td><td data-th="Access">Ended {fmt(c.grant.revokedAt)}</td>
                  <td><button className="lb-link" onClick={() => tryOpen(c)}>Try to open {c.clientLabel}</button></td></tr>
              ))}
            </tbody>
          </table>
          <p className="lb-body">Each engagement opens its own partition. Searching one never reaches another, even where two clients use the same words. Your methods travel with you; their material does not.</p>
        </Closed>
      )}

      <Closed title="Start over">
        <p className="lb-body">Resetting removes every {study ? 'choice, note and answer' : 'choice, proposal, decision and answer'} recorded on this page and returns to the starting material. Download the packet in Transfer first if you want to keep them.</p>
        <div className="lb-actions">
          {!resetting && <button onClick={() => setResetting(true)}>Reset this engagement</button>}
          {resetting && (<>
            <button autoFocus onClick={() => { reset(); setResetting(false); }}>Yes, remove what was recorded</button>
            <button onClick={() => setResetting(false)}>Keep it</button>
          </>)}
        </div>
      </Closed>
      <NextStep stage="enter" go={go} />
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
  const o = orientation(brand, state.engagement, { asOf, answers: state.answers || [], choices: state.choices });
  const reading = state.engagement.reading?.orient || {};
  const study = stance === 'study';
  const pressing = o.attention.filter(t => t.severity !== 'investigate' || /rights/i.test(t.kind));
  const unnamed = o.attention.find(t => t.unnamed);
  const urgent = unnamed && !pressing.slice(0, 5).includes(unnamed) ? [...pressing.filter(t => t !== unnamed).slice(0, 4), unnamed] : pressing.slice(0, 5);
  const rules = rulesInForce(effectiveRules(brand), asOf);
  const canonRules = rules.filter(r => r.standing === 'canon');
  const otherRules = rules.filter(r => r.standing !== 'canon');
  // Canon that states no rule of its own still governs, and is listed with what it covers.
  const ruled = new Set(canonRules.map(r => r.source));
  const bare = study ? [] : brand.items.filter(i => i.standing === 'canon' && !i.retired && !ruled.has(i.id));
  const unchecked = brand.items.filter(i => pipelineRank(i.pipeline) < pipelineRank('verified'));
  const found = brand.items.filter(i => i.pipeline === 'discovered');
  const rest = o.attention.length - urgent.length;
  const checked = `${unchecked.length
    ? `${unchecked.length === brand.items.length ? (brand.items.length === 1 ? 'The one piece here has' : `None of the ${brand.items.length} pieces here has`) : `${unchecked.length} of the ${brand.items.length} pieces here ${unchecked.length === 1 ? 'has' : 'have'} not`} been checked against ${unchecked.length === 1 || unchecked.length === brand.items.length ? 'its' : 'their'} source${found.length ? `, and ${found.length === 1 ? 'one has' : `${found.length} have`} only been found` : ''}.`
    : `All ${brand.items.length} pieces here have been checked against their source.`} A record counts as checked only once someone has compared it with its source${study ? '.' : ', and as approved only once someone with authority has said so.'}`;
  return (
    <article>
      <h1>{reading.headline || `What ${brand.name} says it is for`}</h1>
      <p className="lb-deck">{reading.deck || o.intent?.statement}</p>
      {/* What has to be looked at before anything is made comes first, and says how much more there is. */}
      {urgent.length > 0 && (
        <section className="lb-section">
          <h2>{study ? 'What to look at first' : 'What needs attention before anything is made'}</h2>
          <ul className="lb-findings">{urgent.map(t => <li key={t.id}><p>{stop(t.title)}.</p></li>)}</ul>
          <p className="lb-body">{rest > 0 ? `${cap(countWord(rest))} more ${rest === 1 ? 'is' : 'are'} in Interpret, each with what it rests on. ` : ''}{checked}</p>
          <div className="lb-actions"><button onClick={() => go('interpret')}>Read each one in Interpret</button></div>
        </section>
      )}
      {!urgent.length && <section className="lb-section"><h2>How far the record has been checked</h2><p className="lb-body">{checked}</p></section>}
      {o.strengths.length > 0 && (
        <section className="lb-section">
          <h2>{study ? 'What this study reads as holding' : 'What holds'}</h2>
          <ul className="lb-findings">
            {o.strengths.map(s => <li key={s.statement}><p>{s.statement}</p><Cites ids={s.sources} items={items} setOpenId={setOpenId} /></li>)}
          </ul>
        </section>
      )}
      {o.intent?.statement && reading.deck && (
        <section className="lb-section">
          <h2>Stated intent</h2>
          <p className="lb-lead">{o.intent.statement}</p>
          {o.intent.source && <Cite id={o.intent.source} items={items} setOpenId={setOpenId} />}
        </section>
      )}
      {o.unknowns.length > 0 && (
        <section className="lb-section">
          <h2>{stance === 'owner' ? 'What these files do not say' : 'What is not known'}</h2>
          <ul className="lb-list">{o.unknowns.slice(0, 5).map(u => <li key={u}>{u}</li>)}</ul>
          {o.unknowns.length > 5 && (
            <details className="lb-more"><summary>The rest of the list</summary><ul className="lb-list">{o.unknowns.slice(5).map(u => <li key={u}>{u}</li>)}</ul></details>
          )}
          {stance !== 'visitor' && <div className="lb-actions"><button onClick={() => go('organize')}>{stance === 'owner' ? 'Answer them in Organize' : 'Record what you find in Organize'}</button></div>}
        </section>
      )}
      {/* The rules are reference: one step away, under the heading that says which they are. */}
      {(canonRules.length > 0 || bare.length > 0) && (
        <Closed title={study ? 'What this study reads as current' : 'What governs work now'}>
          <RuleGroups rules={canonRules} bare={bare} brand={brand} items={items} setOpenId={setOpenId} canon study={study} />
        </Closed>
      )}
      {otherRules.length > 0 && (
        <Closed title={study ? 'Also on the public record' : canonRules.length ? 'Written down, not adopted' : 'Nothing is canon yet. These rules are written down, not adopted'}>
          <RuleGroups rules={otherRules} brand={brand} items={items} setOpenId={setOpenId} study={study} />
        </Closed>
      )}
      <NextStep stage="orient" go={go} />
    </article>
  );
}

// Rules grouped under the material that states them, so forty rules read as a handful of sources.
function RuleGroups({ rules, bare = [], brand, items, setOpenId, canon = false, study = false }) {
  const bySource = rules.reduce((a, r) => ({ ...a, [r.source]: [...(a[r.source] || []), r] }), {});
  const many = rules.length > 12;
  const about = (source, list) => {
    const item = items[source];
    if (canon) {
      const since = item?.standingRecord?.date || list.map(r => r.effective?.from).filter(Boolean).sort()[0];
      const covers = item?.standingRecord?.decisionId && item.standingRecord.scope ? `It covers: ${stop(item.standingRecord.scope)}` : null;
      const held = (brand.rules || []).filter(r => r.source === source && r.heldBack).length;
      return [since ? `${study ? 'Read as current since' : 'Since'} ${fmt(since)}` : null, covers, held ? plural(held, 'One rule it states was held back', '% rules it states were held back') : null].filter(Boolean).join('. ');
    }
    if (study) return classOf(list[0]?.standing || item?.standing, brand).name;
    const heldBack = list.filter(r => r.heldBack).length;
    return [item?.provenance?.origin === 'generated' ? 'Written by a model' : '', heldBack ? (heldBack === list.length ? 'Held back when its source was adopted' : plural(heldBack, 'One was held back when its source was adopted', '% were held back when their source was adopted')) : ''].filter(Boolean).join('. ');
  };
  return (
    <ul className="lb-findings">
      {Object.entries(bySource).map(([source, list]) => {
        const meta = about(source, list);
        // A long rulebook reads as its sources first; each opens to its rules.
        if (many) return (
          <Entry key={source} title={items[source]?.title || source} who={list.length === 1 ? 'One rule' : `${list.length} rules`}>
            {meta && <p>{meta}.</p>}
            <ul className="lb-list">{list.map(r => <li key={r.id}>{r.statement}</li>)}</ul>
            <div><Cite id={source} items={items} setOpenId={setOpenId} /></div>
          </Entry>
        );
        return (
          <li key={source}>
            <p><strong><Cite id={source} items={items} setOpenId={setOpenId} /></strong>{meta && <> {meta}.</>}</p>
            <ul className="lb-list">{list.map(r => <li key={r.id}>{r.statement}</li>)}</ul>
          </li>
        );
      })}
      {bare.map(item => (
        <li key={item.id}>
          <p><strong><Cite id={item.id} items={items} setOpenId={setOpenId} /></strong> {about(item.id, [])}.</p>
          {!rulesStatedBy(brand, item.id).length && !(brand.rules || []).some(r => r.source === item.id) && <p>It states no written rule of its own.</p>}
        </li>
      ))}
    </ul>
  );
}

/* Investigate ------------------------------------------------------------ */
function Investigate({ asOf, state, brand, setOpenId, go, stance }) {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('');
  const found = useMemo(() => search(state, q, { channels: state.engagement.channels || [], asOf }), [state, q, asOf]);
  const hint = state.engagement.searchHint;
  const study = stance === 'study';
  // The classes present are the filter: one tap narrows twenty pieces to the handful that govern, or to what is only on file.
  const classes = Object.keys(STANDING_CLASSES).filter(k => found.some(r => r.item.standing === k));
  const results = only ? found.filter(r => r.item.standing === only) : found;
  // When every piece gives the same three answers, saying it once is the information.
  const same = results.length > 1 && results.every(r => ['authorized', 'reusable', 'authoritative'].every(k => r.standing[k] === results[0].standing[k]));
  const none = same && !results[0].standing.authorized && !results[0].standing.reusable && !results[0].standing.authoritative;
  return (
    <article>
      <h1>The work itself</h1>
      <p className="lb-deck">{study
        ? `Every piece keeps what it was for, when it appeared and what it rests on. ${brand.name} has authorized nothing here and nothing here is its own classification. The pictures are drawn stand-ins, not the work.`
        : 'Every piece keeps its purpose, audience, canvas, dates, rights and standing. Each answers separately whether it is authorized, reusable and authoritative. The pictures are drawn stand-ins, not the work.'}</p>
      <section className="lb-section">
      <h2>{brand.name}'s material</h2>
      <div className="lb-find">
        <label className="lb-search">
          <span>Search</span>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={hint ? `Try ${hint}` : ''} />
        </label>
        {classes.length > 1 && (
          <div className="lb-chips" role="group" aria-label={study ? 'Show by how this study reads it' : 'Show by standing'}>
            <button aria-pressed={!only} onClick={() => setOnly('')}>All</button>
            {classes.map(k => <button key={k} aria-pressed={only === k} onClick={() => setOnly(only === k ? '' : k)}>{classOf(k, brand).name}</button>)}
          </div>
        )}
      </div>
      {q.trim() && !found.length && <p className="lb-body">Nothing in {brand.name}'s material matches.{stance === 'visitor' ? ' Other clients\' material is not searched.' : ''}</p>}
      {!study && results.length > 0 && (none || results.some(r => !r.standing.authorized && !r.standing.reusable && !r.standing.authoritative)) && <p className="lb-body">{none ? 'Nothing here is authorized, reusable or authoritative yet.' : 'A piece with no answers under it is not authorized, reusable or authoritative yet.'}</p>}
      <ul className="lb-grid">
        {results.map(({ item, standing }) => (
          <li key={item.id}>
            <button className="lb-card" onClick={() => setOpenId(item.id)}>
              <Plate item={item} />
              <span className="lb-card-title">{item.title}</span>
              <span className="lb-card-ctx">{[item.workType, item.period?.from?.slice(0, 4)].filter(Boolean).join(', ')}</span>
              {standing.asked && <span className="lb-card-ctx">{standing.reasons.relevant[0]}</span>}
              {!study && (standing.authorized || standing.reusable || standing.authoritative) && <Answers st={standing} compact />}
            </button>
          </li>
        ))}
      </ul>
      </section>
      <NextStep stage="investigate" go={go} />
    </article>
  );
}

// Three answers, kept apart. Whether a piece is relevant is said by the search that found it.
function Answers({ st, compact }) {
  const rows = [['authorized', 'Authorized'], ['reusable', 'Reusable here'], ['authoritative', 'Authoritative']];
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
const EVIDENCE_BASIS = { company_reported: 'the company\'s own report', agency_reported: 'the agency\'s own report', press_report: 'press report', user_report: 'a user\'s report', third_party_copy: 'seen on a third-party copy' };

// Where a record stands between being found and being approved, in a sentence.
function stageLine(item, brand, study, me) {
  const v = item.verification;
  const checked = v ? `Checked against its source by ${nameFor(brand, v.by, me)} on ${fmt(v.date)}: ${stop(v.how)}.` : 'Checked against its source.';
  switch (item.pipeline) {
    case 'discovered': return 'Only found. Nobody has recorded what it is.';
    case 'extracted': return 'Read out of its source. Nobody has checked the record against it.';
    case 'interpreted': return 'Read and described. Nobody has checked the description against its source.';
    case 'verified': return study || item.approval?.status === 'rejected' ? checked : `${checked} Not yet approved.`;
    default: return checked;
  }
}

function Drawer({ asOf, item, state, brand, items, tensions, act, actor, me, setOpenId, go, canWork, actingAs, stance }) {
  const e = state.engagement;
  const study = stance === 'study';
  const st = assessStanding(item, { channels: e.channels || [], asOf, until: e.newBrief?.until, me }, brand);
  // Where the record says this piece departs from canon, its own drawer says so too.
  const departs = tensions.filter(t => t.kind === 'Drift from canon' && t.sources[0] === item.id);
  const [to, setTo] = useState(item.standing === 'canon' ? 'precedent' : 'canon');
  const [why, setWhy] = useState('');
  const [scope, setScope] = useState('');
  const [ev, setEv] = useState([]);
  const [where, setWhere] = useState('');
  const [how, setHow] = useState('');
  const closeRef = useRef(null);
  // Evidence that can be offered for this piece: its own, and that of material the record relates to it, named as such.
  const near = new Set([...(item.relations || []).map(r => r.to), ...brand.items.filter(i => (i.relations || []).some(r => r.to === item.id)).map(i => i.id)]);
  const offered = [
    ...(item.evidence || []).filter(x => x.type !== 'intended').map(x => ({ ...x, from: null })),
    ...brand.items.filter(i => near.has(i.id)).flatMap(i => (i.evidence || []).filter(x => x.type !== 'intended').map(x => ({ ...x, from: i.title }))),
  ];
  const evidenceTypes = [['intended', 'Intended impact'], ['observed', 'Observed outcome'], ['contribution', 'This element\'s contribution'], ['transfer', 'Transfer to other situations']]
    .map(([k, n]) => [n, (item.evidence || []).filter(x => x.type === k)]).filter(([, list]) => list.length);
  const reviewers = deciders(brand, powerFor(item)).map(p => p.id);
  const checkedYet = pipelineRank(item.pipeline) >= pipelineRank('verified');
  const canVerify = canWork && item.pipeline !== 'discovered' && !checkedYet;
  const mine = !study && actingAs && canDecide(brand, actingAs, powerFor(item));
  const awaitingApproval = mine && item.pipeline !== 'discovered' && !item.retired && !['approved', 'published'].includes(item.approval?.status);
  const proposals = state.proposals.filter(p => p.itemId === item.id);
  const kind = classOf(item.standing, brand);
  const heldBack = (brand.rules || []).filter(r => r.source === item.id && r.heldBack);
  // Found or rejected material can be archived and nothing else; the drawer says why instead of offering a form that would fail.
  const noStanding = study ? '' : whyNoStanding(item);
  const [what, setWhat] = useState('');
  const [doing, setDoing] = useState(null);
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = k => k.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    const behind = [...document.querySelectorAll('.lb-top, .lb-basis, .lb-shell, .lb-solo')];
    behind.forEach(n => n.setAttribute('inert', ''));
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); behind.forEach(n => n.removeAttribute('inert')); document.body.style.overflow = scroll; opener?.focus?.(); };
  }, [setOpenId]);
  const dates = item.period?.from ? `${fmt(item.period.from)}${item.period.to && item.period.to !== item.period.from ? ` to ${fmt(item.period.to)}` : ''}` : null;
  const facts = [
    ['Work type', item.workType], ['Element', item.element], ['Canvas', item.canvas], ['Audience', item.audience], ['Meant to', item.intendedOutcome],
    ['Level', cap(item.level)], ['Dates', dates],
    ['About the dates', item.periodNote],
    ['Exposure', item.exposure], ['Made by', item.made?.by],
    ['Found in', item.provenance?.source ? `${item.provenance.source}${item.provenance.origin === 'generated' ? '. Written by a model.' : ''}${item.provenance.confidential ? '. Confidential.' : ''}` : null],
    ['Released', item.released && item.released !== 'public' ? cap(item.released) : null],
  ].filter(([, v]) => v);
  const record = item.standingRecord;
  return (
    <div className="lb-drawer-wrap" onClick={x => x.target === x.currentTarget && setOpenId(null)}>
      <aside className="lb-drawer" role="dialog" aria-modal="true" aria-label={item.title} onKeyDown={k => {
        if (k.key !== 'Tab') return;
        const f = [...k.currentTarget.querySelectorAll('button, a[href], input, select, textarea, summary'), ...document.querySelectorAll('.lb-notice button')].filter(x => !x.disabled);
        if (!f.length) return;
        if (k.shiftKey && document.activeElement === f[0]) { k.preventDefault(); f.at(-1).focus(); }
        else if (!k.shiftKey && document.activeElement === f.at(-1)) { k.preventDefault(); f[0].focus(); }
      }}>
        <button className="lb-close" ref={closeRef} onClick={() => setOpenId(null)}>Close</button>
        <div className="lb-piece">
          <Plate item={item} />
          <h2>{item.title}</h2>
        </div>
        {study && <p className="lb-body">From an independent study of public sources. This is not {brand.name}'s own record.</p>}
        <p className="lb-body">{item.rationale || item.text || 'No rationale recorded.'}</p>

        <h3>{study ? 'For this study' : 'For this project'}</h3>
        <Answers st={st} />

        <h3>{study ? 'How this study reads it' : 'Standing'}</h3>
        <p className="lb-body"><strong>{kind.name}.</strong> {kind.job}
          {!study && item.retired && ` Retired by ${nameFor(brand, item.retired.by, me)} on ${fmt(item.retired.date)}: ${stop(item.retired.reason)}.`}
          {!study && !item.retired && record && record.basis !== 'reading' && ` Set by ${nameFor(brand, record.by, me)} on ${fmt(record.date)}${record.scope ? `. It covers: ${stop(record.scope)}` : ''}.`}</p>
        {heldBack.length > 0 && <p className="lb-body">{plural(heldBack.length, 'One rule it states was held back when it was adopted, and is not in force', '% rules it states were held back when it was adopted, and are not in force')}: {heldBack.map(r => stop(r.statement)).join('; ')}.</p>}
        {item.described && <p className="lb-body">{cap(nameFor(brand, item.described.by, me))} said what it is on {fmt(item.described.date)}: {stop(item.described.what)}.</p>}
        {item.readingWhy && !record?.decisionId && <p className="lb-body">{item.readingWhy}</p>}
        {item.standingHistory?.length > 0 && <p className="lb-body">Before: {item.standingHistory.map(h => `${lower(classOf(h.standing, brand).name)} until ${fmt(h.until)}`).join('; ')}.</p>}
        <p className="lb-body">{stageLine(item, brand, study, me)}</p>
        {departs.map(t => <p key={t.id} className="lb-body">{stop(t.title).replace(item.title, 'It')}. {t.points ? t.points.map(pt => pt.says || `It has ${pt.has}.`).join(' ') : t.detail}</p>)}
        {proposals.some(p => p.status === 'superseded') && <p className="lb-body">{plural(proposals.filter(p => p.status === 'superseded').length, 'One earlier proposal was', '% earlier proposals were')} closed when its standing changed.</p>}
        {proposals.some(p => p.status !== 'superseded') && (
          <ul className="lb-list">{proposals.filter(p => p.status !== 'superseded').map(p => (
            <li key={p.id}>{p.status === 'open'
              ? (study ? `Your note: ${lower(classOf(p.to, brand).name)}. ${p.rationale}` : `A proposal to make it ${lower(classOf(p.to, brand).name)} is waiting for ${whoFor(brand, p.reviewer, me)}.`)
              : proposalOutcome(p, brand, me)}</li>
          ))}</ul>
        )}
        {mine && proposals.some(p => p.status === 'open') && (
          <div className="lb-actions"><button onClick={() => { setOpenId(null); go('choose'); }}>Decide it in Choose</button></div>
        )}

        <h3>Rights</h3>
        <p className="lb-body"><strong>{item.rights?.status === 'own' ? 'The brand\'s own' : study && item.rights?.status === 'cleared' ? 'Open licence' : `${cap(item.rights?.status || 'unknown')}${item.rights?.status === 'cleared' && item.rights.channels?.length && !item.rights.channels.includes('all') ? ` for ${item.rights.channels.map(c => c.replace('-', ' ')).join(', ')}` : ''}`}.</strong> {item.rights?.note || ''} {item.rights?.holder ? `Holder: ${item.rights.holder}.` : ''}</p>

        {canVerify && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => verifyItem(s, item.id, { by: actor, how, asOf }), study ? 'Marked as checked against its source. That changes what you know, not what the company has allowed.' : 'Marked as checked against its source. That is not approval.')) setHow(''); }}>
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

        {canWork && noStanding && (
          <div className="lb-form">
            {item.pipeline === 'discovered' && <h3>Say what it is</h3>}
            <p className="lb-body">{item.pipeline === 'discovered' ? noStanding : `It was rejected${item.approval?.date ? ` on ${fmt(item.approval.date)}` : ''}, so it stays in the learning archive. Its standing cannot be raised while that stands.`}</p>
            {item.pipeline === 'discovered' && (
              <form onSubmit={x => { x.preventDefault(); if (act(s => describeItem(s, item.id, { what, by: actor, asOf }), 'Recorded. Its standing can now be proposed. It has still not been checked against its source.')) setWhat(''); }}>
                <label>What was made, when, and for whom
                  <textarea value={what} onChange={x => setWhat(x.target.value)} rows={2} />
                </label>
                <div className="lb-actions"><button className="lb-primary" type="submit">Record what it is</button></div>
              </form>
            )}
          </div>
        )}

        {/* Each form opens from the button that names it, under the facts it rests on. */}
        {canWork && !doing && (!noStanding || !study) && (
          <div className="lb-actions">
            {!noStanding && <button className={awaitingApproval && checkedYet ? undefined : 'lb-primary'} onClick={() => setDoing('propose')}>{study ? 'Note a different reading' : 'Propose a change of standing'}</button>}
            {!study && <button onClick={() => setDoing('reuse')}>Record a reuse</button>}
          </div>
        )}

        {canWork && !noStanding && doing === 'propose' && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => propose(s, { itemId: item.id, to, rationale: why, evidenceIds: ev, by: actor, scope, asOf }), next => { const p = next.proposals.at(-1); return study ? `Noted for yourself. Nothing about ${brand.name}'s material has changed.` : `Proposal recorded${p.reviewer.length ? `. It waits for ${whoFor(brand, p.reviewer, me)}` : ''}. Nothing has changed yet.${p.warnings.length ? ` Noted: ${p.warnings.join(' ')}` : ''}`; })) { setWhy(''); setScope(''); setEv([]); setDoing(null); } }}>
            <h3>{study ? 'Note a different reading' : 'Propose a change of standing'}</h3>
            <p className="lb-body">{study ? `This is a note to yourself. Only ${brand.name} can decide what its material is.` : reviewers.length ? (reviewers.includes(me) ? 'This is yours to decide. A proposal puts it in front of you in Choose, with what adopting it would change.' : `Decided by ${who(brand, reviewers)}.`) : `No one is named to decide this at ${brand.name}. A proposal will wait.`}</p>
            <label>{study ? 'Your reading' : 'New standing'}
              <select value={to} onChange={x => setTo(x.target.value)}>{Object.keys(STANDING_CLASSES).filter(k => k !== item.standing).map(k => <option key={k} value={k}>{classOf(k, brand).name}</option>)}</select>
            </label>
            {!study && <label>What it would cover
              <input value={scope} onChange={x => setScope(x.target.value)} />
            </label>}
            {!study && offered.length > 0 && (
              <fieldset><legend>Evidence to attach</legend>
                {offered.map(x => (
                  <label key={x.id} className="lb-check"><input type="checkbox" checked={ev.includes(x.id)} onChange={c => setEv(c.target.checked ? [...ev, x.id] : ev.filter(i => i !== x.id))} />{x.statement}{x.from ? ` (recorded on ${x.from})` : ''}</label>
                ))}
              </fieldset>
            )}
            <label>Why
              <textarea value={why} onChange={x => setWhy(x.target.value)} rows={2} />
            </label>
            <div className="lb-actions"><button className="lb-primary" type="submit">{study ? 'Record the note' : 'Record proposal'}</button><button type="button" onClick={() => setDoing(null)}>Cancel</button></div>
          </form>
        )}

        {canWork && !study && doing === 'reuse' && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => recordReuse(s, item.id, { where, asOf }), 'Reuse recorded. Standing is unchanged: reuse does not confer authority.')) { setWhere(''); setDoing(null); } }}>
            <h3>Record a reuse</h3>
            <label>Where it was reused
              <input value={where} onChange={x => setWhere(x.target.value)} />
            </label>
            <div className="lb-actions"><button className="lb-primary" type="submit">Record the reuse</button><button type="button" onClick={() => setDoing(null)}>Cancel</button></div>
          </form>
        )}
        <h3>What it was for</h3>
        <dl className="lb-facts">{facts.map(([k, v]) => <div key={k} className="lb-fact"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>

        <h3>Evidence</h3>
        {evidenceTypes.length === 0 && <p className="lb-missing">None recorded.</p>}
        {evidenceTypes.map(([n, list]) => (
          <div key={n} className="lb-ev"><h4>{n}</h4><ul>{list.map(x => <li key={x.id}>{x.statement} <span className="lb-meta">{EVIDENCE_BASIS[x.basis] || String(x.basis).replace(/_/g, ' ')}</span>{/^https?:/.test(x.url || '') && <> <a href={x.url} target="_blank" rel="noreferrer noopener">source</a></>}</li>)}</ul></div>
        ))}

        {item.sources?.length > 0 && (<>
          <h3>Sources</h3>
          <ul className="lb-list">{item.sources.map(s => (
            <li key={s.url}>{/^https?:/.test(s.url) ? <a href={s.url} target="_blank" rel="noreferrer noopener">{s.publisher || s.url}</a> : (s.publisher || s.url)}{s.date ? `, ${fmt(s.date)}` : ''} <span className="lb-meta">{SOURCE_BASIS[s.basis] || s.basis}</span></li>
          ))}</ul>
        </>)}

        {item.relations?.length > 0 && (<><h3>Related</h3>
          <ul className="lb-list">{item.relations.map(r => <li key={r.type + r.to}>{cap(r.type)} <Cite id={r.to} items={items} setOpenId={setOpenId} /></li>)}</ul></>)}
        {item.supersededBy && <p className="lb-body">Replaced by <Cite id={item.supersededBy} items={items} setOpenId={setOpenId} />.</p>}

        {item.reuse?.length > 0 && (<><h3>Reused</h3>
          <ul className="lb-list">{item.reuse.map((r, k) => <li key={k}>{r.where}, {fmt(r.date)}</li>)}</ul></>)}

      </aside>
    </div>
  );
}

/* Interpret -------------------------------------------------------------- */
const FIELD_NAMES = { goal: 'Goal', audience: 'Audience', channels: 'Channels', message: 'Message', measure: 'Measure', until: 'Runs until' };
const CHANNEL_NAMES = { 'paid-media': 'paid media', 'owned-social': 'owned social', 'owned-web': 'owned web', email: 'email' };
const show = v => v == null ? 'Not set' : Array.isArray(v) ? v.map(c => CHANNEL_NAMES[c] || c).join(', ') : /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmt(v) : String(v);

const choiceStatus = (c, brand, me) => {
  if (c.status === 'withdrawn') return `Withdrawn on ${fmt(c.withdrawn?.date || c.date)}`;
  if (c.status === 'accepted' || c.status === 'declined') return `${cap(c.status)} by ${nameFor(brand, c.answer?.by || c.owner, me)} on ${fmt(c.answer?.date || c.date)}${c.answer?.note ? `: ${stop(c.answer.note)}` : ''}`;
  if (c.needs) return c.owner ? `Waiting for ${nameFor(brand, c.owner, me)}` : `Needs a decision on ${POWERS[c.needs]}; no one is named`;
  return 'Recorded';
};

// What recording a choice did, in a sentence.
const choiceSaid = (brand, me) => next => {
  const made = next.choices.at(-1);
  if (made.status === 'accepted') return 'Recorded. It is yours to decide, so it is decided.';
  if (!made.needs) return 'Recorded.';
  return made.owner ? `Recorded. It waits for ${nameFor(brand, made.owner, me)}.` : `Recorded. It needs a decision on ${POWERS[made.needs]}, and no one is named for that yet.`;
};

// An entry in a list. Closed, it is its own sentence and, where something has
// been recorded about it or it is the reader's to decide, that. It opens in
// place, so what it says stays beside what is done about it. Where `open` is
// given the caller holds whether it is open; otherwise the row does.
function Entry({ title, who, mine = false, open, onToggle, decides = false, id, children }) {
  return (
    <li className={decides ? 'lb-row lb-decides' : 'lb-row'} id={id}>
      <details open={open} onToggle={onToggle ? x => onToggle(x.currentTarget.open) : undefined}>
        <summary><span className="lb-row-title">{title}</span>{who ? <span className={mine ? 'lb-row-who is-mine' : 'lb-row-who'}>{who}</span> : null}</summary>
        <div className="lb-row-body">{children}</div>
      </details>
    </li>
  );
}

// A form that opens from a button gives the button back its focus when it closes.
function useOpener() {
  const [open, setOpen] = useState(false);
  const [back, setBack] = useState(false);
  return { open, back, show: () => { setBack(false); setOpen(true); }, hide: () => { setOpen(false); setBack(true); } };
}

// A choice is recorded where the reader is, with what it rests on still in
// view. The reason is the last thing before the button, and is never filled in for them.
function ChoiceForm({ start, fixedSubject = false, brand, act, actor, me, asOf, study, onDone, onCancel }) {
  const from = start || {};
  const blank = { subject: from.subject || '', verdict: from.verdict || 'investigate', rationale: '', needs: from.needs || '' };
  const [form, setForm] = useState(blank);
  return (
    <form className="lb-form" onSubmit={x => {
      x.preventDefault();
      const ok = act(s => {
        if (!form.subject.trim()) throw new Error('A choice needs a subject.');
        return recordChoice(s, { subject: form.subject, verdict: form.verdict, rationale: form.rationale, sources: from.sources || [], about: from.about || '', needs: form.needs || undefined, by: actor, asOf });
      }, choiceSaid(brand, me));
      if (ok) { setForm({ ...blank, subject: fixedSubject ? blank.subject : '' }); onDone?.(); }
    }}>
      {from.hint && <p className="lb-body">The reading suggested: {from.hint} Say it in your own words, or say something else.</p>}
      {!fixedSubject && <label>Subject<input autoFocus value={form.subject} onChange={x => setForm({ ...form, subject: x.target.value })} /></label>}
      <label>Choice<select value={form.verdict} onChange={x => setForm({ ...form, verdict: x.target.value })}>{Object.entries(CHOICES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      {!study && <label>Whose decision it needs<select value={form.needs} onChange={x => setForm({ ...form, needs: x.target.value })}><option value="">No one else's</option>{Object.entries(POWERS).map(([k, n]) => <option key={k} value={k}>{cap(n)}{canDecide(brand, actor, k) ? ' (yours)' : ''}</option>)}</select></label>}
      <label>Your reason<textarea rows={2} autoFocus={fixedSubject} value={form.rationale} onChange={x => setForm({ ...form, rationale: x.target.value })} /></label>
      <div className="lb-actions"><button className="lb-primary" type="submit">Record the choice</button>{onCancel && <button type="button" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}

// The step after this stage, said once at its foot.
function NextStep({ stage, go }) {
  const at = STAGES.findIndex(s => s[0] === stage);
  const next = STAGES[at + 1];
  if (!next) return null;
  return <div className="lb-actions lb-next"><button className="lb-primary" onClick={() => go(next[0])}>Continue to {next[1]}</button></div>;
}

// Who an entry waits for, as the heading its group is read under.
function waitsFor(t, brand, me, study) {
  if (study) return { key: `kind:${t.kind}`, label: t.kind, rank: 5 };
  const owners = t.owners || [];
  if (t.unnamed || (!owners.length && t.power)) return { key: 'none', label: 'No one is named to decide these', rank: 4 };
  if (!owners.length) return { key: 'look', label: 'Yours to look into', rank: 2 };
  if (owners.every(id => id === me)) return { key: 'mine', label: 'Yours to decide', rank: 1 };
  return { key: `for:${[...owners].sort().join('+')}`, label: `For ${whoFor(brand, owners, me)} to resolve`, rank: 3 };
}

function Tension({ t, state, brand, items, me, actor, act, asOf, study, setOpenId, canWrite, onName }) {
  const form = useOpener();
  // A choice recorded about this entry is shown with it, so the entry and its answer are read together.
  const chosen = state.choices.filter(c => c.about === t.id && c.status !== 'withdrawn');
  // An answer to a question the record ties to this entry is read with it. It is a note; the entry stays until it is decided.
  const about = state.engagement.questionAbout || {};
  const answered = (state.answers || []).filter(a => about[a.question] === t.id);
  const last = chosen.at(-1);
  // Who it waits for is the heading it sits under. The closed line adds only what has been recorded about it.
  const who = last ? `${last.by === me ? 'Your choice' : 'Choice'}: ${lower(CHOICES[last.verdict])}. ${choiceStatus(last, brand, me)}` : '';
  return (
    <Entry title={`${stop(t.title)}.`} who={who}>
      <p>{t.detail}</p>
      {t.points?.length > 0 && <ul className="lb-list">{t.points.map(pt => <li key={pt.ruleId}>{pt.rule} {pt.says || `It has ${pt.has}.`}</li>)}</ul>}
      <Cites ids={t.sources} items={items} setOpenId={setOpenId} />
      {answered.map(a => <p key={a.id}><strong>{a.by === me ? 'Your answer' : `Answered by ${nameFor(brand, a.by, me)}`}, {fmt(a.date)}.</strong> {a.answer}</p>)}
      {chosen.map(c => <p key={c.id}><strong>{c.by === me ? 'Your choice' : 'Choice recorded'}: {lower(CHOICES[c.verdict])}.</strong> {c.rationale} {choiceStatus(c, brand, me)}.</p>)}
      {canWrite && !t.unnamed && !form.open && <div className="lb-actions"><button autoFocus={form.back} onClick={form.show}>{chosen.length ? 'Record another choice about this' : 'Record a choice about this'}</button></div>}
      {form.open && <ChoiceForm start={{ subject: stop(t.title), sources: t.sources || [], about: t.id, needs: !study && t.power ? t.power : '' }} fixedSubject brand={brand} act={act} actor={actor} me={me} asOf={asOf} study={study} onDone={form.hide} onCancel={form.hide} />}
      {onName && <div className="lb-actions"><button onClick={onName}>Name them in Enter</button></div>}
    </Entry>
  );
}

function Timeline({ events, items, setOpenId }) {
  return (
    <ol className="lb-timeline">
      {events.map((f, k) => (
        <li key={k}>
          <time>{f.date ? fmt(f.date) : 'Undated'}</time>
          <div>
            <p>{f.statement}</p>
            {f.source && <Cite id={f.source} items={items} setOpenId={setOpenId} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Interpret({ asOf, state, brand, items, me, actor, act, setOpenId, tensions, go, stance }) {
  const e = state.engagement;
  const study = stance === 'study';
  const reading = e.reading?.interpret || {};
  const cf = carryForward(brand, e, { asOf });
  const ledger = changeLedger(brand, { asOf });
  const events = timeline(brand, { asOf });
  const hyps = organizationalHypotheses(brand, e);
  // What its decider has decided is no longer waiting for a decision. It is kept in sight until it is carried out.
  const done = decidedEntries(state.choices);
  const waiting = tensions.filter(t => !done.has(t.id));
  const decided = tensions.filter(t => done.has(t.id));
  const canWrite = e.grant?.powers?.includes('propose');
  const canName = !study && e.grant?.powers?.includes('steward');
  const dated = events.filter(f => f.date);
  const entry = t => <Tension key={t.id} t={t} state={state} brand={brand} items={items} me={me} actor={actor} act={act} asOf={asOf} study={study} setOpenId={setOpenId} canWrite={canWrite} onName={t.unnamed && canName ? () => go('enter') : null} />;
  // Read under who has to act: the reader's own first, then what is theirs to look into,
  // then each person it waits for, then what waits for a naming. In a study, by kind.
  const groups = [];
  for (const t of waiting) {
    const g = waitsFor(t, brand, me, study);
    const at = groups.find(x => x.key === g.key);
    if (at) at.list.push(t); else groups.push({ ...g, list: [t] });
  }
  groups.sort((a, b) => a.rank - b.rank || b.list.length - a.list.length);
  return (
    <article>
      <h1>{reading.headline || (study ? `What changed at ${brand.name}, as far as public sources show` : `What changed at ${brand.name}, and what it left unresolved`)}</h1>
      <p className="lb-deck">{reading.deck || 'Read from the record: what replaced what, where the material disagrees with itself, and what nobody has decided.'}</p>

      {cf && (
        <section className="lb-section">
          <h2>{reading.carryHeading || 'What carries forward'}</h2>
          {/* The verdict is the closed line. Why, with any limit on reusing the piece, is one step inside. */}
          <ul className="lb-findings lb-carry-rows">
            {cf.rows.map(r => (
              <Entry key={r.item.id} title={`${r.verdictName}: ${r.item.title}.`}>
                <p>{r.why}</p>
                <div><Cite id={r.item.id} items={items} setOpenId={setOpenId} /></div>
              </Entry>
            ))}
          </ul>
          {cf.evidenceNote && <p className="lb-body">{cf.evidenceNote}</p>}
          <details className="lb-more">
            <summary>How the brief changed</summary>
            <table className="lb-table lb-carry">
              <thead><tr><th>Brief</th><th>{reading.carryColumns?.[0] || 'Before'}</th><th>{reading.carryColumns?.[1] || 'Now'}</th></tr></thead>
              <tbody>{cf.changes.map(c => <tr key={c.field}><td>{FIELD_NAMES[c.field] || c.field}</td><td>{show(c.before)}</td><td>{show(c.after)}</td></tr>)}</tbody>
            </table>
          </details>
        </section>
      )}

      <section className="lb-section">
        <h2>{stance === 'owner' ? 'What needs deciding' : study ? 'What this study sets side by side' : 'Tensions in the material'}</h2>
        {!tensions.length && <p className="lb-missing">None found in what has been entered.</p>}
        {tensions.length > 0 && !waiting.length && <p className="lb-missing">Nothing is waiting for a decision.</p>}
        {groups.map(g => (
          <div key={g.key} className="lb-tension-group">
            <h3>{g.label}</h3>
            <ul className="lb-findings">{g.list.map(entry)}</ul>
          </div>
        ))}
        {decided.length > 0 && (
          <div className="lb-tension-group">
            <h3>Decided, still to carry out</h3>
            <p className="lb-body">{plural(decided.length, 'This has', 'These have')} been decided by the person named for {plural(decided.length, 'it', 'them')}. The material still says what it said until someone changes it.</p>
            <ul className="lb-findings">{decided.map(entry)}</ul>
          </div>
        )}
      </section>

      {hyps.length > 0 && (
        <section className="lb-section">
          <h2>{study ? 'Hypotheses from this study' : 'Hypotheses beyond the creative work'}</h2>
          <ul className="lb-findings">
            {hyps.map(h => (
              <Entry key={h.id} title={h.title} mine={!study && h.owner === me} who={study ? '' : h.owner ? (h.owner === me ? 'Yours to decide' : `Decided by ${nameFor(brand, h.owner, me)}`) : `No one named yet at ${brand.name}`}>
                <p>{h.statement}</p>
                <p><strong>Why it is uncertain.</strong> {h.uncertainty}</p>
                <ul className="lb-list">{h.evidence.map(x => <li key={x.id}>{x.statement} <Cite id={x.item} items={items} setOpenId={setOpenId} /></li>)}</ul>
                {h.test && <p><strong>How it could be tested.</strong> {h.test}</p>}
              </Entry>
            ))}
          </ul>
        </section>
      )}

      {ledger.length > 0 && (
        <Closed title="What replaced what">
          <ul className="lb-findings">
            {ledger.filter(c => c.kind === 'material' || !ledger.some(m => m.kind === 'material' && m.before.id === c.before.source && m.after.id === c.after.source)).map((c, k) => c.kind === 'material' ? (
              <li key={k}>
                <p><strong>{c.when ? `${fmt(c.when)}. ` : ''}</strong><Cite id={c.before.id} items={items} setOpenId={setOpenId} /> gave way to <Cite id={c.after.id} items={items} setOpenId={setOpenId} />.</p>
                {c.rationale && <p>{c.rationale}</p>}
                {ledger.filter(r => r.kind === 'rule' && r.before.source === c.before.id && r.after.source === c.after.id).map(r => <p key={r.before.id}>Before: {stop(r.before.statement)}. After: {stop(r.after.statement)}.</p>)}
              </li>
            ) : (
              <li key={k}>
                <p><strong>{fmt(c.when)}.</strong> Before: {stop(c.before.statement)}. After: {stop(c.after.statement)}.</p>
                <Cites ids={[c.before.source, c.after.source].filter(Boolean)} items={items} setOpenId={setOpenId} />
              </li>
            ))}
          </ul>
        </Closed>
      )}

      {events.length > 0 && (
        <Closed title={`What happened, in order${dated.length > 1 ? `, ${fmt(dated[0].date)} to ${fmt(dated.at(-1).date)}` : ''}`}>
          <Timeline events={events} items={items} setOpenId={setOpenId} />
        </Closed>
      )}
      <NextStep stage="interpret" go={go} />
    </article>
  );
}

/* Choose ----------------------------------------------------------------- */
function Choose({ asOf, state, brand, items, act, actor, me, setOpenId, go, stance }) {
  const [declining, setDeclining] = useState({ id: null, note: '' });
  const [withdrawing, setWithdrawing] = useState(null);
  const [starting, setStarting] = useState(null);
  const [left, setLeft] = useState(null);
  const own = useOpener();
  const study = stance === 'study';
  const recorded = new Set(state.choices.filter(c => c.status !== 'withdrawn').map(c => c.subject));
  const suggested = state.engagement.suggestedChoices || [];
  const about = state.engagement.questionAbout || {};
  const form = { brand, act, actor, me, asOf, study };
  return (
    <article>
      <h1>Choose what to keep, repair, change and invent</h1>
      <p className="lb-deck">{study
        ? `A choice here is your judgment as an outsider. None of it binds ${brand.name}.`
        : stance === 'owner'
          ? 'A choice is your judgment, on record, in your words. Where it falls in an area you decide, recording it decides it. Anything else waits for whoever is named.'
          : 'A choice is a record of this engagement\'s judgment. Where it needs someone else\'s authority, it is routed to them and waits.'}</p>

      {/* What waits for a decision comes first. With nothing proposed, the stage opens on what the reading suggests. */}
      {state.proposals.length > 0 && (
        <section className="lb-section">
          <h2>{study ? 'Notes on how to read the material' : 'Proposals to the brand'}</h2>
          <Proposals asOf={asOf} state={state} brand={brand} items={items} setOpenId={setOpenId} act={act} decider={actor} me={me} study={study} />
        </section>
      )}

      {suggested.length > 0 && (
        <section className="lb-section">
          <h2>Drawn from the interpretation</h2>
          <ul className="lb-findings">
            {suggested.map(c => {
              const answers = (state.answers || []).filter(a => about[a.question] && (about[a.question] === c.subject || about[a.question] === c.about));
              const made = state.choices.findLast(x => x.subject === c.subject && x.status !== 'withdrawn');
              return (
                <Entry key={c.subject} title={`${CHOICES[c.verdict]}: ${stop(c.subject)}.`} who={made ? `Your choice: ${lower(CHOICES[made.verdict])}. ${choiceStatus(made, brand, me)}` : ''}>
                  <p>{c.rationale}</p>
                  {answers.map(a => <p key={a.id}><strong>{a.by === me ? 'Your answer' : `Answered by ${nameFor(brand, a.by, me)}`}, {fmt(a.date)}.</strong> {a.answer}</p>)}
                  <Cites ids={c.sources || []} items={items} setOpenId={setOpenId} />
                  {/* A suggestion is a place to start. The verdict and the reason are the reader's to give. */}
                  {!recorded.has(c.subject) && starting !== c.subject && <div className="lb-actions"><button autoFocus={left === c.subject} onClick={() => { setLeft(null); setStarting(c.subject); }}>Record a choice from this</button></div>}
                  {starting === c.subject && <ChoiceForm {...form} fixedSubject start={{ subject: c.subject, verdict: c.verdict, needs: c.needs || '', sources: c.sources || [], about: c.about || '' }} onDone={() => { setStarting(null); setLeft(c.subject); }} onCancel={() => { setStarting(null); setLeft(c.subject); }} />}
                </Entry>
              );
            })}
          </ul>
        </section>
      )}

      <section className="lb-section">
        <h2>{suggested.length ? 'A choice of your own' : 'Record a choice'}</h2>
        {!own.open && <div className="lb-actions"><button autoFocus={own.back} onClick={own.show}>{suggested.length ? 'Record a choice of your own' : 'Record a choice'}</button></div>}
        {own.open && <ChoiceForm {...form} onDone={own.hide} onCancel={own.hide} />}
      </section>

      <section className="lb-section">
        <h2>Choices recorded</h2>
        {state.choices.length ? (
          <ul className="lb-findings">
            {state.choices.map(c => {
              const mine = c.status === 'awaiting decision' && c.needs && canDecide(brand, actor, c.needs);
              return (
                <li key={c.id} className={mine ? 'lb-decision' : undefined}>
                  <p><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale}</p>
                  <p>{choiceStatus(c, brand, me)}.</p>
                  {mine && declining.id !== c.id && (
                    <div className="lb-actions">
                      <button className="lb-primary" onClick={() => act(s => answerChoice(s, c.id, { by: actor, outcome: 'accept', asOf }), 'Accepted.')}>Accept</button>
                      <button onClick={() => setDeclining({ id: c.id, note: '' })}>Decline</button>
                    </div>
                  )}
                  {mine && declining.id === c.id && (
                    <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => answerChoice(s, c.id, { by: actor, outcome: 'decline', note: declining.note, asOf }), 'Declined. The choice stays on record.')) setDeclining({ id: null, note: '' }); }}>
                      <label>Why it is declined<input autoFocus value={declining.note} onChange={x => setDeclining({ ...declining, note: x.target.value })} /></label>
                      <div className="lb-actions"><button type="submit">Decline it</button><button type="button" onClick={() => setDeclining({ id: null, note: '' })}>Cancel</button></div>
                    </form>
                  )}
                  {c.by === actor && c.status !== 'withdrawn' && withdrawing !== c.id && <div className="lb-actions"><button onClick={() => setWithdrawing(c.id)}>Withdraw</button></div>}
                  {c.by === actor && c.status !== 'withdrawn' && withdrawing === c.id && (
                    <div className="lb-actions">
                      <button autoFocus onClick={() => { act(s => withdrawChoice(s, c.id, { by: actor, asOf }), 'Withdrawn. It stays listed here as withdrawn.'); setWithdrawing(null); }}>Yes, withdraw it</button>
                      <button onClick={() => setWithdrawing(null)}>Keep it</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <p className="lb-missing">None yet.</p>}
        {!state.proposals.length && <p className="lb-body">{study ? 'Open any piece to note a different reading of it.' : 'Open any piece of work to propose a change to its standing.'}</p>}
      </section>
      <NextStep stage="choose" go={go} />
    </article>
  );
}

const proposalOutcome = (p, brand, me) => {
  const by = p.decided ? ` by ${nameFor(brand, p.decided.by, me)} on ${fmt(p.decided.date)}` : '';
  const note = p.decided?.note ? `: ${stop(p.decided.note)}` : '';
  if (p.status === 'adopted') return `Adopted${by}${note}.`;
  if (p.status === 'rejected') return `Turned down${by}${note}.`;
  if (p.status === 'revise') return `Sent back${by}${note}. It can be proposed again with the change.`;
  if (p.status === 'superseded') return 'Closed when the standing of this material changed.';
  return `${cap(p.status)}.`;
};

const proposalShort = (p, brand, me) => {
  const by = p.decided ? ` by ${nameFor(brand, p.decided.by, me)} on ${fmt(p.decided.date)}` : '';
  if (p.status === 'adopted') return `Adopted${by}`;
  if (p.status === 'rejected') return `Turned down${by}`;
  if (p.status === 'revise') return `Sent back${by}`;
  if (p.status === 'superseded') return 'Closed when its standing changed';
  return cap(p.status);
};

function Proposals({ asOf, state, brand, items, setOpenId, act, decider, me, only, study = false }) {
  const none = { id: null, outcome: null, scope: '', covers: null, hold: [], checked: '', note: '' };
  const [doing, setDoing] = useState(none);
  const list = state.proposals.filter(p => !only || only(p));
  const kinds = kindsOfWork(brand, state.engagement);
  // One or two decisions stand open. More than that read first as a list of what is waiting,
  // and each opens to the same card: nothing can be decided without its notes in view.
  const waitingHere = list.filter(p => p.status === 'open' && !study && decider && items[p.itemId] && canDecide(brand, decider, powerFor(items[p.itemId]))).length;
  // Whether a row is open is the reader's: it is set when they open or close it, and by nothing else.
  const [few] = useState(waitingHere <= 2);
  const [opened, setOpened] = useState({});
  const isOpen = (id, start) => opened[id] ?? start;
  const toggled = id => now => setOpened(o => ({ ...o, [id]: now }));
  // After a decision the reader is left looking at the row they decided.
  const settle = id => { setOpened(o => ({ ...o, [id]: true })); setDoing(none); requestAnimationFrame(() => document.getElementById(`lb-p-${id}`)?.querySelector('summary')?.focus()); };
  const refuse = (p, error, text) => { setDoing(d => ({ ...d, error })); act(() => { throw new Error(text); }); requestAnimationFrame(() => document.getElementById(`lb-${error}-${p.id}`)?.focus()); };
  if (!list.length) return <p className="lb-missing">{study ? 'No notes yet.' : 'No proposals.'}</p>;
  return (
    <ul className="lb-findings">
      {list.map(p => {
        const item = items[p.itemId];
        const mine = !study && decider && item && canDecide(brand, decider, powerFor(item));
        const stated = item && p.to === 'canon' ? rulesStatedBy(brand, item.id) : [];
        const unchecked = item && pipelineRank(item.pipeline) < pipelineRank('verified');
        const open = p.status === 'open';
        const here = doing.id === p.id;
        const decision = state.decisions.find(d => d.proposalId === p.id);
        const change = `${item?.title || p.itemId}: ${classOf(p.from, brand).name} to ${classOf(p.to, brand).name}.`;
        const evidence = p.evidenceIds.length > 0 && <ul className="lb-list">{brand.items.flatMap(i => i.evidence || []).filter(x => p.evidenceIds.includes(x.id)).map(x => <li key={x.id}>{x.statement} ({EVIDENCE_BASIS[x.basis] || String(x.basis).replace(/_/g, ' ')})</li>)}</ul>;
        const warnings = p.warnings.length > 0 && <ul className="lb-warnings">{p.warnings.map(w => <li key={w}>{w}</li>)}</ul>;

        // Anything the reader cannot decide here is a row: what was asked, and who it waits for or how it ended.
        if (!(open && mine)) return (
          <Entry key={p.id} id={`lb-p-${p.id}`} open={isOpen(p.id, false)} onToggle={toggled(p.id)} title={change} who={open ? (study ? 'A note to yourself' : `Waiting for ${whoFor(brand, p.reviewer, me)}`) : proposalShort(p, brand, me)}>
            {open && <p>{p.rationale}</p>}
            {open && <p>{p.by !== 'intake' ? `${study ? 'Noted' : 'Proposed'} by ${nameFor(brand, p.by, me)} on ${fmt(p.date)}. ` : ''}{study ? `Only ${brand.name} could decide it.` : ''}{p.scope && !study ? `It would cover: ${stop(p.scope)}.` : ''}</p>}
            {!open && <p>{proposalOutcome(p, brand, me)}{p.status === 'adopted' && decision?.scope ? ` It covers: ${stop(decision.scope)}.` : ''}{decision?.checked ? ` Checked against: ${stop(decision.checked)}.` : ''}{decision?.heldBack?.length ? ` ${plural(decision.heldBack.length, 'One rule was', '% rules were')} held back.` : ''}</p>}
            {!open && <p>The proposal read: {p.rationale}</p>}
            {evidence}
            {open && !study && warnings}
            {open && stated.length > 0 && (<><p>The rules adopting it would put in force:</p><ul className="lb-list">{stated.map(r => <li key={r.id}>{r.statement}</li>)}</ul></>)}
            <div><Cite id={p.itemId} items={items} setOpenId={setOpenId} /></div>
          </Entry>
        );

        // The decider names the kinds of work themselves. What the rules were written for is said beside the list, not ticked for them.
        const written = [...new Set(stated.flatMap(r => (r.scope || []).filter(x => x !== 'all')))].filter(k => kinds.includes(k));
        const covers = doing.covers ?? [];
        const blocked = item && p.to !== 'archive' ? whyNoStanding(item) : '';
        // What adopting it, as now filled in, would add to this project's list and what it would take off it.
        let adds = [];
        let ends = [];
        let turns = [];
        if (here && doing.outcome === 'adopt' && p.to === 'canon' && covers.length) {
          try {
            const preview = decide(state, p.id, { by: decider, outcome: 'adopt', scope: doing.scope, covers, holdBack: doing.hold, checked: doing.checked.trim() || 'preview', asOf });
            const opts = { asOf, workTypes: state.engagement.workTypes || [], channels: state.engagement.channels || [] };
            const before = findTensions(state.brand, opts);
            const after = findTensions(preview.brand, opts);
            const ruleIds = new Set(stated.map(r => r.id));
            adds = after.filter(t => !before.some(b => b.id === t.id)).map(t => ({ t, points: (t.points || []).filter(pt => ruleIds.has(pt.ruleId)) }));
            ends = before.filter(t => !after.some(a => a.id === t.id));
            turns = after.filter(t => before.some(x => x.id === t.id && x.title !== t.title));
          } catch { adds = []; ends = []; turns = []; }
        }
        const adopting = here && doing.outcome === 'adopt';
        // The closed line says what is asked and what sets this one apart from the next: how many rules, and whether its rights are settled.
        const inQuestion = stated.filter(r => r.disputed).length;
        const apart = [
          stated.length ? `${cap(countWord(stated.length))} ${stated.length === 1 ? 'rule' : 'rules'}${inQuestion ? `, ${countWord(inQuestion)} in question` : ''}.` : '',
          item && !['cleared', 'own'].includes(item.rights?.status) && ['canon', 'precedent', 'contextual'].includes(p.to) ? `Rights ${item.rights?.status || 'unknown'}.` : '',
        ].filter(Boolean).join(' ');
        const asked = `${item?.title || p.itemId}: make it ${lower(classOf(p.to, brand).name)}.${apart ? ` ${apart}` : ''}`;
        // A decision that is the reader's to make: what it rests on, and every note about it, stay above its buttons.
        return (
          <Entry key={p.id} id={`lb-p-${p.id}`} decides open={isOpen(p.id, few)} onToggle={toggled(p.id)} title={asked} who="Yours to decide">
            <p>It is {lower(classOf(p.from, brand).name)} now. {p.rationale}</p>
            <p>{p.by !== 'intake' ? `Proposed by ${nameFor(brand, p.by, me)} on ${fmt(p.date)}.` : ''}{p.scope ? ` It would cover: ${stop(p.scope)}.` : ''}</p>
            {evidence}
            {!adopting && warnings}
            {!adopting && stated.length > 0 && (<><p>The rules adopting it would put in force:</p><ul className="lb-list">{stated.map(r => <li key={r.id}>{r.statement}{r.disputed ? ' (In question elsewhere in this record.)' : ''}</li>)}</ul></>)}
            {blocked && <p>{blocked}</p>}
            <div><Cite id={p.itemId} items={items} setOpenId={setOpenId} /></div>
            {blocked && item.pipeline === 'discovered' && !here && <div className="lb-actions"><button onClick={() => setOpenId(item.id)}>Say what it is</button></div>}
            {!here && (
              <div className="lb-actions">
                {!blocked && <button className="lb-primary" onClick={() => setDoing({ ...none, id: p.id, outcome: 'adopt', hold: stated.filter(r => r.disputed).map(r => r.id) })}>Adopt</button>}
                <button onClick={() => setDoing({ ...none, id: p.id, outcome: 'revise' })}>Ask for revision</button>
                <button onClick={() => setDoing({ ...none, id: p.id, outcome: 'reject' })}>Reject</button>
              </div>
            )}
            {adopting && (
              <form className="lb-form" noValidate onSubmit={x => {
                x.preventDefault();
                if (p.to === 'canon' && !covers.length) { refuse(p, 'covers', 'Tick at least one kind of work.'); return; }
                if (p.to === 'canon' && unchecked && !doing.checked.trim()) { refuse(p, 'check', 'Say what you checked this record against.'); return; }
                if (act(s => decide(s, p.id, { by: decider, outcome: 'adopt', scope: doing.scope, covers, holdBack: doing.hold, checked: doing.checked, asOf }), 'Adopted. The previous standing is kept in the record.')) settle(p.id);
              }}>
                {p.to === 'canon' && (
                  <fieldset><legend>The kinds of work this canon covers</legend>
                    <div className="lb-options">
                      <label className="lb-check"><input type="checkbox" id={`lb-covers-${p.id}`} autoFocus checked={covers.includes('all')} onChange={c => setDoing({ ...doing, error: null, covers: c.target.checked ? ['all'] : [] })} />All work</label>
                      {kinds.map(k => (
                        <label key={k} className="lb-check"><input type="checkbox" disabled={covers.includes('all')} checked={covers.includes('all') || covers.includes(k)} onChange={c => setDoing({ ...doing, error: null, covers: c.target.checked ? [...covers.filter(x => x !== 'all'), k] : covers.filter(x => x !== k) })} />{k}</label>
                      ))}
                    </div>
                  </fieldset>
                )}
                {p.to === 'canon' && !covers.length && <p className={doing.error === 'covers' ? 'lb-refusal' : 'lb-body'}>Tick at least one. The kinds of work ticked are what its rules are then held to; nothing else is.{written.length ? ` As written, its rules are for ${written.join(', ').toLowerCase()}.` : ''}</p>}
                {p.to === 'canon' && unchecked && (
                  <label>What you checked this record against, which it needs before it can be adopted
                    <input id={`lb-check-${p.id}`} aria-invalid={doing.error === 'check' || undefined} value={doing.checked} onChange={x => setDoing({ ...doing, error: null, checked: x.target.value })} />
                  </label>
                )}
                {doing.error === 'check' && <p className="lb-refusal">Say what you checked this record against.</p>}
                {p.to === 'canon' && <label>A note in your own words, kept beside it<input value={doing.scope} onChange={x => setDoing({ ...doing, scope: x.target.value })} /></label>}
                {p.to === 'canon' && stated.length > 0 && (
                  <fieldset><legend>The rules it puts in force. Untick any you are not adopting</legend>
                    {stated.map(r => (
                      <label key={r.id} className="lb-check"><input type="checkbox" checked={!doing.hold.includes(r.id)} onChange={c => setDoing({ ...doing, hold: c.target.checked ? doing.hold.filter(x => x !== r.id) : [...doing.hold, r.id] })} />{r.statement}{r.disputed ? ' (In question elsewhere in this record, so it starts unticked.)' : ''}</label>
                    ))}
                  </fieldset>
                )}
                {p.to === 'canon' && adds.length > 0 && (<>
                  <p className="lb-body">Adopting it as filled in adds this to what needs deciding:</p>
                  <ul className="lb-list">{adds.map(d => <li key={d.t.id}>{stop(d.t.title)}{d.points.length ? `. ${d.points.map(pt => pt.says || `It has ${pt.has}.`).join(' ')}` : d.t.points ? '.' : `. ${d.t.detail}`}</li>)}</ul>
                </>)}
                {p.to === 'canon' && ends.length > 0 && (<>
                  <p className="lb-body">{adds.length ? 'And takes' : 'Adopting it as filled in takes'} this off the list for this project:</p>
                  <ul className="lb-list">{ends.map(t => <li key={t.id}>{stop(t.title)}.</li>)}</ul>
                </>)}
                {p.to === 'canon' && turns.length > 0 && (<>
                  <p className="lb-body">{adds.length || ends.length ? 'And this then reads' : 'Adopting it as filled in makes this read'}:</p>
                  <ul className="lb-list">{turns.map(t => <li key={t.id}>{stop(t.title)}.</li>)}</ul>
                </>)}
                {p.to === 'canon' && <p className="lb-body">Adopting it as canon also records your approval of it.</p>}
                {/* The notes about the proposal are the last thing read before it is adopted. */}
                {warnings}
                <div className="lb-actions"><button className="lb-primary" type="submit">Adopt it</button><button type="button" onClick={() => setDoing(none)}>Cancel</button></div>
              </form>
            )}
            {here && doing.outcome !== 'adopt' && (
              <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => decide(s, p.id, { by: decider, outcome: doing.outcome, note: doing.note, asOf }), doing.outcome === 'revise' ? 'Sent back for revision.' : 'Turned down. The proposal stays on record.')) settle(p.id); }}>
                <label>{doing.outcome === 'revise' ? 'What needs to change' : 'Why it is turned down'}<input autoFocus value={doing.note} onChange={x => setDoing({ ...doing, note: x.target.value })} /></label>
                <div className="lb-actions"><button className="lb-primary" type="submit">{doing.outcome === 'revise' ? 'Send it back' : 'Turn it down'}</button><button type="button" onClick={() => setDoing(none)}>Cancel</button></div>
              </form>
            )}
          </Entry>
        );
      })}
    </ul>
  );
}

/* Organize --------------------------------------------------------------- */
function Questions({ asOf, state, brand, act, actor, me, stance }) {
  const e = state.engagement;
  const [drafts, setDrafts] = useState({});
  // Only what is asked can be answered. Statements of what is unknown stay in Orient.
  const all = [...new Set([...(e.questions || []), ...(stance !== 'visitor' ? brand.unknowns || [] : [])])].filter(q => /\?\s*$/.test(q));
  if (!all.length) return null;
  const answers = state.answers || [];
  const canWrite = e.grant?.powers?.includes('propose');
  const waiting = all.filter(q => !answers.some(a => a.question === q));
  const answered = all.filter(q => answers.some(a => a.question === q));
  // A long list shows its first questions; the rest open on request. One with words typed under it is never folded away.
  const typing = Math.max(-1, ...waiting.map((q, k) => (drafts[q] ? k : -1)));
  const cut = waiting.length > 8 ? Math.max(6, typing + 1) : waiting.length;
  const shown = waiting.slice(0, cut);
  const more = waiting.slice(cut);
  const study = stance === 'study';
  const one = q => {
    const given = answers.filter(a => a.question === q);
    const last = given.at(-1);
    const text = drafts[q] || '';
    return (
      <Entry key={q} title={q} who={last ? `${study ? 'Found' : 'Answered'} by ${nameFor(brand, last.by, me)} on ${fmt(last.date)}` : ''}>
        {given.map(a => <p key={a.id}><strong>{cap(nameFor(brand, a.by, me))}, {fmt(a.date)}.</strong> {a.answer}</p>)}
        {canWrite && (
          <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => recordAnswer(s, { question: q, answer: text, by: actor, asOf }), study ? 'Recorded.' : 'Answer recorded. It is listed under Answered.')) setDrafts(d => ({ ...d, [q]: '' })); }}>
            <label>{study ? 'What you found, and where' : given.length ? 'Add to it' : 'Your answer'}<textarea rows={2} value={text} onChange={x => setDrafts(d => ({ ...d, [q]: x.target.value }))} /></label>
            <div className="lb-actions"><button className="lb-primary" type="submit">{study ? 'Record it' : 'Record the answer'}</button></div>
          </form>
        )}
      </Entry>
    );
  };
  return (
    <section className="lb-section">
      <h2>{stance === 'owner' ? 'Questions only you can answer' : study ? 'Questions this study leaves open' : `Questions for ${brand.name}`}</h2>
      {shown.length > 0 && <ul className="lb-findings">{shown.map(one)}</ul>}
      {!waiting.length && <p className="lb-missing">Every question here has an answer on record.</p>}
      {more.length > 0 && <details className="lb-more"><summary>{cap(countWord(more.length))} more {more.length === 1 ? 'question' : 'questions'}</summary><ul className="lb-findings">{more.map(one)}</ul></details>}
      {answered.length > 0 && (<>
        <h3>{study ? 'Found' : 'Answered'}</h3>
        <ul className="lb-findings">{answered.map(one)}</ul>
      </>)}
    </section>
  );
}

function Organize({ asOf, state, brand, items, act, actor, me, setOpenId, pkg, pkgs, setPkg, setNotice, go, stance }) {
  const e = state.engagement;
  const brief = buildBrief(brand, e, state.choices, { asOf });
  const study = stance === 'study';
  const partner = e.partner;
  const ask = seq => buildContextPackage(state, { partner: { id: partner.id, name: partner.name }, assignment: partner.assignment, channels: partner.channels, workTypes: partner.workTypes, powers: ['read'], expires: partner.expires, asOf, seq });
  const issue = () => {
    try {
      const issued = (pkgs.length ? Math.max(...pkgs.map(x => x.issued || 0)) : 0) + 1;
      setPkg({ ...ask(issued), issued });
      setNotice({ kind: 'ok', text: `Context package issued. Switch the viewer to ${partner.name} to see what it receives.` });
    } catch (err) { setNotice({ kind: 'refused', text: err.message }); }
  };
  const revoked = pkg?.package.revokedAt;
  const lapsed = pkg && !revoked && !packageValid(pkg.package, asOf);
  // What the package holds that the record would no longer hand over today.
  let gone = [];
  if (pkg && !revoked && !lapsed) { try { const now = ask(pkg.issued); gone = pkg.package.included.filter(i => !now.package.included.some(n => n.id === i.id)); } catch { gone = []; } }
  const earlier = pkgs.filter(x => x.package.id !== pkg?.package.id);
  const live = state.choices.filter(c => c.status !== 'withdrawn');
  const rules = rulesInForce(effectiveRules(brand), asOf).filter(r => !(e.workTypes || []).length || !r.scope || r.scope.includes('all') || r.scope.some(x => e.workTypes.includes(x)));
  const canonRules = rules.filter(r => r.standing === 'canon');
  const otherRules = rules.filter(r => r.standing !== 'canon');
  return (
    <article>
      <h1>{e.reading?.organize?.headline || `${brief.title}: the brief`}</h1>
      <p className="lb-deck">{e.reading?.organize?.deck || [brief.objective, brief.audience ? `For ${lower(brief.audience)}.` : ''].filter(Boolean).join(' ')}</p>

      <Questions asOf={asOf} state={state} brand={brand} act={act} actor={actor} me={me} stance={stance} />

      <section className="lb-section">
        <h2>Choices it carries</h2>
        {live.length ? <ul className="lb-findings">{live.map(c => <li key={c.id}><p><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale}</p>{c.status !== 'recorded' && <p>{choiceStatus(c, brand, me)}.</p>}</li>)}</ul>
          : <p className="lb-missing">{state.choices.some(c => c.status === 'withdrawn') ? `${plural(state.choices.filter(c => c.status === 'withdrawn').length, 'One choice was recorded and withdrawn', '% choices were recorded and withdrawn')}. None stands.` : 'No choices recorded yet. Record them in Choose.'}</p>}
      </section>

      {brief.evaluation.length > 0 && (
        <section className="lb-section">
          <h2>How it will be judged, decided now</h2>
          <table className="lb-table lb-table-stack">
            <thead><tr><th>Outcome</th><th>Measure</th><th>Compared with</th><th>Limit</th></tr></thead>
            <tbody>{brief.evaluation.map(x => <tr key={x.outcome}><td>{x.outcome}</td><td data-th="Measure">{x.measure}</td><td data-th="Compared with">{x.baseline}</td><td data-th="Limit">{x.limit}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {partner && !study && e.grant?.powers?.includes('share') && (
        <section className="lb-section">
          <h2>Collaborators</h2>
          <p className="lb-body">{partner.name} needs the rules and cleared material for its assignment, not the research or the strategy. Its package is read-only, expires on {fmt(partner.expires)}, and can be revoked.</p>
          {revoked && <p className="lb-body">The package was revoked on {fmt(revoked)}. {partner.name} can no longer read it. What it held is listed below.</p>}
          {lapsed && <p className="lb-body">The package issued earlier ended on {fmt(pkg.package.expires)}. {partner.name} can no longer read it.</p>}
          {gone.length > 0 && <p className="lb-body">Since the package was issued, {gone.map(i => i.title).join(', ')} {gone.length === 1 ? 'is' : 'are'} no longer cleared to share, and {partner.name} has been told so. Revoke the package and issue a new one.</p>}
          <div className="lb-actions">
            {!pkg && <button onClick={issue}>Issue a context package</button>}
            {pkg && !revoked && !lapsed && <button onClick={() => { setPkg({ ...pkg, package: revokePackage(pkg.package, asOf) }); setNotice({ kind: 'ok', text: 'Package revoked.' }); }}>Revoke the package</button>}
            {(revoked || lapsed) && <button onClick={issue}>Issue a new package</button>}
          </div>
          {pkg && (
            <div className="lb-two">
              <div><h3>Included</h3><ul className="lb-list">{pkg.package.included.map(i => <li key={i.id}>{i.title}</li>)}</ul></div>
              <div><h3>Withheld</h3><ul className="lb-list">{pkg.audit.withheld.map(i => <li key={i.id}>{i.title}: {i.reasons[0]}</li>)}</ul></div>
            </div>
          )}
          {earlier.length > 0 && (<>
            <h3>Issued before</h3>
            <ul className="lb-list">{earlier.map(x => <li key={x.package.id}>Issued {fmt(x.package.issued)}, {x.package.revokedAt ? `revoked ${fmt(x.package.revokedAt)}` : `ends ${fmt(x.package.expires)}`}. It held {x.package.included.map(i => i.title).join(', ') || 'nothing'}.</li>)}</ul>
          </>)}
        </section>
      )}

      {/* The rules are read in Orient. Here they are the brief's reference, one step away. */}
      {canonRules.length > 0 && (
        <Closed title={study ? 'What this study reads as current' : 'Rules in force'}>
          <RuleGroups rules={canonRules} brand={brand} items={items} setOpenId={setOpenId} canon study={study} />
        </Closed>
      )}
      {otherRules.length > 0 && (
        <Closed title={study ? 'Also on the public record' : 'Rules as written, not adopted'}>
          <RuleGroups rules={otherRules} brand={brand} items={items} setOpenId={setOpenId} study={study} />
        </Closed>
      )}
      {brief.snapshot.length > 0 && (
        <Closed title={`Sources, as they stood on ${fmt(brief.frozenAt)}`}>
          <table className="lb-table lb-table-stack">
            <thead><tr><th>Source</th><th>{study ? 'Read here as' : 'Standing'}</th><th>How far it has been checked</th></tr></thead>
            <tbody>{brief.snapshot.map(s => <tr key={s.id}><td><Cite id={s.id} items={items} setOpenId={setOpenId} /></td><td data-th={study ? 'Read here as' : 'Standing'}>{classOf(s.standing, brand).name}</td><td data-th="Checked">{{ discovered: 'Only found', extracted: 'Read from its source, not checked', interpreted: 'Read and described, not checked', verified: 'Checked against its source', approved: 'Checked and approved' }[s.pipeline] || cap(s.pipeline)}</td></tr>)}</tbody>
          </table>
        </Closed>
      )}
      <NextStep stage="organize" go={go} />
    </article>
  );
}

/* Transfer --------------------------------------------------------------- */
function Transfer({ catalog, asOf, state, brand, pkgs, stance }) {
  const e = state.engagement;
  const brief = buildBrief(brand, e, state.choices, { asOf });
  const handoff = buildHandoff(state, { brief, asOf, packages: pkgs.map(x => x.package) });
  const bench = exportWorkbench(catalog.practitioner);
  const study = stance === 'study';
  const owner = stance === 'owner';
  const slug = brand.id;
  const [shown, setShown] = useState(null);
  const offer = (name, data) => setShown(save(name, data));
  return (
    <article>
      <h1>{e.reading?.transfer?.headline || (study ? `What a study of ${brand.name} can and cannot hand over` : owner ? 'Keep the record of this pass' : `Leave ${brand.name} more capable than you found it`)}</h1>
      <p className="lb-deck">{e.reading?.transfer?.deck || (study
        ? `This is yours. ${brand.name} did not commission it. It keeps every source with its link, your reading, your choices and the questions only ${brand.name} can answer.`
        : owner
          ? `Everything here is ${brand.name}'s, and yours to keep: where each record came from, what you decided and why, what you answered, and what is still open.`
          : `The engagement package belongs to ${brand.name}. It keeps the sources with their provenance, the interpretation, every choice, proposal and decision, and the questions still open.`)}</p>
      <section className="lb-section">
        <h2>{study ? 'The study holds' : owner ? 'What is in it' : `${brand.name} keeps`}</h2>
        <ul className="lb-list">
          <li>Every source, with where it came from{study ? ' and what it rests on' : ', its stage and its rights'}</li>
          <li>{study ? 'Your reading, your choices, your notes and what you found' : owner ? 'Every decision, choice and answer, with the date and your reason' : 'Every choice, proposal, decision and answer, with who made it'}</li>
          <li>{study ? `The questions only ${brand.name} can answer` : 'What is not yet resolved, and the questions still open'}</li>
          {!study && <li>The interpretation{brief.evaluation.length ? ', and the brief with its evaluation set before the work' : ''}</li>}
        </ul>
        {/* What is lost by not downloading is said before the buttons, not after them. */}
        <p className="lb-body">What you record on this page is saved in this browser only. The packet is the whole record in one file, to keep, to move, or to open with an assistant that has Living Brand connected. The engagement package is the same record arranged for handing over. Both are data files, not documents to read.</p>
        <div className="lb-actions">
          <button className="lb-primary" onClick={() => offer(`${slug}.packet.json`, toPacket(state))}>Download the packet</button>
          <button onClick={() => offer(`${slug}-engagement-package.json`, handoff)}>Download the engagement package</button>
        </div>
        {handoff.notCompleted.length > 0 && <p className="lb-body">{handoff.completed.length ? `${cap(handoff.completed.join(' and '))} is done. ` : ''}{cap(handoff.notCompleted.join(', '))} {handoff.notCompleted.length === 1 ? 'is a separate piece of work' : 'are separate pieces of work'}, not done here.</p>}
      </section>
      {stance === 'visitor' && (
        <section className="lb-section">
          <h2>You keep</h2>
          <ul className="lb-list">{bench.methods.map(m => <li key={m}>{m}</li>)}</ul>
          <p className="lb-body">Your methods and preferences, and a record that the engagements happened. No {brand.name} material leaves with you.</p>
          <div className="lb-actions"><button onClick={() => offer('workbench.json', bench)}>Download your workbench</button></div>
        </section>
      )}
      {shown && <Export file={shown} />}
    </article>
  );
}

/* Other viewers ---------------------------------------------------------- */
function PersonView({ asOf, state, brand, items, tensions, act, setOpenId, personId }) {
  const [asking, setAsking] = useState({ id: null, kind: null, note: '' });
  const none = { id: null, kind: null, note: '' };
  const powers = Object.entries(brand.authority || {}).filter(([, ids]) => ids.includes(personId)).map(([p]) => p);
  const mine = p => items[p.itemId] && canDecide(brand, personId, powerFor(items[p.itemId]));
  const routed = state.choices.filter(c => c.owner === personId && c.needs && c.status !== 'withdrawn');
  const hyps = organizationalHypotheses(brand, state.engagement).filter(h => h.owner === personId);
  const canon = brand.items.filter(i => i.standing === 'canon' && canDecide(brand, personId, powerFor(i)));
  const reused = brand.items.filter(i => (i.reuse?.length || 0) >= 3 && i.standing !== 'canon' && canDecide(brand, personId, powerFor(i)));
  const others = state.proposals.filter(p => p.status === 'open' && !mine(p));
  const company = viewFor('executive', brand).filter(i => i.level === 'company');
  const waiting = state.proposals.filter(p => p.status === 'open' && mine(p)).length + routed.filter(c => c.status === 'awaiting decision').length;
  // What the record says is theirs to resolve, whether or not anyone has put it to them.
  const settled = decidedEntries(state.choices);
  const named = (tensions || []).filter(t => (t.owners || []).includes(personId) && !settled.has(t.id));
  return (
    <article>
      <h1>{waiting ? `${waiting} ${waiting === 1 ? 'decision is' : 'decisions are'} waiting for ${person(brand, personId)}` : named.length ? `Nothing has been put to ${person(brand, personId)} yet` : `Nothing is waiting for ${person(brand, personId)}`}</h1>
      <p className="lb-deck">{person(brand, personId)} decides {powers.map(p => POWERS[p]).join(', ')} at {brand.name}. Each decision keeps its evidence, scope, date and what it replaced.</p>

      <section className="lb-section">
        <h2>Proposals you can decide</h2>
        <Proposals asOf={asOf} state={state} brand={brand} items={items} setOpenId={setOpenId} act={act} decider={personId} me={personId} only={mine} />
      </section>

      {named.length > 0 && (
        <section className="lb-section">
          <h2>What the record leaves for you to resolve</h2>
          <ul className="lb-findings">
            {named.map(t => (
              <Entry key={t.id} title={`${stop(t.title)}.`}>
                <p>{t.detail}</p>
                {t.points?.length > 0 && <ul className="lb-list">{t.points.map(pt => <li key={pt.ruleId}>{pt.rule} {pt.says || `It has ${pt.has}.`}</li>)}</ul>}
                <Cites ids={t.sources} items={items} setOpenId={setOpenId} />
              </Entry>
            ))}
          </ul>
        </section>
      )}

      {routed.length > 0 && (
        <section className="lb-section">
          <h2>Choices routed to you</h2>
          <ul className="lb-findings">{routed.map(c => (
            <li key={c.id}>
              <p><strong>{CHOICES[c.verdict]}: {stop(c.subject)}.</strong> {c.rationale}</p>
              <Cites ids={c.sources || []} items={items} setOpenId={setOpenId} />
              {c.status !== 'awaiting decision' && <p className="lb-meta">{choiceStatus(c, brand, personId)}.</p>}
              {c.status === 'awaiting decision' && asking.id !== c.id && (
                <div className="lb-actions">
                  <button className="lb-primary" onClick={() => act(s => answerChoice(s, c.id, { by: personId, outcome: 'accept', asOf }), 'Accepted.')}>Accept</button>
                  <button onClick={() => setAsking({ id: c.id, kind: 'decline', note: '' })}>Decline</button>
                </div>
              )}
              {c.status === 'awaiting decision' && asking.id === c.id && (
                <form className="lb-form" onSubmit={x => { x.preventDefault(); if (act(s => answerChoice(s, c.id, { by: personId, outcome: 'decline', note: asking.note, asOf }), 'Declined. The choice stays on record.')) setAsking(none); }}>
                  <label>Why it is declined<input autoFocus value={asking.note} onChange={x => setAsking({ ...asking, note: x.target.value })} /></label>
                  <div className="lb-actions"><button type="submit">Decline it</button><button type="button" onClick={() => setAsking(none)}>Cancel</button></div>
                </form>
              )}
            </li>
          ))}</ul>
        </section>
      )}

      {hyps.map(h => (
        <section key={h.id} className="lb-section">
          <h2>{h.title}</h2>
          <p>{h.statement}</p>
          <ul className="lb-list">{h.evidence.map(x => <li key={x.id}>{x.statement} <Cite id={x.item} items={items} setOpenId={setOpenId} /></li>)}</ul>
          <p><strong>Why it is uncertain.</strong> {h.uncertainty}</p>
          {h.test && <p><strong>How it could be tested.</strong> {h.test}</p>}
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
                  <label>Why it is being retired<input autoFocus value={asking.note} onChange={x => setAsking({ ...asking, note: x.target.value })} /></label>
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

function Partner({ asOf, state, pkg: issued, brand }) {
  const pkg = issued?.package;
  if (!pkg) return (<article><h1>No context package has been issued to you</h1><p className="lb-deck">{brand.name}'s material is reachable only through a package the engagement issues. Under "Viewing as", go back to {state.engagement.practitioner || 'the practitioner'} and issue one in Organize.</p></article>);
  if (pkg.revokedAt) return (<article><h1>Your access to {brand.name} was revoked</h1><p className="lb-deck">Revoked on {fmt(pkg.revokedAt)}. Nothing from the package remains readable here.</p></article>);
  if (!packageValid(pkg, asOf)) return (<article><h1>Your access to {brand.name} has ended</h1><p className="lb-deck">The package ended on {fmt(pkg.expires)}. Nothing from it remains readable here.</p></article>);
  // What the record would hand over today. Anything in the package that is no longer in it has been withdrawn.
  let now = null;
  try { now = buildContextPackage(state, { partner: pkg.partner, assignment: pkg.assignment, channels: state.engagement.partner?.channels || [], workTypes: state.engagement.partner?.workTypes || [], powers: ['read'], expires: pkg.expires, asOf, seq: issued.issued }).package; } catch { now = null; }
  const stillIn = list => (now ? list.filter(i => now.included.some(n => n.id === i.id)) : list);
  const stillRule = list => (now ? list.filter(r => now.rules.some(n => n.id === r.id)) : list);
  const withdrawn = now ? pkg.included.filter(i => !now.included.some(n => n.id === i.id)) : [];
  return (
    <article>
      <h1>{pkg.assignment}</h1>
      <p className="lb-deck">For {pkg.brand}. You may read what is below. You may not publish or change the brand's knowledge; work returns to {pkg.review.reviewer || 'the company'} for review. Access ends {fmt(pkg.expires)}.</p>
      {withdrawn.length > 0 && <section className="lb-section"><h2>Withdrawn since this was issued</h2><p className="lb-body">{withdrawn.map(i => i.title).join(', ')} {withdrawn.length === 1 ? 'is' : 'are'} no longer cleared for you. Stop using {withdrawn.length === 1 ? 'it' : 'them'}, and the rules that came from {withdrawn.length === 1 ? 'it' : 'them'}.</p></section>}
      <section className="lb-section"><h2>Rules</h2><ul className="lb-list">{stillRule(pkg.rules).map(r => <li key={r.id}>{r.statement} <span className="lb-meta">{STANDING_CLASSES[r.standing]?.name || cap(r.standing)}</span></li>)}</ul></section>
      <section className="lb-section"><h2>Material you may use</h2><ul className="lb-list">{stillIn(pkg.included).map(i => <li key={i.id}>{i.title}</li>)}</ul></section>
      {(now ? now.open : pkg.open).length > 0 && <section className="lb-section"><h2>Unresolved, ask before relying on</h2><ul className="lb-list">{(now ? now.open : pkg.open).map(o => <li key={o.title}>{stop(o.title)}. Ask {o.ask}.</li>)}</ul></section>}
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
