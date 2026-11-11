import React from "react";

// Renders one tool's output inside a reading, in that tool's native shape.
// Moved out of Studio.jsx; styling lives in styles/workbench.css.
function Row({ k, v }) {
  return (
      <div className="atrium-detail-row">
        {k != null && <span className="atrium-detail-key">{k}</span>}
        <span className="atrium-detail-val">{v}</span>
      </div>
  );
}

export default function SubstepDetail({ kind, detail }) {
  if (!detail) return null;
  switch (kind) {
    case "orientation":
      return (
        <div className="atrium-detail-block">
          {detail.fields?.map((f, i) => <Row key={i} k={f.label} v={f.value} />)}
        </div>
      );
    case "backstage":
      return <ul className="atrium-detail-list">{detail.agents.map((a, i) => <li key={i}><Row k={a.name} v={a.take} /></li>)}</ul>;
    case "art-of-model":
      return (
        <div className="atrium-detail-block">
          {detail.steps.map((s, i) => <Row key={i} k={s.title} v={s.text} />)}
          <Row k="Synthesis" v={detail.synthesis} />
        </div>
      );
    case "foa-generator":
      return (
        <div className="atrium-detail-block">
          {["field", "wip", "action", "cache"].map((k) => <Row key={k} k={k} v={detail[k]} />)}
        </div>
      );
    case "exploration-editor":
      return (
        <div className="atrium-detail-block">
          <Row k="Title" v={detail.title} />
          <Row k="Body" v={detail.body} />
          <Row k="Tags" v={detail.tags?.join(" · ")} />
        </div>
      );
    case "breakground":
      return <ul className="atrium-detail-list">{detail.cards.map((c, i) => <li key={i}><Row k={c.kind} v={c.line} /></li>)}</ul>;
    case "console":
      return (
        <div className="atrium-detail-block">
          <div className="atrium-detail-section-label">Active laws</div>
          {detail.activeLaws.map((l, i) => <Row key={i} k={l.name} v={l.reading} />)}
          {detail.tensions?.length > 0 && (
            <>
              <div className="atrium-detail-section-label">Tensions</div>
              {detail.tensions.map((t, i) => <Row key={i} v={t.pair} />)}
            </>
          )}
        </div>
      );
    case "playbook":
      return (
        <div className="atrium-detail-block">
          <div className="atrium-detail-section-label">Pillars</div>
          <Row k="System" v={detail.pillars.system} />
          <Row k="Scenography" v={detail.pillars.scenography} />
          <Row k="Soul" v={detail.pillars.soul} />
          <Row k="Relational" v={detail.pillars.relational} />
          <Row k="Emotion" v={detail.emotion} />
          <div className="atrium-detail-section-label">Application</div>
          <Row k="Big move" v={detail.application.bigMove} />
          <Row k="Whimsy" v={detail.application.whimsy} />
          <Row k="Connection" v={detail.application.connection} />
        </div>
      );
    case "desert":
      return (
        <div className="atrium-detail-block">
          <Row k="Palette" v={detail.palette} />
          <Row k="Density" v={detail.density?.toFixed?.(2) ?? detail.density} />
          <Row k="Mood" v={detail.mood} />
          <Row k="Notes" v={detail.notes} />
        </div>
      );
    case "lab":
      return (
        <div className="atrium-detail-block">
          <Row k="Title" v={detail.title} />
          {detail.sections?.map((s, i) => <Row key={i} k={s.title} v={s.body} />)}
        </div>
      );
    case "grace": {
      const reveal = detail.reveal ?? detail.takeaway;
      const condition = detail.condition ?? detail.reading;
      const failureMode = detail.failureMode ?? detail.tensionsSeen ?? [];
      const nextAgent = detail.nextAgent ?? detail.nextMove;
      return (
        <div className="atrium-detail-block">
          {detail.fieldTypeLabel && <Row k="Field type" v={`${detail.fieldTypeLabel}${detail.fieldTypeSurface ? ` · ${detail.fieldTypeSurface}` : ""}`} />}
          {reveal && <Row k="Reveal" v={reveal} />}
          {condition && <Row k="Condition" v={condition} />}
          {failureMode?.length > 0 && (
            <>
              <div className="atrium-detail-section-label">Failure mode</div>
              {failureMode.map((t, i) => <Row key={i} v={t} />)}
            </>
          )}
          {nextAgent && <Row k="Next agent" v={nextAgent} />}
        </div>
      );
    }
    default:
      return <pre className="atrium-detail-raw">{JSON.stringify(detail, null, 2)}</pre>;
  }
}
