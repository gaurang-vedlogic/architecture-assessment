# Frontend — React & Next.js (`FE-REACT`)

Load with `frontend/_common.md` and `universal/*`.

---

### FE-REACT-001 — Effect dependency arrays wrong or missing

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** `useEffect` with an empty array while reading changing values; objects, arrays or inline
functions in the array causing a new identity every render; `eslint-disable` on the exhaustive-deps
rule; effects firing in a loop.

**Why it matters:** Either the effect uses stale values or it re-runs endlessly — both produce bugs
that look intermittent.

**Impact:** Removes stale-data and infinite-loop defects by making effect dependencies accurate, and eliminates the redundant network calls they cause.

**Fix:** Enable `exhaustive-deps` and satisfy it honestly — memoise the values rather than suppressing
the rule. Prefer a query library over effect-driven fetching.

---

### FE-REACT-002 — Missing memoisation on expensive derivations

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** Sorting, filtering, grouping or transforming a collection directly in the component body;
new object/array literals passed as props to memoised children; callbacks recreated each render and
passed into `React.memo` components.

**Why it matters:** The transform runs on every render regardless of whether its inputs changed, and
new identities defeat every downstream memo.

**Impact:** Reduces unnecessary computations, improves rendering performance, and optimizes component efficiency.

**Fix:** Wrap derivations in `useMemo` and stable callbacks in `useCallback` keyed on real inputs. Do
not memoise cheap work — measure first.

---

### FE-REACT-003 — No error boundaries

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** No component implementing `componentDidCatch`/`getDerivedStateFromError` and no
`react-error-boundary` usage; a render exception blanking the application.

**Why it matters:** React unmounts the entire tree on an uncaught render error — one bad row destroys
the whole page.

**Impact:** Component failures are contained — the rest of the app stays functional. Users see a helpful error screen instead of a blank page, and errors are captured for investigation.

**Fix:** Wrap every route and page-level component in an error boundary with a fallback and a reset
action, reporting captured errors to the monitoring service.

---

### FE-REACT-004 — Static values redeclared inside components

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 0.5

**Detect:** Constant arrays/objects (option lists, column definitions, config maps) declared in the
component body and then used as props or effect dependencies.

**Why it matters:** A fresh identity on every render defeats memoisation and can trigger effect loops.

**Impact:** Reduces unnecessary memory allocation and improves rendering performance.

**Fix:** Hoist truly static values to module scope; `useMemo` those that depend on props.

---

### FE-REACT-005 — Unused or derivable `useState`

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 0.5–1

**Detect:** State declared and never read; state mirroring a prop and synced by an effect; state
computable from other state with a plain expression.

**Why it matters:** Redundant state creates synchronisation bugs and extra renders.

**Impact:** Improves code maintainability, reduces unnecessary re-renders and memory usage, and makes components cleaner and easier to understand.

**Fix:** Delete unused state and derive values during render instead of storing and syncing them.

---

### FE-REACT-006 — Unstable list keys

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 0.5–1

**Detect:** `key={index}` on lists that reorder, filter or delete; keys generated with `Math.random()`
during render; no key at all.

**Why it matters:** React reuses the wrong DOM nodes — input values and component state attach to the
wrong rows after a reorder.

**Impact:** Ensures list items keep their identity through reordering and filtering, eliminating a class of state-attaches-to-wrong-row defects.

**Fix:** Key on a stable domain identifier. Index keys are acceptable only for static, never-reordered
lists.

---

### FE-REACT-007 — Context used for high-frequency state

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–3

**Detect:** A single large context holding frequently-changing values consumed across the tree; a new
object passed as the provider `value` on every render.

**Why it matters:** Every consumer re-renders on every change, however unrelated the changed field is.

**Impact:** Cuts unnecessary re-renders across the component tree by narrowing context scope and stabilising provider values.

**Fix:** Split context by update frequency, memoise the provider value, or move high-frequency state
into a store with selector-based subscriptions.

---

### FE-REACT-008 — Next.js: client/server boundary misused

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** Next.js App Router
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** `'use client'` at the top of nearly every file, pulling the whole tree client-side; server
secrets imported into client components; data fetched client-side where a server component would do;
route handlers used purely as a proxy to the app's own data layer.

**Why it matters:** The framework's main advantages are lost, bundles grow, and server-only values
risk crossing into the client.

**Impact:** Restores server-side rendering benefits — smaller client bundles, faster first paint, and server-only data kept off the client.

**Fix:** Keep components server-side by default, push `'use client'` to the leaves that genuinely need
interactivity, and fetch data in server components.

---

### FE-REACT-009 — Next.js: caching and revalidation not considered

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** Next.js
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** Every fetch marked `no-store` or `dynamic = 'force-dynamic'` to "fix" staleness; no
revalidation strategy; user-specific data cached at the route level.

**Why it matters:** Either everything is dynamic (losing all caching benefit) or user data leaks
between visitors through a shared cache.

**Impact:** Applies caching deliberately per route so static content is served fast while user-specific data stays correctly isolated.

**Fix:** Choose the caching mode per route based on data volatility and audience, using tag-based
revalidation on write instead of disabling caching wholesale.

---

### FE-REACT-010 — Direct DOM manipulation alongside React

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** React
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** `document.querySelector` then mutating styles or content; refs used to write into rendered
output; jQuery or a similar library operating on React-owned nodes.

**Why it matters:** React overwrites the changes on its next render, producing behaviour that depends
on render timing.

**Impact:** Eliminates timing-dependent UI bugs by keeping the DOM under a single owner.

**Fix:** Drive the DOM from state. Reserve refs for focus, measurement and integrating genuinely
non-React libraries, scoped to nodes React does not own.
