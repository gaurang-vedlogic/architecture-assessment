# Frontend — Angular (`FE-NG`)

Load with `frontend/_common.md` and `universal/*`.

---

### FE-NG-001 — Subscriptions never unsubscribed

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** Angular
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 2–3

**Detect:** `.subscribe()` in components with no `takeUntil`/`takeUntilDestroyed`, no `Subscription`
teardown in `ngOnDestroy`, and no `async` pipe. Common on route params, form value changes and
WebSocket streams.

**Why it matters:** Subscriptions accumulate across navigations; handlers keep running against
destroyed components and the memory is never reclaimed.

**Impact:** Prevents memory leaks and duplicated stream handlers as users navigate, keeping long-lived sessions stable.

**Fix:** Prefer the `async` pipe. Where manual subscription is required, terminate with
`takeUntilDestroyed()` or a destroy subject.

---

### FE-NG-002 — Default change detection with heavy templates

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** Angular
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** No `ChangeDetectionStrategy.OnPush` anywhere; method calls and pipe-less transforms bound
directly in templates; large lists rendered without `trackBy`.

**Why it matters:** Every template expression is re-evaluated on every change detection cycle, so
scrolling and typing become expensive.

**Impact:** Cuts rendering work substantially by re-evaluating only the components whose inputs actually changed.

**Fix:** Adopt `OnPush` with immutable inputs or signals, replace template method calls with pure
pipes or precomputed fields, and add `trackBy` to lists.

---

### FE-NG-003 — Business logic in components instead of services

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** Angular
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** `HttpClient` injected directly into components; validation, mapping and business rules in
component classes; components over ~300 lines.

**Why it matters:** Logic cannot be reused or tested without instantiating the component and its
template.

**Impact:** Improves code reusability, maintainability, and separation of concerns by centralizing logic in services, simplifying error management and making the frontend architecture more scalable.

**Fix:** Move HTTP access into feature services behind typed methods, and keep components concerned
with presentation and user interaction.

---

### FE-NG-004 — No HTTP interceptor for cross-cutting concerns

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** Angular
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** Auth headers attached manually at each call site; error handling repeated per request; no
central place for retry, correlation IDs or loading indication.

**Why it matters:** Adding token refresh or tracing means editing every call site and missing some.

**Impact:** Centralises authentication, error handling and telemetry for all HTTP traffic so cross-cutting changes are made once.

**Fix:** Implement interceptors for authentication, error normalisation and correlation, registered
once at bootstrap.

---

### FE-NG-005 — Modules not lazily loaded

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** Angular
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–3

**Detect:** All feature modules imported eagerly into the root module; no `loadChildren`/
`loadComponent` routes; a single large initial bundle.

**Why it matters:** Startup cost includes every feature, including those most users never open.

**Impact:** Reduces initial load time by deferring feature code until the route is actually visited.

**Fix:** Convert feature routes to lazy loading and move shared dependencies into a shared module or
standalone imports.

---

### FE-NG-006 — Untyped forms and `any` in templates

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** Angular
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** `FormGroup` without typed controls; `any` on API responses; `strictTemplates` disabled in
`tsconfig`; `$any()` used to silence template type errors.

**Why it matters:** The compiler cannot catch renamed fields or shape changes, so they surface at
runtime.

**Impact:** Catches shape mismatches at build time rather than runtime, improving reliability and making refactoring safer.

**Fix:** Enable strict templates, use typed reactive forms, and validate API responses at the boundary.
