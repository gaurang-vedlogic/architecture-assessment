# Mobile — React Native (`MOB-RN`)

Load with `mobile/_common.md`, `frontend/react.md` and `universal/*`.

---

### MOB-RN-001 — Non-virtualised long lists

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** React Native
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 1–3

**Detect:** `.map()` over a large array inside a `ScrollView`; `FlatList` without `keyExtractor` or with
inline `renderItem`; no `getItemLayout` on fixed-height rows.

**Why it matters:** Every row is mounted at once — scrolling stutters and memory grows with the dataset
on the least capable devices.

**Impact:** Keeps scrolling smooth and memory bounded regardless of list size, particularly on low-end devices.

**Fix:** Use `FlatList`/`FlashList` with a stable `keyExtractor`, a memoised `renderItem`, and
`getItemLayout` for fixed-height rows.

---

### MOB-RN-002 — Bridge-heavy work on the JS thread

- **Dimension:** scalability
- **Layer:** Mobile
- **Applies to:** React Native
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** Animations driven from JavaScript without `useNativeDriver`; large JSON parsed on the JS
thread; frequent small bridge calls in a loop; gesture handling in JS instead of Reanimated.

**Why it matters:** The UI thread waits on the JS thread — animations drop frames and touches feel
unresponsive.

**Impact:** Moves animation and gesture work off the JS thread, restoring consistent frame rates and responsive touch handling.

**Fix:** Use `useNativeDriver`, adopt Reanimated and Gesture Handler for interaction, and batch or move
heavy processing off the JS thread.

---

### MOB-RN-003 — Insecure storage via `AsyncStorage`

- **Dimension:** security
- **Layer:** Mobile
- **Applies to:** React Native
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Mobile Engineer
- **Effort:** 1–2

**Detect:** Auth tokens or personal data written to `AsyncStorage`, which is unencrypted on both
platforms.

**Why it matters:** Readable on a rooted or jailbroken device and in some backup paths.

**Impact:** Moves credentials into platform-backed secure storage, protecting them at rest.

**Fix:** Use Keychain/Keystore (`react-native-keychain`, `expo-secure-store`) for tokens and secrets,
and reserve `AsyncStorage` for non-sensitive preferences.

---

### MOB-RN-004 — Native dependency and version drift

- **Dimension:** devops
- **Layer:** Mobile
- **Applies to:** React Native
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Mobile Engineer
- **Effort:** 2–5

**Detect:** Native modules pinned to versions incompatible with the RN version; patches applied via
`patch-package` with no upstream path; iOS and Android native code diverging from the JS layer; an RN
version several majors behind.

**Why it matters:** Upgrades become all-or-nothing migrations, and security fixes in the framework
cannot be adopted.

**Impact:** Keeps the app upgradable so framework and platform security fixes can actually be adopted.

**Fix:** Align dependencies with the RN version, document and upstream patches, and upgrade on a
regular cadence rather than in large jumps.

---

### MOB-RN-005 — No release-channel or over-the-air update strategy

- **Dimension:** devops
- **Layer:** Mobile
- **Applies to:** React Native
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Mobile Engineer
- **Effort:** 2–4

**Detect:** No staged rollout, no OTA update mechanism, no way to roll back a bad JS bundle, source
maps not uploaded so crash reports are unreadable.

**Why it matters:** A defective release reaches every user and can only be fixed through a store review
cycle.

**Impact:** Enables staged rollout and fast rollback of JavaScript-level defects without waiting for store review.

**Fix:** Adopt staged rollout, add an OTA update path for JS-only fixes with rollback, and upload
source maps as part of the release pipeline.
