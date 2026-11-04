# Frontend — Vue & Nuxt (`FE-VUE`)

Load with `frontend/_common.md` and `universal/*`.

---

### FE-VUE-001 — Reactivity lost or misused

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** Vue 3
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** Destructuring a `reactive()` object (which breaks reactivity), missing `.value` on refs
outside templates, reassigning a `reactive` object rather than mutating it, `props` destructured
without `toRefs`.

**Why it matters:** The UI silently stops updating for some values — a bug that looks like a data
problem rather than a reactivity one.

**Impact:** Restores reliable UI updates by keeping reactive references intact, eliminating a class of "the data changed but the screen didn't" defects.

**Fix:** Prefer `ref` for primitives, use `toRefs`/`storeToRefs` when destructuring, and enable the
Vue ESLint rules that catch these.

---

### FE-VUE-002 — Watchers used where computed properties belong

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** Vue
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** `watch` handlers that only assign a derived value to another ref; chained watchers; deep
watchers on large objects.

**Why it matters:** Derived state updates a tick late and in an order that is hard to reason about;
deep watching large objects is expensive.

**Impact:** Makes derived values update synchronously and predictably while removing the cost of deep watching.

**Fix:** Use `computed` for anything derivable and reserve `watch` for side effects such as fetching
or persistence.

---

### FE-VUE-003 — `v-html` with untrusted content

- **Dimension:** security
- **Layer:** Frontend
- **Applies to:** Vue
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** `v-html` bound to API- or user-derived content with no sanitisation.

**Why it matters:** Script execution in the user's session — token theft and account takeover.

**Impact:** Eliminates script injection paths in the UI, protecting user sessions from malicious content.

**Fix:** Render as text; where HTML is required, sanitise with DOMPurify against a strict allow-list
and enforce a CSP.

---

### FE-VUE-004 — `v-if` and `v-for` on the same element

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** Vue
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 0.5

**Detect:** Both directives on one element, or `:key` missing/index-based on a `v-for` over a list that
reorders.

**Why it matters:** The filter is evaluated per item on every render, and unstable keys attach state
to the wrong rows.

**Impact:** Removes repeated per-item evaluation and keeps list item identity stable through reordering.

**Fix:** Filter in a `computed` and iterate the result; key on a stable domain identifier.

---

### FE-VUE-005 — Store used as a server cache

- **Dimension:** architecture
- **Layer:** Frontend
- **Applies to:** Vue with Pinia/Vuex
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 3–5

**Detect:** Store actions fetching API data into state with hand-written loading/error flags and manual
invalidation.

**Why it matters:** The store becomes a hand-rolled cache without deduplication, staleness handling or
retry.

**Impact:** Moves server data into a real query cache with deduplication and invalidation, leaving the store for genuine client state.

**Fix:** Use a query library for server data and reserve the store for UI and session state.

---

### FE-VUE-006 — Nuxt: server-only values leaking to the client

- **Dimension:** security
- **Layer:** Frontend
- **Applies to:** Nuxt
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** Secrets placed under `runtimeConfig.public`; server-only modules imported into universal
components; API keys used inside `useFetch` running on the client.

**Why it matters:** Everything under `public` is shipped to the browser.

**Impact:** Keeps privileged configuration server-side, preventing credential exposure through the client bundle.

**Fix:** Keep secrets in the private `runtimeConfig` and access them only in server routes; rotate
anything already exposed.
