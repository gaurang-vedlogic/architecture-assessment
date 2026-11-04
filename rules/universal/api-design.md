# Universal — API Design & Contracts (`API`)

Applies to any codebase exposing or consuming an API.

---

### API-001 — No response models or API documentation

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all HTTP/GraphQL/gRPC APIs
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Handlers returning ad-hoc dictionaries/objects; no `response_model`/DTO/schema; no
OpenAPI or equivalent spec; documented status codes absent; consumers reverse-engineering shapes from
network traces.

**Why it matters:** The contract is whatever the implementation happens to return today, so any
refactor is a silent breaking change.

**Impact:** Improves developer productivity and simplifies API integration and maintenance by making the contract explicit and machine-readable.

**Fix:** Declare response models and document status codes per endpoint; generate a spec from them so
documentation cannot drift from the implementation.

---

### API-002 — Incorrect HTTP semantics

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** HTTP APIs
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `200 OK` returned with an error body; failures signalled by a `success: false` field only;
`GET` used for state changes; `POST` used for every operation; `404` returned for permission failures
by accident rather than by design.

**Why it matters:** Clients, gateways, monitoring and retry logic all key on status codes; a 200 that
means failure is invisible to every one of them.

**Impact:** Improves API reliability and error transparency by returning accurate HTTP status codes, enabling proper client-side error handling, monitoring, and failure detection.

**Fix:** Map outcomes to correct status codes, use the appropriate method per operation, and return a
consistent structured error body alongside the status.

---

### API-003 — Inconsistent error response shape

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** all APIs
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** Errors returned variously as `{message}`, `{error}`, `{detail}`, a bare string, or an HTML
page depending on where the failure occurred. Framework default error pages leaking through.

**Why it matters:** Client error handling must special-case every endpoint, so most clients handle
none of it properly.

**Impact:** Gives clients one predictable error contract to handle, reducing integration effort and eliminating unhandled failure paths in the UI.

**Fix:** Define one error envelope (code, message, details, correlation ID) and return it from a
single global handler for every failure.

---

### API-004 — No API versioning strategy

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** APIs with external or mobile consumers
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Solution Architect
- **Effort:** 2–4

**Detect:** No version in the path, header or media type; breaking changes shipped in place; mobile
clients that cannot be forced to upgrade calling the same unversioned endpoints.

**Why it matters:** Any change risks breaking clients you cannot upgrade, so the API effectively
freezes or breaks users.

**Impact:** Allows the API to evolve without breaking existing clients, decoupling backend delivery from consumer upgrade cycles.

**Fix:** Introduce explicit versioning, define a deprecation policy with a support window, and add
new fields additively wherever possible.

---

### API-005 — Over-fetching and chatty endpoints

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all APIs
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Endpoints returning entire entity graphs where the screen needs three fields; a single
screen requiring many sequential round trips; no field selection or expansion parameters.

**Why it matters:** Bandwidth and latency scale with data the client discards — acutely painful on
mobile networks.

**Impact:** Reduces payload sizes and round trips so screens load faster, particularly on mobile and constrained networks.

**Fix:** Shape responses to consumer use cases, support field selection or expansion, and provide a
composite endpoint for screens that genuinely need several resources.

---

### API-006 — No idempotency on unsafe operations

- **Dimension:** data
- **Layer:** Backend
- **Applies to:** APIs performing payments, orders or other side-effecting operations
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `POST` endpoints creating records with no idempotency key; retries (client, gateway or
queue) able to produce duplicates; webhook receivers with no deduplication.

**Why it matters:** A network timeout followed by a retry silently creates a duplicate payment,
order or record.

**Impact:** Makes retries safe so network failures cannot produce duplicate transactions or records.

**Fix:** Accept an idempotency key on unsafe operations, persist the first result against it, and
return that result on replay. Deduplicate webhooks by event ID.

---

### API-007 — Frontend/backend contract not machine-checked

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** systems with a generated or shared client
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** Full-Stack Engineer
- **Effort:** 1–3

**Detect:** A generation pipeline (OpenAPI → client) that is broken, unwired, or run manually and
therefore stale; types hand-copied between frontend and backend; a spec generator pointing at a file
that does not exist.

**Why it matters:** The client's understanding of the API drifts from the server's without any build
failing, so breakage is discovered at runtime.

**Impact:** Restores a regenerable, machine-checked contract between client and server so shape changes break the build rather than production.

**Fix:** Repair or remove the generation step, run it in CI, and fail the build when the checked-in
client differs from the generated one.

---

### API-008 — Missing request/response size and complexity limits

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** all APIs
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** No body size limit; unbounded arrays accepted in a batch endpoint; GraphQL with no depth
or complexity limit; export endpoints with no cap.

**Why it matters:** One request can consume the memory or CPU of an entire instance.

**Impact:** Protects service availability by bounding what any single request can consume.

**Fix:** Set body size limits at the gateway and framework, cap batch sizes with a clear error, and
apply depth/complexity limits to graph APIs.

---

### API-009 — Breaking changes shipped without deprecation

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** APIs with external consumers
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Solution Architect
- **Effort:** 1–2

**Detect:** Fields renamed or removed in place; response types changed; required parameters added to
existing endpoints; no changelog and no deprecation headers.

**Why it matters:** Consumers break without warning and integration trust erodes.

**Impact:** Gives consumers a predictable migration path, preventing unplanned breakage and the support load that follows it.

**Fix:** Add before removing, mark deprecated fields in the spec and response headers, publish a
changelog, and remove only after the stated window.
