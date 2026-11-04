# Universal — Code Maintainability (`MNT`)

Applies to every codebase. Load always.

---

### MNT-001 — Large, complex functions

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Functions over ~60 lines, cyclomatic complexity above ~10, more than 3 levels of nesting,
or more than ~5 parameters. Flag the specific offenders with line counts, not the general tendency.

**Why it matters:** Complexity is where bugs hide; such functions cannot be unit-tested meaningfully
and every change is a regression risk.

**Impact:** Improves readability, simplifies testing and debugging, and enables easier long-term maintenance and enhancement.

**Fix:** Extract cohesive steps into named functions, replace nested conditionals with early returns,
and group related parameters into an object. Add a complexity lint rule to prevent regression.

---

### MNT-002 — Dead code and unused declarations

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 1–5

**Detect:** Unreachable branches, commented-out blocks, unused imports/variables/functions/state,
feature-flagged code for shipped features, endpoints with no caller.

**Why it matters:** Every reader must determine whether it matters, and it distorts search results
and refactoring tools.

**Impact:** Improves readability, reduces maintenance overhead, and simplifies future development.

**Fix:** Delete it — version control is the archive. Enable unused-code lint rules and a dead-export
check so it does not accumulate again.

---

### MNT-003 — Unused or redundant state

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** UI frameworks
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 0.5–1

**Detect:** State declared and never read, state that mirrors a prop, or state derivable from other
state with a plain expression.

**Why it matters:** Redundant state is a synchronisation bug waiting to happen and causes needless
re-renders.

**Impact:** Improves code maintainability, reduces unnecessary re-renders and memory usage, and makes components cleaner and easier to understand.

**Fix:** Delete unused state; derive values instead of storing them; keep a single source of truth.

---

### MNT-004 — Inconsistent or absent error handling

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Full-Stack Engineer
- **Effort:** 2–4

**Detect:** Some paths `try/catch`, others do not; catch blocks that swallow (`except: pass`,
`catch {}`), log-and-continue with a corrupted state, generic `catch (Exception)` hiding real
failures, error shapes differing per endpoint.

**Why it matters:** Failures surface far from their cause or not at all, and clients cannot handle
errors consistently because there is no contract.

**Impact:** Improves debugging, ensures consistent user feedback, and reduces unhandled runtime failures.

**Fix:** Define an error taxonomy and one response shape. Catch narrowly, handle or rethrow with
context, and use one global handler for the unexpected. Never swallow silently.

---

### MNT-005 — Unused or unreachable error handling

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–4

**Detect:** `catch` blocks for exceptions the enclosed code cannot raise; a broad handler after a
specific one that already covers everything; retry logic around a call that never fails transiently.

**Why it matters:** It reads as protection that does not exist, and it hides which failures are
actually possible.

**Impact:** Cleaner and more maintainable codebase, improved readability, accurate exception flow understanding, and reduced debugging complexity. Ensures only meaningful and active error handling remains in production code.

**Fix:** Remove the unreachable handlers and keep those that map to genuine failure modes.

---

### MNT-006 — Magic numbers and unexplained literals

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Unnamed numeric or string literals carrying business meaning — thresholds, timeouts,
status codes, retry counts, page sizes, indexes into fixed structures.

**Why it matters:** The reader cannot tell whether `9` is a business rule or an arbitrary choice, so
nobody dares change it.

**Impact:** Makes business rules explicit and centrally adjustable rather than scattered as unexplained values through the code.

**Fix:** Name every meaningful literal as a constant; move operationally tunable ones to configuration.

---

### MNT-007 — Inconsistent naming and code style

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Full-Stack Engineer
- **Effort:** 1–3

**Detect:** Mixed casing conventions in one language, the same concept named differently across
modules, abbreviations without a glossary, no formatter/linter config or one that is not enforced.

**Why it matters:** Search and refactoring become unreliable, and reviews spend time on style instead
of substance.

**Impact:** Improves readability and reduces review friction by making the codebase consistent and predictable to navigate.

**Fix:** Adopt a formatter and linter with the community default config, apply once across the
codebase, and enforce in CI.

---

### MNT-008 — No or minimal automated tests

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** QA Engineer
- **Effort:** 5–15

**Detect:** No test directory, tests that only assert `true`, coverage below ~20% on business logic,
no tests around the paths the assessment identified as risky.

**Why it matters:** Every change is manually verified or not verified at all, which is what makes
refactoring feel unsafe and keeps the other findings unfixed.

**Impact:** Enables safe refactoring and faster delivery by catching regressions automatically instead of relying on manual verification.

**Fix:** Start with the highest-risk business paths, not coverage percentage. Add a regression test
alongside each fix delivered in this roadmap.

---

### MNT-009 — Type safety not used or bypassed

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** typed and gradually-typed languages
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Full-Stack Engineer
- **Effort:** 2–5

**Detect:** Widespread `any`/`object`/`dynamic`, `@ts-ignore`, `# type: ignore`, non-strict compiler
settings, casts used to silence the checker, or type hints present but never checked in CI.

**Why it matters:** The type system's guarantees evaporate exactly where the code is most complex.

**Impact:** Catches whole classes of defect at build time instead of runtime, improving reliability and making refactoring safer.

**Fix:** Enable strict mode, run the type checker in CI, and remove suppressions incrementally
starting at the boundaries where external data enters.

---

### MNT-010 — Hardcoded environment-specific paths and values

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Absolute OS paths (`C:\...`, `/Users/...`), platform-specific separators, hardcoded
hostnames, local ports, or a developer machine's directory layout in committed code.

**Why it matters:** The application only runs where it was written, blocking containerisation, CI and
cross-platform work.

**Impact:** Cross-platform compatibility for Linux containers, cloud app services, Docker and CI/CD environments. Easier infrastructure standardisation.

**Fix:** Use the platform path API, resolve paths relative to the application root, and take base
directories from configuration.

---

### MNT-011 — Copy-paste implementations with silent divergence

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Blocks of ≥20 near-identical lines in multiple files, endpoints created by copying a
sibling, near-duplicate components differing only in labels or field names.

**Why it matters:** Fixes land in one copy; the others keep the bug and nobody knows how many copies
exist.

**Impact:** Improves maintainability, reduces code duplication, simplifies testing, and accelerates future development.

**Fix:** Extract the common implementation, parameterise the differences, and delete the copies. Add
a duplication check to CI to hold the line.

---

### MNT-012 — No inline documentation for non-obvious logic

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Complex algorithms, regulatory calculations, workarounds and non-obvious ordering
constraints with no comment explaining *why*. Conversely, comments restating the code line by line.

**Why it matters:** The reasoning is lost with the author, so the next engineer either preserves a
mistake or removes a necessary safeguard.

**Impact:** Preserves the reasoning behind non-obvious decisions so future changes do not silently break required behaviour.

**Fix:** Comment the *why* — the constraint, the reference, the ticket. Delete comments that only
restate the code.

---

### MNT-013 — Inconsistent or absent code review and quality gates

- **Dimension:** maintainability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** Direct pushes to the main branch, PRs merged without review or with no required checks,
no branch protection, no definition of done.

**Why it matters:** Standards agreed in conversation are not applied consistently, so quality depends
on who happened to write the change.

**Impact:** Ensures every change meets the same quality bar by enforcing review and automated checks before merge.

**Fix:** Protect the main branch, require review plus passing checks, and keep the checklist short
enough to be honoured.

---

### MNT-014 — Excessive inline styling / presentation duplication

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** UI frameworks
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–3

**Detect:** Large inline style objects (`sx={{...}}`, `style={{...}}`) repeated across components,
colour and spacing values hardcoded instead of read from a theme, one-off overrides of design-system
components.

**Why it matters:** Visual consistency erodes and a design change becomes a manual sweep of every file.

**Impact:** Improves maintainability, reduces duplication, and ensures consistent UI styling across the application.

**Fix:** Move shared styling into theme tokens and reusable styled components; keep inline styles for
genuinely one-off, dynamic values only.

---

### MNT-015 — Static data structures redeclared inside render paths

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** UI frameworks
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 0.5–1

**Detect:** Constant arrays/objects (option lists, column definitions, config maps) declared inside a
component body so they are rebuilt on every render, then passed as props or dependencies.

**Why it matters:** A new object identity each render defeats memoisation and can trigger effect loops.

**Impact:** Reduces unnecessary memory allocation and improves rendering performance.

**Fix:** Hoist truly static structures to module scope; memoise those that depend on props.
