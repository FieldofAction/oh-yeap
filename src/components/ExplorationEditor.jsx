import { useState, useCallback } from "react";
import useExplorationStore from "../store/useExplorationStore";

/* ── Status badge ── */
const STATUS_COLORS = { seed: "#8b8b8b", wip: "#c9a227", live: "#4a9e6e", archived: "#6b6b6b" };
function StatusBadge({ status }) {
  return (
    <span className="ee-badge" style={{ background: STATUS_COLORS[status] || "#666" }}>
      {status}
    </span>
  );
}

/* ── New Exploration Form ── */
function NewExplorationForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [tags, setTags] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      subtitle: subtitle.trim(),
      hypothesis: hypothesis.trim(),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="ee-new-form">
      <div className="ee-new-title">New Exploration</div>
      <input className="ee-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" autoFocus />
      <input className="ee-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle (optional)" />
      <textarea className="ee-textarea" value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder="Hypothesis — the driving question" rows={3} />
      <input className="ee-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" />
      <div className="ee-new-actions">
        <button className="ee-btn ee-btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="ee-btn ee-btn--primary" onClick={handleCreate} disabled={!title.trim()}>Create</button>
      </div>
    </div>
  );
}

/* ── Add Fragment Form ── */
function AddFragmentForm({ onAdd, onCancel }) {
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");

  const handleAdd = () => {
    if (!content.trim()) return;
    if (type === "note") {
      onAdd({ type: "note", content: content.trim() });
    } else {
      onAdd({ type: "visual", caption: content.trim() });
    }
    setContent("");
  };

  return (
    <div className="ee-add-form">
      <div className="ee-add-row">
        <select className="ee-select" value={type} onChange={e => setType(e.target.value)}>
          <option value="note">Note</option>
          <option value="visual">Visual</option>
        </select>
        <textarea className="ee-textarea ee-textarea--sm" value={content} onChange={e => setContent(e.target.value)} placeholder={type === "note" ? "What did you observe or learn?" : "Visual caption / description"} rows={2} autoFocus />
      </div>
      <div className="ee-add-actions">
        <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={onCancel}>Cancel</button>
        <button className="ee-btn ee-btn--primary ee-btn--sm" onClick={handleAdd} disabled={!content.trim()}>Add</button>
      </div>
    </div>
  );
}

/* ── Resolve Question Form ── */
function ResolveForm({ onResolve, onCancel }) {
  const [status, setStatus] = useState("resolved");
  const [note, setNote] = useState("");

  return (
    <div className="ee-resolve-form">
      <select className="ee-select" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="resolved">Resolved</option>
        <option value="reframed">Reframed</option>
        <option value="absorbed">Absorbed</option>
      </select>
      <input className="ee-input ee-input--sm" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" autoFocus />
      <div className="ee-add-actions">
        <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={onCancel}>Cancel</button>
        <button className="ee-btn ee-btn--primary ee-btn--sm" onClick={() => onResolve({ status, note: note.trim() })}>Confirm</button>
      </div>
    </div>
  );
}

/* ── Exploration Detail View ── */
function ExplorationDetail({ exploration, store, onBack }) {
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

  const handleSaveHypothesis = () => {
    store.updateHypothesis(exploration.title, hypothesisText);
    setEditingHypothesis(false);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    store.addQuestion(exploration.title, newQuestion.trim());
    setNewQuestion("");
    setShowAddQuestion(false);
  };

  const handleAddConnection = () => {
    if (!connTitle.trim()) return;
    store.addConnection(exploration.title, { title: connTitle.trim(), why: connWhy.trim() });
    setConnTitle("");
    setConnWhy("");
    setShowAddConnection(false);
  };

  return (
    <div className="ee-detail">
      <button className="ee-btn ee-btn--ghost" onClick={onBack}>&larr; Back</button>

      <div className="ee-detail-header">
        <h2 className="ee-detail-title">{exploration.title}</h2>
        <div className="ee-detail-sub">{exploration.subtitle}</div>
        <div className="ee-detail-meta">
          <select
            className="ee-select ee-select--status"
            value={exploration.status}
            onChange={e => store.updateStatus(exploration.title, e.target.value)}
          >
            <option value="seed">seed</option>
            <option value="wip">wip</option>
            <option value="live">live</option>
            <option value="archived">archived</option>
          </select>
          <div className="ee-detail-tags">
            {exploration.tags?.map(t => <span key={t} className="ee-tag">{t}</span>)}
          </div>
        </div>
      </div>

      {/* Hypothesis */}
      <div className="ee-section">
        <div className="ee-section-h">
          <span>Hypothesis</span>
          {!editingHypothesis && (
            <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setEditingHypothesis(true)}>Edit</button>
          )}
        </div>
        {editingHypothesis ? (
          <div>
            <textarea
              className="ee-textarea"
              value={hypothesisText}
              onChange={e => setHypothesisText(e.target.value)}
              rows={3}
            />
            <div className="ee-add-actions">
              <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => { setEditingHypothesis(false); setHypothesisText(sk.hypothesis); }}>Cancel</button>
              <button className="ee-btn ee-btn--primary ee-btn--sm" onClick={handleSaveHypothesis}>Save</button>
            </div>
          </div>
        ) : (
          <div className="ee-hypothesis">{sk.hypothesis}</div>
        )}
      </div>

      {/* Fragments */}
      <div className="ee-section">
        <div className="ee-section-h">
          <span>Fragments ({sk.fragments.length})</span>
          {!showAddFragment && (
            <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setShowAddFragment(true)}>+ Add</button>
          )}
        </div>
        {showAddFragment && (
          <AddFragmentForm
            onAdd={f => { store.addFragment(exploration.title, f); setShowAddFragment(false); }}
            onCancel={() => setShowAddFragment(false)}
          />
        )}
        <div className="ee-fragments">
          {[...sk.fragments].reverse().map((f, i) => (
            <div key={i} className={`ee-frag ee-frag--${f.type}`}>
              <div className="ee-frag-type">{f.type === "note" ? "Note" : "Visual"}</div>
              {f.date && <div className="ee-frag-date">{f.date}</div>}
              <div className="ee-frag-content">{f.type === "note" ? f.content : f.caption}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Questions */}
      <div className="ee-section">
        <div className="ee-section-h">
          <span>Questions ({questions.length})</span>
          {!showAddQuestion && (
            <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setShowAddQuestion(true)}>+ Add</button>
          )}
        </div>
        {showAddQuestion && (
          <div className="ee-add-form">
            <textarea className="ee-textarea ee-textarea--sm" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="What remains unresolved?" rows={2} autoFocus />
            <div className="ee-add-actions">
              <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setShowAddQuestion(false)}>Cancel</button>
              <button className="ee-btn ee-btn--primary ee-btn--sm" onClick={handleAddQuestion} disabled={!newQuestion.trim()}>Add</button>
            </div>
          </div>
        )}
        <div className="ee-questions">
          {questions.map((q, i) => (
            <div key={i} className={`ee-q ee-q--${q.status}`}>
              <div className="ee-q-icon">{q.status === "open" ? "○" : "●"}</div>
              <div className="ee-q-body">
                <div className="ee-q-text">{q.text}</div>
                {q.status !== "open" && (
                  <div className="ee-q-resolution">
                    <span className="ee-q-status">{q.status}</span>
                    {q.note && <span className="ee-q-note"> — {q.note}</span>}
                    {q.date && <span className="ee-q-date"> ({q.date})</span>}
                  </div>
                )}
                {q.status === "open" && resolvingIdx === i && (
                  <ResolveForm
                    onResolve={r => { store.resolveQuestion(exploration.title, i, r); setResolvingIdx(null); }}
                    onCancel={() => setResolvingIdx(null)}
                  />
                )}
              </div>
              {q.status === "open" && resolvingIdx !== i && (
                <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setResolvingIdx(i)}>Resolve</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div className="ee-section">
        <div className="ee-section-h">
          <span>Connections ({sk.connections.length})</span>
          {!showAddConnection && (
            <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setShowAddConnection(true)}>+ Add</button>
          )}
        </div>
        {showAddConnection && (
          <div className="ee-add-form">
            <input className="ee-input ee-input--sm" value={connTitle} onChange={e => setConnTitle(e.target.value)} placeholder="Connected to..." autoFocus />
            <input className="ee-input ee-input--sm" value={connWhy} onChange={e => setConnWhy(e.target.value)} placeholder="Why this connection matters" />
            <div className="ee-add-actions">
              <button className="ee-btn ee-btn--ghost ee-btn--sm" onClick={() => setShowAddConnection(false)}>Cancel</button>
              <button className="ee-btn ee-btn--primary ee-btn--sm" onClick={handleAddConnection} disabled={!connTitle.trim()}>Add</button>
            </div>
          </div>
        )}
        <div className="ee-connections">
          {sk.connections.map((c, i) => (
            <div key={i} className="ee-conn">
              <div className="ee-conn-title">&rarr; {c.title}</div>
              {c.why && <div className="ee-conn-why">{c.why}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Editor ── */
export default function ExplorationEditor() {
  const store = useExplorationStore();
  const [activeTitle, setActiveTitle] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const active = activeTitle ? store.explorations.find(e => e.title === activeTitle) : null;

  const handleCreate = useCallback((data) => {
    store.createExploration(data);
    setShowNew(false);
    setActiveTitle(data.title);
  }, [store]);

  if (active) {
    return (
      <div className="ee-wrap">
        <ExplorationDetail
          exploration={active}
          store={store}
          onBack={() => setActiveTitle(null)}
        />
      </div>
    );
  }

  return (
    <div className="ee-wrap">
      <div className="ee-header">
        <div>
          <h1 className="ee-title">Exploration Editor</h1>
          <div className="ee-subtitle">Research journal — add fragments, track questions, export data</div>
        </div>
        <div className="ee-header-actions">
          <button className="ee-btn ee-btn--ghost" onClick={store.downloadJSON}>Export JSON</button>
          <button className="ee-btn ee-btn--primary" onClick={() => setShowNew(true)}>+ New</button>
        </div>
      </div>

      {showNew && (
        <NewExplorationForm
          onCreate={handleCreate}
          onCancel={() => setShowNew(false)}
        />
      )}

      <div className="ee-list">
        {store.explorations.map(exp => (
          <div key={exp.title} className="ee-list-item" onClick={() => setActiveTitle(exp.title)}>
            <div className="ee-list-main">
              <div className="ee-list-title">{exp.title}</div>
              <div className="ee-list-sub">{exp.subtitle}</div>
              <div className="ee-list-desc">{exp.desc}</div>
            </div>
            <div className="ee-list-right">
              <StatusBadge status={exp.status} />
              <div className="ee-list-count">
                {exp.sketch?.fragments?.length || 0} fragments
              </div>
            </div>
            <span className="ee-list-arrow">&rarr;</span>
          </div>
        ))}
      </div>
    </div>
  );
}
