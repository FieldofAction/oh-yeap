const JUDGMENTS = [
  "unreviewed",
  "reveals something",
  "plausible but familiar",
  "feels imposed",
  "needs more evidence",
];
const PATHS = ["Condition", "Capability", "Aquifer", "Counter-reading", "Unresolved"];
const CAL_KEY = "signal-surface-calibration";
const REC_KEY = "signal-surface-records";

const state = {
  tab: "readings",
  selectedId: "F2",
  query: "",
  domain: "all",
  judgment: "unreviewed",
  note: "",
  watched: false,
  dirty: false,
  status: "",
  collectMode: "observation",
  pickerQuery: "",
  collectStatus: "",
  seedObservations: [],
  seedFindings: [],
  records: [],
  calibration: { current: [], history: [] },
  form: {
    evidence_type: "Source excerpt",
    path: "Unresolved",
    evidence: [],
  },
};

const workspace = document.getElementById("workspace");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function loadStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function observations() {
  return [
    ...state.seedObservations,
    ...state.records.filter((record) => record.kind === "observation").map((record) => record.payload),
  ];
}

function findings() {
  return [
    ...state.seedFindings,
    ...state.records.filter((record) => record.kind === "finding").map((record) => record.payload),
  ];
}

function displayIds() {
  return new Map(observations().map((item, index) => [
    item.observation_id,
    `O${String(index + 1).padStart(2, "0")}`,
  ]));
}

function sourcePages(items) {
  return new Set(items.filter((item) => item.url).map((item) => item.url)).size;
}

function currentCalibration(id) {
  return state.calibration.current.find((entry) => entry.id === id);
}

function inline(text) {
  const safe = esc(text);
  return safe
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function observationBody(text) {
  const stripped = String(text).replace(/^Source summary \([^)]*\):\s*/, "");
  const [body, limitation] = stripped.split(/\s+Limitation:\s*/);
  const sentences = body.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  const first = sentences?.[0]?.trim() ?? body;
  const more = body.slice(first.length).trim();
  let html = `<p>${esc(first)}</p>`;
  if (more || limitation) {
    html += `<details class="observation-details"><summary>Details &amp; limitations</summary>`;
    if (more) html += `<p>${esc(more)}</p>`;
    if (limitation) html += `<p class="metadata"><strong>Limitation:</strong> ${esc(limitation)}</p>`;
    html += `</details>`;
  }
  return html;
}

function paragraphHtml(paragraph) {
  if (paragraph.startsWith("|")) {
    const rows = paragraph.split("\n").slice(2).map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean));
    return `<dl class="mapping">${rows.map((cells) => `
      <div><dt>${esc(cells[0] || "")}</dt><dd>${esc(cells[1] || "")}<p class="metadata">To verify: ${esc(cells[2] || "")}</p></dd></div>
    `).join("")}</dl>`;
  }
  const kind = paragraph.startsWith("**Challenge") || paragraph.startsWith("**Alternative")
    ? "challenge"
    : "reading-paragraph";
  return `<p class="${kind}">${inline(paragraph)}</p>`;
}

function confirmLeave() {
  if (!state.dirty) return true;
  return window.confirm("Leave this reading without saving your changes?");
}

function selectFinding(id) {
  if (id === state.selectedId) {
    state.tab = "readings";
    showTab();
    return;
  }
  if (!confirmLeave()) return;
  state.selectedId = id;
  state.dirty = false;
  state.status = "";
  const saved = currentCalibration(id);
  state.judgment = saved?.judgment ?? "unreviewed";
  state.note = saved?.note ?? "";
  state.watched = !!saved?.watched;
  state.tab = "readings";
  paintReadings();
  showTab();
}

function showTab() {
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== state.tab;
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const selected = button.dataset.tab === state.tab;
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
  });
}

function paintChrome() {
  const items = observations();
  const watchCount = state.calibration.current.filter((entry) => entry.watched).length;
  document.getElementById("obs-count").textContent = String(items.length);
  document.getElementById("page-count").textContent = String(sourcePages(items));
  document.getElementById("evidence-tab-count").textContent = String(items.length);
  document.getElementById("watch-tab-count").textContent = String(watchCount);
}

function paintReadings() {
  const items = findings();
  const ids = displayIds();
  const all = observations();
  const selected = items.find((item) => item.id === state.selectedId) || items[0];
  if (!selected) return;
  state.selectedId = selected.id;
  const index = items.findIndex((item) => item.id === selected.id);
  const linked = all.filter((item) => (selected.evidence || []).includes(item.observation_id));
  document.getElementById("panel-readings").innerHTML = `
    <div class="reading-grid">
      <aside>
        <p class="eyebrow">READINGS / OPEN TO REVISION</p>
        ${items.map((item, itemIndex) => {
          const judgment = currentCalibration(item.id)?.judgment ?? "unreviewed";
          return `<button type="button" class="reading-button${item.id === selected.id ? " selected" : ""}" data-finding="${esc(item.id)}">
            <span class="reading-number">${String(itemIndex + 1).padStart(2, "0")}</span>
            <div><small>${esc(item.path)}</small><h3>${esc(item.title)}</h3><p>${esc(judgment)}</p></div>
          </button>`;
        }).join("")}
        <div class="limits">
          <strong>Keep the field open.</strong>
          <p>Interpretations of existing structures. Emergence, demand, and restoration remain unverified.</p>
          <a href="/Signal-Surface-Pilot-Brief-001.md" download>Download full brief</a>
        </div>
      </aside>
      <article class="reading-detail">
        <div class="detail-top">
          <span class="path-label">${esc(selected.path)}</span>
          <span class="metadata">F${index + 1} / interpretation open</span>
        </div>
        <h2>${esc(selected.title)}</h2>
        ${(selected.paragraphs || []).map(paragraphHtml).join("")}
        <section class="evidence-links">
          <h3>Linked observations <span>${linked.length}</span></h3>
          ${linked.map((item) => `
            <div>
              <span class="obs-id">${esc(ids.get(item.observation_id))}</span>
              <div>
                ${observationBody(item.observation)}
                <span>${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.source)}</a>` : esc(item.source)}</span>
                <small>${esc(item.evidence_type)} · ${esc(item.date_context)}</small>
              </div>
            </div>
          `).join("")}
        </section>
        <section class="reflection">
          <p class="eyebrow">YOUR DISCERNMENT</p>
          <h3>What changed in your perception?</h3>
          <label for="judgment">Reading judgment</label>
          <select id="judgment">${JUDGMENTS.map((item) => `<option value="${esc(item)}"${item === state.judgment ? " selected" : ""}>${esc(item)}</option>`).join("")}</select>
          <label for="note">Reflection</label>
          <textarea id="note" maxlength="10000" placeholder="What feels revealing? What feels imposed?">${esc(state.note)}</textarea>
          <label class="watch-toggle"><input id="watched" type="checkbox"${state.watched ? " checked" : ""} /> Keep this question on my watchlist</label>
          <button type="button" class="save-button" id="save-reflection">Save reflection</button>
          ${state.status ? `<p class="status" role="status">${esc(state.status)}</p>` : ""}
          <p class="metadata">Reflections and watch choices persist across sessions. Tests remain proposals.</p>
        </section>
      </article>
    </div>
  `;
  document.querySelectorAll("[data-finding]").forEach((button) => {
    button.addEventListener("click", () => selectFinding(button.dataset.finding));
  });
  document.getElementById("judgment").addEventListener("change", (event) => {
    state.judgment = event.target.value;
    state.dirty = true;
  });
  document.getElementById("note").addEventListener("input", (event) => {
    state.note = event.target.value;
    state.dirty = true;
  });
  document.getElementById("watched").addEventListener("change", (event) => {
    state.watched = event.target.checked;
    state.dirty = true;
  });
  document.getElementById("save-reflection").addEventListener("click", saveReflection);
}

function saveReflection() {
  const updatedAt = new Date().toISOString();
  const entry = {
    id: state.selectedId,
    judgment: state.judgment,
    note: state.note,
    watched: state.watched ? 1 : 0,
    updated_at: updatedAt,
  };
  const historyEntry = {
    finding_id: state.selectedId,
    judgment: state.judgment,
    note: state.note,
    watched: entry.watched,
    updated_at: updatedAt,
  };
  state.calibration.current = [
    entry,
    ...state.calibration.current.filter((item) => item.id !== state.selectedId),
  ];
  state.calibration.history = [historyEntry, ...state.calibration.history];
  saveStore(CAL_KEY, state.calibration);
  state.dirty = false;
  state.status = "Reflection saved.";
  paintChrome();
  paintReadings();
  paintWatch();
}

function filteredObservations() {
  const needle = state.query.toLowerCase();
  const ids = displayIds();
  return observations().filter((item) => {
    if (state.domain !== "all" && item.domain !== state.domain) return false;
    const haystack = `${item.observation} ${item.source} ${item.observation_id} ${ids.get(item.observation_id)}`.toLowerCase();
    return haystack.includes(needle);
  });
}

function paintEvidence() {
  const ids = displayIds();
  const domains = [...new Set(observations().map((item) => item.domain))];
  const visible = filteredObservations();
  document.getElementById("panel-evidence").innerHTML = `
    <div class="evidence-toolbar">
      <input id="evidence-search" aria-label="Search observations" placeholder="Search observations, sources, or IDs" value="${esc(state.query)}" />
      <select id="evidence-domain" aria-label="Filter by field">
        <option value="all"${state.domain === "all" ? " selected" : ""}>All fields</option>
        ${domains.map((domain) => `<option value="${esc(domain)}"${domain === state.domain ? " selected" : ""}>${esc(domain)}</option>`).join("")}
      </select>
    </div>
    <p class="metadata">${visible.length} observations · multiple observations on one page are not independent confirmations.</p>
    <div class="evidence-grid">
      ${visible.map((item) => `
        <article class="evidence-card">
          <div class="detail-top">
            <span class="obs-id">${esc(ids.get(item.observation_id))}</span>
            <span class="metadata">${esc(item.domain)}</span>
          </div>
          ${observationBody(item.observation)}
          <span>${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.source)}</a>` : esc(item.source)}</span>
          <small>${esc(item.evidence_type)}<br />${esc(item.date_context)}</small>
        </article>
      `).join("")}
    </div>
    ${visible.length === 0 ? `<p>No observations match. Try a broader query.</p>` : ""}
    <div class="limits">
      <h3>Coverage</h3>
      <p>English-language sources concentrated on US/UK and online settings. Operator descriptions establish formats more reliably than experienced benefits. Historical studies are observational and abstract-only. No causal or restorative outcomes are asserted.</p>
      <a href="/Signal-Surface-Pilot-Evidence.md" download>Evidence register</a>
      ·
      <a href="/Signal-Surface-Pilot-Observations.csv" download>Observation data</a>
    </div>
  `;
  document.getElementById("evidence-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    const caret = event.target.selectionStart;
    paintEvidence();
    const input = document.getElementById("evidence-search");
    input.focus();
    input.setSelectionRange(caret, caret);
  });
  document.getElementById("evidence-domain").addEventListener("change", (event) => {
    state.domain = event.target.value;
    paintEvidence();
  });
}

function paintWatch() {
  const items = findings();
  const watching = state.calibration.current.filter((entry) => entry.watched && items.some((item) => item.id === entry.id));
  document.getElementById("panel-watch").innerHTML = `
    <div class="watch-heading">
      <h2>Questions to return to</h2>
      <p>Weekly research scans add evidence. Revisit your readings as the field changes.</p>
    </div>
    ${watching.length === 0 ? `
      <div class="empty">
        <h3>Your watchlist is open.</h3>
        <p>Keep a question from a reading here when it deserves another look.</p>
        <button type="button" id="explore-readings">Explore readings</button>
      </div>
    ` : watching.map((entry) => {
      const finding = items.find((item) => item.id === entry.id);
      return `<article class="watch-card">
        <small>${esc(finding.path)}</small>
        <h3>${esc(finding.watch)}</h3>
        <p>${esc(entry.note || "No reflection added yet.")}</p>
        <button type="button" data-review="${esc(entry.id)}">Review reading</button>
        <span class="metadata">${esc(entry.judgment)} · ${esc(new Date(entry.updated_at).toLocaleDateString())}</span>
      </article>`;
    }).join("")}
    <section class="history">
      <h3>Reflection history</h3>
      ${state.calibration.history.length === 0 ? `<p class="metadata">Saved reflections will appear here.</p>` : state.calibration.history.map((entry) => `
        <div>
          <span class="obs-id">${esc(entry.finding_id)}</span>
          <div>
            <strong>${esc(entry.judgment)}</strong>
            <p>${esc(entry.note || "No note")}</p>
            <small>${esc(new Date(entry.updated_at).toLocaleString())} · ${entry.watched ? "watching" : "not watching"}</small>
          </div>
        </div>
      `).join("")}
    </section>
  `;
  document.getElementById("explore-readings")?.addEventListener("click", () => {
    state.tab = "readings";
    showTab();
  });
  document.querySelectorAll("[data-review]").forEach((button) => {
    button.addEventListener("click", () => selectFinding(button.dataset.review));
  });
}

function field(name, label, multiline, required = true) {
  const value = state.form[name] ?? "";
  const control = multiline
    ? `<textarea name="${esc(name)}" maxlength="${name === "interpretation" ? 8000 : 4000}" ${required ? "required" : ""}>${esc(value)}</textarea>`
    : `<input name="${esc(name)}" maxlength="${name === "url" ? 2000 : 300}" value="${esc(value)}" ${required ? "required" : ""} />`;
  return `<label class="collect-field">${esc(label)}${control}</label>`;
}

function paintPicker() {
  const ids = displayIds();
  const needle = state.pickerQuery.toLowerCase();
  const items = observations().filter((item) => JSON.stringify(item).toLowerCase().includes(needle));
  const selected = new Set(state.form.evidence || []);
  const picker = document.getElementById("evidence-picker");
  if (!picker) return;
  picker.innerHTML = items.map((item) => `
    <label>
      <input type="checkbox" value="${esc(item.observation_id)}"${selected.has(item.observation_id) ? " checked" : ""} />
      <span><small>${esc(ids.get(item.observation_id))} · ${esc(item.source)}</small>${esc(item.observation)}</span>
    </label>
  `).join("");
  picker.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const next = new Set(state.form.evidence || []);
      if (input.checked) next.add(input.value);
      else next.delete(input.value);
      state.form.evidence = [...next];
      const count = document.getElementById("link-count");
      if (count) count.textContent = String(state.form.evidence.length);
      const save = document.getElementById("collect-save");
      if (save && state.collectMode === "finding") save.disabled = state.form.evidence.length === 0;
    });
  });
}

function paintQuestions() {
  const questions = state.records.filter((record) => record.kind === "question");
  const node = document.getElementById("research-queue");
  if (!node) return;
  node.innerHTML = `
    <h3>Research queue</h3>
    ${questions.length === 0 ? `<p>No research questions saved yet.</p>` : questions.map((record) => `
      <article class="watch-card">
        <h3>${esc(record.payload.question)}</h3>
        <p>${esc(record.payload.boundaries || "")}</p>
        <small>${esc(record.payload.status)}</small>
        <button type="button" data-copy="${esc(record.id)}">Copy research prompt</button>
      </article>
    `).join("")}
  `;
  node.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const record = questions.find((item) => item.id === button.dataset.copy);
      const prompt = `Research this for Signal Surface: ${record.payload.question}\nBoundaries: ${record.payload.boundaries || ""}\nLook for source-grounded observations, hidden capabilities, aquifers, fitting structures, and thresholds. Separate evidence from interpretation and include counter-evidence.`;
      try {
        await navigator.clipboard.writeText(prompt);
        setCollectStatus("Research prompt copied. Paste it into this conversation.");
      } catch {
        setCollectStatus("Clipboard unavailable. Select and copy the question and boundaries above.");
      }
    });
  });
}

function setCollectStatus(message) {
  state.collectStatus = message;
  const node = document.getElementById("collect-status");
  if (node) node.textContent = message;
}

function paintCollectForm() {
  const mode = state.collectMode;
  const form = document.getElementById("collect-form");
  const urlRequired = state.form.evidence_type !== "Personal observation";
  form.innerHTML = `
    <fieldset>
      ${mode === "observation" ? `
        <label class="collect-field">Evidence type
          <select name="evidence_type">
            <option${state.form.evidence_type === "Source excerpt" ? " selected" : ""}>Source excerpt</option>
            <option${state.form.evidence_type === "Personal observation" ? " selected" : ""}>Personal observation</option>
          </select>
        </label>
        ${field("url", "Source URL", false, urlRequired)}
        ${field("source", "Source or setting")}
        ${field("domain", "Field / theme")}
        ${field("date_context", "Source date or observation date", false, false)}
        ${field("observation", "What did you observe?", true)}
        <p class="metadata">New observations are user submitted and await independent verification. Preserve the source’s wording when recording an excerpt.</p>
      ` : ""}
      ${mode === "finding" ? `
        ${field("title", "Finding title")}
        <label class="collect-field">Path
          <select name="path">${PATHS.map((path) => `<option${state.form.path === path ? " selected" : ""}>${esc(path)}</option>`).join("")}</select>
        </label>
        ${field("interpretation", "What does the evidence suggest?", true)}
        ${field("uncertainty", "What remains uncertain or could contradict this?", true)}
        ${field("watch", "Question to return to", true)}
        <h3>Link supporting observations</h3>
        <input id="picker-search" aria-label="Find evidence to link" placeholder="Search evidence" value="${esc(state.pickerQuery)}" />
        <div class="evidence-picker" id="evidence-picker"></div>
        <p class="metadata"><span id="link-count">${(state.form.evidence || []).length}</span> linked · select at least one observation.</p>
      ` : ""}
      ${mode === "question" ? `
        ${field("question", "What do you want to investigate?", true)}
        ${field("boundaries", "Where, when, and what would count as evidence?", true, false)}
        <p class="metadata">Saving a question does not run a search. Copy it into this conversation to research sources, then add the observations you want to keep.</p>
      ` : ""}
      <button class="save-button" id="collect-save" type="submit"${mode === "finding" && !(state.form.evidence || []).length ? " disabled" : ""}>Save</button>
    </fieldset>
  `;
  form.querySelectorAll("input, textarea, select").forEach((control) => {
    const eventName = control.tagName === "SELECT" ? "change" : "input";
    control.addEventListener(eventName, () => {
      state.form[control.name] = control.value;
      if (control.name === "evidence_type") paintCollectForm();
    });
  });
  document.getElementById("picker-search")?.addEventListener("input", (event) => {
    state.pickerQuery = event.target.value;
    paintPicker();
  });
  paintPicker();
}

function paintCollect() {
  document.getElementById("panel-collect").innerHTML = `
    <section class="collect">
      <h2>Extend the field</h2>
      <p>Add evidence, develop a reading, or frame the next search.</p>
      <div class="mode-switch" role="group" aria-label="What to add">
        <button type="button" data-mode="observation" aria-pressed="${state.collectMode === "observation"}">Add observation</button>
        <button type="button" data-mode="finding" aria-pressed="${state.collectMode === "finding"}">Create finding</button>
        <button type="button" data-mode="question" aria-pressed="${state.collectMode === "question"}">Research question</button>
      </div>
      <form id="collect-form"></form>
      <p class="status" id="collect-status" role="status">${esc(state.collectStatus)}</p>
      <section class="history" id="research-queue"></section>
    </section>
  `;
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.collectMode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      paintCollectForm();
    });
  });
  document.getElementById("collect-form").addEventListener("submit", saveRecord);
  paintCollectForm();
  paintQuestions();
}

function saveRecord(event) {
  event.preventDefault();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let record;
  if (state.collectMode === "observation") {
    const observationId = `OBS-${id}`;
    record = {
      id: observationId,
      kind: "observation",
      created_at: now,
      payload: {
        observation: state.form.observation,
        source: state.form.source,
        domain: state.form.domain,
        url: state.form.url || "",
        evidence_type: state.form.evidence_type,
        date_context: state.form.date_context || "",
        independence_note: "User submitted; not independently verified.",
        observation_id: observationId,
        source_id: observationId,
      },
    };
  } else if (state.collectMode === "finding") {
    if (!(state.form.evidence || []).length) return;
    const findingId = `F-${id}`;
    record = {
      id: findingId,
      kind: "finding",
      created_at: now,
      payload: {
        id: findingId,
        title: state.form.title,
        path: state.form.path,
        paragraphs: [
          `**Your interpretation:** ${state.form.interpretation}`,
          `**Uncertainty / alternatives:** ${state.form.uncertainty}`,
        ],
        evidence: [...state.form.evidence],
        watch: state.form.watch,
      },
    };
  } else {
    record = {
      id: `Q-${id}`,
      kind: "question",
      created_at: now,
      payload: {
        question: state.form.question,
        boundaries: state.form.boundaries || "",
        status: "Saved for research — not searched yet",
        id: `Q-${id}`,
      },
    };
  }
  state.records = [...state.records, record];
  saveStore(REC_KEY, state.records);
  state.form = { evidence_type: "Source excerpt", path: "Unresolved", evidence: [] };
  state.pickerQuery = "";
  state.collectStatus = "Saved to your field.";
  paintChrome();
  paintReadings();
  paintEvidence();
  paintCollect();
}

function mount() {
  const items = observations();
  workspace.innerHTML = `
    <div class="field-title">
      <div>
        <p class="eyebrow">CURRENT FIELD</p>
        <h2>Gathering, restoration,<br />and participation.</h2>
      </div>
      <div class="scope"><strong id="obs-count">${items.length}</strong> observations <span>/</span> <strong id="page-count">${sourcePages(items)}</strong> source pages<p>Curated sample · calibration open</p></div>
    </div>
    <div class="navigation" role="tablist" aria-label="Field">
      <button type="button" role="tab" data-tab="readings" aria-selected="true">Readings</button>
      <button type="button" role="tab" data-tab="evidence">Evidence · <span id="evidence-tab-count">${items.length}</span></button>
      <button type="button" role="tab" data-tab="watch">Watchlist · <span id="watch-tab-count">0</span></button>
      <button type="button" role="tab" data-tab="collect">Add &amp; research</button>
    </div>
    <div class="panel" data-panel="readings" id="panel-readings"></div>
    <div class="panel" data-panel="evidence" id="panel-evidence" hidden></div>
    <div class="panel" data-panel="watch" id="panel-watch" hidden></div>
    <div class="panel" data-panel="collect" id="panel-collect" hidden></div>
    <footer>Signal → discernment → possible passage <span>Weekly research scan / evidence reviewed before interpretation</span></footer>
  `;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.tab === "readings" && button.dataset.tab !== "readings" && !confirmLeave()) return;
      state.tab = button.dataset.tab;
      showTab();
    });
  });
  const saved = currentCalibration(state.selectedId);
  state.judgment = saved?.judgment ?? "unreviewed";
  state.note = saved?.note ?? "";
  state.watched = !!saved?.watched;
  paintChrome();
  paintReadings();
  paintEvidence();
  paintWatch();
  paintCollect();
  showTab();
}

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

Promise.all([
  fetch("/signal-surface/observations.json").then((response) => response.json()),
  fetch("/signal-surface/findings.json").then((response) => response.json()),
]).then(([observationsJson, findingsJson]) => {
  state.seedObservations = observationsJson;
  state.seedFindings = findingsJson;
  state.records = loadStore(REC_KEY, []);
  state.calibration = loadStore(CAL_KEY, { current: [], history: [] });
  if (!Array.isArray(state.calibration.current)) state.calibration = { current: [], history: [] };
  mount();
}).catch(() => {
  workspace.innerHTML = `<p role="status">The field could not be loaded. Refresh to try again.</p>`;
});
