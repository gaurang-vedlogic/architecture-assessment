# Universal — Observability & Monitoring (`OBS`)

Applies to every codebase. Load always.

---

### OBS-001 — No structured logging

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `print` / `console.log` / `Debug.WriteLine` used as the logging mechanism; free-text log
lines with values interpolated into a sentence; no log levels; no logger abstraction.

**Why it matters:** Logs cannot be filtered, aggregated or alerted on. Diagnosis becomes text search
across raw output.

**Impact:** Enables searchable, filterable diagnostics by emitting machine-readable log events instead of free-text, cutting the time needed to diagnose production issues.

**Fix:** Adopt a structured logger emitting JSON with consistent field names, levels and a timestamp.
Log events with fields, not sentences with values baked in.

---

### OBS-002 — Logs lack identifiers and context

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Log lines like `"Error occurred"` or `"Processing complete"` with no record ID, user ID,
tenant, operation name or duration. Exceptions logged without the stack or the input that caused them.

**Why it matters:** You can see that something failed but not what, for whom, or how often — so the
log answers no question worth asking.

**Impact:** Makes failures actionable by attaching the identifiers and parameters needed to reproduce and resolve them.

**Fix:** Attach a consistent context object (request ID, user/tenant, entity ID, operation) to every
log event, ideally via logger middleware so it cannot be forgotten.

---

### OBS-003 — No correlation/request ID across the call chain

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** any system with more than one component
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** No `X-Request-Id`/`traceparent` generated at the edge, not propagated to downstream calls,
not present in logs. Client errors that cannot be tied to a server log line.

**Why it matters:** A single user-reported failure cannot be traced through the services that handled
it, so investigation is guesswork.

**Impact:** Allows a single user request to be traced end to end across services, turning multi-hour investigations into direct lookups.

**Fix:** Generate or accept a correlation ID at the edge, put it in the logging context, propagate it
on every outbound call, and return it to the client in error responses.

---

### OBS-004 — No error tracking or alerting

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** No error-reporting service wired up (Sentry, Application Insights, Rollbar, CloudWatch
alarms); no alert on error rate, latency or availability; failures discovered when a user reports them.

**Why it matters:** Mean time to detection is measured in customer complaints.

**Impact:** Surfaces production failures the moment they occur rather than when a customer reports them, sharply reducing time to detection and resolution.

**Fix:** Wire an error tracker into the global handler on both client and server. Alert on
user-visible symptoms — error rate, latency, availability — not on individual log lines.

---

### OBS-005 — No health/readiness endpoint or platform probes

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** containerised or orchestrated services
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** No `/health`; or a health endpoint that only returns a static flag or "initialised" boolean
without touching dependencies; no liveness/readiness probes configured in the orchestrator.

**Why it matters:** The platform routes traffic to instances that cannot serve it, and a dependency
outage never triggers a restart or withdrawal.

**Impact:** Lets the platform detect and remove unhealthy instances automatically, turning dependency outages into contained, self-healing events.

**Fix:** Expose a shallow `/health` (process alive) and a deeper `/health/ready` that verifies critical
dependencies with a cheap query. Wire both to orchestrator probes with sensible thresholds.

---

### OBS-006 — No application metrics

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** No request rate/latency/error metrics, no queue depth, no business counters, no dashboard
answering "is it healthy right now?".

**Why it matters:** Capacity, regressions and slow degradations are invisible between incidents.

**Impact:** Provides continuous visibility into system health and capacity, so degradation is detected as a trend rather than as an outage.

**Fix:** Emit RED metrics (rate, errors, duration) per endpoint plus key business counters, and build
one dashboard that answers the health question at a glance.

---

### OBS-007 — No distributed tracing

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** multi-service systems
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 3–5

**Detect:** No OpenTelemetry or vendor tracing instrumentation; latency attributed to "the backend"
with no breakdown across services and database calls.

**Why it matters:** Latency problems cannot be localised, so optimisation is guided by guesswork.

**Impact:** Pinpoints exactly where request time is spent across services and dependencies, making performance work targeted instead of speculative.

**Fix:** Adopt OpenTelemetry auto-instrumentation at the edges first, exporting to whichever backend
the client already uses.

---

### OBS-008 — Unhandled rejection / uncaught exception guards missing

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** Node, Python, and other runtimes with process-level error events
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** No `process.on('unhandledRejection')` / `uncaughtException` handler; no equivalent global
excepthook; async errors that vanish with no log entry.

**Why it matters:** The process either dies silently or continues in an undefined state, and nothing
records why.

**Impact:** Ensures no failure disappears unrecorded by logging process-level errors before a controlled restart.

**Fix:** Register handlers that log with full context and then exit non-zero so the orchestrator
restarts cleanly. Do not swallow and continue.

---

### OBS-009 — No visibility into background jobs and scheduled work

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** systems with jobs, pipelines or schedules
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** Scheduled tasks or pipeline activities with no failure handling, no success/failure record,
no alert on non-execution, no retry state. A job that stops running is noticed weeks later.

**Why it matters:** Silent failure of a nightly job corrupts downstream data and reporting with no
signal until someone notices wrong numbers.

**Impact:** Improves pipeline reliability, enables proper error tracking and alerting, and ensures failed executions are handled gracefully without impacting downstream processes.

**Fix:** Record start/finish/outcome for every run, alert on failure *and* on missed schedule, and
make retries explicit with a dead-letter destination.

---

### OBS-010 — No log retention, aggregation or access policy

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Logs written to container filesystems and lost on restart; no central aggregation; no
retention policy; unrestricted access to logs containing personal data.

**Why it matters:** The evidence needed to investigate an incident is gone by the time you look, or
retained indefinitely in breach of policy.

**Impact:** Ensures diagnostic history survives restarts and is retained for the right period under controlled access, supporting both investigation and compliance.

**Fix:** Ship logs to a central store with a defined retention period per class, and restrict access
to logs containing personal data.
