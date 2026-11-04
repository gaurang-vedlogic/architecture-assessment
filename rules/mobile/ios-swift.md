# Mobile — iOS / Swift (`MOB-IOS`)

Load with `mobile/_common.md` and `universal/*`.

---

### MOB-IOS-001 — Retain cycles and memory leaks

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** iOS
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** Closures capturing `self` strongly without `[weak self]`; delegate properties declared
`strong`; Combine cancellables never stored or cancelled; `NotificationCenter` observers not removed.

**Why it matters:** View controllers are never deallocated, so memory grows with every navigation and
their observers keep firing.

**Impact:** Ensures screens are released when dismissed, keeping memory stable across long sessions.

**Fix:** Capture `self` weakly in escaping closures, declare delegates `weak`, store cancellables in a
set owned by the screen, and verify deallocation with the memory graph debugger.

---

### MOB-IOS-002 — Work on the main thread

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** iOS
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** Synchronous network or disk I/O on the main queue; large image decoding in
`cellForRowAt`; JSON parsing on the main actor; `DispatchQueue.main.sync`.

**Why it matters:** The UI freezes, and the watchdog terminates apps that block the main thread too
long at launch.

**Impact:** Keeps the interface responsive by moving I/O and decoding off the main thread.

**Fix:** Perform I/O and decoding on a background queue or in a detached task, and hop to the main
actor only to update UI.

---

### MOB-IOS-003 — Insecure storage and Keychain misuse

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** iOS
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** Tokens in `UserDefaults`; Keychain items stored with `kSecAttrAccessibleAlways`; sensitive
files not excluded from iCloud backup; no data protection class set.

**Why it matters:** `UserDefaults` is a plist readable from a backup, and permissive Keychain
accessibility survives device lock.

**Impact:** Protects credentials at rest with appropriate accessibility and keeps sensitive data out of backups.

**Fix:** Store secrets in Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, set the file
protection class on sensitive files, and exclude them from backup.

---

### MOB-IOS-004 — Force unwrapping and unhandled optionals

- **Dimension:** maintainability
- **Layer:** Mobile
- **Applies to:** iOS
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** `!` on optionals derived from network responses, JSON parsing or dictionary lookups; `try!`;
force casts on API data; implicitly unwrapped optionals outside outlets.

**Why it matters:** A missing field in an API response crashes the app immediately, on every device
that receives it.

**Impact:** Converts a leading crash cause into a handled case, improving crash-free session rate.

**Fix:** Decode with `Codable` into typed models, use `guard let`/`if let` at the boundary, and reserve
force unwrapping for genuinely impossible cases.
