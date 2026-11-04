# Universal — Accessibility, UX & Resilience (`AX`)

Applies to any codebase with a user interface (web, mobile or desktop).

---

### AX-001 — No error boundary / global failure containment in the UI

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** component-based UI frameworks
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** No error boundary around routes or page-level components; a rendering exception blanking
the whole application; no fallback UI; UI errors never reaching the error tracker.

**Why it matters:** One failing component takes down the entire application, and the user sees a blank
page with no way forward.

**Impact:** Improves application stability, prevents full-page crashes, enhances user experience, and simplifies debugging.

**Fix:** Wrap each route and page-level component in an error boundary with a helpful fallback and a
recovery action, and report captured errors to the monitoring service.

---

### AX-002 — No handling for unknown routes

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** client-routed applications
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 0.5

**Detect:** No catch-all route; an unmatched URL rendering a blank page; deep links to removed pages
failing silently.

**Why it matters:** Users hitting a stale link get no feedback and no route back into the application.

**Impact:** Improves navigation experience, avoids blank screens, and provides clear feedback to users.

**Fix:** Add a catch-all route rendering a not-found page with navigation back to a known-good screen.

---

### AX-003 — No loading, empty or error states

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** all UIs
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 2–4

**Detect:** Screens rendering nothing while data loads; empty result sets shown as a blank area; failed
requests leaving stale or blank content with no message or retry.

**Why it matters:** The user cannot distinguish "loading", "nothing here" and "it broke", so the
application feels unreliable even when it is working.

**Impact:** Makes application state legible to users at all times, replacing ambiguous blank screens with clear feedback and a way forward.

**Fix:** Give every data-driven surface explicit loading, empty and error states, with a retry action
on the error state.

---

### AX-004 — Full-page reload used instead of targeted refresh

- **Dimension:** scalability
- **Layer:** Frontend
- **Applies to:** single-page applications
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Frontend Engineer
- **Effort:** 1–2

**Detect:** A refresh control calling `window.location.reload()` or remounting the application root;
one changed widget triggering a re-fetch of every query on the screen.

**Why it matters:** The user loses scroll position, filters and form state, and the server serves a
full page load to refresh one table.

**Impact:** Refreshes only the data that changed, preserving user context and removing unnecessary server load.

**Fix:** Invalidate the specific query keys the action affected and let the data layer refetch only
those.

---

### AX-005 — No client-side file type or size validation

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** UIs with file upload
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1

**Detect:** File inputs with no `accept` filter, no size check before upload, and no progress or
cancellation. Note: this complements — never replaces — server-side enforcement (`SEC-009`).

**Why it matters:** Users upload a large invalid file, wait, and then get a server rejection they
could have been told about instantly.

**Impact:** Improves user experience, reduces unnecessary server load, prevents invalid uploads early, and enhances overall application reliability.

**Fix:** Validate type and size before upload with a clear message, show progress, and allow
cancellation.

---

### AX-006 — Basic accessibility failures

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** web and mobile UIs
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 3–8

**Detect:** Images without alternative text, form inputs without associated labels, interactive
elements built from non-interactive tags without roles, insufficient colour contrast, focus not
visible, modals that do not trap focus, content reachable only by mouse.

**Why it matters:** The application is unusable for people relying on assistive technology, and in
many sectors this carries a legal obligation.

**Impact:** Makes the application usable with assistive technology and keyboard navigation, widening the user base and meeting accessibility obligations.

**Fix:** Fix labels, alternative text, semantic elements and contrast first — they resolve most
issues. Add an automated accessibility check to CI and test the critical journeys by keyboard.

---

### AX-007 — No offline or poor-connectivity handling

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** mobile and field-use applications
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Mobile Engineer
- **Effort:** 3–8

**Detect:** No connectivity detection, requests failing with a generic error offline, no retry on
reconnect, in-progress user input lost when a request fails.

**Why it matters:** Mobile and field users lose work on every tunnel, lift and dead spot.

**Impact:** Keeps the application usable and preserves user input through connectivity loss, which is the normal condition for mobile and field use.

**Fix:** Detect connectivity, queue mutations for retry on reconnect, cache read data for offline
viewing, and communicate sync state to the user.

---

### AX-008 — Inconsistent user-facing language or localisation

- **Dimension:** maintainability
- **Layer:** Frontend
- **Applies to:** localised applications
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** Hardcoded strings alongside a translation system; strings from a different language than
the product's locale (a fork artifact); server-side messages untranslated; dates, numbers and
currency formatted without locale awareness.

**Why it matters:** Users encounter a language they may not read, and the product looks unfinished.

**Impact:** Delivers consistent, correct-language content across the application, including messages originating server-side.

**Fix:** Move all user-facing strings into the translation catalogue, translate the incorrect-language
remnants, and format dates and numbers through locale-aware helpers.
