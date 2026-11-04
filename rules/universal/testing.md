# Universal — Testing & Quality Assurance (`TST`)

Applies to every codebase. Load always.

---

### TST-001 — No test suite

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** QA Engineer
- **Effort:** 5–15

**Detect:** No test directory or framework; a framework present with only scaffolding tests; test
scripts that exit 0 without running anything.

**Why it matters:** Every change is verified manually or not at all, which is what makes every other
finding in this report expensive to fix.

**Impact:** Enables safe refactoring and faster delivery by catching regressions automatically rather than through manual verification.

**Fix:** Test the highest-risk business paths first, not coverage percentage. Add a regression test
with each fix delivered in this roadmap.

---

### TST-002 — Tests exist but do not run in CI

- **Dimension:** maintainability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 0.5–2

**Detect:** Test suites present in the repository but absent from the pipeline; only one project in a
monorepo tested; test step marked `continue-on-error`; failing tests tolerated as "known".

**Why it matters:** The suite decays because nothing enforces it, and by the time someone runs it
locally it is red for a dozen unrelated reasons.

**Impact:** Keeps the test suite trustworthy and green by enforcing it on every change instead of relying on individual discipline.

**Fix:** Run every suite on each PR as a required check, and fix or delete the tests that are already
failing before enforcing.

---

### TST-003 — No tests around the highest-risk logic

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** QA Engineer
- **Effort:** 3–8

**Detect:** Tests concentrated on trivial getters and utilities while pricing, permissions, financial
calculations, state machines and integration boundaries are untested.

**Why it matters:** Coverage percentage looks acceptable while the code that would actually cause
business damage is unverified.

**Impact:** Directs testing effort at the logic whose failure would cause real business damage, raising confidence far faster than chasing a coverage number.

**Fix:** Identify the business-critical paths, write tests for their edge cases and failure modes
first, and track coverage on those modules specifically.

---

### TST-004 — Tests coupled to implementation detail

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** QA Engineer
- **Effort:** 2–5

**Detect:** Heavy mocking of internal collaborators, assertions on private methods or call order,
snapshot tests over volatile output, tests that must change whenever code is refactored without
behaviour changing.

**Why it matters:** The suite obstructs refactoring rather than enabling it, so the team stops
refactoring.

**Impact:** Turns the test suite into a refactoring enabler by asserting on behaviour and outcomes rather than internal structure.

**Fix:** Test through public interfaces, mock only at process boundaries, and assert on observable
outcomes.

---

### TST-005 — No integration or end-to-end coverage of critical journeys

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** QA Engineer
- **Effort:** 5–10

**Detect:** Unit tests only; wiring, routing, authentication, serialisation and database interaction
untested; no test exercising a full user journey.

**Why it matters:** Every unit passes while the assembled system fails at the seams — where most
production defects actually occur.

**Impact:** Verifies that the assembled system works, not just its parts, catching the wiring and integration defects unit tests structurally cannot see.

**Fix:** Add integration tests over the real HTTP surface and a real (containerised) database, plus a
small end-to-end suite covering login and the two or three journeys that generate the revenue.

---

### TST-006 — Flaky or slow tests

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** QA Engineer
- **Effort:** 2–5

**Detect:** Tests retried until green; failures attributed to "just flaky"; sleeps used for
synchronisation; shared mutable fixtures; order-dependent tests; a suite slow enough that developers
skip it.

**Why it matters:** A suite that cries wolf gets ignored, and then real failures are ignored too.

**Impact:** Restores trust in the pipeline so failures are investigated rather than re-run, and keeps the feedback loop fast enough to use.

**Fix:** Remove shared state and time-based waits, isolate fixtures per test, quarantine and fix known
flaky tests, and parallelise to keep the suite fast.

---

### TST-007 — No pre-merge quality gate beyond formatting

- **Dimension:** maintainability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** Pre-commit hooks running only a formatter; no type-check, lint, test or security scan
before merge; checks defined but not required.

**Why it matters:** Formatting is the least valuable thing to automate, and its presence creates a
false impression that quality is gated.

**Impact:** Catches type errors, lint violations and known vulnerabilities before merge rather than after deployment.

**Fix:** Add type-check, lint, unit tests and a dependency audit as required checks; keep hooks fast
and push heavier verification to CI.

---

### TST-008 — No test data strategy

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** QA Engineer
- **Effort:** 2–4

**Detect:** Tests depending on a shared, manually-maintained database; production data copied into
test environments; fixtures duplicated across test files; tests that pass only in a particular order.

**Why it matters:** Tests become unreliable and personal data spreads into environments with weaker
controls.

**Impact:** Makes tests independent and repeatable while keeping real personal data out of test environments.

**Fix:** Build test data per test with factories, use an ephemeral containerised database, and
synthesise rather than copy personal data.
