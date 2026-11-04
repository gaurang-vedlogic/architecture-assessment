# Backend — Python (`BE-PY`)

FastAPI, Django, Flask. Load with `backend/_common.md` and `universal/*`.

---

### BE-PY-001 — Blocking calls inside `async def`

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** FastAPI, async Django, Starlette
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** `requests`, `time.sleep`, synchronous SQLAlchemy/psycopg2, `open()`, `subprocess.run`,
`pandas` operations or heavy loops inside `async def` handlers.

**Why it matters:** The blocking call stalls the whole event loop, so every concurrent request on the
worker waits.

**Impact:** Real asynchronous processing improves concurrency, API responsiveness, and scalability, with better utilisation of the framework's async architecture.

**Fix:** Use async clients (`httpx.AsyncClient`, async SQLAlchemy, `aiofiles`), or declare the handler
`def` so the framework runs it in a threadpool, or offload to `run_in_executor`.

---

### BE-PY-002 — SQLAlchemy engine or session mismanaged

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** SQLAlchemy
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `create_engine` called inside a request handler or helper; sessions created without being
closed; no `pool_size`/`max_overflow`/`pool_pre_ping`; a session shared across threads or requests.

**Why it matters:** Engine creation is expensive and pools cannot be reused, so connections are
exhausted under load.

**Impact:** Reduces latency, improves throughput, optimizes connection pooling, and lowers resource consumption.

**Fix:** Create one engine at application startup and reuse it; produce sessions per request through a
dependency that closes them; configure the pool explicitly.

---

### BE-PY-003 — SQLAlchemy event listener bound to the class or re-registered

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** SQLAlchemy
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `event.listens_for(...)` called inside a function that runs per request or per connection;
listeners registered on `Engine` (the class) rather than a specific engine instance.

**Why it matters:** Handlers accumulate on every call, and class-level registration fires for engines
that were never meant to be instrumented.

**Impact:** Single-time listener registration improves DB execution performance, prevents duplicate event triggers and logs, reduces memory overhead, and ensures stable behaviour in production.

**Fix:** Register listeners once at startup against the specific engine instance.

---

### BE-PY-004 — Django ORM performance defaults

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Django
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Related fields accessed in a loop or template without `select_related`/`prefetch_related`;
`.all()` on large tables; `len(queryset)` instead of `.count()`; `.exists()` never used; missing
`db_index` on filtered columns.

**Why it matters:** Lazy loading turns one list view into hundreds of queries.

**Impact:** Improves query efficiency, reduces database overhead, and enhances API performance.

**Fix:** Add `select_related`/`prefetch_related` to the querysets behind list and detail views, use
`only`/`defer` for wide tables, and add indexes matching the filters.

---

### BE-PY-005 — Pydantic/serializer validation bypassed

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** FastAPI, Django REST Framework
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Handlers taking `dict`/`Request` and reading `await request.json()` directly; `response_model`
omitted; DRF serializers not used for input; `model_construct`/`construct` used to skip validation.

**Why it matters:** The framework's validation is the trust boundary — bypassing it means there is none.

**Impact:** Prevents invalid data processing, reduces runtime errors, improves API reliability, and enhances type safety.

**Fix:** Declare typed request and response models on every endpoint and let the framework validate.

---

### BE-PY-006 — Unsafe deserialisation and dynamic evaluation

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** Python
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `pickle.loads`, `yaml.load` without `SafeLoader`, `eval`, `exec`, `os.system`,
`subprocess` with `shell=True` on request-derived data.

**Why it matters:** Each is arbitrary code execution on the application host.

**Impact:** Removes arbitrary code execution paths by replacing unsafe deserialisation and shell interpretation with data-only, argument-array alternatives.

**Fix:** Use JSON with a schema, `yaml.safe_load`, and pass subprocess arguments as a list without a
shell.

---

### BE-PY-007 — Mutable default arguments and module-level mutable state

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** Python
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `def f(items=[])` or `={}`; module-level dictionaries and lists mutated at runtime as
caches or accumulators.

**Why it matters:** The default is shared across every call for the process lifetime, and module-level
mutation is shared across concurrent requests.

**Impact:** Removes state that leaks between calls and requests, eliminating an intermittent class of wrong-data defects.

**Fix:** Default to `None` and construct inside the function; use a proper cache with bounds and
thread safety for shared state.

---

### BE-PY-008 — Environment and dependency management undefined

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** Python
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** `requirements.txt` with unpinned versions and no lockfile; no `pyproject.toml`; system
Python used directly; the Python version unpinned in the runtime image.

**Why it matters:** The dependency set resolves differently on each build, so builds are not
reproducible.

**Impact:** Makes Python builds deterministic and reproducible across developer machines, CI and production.

**Fix:** Adopt `pyproject.toml` with a lockfile (uv, Poetry or pip-tools), install from the lock in CI,
and pin the interpreter version in the image.

---

### BE-PY-009 — Manual garbage collection in request handlers

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Python
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 3–8

**Detect:** `gc.collect()` inside endpoints or after processing; worker memory limits raised
repeatedly; periodic restarts scheduled to reclaim memory.

**Why it matters:** These indicate retained references or oversized in-memory working sets; the
collection call adds pause time without fixing the cause.

**Impact:** Improves application stability and performance by resolving memory inefficiencies through better architecture and object handling.

**Fix:** Profile to find the retained objects, stream or paginate the large working set, then remove
the manual collection.
