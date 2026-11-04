# Mobile — Android / Kotlin (`MOB-AND`)

Load with `mobile/_common.md` and `universal/*`.

---

### MOB-AND-001 — Context and lifecycle leaks

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** Android
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** Activity context held in a static field, singleton or long-lived object; inner classes and
handlers capturing the activity; listeners registered without a matching unregister; observers not
scoped to a lifecycle owner.

**Why it matters:** The activity and its whole view hierarchy stay in memory across every rotation and
navigation.

**Impact:** Prevents accumulation of destroyed activities in memory during normal use and configuration changes.

**Fix:** Hold application context in long-lived objects, scope observers to `viewLifecycleOwner`, and
unregister in the matching lifecycle callback.

---

### MOB-AND-002 — Coroutine scope and cancellation errors

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** Kotlin/Android
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** `GlobalScope.launch` in app code; coroutines launched without a lifecycle-aware scope;
blocking calls on `Dispatchers.Main`; `runBlocking` in production paths; no exception handler on
launched coroutines.

**Why it matters:** Work continues after the screen is gone, writing into destroyed views and holding
memory, and blocking calls freeze the UI.

**Impact:** Ties background work to the screen's lifecycle so it is cancelled correctly and never blocks the interface.

**Fix:** Use `viewModelScope`/`lifecycleScope`, choose the correct dispatcher for I/O, and attach a
`CoroutineExceptionHandler`.

---

### MOB-AND-003 — Configuration changes not handled

- **Dimension:** maintainability
- **Layer:** Mobile
- **Applies to:** Android
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–3

**Detect:** State held in activity or fragment fields; data refetched on every rotation;
`android:configChanges` used to suppress recreation rather than handle it; no `SavedStateHandle` for
process death.

**Why it matters:** Rotation and system-initiated process death lose user input and trigger redundant
network calls.

**Impact:** Preserves user state through rotation and process death while removing redundant refetches.

**Fix:** Hold state in a `ViewModel`, persist critical fields through `SavedStateHandle`, and let the
system recreate the UI normally.

---

### MOB-AND-004 — Insecure storage and exported components

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** Android
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** Tokens in plain `SharedPreferences`; `android:exported="true"` on activities, services or
receivers with no permission; `usesCleartextTraffic="true"`; `WebView` with JavaScript enabled loading
remote content or exposing a JS interface; unencrypted local databases.

**Why it matters:** Exported components let any installed app invoke internal functionality, and plain
preferences are readable on a rooted device.

**Impact:** Closes local attack paths from other installed apps and protects credentials at rest.

**Fix:** Use `EncryptedSharedPreferences` or Keystore for secrets, set `exported="false"` unless the
component is deliberately public and permission-guarded, and restrict WebView content and interfaces.
