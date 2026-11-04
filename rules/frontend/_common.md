# Frontend — Common (`FE`)

Load for any web frontend, alongside `universal/*`. Framework packs supplement this.

---

### FE-001 — No centralised data-fetching layer

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** High | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** Every component fetching on mount with local `loading`/`error`/`data` state; the same
endpoint called from several components; no cache; refetch on every navigation.

**Why it matters:** Duplicate requests, inconsistent data between components showing the same thing,
and the same boilerplate re-implemented (usually with subtly different bugs) in every component.

**Impact:** Using a caching query layer, the same query key resolves to one cached result — zero duplicate network requests, across components and across page navigations.

**Fix:** Adopt a query library (React Query / SWR / Apollo / RTK Query / equivalent) providing caching,
deduplication, invalidation and retry. Migrate call sites incrementally, starting with the busiest
screens.

---

### FE-002 — Client-side request not cancelled on unmount

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** `fetch`/`axios` in an effect or lifecycle hook with no `AbortController`, no cleanup
return, no `takeUntil`; state set in a `.then()` after the component may have unmounted. Symptom:
"state update on unmounted component" warnings.

**Why it matters:** Responses arrive after navigation and write into a dead component, leaking memory
and occasionally overwriting fresh data with a stale response.

**Impact:** Prevents memory leaks, avoids framework warnings, improves application reliability, and reduces unnecessary API/state updates.

**Fix:** Abort in-flight requests on teardown, or let a query library own the lifecycle.

---

### FE-003 — Client-side state used for server state

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** A global store (Redux/NgRx/Vuex/Pinia) holding fetched API data with hand-written loading
and error flags and manual cache invalidation.

**Why it matters:** Half the store is a hand-rolled cache with none of the guarantees of a real one —
staleness, deduplication and invalidation all become application code.

**Impact:** Separates server cache from client state so freshness, deduplication and invalidation are handled by the data layer rather than reimplemented per feature.

**Fix:** Keep server data in a query cache; reserve the global store for genuine client state (UI
mode, selections, drafts).

---

### FE-004 — No schema validation on API responses

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** Responses cast to a TypeScript interface with no runtime check; optional chaining sprinkled
defensively; crashes on unexpected `null`; types hand-written and drifting from the API.

**Why it matters:** TypeScript types vanish at runtime — a changed API shape becomes an
`undefined is not a function` deep inside a render.

**Impact:** Prevents invalid data processing, reduces runtime errors, improves API reliability, and enhances type safety.

**Fix:** Validate responses at the boundary with a runtime schema (Zod/Yup/io-ts) and derive the
static type from it. Fail loudly at the edge with a useful message.

---

### FE-005 — Blocking the main thread with heavy work

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** Parsing or transforming large payloads synchronously, rendering thousands of rows without
virtualisation, base64 encoding large files, synchronous crypto or compression in the UI thread.

**Why it matters:** The tab freezes — no scrolling, no input, no feedback — and users assume the
application has crashed.

**Impact:** Improves frontend responsiveness, prevents browser freezing, and provides better download scalability using streaming and signed URLs.

**Fix:** Virtualise long lists, page the data server-side, move heavy computation to a Web Worker, and
hand large downloads to the browser via a signed URL rather than processing bytes in JavaScript.

---

### FE-006 — Environment configuration embedded in the bundle

- **Dimension:** security
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** API keys, client secrets, connection strings or admin endpoints in `.env` files bundled at
build time and shipped to the browser. Anything reaching the bundle is public — `NEXT_PUBLIC_`,
`VITE_`, `REACT_APP_` prefixes included.

**Why it matters:** "Hidden" frontend configuration is one View Source away.

**Impact:** Reduces security risk, prevents credential leakage, improves compliance, and enables safer deployments.

**Fix:** Keep only genuinely public values in the bundle. Move anything privileged behind a backend
endpoint that holds the credential server-side, and rotate whatever was exposed.

---

### FE-007 — No route-level code splitting

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** All routes statically imported into one bundle; admin/reporting screens loaded for every
user; charting or editor libraries in the initial chunk.

**Why it matters:** First paint waits for code that most users will never run.

**Impact:** Reduces initial load time by deferring each route's code until the user actually navigates to it.

**Fix:** Lazy-load routes and heavy components with a suspense fallback; prefetch on hover or intent.

---

### FE-008 — Form state and validation hand-rolled inconsistently

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** data-entry applications
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** One `useState` per field, validation logic duplicated per form, inconsistent error display,
no dirty/touched tracking, no unsaved-changes guard.

**Why it matters:** Every form behaves slightly differently, and validation drifts from the server's
rules.

**Impact:** Delivers consistent form behaviour and validation across the application while sharply reducing per-form code.

**Fix:** Adopt a form library bound to the same schema used for response validation, so client and
server share one definition.

---

### FE-009 — Design system bypassed with ad-hoc styling

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** applications using a component library
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–3

**Detect:** Hardcoded colours and spacing instead of theme tokens; large repeated inline style objects;
one-off overrides of library components; several visual variants of the same control.

**Why it matters:** Visual consistency erodes and any design change becomes a manual sweep.

**Impact:** Improves maintainability, reduces duplication, and ensures consistent UI styling across the application.

**Fix:** Extend the theme with the tokens the design actually needs, build shared styled wrappers, and
reserve inline styles for genuinely dynamic values.

---

### FE-010 — No frontend performance budget or measurement

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** all web frontends
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** No Lighthouse/Web Vitals measurement, no bundle size tracking in CI, no real-user
monitoring, performance regressions noticed only by users.

**Why it matters:** Bundle size and load time only ever grow when nothing measures them.

**Impact:** Makes frontend performance visible and enforceable, so regressions are caught in the pipeline rather than by users.

**Fix:** Track Core Web Vitals from real users, add a bundle-size check to CI with a budget, and fail
the build when the budget is exceeded.
