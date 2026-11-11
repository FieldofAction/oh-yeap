import { useState, useCallback } from "react";
import useExplorationStore from "../store/useExplorationStore";
import "../styles/workbench.css";
import "../styles/workshop-tools.css";

const STATUS_WORDS = { seed: "Seed", wip: "In progress", live: "Live", archived: "Archived" };
const RESOLUTION_WORDS = { resolved: "Resolved", reframed: "Reframed", absorbed: "Absorbed" };

function NewExplorationForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [tags, setTags] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      subtitle: subtitle.trim(),
      hypothesis: hypothesis.trim(),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <form className="tl-section" onSubmit={handleCreate}>
      <div className="wb-signal">
        <label htmlFor="ee-new-title" className="wb-label">Title</label>
        <input id="ee-new-title" className="wb-field" value={title} onChange={e => setTitle(e.target.value)} autoFocus autoComplete="off" />
      </div>
      <div className="wb-signal">
        <label htmlFor="ee-new-subtitle" className="wb-label">Subtitle, if it has one</label>
        <input id="ee-new-subtitle" className="wb-field" value={subtitle} onChange={e => setSubtitle(e.target.value)} autoComplete="off" />
      </div>
      <div className="wb-signal">
        <label htmlFor="ee-new-hypothesis" className="wb-label">The driving question</label>
        <textarea id="ee-new-hypothesis" className="wb-field tl-area" value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={3} />
      </div>
      <div className="wb-signal">
        <label htmlFor="ee-new-tags" className="wb-label">Tags, separated by commas</label>
        <input id="ee-new-tags" className="wb-field" value={tags} onChange={e => setTags(e.target.value)} autoComplete="off" />
      </div>
      <div className="wb-actions">
        <button type="submit" className="wb-button" disabled={!title.trim()}>Create</button>
        <button type="button" className="wb-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function AddFragmentForm({ onAdd, onCancel }) {
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (type === "note") {
      onAdd({ type: "note", content: content.trim() });
    } else {
      onAdd({ type: "visual", caption: content.trim() });
    }
    setContent("");
  };

  return (
    <form className="tl-inline-form" onSubmit={handleAdd}>
      <div className="wb-signal">
        <label htmlFor="ee-frag-type" className="wb-label">Kind</label>
        <select id="ee-frag-type" className="tl-select" value={type} onChange={e => setType(e.target.value)}>
          <option value="note">Note</option>
          <option value="visual">Visual</option>
        </select>
      </div>
      <div className="wb-signal">
        <label htmlFor="ee-frag-text" className="wb-label">{type === "note" ? "What did you observe or learn?" : "Describe the visual"}</label>
        <textarea id="ee-frag-text" className="wb-field tl-area" value={content} onChange={e => setContent(e.target.value)} rows={3} autoFocus />
      </div>
      <div className="wb-actions">
        <button type="submit" className="wb-button" disabled={!content.trim()}>Add</button>
        <button type="button" className="wb-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ResolveForm({ onResolve, onCancel }) {
  const [status, setStatus] = useState("resolved");
  const [note, setNote] = useState("");

  return (
    <form className="tl-inline-form" onSubmit={(e) => { e.preventDefault(); onResolve({ status, note: note.trim() }); }}>
      <div className="wb-signal">
        <label htmlFor="ee-res-status" className="wb-label">What happened to it</label>
        <select id="ee-res-status" className="tl-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="resolved">Resolved</option>
          <option value="reframed">Reframed</option>
          <option value="absorbed">Absorbed</option>
        </select>
      </div>
      <div className="wb-signal">
        <label htmlFor="ee-res-note" className="wb-label">A note, if you want one</label>
        <input id="ee-res-note" className="wb-field" value={note} onChange={e => setNote(e.target.value)} autoFocus autoComplete="off" />
      </div>
      <div className="wb-actions">
        <button type="submit" className="wb-button">Confirm</button>
        <button type="button" className="wb-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ExplorationDetail({ exploration, store }) {
  const [showAddFragment, setShowAddFragment] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [editingHypothesis, setEditingHypothesis] = useState(false);
  const [hypothesisText, setHypothesisText] = useState(exploration.sketch.hypothesis);
  const [resolvingIdx, setResolvingIdx] = useState(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [connTitle, setConnTitle] = useState("");
  const [connWhy, setConnWhy] = useState("");

  const sk = exploration.sketch;

  // Normalize questions to object format
  const questions = (sk.openQuestions || []).map(q =>
    typeof q === "string" ? { text: q, status: "open" } : q
  );

  const handleSaveHypothesis = (e) => {
    e.preventDefault();
    store.updateHypothesis(exploration.title, hypothesisText);
    setEditingHypothesis(false);
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    store.addQuestion(exploration.title, newQuestion.trim());
    setNewQuestion("");
    setShowAddQuestion(false);
  };

  const handleAddConnection = (e) => {
    e.preventDefault();
    if (!connTitle.trim()) return;
    store.addConnection(exploration.title, { title: connTitle.trim(), why: connWhy.trim() });
    setConnTitle("");
    setConnWhy("");
    setShowAddConnection(false);
  };

  return (
    <div className="wb-tool-body">
      <div className="wb-block">
        <h2 className="wb-headline">{exploration.title}</h2>
        {exploration.subtitle ? <p className="wb-body">{exploration.subtitle}</p> : null}
        {exploration.tags?.length > 0 ? <p className="wb-body">{exploration.tags.join(", ")}</p> : null}
      </div>

      <div className="wb-signal tl-narrow">
        <label htmlFor="ee-status" className="wb-label">Status</label>
        <select id="ee-status" className="tl-select" value={exploration.status} onChange={e => store.updateStatus(exploration.title, e.target.value)}>
          {Object.entries(STATUS_WORDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="tl-section">
        <h3 className="bg-question-title">Hypothesis</h3>
        {editingHypothesis ? (
          <form className="tl-inline-form" onSubmit={handleSaveHypothesis}>
            <textarea className="wb-field tl-area" aria-label="Hypothesis" value={hypothesisText} onChange={e => setHypothesisText(e.target.value)} rows={3} />
            <div className="wb-actions">
              <button type="submit" className="wb-button">Save</button>
              <button type="button" className="wb-link" onClick={() => { setEditingHypothesis(false); setHypothesisText(sk.hypothesis); }}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <p className="wb-text wb-measure">{sk.hypothesis}</p>
            <div className="wb-actions">
              <button type="button" className="wb-link" onClick={() => setEditingHypothesis(true)}>Edit the hypothesis</button>
            </div>
          </>
        )}
      </div>

      <div className="tl-section">
        <h3 className="bg-question-title">Fragments</h3>
        {showAddFragment ? (
          <AddFragmentForm
            onAdd={f => { store.addFragment(exploration.title, f); setShowAddFragment(false); }}
            onCancel={() => setShowAddFragment(false)}
          />
        ) : (
          <div className="wb-actions">
            <button type="button" className="wb-link" onClick={() => setShowAddFragment(true)}>Add a fragment</button>
          </div>
        )}
        <div className="tl-list">
          {[...sk.fragments].reverse().map((f, i) => (
            <div key={i} className="tl-row">
              <p className="wb-text wb-measure">{f.type === "note" ? f.content : f.caption}</p>
              <p className="wb-body">{f.type === "note" ? "Note" : "Visual"}{f.date ? `, ${f.date}` : ""}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="tl-section">
        <h3 className="bg-question-title">Questions</h3>
        {showAddQuestion ? (
          <form className="tl-inline-form" onSubmit={handleAddQuestion}>
            <div className="wb-signal">
              <label htmlFor="ee-new-q" className="wb-label">What remains unresolved?</label>
              <textarea id="ee-new-q" className="wb-field tl-area" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} rows={2} autoFocus />
            </div>
            <div className="wb-actions">
              <button type="submit" className="wb-button" disabled={!newQuestion.trim()}>Add</button>
              <button type="button" className="wb-link" onClick={() => setShowAddQuestion(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="wb-actions">
            <button type="button" className="wb-link" onClick={() => setShowAddQuestion(true)}>Add a question</button>
          </div>
        )}
        <div className="tl-list">
          {questions.map((q, i) => (
            <div key={i} className="tl-row">
              <p className={q.status === "open" ? "wb-text wb-measure" : "wb-body wb-measure"}>{q.text}</p>
              {q.status !== "open" ? (
                <p className="wb-body">{RESOLUTION_WORDS[q.status] || q.status}{q.note ? `: ${q.note}` : ""}{q.date ? ` (${q.date})` : ""}</p>
              ) : null}
              {q.status === "open" && resolvingIdx === i ? (
                <ResolveForm
                  onResolve={r => { store.resolveQuestion(exploration.title, i, r); setResolvingIdx(null); }}
                  onCancel={() => setResolvingIdx(null)}
                />
              ) : null}
              {q.status === "open" && resolvingIdx !== i ? (
                <div className="wb-actions">
                  <button type="button" className="wb-link" onClick={() => setResolvingIdx(i)}>Resolve</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="tl-section">
        <h3 className="bg-question-title">Connections</h3>
        {showAddConnection ? (
          <form className="tl-inline-form" onSubmit={handleAddConnection}>
            <div className="wb-signal">
              <label htmlFor="ee-conn-title" className="wb-label">Connected to</label>
              <input id="ee-conn-title" className="wb-field" value={connTitle} onChange={e => setConnTitle(e.target.value)} autoFocus autoComplete="off" />
            </div>
            <div className="wb-signal">
              <label htmlFor="ee-conn-why" className="wb-label">Why this connection matters</label>
              <input id="ee-conn-why" className="wb-field" value={connWhy} onChange={e => setConnWhy(e.target.value)} autoComplete="off" />
            </div>
            <div className="wb-actions">
              <button type="submit" className="wb-button" disabled={!connTitle.trim()}>Add</button>
              <button type="button" className="wb-link" onClick={() => setShowAddConnection(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="wb-actions">
            <button type="button" className="wb-link" onClick={() => setShowAddConnection(true)}>Add a connection</button>
          </div>
        )}
        <div className="tl-list">
          {sk.connections.map((c, i) => (
            <div key={i} className="tl-row">
              <p className="wb-name">{c.title}</p>
              {c.why ? <p className="wb-body wb-measure">{c.why}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExplorationEditor({ navigateTo }) {
  const store = useExplorationStore();
  const [activeTitle, setActiveTitle] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const active = activeTitle ? store.explorations.find(e => e.title === activeTitle) : null;

  const handleCreate = useCallback((data) => {
    store.createExploration(data);
    setShowNew(false);
    setActiveTitle(data.title);
  }, [store]);

  return (
    <section className="wb wb-page">
      <header className="wb-header">
        <h1 className="wb-title">Exploration Editor</h1>
        <nav className="wb-actions" aria-label="Exploration Editor">
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Workbench</button>
          {active ? <button type="button" className="wb-link" onClick={() => setActiveTitle(null)}>All explorations</button> : null}
          <button type="button" className="wb-link" onClick={store.downloadJSON}>Download as JSON</button>
        </nav>
      </header>

      {active ? (
        <ExplorationDetail key={active.title} exploration={active} store={store} />
      ) : (
        <div className="wb-tool-body">
          {showNew ? (
            <NewExplorationForm onCreate={handleCreate} onCancel={() => setShowNew(false)} />
          ) : (
            <div className="wb-actions">
              <button type="button" className="wb-button" onClick={() => setShowNew(true)}>New exploration</button>
            </div>
          )}

          <div className="tl-list">
            {store.explorations.map(exp => (
              <button key={exp.title} type="button" className="tl-row tl-row-open" onClick={() => setActiveTitle(exp.title)}>
                <span className="bg-question-title">{exp.title}</span>
                {exp.subtitle ? <span className="wb-body">{exp.subtitle}</span> : null}
                {exp.desc ? <span className="wb-body">{exp.desc}</span> : null}
                <span className="wb-body">{STATUS_WORDS[exp.status] || exp.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
