# Mobile — Common (`MOB`)

Load for any mobile application, alongside `universal/*`. Platform packs supplement this.

---

### MOB-001 — Secrets embedded in the app bundle

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** API keys, client secrets, signing keys or third-party credentials in source, resource
files, build config or `.env` bundled into the binary.

**Why it matters:** Any installed app can be decompiled in minutes — a shipped secret is a published
secret, and it cannot be rotated without a store release.

**Impact:** Removes credentials that ship to every device, eliminating a class of exposure that no app-store update can retroactively contain.

**Fix:** Keep secrets server-side behind an authenticated endpoint. Where a client key is unavoidable,
restrict it by bundle ID, referrer and quota, and rotate what has already shipped.

---

### MOB-002 — Sensitive data in insecure local storage

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** Tokens, credentials or personal data in `AsyncStorage`, `SharedPreferences`, `UserDefaults`,
plain SQLite or files; no Keychain/Keystore usage; caches containing personal data.

**Why it matters:** On a rooted or jailbroken device — and in some backup scenarios — this storage is
readable by other software.

**Impact:** Protects credentials and personal data at rest by moving them into platform-backed secure storage.

**Fix:** Store tokens and secrets in Keychain/Keystore with appropriate accessibility, encrypt local
databases holding personal data, and exclude sensitive files from backups.

---

### MOB-003 — No certificate validation or transport hardening

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–2

**Detect:** `NSAllowsArbitraryLoads`, `usesCleartextTraffic="true"`, custom trust managers accepting
all certificates, hostname verification disabled, plain HTTP endpoints.

**Why it matters:** Mobile devices routinely join untrusted networks, which is exactly where a
man-in-the-middle sits.

**Impact:** Ensures traffic is encrypted and authenticated on the untrusted networks mobile devices normally use.

**Fix:** Remove the bypasses, require HTTPS, and consider certificate pinning for the authentication
and payment paths.

---

### MOB-004 — No offline handling or request retry

- **Dimension:** maintainability
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Mobile Engineer
- **Effort:** 3–8

**Detect:** No connectivity detection; generic failures when offline; in-progress form input lost on
request failure; no queue for pending writes.

**Why it matters:** Intermittent connectivity is the normal condition for mobile use, not an edge case.

**Impact:** Keeps the app usable and preserves user input through connectivity loss, which is a routine condition on mobile.

**Fix:** Detect connectivity, cache reads for offline viewing, queue writes for retry on reconnect, and
show sync state clearly.

---

### MOB-005 — Excessive battery, network or memory use

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–5

**Detect:** Polling on a short timer instead of push; location updates at highest accuracy
continuously; full-resolution images loaded into lists; work continuing in the background with no
need; no image cache.

**Why it matters:** Battery drain and data use are among the most common reasons users uninstall an
app, and the platform may throttle the process.

**Impact:** Reduces battery and data consumption materially, improving retention and avoiding platform-imposed throttling.

**Fix:** Replace polling with push where possible, request the lowest sufficient location accuracy,
downsample images for display size, and stop background work when the app is not foregrounded.

---

### MOB-006 — No forced-upgrade or version-gating mechanism

- **Dimension:** architecture
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–3

**Detect:** No minimum-supported-version check on startup; unversioned API calls from clients that
cannot be forced to upgrade; no server-side kill switch for a broken release.

**Why it matters:** Old versions live on devices indefinitely, so the API can never drop anything and a
broken release cannot be stopped.

**Impact:** Gives the team a way to retire old clients and stop a bad release, decoupling backend evolution from user upgrade behaviour.

**Fix:** Check a server-provided minimum version at startup with a clear upgrade prompt, and version
the API so old clients keep working during the transition.

---

### MOB-007 — Crash reporting and analytics absent

- **Dimension:** observability
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–2

**Detect:** No crash reporting SDK; no non-fatal error reporting; no visibility into crash-free session
rate per version.

**Why it matters:** Crashes on a user's device are invisible unless they leave a review, and store
console data is too coarse to act on.

**Impact:** Surfaces device-side crashes with symbolicated stacks and version breakdown, turning invisible failures into fixable defects.

**Fix:** Integrate crash reporting with symbol upload in the release pipeline, report handled errors as
non-fatals, and monitor crash-free rate per release.

---

### MOB-008 — Permissions requested broadly or without context

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** all mobile platforms
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** All permissions requested at first launch; permissions declared but unused; background
location or contacts requested without a clear feature need; no graceful degradation on denial.

**Why it matters:** Users deny permissions asked without context, and unjustified permissions trigger
store review rejections.

**Impact:** Improves permission grant rates and store-review outcomes by requesting access only where the feature needs it.

**Fix:** Request each permission in context at the point of use with an explanation, remove unused
declarations, and handle denial without breaking the app.
