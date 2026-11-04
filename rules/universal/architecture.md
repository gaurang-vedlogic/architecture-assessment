# Universal — Architecture Quality (`ARC`)

Applies to every codebase. Load always.

---

### ARC-001 — Handler has too many responsibilities

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 3–8 per handler cluster

**Detect:** A single route handler / controller action / component method that parses input, runs
business rules, builds queries, calls external services and formats the response. Look for handlers
over ~80 lines, or any function mixing SQL strings with HTTP status codes.

**Why it matters:** Nothing can be unit-tested in isolation, every change risks unrelated behaviour,
and the same logic gets re-implemented elsewhere because it is not reachable.

**Impact:** Improves maintainability, scalability, readability, and unit testability. Reduces coupling between layers.

**Fix:** Adopt handler → service → repository. The handler validates and maps; the service holds
business rules; the repository owns data access. Each layer testable on its own.

---

### ARC-002 — No shared/reusable module for common functionality

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Full-Stack Engineer
- **Effort:** 2–4

**Detect:** The same formatting, date handling, error mapping, permission check or API-calling code
appearing in three or more places with small variations. No `shared/`, `common/`, `lib/` or
equivalent, or one that exists but is bypassed.

**Why it matters:** Every bug must be fixed N times, and the variations silently diverge in behaviour.

**Impact:** Improves maintainability, reduces code duplication, simplifies testing, and accelerates future development.

**Fix:** Extract into a shared module with a single tested implementation, then migrate call sites.
Enforce with a lint rule or review checklist so duplication does not reappear.

---

### ARC-003 — Monolithic file containing unrelated concerns

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 5–10 (≈1 day per 300–400 tangled lines)

**Detect:** One file holding app bootstrap, database setup, business logic, queries and response
formatting. Files over ~800 lines. Files whose name is a noun but whose contents span the whole
system.

**Why it matters:** Merge conflicts on every change, no meaningful ownership boundary, and onboarding
requires reading the whole file to change one line.

**Impact:** Improved maintainability, cleaner architecture, easier onboarding for developers, better unit testing, and lower regression risk.

**Fix:** Split by concern into modules with explicit exports. Move bootstrap to an entry point,
persistence to repositories, and rules to services.

---

### ARC-004 — Business logic embedded in the presentation layer

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** all UI stacks
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** Pricing, eligibility, tax, permission or workflow rules computed inside components,
templates or view models — especially when the same rule also exists server-side.

**Why it matters:** The rule drifts between client and server, and it cannot be reused by another
client (mobile, API consumer, batch job).

**Impact:** Centralises business rules so behaviour stays consistent across clients and can be changed in one place without touching the UI.

**Fix:** Move rules to a service/domain layer — server-side where the rule is authoritative. The UI
consumes results, it does not derive them.

---

### ARC-005 — Missing service layer for outbound API calls

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** all clients calling HTTP APIs
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** `fetch` / `axios` / `HttpClient` called directly inside components, screens or handlers.
Base URLs, headers, auth attachment and error mapping repeated at each call site.

**Impact:** Improves code reusability, maintainability, and separation of concerns by centralizing API handling, simplifying error management, and making frontend architecture more scalable.

**Why it matters:** Cross-cutting changes (auth refresh, retry, tracing headers, base URL per
environment) require touching every call site.

**Fix:** Introduce a single API client with interceptors for auth, errors and telemetry, plus a
per-domain service module. Components call services, never the transport.

---

### ARC-006 — Hardcoded routes, endpoints and magic values

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Full-Stack Engineer
- **Effort:** 1–2

**Detect:** URL strings, route paths, status codes, retry counts, page sizes, timeouts and business
thresholds written inline at multiple call sites.

**Why it matters:** Renaming a route or tuning a limit becomes a codebase-wide grep with no
guarantee of completeness.

**Impact:** Improves maintainability, consistency, and scalability by centralizing route and configuration management, reducing duplication, and simplifying future updates across the application.

**Fix:** Define route and endpoint constants in one module; move tunable values to configuration.
Name every numeric literal that carries meaning.

---

### ARC-007 — Circular or inverted dependencies between modules

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Solution Architect
- **Effort:** 3–6

**Detect:** Module A imports B which imports A; a domain/service layer importing from controllers or
UI; repositories importing HTTP types; lazy imports added specifically to break a cycle.

**Why it matters:** Cycles defeat modular reasoning, break tree-shaking and lazy loading, and make it
impossible to extract or test a module independently.

**Impact:** Restores clear module boundaries so components can be understood, tested and extracted independently, and improves build and load performance.

**Fix:** Point dependencies inward toward the domain. Extract the shared piece into a lower-level
module, or invert with an interface. Add a dependency-cycle lint rule to CI.

---

### ARC-008 — No clear module or bounded-context boundaries

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** medium and large systems
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Solution Architect
- **Effort:** 3–5 (design), more to implement

**Detect:** Folder structure organised purely by technical type (`controllers/`, `models/`,
`utils/`) with no feature grouping; any feature change touching a dozen scattered files; a `utils`
folder that has become a dumping ground.

**Why it matters:** Change cost scales with system size instead of feature size, and no team can own a
slice cleanly.

**Impact:** Aligns the codebase with the business domain so features can be developed, tested and owned independently, reducing coordination cost as the system grows.

**Fix:** Group by feature/domain first, technical type second. Give each module an explicit public
surface and keep internals private.

---

### ARC-009 — Duplicate class, type or function definitions

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 0.5–2

**Detect:** The same class/interface/DTO defined in more than one file, or twice in the same file
where the later definition silently wins. Near-identical helper functions with different names.

**Why it matters:** Which definition is in effect depends on import order; a change to one is silently
ignored by callers of the other.

**Impact:** Reduces duplication, improves readability, and simplifies future modifications.

**Fix:** Keep one definition in a shared types/module file; delete the rest and update imports.

---

### ARC-010 — Synchronous request-response used for long-running or batch work

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Solution Architect
- **Effort:** 5–10

**Detect:** Report generation, bulk import/export, PDF rendering, email fan-out or data sync executed
inside an HTTP request. Manual concurrency over HTTP (fan-out of N parallel calls with a semaphore)
standing in for a job queue.

**Why it matters:** No retry state, no resume, no visibility into partial completion, and one failure
mid-batch leaves the system in an unknown state — plus request timeouts cap the work size.

**Impact:** Moves long-running work to a durable job queue with retry, resume and progress visibility, making batch operations reliable and freeing request threads for user traffic.

**Fix:** Introduce a queue and persistent workers (Celery, BullMQ, Hangfire, Service Bus, SQS).
Return a job ID immediately; expose status and results separately.

---

### ARC-011 — Configuration not externalised per environment

- **Dimension:** architecture
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Environment names, hostnames or feature switches decided by `if (env === 'prod')` blocks
scattered through code; config committed per environment in separate source files; values changed by
editing code and redeploying.

**Why it matters:** Promotion between environments becomes a code change, and the same artifact cannot
be shipped to every environment.

**Impact:** Enables one build artifact to run in every environment through externalised configuration, reducing deployment risk and eliminating environment-specific code paths.

**Fix:** Load configuration from environment/secret store at startup into a typed config object,
validated on boot. No environment conditionals in business code.

---

### ARC-012 — Tight coupling to a specific vendor or framework in the domain layer

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Solution Architect
- **Effort:** 3–8

**Detect:** Cloud SDK types, ORM entities or HTTP framework objects used as the domain model
throughout; business logic importing `Request`/`Response` or vendor client types directly.

**Why it matters:** Vendor or framework migration becomes a rewrite, and domain logic cannot be tested
without the vendor.

**Impact:** Isolates third-party dependencies behind interfaces so the core domain stays testable and vendor migrations become contained changes.

**Fix:** Define domain types and narrow interfaces (ports) for external systems; keep vendor SDK usage
in adapter implementations at the edge.

---

### ARC-013 — Inconsistent architectural patterns across the codebase

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Solution Architect
- **Effort:** 2–4 (documentation + alignment plan)

**Detect:** Two or more competing approaches to the same concern living side by side — e.g. some
features using a repository and others raw queries, two state-management approaches, two HTTP clients,
two error-handling conventions.

**Why it matters:** Engineers must learn every variant, reviews cannot rely on a standard, and shared
tooling can only cover a subset.

**Impact:** Establishes one consistent approach per concern so engineers can move between features confidently and tooling can be applied uniformly.

**Fix:** Choose one pattern per concern, document it as a lightweight ADR, and migrate incrementally
with new work following the target pattern.

---

### ARC-014 — Shared mutable global state

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Module-level mutable variables holding per-request data, singletons caching
request-scoped values, process-wide working-directory or locale changes, static collections written
at runtime.

**Why it matters:** Concurrent requests corrupt each other's data — a class of bug that is invisible
in development and intermittent in production.

**Impact:** Removes cross-request state corruption by scoping mutable data to the request, making behaviour correct and predictable under concurrent load.

**Fix:** Pass state explicitly or use a request-scoped context. Keep module-level state immutable.
Never mutate process-wide settings per request.

---

### ARC-015 — No documented architecture or decision record

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Solution Architect
- **Effort:** 2–4

**Detect:** No component diagram, no data flow description, no ADRs, README limited to install steps.
Design knowledge held by one or two individuals.

**Why it matters:** Every decision is re-litigated, onboarding is measured in months, and key-person
risk is unmanaged.

**Impact:** Reduces key-person risk and shortens onboarding by capturing the system's structure and the reasoning behind its key decisions.

**Fix:** Produce a one-page context/container diagram and a short ADR log for decisions already made.
Keep both in the repository next to the code.
