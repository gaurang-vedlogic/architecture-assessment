# Backend — Java & Kotlin (`BE-JAVA`)

Spring Boot, Jakarta EE, JPA/Hibernate. Load with `backend/_common.md` and `universal/*`.

---

### BE-JAVA-001 — JPA N+1 and lazy-loading defects

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** JPA/Hibernate
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `@OneToMany`/`@ManyToOne` accessed in a loop without a fetch join or entity graph;
`FetchType.EAGER` used to "fix" it (pulling the whole graph on every read);
`LazyInitializationException` outside the transaction; `open-in-view` left enabled.

**Why it matters:** One list endpoint issues hundreds of queries, or one read pulls an unbounded object
graph.

**Impact:** Improves query efficiency, reduces database overhead, and enhances API performance.

**Fix:** Keep associations lazy, fetch explicitly with join fetch or entity graphs per use case,
project to DTOs for reads, and disable `open-in-view`.

---

### BE-JAVA-002 — Entities exposed directly as API models

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** Spring Boot
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Controllers accepting and returning `@Entity` classes; `@RequestBody` bound to an entity;
sensitive fields serialised because they exist on the entity.

**Why it matters:** The persistence model becomes the public contract — mass assignment on the way in,
data exposure on the way out.

**Impact:** Separates the API contract from the persistence model, preventing both mass assignment and accidental data exposure.

**Fix:** Introduce request and response DTOs with explicit mapping, and validate inputs with Bean
Validation.

---

### BE-JAVA-003 — Transaction boundaries wrong

- **Dimension:** data
- **Layer:** Backend
- **Applies to:** Spring
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `@Transactional` on private methods or called via `this` (the proxy is bypassed, so no
transaction applies); `@Transactional` on controllers; long transactions spanning external HTTP calls;
`readOnly` never used.

**Why it matters:** The annotation silently does nothing in self-invocation, so multi-step writes are
not atomic despite appearing to be.

**Impact:** Guarantees multi-step writes are genuinely atomic and keeps transactions short enough not to exhaust the connection pool.

**Fix:** Annotate public service methods invoked through the proxy, keep external calls outside the
transaction, and mark read paths `readOnly`.

---

### BE-JAVA-004 — Spring Security misconfiguration

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** Spring Security
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `permitAll()` on broad path patterns; CSRF disabled on cookie-authenticated endpoints; no
method-level authorisation on service methods; `AntPathMatcher` patterns that do not match what the
author expected; actuator endpoints exposed without authentication.

**Why it matters:** One over-broad matcher makes a whole branch of the API public with nothing to
indicate it.

**Impact:** Ensures every endpoint is actually protected as intended, closing unintended public surfaces.

**Fix:** Deny by default and permit specific paths; add method-level `@PreAuthorize` on sensitive
services; secure actuator endpoints; add tests asserting 401/403 on protected routes.

---

### BE-JAVA-005 — Field injection and untestable components

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** Spring
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `@Autowired` on fields rather than constructors; components with many injected
dependencies; static utility classes holding state; `ApplicationContext` looked up manually.

**Why it matters:** Dependencies are invisible in the constructor and cannot be supplied in a test
without a Spring context.

**Impact:** Makes dependencies explicit and components unit-testable without booting the framework.

**Fix:** Use constructor injection, and treat a long parameter list as a signal to split the class.

---

### BE-JAVA-006 — Resource and thread-pool management

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** Java
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Streams, connections or readers not in try-with-resources; `Executors.newCachedThreadPool()`
for unbounded work; `new Thread()` per task; HikariCP pool left at defaults regardless of workload.

**Why it matters:** Leaked descriptors and unbounded thread creation degrade the process slowly until
it fails.

**Impact:** Keeps resource use bounded and predictable under load, preventing gradual degradation in long-running services.

**Fix:** Use try-with-resources everywhere, size thread pools deliberately with bounded queues, and
tune the connection pool against database limits.

---

### BE-JAVA-007 — Logging misconfigured

- **Dimension:** observability
- **Layer:** Backend
- **Applies to:** Java
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `System.out.println` in application code; string concatenation in log statements rather
than parameterised placeholders; no MDC correlation ID; stack traces logged and then rethrown, so each
failure appears several times.

**Why it matters:** Logs are unstructured, expensive to produce and duplicated, which makes them hard
to search.

**Impact:** Produces structured, correlated logs that can be filtered and traced, without the cost of unnecessary string building.

**Fix:** Use SLF4J with parameterised messages, populate MDC with a correlation ID in a filter, and log
each exception once at the boundary that handles it.
