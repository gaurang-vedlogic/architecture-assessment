# Mobile — Flutter (`MOB-FLU`)

Load with `mobile/_common.md` and `universal/*`.

---

### MOB-FLU-001 — Business logic in widgets

- **Dimension:** architecture
- **Layer:** Mobile
- **Applies to:** Flutter
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 3–5

**Detect:** HTTP calls and business rules inside `build()` or `initState()`; widget files over ~300
lines; no state-management layer (Bloc, Riverpod, Provider); `setState` driving application-wide state.

**Why it matters:** Logic cannot be tested without pumping widgets, and side effects run on every
rebuild.

**Impact:** Separates presentation from logic so business rules are testable and no longer re-execute on rebuild.

**Fix:** Move data access and rules into repositories and a state-management layer; keep widgets
declarative.

---

### MOB-FLU-002 — Expensive work in `build()`

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** Flutter
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** Sorting, filtering, JSON decoding, image decoding or object construction inside `build()`;
`const` constructors unused; `ListView` with a children list instead of `ListView.builder`.

**Why it matters:** `build()` runs on every frame during animation and scrolling — anything expensive
there drops frames.

**Impact:** Restores smooth frame rates by keeping per-frame work minimal and rebuilding only what changed.

**Fix:** Hoist computation out of `build()`, use `const` widgets aggressively, adopt builder
constructors for lists, and move heavy parsing to an isolate via `compute`.

---

### MOB-FLU-003 — Controllers and streams not disposed

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** Flutter
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–2

**Detect:** `AnimationController`, `TextEditingController`, `ScrollController`, `StreamSubscription` or
`Timer` created without a corresponding `dispose()`/`cancel()`.

**Why it matters:** Listeners keep firing against disposed widgets and memory is never reclaimed as the
user navigates.

**Impact:** Prevents memory growth and callbacks against disposed widgets during normal navigation.

**Fix:** Cancel and dispose everything created in `initState` within `dispose`; enable the analyzer
rules that detect undisposed controllers.

---

### MOB-FLU-004 — Null safety and error handling gaps

- **Dimension:** maintainability
- **Layer:** Mobile
- **Applies to:** Flutter/Dart
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** Widespread `!` assertions on nullable values; `dynamic` on API responses; `catch (e)`
swallowing errors; no `FlutterError.onError` or zone-level guard; `late` used to defer initialisation
that may never happen.

**Why it matters:** Null assertion failures are among the most common Flutter crashes, and swallowed
errors leave no trace.

**Impact:** Converts a common crash class into compile-time and handled cases, and ensures failures are reported rather than silently lost.

**Fix:** Model nullability honestly, parse API responses into typed models with validation, and route
framework and zone errors to crash reporting.

---

### MOB-FLU-005 — Platform channel and native integration risk

- **Dimension:** maintainability
- **Layer:** Mobile
- **Applies to:** Flutter
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** Platform channel calls with no error handling or timeout; native code duplicated per
platform with diverging behaviour; unmaintained plugins for core functionality.

**Why it matters:** Native failures surface as unexplained hangs on one platform only.

**Impact:** Makes native integration failures visible and consistent across platforms instead of manifesting as platform-specific hangs.

**Fix:** Wrap channel calls with timeouts and typed error handling, keep platform behaviour aligned
behind one Dart interface, and replace unmaintained plugins.
