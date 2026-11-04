# Backend — Go (`BE-GO`)

Load with `backend/_common.md` and `universal/*`.

---

### BE-GO-001 — Errors ignored or discarded

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** Go
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `_ = someCall()`; errors returned but not checked; `panic` used for ordinary failures;
errors returned bare with no context (`return err`) so the stack is unreconstructable.

**Why it matters:** Failures pass silently and the eventual symptom appears far from the cause with no
trail back.

**Impact:** Makes failures visible and traceable to their origin instead of surfacing as unexplained downstream behaviour.

**Fix:** Check every error, wrap with `fmt.Errorf("...: %w", err)` to preserve the chain, and enable
`errcheck` in CI.

---

### BE-GO-002 — Goroutine leaks and unbounded concurrency

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Go
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `go func()` with no cancellation path; goroutines blocked forever on an unread channel; one
goroutine per request-derived item with no worker pool; `WaitGroup` never awaited.

**Why it matters:** Goroutines and their retained memory accumulate for the process lifetime, and a
large input becomes unbounded parallelism against a downstream system.

**Impact:** Keeps concurrency bounded and terminable, preventing gradual memory growth and self-inflicted overload of dependencies.

**Fix:** Pass `context.Context` into every goroutine and honour cancellation; use a fixed-size worker
pool or `errgroup.SetLimit` for fan-out.

---

### BE-GO-003 — Context not propagated or ignored

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Go
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `context.Background()` or `context.TODO()` inside request handling; database and HTTP calls
taking no context; deadlines never set.

**Why it matters:** Cancelling a client request does not stop the work it triggered, so abandoned work
keeps consuming capacity.

**Impact:** Ensures cancelled or timed-out requests actually stop their downstream work, freeing capacity immediately.

**Fix:** Thread the request context through every call, set deadlines at the boundary, and use the
`*Context` variants of database and HTTP APIs.

---

### BE-GO-004 — Resources not closed

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Go
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `resp.Body` not closed (or closed only on the success path); `sql.Rows` without
`defer rows.Close()`; `rows.Err()` never checked; files opened without `defer`.

**Why it matters:** Connections are never returned to the pool and descriptors leak until the process
fails.

**Impact:** Prevents connection and descriptor exhaustion in long-running services.

**Fix:** `defer Close()` immediately after acquiring the resource, on every path, and check `rows.Err()`
after iteration.

---

### BE-GO-005 — Data races on shared state

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Go
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Package-level maps or slices written from handlers without a mutex; struct fields mutated
concurrently; loop variables captured by goroutines (before Go 1.22); no `-race` in CI.

**Why it matters:** Concurrent map writes panic the process outright, and silent races corrupt data
intermittently.

**Impact:** Removes concurrent-access crashes and intermittent data corruption from shared state.

**Fix:** Guard shared state with a mutex or `sync.Map`, prefer passing values over sharing, and run
tests with `-race` in CI.
