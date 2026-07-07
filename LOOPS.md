# LOOPS.md

Field of Action. Loop Engineering Spec.
Sibling to CANON.md. Open reads this before it tracks. ASU governs it.

## Purpose

Every loop in the system conforms to four properties before it runs. Open owns
conformance. A loop that fails a property is throughput. Throughput gets repaired
or routed to Anomaly Inquiry. The loop is the unit of work, not the artifact.

## The Four Properties (conformance check)

1. **Gate.** What authorizes the loop to open.
   Test: can you name the signal or condition that starts it? A loop with no named
   gate runs from outside the center.

2. **Stages.** The named movements between open and close, each bound to an agent.
   Test: is every stage written and assigned? Unwritten stages drift per instance.

3. **Return.** What comes back, and where it writes durably.
   Test: does the output write to a location the next pass reads on open? A loop
   with no return is throughput wearing a circle.

4. **Closure.** How it ends, and where it files into Cache.
   Test: does it have a closure rule, and if dormant a wake trigger? A loop with no
   closure rule reloads as cognitive cost every cycle.

## Conformance states

- **ENGINEERED.** All four properties present and written.
- **PARTIAL.** One or more properties thin or unwritten. Name which.
- **THROUGHPUT.** No Return. Flagged for repair.

## Period (required field)

Every loop also carries a Period — the clock it is judged against. Open sets it on
open; a loop with no Period defaults to weekly pressure, which mislabels healthy
long-line work as drag. Three values:

- **Immediate.** Closes within a cycle. Carrying past its cycle is a stall.
- **Medium.** Advances by stages over several cycles. Healthy if it moved a stage,
  even if it did not close.
- **Long-line.** Runs months, often gated on a decision or an emergence. Open is its
  nature, not a stall; never under closure-pressure.

Drag is read against a loop's own Period, never the calendar. (See CANON.md §5,
2026-06-28.) Gates are inherently Long-line: a gate is paced by approach to its
decision-by date, not by weekly movement.

## Loop types

Two types. Standard loops run to produce output. Gates run to force a decision,
and they behave differently on every property, so they are tracked separately
(see Gates, below).

- **Gate.** The condition that has come due and now requires a decision to clear.
- **Stages.** The inputs being gathered before the decision can be made, each bound
  to an agent or an external source.
- **Return.** The decision itself, which unblocks everything chained behind it.
- **Closure.** Freedom Embassy makes the call by a named decision-by date. The gate
  then files as a resolved decision in Cache.

Key difference: a gate is exempt from the three-week stuck reading. Progress on a
gate is measured by approach to its decision-by date, not by upstream activity.
Doing more input work never closes a gate. Only the decision does. A gate with no
decision-by date is the failure mode, because it can sit forever wearing the
costume of a live thread.

## Closure discipline (applies to every loop)

- No thread goes DORMANT without a named wake trigger.
- Any LIVE thread with no movement for three consecutive weeks routes to Anomaly
  Inquiry (Reject / Contain / Integrate / Expand) rather than silent carry.

---

## Loop Records

### LOOP-001 · Weekly Digest
Owner: Open. Containers: Claude, ChatGPT. Period: Immediate (opens and closes each Sunday cycle).

- **Gate.** Sunday cadence (reminder-backed) plus manual trigger. Refinement: add a
  minimum-signal condition (both containers have produced reads). Below threshold,
  run a light pass. State: PARTIAL, ENGINEERED on adoption.
- **Stages.** (1) Claude-side read, Field. (2) ChatGPT-side read, Field.
  (3) Triangulation, CLSSM. (4) Convergence naming, CLSSM. (5) Unifying-principle
  extraction, CLSSM. (6) Open-loop prioritization, Grace and Open. State: written
  here, ENGINEERED.
- **Return.** Writes to DIGEST-LOG.md in Cache. The next pass loads it on open.
  State: pipe built (see DIGEST-LOG.md), ENGINEERED on first write-back.
- **Closure.** LIVE / DORMANT / CLOSED registry with resolution notes and wake
  triggers. State: ENGINEERED under the discipline above.

Overall: ENGINEERED once the first Return write completes.

### LOOP-002 · FOA Compound Loop
Owner: Grace, CLSSM. (Defined in CANON.md.) Period: Medium (advances by stages, brief through dispatch, across cycles).

- **Gate.** Signal or brief enters Field. State: ENGINEERED.
- **Stages.** Field → WIP → Action → Grace → Cache → CLSSM → Anomaly Inquiry →
  CANON write-back → Dispatch. State: ENGINEERED.
- **Return.** CANON.md write-back. State: PARTIAL, blocked on proprietary fills
  (the three remaining typographic cuts, exact hex values, the eleven named failure
  modes). Manual until filled.
- **Closure.** Cache store and Dispatch. State: ENGINEERED.

Overall: PARTIAL. Return blocked. Same gap class as LOOP-001 before its pipe.

### LOOP-003 · Authorization Loop (reference, not tracked for closure)
Owner: Freedom Embassy. Personal and somatic. Period: Long-line (circular, runs continuously; reference donor, not closed).

Stages: Attunement → Intention → Claiming → Authorization → Anticipation →
Release → Action → Resonance. Circular. Resonance feeds Attunement.

Role in spec: stage and gate donor. Supplies the Claiming and Authorization gate
language, and the Resonance return shape, that the operational loops draw on.

---

## Gates

### GATE-001 · Location (NYC relocation)
Owner: Freedom Embassy. Reclassified from LIVE thread via Anomaly Inquiry
(Integrate plus Contain). Period: Long-line (gate; paced to decision-by, not weekly movement).

- **Gate.** LA or NYC. Come due. Has been carrying as the system's ceiling.
- **Stages.** NYC school read (external). Natalie life-map (in progress).
  Co-parenting logistics with Gracia.
- **Return.** The placement decision, which unblocks the dependents chained behind it.
- **Closure.** Decision-by: `<fill: date the attached timeline gives>`. Freedom
  Embassy calls it.

Disposition: DORMANT until both wake triggers fire (school read complete, Natalie
map complete), then it wakes as a decision, not a thread.
Decoupled: the career role-category question was chained here by proximity. It does
not structurally require placement to be settled, so it advances in parallel.
Watch (hypothesis, not enacted): Location may be a proxy for the Claiming gate
(self-authorization). Held for evidence across passes, not written into governance.

### GATE-002 · FOA evolution (Voice vs Platform)
Owner: Freedom Embassy. Opened from the tentpole-evolution pass. Period: Long-line (gate; held as a decision, paced to decision-by).

- **Gate.** The April 16 launch charge is spent. Both digests converge on "the base
  is built" and on building giving way to inhabiting. The fork has come due.
- **Stages.** (a) Close the building era: declare the build done, stop adding
  instruments, archive it. (b) Confirm Canon runs as the engine underneath either
  branch (CANON.md, LOOPS.md, DIGEST-LOG.md already laid). (c) Read the leakage:
  Voice (Wednesday dispatch, Art of Memos, LinkedIn positioning) against Platform
  (ASU partnership, agent architecture, Eliasson capacity model, capability sentence).
- **Return.** One branch becomes the Gate, the other becomes a Stage downstream of it.
  - Voice-gated: FOA fires because there is something to say. Internally gated, fuel
    is yours, you stay the protagonist.
  - Platform-gated: FOA fires because capacity is commissioned. Externally gated
    unless you assert the capacity whether or not it is asked for. Asserted capacity
    is clean. Awaited capacity re-imports the hot validation loop.
- **Closure.** Decision-by: `<fill>`. Deciding edge is the burning-clean test: which
  branch can fire tomorrow with no one asking. That answer is the internal Gate.

Disposition: OPEN. Held as a decision, not carried as a mood. Do not load both
branches at once. Both lights on is why the charge currently reads diffuse.
