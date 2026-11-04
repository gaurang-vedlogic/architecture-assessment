# Backend — .NET (`BE-NET`)

ASP.NET Core, EF Core. Load with `backend/_common.md` and `universal/*`.

---

### BE-NET-001 — Sync-over-async blocking

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** ASP.NET Core
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` on async calls; `async void` outside
event handlers; synchronous I/O in async controller actions.

**Why it matters:** Thread-pool starvation under load, and in some contexts outright deadlock.

**Impact:** Restores proper asynchronous throughput and removes deadlock risk under concurrent load.

**Fix:** Make the call chain async end to end and return `Task`. Enable analyzers that flag
sync-over-async.

---

### BE-NET-002 — Incorrect service lifetimes

- **Dimension:** architecture
- **Layer:** Backend
- **Applies to:** ASP.NET Core DI
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** A scoped service (notably `DbContext`) injected into a singleton; `DbContext` registered
as singleton; `IHttpContextAccessor` captured in a singleton; state held on a singleton service.

**Why it matters:** A captured scoped dependency is shared across all requests, producing
cross-request data corruption and `DbContext` concurrency exceptions.

**Impact:** Eliminates cross-request state corruption by ensuring each dependency lives exactly as long as it should.

**Fix:** Register `DbContext` as scoped, never inject scoped into singleton, and resolve from a scope
factory where a singleton genuinely needs per-operation dependencies.

---

### BE-NET-003 — `HttpClient` misuse

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** .NET
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `new HttpClient()` per request or inside a `using`; no `IHttpClientFactory`; no timeout or
resilience policy configured.

**Why it matters:** Socket exhaustion under load, and stale DNS on long-lived static clients.

**Impact:** Reduces latency and prevents socket exhaustion through pooled, correctly-configured HTTP clients.

**Fix:** Register typed clients through `IHttpClientFactory` with timeout and resilience policies
configured centrally.

---

### BE-NET-004 — EF Core query performance defaults

- **Dimension:** scalability
- **Layer:** Backend
- **Applies to:** EF Core
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Navigation properties accessed in a loop with no `Include`; `ToList()` before filtering
(client-side evaluation); no `AsNoTracking()` on read-only queries; `Count()` used where `Any()` would
do; no `AsSplitQuery` on multi-collection includes.

**Why it matters:** Query count and memory grow with the result set, and change tracking on read paths
costs time and allocations for nothing.

**Impact:** Improves query efficiency, reduces database overhead, and enhances API performance.

**Fix:** Project to DTOs with `Select`, add `AsNoTracking` to read queries, include what you need
explicitly, and verify the generated SQL on hot paths.

---

### BE-NET-005 — Model binding without an input DTO

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** ASP.NET Core
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Actions binding directly to EF entities; `TryUpdateModel` with no property list; entities
with `Role`, `IsAdmin`, `TenantId` or `Price` writable from the request; `[ApiController]` validation
suppressed.

**Why it matters:** One extra JSON property lets a caller write a field the UI never exposed.

**Impact:** Restricts writable fields to those the operation intends, preventing privilege escalation and tampering through unexpected request properties.

**Fix:** Bind to request DTOs with data annotations or FluentValidation, then map explicitly to
entities.

---

### BE-NET-006 — Exception handling and error responses

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** ASP.NET Core
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `try/catch` in every action returning inconsistent shapes; developer exception page enabled
outside development; no `ProblemDetails`; exceptions swallowed and a 200 returned.

**Why it matters:** Clients get a different error contract per endpoint, and stack traces leak
internal structure.

**Impact:** Gives clients one predictable error contract and stops internal detail from reaching them.

**Fix:** Use exception-handling middleware returning `ProblemDetails`, map domain exceptions to status
codes centrally, and confine the developer page to development.

---

### BE-NET-007 — Configuration and secrets handling

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** .NET
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** Connection strings and keys in committed `appsettings.json`; `TrustServerCertificate=True`;
`Encrypt=False`; secrets in environment-specific settings files tracked in git.

**Why it matters:** Repository access equals production database access, and disabled certificate
validation makes TLS decorative.

**Impact:** Removes credentials from source control and enforces validated, encrypted database connections.

**Fix:** Source secrets from Key Vault or the environment via the options pattern, remove certificate
bypasses, and rotate anything already committed.

---

### BE-NET-008 — Nullable reference types disabled

- **Dimension:** maintainability
- **Layer:** Backend
- **Applies to:** .NET 6+
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** `<Nullable>disable</Nullable>`; `!` null-forgiving operators used to silence warnings;
warnings not treated as errors in CI.

**Why it matters:** The compiler cannot warn about the most common runtime exception in the platform.

**Impact:** Surfaces potential null dereferences at compile time rather than as production exceptions.

**Fix:** Enable nullable reference types, fix warnings incrementally starting at the API boundary, and
treat them as errors in CI once clean.
