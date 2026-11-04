# Universal — Scalability Readiness & Performance (`PERF`)

Applies to every codebase. Load always.

---

### PERF-001 — N+1 query pattern

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** any stack with a datastore
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** A query inside a loop over the results of another query; ORM lazy-loading a relation
during iteration or serialisation; per-item API calls in a `map`/`forEach`.

**Why it matters:** Response time grows linearly with result size, so the endpoint that works with 10
rows falls over at 10,000.

**Impact:** Improves query efficiency, reduces database overhead, and enhances API performance.

**Fix:** Fetch related data in one query (join, `IN`, eager loading, `select_related`/`include`), or
batch the per-item calls. Add a query-count assertion to a test on the hot path.

---

### PERF-002 — Connection/engine/client created per request

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `create_engine`, `new Pool`, `MongoClient`, `HttpClient`, `new DbContext` or an SDK client
constructed inside a handler or per-call helper rather than once at startup.

**Why it matters:** Handshake, TLS negotiation and pool warm-up on every request; under load the
system exhausts sockets and ports rather than reusing them.

**Impact:** Reduces latency, improves throughput, optimizes connection pooling, and lowers resource consumption.

**Fix:** Create one instance at application startup and inject it. For HTTP clients use a single
long-lived, pooled instance per destination.

---

### PERF-003 — Missing or unconfigured connection pooling

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** Pool created with defaults and no `pool_size` / `max_overflow` / `Max Pool Size` /
`connectionLimit` / `pool_recycle` / `pool_pre_ping` set, or pooling explicitly disabled
(`NullPool`, `Pooling=false`).

**Why it matters:** Defaults rarely match the workload — too small and requests queue, too large and
the database refuses connections. No recycling means stale connections fail after an idle period.

**Impact:** Improves database scalability, optimizes connection reuse, reduces latency, and ensures stable application performance during concurrent traffic.

**Fix:** Size the pool against database limits and instance count, enable pre-ping/recycle, and set an
acquisition timeout so exhaustion fails fast instead of hanging.

---

### PERF-004 — Blocking work on the async event loop / request thread

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** async runtimes (Node, Python asyncio, .NET async, Kotlin coroutines)
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Synchronous file I/O, `subprocess.run`, `requests`/`urllib`, `Thread.sleep`,
`.Result`/`.Wait()`, `readFileSync`, or CPU-heavy loops inside an `async` function or request path.

**Why it matters:** One blocking call stalls every concurrent request on that worker — the throughput
loss is systemic, not local to the slow endpoint.

**Impact:** Real asynchronous processing improves concurrency, API responsiveness, and scalability. Better utilization of async architecture and reduced request bottlenecks.

**Fix:** Use async clients throughout, or offload blocking/CPU work to a thread pool or background
worker. Never mix `.Result`-style blocking into an async chain.

---

### PERF-005 — `async` declared but the implementation is synchronous

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** async runtimes
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** `async def` / `async` functions whose body contains no `await`, or whose only I/O is via
synchronous libraries.

**Why it matters:** The framework pays async overhead while getting none of the concurrency — the
system looks scalable and behaves like a blocking one.

**Impact:** Real asynchronous processing improves concurrency, API responsiveness, and scalability with better utilisation of the framework's async architecture.

**Fix:** Either make the I/O genuinely async, or declare the function synchronous so the framework can
schedule it on a worker thread appropriately.

---

### PERF-006 — No timeout on outbound calls

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** HTTP calls, database commands, cache operations, message publishes or subprocess
invocations with no timeout argument and no client-level default.

**Why it matters:** A hung dependency holds the connection and worker indefinitely, and the failure
propagates upstream as an unexplained outage.

**Impact:** Improved resilience and fault tolerance. Requests fail fast with controlled retry/error handling instead of hanging indefinitely.

**Fix:** Set connect and read timeouts on every client, budgeted so the total stays inside the
caller's own timeout. Pair with bounded retries and a circuit breaker on critical dependencies.

---

### PERF-007 — Unbounded query results / no pagination

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `SELECT *` with no `LIMIT`, `.all()` / `.find({})` / `.ToList()` on a growing table,
list endpoints with no page parameters, exports that materialise the full dataset in memory.

**Why it matters:** Memory and response size grow with the data, so the endpoint degrades silently
until it fails outright.

**Impact:** Keeps memory and response times bounded as data grows by paging results instead of loading entire tables per request.

**Fix:** Add server-side pagination (keyset preferred over offset for large tables), cap page size,
and stream large exports rather than buffering them.

---

### PERF-008 — Repeated expensive external calls without caching

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Secret-store lookups, configuration fetches, token acquisition, reference-data reads or
permission lookups executed on every request or every connection.

**Why it matters:** These calls are network-bound and rate-limited; at load they become the dominant
latency and eventually throttle, taking the application down with them.

**Impact:** Reduces latency, avoids throttling, improves scalability, and lowers dependency on external fetch calls.

**Fix:** Load at startup or cache with an appropriate TTL and refresh-ahead. Handle refresh failure by
serving the cached value rather than failing the request.

---

### PERF-009 — Missing or ineffective HTTP/data caching

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** No `Cache-Control`/`ETag` on cacheable responses, no CDN in front of static assets, no
application cache for hot read paths, or a cache with no invalidation strategy.

**Why it matters:** Every read costs full compute and database work even when the data has not changed.

**Impact:** Reduces server load and response times by serving repeat reads from cache, improving both user-perceived performance and infrastructure cost.

**Fix:** Set cache headers by resource volatility, put static assets behind a CDN with content
hashing, and cache hot read paths with explicit invalidation on write.

---

### PERF-010 — Duplicate/redundant network requests from the client

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** all clients
- **Criticality:** High | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** The same endpoint called by several components on one screen, refetched on every
navigation, or triggered repeatedly by an over-broad effect dependency. Confirm in the network panel.

**Why it matters:** Multiplied server load, slower screens, inconsistent data between components
showing the same thing.

**Impact:** Fewer redundant network requests, reduced server load, faster page renders, lower API costs, and consistent data state across components.

**Fix:** Adopt a caching data layer with request deduplication (React Query / SWR / Apollo /
equivalent) so the same key resolves to one in-flight request and one cached result.

---

### PERF-011 — Resource leak: handles, connections, listeners or subscriptions never released

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** `open()` without a context manager / `using` / `try-finally`; streams not closed on the
error path; event listeners, timers, watchers or subscriptions registered without a matching
unregister; database cursors left open.

**Why it matters:** Slow degradation that only shows in long-running production processes — file
descriptor exhaustion, connection pool starvation, unbounded memory growth.

**Impact:** Improved application stability and memory efficiency. Prevents file descriptor exhaustion during heavy workloads.

**Fix:** Use the language's scoped-resource construct everywhere. Pair every subscription with an
explicit teardown, and assert release on the error path too.

---

### PERF-012 — Event listener or hook registered repeatedly

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Listener registration (`event.listens_for`, `.on(...)`, middleware `use(...)`,
interceptor registration) inside a function that runs per request or per connection instead of once
at startup. Symptom: duplicated log lines that multiply over uptime.

**Why it matters:** Each call adds another handler; work per event grows without bound until memory
and CPU are consumed by duplicate handlers.

**Impact:** Single-time listener registration improves execution performance, prevents duplicate event triggers and logs, reduces memory overhead, and ensures stable behaviour in production.

**Fix:** Register once during application startup. If registration must be conditional, guard it with
an idempotency check and bind to the specific instance, not the class.

---

### PERF-013 — Recomputation of derived data on every render/call

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** UI frameworks and hot server paths
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** Sorting, filtering, grouping, mapping or date formatting over a collection performed
inline in a render/template path with no memoisation, running on every state change.

**Why it matters:** Interaction latency scales with data size; typing in a filter box re-processes the
whole dataset per keystroke.

**Impact:** Reduces unnecessary computations, improves rendering performance, and optimizes component efficiency.

**Fix:** Memoise the transform against its real inputs, or compute once where the data enters the
component tree. Move heavy transforms server-side where possible.

---

### PERF-014 — Large payloads processed entirely in memory

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 2
- **Role:** Full-Stack Engineer
- **Effort:** 2–4

**Detect:** Whole files read into a buffer/base64 before sending; entire result sets serialised to
JSON in one pass; document generation building the full output in memory; clients receiving multi-MB
responses and rendering them synchronously.

**Why it matters:** Memory scales with request size and concurrency; on the client the main thread
freezes and the tab becomes unresponsive.

**Impact:** Improves responsiveness, prevents browser freezing, and provides better download scalability using streaming and signed URLs.

**Fix:** Stream server-side. For downloads, issue a short-lived signed URL and let the client fetch
from storage directly rather than proxying bytes through the application.

---

### PERF-015 — Missing indexes for common query patterns

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 1–3

**Detect:** Columns used in `WHERE`, `JOIN`, `ORDER BY` or foreign keys with no index; full table
scans in query plans; sorting done in application code because the query is slow.

**Why it matters:** Query cost grows with table size rather than result size — the classic "it was
fast last year" failure.

**Impact:** Improves query response times and reduces database load by matching indexes to the access patterns the application actually uses.

**Fix:** Derive indexes from actual query plans, favouring composite indexes matching filter+sort
order. Remove unused indexes — they cost write throughput.

---

### PERF-016 — No frontend bundle optimisation

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** web applications
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** Single large bundle with no route-level code splitting, no lazy loading, heavy libraries
imported wholesale (`import _ from 'lodash'`), unoptimised images, no compression at the edge.

**Why it matters:** First load time is dominated by bytes the user does not need yet, hurting both
experience and conversion.

**Impact:** Reduces initial load time and bandwidth by shipping only the code and assets each route actually needs.

**Fix:** Split by route, lazy-load heavy components, import named members only, serve modern image
formats with correct sizing, and enable Brotli/gzip.

---

### PERF-017 — Manual memory management as a workaround

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** garbage-collected runtimes
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 3–8

**Detect:** Explicit `gc.collect()`, `GC.Collect()`, `System.gc()` in request handlers; heap-size
flags raised to stop crashes; periodic process restarts scheduled to reclaim memory.

**Why it matters:** These are symptoms of retained references or oversized in-memory working sets;
the workaround hides the leak while adding pause time.

**Impact:** Improves application stability and performance by resolving the underlying memory inefficiencies through better architecture and object handling.

**Fix:** Profile to find the retained objects, then stream or paginate the oversized working set and
release references. Remove the manual collection once the root cause is fixed.

---

### PERF-018 — No load or performance testing

- **Dimension:** scalability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** QA Engineer
- **Effort:** 3–5

**Detect:** No load test scripts, no documented capacity limits, no latency budgets or SLOs, no
performance regression check in the pipeline.

**Why it matters:** Capacity is discovered during an incident rather than in a test, and performance
regressions ship unnoticed.

**Impact:** Establishes known capacity limits and catches performance regressions before release rather than in production.

**Fix:** Script the critical journeys, set latency and throughput targets, run before major releases,
and record the results so trends are visible.

---

### PERF-019 — Concurrency-unsafe process-wide operations

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `os.chdir()`, changing process environment variables, writing to a fixed temp filename,
mutating global locale/culture, or any per-request use of a process-global setting.

**Why it matters:** Under concurrency, requests overwrite each other's state — producing wrong output
for a user with no error raised anywhere.

**Impact:** Removes race conditions under concurrent load, ensuring each request produces correct, isolated results regardless of traffic volume.

**Fix:** Use absolute paths and per-request temporary directories with unique names. Never mutate
process-global state to serve a request.

---

### PERF-020 — No backpressure or concurrency limits on expensive work

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Unbounded fan-out (`Promise.all` over an arbitrarily long list, `asyncio.gather` with no
semaphore), queues with no depth limit, workers scaling with input size rather than a fixed pool.

**Why it matters:** A large input becomes a self-inflicted denial of service against your own
database or a downstream API.

**Impact:** Keeps resource consumption predictable under load by bounding parallel work, protecting both the application and its downstream dependencies.

**Fix:** Bound concurrency with a fixed-size worker pool or semaphore, apply queue depth limits, and
shed or defer load when limits are reached.
