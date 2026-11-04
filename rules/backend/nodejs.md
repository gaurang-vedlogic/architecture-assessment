# Backend — Node.js (`BE-NODE`)

Express, Fastify, NestJS, Koa. Load with `backend/_common.md` and `universal/*`.

---

### BE-NODE-001 — Async errors not caught by the framework

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** Express 4 and earlier
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `async` route handlers in Express 4 without a wrapper or `express-async-errors`; rejected
promises producing a hung request rather than a 500.

**Why it matters:** The request never completes — the client waits until timeout and no error handler
runs.

**Impact:** Ensures asynchronous failures reach the error handler and return a proper response instead of hanging the client.

**Fix:** Upgrade to Express 5 (which forwards async rejections) or wrap every async handler. Add a
global error middleware as the final backstop.

---

### BE-NODE-002 — Blocking the event loop

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Node
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** `readFileSync`, `execSync`, `crypto.pbkdf2Sync`, `JSON.parse` on multi-MB payloads,
synchronous compression or image processing, and long CPU loops in request handlers.

**Why it matters:** Node serves all concurrent requests on one thread — one blocking call stalls every
other request on that instance.

**Impact:** Restores concurrency by keeping the event loop free, so one expensive request no longer degrades every other request on the instance.

**Fix:** Use the async APIs, move CPU-heavy work to worker threads or a background service, and stream
large payloads instead of buffering.

---

### BE-NODE-003 — No process-level error guards

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** Node
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 0.5

**Detect:** No `process.on('unhandledRejection')` or `process.on('uncaughtException')` in application
code.

**Why it matters:** The process exits with no log, or continues in an undefined state — either way the
cause is unrecorded.

**Impact:** In-process backstop plus a structured log for otherwise-invisible asynchronous failures.

**Fix:** Register both handlers to log with full context and exit non-zero so the orchestrator restarts
cleanly.

---

### BE-NODE-004 — Middleware ordering and security defaults

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** Express, Koa
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Auth middleware registered after the routes it should protect; `helmet` absent; no body
size limit on `express.json()`; error middleware not last; CORS applied globally with defaults.

**Why it matters:** Ordering is silent — a route registered before the auth middleware is simply
public, with nothing to indicate it.

**Impact:** Guarantees every protected route is actually behind its guards and applies sensible security defaults across the service.

**Fix:** Register security middleware before routes, set an explicit JSON body limit, add `helmet`, and
keep the error handler last. Add a test asserting protected routes return 401 unauthenticated.

---

### BE-NODE-005 — Promises used unsafely

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** Node
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Missing `await` on a promise-returning call; `Promise.all` over an unbounded list;
`forEach` with an async callback (which does not await); floating promises with no `.catch`.

**Why it matters:** Operations appear to succeed while still running or already failed, and unbounded
parallelism overwhelms downstream systems.

**Impact:** Removes silent failures and unbounded fan-out by making asynchronous control flow explicit and bounded.

**Fix:** Enable `no-floating-promises` and `require-await` lint rules, use `for...of` with `await` for
sequential work, and bound concurrency with a pool.

---

### BE-NODE-006 — TypeScript configured loosely

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** TypeScript services
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** `strict: false`, `noImplicitAny: false`, widespread `any` on request bodies and query
results, `@ts-ignore` in business logic, type-check absent from CI.

**Why it matters:** The type system is disabled precisely where external data enters, which is where
it would help most.

**Impact:** Catches shape and null errors at build time rather than in production, and makes refactoring safe.

**Fix:** Enable strict mode, run `tsc --noEmit` in CI, and remove suppressions starting at the API and
database boundaries.

---

### BE-NODE-007 — Monorepo workspace boundaries not enforced

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** Turborepo/Nx/Yarn workspaces
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Solution Architect
- **Effort:** 2–4

**Detect:** Packages importing across workspace boundaries via relative paths; shared packages
depending on applications; no dependency-graph constraints; one package's build breaking another with
no declared dependency.

**Why it matters:** The monorepo's build graph stops reflecting reality, so caching and affected-only
builds become wrong.

**Impact:** Makes the dependency graph accurate and enforceable, restoring reliable incremental builds and clear package ownership.

**Fix:** Import across packages only through their declared entry points, and enforce allowed
dependency directions with a lint rule or workspace constraint.
