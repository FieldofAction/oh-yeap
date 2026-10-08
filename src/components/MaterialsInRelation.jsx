import { useId, useRef, useState } from 'react';
import { MATERIAL_DOMAINS, CONNECTION_STUDIES, INVITATION_EXAMPLE, blankStudy, normalizeStudy, studyMarkdown } from '../data/materials';
import '../styles/materials.css';

const STORAGE_KEY = 'foa.materials-in-relation.v1';
const STATUS_HELP = {
  analogy: 'A resemblance that helps you think. It does not establish a shared mechanism.',
  hypothesis: 'A possible influence to investigate in this situation.',
  observation: 'Something recorded in a particular context. It does not establish a universal rule or causation.',
};

function readStudy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { study: blankStudy(), message: 'Your study stays on this device.' };
    const value = JSON.parse(raw);
    if (value?.version !== 1) return { study: blankStudy(), message: 'A saved study could not be read. New notes are not saved until you edit.' };
    return { study: normalizeStudy(value), message: 'Restored from this device.' };
  } catch {
    return { study: blankStudy(), message: 'Device storage is unavailable or unreadable. Export your notes before leaving.' };
  }
}

function Field({ label, hint, value, onChange, rows = 3 }) {
  const id = useId();
  return <div className="mir-field">
    <label htmlFor={id}>{label}</label>
    {hint && <p id={`${id}-hint`}>{hint}</p>}
    <textarea id={id} rows={rows} value={value} onChange={e => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
  </div>;
}

function MaterialWheel({ domain, selected, onSelect }) {
  const material = domain.items.find(m => m.id === selected);
  return <>
    <p className="mir-context">{domain.note}</p>
    <div className="mir-wheel" role="group" aria-label={`${domain.name} material chart`}>
      <svg viewBox="0 0 400 400" aria-hidden="true">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="158" />
        <circle cx="200" cy="200" r="74" />
        {domain.items.map((item, i) => {
          const angle = (-90 + (i - .5) * 360 / 7) * Math.PI / 180;
          return <line key={item.id} x1={200 + 74 * Math.cos(angle)} y1={200 + 74 * Math.sin(angle)} x2={200 + 158 * Math.cos(angle)} y2={200 + 158 * Math.sin(angle)} />;
        })}
      </svg>
      <div className="mir-wheel-center"><span>{domain.name}</span><strong>{domain.center}</strong></div>
      {domain.items.map((item, i) => {
        const angle = (-90 + i * 360 / 7) * Math.PI / 180;
        return <button type="button" key={item.id} className="mir-material" aria-pressed={item.id === selected}
          onClick={() => onSelect(item.id)} style={{ left: `${50 + 30 * Math.cos(angle)}%`, top: `${50 + 30 * Math.sin(angle)}%` }}>{item.name}</button>;
      })}
    </div>
    <p className="mir-wheel-caption">{domain.practice}</p>
    <div className="mir-material-detail" aria-live="polite" aria-atomic="true">
      <h4>{material.name}</h4>
      <dl>
        <div><dt>Behavior</dt><dd>{material.behavior}</dd></div>
        <div><dt>Resistance</dt><dd>{material.resistance}</dd></div>
        <div><dt>Try</dt><dd>{material.move}</dd></div>
        <div><dt>Ask</dt><dd>{material.question}</dd></div>
      </dl>
    </div>
  </>;
}

export default function MaterialsInRelation() {
  const [initial] = useState(readStudy);
  const [study, setStudy] = useState(initial.study);
  const [message, setMessage] = useState(initial.message);
  const [view, setView] = useState('connections');
  const [example, setExample] = useState('invitation');
  const [replaceAction, setReplaceAction] = useState(null);
  const modesRef = useRef(null);
  const id = useId();
  const guide = CONNECTION_STUDIES.find(s => s.id === example);
  const domain = MATERIAL_DOMAINS.find(d => d.id === view);
  const hasWork = Object.keys(blankStudy()).some(key => typeof study[key] === 'string' && key !== 'connectionStatus' && study[key].trim()) || study.history.length > 0;

  function save(next, feedback = 'Saved on this device.') {
    setStudy(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setMessage(feedback); }
    catch { setMessage('Your notes are available here, but could not be saved on this device. Export before leaving.'); }
  }
  const edit = (key, value) => save({ ...study, [key]: value });
  const selectMaterial = (key, value) => save({ ...study, selected: { ...study.selected, [key]: value } });
  const field = (key, label, hint, rows) => <Field key={key} label={label} hint={hint} rows={rows} value={study[key]} onChange={value => edit(key, value)} />;

  function openRecord() {
    setView('record');
    requestAnimationFrame(() => modesRef.current?.scrollIntoView({ block: 'start' }));
  }

  function begin(action) {
    if (hasWork) { setReplaceAction(action); return; }
    replaceStudy(action);
  }
  function replaceStudy(action) {
    save(action === 'example' ? normalizeStudy(INVITATION_EXAMPLE) : blankStudy(), action === 'example' ? 'Example loaded. Observations are yours to record.' : 'New study started.');
    setReplaceAction(null);
    openRecord();
  }
  function exportStudy() {
    try {
      const url = URL.createObjectURL(new Blob([studyMarkdown(study)], { type: 'text/markdown;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'materials-in-relation-study.md';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Study export prepared. Your device handles the download.');
    } catch { setMessage('The download could not start. Select and copy your notes before leaving.'); }
  }
  function recordIteration() {
    const { history, ...snapshot } = study;
    save({ ...study, history: [...history, { ...snapshot, recordedAt: new Date().toISOString() }] }, 'Iteration recorded. It is included in your export.');
  }
  const last = study.history.at(-1);
  const sameAsLast = last && Object.entries(study).filter(([key]) => key !== 'history').every(([key, value]) => JSON.stringify(value) === JSON.stringify(last[key]));

  return <section className="mir" aria-labelledby={`${id}-heading`}>
    <div className="ph-sl">Instrument · v0.1</div>
    <h2 id={`${id}-heading`}>Materials in Relation</h2>
    <p className="mir-lead">Study what a material makes possible. Compose the conditions. Learn from what happens.</p>
    <p>A chair, an interface, and an invitation can shape the same encounter. This instrument brings physical, digital, and relational materials into a shared study while preserving the differences between them.</p>
    <p>Use each chart on its own to explore behavior and resistance. Bring materials together around a situation, propose a connection, and try a small change. Return with an observation that can revise the proposal.</p>
    <details className="mir-about">
      <summary>What the charts inherit—and what remains open</summary>
      <p>The Bauhaus diagram organized a curriculum: preliminary study, material workshops, and building. Its useful inheritance here is learning through material experiments. Google’s Material Design gives digital surfaces and transitions a consistent behavioral language. The relational chart asks how an encounter changes through attention, timing, permission, and response.</p>
      <p>These are overlapping registers of practice. A digital interface depends on physical infrastructure; a physical room already organizes relationships. No material has a fixed social meaning. Participants, culture, history, power, and ecological costs change what a design does.</p>
      <p>“Relational material” names qualities and conditions we can work with. People participate with their own agency. Trust, belonging, and coherence may emerge; they cannot be set like interface properties.</p>
      <p>The vocabulary is provisional. Use the study’s condition notes for materials, systems, or forces that the charts do not yet name.</p>
      <p className="mir-sources">Sources: <a href="https://www.getty.edu/research/exhibitions_events/exhibitions/bauhaus/new_artist/history/principles_curriculum/" target="_blank" rel="noreferrer">Gropius’s curriculum, via Getty</a> · <a href="https://m1.material.io/material-design/introduction.html" target="_blank" rel="noreferrer">Google Material Design</a>. The digital and relational charts and their connections are working interpretations developed for this instrument.</p>
    </details>

    <div ref={modesRef} className="mir-modes" role="group" aria-label="Instrument view">
      {[['connections', 'Connections'], ...MATERIAL_DOMAINS.map(d => [d.id, d.name]), ['record', 'Study record']].map(([key, label]) => <button type="button" key={key} aria-pressed={view === key} aria-controls={`${id}-view`} onClick={() => setView(key)}>{label}</button>)}
    </div>

    <div id={`${id}-view`} className="mir-view">
      {domain && <><MaterialWheel domain={domain} selected={study.selected[domain.id]} onSelect={value => selectMaterial(domain.id, value)} /><p className="mir-context">This material is selected in your study. Switch to Connections to see the composition, or add its specific form in the study record.</p></>}

      {view === 'connections' && <>
        <div className="mir-view-title"><h3>Your composition</h3><span className="mir-kicker">Three registers · one situation</span></div>
        <div className="mir-composition">
          {MATERIAL_DOMAINS.map(d => <div className="mir-domain" key={d.id}>
            <label htmlFor={`${id}-${d.id}`}>{d.name}</label>
            <select id={`${id}-${d.id}`} value={study.selected[d.id]} onChange={e => selectMaterial(d.id, e.target.value)}>{d.items.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <p>{d.items.find(m => m.id === study.selected[d.id]).question}</p>
            <button type="button" className="mir-text-button" onClick={() => setView(d.id)}>Explore {d.name.toLowerCase()} chart ↗</button>
          </div>)}
        </div>
        <svg className="mir-joins" viewBox="0 0 600 50" aria-hidden="true"><path d="M100 0V20H300V50M300 0V50M500 0V20H300" /></svg>
        <div className="mir-intention"><span className="mir-kicker">What becomes possible?</span><p>{study.intention || 'Name a situation and an intention to give these choices a purpose.'}</p></div>
        <p className="mir-context">The lines gather your choices around an intention. They do not assert causation or equivalence.</p>
        {field('connection', 'How might these conditions affect one another?', 'Name a specific connection. What might support or contradict it?')}
        <label className="mir-select-label" htmlFor={`${id}-status`}>Connection status</label>
        <select id={`${id}-status`} value={study.connectionStatus} onChange={e => edit('connectionStatus', e.target.value)}>{Object.keys(STATUS_HELP).map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
        <p className="mir-context">{STATUS_HELP[study.connectionStatus]}</p>
        {study.connectionStatus === 'observation' && !study.observation.trim() && <p className="mir-notice">Add the context and evidence in your study record to support this label.</p>}
        <details className="mir-examples">
          <summary>Explore a possible connection</summary>
          <label className="mir-select-label" htmlFor={`${id}-example`}>Study prompt</label>
          <select id={`${id}-example`} value={example} onChange={e => setExample(e.target.value)}>{CONNECTION_STUDIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <h4>{guide.question}</h4>
          <p>{guide.connection}</p><p className="mir-context">{guide.limit}</p>
          <p className="mir-kicker">{guide.status || 'Hypothesis'} · starting point</p>
          <button type="button" className="mir-button" onClick={() => { save({ ...study, selected: { ...guide.selected } }, 'Example materials selected. Your written connection is unchanged.'); }}>Use these material choices</button>
        </details>
      </>}

      {view === 'record' && <div>
        <div className="mir-view-title"><h3>Working study</h3><span className="mir-kicker">Frame → compose → try → observe → revise</span></div>
        <p className="mir-context">Begin with one situation and one change. The record can stay incomplete while the work is happening. An observation, refusal, or disagreement can change the next move.</p>
        <fieldset><legend>01 · Frame the situation</legend>
          {field('situation', 'What is happening, and where?')}
          {field('intention', 'What should become possible, and for whom?')}
          {field('participants', 'Who and what participates?', 'Include people, technologies, spaces, ecological conditions, and absent voices that matter.')}
          {field('power', 'Who sets the terms?', 'Who can enter, refuse, change the conditions, or leave? Who bears the cost?')}
        </fieldset>
        <fieldset><legend>02 · Compose the conditions</legend>
          {MATERIAL_DOMAINS.map(d => <div key={d.id} className="mir-condition">
            <label className="mir-select-label" htmlFor={`${id}-record-${d.id}`}>{d.name} material</label>
            <select id={`${id}-record-${d.id}`} value={study.selected[d.id]} onChange={e => selectMaterial(d.id, e.target.value)}>{d.items.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            {field(`${d.id}Note`, `${d.name} condition in this situation`, 'Describe the actual arrangement or add a material the chart does not name.', 2)}
          </div>)}
          {field('connection', 'Proposed connection')}
          <label className="mir-select-label" htmlFor={`${id}-record-status`}>Connection status</label>
          <select id={`${id}-record-status`} value={study.connectionStatus} onChange={e => edit('connectionStatus', e.target.value)}>{Object.keys(STATUS_HELP).map(s => <option value={s} key={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
          <p className="mir-context">{STATUS_HELP[study.connectionStatus]}</p>
        </fieldset>
        <fieldset><legend>03 · Try a change</legend>
          {field('change', 'One change to try', 'Choose something specific and small enough to revisit.')}
          {field('expectation', 'What do you expect, and why?')}
          {field('notice', 'What would support or challenge that expectation?', 'Do not use participation alone as proof of comfort, consent, or trust.')}
          {field('review', 'When and with whom will you review?', undefined, 2)}
          {field('stop', 'What would make you stop or reverse the change?', undefined, 2)}
        </fieldset>
        <fieldset><legend>04 · Observe</legend>
          {field('observation', 'What actually happened?', 'Record the context and what you noticed. Keep your interpretation distinguishable from events.')}
          {field('accounts', 'What did participants say?', 'Include disagreement and uncertainty. Record only what people agree to share.')}
          {field('surprise', 'What surprised you?', 'Include costs, exclusions, unintended effects, and what remains unknown.')}
        </fieldset>
        <fieldset><legend>05 · Revise</legend>
          {field('revision', 'What will you keep, change, or stop?', 'A useful next move can be to repair, withdraw, or leave a condition alone.')}
          <button type="button" className="mir-button" disabled={!study.observation.trim() || !study.revision.trim() || sameAsLast} onClick={recordIteration}>Record this iteration</button>
          <p className="mir-context">Add an observation and a next move to record an iteration. Earlier iterations remain in your export as you continue editing.</p>
        </fieldset>
        {study.history.length > 0 && <details className="mir-history"><summary>{study.history.length} recorded {study.history.length === 1 ? 'iteration' : 'iterations'}</summary>{study.history.map((h, i) => <article key={`${h.recordedAt}-${i}`}><h4>Iteration {i + 1}</h4><time dateTime={h.recordedAt}>{h.recordedAt.slice(0, 10)}</time><p><strong>Observed:</strong> {h.observation}</p><p><strong>Next:</strong> {h.revision}</p></article>)}</details>}
      </div>}
    </div>

    <div className="mir-actions">
      {view !== 'record' && <button type="button" className="mir-button mir-primary" onClick={openRecord}>Open study record</button>}
      <button type="button" className="mir-button" onClick={exportStudy}>Export study</button>
      <button type="button" className="mir-text-button" onClick={() => begin('example')}>Start from the arrival example</button>
      <button type="button" className="mir-text-button" onClick={() => begin('blank')}>New blank study</button>
    </div>
    {replaceAction && <div className="mir-replace" role="group" aria-label="Replace current study">
      <p>This replaces your current study and its recorded iterations on this device. Export them first if you want to keep them.</p>
      <button type="button" className="mir-button" onClick={exportStudy}>Export current study</button>
      <button type="button" className="mir-button" onClick={() => replaceStudy(replaceAction)}>Replace study</button>
      <button type="button" className="mir-text-button" onClick={() => setReplaceAction(null)}>Keep current study</button>
    </div>}
    <p className="mir-storage" role="status">{message}</p>
    <p className="mir-context">Notes are stored in this browser, not sent to Field of Action. Export a copy to keep or share your study.</p>
  </section>;
}
