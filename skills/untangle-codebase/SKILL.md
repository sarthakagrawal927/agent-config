---
name: untangle-codebase
description: Diagnose and refactor tangled code within a bounded subsystem, using callers, change history, and behavior checks to justify structural changes. Use for requested architecture cleanup or recurring changes spread across coupled modules; skip routine fixes and cosmetic cleanup.
---

# Untangle Codebase

Reduce the number of places a real change must touch while preserving intended
behavior. Use the question: which pieces need to change together, and which
should be able to change independently?

Inspired by [caldoai's untangle-codebase skill](https://github.com/caldoai/skills/blob/main/skills/untangle-codebase/SKILL.md).
This adaptation bounds the work and verifies each refactor as it proceeds.

## Bound the work

Use the owner's named area and maintenance problem. If the request names no
area, inspect entry points, callers, tests, and recent history to select one
coherent subsystem; state that boundary before editing. A whole-repository
request permits broader diagnosis, but implement one coherent subsystem at a
time. Do not turn an ordinary bug fix into an architecture project.

Define completion in terms of the identified problems, such as one owner for a
duplicated rule or an explicit dependency replacing an order-sensitive global.
Do not use the number of remaining conditionals, files, or abstractions as a
quality score. New findings outside the boundary belong in the final report.

Follow repository instructions and use the installed `codevetter-engineering`
skill for the risk-based verification and independent-review requirements.
If unavailable, use native checks and disclose the gap; do not claim required
review is complete. Do not add a parallel review or performance workflow here.

## Diagnose with evidence

Read the relevant implementations and actual callers, not only signatures or
generated summaries. Use dependency graphs and Git history where they help
answer a concrete question. Co-change is a clue; establish the shared reason
before consolidating code.

Look for:

- Hidden dependencies: duplicated business rules, implicit initialization order,
  shared mutable state, or a feature whose pieces must be discovered by convention.
- Unnecessary coupling: callers reaching into internals, stable policy depending
  on a provider detail, or generic APIs carrying a single caller's vocabulary.
- Unnecessary machinery: proven-unused code, pass-through wrappers without a
  contract, or extension points with no current requirement.

For each proposed change, record the observed maintenance problem, supporting
paths/callers or history, the proposed boundary, and the behavior check that
will protect it. A short list in the task context is enough; write a decision
log file only if requested or warranted by a substantial multi-step refactor.

An exception, retry, delay, compatibility branch, or provider-specific path
can encode a real constraint. Trace its origin and failure behavior before
changing it. Preserve it when the requirement remains; consolidate only when
the replacement expresses that requirement and passes the relevant checks.
Before removing apparently dead code, check dynamic registration, exports,
generated consumers, and supported external callers where applicable.

## Refactor in coherent changes

Capture a baseline with the smallest relevant existing checks before editing.
Record existing failures separately. Where coverage is missing, add a focused
behavior or characterization check for the boundary being changed rather than
freezing the internal implementation in a snapshot.

Prefer one owner for a rule and explicit contracts between responsibilities.
Colocate code that changes for the same reason; preserve useful separation
between independently changing concerns. Avoid introducing a framework or a
new provider abstraction without current callers or requirements that need it.

Implement one coherent structural change at a time and run its protecting
checks immediately. Exercise affected runtime boundaries when required by the
consequences; passing unit tests alone does not prove behavior equivalence.
Keep each change reviewable and reversible, preserving unrelated dirty work.

Keep intended behavior stable. If a defect is discovered, distinguish it from
the refactor, reproduce it where practical, and fix it only within the owner's
scope. Report unrelated defects without expanding the assignment.

## Comments and tests

Do not run a separate comment purge or test-deletion pass unless requested.
When touching code, retain useful rationale, preconditions, invariants, and
external constraints even if they could be inferred from the implementation.
Remove or correct comments made obsolete by the actual change.

Update tests whose assumptions depend on internals, while retaining their
observable regression coverage. Before deleting or consolidating a test,
explain what regression it protected and where that coverage remains, or why
the behavior is no longer supported. Similar assertions in two interfaces may
protect different wiring; duplication alone does not justify deletion.
If the case for removal is uncertain, retain the test.

## Stop and report

Finish when the identified in-scope problems are resolved and the applicable
checks and required review cover the final source. Inspect the final diff for
accidental behavior changes and unnecessary abstraction. Resolve newly exposed
issues required for the chosen refactor to work; report independent findings
without starting another cleanup cycle.

For a large subsystem, bounded subagent diagnosis may help when delegation is
available and authorized. Give each reviewer a specific boundary or question;
do not ask agents to keep searching until no subjective improvements remain.
Keep one writer per repository and follow CodeVetter's independent-review
policy instead of recursively requesting reviews.

Report the problem resolved, resulting ownership/dependencies, checks actually
run, required review status, and any deferred or unverified behavior. Do not
claim lower token use, faster development, or fewer defects without measurement.
