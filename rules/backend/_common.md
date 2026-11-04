# Backend — Common (`BE`)

Load for any backend service, alongside `universal/*`. Language packs supplement this.

---

### BE-001 — No layered structure (handler → service → repository)

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 5–10

**Detect:** Handlers containing SQL, business rules, external calls and response shaping. No service
or repository layer, or one that handlers routinely bypass.

**Why it matters:** Nothing is testable in isolation and logic is duplicated because it is not
reachable from elsewhere.

**Impact:** Adopting a layered architecture — route handlers → service layer → repository layer, each with a single responsibility — makes unit testing, mocking and future refactoring straightforward.

**Fix:** Introduce the layers for new work and extract incrementally, starting with the busiest and
riskiest handlers.

---

### BE-002 — Dependencies constructed rather than injected

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 3–5

**Detect:** Services instantiating their own database connections, HTTP clients or collaborators;
module-level singletons imported directly; no composition root.

**Why it matters:** The unit cannot be tested without its real dependencies, which is why it has no
tests.

**Impact:** Makes components independently testable and replaceable by supplying their dependencies rather than hard-wiring them.

**Fix:** Take dependencies as constructor or function parameters and wire them once at startup.

---

### BE-003 — No graceful shutdown

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** long-running services
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** No SIGTERM handler; the server closed without awaiting in-flight requests; connection
pools or consumers closed before the server stops accepting; no drain period.

**Why it matters:** Every deployment and every autoscale event drops requests that were mid-flight.

**Impact:** Eliminates dropped requests during deployments and scaling events by draining in-flight work before shutdown.

**Fix:** On SIGTERM stop accepting new work, await in-flight requests with a timeout, then close pools
and consumers in dependency order.

---

### BE-004 — Startup work performed lazily on the request path

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Configuration loading, secret fetching, schema creation, cache warming or migration checks
executed on first request or on every request instead of at boot.

**Why it matters:** The first user after each deploy pays the cost and may time out; a failure surfaces
as a request error rather than a failed startup.

**Impact:** Moves initialisation to startup so failures are caught before traffic arrives and no user pays the warm-up cost.

**Fix:** Perform initialisation during startup and fail fast if it does not succeed, so the platform
never routes traffic to an unready instance.

---

### BE-005 — No retry, circuit breaker or fallback on critical dependencies

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** services with external dependencies
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Single-attempt calls to flaky dependencies; unbounded retries with no backoff; no circuit
breaker; a downstream outage cascading into total failure.

**Why it matters:** Either transient blips become user-visible errors, or aggressive retries turn a
partial outage into a full one.

**Impact:** Contains downstream failures with bounded retries and circuit breaking, so a dependency outage degrades the service rather than taking it down.

**Fix:** Retry idempotent operations with exponential backoff and jitter, cap attempts, trip a circuit
breaker on sustained failure, and define the degraded behaviour explicitly.

---

### BE-006 — Background work tied to the process lifecycle

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 3–8

**Detect:** `setInterval`/timer-based schedulers inside the web process; fire-and-forget tasks started
in a request and abandoned; in-memory job state lost on restart; every instance running the same
scheduled job.

**Why it matters:** Work is duplicated across instances, lost on deploy, and invisible when it fails.

**Impact:** Makes background work durable and observable by moving it out of the request process into a queue with persistent state.

**Fix:** Move scheduled and deferred work to a queue with dedicated workers, leader election or a
platform scheduler, with persisted state and retries.

---

### BE-007 — Health of the service conflated with health of its dependencies

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** A single `/health` that queries every dependency (so one slow dependency restarts healthy
pods), or one that checks nothing (so broken instances keep serving).

**Why it matters:** Both extremes make the platform's automated recovery actively harmful.

**Impact:** Lets the platform restart genuinely unhealthy instances while withdrawing — not killing — those blocked on a dependency.

**Fix:** Split liveness (is the process alive) from readiness (can it serve), and check only the
dependencies that make serving impossible.

---

### BE-008 — Request context not propagated

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** User identity, tenant, correlation ID and cancellation token passed manually through call
chains or not at all; a deep function needing the current user and reaching for a global.

**Why it matters:** Either every signature grows a context parameter or the code reaches into globals,
which breaks under concurrency.

**Impact:** Makes identity, tracing and cancellation available throughout the call chain without threading them through every signature or resorting to globals.

**Fix:** Use the platform's request-scoped context (`AsyncLocalStorage`, `contextvars`, `HttpContext`,
`context.Context`) populated once by middleware.

---

### BE-009 — No API request/response logging on failure paths

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Failed requests logged as a bare stack trace with no route, status, duration, caller or
input identifiers; or everything logged including bodies and tokens.

**Why it matters:** Either you cannot reconstruct what failed, or you have created a compliance problem
while trying.

**Impact:** Makes failures diagnosable from logs alone while keeping sensitive values out of them.

**Fix:** Log one structured event per request with route, status, duration, correlation ID and caller;
include input identifiers but never bodies, credentials or personal data.

---

### BE-010 — Mass assignment from request to persistence model

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all backends
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Request bodies spread or bound directly onto entities (`Object.assign(entity, req.body)`,
`Model(**request.json)`, `TryUpdateModel`) with no field allow-list; entity fields such as `role`,
`isAdmin`, `tenantId`, `price` or `status` writable from the request.

**Why it matters:** A client adds one extra JSON field and escalates their own privileges or edits a
value the UI never exposed.

**Impact:** Restricts writable fields to those the operation intends, preventing privilege escalation and tampering through unexpected request properties.

**Fix:** Bind to an explicit input DTO listing only the writable fields, then map deliberately onto
the entity.
