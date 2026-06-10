import React, { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────
   Résumé generator — standalone, bookmark-only page (#resume).
   Edit inline (contentEditable, auto-saved to localStorage).
   Export = native print-to-PDF; the print stylesheet isolates the
   two letter pages so the browser's "Save as PDF" yields a clean
   multi-page document.
   ────────────────────────────────────────────────────────────── */

const STORE_KEY = "foa_resume_v1";
let _uid = 0;
const uid = () => `e${++_uid}`;

function defaults(){
  return {
    name: "Alfred Daniel Dickson II",
    headLeft: "Creative Leadership",
    location: "Los Angeles, California",
    page1Label: "Executive Narrative",
    page2Label: "Résumé",

    perspective: "Creative director and design leader working across brand systems, product surfaces, and technology storytelling. My work turns complexity into usable creative direction: systems, frameworks, campaigns, and team practices that help organizations show up with clarity and trust. I’ve led high-visibility work across Apple, Google Cloud, Vevo, Tribeca, and Nickelodeon, at the intersection of technology, entertainment, music, and culture.",

    philosophy: [
      { title: "Framing", body: "I help teams find the shape of the problem before rushing toward output. Clear framing turns scattered signals into shared direction." },
      { title: "Systems", body: "I build design systems, templates, and creative practices that give teams room to move without losing coherence." },
      { title: "Trust", body: "I use craft, clarity, and restraint to make complex ideas easier to understand and easier to believe." },
      { title: "Translation", body: "I work between technology, culture, business, and audience experience, turning abstract or technical ideas into surfaces people can recognize and use." },
    ],

    leadership: "I lead through framing, focus, and follow-through. So teams operate like creative ecologies. Clear roles, shared intent, emergent possibility. <strong>Framing</strong> defines purpose and alignment. <strong>Focus</strong> creates discipline and quality. <strong>Follow-through</strong> builds reliability and trust.",

    guidingIntent: "To create systems of expression that help people understand complex ideas, trust what they are seeing, and move with greater clarity.",

    experience: [
      { _id: uid(), org: "Apple Music/Sports, Creative Lead", meta: "2021–Present, Los Angeles, CA", body: "Lead teams to create music-focused brand and design systems that resonate with audiences, blending creative vision and intelligent design. Foster collaboration across disciplines, guiding global campaigns, defining scalable storytelling frameworks, and building systems that improve creative speed, consistency, and visibility." },
      { _id: uid(), org: "Google Cloud, Design Lead", meta: "2019–2021, San Francisco, CA", body: "Guided brand transformation efforts that modernized infrastructures for cloud-native and traditional businesses. Fostered partnerships and collaboration to drive design strategies that elevated Google Cloud’s market presence. Developed storytelling frameworks to communicate the business impact of cloud and AI transformation, designed scalable creative systems for marketing and sales. Improved clarity and trust across complex B2B communications." },
      { _id: uid(), org: "Vevo, Creative Director", meta: "2015–2019, New York, NY", body: "Led brand development for major music franchises and product initiatives, collaborating with artists and cross-functional teams to create work that strengthened the connection between artist and audience. Partnered with leading creatives to deliver campaigns that amplified Vevo’s presence and introduced operational frameworks that supported growth, efficiency, and creative scale." },
      { _id: uid(), org: "Tribeca Film, Creative Director", meta: "2012–2015, New York, NY", body: "Directed holistic design experiences for the Tribeca Film Festival, Tribeca Film, and Tribeca Digital Studios. Managed and developed high-performing in-house design and production teams, fostering a culture of creativity, skill, and empathy. Oversaw brand evolution and strengthened storytelling coherence across all audience touchpoints through collaborative leadership and cross-functional partnership." },
      { _id: uid(), org: "Early Career in Media and Brand Design at Nickelodeon, Cartoon Network, Vertis, Matlock A+PR", meta: "2002–2012", body: "Built the foundation for a systems-based creative practice through broadcast, brand, and identity work spanning entertainment and corporate environments. Led campaigns for Nickelodeon, including the Kids’ Choice Awards and World Wide Day of Play, achieving record engagement and industry recognition for integrated motion and identity systems. Developed design and marketing systems for brands like Coca-Cola, Delta, and Dell, unifying storytelling across print, packaging, and on-air experiences to create cohesion and cultural resonance." },
    ],

    personal: "+1.678.575.1695<br>alfreddaniel@hey.com",
    expertise: "Creative Systems Design, Enterprise Storytelling, Brand Frameworks, AI-Assisted Design Workflows, Modular Design Tools, Figma, Adobe CC, and Leadership Development",
    education: [
      "Yale School of Management, Business Perspectives for Creative Leaders",
      "Georgia State University, BFA, Visual Communication",
      "Type Directors Club, Emmy Award, AIGA Archives, Communication Arts, BDA Gold and Silver Awards",
    ],
  };
}

function load(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaults();
    const saved = JSON.parse(raw);
    const d = defaults();
    const merged = { ...d, ...saved };
    // ensure experience entries have ids
    if(Array.isArray(merged.experience)) merged.experience = merged.experience.map(e => ({ _id: e._id || uid(), ...e }));
    return merged;
  } catch { return defaults(); }
}

// Inline rich-text editable. Uncontrolled after mount (no re-render on input) to keep the caret stable.
function Editable({ html, onChange, tag = "div", className }){
  const ref = useRef(null);
  return React.createElement(tag, {
    ref,
    className,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    dangerouslySetInnerHTML: { __html: html || "" },
    onInput: () => onChange(ref.current.innerHTML),
  });
}

export default function Resume(){
  const data = useRef(load());
  const [, setVer] = useState(0);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef(null);

  const persist = () => {
    setSaved(false);
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data.current)); } catch {}
      setSaved(true);
    }, 400);
  };
  const edit = (fn) => (v) => { fn(v); persist(); };

  const addRole = () => { data.current.experience.push({ _id: uid(), org: "Organization, Role", meta: "Year–Year, City, ST", body: "Describe the work." }); persist(); setVer(v=>v+1); };
  const removeRole = (id) => { data.current.experience = data.current.experience.filter(e => e._id !== id); persist(); setVer(v=>v+1); };

  const resetAll = () => {
    if(!window.confirm("Reset the résumé to the default content? Your saved edits will be cleared.")) return;
    try { localStorage.removeItem(STORE_KEY); } catch {}
    data.current = defaults();
    setVer(v=>v+1);
  };

  const exit = () => { window.location.hash = ""; };

  useEffect(() => () => { if(saveTimer.current) clearTimeout(saveTimer.current); }, []);

  // Print isolation: clone just the résumé doc to <body> and hide the rest with
  // display:none, so the print/PDF contains only the two pages (no blank pages,
  // no shift). Cloning avoids disturbing React's managed DOM.
  useEffect(() => {
    const before = () => {
      const doc = document.querySelector(".rz-doc");
      if(!doc) return;
      const existing = document.getElementById("rz-print-clone");
      if(existing) existing.remove();
      const clone = doc.cloneNode(true);
      clone.id = "rz-print-clone";
      document.body.appendChild(clone);
      document.body.classList.add("rz-printing");
    };
    const after = () => {
      const c = document.getElementById("rz-print-clone");
      if(c) c.remove();
      document.body.classList.remove("rz-printing");
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      after();
    };
  }, []);

  const d = data.current;

  // Split experience into two columns that read top-to-bottom (column-major),
  // keeping each entry's original index for edit callbacks.
  const _exp = d.experience.map((e, i) => ({ e, i }));
  const _mid = Math.ceil(_exp.length / 2);
  const expCols = [_exp.slice(0, _mid), _exp.slice(_mid)];

  const RunningHead = ({ center }) => (
    <div className="rz-head">
      <Editable tag="span" html={d.headLeft} onChange={edit(v => d.headLeft = v)} />
      <div className="rz-head-main">
        <span className="rz-head-c">{center}</span>
        <Editable tag="span" className="rz-head-r" html={d.location} onChange={edit(v => d.location = v)} />
      </div>
    </div>
  );

  return (
    <div className="rz-app">
      <div className="rz-toolbar">
        <div className="rz-tb-left">
          <button className="rz-tb-btn" onClick={exit}>← Exit</button>
          <span className="rz-tb-title">Résumé</span>
        </div>
        <div className="rz-tb-right">
          <span className="rz-tb-status">{saved ? "Saved" : "Saving…"}</span>
          <button className="rz-tb-btn" onClick={resetAll}>Reset</button>
          <button className="rz-tb-btn rz-tb-primary" onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>

      <div className="rz-hint">Click any text to edit. Changes save automatically in this browser. Export PDF opens your print dialog — choose “Save as PDF”.</div>

      <div className="rz-doc">

        {/* ── Page 1 — Executive Narrative ── */}
        <article className="rz-page">
          <RunningHead center={<><Editable tag="span" html={d.page1Label} onChange={edit(v => d.page1Label = v)} /></>} />
          <div className="rz-body">
            <div className="rz-col-name">
              <Editable tag="h1" className="rz-name" html={d.name} onChange={edit(v => d.name = v)} />
            </div>
            <div className="rz-col-main">
              <div className="rz-seclabel">Perspective</div>
              <Editable className="rz-perspective" html={d.perspective} onChange={edit(v => d.perspective = v)} />

              <div className="rz-seclabel">Philosophy</div>
              <div className="rz-philo">
                {d.philosophy.map((p, i) => (
                  <div className="rz-philo-item" key={i}>
                    <Editable className="rz-philo-title" html={p.title} onChange={edit(v => d.philosophy[i].title = v)} />
                    <Editable className="rz-philo-body" html={p.body} onChange={edit(v => d.philosophy[i].body = v)} />
                  </div>
                ))}
              </div>

              <div className="rz-rule" />
              <div className="rz-seclabel">Leadership Approach</div>
              <Editable className="rz-para" html={d.leadership} onChange={edit(v => d.leadership = v)} />

              <div className="rz-rule" />
              <div className="rz-seclabel">Guiding Intent</div>
              <Editable className="rz-para" html={d.guidingIntent} onChange={edit(v => d.guidingIntent = v)} />
            </div>
          </div>
        </article>

        {/* ── Page 2 — Résumé ── */}
        <article className="rz-page">
          <RunningHead center={<><Editable tag="span" html={d.page2Label} onChange={edit(v => d.page2Label = v)} /></>} />
          <div className="rz-body">
            <div className="rz-col-name">
              <Editable tag="h1" className="rz-name" html={d.name} onChange={edit(v => d.name = v)} />
            </div>
            <div className="rz-col-main">
              <div className="rz-seclabel">Selected Experience</div>
              <div className="rz-exp-cols">
                {expCols.map((col, ci) => (
                  <div className="rz-exp-col" key={ci}>
                    {col.map(({ e, i }) => (
                      <div className="rz-exp" key={e._id}>
                        <button className="rz-del" title="Remove role" onClick={() => removeRole(e._id)}>×</button>
                        <Editable className="rz-exp-org" html={e.org} onChange={edit(v => d.experience[i].org = v)} />
                        <Editable className="rz-exp-meta" html={e.meta} onChange={edit(v => d.experience[i].meta = v)} />
                        <Editable className="rz-exp-body" html={e.body} onChange={edit(v => d.experience[i].body = v)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <button className="rz-add" onClick={addRole}>+ Add role</button>

              <div className="rz-rule" />

              <div className="rz-foot-grid">
                <div>
                  <div className="rz-seclabel">Personal</div>
                  <Editable className="rz-foot-body" html={d.personal} onChange={edit(v => d.personal = v)} />
                  <div className="rz-seclabel" style={{ marginTop: "22px" }}>Expertise &amp; Tools</div>
                  <Editable className="rz-foot-strong" html={d.expertise} onChange={edit(v => d.expertise = v)} />
                </div>
                <div>
                  <div className="rz-seclabel">Education &amp; Recognition</div>
                  {d.education.map((line, i) => (
                    <Editable className="rz-foot-strong rz-edu" key={i} html={line} onChange={edit(v => d.education[i] = v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <style>{`
        .rz-app{position:fixed;inset:0;z-index:9000;overflow:auto;background:#2b2d31;font-family:var(--sans),'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        .rz-toolbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 20px;background:#17181b;border-bottom:1px solid #303236;color:#e8eaf0}
        .rz-tb-left,.rz-tb-right{display:flex;align-items:center;gap:12px}
        .rz-tb-title{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#9a9da4}
        .rz-tb-status{font-size:11px;letter-spacing:.04em;color:#6f7177}
        .rz-tb-btn{font-family:inherit;font-size:12px;letter-spacing:.03em;color:#e8eaf0;background:#26282c;border:1px solid #3a3d42;border-radius:5px;padding:7px 13px;cursor:pointer;transition:all .14s}
        .rz-tb-btn:hover{border-color:#5b5f66;background:#2e3036}
        .rz-tb-primary{background:#2F5BFF;border-color:#2F5BFF;color:#fff;font-weight:500}
        .rz-tb-primary:hover{background:#2F5BFF;filter:brightness(1.12)}
        .rz-hint{color:#9a9da4;font-size:11.5px;text-align:center;padding:14px 16px 0;letter-spacing:.01em}
        .rz-doc{display:flex;flex-direction:column;align-items:center;gap:26px;padding:22px 16px 90px}

        .rz-page{position:relative;width:8.5in;min-height:11in;background:#fff;color:#16181d;box-shadow:0 10px 50px rgba(0,0,0,.45);padding:0.6in 0.72in;overflow:hidden}
        .rz-head{display:grid;grid-template-columns:1.9in 1fr;gap:0 0.42in;font-size:9px;letter-spacing:.03em;color:#8a8d94;line-height:1.4;margin-bottom:0.36in}
        .rz-head-main{display:grid;grid-template-columns:1fr 1fr;gap:0 26px}
        .rz-head-c{text-align:left}
        .rz-head-r{text-align:left}
        .rz-body{display:grid;grid-template-columns:1.9in 1fr;gap:0.42in}
        .rz-name{font-size:38px;font-weight:700;line-height:1.02;letter-spacing:-.025em;color:#16181d;margin:0}
        .rz-seclabel{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#9a9da4;margin-bottom:7px}
        .rz-perspective{font-size:20px;font-weight:600;line-height:1.34;letter-spacing:-.01em;color:#16181d;margin-bottom:34px}
        .rz-philo{display:grid;grid-template-columns:1fr 1fr;gap:20px 26px;margin-bottom:26px}
        .rz-philo-title{font-weight:700;font-size:12.5px;line-height:1.3;margin-bottom:4px;color:#16181d}
        .rz-philo-body{font-size:12px;line-height:1.46;color:#42454c}
        .rz-rule{height:1px;background:#dcdee2;margin:10px 0}
        .rz-para{font-size:13.5px;line-height:1.5;color:#23262c}
        .rz-para strong{font-weight:700;color:#16181d}

        .rz-exp-cols{display:grid;grid-template-columns:1fr 1fr;gap:0 28px;align-items:start}
        .rz-exp-col{display:flex;flex-direction:column;gap:16px}
        .rz-exp{position:relative}
        .rz-exp-org{font-weight:700;font-size:12.5px;line-height:1.25;color:#16181d}
        .rz-exp-meta{font-weight:700;font-size:12.5px;line-height:1.25;color:#16181d;margin-bottom:5px}
        .rz-exp-body{font-size:10.5px;line-height:1.4;color:#42454c}
        .rz-foot-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.42in}
        .rz-foot-body{font-size:12px;line-height:1.4;color:#23262c}
        .rz-foot-strong{font-size:12.5px;font-weight:700;line-height:1.35;color:#16181d}
        .rz-edu{margin-bottom:10px}

        /* Typography refinement — tighter rag, whole words, no stranded widows */
        .rz-page{widows:3;orphans:3}
        .rz-perspective,.rz-philo-body,.rz-para,.rz-exp-org,.rz-exp-body,.rz-foot-body,.rz-foot-strong,.rz-edu{
          text-wrap:pretty;-webkit-hyphens:none;hyphens:none;
        }
        .rz-name{text-wrap:balance}

        /* editing affordances (screen only) */
        .rz-app [contenteditable]{border-radius:3px;transition:background .12s,box-shadow .12s;outline:none}
        .rz-app [contenteditable]:hover{background:rgba(47,91,255,.07)}
        .rz-app [contenteditable]:focus{background:rgba(47,91,255,.08);box-shadow:0 0 0 1px rgba(47,91,255,.5)}
        .rz-del{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:1px solid #d0d2d6;background:#fff;color:#b0454a;font-size:13px;line-height:1;cursor:pointer;opacity:0;transition:opacity .14s;display:flex;align-items:center;justify-content:center}
        .rz-exp:hover .rz-del{opacity:1}
        .rz-add{margin-top:16px;font-family:inherit;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6b6e75;background:none;border:1px dashed #c8cace;border-radius:4px;padding:7px 12px;cursor:pointer}
        .rz-add:hover{color:#2F5BFF;border-color:#2F5BFF}

        @media screen and (max-width: 900px){
          .rz-page{width:100%;min-height:0;padding:28px 24px}
          .rz-body{grid-template-columns:1fr;gap:24px}
          .rz-philo,.rz-foot-grid{grid-template-columns:1fr}
          .rz-exp-cols{grid-template-columns:1fr;gap:24px 0}
          .rz-name{font-size:30px}
        }

        /* print clone lives at <body> level; hidden on screen */
        #rz-print-clone{display:none}

        @media print {
          @page { size: letter; margin: 0; }
          html, body { background:#fff !important; }
          /* hide the entire app; show only the cloned résumé doc */
          body.rz-printing > *:not(#rz-print-clone) { display: none !important; }
          #rz-print-clone { display: block; padding: 0 !important; margin: 0 !important; gap: 0 !important; width: auto !important; align-items: initial !important; }
          #rz-print-clone .rz-add, #rz-print-clone .rz-del { display: none !important; }
          #rz-print-clone .rz-page { width: 8.5in; height: 11in; overflow: hidden; box-shadow: none; margin: 0; page-break-after: always; break-after: page; }
          #rz-print-clone .rz-page:last-child { page-break-after: auto; break-after: auto; }
          #rz-print-clone [contenteditable] { outline: none !important; background: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
