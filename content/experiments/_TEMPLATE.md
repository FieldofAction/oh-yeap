---
# Copy this file to content/experiments/<slug>.md and fill it in.
# The filename is the URL: <slug>.md publishes at /experiments/<slug>.
# Files starting with "_" are ignored by the build, so this one never publishes.
# Full instructions: EXPERIMENTS-PUBLISHING.md

# ── Required ──
id: FOA-EXP-0000-000
title: Working title of the experiment
summary: One or two sentences describing what was run and what was seen. This is the page's meta description — aim for under 160 characters.
experiment_date: 0000-00-00
published: 0000-00-00
version: 1

# ── Optional ──
# updated: 0000-00-00          # defaults to `published`
# status: published            # `published` (default) or `draft` — drafts are skipped by the build
# confidence_level: moderate   # low | moderate | high
# tags:
#   - framing
#   - refusal
# related:
#   - FOA-EXP-0000-001
---

## Recipe

The mixture. What was combined, and in what proportion.

Keep two kinds of quantity apart, and label which is which:

- **Conceptual proportions** — your own description of the blend, e.g. "roughly
  two parts instruction to one part example". These are a reading of the
  mixture, not a measurement of it.
- **Exposed settings** — values the system actually takes, e.g. the model
  identifier and version, or a sampling parameter you set directly. Give the
  literal value.

Say which ingredients were fixed from a previous run and which were varied.

## Process

What was done, in order. The sequence of turns or calls, what was held
constant between them, and where you intervened.

## Environment

The conditions the run sat in. The model and its version, the surface it was
run through, whether the context was fresh or continued, what else was already
in that context, what tools or retrieval were available, and the date.

## Observed Phenomenon

What the material actually did. Quote it, count it, or describe it plainly.

Observation only — no cause, no explanation, no claim about what the system
"wants" or "understands". Those belong under Possible Behavior.

## Confidence

How much this record can carry. How many runs, how much they varied, what was
measured against what was estimated, and what would change the reading.

## Anomaly

What did not fit the expectation or the previous run. If nothing deviated, say
so plainly.

## Possible Behavior

Optional. Possible *human* behaviour in relation to this material — what a
person might do differently, given the record above. State it as a hypothesis.

Do not force a use case. Delete this section if the run does not support one.

## Evidence

Optional. What backs the record: transcript excerpts, counts across runs,
repeats, comparisons against a control.

## Sources

Optional. References consulted, as `- [Title](https://example.org)` lines.

## Limitations

Optional. What this run does not establish.

## Next Test

Optional. The single next thing to vary, and what it would resolve.
