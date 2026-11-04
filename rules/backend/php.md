# Backend — PHP (`BE-PHP`)

Laravel, Symfony, plain PHP. Load with `backend/_common.md` and `universal/*`.

---

### BE-PHP-001 — Raw queries with interpolation

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** PHP
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 3–8

**Detect:** `DB::raw`, `whereRaw`, `selectRaw` or `mysqli_query` with request data concatenated in;
`$_GET`/`$_POST` reaching a query string directly.

**Why it matters:** Direct SQL injection from a public endpoint.

**Impact:** Improves database security by enforcing parameterised queries, preventing unauthorised query manipulation, and reducing risk of data breaches.

**Fix:** Use the query builder or bound parameters; where raw SQL is unavoidable, pass bindings as the
second argument and allow-list any dynamic identifiers.

---

### BE-PHP-002 — Mass assignment unguarded

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** Laravel, Symfony
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `$guarded = []` or `$fillable` covering privileged columns; `Model::create($request->all())`;
`$model->fill($request->all())`.

**Why it matters:** A caller adds `is_admin` to the payload and escalates.

**Impact:** Restricts writable attributes to those the operation intends, preventing privilege escalation through unexpected request fields.

**Fix:** Use `$request->validated()` from a form request and keep `$fillable` limited to genuinely
user-writable columns.

---

### BE-PHP-003 — Eloquent N+1 queries

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Laravel
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Relations accessed inside a loop or Blade template without `with()`; `all()` on large
tables; `count()` on a loaded collection instead of a database count.

**Why it matters:** One list view issues a query per row.

**Impact:** Improves query efficiency, reduces database overhead, and enhances API performance.

**Fix:** Eager-load with `with()`, use `chunk`/`cursor` for large sets, and enable strict lazy-loading
prevention in non-production environments.

---

### BE-PHP-004 — Environment and configuration exposure

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** PHP
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** `.env` committed or web-accessible; `APP_DEBUG=true` in production; the document root set
above `public/`; `env()` called outside config files (which breaks when config is cached).

**Why it matters:** A readable `.env` is complete credential disclosure; debug mode exposes stack
traces and configuration.

**Impact:** Removes credential and configuration exposure from the public surface and ensures debug output is confined to development.

**Fix:** Keep `.env` out of version control and the web root, set the document root to `public/`,
disable debug in production, and read configuration through `config()`.

---

### BE-PHP-005 — No queue for slow work

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** PHP
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 3–5

**Detect:** Email, PDF generation, imports and third-party calls performed inline in a request;
`sync` queue driver used in production; no worker process or supervisor.

**Why it matters:** Request duration is bound to the slowest external system, and PHP-FPM workers are
occupied waiting.

**Impact:** Frees request workers by moving slow operations to a background queue with retry and visibility.

**Fix:** Dispatch jobs to a real queue driver with supervised workers, retries and a failed-jobs table.
