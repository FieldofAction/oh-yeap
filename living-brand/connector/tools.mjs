// The connector's tools. Each one opens a single engagement's folder, does one
// thing through the same domain logic the page uses, and answers in plain text
// (with the same content as structured data). The connector acts as one
// person: the practitioner whose workbench this is. It cannot decide as anyone
// else, because this build has no sign-in to prove who they are.
import { readFileSync, lstatSync } from 'node:fs';
import {
  search, assessStanding, findTensions, carryForward, changeLedger, organizationalHypotheses, orientation,
  propose, decide, retire, recordReuse, recordChoice, answerChoice, recordAnswer, verifyItem, approveItem, addSourceNote, nameAuthority,
  buildBrief, buildContextPackage, revokePackage, packageValid, buildHandoff, toPacket, readPacket, packetAssertions, timeline, unnamedPowers,
  deciders, powerFor, canDecide, rulesStatedBy, kindsOfWork, effectiveRules, basisNote, classOf, withdrawChoice, isPublicStudy, STANDING_CLASSES, CHOICES, POWERS, BASES, PIPELINE,
} from '../../src/living-brand/domain/index.js';

const today = () => process.env.LIVING_BRAND_AS_OF || new Date().toISOString().slice(0, 10);
const yn = v => (v ? 'yes' : 'no');
const person = (brand, id) => brand.people?.[id]?.name || (id === 'practitioner' ? 'the practitioner' : id);
const who = (brand, ids) => (ids?.length ? ids.map(id => person(brand, id)).join(' or ') : 'no one named');
// Every line of a result is one line. Text that came from a record (a title, a
// note, a statement) can never start a new line and pass for something the
// connector said. A leading newline on an entry is kept as a blank line.
const flat = v => String(v).replace(/[\u0000-\u001f\u007f]+/g, ' ');
const lines = list => list.flat().filter(l => l !== null && l !== undefined && l !== false && l !== 0)
  .flatMap(l => { const text = String(l); return text.startsWith('\n') ? ['', flat(text.slice(1))] : [flat(text)]; }).join('\n');
const basisLine = brand => `${brand.name}: ${BASES[brand.basis || 'company-record'].name}. ${basisNote({ ...brand, basis: brand.basis || 'company-record' })}`;

const standingLine = (item, st) =>
  `${st.asked ? `relevant ${yn(st.relevant)}; ` : ''}authorized ${yn(st.authorized)}; reusable here ${yn(st.reusable)}; authoritative ${yn(st.authoritative)}`;

const itemLine = (item, st, brand) => [
  `- ${item.title} [${item.id}] (${[item.kind, item.period?.from?.slice(0, 4)].filter(Boolean).join(', ')}; ${classOf(item.standing, brand).name.toLowerCase()}; ${item.pipeline})`,
  st ? `  ${standingLine(item, st)}` : null,
];

const ENG = { type: 'string', description: 'Engagement id from list_engagements, for example "eng-fernway".' };
const ITEM = { type: 'string', description: 'Item id, shown in square brackets by search_material and get_item.' };

export function createTools(store) {
  const purposeOf = (state, extra = {}) => ({ channels: state.engagement.channels || [], asOf: today(), until: state.engagement.newBrief?.until, ...extra });
  const actorOf = state => state.engagement.actor || 'practitioner';

  // Deciding needs to be the person named. The connector is one person.
  const onlyAsSelf = (state, actingAs) => {
    const actor = actorOf(state);
    if (actingAs && actingAs !== actor) {
      throw new Error(`This connector acts only as ${person(state.brand, actor)}. ${person(state.brand, actingAs)} would have to decide from their own sign-in, which this build does not have. Record a proposal instead; it will wait for them.`);
    }
    return actor;
  };

  // Access that has ended cannot be opened, except to export the record or end the engagement.
  const open = (id, options = {}) => store.load(id, { asOf: today(), ...options });

  const change = (id, entry, fn) => {
    const state = open(id);
    const next = fn(state, actorOf(state));
    store.save(next, { by: actorOf(state), ...entry });
    return next;
  };

  const tools = [
    {
      name: 'list_engagements', title: 'List engagements', readOnly: true,
      description: 'List the practitioner\'s engagements: which client each is for, the role, whether it is a company record or a public-source study, and whether it can still be opened.',
      input: { type: 'object', properties: {} },
      run() {
        const b = store.bench();
        const rows = b.engagements;
        return {
          text: lines([
            `Workbench of ${b.practitioner.name}. ${rows.length} engagement${rows.length === 1 ? '' : 's'}.`,
            ...rows.map(e => `- ${e.client} [${e.id}]: ${e.role}${e.project ? `, ${e.project}` : ''}. ${BASES[e.basis]?.name || e.basis}. ${e.status === 'ended' ? `Ended${e.endedOn ? ` ${e.endedOn}` : ''}; its material is no longer held.` : e.status === 'unreadable' ? 'Its record cannot be read; it can only be ended.' : 'Open.'}`),
            'Each engagement is a separate folder. Opening one never loads another.',
          ]),
          data: { practitioner: b.practitioner.name, engagements: rows },
        };
      },
    },
    {
      name: 'open_engagement', title: 'Open an engagement', readOnly: true,
      description: 'Orient in one engagement: the company\'s stated intent, your role and what you may and may not do, who decides what, what is canon, what needs attention first, what is not known, and how far the material has been understood.',
      input: { type: 'object', properties: { engagement_id: ENG }, required: ['engagement_id'] },
      run({ engagement_id }) {
        const state = open(engagement_id);
        const { brand, engagement: e } = state;
        const asOf = today();
        const o = orientation(brand, e, { asOf, answers: state.answers || [] });
        const study = isPublicStudy(brand);
        const areas = Object.entries(POWERS);
        const gaps = unnamedPowers(brand);
        const urgent = o.attention.filter(t => t.severity !== 'investigate' || /rights/i.test(t.kind)).slice(0, 6);
        const me = actorOf(state);
        const mine = areas.filter(([p]) => canDecide(brand, me, p)).map(([, label]) => label);
        return {
          text: lines([
            `${e.project}${e.project.includes(brand.name) ? '' : ` for ${brand.name}`}. ${e.purpose || ''}`,
            basisLine(brand),
            isPublicStudy(brand) && `This is an independent study. ${brand.name} did not take part. Never present any of it as ${brand.name}'s own record.`,
            '',
            study ? `Role: ${e.role}. May read public material and record a reading of it. Nothing can be decided, approved, adopted or shared in a study.` : `Role: ${e.role}. May ${(e.grant?.powers || []).join(', ')}.${e.grant?.expires ? ` Access ends ${e.grant.expires}.` : ''}`,
            e.modeNote && `How this record was made: ${e.modeNote}`,
            e.scope && `Scope: ${e.scope}`,
            e.constraints?.length ? `Constraints: ${e.constraints.join('; ')}.` : null,
            '',
            o.intent?.statement && `Stated intent: ${o.intent.statement}`,
            '',
            study ? `Who decides at ${brand.name} is not known to this study, and a study cannot establish it.` : 'Who decides:',
            ...(study ? [] : areas.map(([p, label]) => `- ${label}: ${gaps.includes(p) ? 'no one named' : deciders(brand, p).map(d => d.name).join(' or ')}`)),
            study ? null : mine.length ? `You are named for: ${mine.join(', ')}. In every other area you propose and someone else decides.` : 'You are not named to decide anything in this engagement. You propose; the people above decide.',
            '',
            study ? 'What this study reads as current (its reading, not the company\'s classification):' : `Canon in force (${o.canon.length}):`,
            ...(study
              ? brand.items.filter(i => i.standing === 'canon').map(i => `- ${i.title} [${i.id}]`)
              : o.canon.length ? o.canon.map(i => `- ${i.title} [${i.id}]`) : ['- Nothing has been adopted as canon yet.']),
            o.strengths.length ? `\nWhat holds (${study ? 'the study\'s' : 'the practitioner\'s'} reading, with sources):` : null,
            ...o.strengths.map(s => `- ${s.statement} [${s.sources.join(', ')}]`),
            urgent.length ? (study ? '\nTo look at first:' : '\nNeeds attention before anything is made:') : null,
            ...urgent.map(t => `- ${t.kind}: ${String(t.title).replace(/[.]+$/, '')}.`),
            o.unknowns.length ? '\nNot known:' : null,
            ...o.unknowns.map(u => `- ${u}`),
            '',
            `Understanding: ${PIPELINE.filter(p => !study || p !== 'approved').map(p => `${o.stages[p] || 0} ${p}`).join(', ')}. Found is not understood; extracted is not verified${study ? '.' : '; verified is not approved.'}`,
            `${o.tensions.length} tensions in all. Use get_interpretation for the full list.`,
          ]),
          data: { brand: brand.name, basis: brand.basis, role: e.role, powers: e.grant?.powers, authority: brand.authority, canon: o.canon.map(i => i.id), unknowns: o.unknowns, stages: o.stages, tensionCount: o.tensions.length },
        };
      },
    },
    {
      name: 'search_material', title: 'Search one client\'s material', readOnly: true,
      description: 'Search the material of ONE engagement. Every result answers four separate questions for this project: relevant, authorized, reusable here, authoritative. A result being relevant never means it may be used or that it governs anything. Other clients\' material is never searched.',
      input: { type: 'object', properties: { engagement_id: ENG, query: { type: 'string', description: 'Words to look for. Empty returns everything.' }, channels: { type: 'array', items: { type: 'string' }, description: 'Where the work would run, to test rights: for example paid-media, owned-web, owned-social, email. Defaults to the engagement\'s channels.' } }, required: ['engagement_id'] },
      run({ engagement_id, query = '', channels }) {
        const state = open(engagement_id);
        const results = search(state, query, purposeOf(state, channels ? { channels } : {}));
        return {
          text: lines([
            results.length ? `${results.length} of ${state.brand.items.length} items in ${state.brand.name}'s material${query ? ` match "${query}"` : ''}.` : `Nothing in ${state.brand.name}'s material matches "${query}". Other clients' material is not searched.`,
            ...results.slice(0, 25).map(r => itemLine(r.item, r.standing, state.brand)),
            results.length > 25 ? `…and ${results.length - 25} more. Narrow the query.` : null,
          ]),
          data: { results: results.map(r => ({ id: r.item.id, title: r.item.title, ...(isPublicStudy(state.brand) ? { readAs: classOf(r.item.standing, state.brand).name } : { standing: r.item.standing }), pipeline: r.item.pipeline, relevant: r.standing.relevant, authorized: r.standing.authorized, reusable: r.standing.reusable, authoritative: r.standing.authoritative })) },
        };
      },
    },
    {
      name: 'get_item', title: 'Read one piece of material', readOnly: true,
      description: 'Everything recorded about one piece of material: what it was for (work type, canvas, audience, intended outcome, dates), its standing and why, rights, evidence split into intended impact, observed outcome, this element\'s own contribution and transfer, sources with links, and what it relates to. Use before citing or reusing anything.',
      input: { type: 'object', properties: { engagement_id: ENG, item_id: ITEM }, required: ['engagement_id', 'item_id'] },
      run({ engagement_id, item_id }) {
        const state = open(engagement_id);
        const item = state.brand.items.find(i => i.id === item_id);
        if (!item) throw new Error(`No item "${item_id}" in ${state.brand.name}'s material.`);
        const st = assessStanding(item, purposeOf(state), state.brand);
        const ev = type => (item.evidence || []).filter(x => x.type === type);
        const evLines = (label, type) => [`${label}:`, ...(ev(type).length ? ev(type).map(x => `- ${x.statement} (${String(x.basis).replace(/_/g, ' ')}${x.url ? `; ${x.url}` : ''}) [${x.id}]`) : ['- None recorded.'])];
        const rec = item.standingRecord;
        const study = isPublicStudy(state.brand);
        // The rules this material states, with ids, so a decider can be read them and can hold any back.
        const itsRules = effectiveRules(state.brand).filter(r => r.source === item.id);
        const reading = study ? { readAs: classOf(item.standing, state.brand).name, note: `This study's reading. Not ${state.brand.name}'s own classification, approval or decision.` } : null;
        return {
          text: lines([
            `${item.title} [${item.id}]`,
            study && `From an independent study of public sources. Not ${state.brand.name}'s own record.`,
            item.rationale || item.text,
            '',
            `Work type: ${item.workType || 'Unknown'}. Element: ${item.element || 'Unknown'}. Canvas: ${item.canvas || 'Unknown'}.`,
            `Audience: ${item.audience || 'Unknown'}. Meant to: ${item.intendedOutcome || 'Unknown'}. Level: ${item.level || 'Unknown'}.`,
            `Dates: ${item.period?.from || 'Unknown'}${item.period?.to && item.period.to !== item.period.from ? ` to ${item.period.to}` : ''}. Exposure: ${String(item.exposure || 'Unknown').replace(/[.]+$/, '')}. Made by: ${String(item.made?.by || 'Unknown').replace(/[.]+$/, '')}.`,
            item.periodNote && `About the dates: ${item.periodNote}`,
            item.provenance?.source && `Found in: ${item.provenance.source}${item.provenance.origin === 'generated' ? '. Written by a model; its defaults are not brand evidence.' : ''}`,
            item.released && item.released !== 'public' && `Released: ${item.released}. Do not put it in anything that leaves the engagement.`,
            '',
            `For this ${study ? 'study' : 'project'}: ${standingLine(item, st)}.`,
            `- Authorized: ${st.reasons.authorized.join(' ')}`,
            `- Reusable here: ${st.reasons.reusable.join(' ')}`,
            `- Authoritative: ${st.reasons.authoritative.join(' ')}`,
            '',
            `${isPublicStudy(state.brand) ? 'How this study reads it' : 'Standing'}: ${classOf(item.standing, state.brand).name}. ${classOf(item.standing, state.brand).job}${isPublicStudy(state.brand) ? ` Not ${state.brand.name}'s own classification.` : item.retired ? ` Retired by ${person(state.brand, item.retired.by)} on ${item.retired.date}: ${item.retired.reason}` : rec ? ` Set by ${person(state.brand, rec.by)} on ${rec.date}${rec.scope ? `. It covers: ${rec.scope}` : ''}.` : ''}`,
            item.standingHistory?.length ? `Before: ${item.standingHistory.map(h => `${classOf(h.standing, state.brand).name} until ${h.until}`).join('; ')}.` : null,
            `Stage: ${item.pipeline}.${item.verification ? ` Checked by ${person(state.brand, item.verification.by)} on ${item.verification.date}: ${item.verification.how}` : ''}`,
            study ? `Only ${state.brand.name} can decide its standing. Nothing here can.` : `Standing is decided by ${who(state.brand, deciders(state.brand, powerFor(item)).map(d => d.id))}.`,
            itsRules.length ? `\n${study ? 'What it is described as saying' : 'Rules it states'}:` : null,
            ...itsRules.map(r => `- [${r.id}] ${r.statement} (${classOf(r.standing, state.brand).name.toLowerCase()}${r.heldBack ? '; held back when its source was adopted' : ''}${Array.isArray(r.scope) && r.standing === 'canon' && !r.scope.includes('all') ? `; binds ${r.scope.join(', ')}` : ''})`),
            '',
            `Rights: ${item.rights?.status || 'unknown'}. ${item.rights?.note || ''}${item.rights?.holder ? ` Holder: ${item.rights.holder}.` : ''}`,
            '',
            ...evLines('Intended impact', 'intended'), ...evLines('Observed outcome', 'observed'), ...evLines('This element\'s contribution', 'contribution'), ...evLines('Transfer to other situations', 'transfer'),
            item.sources?.length ? '\nSources:' : null,
            ...(item.sources || []).map(s => `- ${s.publisher || ''} ${s.date || ''} ${s.url} (${String(s.basis).replace(/_/g, ' ')})`.replace(/\s+/g, ' ')),
            item.relations?.length ? `\nRelated: ${item.relations.map(r => `${r.type} ${r.to}`).join('; ')}.` : null,
            item.supersededBy ? `Replaced by ${item.supersededBy}.` : null,
            item.reuse?.length ? `Reused ${item.reuse.length} times: ${item.reuse.map(r => r.where).join('; ')}. Reuse confers no authority.` : null,
          ]),
          data: study ? { item: { ...item, standing: undefined, approval: undefined, readAs: reading.readAs, note: reading.note }, answers: st } : { item, standing: st, rules: itsRules.map(r => ({ id: r.id, statement: r.statement, standing: r.standing, scope: r.scope, heldBack: Boolean(r.heldBack) })) },
        };
      },
    },
    {
      name: 'get_interpretation', title: 'Tensions, change and hypotheses', readOnly: true,
      description: 'What the record shows when read against itself: what replaced what, what carries forward into the current brief (if a precedent is set), conflicting rules, drift from canon, claims in tension with later facts, unknown rights, impact claims without established attribution, missing evidence, decisions nobody is named to make, the proposals, choices and answers on record with their ids and who each waits for, and written hypotheses about the organisation with their uncertainty. Deterministic; not a judgment.',
      input: { type: 'object', properties: { engagement_id: ENG }, required: ['engagement_id'] },
      run({ engagement_id }) {
        const state = open(engagement_id);
        const { brand, engagement: e } = state;
        const asOf = today();
        const tensions = findTensions(brand, { asOf, workTypes: e.workTypes || [], channels: e.channels || [] });
        const ledger = changeLedger(brand, { asOf });
        const cf = carryForward(brand, e, { asOf });
        const hyps = organizationalHypotheses(brand, e);
        const events = timeline(brand, { asOf });
        return {
          text: lines([
            `${brand.name}, as of ${asOf}.`,
            events.length ? '\nWhat happened, in order:' : null,
            ...events.slice(0, 60).map(f => `- ${f.date || 'Undated'}: ${f.statement}${f.source ? ` [${f.source}]` : ''}`),
            events.length > 60 ? `…and ${events.length - 60} more.` : null,
            ledger.length ? '\nWhat replaced what:' : null,
            ...ledger.map(c => c.kind === 'material'
              ? `- ${c.when || 'Undated'}: ${c.before.title} gave way to ${c.after.title}.${c.rationale ? ` ${c.rationale}` : ''}`
              : `- ${c.when}: "${c.before.statement}" became "${c.after.statement}"`),
            cf ? '\nWhat carries forward into this brief:' : null,
            ...(cf ? cf.changes.map(c => `- Brief change, ${c.field}: ${[].concat(c.before).join(', ')} became ${[].concat(c.after ?? 'not set').join(', ')}`) : []),
            ...(cf ? cf.rows.map(r => `- ${r.verdictName}: ${r.item.title} [${r.item.id}]. ${r.why}`) : []),
            cf?.evidenceNote || null,
            tensions.length ? '\nTensions:' : '\nNo tensions found in what has been entered.',
            ...tensions.flatMap(t => [
              `- [${t.id}] ${t.kind}: ${String(t.title).replace(/[.]+$/, '')}. ${t.detail}${t.owners?.length ? ` For ${who(brand, t.owners)} to resolve.` : ''}${t.sources?.length ? ` [${[...new Set(t.sources)].join(', ')}]` : ''}`,
              ...state.choices.filter(c => c.about === t.id && c.status !== 'withdrawn').map(c => `  - Choice on record about this: ${CHOICES[c.verdict]}. ${c.rationale} [${c.id}]`),
              ...(t.points || []).map(pt => `  - Rule: ${pt.rule} ${pt.says || `It has: ${pt.has}.`}`),
            ]),
            state.proposals.length ? '\nProposals on record:' : null,
            ...state.proposals.map(p => `- ${p.id}: ${brand.items.find(i => i.id === p.itemId)?.title || p.itemId}, ${classOf(p.from, brand).name.toLowerCase()} to ${classOf(p.to, brand).name.toLowerCase()}. ${p.status === 'open' ? (isPublicStudy(brand) ? 'A note to themselves.' : `Waiting for ${who(brand, p.reviewer)}.`) : `${p.status}${p.decided ? ` by ${person(brand, p.decided.by)} on ${p.decided.date}${p.decided.note ? `: ${p.decided.note}` : ''}` : ''}.`}`),
            state.choices.length ? '\nChoices on record:' : null,
            ...state.choices.map(c => `- ${c.id}: ${CHOICES[c.verdict]} ${c.subject}. ${c.status === 'withdrawn' ? 'Withdrawn.' : c.status === 'awaiting decision' ? `Waiting for ${c.owner ? person(brand, c.owner) : `someone to be named for ${POWERS[c.needs]}`}.` : c.answer ? `${c.status} by ${person(brand, c.answer.by)} on ${c.answer.date}.` : 'Recorded.'}`),
            (state.answers || []).length ? '\nAnswers on record:' : null,
            ...(state.answers || []).map(a => `- ${a.id}: ${a.question} Answered by ${person(brand, a.by)} on ${a.date}: ${a.answer}`),
            hyps.length ? '\nHypotheses beyond the creative work (written by whoever made this reading; never stated as causes):' : null,
            ...hyps.flatMap(h => [`- ${h.title}. ${h.statement}`, `  Uncertain because: ${h.uncertainty}`, h.test ? `  Could be tested by: ${h.test}` : null, isPublicStudy(brand) ? null : `  Decided by: ${h.owner ? person(brand, h.owner) : 'no one named'}.`]),
          ]),
          data: { tensions, proposals: state.proposals, choices: state.choices, answers: state.answers || [], ledger: ledger.map(c => ({ kind: c.kind, when: c.when, before: c.before.id, after: c.after.id })), carryForward: cf ? cf.rows.map(r => ({ id: r.item.id, verdict: r.verdict, why: r.why })) : null, hypotheses: hyps },
        };
      },
    },
    {
      name: 'add_source_note', title: 'Record material found elsewhere',
      description: 'Record a piece of material you found while working, for example read through another connector (a guidelines portal, a drive, a design file, the public website). It enters as discovered, extracted or interpreted, with where it was found, unknown rights and no approval. It can never arrive verified, approved or as canon. Say origin "generated" if a model wrote the material itself.',
      input: {
        type: 'object',
        properties: {
          engagement_id: ENG, title: { type: 'string' }, found_in: { type: 'string', description: 'Where it was found: system and path, or the page.' },
          text: { type: 'string', description: 'What it is, in a sentence or two.' }, kind: { type: 'string' }, work_type: { type: 'string' }, canvas: { type: 'string' }, audience: { type: 'string' }, intended_outcome: { type: 'string' },
          level: { type: 'string', enum: ['company', 'brand', 'product', 'campaign', 'execution'] }, from: { type: 'string', description: 'Date it took effect, YYYY-MM-DD if known.' },
          pipeline: { type: 'string', enum: ['discovered', 'extracted', 'interpreted'] }, standing: { type: 'string', enum: ['precedent', 'contextual', 'experiment', 'operational', 'archive'] },
          domain: { type: 'string', enum: ['visual', 'verbal', 'sonic', 'product'] }, origin: { type: 'string', enum: ['human', 'generated'] },
          url: { type: 'string' }, rights_note: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['engagement_id', 'title', 'found_in'],
      },
      run(a) {
        const asOf = today();
        const next = change(a.engagement_id, { action: 'add-source-note', title: a.title }, (state, by) => addSourceNote(state, {
          title: a.title, foundIn: a.found_in, text: a.text, kind: a.kind, workType: a.work_type, canvas: a.canvas, audience: a.audience, intendedOutcome: a.intended_outcome,
          level: a.level, from: a.from, pipeline: a.pipeline, standing: a.standing, domain: a.domain, origin: a.origin, url: a.url, rightsNote: a.rights_note, tags: a.tags,
        }, { by, asOf }));
        const item = next.brand.items.at(-1);
        return { text: `Recorded "${item.title}" [${item.id}] as ${item.pipeline}, ${classOf(item.standing, next.brand).name.toLowerCase()}, rights unknown, not approved. It is not evidence of anything yet.`, data: { id: item.id, pipeline: item.pipeline, standing: item.standing } };
      },
    },
    {
      name: 'verify_item', title: 'Mark material as checked against its source',
      description: 'Record that a piece of material was checked against its source, and how. Moves it to "verified". Say who made the check in checked_by: "practitioner" if they did, "assistant" if you did in this conversation. A check you made is recorded as an assistant\'s, never as theirs. This is not approval: approval stays with whoever the company names.',
      input: { type: 'object', properties: { engagement_id: ENG, item_id: ITEM, how: { type: 'string', description: 'What it was checked against, and when.' }, checked_by: { type: 'string', enum: ['practitioner', 'assistant'], description: 'Who actually compared the record with its source.' } }, required: ['engagement_id', 'item_id', 'how', 'checked_by'] },
      run({ engagement_id, item_id, how, checked_by }) {
        if (!['practitioner', 'assistant'].includes(checked_by)) throw new Error('Say who made the check: practitioner or assistant.');
        const next = change(engagement_id, { action: 'verify', item: item_id }, (state, by) => verifyItem(state, item_id, { by: checked_by === 'assistant' ? 'an assistant session' : by, how, asOf: today() }));
        const item = next.brand.items.find(i => i.id === item_id);
        return { text: `"${item.title}" is now verified, checked by ${person(next.brand, item.verification.by)}: ${item.verification.how}.${isPublicStudy(next.brand) ? ` That changes what the study knows, not what ${next.brand.name} has allowed.` : ' It is not approved; that stays with whoever is named.'}`, data: { id: item.id, pipeline: item.pipeline, checkedBy: item.verification.by } };
      },
    },
    {
      name: 'approve_item', title: 'Approve material for use',
      description: 'Record the company\'s approval of a piece of material, so it counts as authorized. Works only where the practitioner whose workbench this is has been named to decide that area, and only for material that has been checked against its source (verify_item). Approval does not make material canon and does not clear its rights.',
      input: { type: 'object', properties: { engagement_id: ENG, item_id: ITEM, note: { type: 'string' }, acting_as: { type: 'string', description: 'Present only so that a request to approve as someone else is refused clearly.' } }, required: ['engagement_id', 'item_id'] },
      run({ engagement_id, item_id, note, acting_as }) {
        const next = change(engagement_id, { action: 'approve', item: item_id }, state => approveItem(state, item_id, { by: onlyAsSelf(state, acting_as), note, asOf: today() }));
        const item = next.brand.items.find(i => i.id === item_id);
        return { text: `"${item.title}" is approved by ${person(next.brand, item.approval.by)}. It is still ${STANDING_CLASSES[item.standing].name.toLowerCase()}, and its rights are ${item.rights?.status || 'unknown'}.`, data: { id: item.id, approval: item.approval, standing: item.standing } };
      },
    },
    {
      name: 'record_reuse', title: 'Record a reuse',
      description: 'Record that a piece of material was reused somewhere. Reuse is kept for review; it never raises standing.',
      input: { type: 'object', properties: { engagement_id: ENG, item_id: ITEM, where: { type: 'string' } }, required: ['engagement_id', 'item_id', 'where'] },
      run({ engagement_id, item_id, where }) {
        const next = change(engagement_id, { action: 'reuse', item: item_id }, state => recordReuse(state, item_id, { where, asOf: today() }));
        const item = next.brand.items.find(i => i.id === item_id);
        return { text: `Reuse recorded. "${item.title}" has been reused ${item.reuse.length} time${item.reuse.length === 1 ? '' : 's'} and is still ${STANDING_CLASSES[item.standing].name.toLowerCase()}. Reuse confers no authority.`, data: { id: item.id, reuse: item.reuse.length, standing: item.standing } };
      },
    },
    {
      name: 'record_choice', title: 'Record a choice',
      description: 'Record the practitioner\'s judgment about something: preserve, investigate, repair, evolve or invent. The verdict and the reason are theirs: give the reason in their words, never a suggestion\'s wording they have not adopted. A choice changes nothing in the company\'s knowledge. If it needs someone\'s authority, say which area in "needs" and it is routed to whoever is named, or waits if no one is. Where the practitioner is themselves the person named for that area, recording the choice IS their decision: ask it of them as a decision before you call this. If it answers one of the entries from get_interpretation, pass that entry\'s id in "about" so the two are read together.',
      input: { type: 'object', properties: { engagement_id: ENG, subject: { type: 'string' }, verdict: { type: 'string', enum: Object.keys(CHOICES) }, rationale: { type: 'string', description: 'Their reason, in their words.' }, sources: { type: 'array', items: { type: 'string' }, description: 'Item ids this rests on.' }, needs: { type: 'string', enum: Object.keys(POWERS), description: 'The area of authority it needs, if any.' }, about: { type: 'string', description: 'The id of the tension this answers, from get_interpretation, if any.' } }, required: ['engagement_id', 'subject', 'verdict', 'rationale'] },
      run({ engagement_id, subject, verdict, rationale, sources, needs, about }) {
        const next = change(engagement_id, { action: 'choice', subject }, (state, by) => {
          if (about && !findTensions(state.brand, { asOf: today(), workTypes: state.engagement.workTypes || [], channels: state.engagement.channels || [] }).some(t => t.id === about)) throw new Error(`No entry "${about}" in this engagement's interpretation. Take the id from get_interpretation.`);
          return recordChoice(state, { subject, verdict, rationale, sources, needs, about, by, asOf: today() });
        });
        const c = next.choices.at(-1);
        return { text: `Recorded: ${CHOICES[c.verdict]} ${c.subject}. ${c.status === 'accepted' ? `${POWERS[c.needs].replace(/^./, x => x.toUpperCase())} is theirs to decide here, so recording it decided it.` : c.needs ? (c.owner ? `Routed to ${person(next.brand, c.owner)}; it waits for their decision.` : `It needs a decision on ${POWERS[c.needs]}, and no one is named for that at ${next.brand.name} yet.`) : 'No one else\'s authority is needed.'}${c.about ? ` It is tied to the entry ${c.about}.` : ''}`, data: c };
      },
    },
    {
      name: 'answer_choice', title: 'Accept or decline a choice',
      description: 'Accept or decline a choice that is waiting for a decision. Only works where the practitioner whose workbench this is has been named to decide that choice\'s area; it cannot answer as anyone else. Declining needs their reason in "note".',
      input: { type: 'object', properties: { engagement_id: ENG, choice_id: { type: 'string', description: 'The choice id from record_choice or get_interpretation.' }, outcome: { type: 'string', enum: ['accept', 'decline'] }, note: { type: 'string', description: 'Their reason. Required to decline.' }, acting_as: { type: 'string', description: 'Present only so that a request to answer as someone else is refused clearly.' } }, required: ['engagement_id', 'choice_id', 'outcome'] },
      run({ engagement_id, choice_id, outcome, note, acting_as }) {
        const next = change(engagement_id, { action: 'answer-choice', choice: choice_id, outcome }, state => answerChoice(state, choice_id, { by: onlyAsSelf(state, acting_as), outcome, note, asOf: today() }));
        const c = next.choices.find(x => x.id === choice_id);
        return { text: `${c.status === 'accepted' ? 'Accepted' : 'Declined'} by ${person(next.brand, c.answer.by)}: ${CHOICES[c.verdict]} ${c.subject}.${c.answer.note ? ` ${c.answer.note}` : ''}`, data: c };
      },
    },
    {
      name: 'withdraw_choice', title: 'Withdraw a choice',
      description: 'Take back a choice the practitioner recorded. It stays in the record, marked withdrawn; nothing is erased. Only the person who recorded it can withdraw it.',
      input: { type: 'object', properties: { engagement_id: ENG, choice_id: { type: 'string', description: 'The choice id from record_choice or get_interpretation.' } }, required: ['engagement_id', 'choice_id'] },
      run({ engagement_id, choice_id }) {
        const next = change(engagement_id, { action: 'withdraw-choice', choice: choice_id }, (state, by) => withdrawChoice(state, choice_id, { by, asOf: today() }));
        const c = next.choices.find(x => x.id === choice_id);
        return { text: `Withdrawn: ${CHOICES[c.verdict]} ${c.subject}. It stays in the record as withdrawn.`, data: c };
      },
    },
    {
      name: 'record_answer', title: 'Record an answer to an open question',
      description: 'Record the practitioner\'s answer to a question the record leaves open (one of the engagement\'s questions, or something listed as not known). Give the question as the record words it and the answer in their words. An answer is a note with who gave it; it changes no standing and decides nothing. Use it only when they have actually answered.',
      input: { type: 'object', properties: { engagement_id: ENG, question: { type: 'string' }, answer: { type: 'string', description: 'Their answer, as they gave it.' } }, required: ['engagement_id', 'question', 'answer'] },
      run({ engagement_id, question, answer }) {
        const next = change(engagement_id, { action: 'answer', question }, (state, by) => recordAnswer(state, { question, answer, by, asOf: today() }));
        const a = next.answers.at(-1);
        return { text: `Answer recorded by ${person(next.brand, a.by)} on ${a.date}. It is a note in the record; nothing else changed.`, data: a };
      },
    },
    {
      name: 'propose_standing', title: 'Propose a change of standing',
      description: 'Propose that a piece of material should have a different standing (canon, precedent, contextual success, experiment, operational, archive). Proposing changes nothing. Give the practitioner\'s reason in their words. evidence_ids: only evidence the practitioner offers as grounds, and only evidence recorded on this material or material related to it counts. scope: where they say it should apply; leave it out if they have not said. The result lists the warnings the reviewer will see; recorded reuse and rights that are not cleared are always among them.',
      input: { type: 'object', properties: { engagement_id: ENG, item_id: ITEM, to: { type: 'string', enum: Object.keys(STANDING_CLASSES) }, rationale: { type: 'string', description: 'The practitioner\'s reason, as they gave it.' }, evidence_ids: { type: 'array', items: { type: 'string' }, description: 'Evidence ids from get_item that the practitioner cited.' }, scope: { type: 'string', description: 'Where the practitioner says it should apply.' } }, required: ['engagement_id', 'item_id', 'to', 'rationale'] },
      run({ engagement_id, item_id, to, rationale, evidence_ids, scope }) {
        const next = change(engagement_id, { action: 'propose', item: item_id, to }, (state, by) => propose(state, { itemId: item_id, to, rationale, evidenceIds: evidence_ids || [], scope: scope || '', by, asOf: today() }));
        const p = next.proposals.at(-1);
        const stated = p.to === 'canon' ? rulesStatedBy(next.brand, item_id) : [];
        const noted = isPublicStudy(next.brand) ? { id: p.id, itemId: p.itemId, readAs: classOf(p.to, next.brand).name, was: classOf(p.from, next.brand).name, rationale: p.rationale, note: 'A note to the practitioner. Nothing was proposed to anyone.' } : p;
        return { text: lines([
          isPublicStudy(next.brand)
            ? `Noted ${p.id}: ${classOf(p.to, next.brand).name.toLowerCase()}, where the study had it as ${classOf(p.from, next.brand).name.toLowerCase()}. This is the practitioner's note to themselves. Nothing about ${next.brand.name}'s material has changed, and only ${next.brand.name} could decide it.`
            : `Proposal ${p.id} recorded: ${STANDING_CLASSES[p.from].name} to ${STANDING_CLASSES[p.to].name}. Nothing has changed. It waits for ${who(next.brand, p.reviewer)}.`,
          !isPublicStudy(next.brand) && p.warnings.length ? 'The reviewer will see:' : null, ...(isPublicStudy(next.brand) ? [] : p.warnings.map(w => `- ${w}`)),
          stated.length && !isPublicStudy(next.brand) ? 'Adopting it would put these rules in force:' : null, ...(isPublicStudy(next.brand) ? [] : stated.map(r => `- [${r.id}] ${r.statement}`)),
        ]), data: noted };
      },
    },
    {
      name: 'decide_proposal', title: 'Decide a proposal',
      description: 'Adopt, reject or send back a proposal. Only works where the practitioner whose workbench this is has been named by the company to decide that area. It cannot decide as anyone else. Rejecting or sending back needs their reason in "note". Adopting as canon needs "covers": the kinds of work it binds, as the brand\'s material names them, or ["all"]. That list is what its rules are then held to, it has to come from the decider, and a scope the proposal arrived with does not stand in for it; an unknown kind is refused, with the list of kinds. "scope" is an optional note in their words, kept beside it. If the material has not been checked against its source it also needs "checked" (what they checked it against). "hold_back_rule_ids" names rules the material states that they are not adopting with it. Adoption as canon records their approval. Ask for all of these; do not supply them yourself. Adopting keeps the previous standing, the evidence, the scope and the date in the record.',
      input: { type: 'object', properties: { engagement_id: ENG, proposal_id: { type: 'string' }, outcome: { type: 'string', enum: ['adopt', 'reject', 'revise'] }, note: { type: 'string', description: 'Their reason. Required to reject or send back.' }, covers: { type: 'array', items: { type: 'string' }, description: 'The kinds of work the canon binds, as the brand\'s material names them (for example "Marketing website"), or ["all"]. Its rules apply to these and nothing else.' }, scope: { type: 'string', description: 'What the canon covers, in their words.' }, hold_back_rule_ids: { type: 'array', items: { type: 'string' }, description: 'Ids of rules the material states that are not to come into force with it.' }, checked: { type: 'string', description: 'What they checked the record against. Required to adopt as canon when the material is not yet verified.' }, acting_as: { type: 'string', description: 'Present only so that a request to decide as someone else is refused clearly.' } }, required: ['engagement_id', 'proposal_id', 'outcome'] },
      run({ engagement_id, proposal_id, outcome, note, scope, covers, hold_back_rule_ids, checked, acting_as }) {
        const next = change(engagement_id, { action: 'decide', proposal: proposal_id, outcome }, state => decide(state, proposal_id, { by: onlyAsSelf(state, acting_as), outcome, note, scope, covers, holdBack: hold_back_rule_ids, checked, asOf: today() }));
        const d = next.decisions.at(-1);
        const item = next.brand.items.find(i => i.id === d.itemId);
        const inForce = outcome === 'adopt' && d.to === 'canon' ? effectiveRules(next.brand).filter(r => r.source === item.id && r.standing === 'canon') : [];
        return { text: outcome === 'adopt'
          ? lines([
            `Adopted. "${item.title}" is now ${STANDING_CLASSES[item.standing].name.toLowerCase()}; it was ${STANDING_CLASSES[d.from].name.toLowerCase()}, and that is kept in its history.`,
            d.to === 'canon' ? `Its rules bind: ${d.covers.includes('all') ? 'all work' : d.covers.join(', ')}.${d.scopeNote ? ` In their words: ${String(d.scopeNote).replace(/[.]+$/, '')}.` : ''} It is approved by ${person(next.brand, item.approval.by)}; its rights are ${item.rights?.status === 'own' ? 'the brand\'s own' : item.rights?.status || 'unknown'}.` : null,
            inForce.length ? 'Rules now in force:' : null, ...inForce.map(r => `- [${r.id}] ${r.statement}`),
            d.heldBack?.length ? 'Held back, not in force:' : null, ...(d.heldBack || []).map(id => `- ${next.brand.rules.find(r => r.id === id)?.statement || id}`),
          ])
          : `Proposal ${outcome === 'reject' ? 'turned down' : 'sent back for revision'}: ${d.note} "${item.title}" is unchanged.`, data: d };
      },
    },
    {
      name: 'retire_item', title: 'Retire material to the archive',
      description: 'Retire a piece of material to the learning archive, keeping its history. Only works where the practitioner has been named to decide that area.',
      input: { type: 'object', properties: { engagement_id: ENG, item_id: ITEM, reason: { type: 'string' }, acting_as: { type: 'string', description: 'Present only so that a request to retire as someone else is refused clearly.' } }, required: ['engagement_id', 'item_id', 'reason'] },
      run({ engagement_id, item_id, reason, acting_as }) {
        const next = change(engagement_id, { action: 'retire', item: item_id }, state => retire(state, item_id, { by: onlyAsSelf(state, acting_as), reason, asOf: today() }));
        const item = next.brand.items.find(i => i.id === item_id);
        return { text: `"${item.title}" is retired to the learning archive. Its earlier standing is kept in its history.`, data: { id: item.id, standing: item.standing } };
      },
    },
    {
      name: 'name_authority', title: 'Name who decides',
      description: 'Record who decides an area (visual, verbal, sonic or product standing, public claims, usage rights, the offer, publishing). Only the company can say this, so it works only in an engagement where the practitioner holds the steward power, and never in a public-source study.',
      input: { type: 'object', properties: { engagement_id: ENG, area: { type: 'string', enum: Object.keys(POWERS) }, person_name: { type: 'string' }, person_title: { type: 'string' } }, required: ['engagement_id', 'area', 'person_name'] },
      run({ engagement_id, area, person_name, person_title }) {
        const next = change(engagement_id, { action: 'name-authority', area }, (state, by) => nameAuthority(state, { power: area, person: { name: person_name, title: person_title }, by, asOf: today() }));
        return { text: `${person_name.trim()} now decides ${POWERS[area]} at ${next.brand.name}. Choices and proposals that were waiting in that area are routed to them.`, data: { authority: next.brand.authority } };
      },
    },
    {
      name: 'build_brief', title: 'Build the brief', readOnly: true,
      description: 'Assemble the brief for this engagement: objective, audience, the choices recorded so far, the rules that apply, how the work will be judged (set before the work), and the exact sources it rests on, each with a fingerprint so later changes can be detected.',
      input: { type: 'object', properties: { engagement_id: ENG }, required: ['engagement_id'] },
      run({ engagement_id }) {
        const state = open(engagement_id);
        const brief = buildBrief(state.brand, state.engagement, state.choices, { asOf: today() });
        return {
          text: lines([
            `${brief.title}. ${brief.objective || ''}${brief.audience ? ` For ${brief.audience}.` : ''}`,
            brief.evaluation.length ? '\nHow it will be judged (decided now, before the work):' : null,
            ...brief.evaluation.map(x => `- ${x.outcome}: ${x.measure}. Compared with ${x.baseline}. Limit: ${x.limit}`),
            '\nChoices it carries:', ...(brief.decisions.length ? brief.decisions.map(d => `- ${CHOICES[d.verdict]}: ${d.subject}. ${d.rationale} (${d.status})`) : ['- None recorded yet.']),
            brief.rules.length ? (isPublicStudy(state.brand) ? '\nWhat the public material describes:' : '\nRules, with the standing each has:') : null,
            ...brief.rules.map(r => `- ${r.statement} (${r.readAs ? r.readAs.toLowerCase() : r.standing}${state.brand.rules.find(x => x.id === r.id)?.heldBack ? '; held back when its source was adopted, so not in force' : ''})`),
            `\nSources frozen on ${brief.frozenAt}:`, ...brief.snapshot.map(s => `- ${s.title} [${s.id}] ${s.standing}, ${s.pipeline}, fingerprint ${s.fingerprint}`),
          ]),
          data: brief,
        };
      },
    },
    {
      name: 'issue_context_package', title: 'Issue a context package to a partner',
      description: 'Give a partner (an agency, a freelancer, another agent) only what one assignment needs: rules that apply and material that is approved and licensed for the assignment\'s channels. Research, strategy, unreleased and unapproved material are withheld, and the partner is not told what was withheld. Read-only, expiring and revocable. Not available for a public-source study.',
      input: { type: 'object', properties: { engagement_id: ENG, partner_name: { type: 'string' }, assignment: { type: 'string' }, channels: { type: 'array', items: { type: 'string' } }, work_types: { type: 'array', items: { type: 'string' } }, expires: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['engagement_id', 'partner_name', 'assignment', 'channels', 'expires'] },
      run({ engagement_id, partner_name, assignment, channels, work_types, expires }) {
        const state = open(engagement_id);
        const existing = store.packages(engagement_id);
        const id = String(partner_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'partner';
        const { package: pkg, audit } = buildContextPackage(state, { partner: { id, name: flat(partner_name).trim() }, assignment: flat(assignment).trim(), channels, workTypes: work_types || state.engagement.workTypes || [], powers: ['read'], expires, asOf: today(), seq: existing.length + 1 });
        // Every package issued is kept, including revoked ones: the list is the audit.
        store.savePackages(engagement_id, [...existing, { package: pkg, audit }]);
        store.log(engagement_id, { action: 'issue-package', partner: partner_name });
        return {
          text: lines([
            `Package ${pkg.id} issued to ${pkg.partner.name} for "${pkg.assignment}". Read-only, expires ${expires}.`,
            `Included (${pkg.included.length}):`, ...pkg.included.map(i => `- ${i.title}`),
            `Rules in the package (${pkg.rules.length}):`, ...pkg.rules.map(r => `- ${r.statement} (${r.standing})`),
            `Withheld (${audit.withheld.length}); this list stays with you and is not in the package:`, ...audit.withheld.map(w => `- ${w.title}: ${[...new Set(w.reasons.map(r => String(r).replace(/[.]+$/, '')))].join('; ')}.`),
            pkg.open.length ? 'Unresolved, travelling with the package:' : null, ...pkg.open.map(o => `- ${String(o.title).replace(/[.]+$/, '')}. Ask ${o.ask}.`),
            `Review: ${pkg.review.reviewer ? `outputs return to ${pkg.review.reviewer}` : 'outputs return to the company for review'}. The partner cannot publish or change brand knowledge.`,
          ]),
          data: { package: pkg, withheld: audit.withheld.length },
        };
      },
    },
    {
      name: 'revoke_context_package', title: 'Revoke a context package',
      description: 'Revoke a context package issued earlier. After this it is no longer valid.',
      input: { type: 'object', properties: { engagement_id: ENG, package_id: { type: 'string' } }, required: ['engagement_id', 'package_id'] },
      run({ engagement_id, package_id }) {
        const list = store.packages(engagement_id);
        const entry = list.find(p => p.package.id === package_id);
        if (!entry) throw new Error(`No package "${package_id}" in this engagement.`);
        entry.package = revokePackage(entry.package, today());
        store.savePackages(engagement_id, list);
        store.log(engagement_id, { action: 'revoke-package', package: package_id });
        return { text: `Package ${package_id} revoked on ${entry.package.revokedAt}. Valid: ${yn(packageValid(entry.package, today()))}.`, data: { id: package_id, revokedAt: entry.package.revokedAt } };
      },
    },
    {
      name: 'export_engagement_package', title: 'Export the handoff package', readOnly: true,
      description: 'The record to leave behind: sources with provenance and fingerprints, choices, proposals, decisions, open tensions, open questions, and what this engagement did and did not complete. For a company engagement it belongs to the company. A public-source study stays with the practitioner. Set include_packet to also get the portable packet that the page and this connector can reopen.',
      input: { type: 'object', properties: { engagement_id: ENG, include_packet: { type: 'boolean' } }, required: ['engagement_id'] },
      run({ engagement_id, include_packet }) {
        const state = open(engagement_id, { allowExpired: true });
        const asOf = today();
        const packages = store.packages(engagement_id).map(p => p.package);
        const handoff = buildHandoff(state, { brief: buildBrief(state.brand, state.engagement, state.choices, { asOf }), asOf, packages });
        const live = packages.filter(p => packageValid(p, asOf));
        return {
          text: lines([
            `Engagement package for ${state.brand.name}, written ${asOf}. The engagement has not been ended. ${handoff.basisNote}`,
            [[handoff.sources.length, 'source'], [handoff.choices.length, 'choice'], [handoff.proposals.length, 'proposal'], [handoff.decisions.length, 'decision'], [handoff.answers.length, 'answer'], [handoff.openTensions.length, 'open tension']].map(([n, w]) => `${n} ${w}${n === 1 ? '' : 's'}`).join(', ') + '.',
            live.length ? `Context packages still valid (${live.length}):` : packages.length ? 'No context package is still valid.' : null,
            ...live.map(p => `- ${p.id} to ${p.partner?.name}, for "${p.assignment}", expires ${p.expires}`),
            state.engagement.modeNote && `How this record was made: ${state.engagement.modeNote}`,
            handoff.standingNote || null,
            `Kept by the company: ${handoff.retained.company}`, `Kept by the practitioner: ${handoff.retained.practitioner}`,
            `Completed: ${handoff.completed.join(', ') || 'nothing'}. Not done: ${handoff.notCompleted.join(', ')}.`,
            handoff.openQuestions.length ? 'Still open:' : null, ...handoff.openQuestions.map(q => `- ${q}`),
            'The full package is in the structured result.',
          ]),
          data: include_packet ? { handoff, packet: toPacket(state) } : { handoff },
        };
      },
    },
    {
      name: 'save_engagement_package', title: 'Save the handoff package to a file',
      description: 'Write the engagement\'s handoff package and its portable packet to one file in the workbench\'s exports folder and return the path, for records too large to pass through a conversation. The file holds that client\'s material; it is the practitioner\'s to hand over or delete.',
      input: { type: 'object', properties: { engagement_id: ENG }, required: ['engagement_id'] },
      run({ engagement_id }) {
        const state = open(engagement_id, { allowExpired: true });
        const asOf = today();
        const handoff = buildHandoff(state, { brief: buildBrief(state.brand, state.engagement, state.choices, { asOf }), asOf, packages: store.packages(engagement_id).map(p => p.package) });
        const { expired, ...clean } = state; void expired;
        const path = store.saveOutside('exports', `${engagement_id}-${asOf}.json`, { handoff, packet: toPacket(clean) });
        store.log(engagement_id, { action: 'save-package', by: actorOf(state) });
        return { text: `Saved to ${path}. It holds ${state.brand.name}'s material: ${handoff.sources.length} sources, ${handoff.choices.length} choices, ${handoff.proposals.length} proposals, ${handoff.decisions.length} decisions.`, data: { path } };
      },
    },
    {
      name: 'import_packet', title: 'Open a brand packet', destructive: true,
      description: 'Add an engagement from a brand packet: one brand partition and its engagement in plain JSON (format living-brand.packet/0.2), as exported by the workbench page or by export_engagement_package. Give either the path of a .json file the practitioner supplied, or the JSON text. The packet is checked and refused if inconsistent. It never replaces another client\'s engagement. It replaces the same client\'s open engagement only when replace is true, and never if that would change who may decide. A packet is believed as written: the result says what it asserts.',
      input: { type: 'object', properties: { path: { type: 'string', description: 'Path to a .packet.json file the practitioner supplied.' }, json: { type: 'string', description: 'The packet as JSON text.' }, replace: { type: 'boolean', description: 'Set true to overwrite the same client\'s engagement that is already open here.' } } },
      run({ path, json, replace }) {
        if (!path && !json) throw new Error('Give a path or the JSON text of a packet.');
        if (path && json) throw new Error('Give a path or the JSON text, not both.');
        let raw = json;
        if (path) {
          // Only an ordinary .json file of a sensible size is read, and nothing of its content is echoed on failure.
          let info;
          try { info = lstatSync(path); } catch { throw new Error('There is no file at that path.'); }
          if (!info.isFile() || !/\.json$/i.test(path)) throw new Error('A packet is an ordinary file whose name ends in .json.');
          if (info.size > 25 * 1024 * 1024) throw new Error('That file is larger than 25 MB, which is more than a packet should be.');
          try { raw = readFileSync(path, 'utf8'); } catch { throw new Error('That file could not be read.'); }
        }
        let packet;
        try { packet = JSON.parse(raw); } catch { throw new Error('That is not a packet: it is not valid JSON.'); }
        const { brand, engagement } = readPacket(packet);
        const rows = store.bench().engagements;
        const taken = rows.find(e => e.id === engagement.id);
        let replacing = false;
        const notes = [];
        if (taken && (taken.brandId ? taken.brandId !== brand.id : taken.client !== brand.name)) {
          throw new Error(`The id "${engagement.id}" belongs to the ${taken.client} engagement here${taken.status === 'ended' ? ', which has ended' : ''}. A packet for ${brand.name} cannot take another client's place. Give this packet's engagement a different id.`);
        }
        if (taken && taken.status === 'open') {
          let current = null;
          try { current = open(engagement.id, { allowExpired: true }); } catch { /* the stored record cannot be read */ }
          if (replace !== true) {
            throw new Error(current
              ? `The ${taken.client} engagement is already open here with its own record (${current.choices.length} choices, ${current.proposals.length} proposals, ${current.decisions.length} decisions). Importing would replace it. Export it first if it matters, then call again with replace set to true.`
              : `The ${taken.client} engagement is already here, though its record cannot be read. Call again with replace set to true to put this packet in its place.`);
          }
          if (current) {
            // Who may decide is never changed by swapping the file. That goes through name_authority, on the record.
            const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
            const was = toPacket(current);
            if (!same(was.brand.authority, brand.authority) || !same(was.engagement.grant, engagement.grant) || !same(was.engagement.actor, engagement.actor) || was.brand.basis !== brand.basis) {
              throw new Error(`This packet changes who may decide at ${brand.name}, or what this engagement may do. That is never changed by replacing a record. Use name_authority for the first; the second is the company's to grant.`);
            }
            const before = new Map(was.brand.items.map(i => [i.id, i]));
            const moved = brand.items.filter(i => before.has(i.id) && (before.get(i.id).standing !== i.standing || before.get(i.id).approval?.status !== i.approval?.status)).length;
            if (moved) notes.push(`It changes the standing or approval of ${moved} item${moved === 1 ? '' : 's'} compared with the record it replaces.`);
          }
          replacing = true;
        }
        const says = packetAssertions(packet);
        const text = lines([
          `Opened ${brand.name} as engagement [${engagement.id}]: ${brand.items.length} items, ${(brand.rules || []).length} rules. ${basisLine(brand)} It is stored in its own folder.`,
          brand.basis === 'public-source'
            ? `The packet reads ${says.canon} item${says.canon === 1 ? '' : 's'} as current. That is its author's reading of public material; nothing in it is ${brand.name}'s decision. This connector cannot check who wrote it.`
            : `On its own say-so the packet states ${says.canon} item${says.canon === 1 ? '' : 's'} as canon and ${says.approved} as approved, and carries ${says.decisions} recorded decision${says.decisions === 1 ? '' : 's'}. This connector cannot check who wrote it.`,
          says.deciders.length ? `It names who decides: ${says.deciders.join('; ')}.` : 'It names no one as deciding anything.',
          ...notes,
        ]);
        const row = store.savePacket(packet, { note: replacing ? 'Imported, replacing the previous record.' : 'Imported.' });
        return { text, data: { ...row, asserts: says } };
      },
    },
    {
      name: 'end_engagement', title: 'End an engagement and remove its material', destructive: true,
      description: 'End a company engagement. The whole final record (handoff package, portable packet, context packages issued, and the log) is first written to one file in the workbench\'s handed-over folder, and its path is returned; then that client\'s folder is deleted from the workbench. The deletion cannot be undone. The file is the practitioner\'s to give to the company and then delete. A public-source study is the practitioner\'s own and is not ended this way.',
      input: { type: 'object', properties: { engagement_id: ENG, confirm: { type: 'boolean', description: 'Must be true, after the practitioner has agreed.' } }, required: ['engagement_id', 'confirm'] },
      run({ engagement_id, confirm }) {
        const asOf = today();
        const row = store.row(engagement_id);
        if (row.status === 'ended') throw new Error(`The ${row.client} engagement already ended${row.endedOn ? ` on ${row.endedOn}` : ''}.`);
        let state = null;
        try { state = open(engagement_id, { allowExpired: true }); } catch (error) { if (row.status !== 'unreadable' && !/cannot be read|no record on disk|Packet refused/.test(error.message)) throw error; }
        if (state && isPublicStudy(state.brand)) throw new Error(`The ${state.brand.name} study is your own reading of public material. There is nothing of ${state.brand.name}'s to hand back or remove.`);
        if (confirm !== true) throw new Error('Not ended. Ask the practitioner to confirm, then call again with confirm set to true.');
        if (!state) {
          const path = store.endUnreadable(engagement_id, asOf);
          return { text: `The ${row.client} engagement's record could not be read. Its files were kept as they were in ${path}, and its folder has been removed from the workbench.`, data: { path } };
        }
        const handoff = buildHandoff(state, { brief: buildBrief(state.brand, state.engagement, state.choices, { asOf }), asOf, ended: asOf, packages: store.packages(engagement_id).map(p => p.package) });
        const { expired, ...clean } = state; void expired;
        let log = '';
        try { log = readFileSync(`${store.home}/engagements/${engagement_id}/log.jsonl`, 'utf8'); } catch { /* no log yet */ }
        const path = store.end(engagement_id, asOf, { handoff, packet: toPacket(clean), packages: store.packages(engagement_id), log: log.split('\n').filter(Boolean) });
        return {
          text: lines([
            `The ${state.brand.name} engagement ended on ${asOf}. Its folder has been removed from this workbench.`,
            `The final record is in one file: ${path}`,
            `It holds ${handoff.sources.length} sources, ${handoff.choices.length} choices, ${handoff.proposals.length} proposals, ${handoff.decisions.length} decisions and ${handoff.openTensions.length} open tensions. Give it to ${state.brand.name}, then delete it: it is the last copy here.`,
            'Copies made earlier (exports, a private page, this conversation) are not removed by this.',
          ]),
          data: { path, sources: handoff.sources.length, choices: handoff.choices.length, proposals: handoff.proposals.length, decisions: handoff.decisions.length },
        };
      },
    },
    {
      name: 'get_workbench', title: 'Read the practitioner\'s workbench', readOnly: true,
      description: 'What travels with the practitioner between clients: their methods and preferences, and a list of engagements. It holds no client material.',
      input: { type: 'object', properties: {} },
      run() {
        const b = store.bench();
        return { text: lines([`${b.practitioner.name}'s workbench.`, 'Methods:', ...b.practitioner.methods.map(m => `- ${m}`), `Engagements: ${b.engagements.map(e => `${e.client} (${e.status})`).join(', ') || 'none'}.`, 'No client material is kept here; each engagement has its own folder.']), data: { practitioner: b.practitioner, engagements: b.engagements.map(e => ({ client: e.client, role: e.role, status: e.status })) } };
      },
    },
    {
      name: 'add_method', title: 'Add a method to the workbench',
      description: 'Add a general working method to the practitioner\'s portable workbench. Methods travel between clients, so a method must not contain any client\'s name, material, numbers or plans. The connector refuses a method that names a client or a project; it cannot recognise client material in other words, so the wording has to be general before it is saved.',
      input: { type: 'object', properties: { method: { type: 'string' } }, required: ['method'] },
      run({ method }) {
        const text = flat(method ?? '').replace(/\s+/g, ' ').trim();
        if (!text) throw new Error('Say what the method is.');
        if (text.length > 300) throw new Error('A method is a sentence or two. Keep it under 300 characters.');
        const b = store.bench();
        const names = b.engagements.flatMap(e => [[e.client, 'names'], [e.project, 'names the project']]).filter(([n]) => typeof n === 'string' && n.trim().length > 2);
        const hit = names.find(([n]) => new RegExp(`(^|[^\\p{L}\\p{N}])${n.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'iu').test(text));
        if (hit) throw new Error(`That ${hit[1]} ${hit[0]}. Methods travel between clients, so they cannot carry a client's name or material. Say it as a general practice.`);
        store.updateBench(x => { if (!x.practitioner.methods.includes(text)) x.practitioner.methods.push(text); });
        return { text: `Added to your methods: ${text}`, data: { methods: store.bench().practitioner.methods } };
      },
    },
  ];
  return tools;
}
