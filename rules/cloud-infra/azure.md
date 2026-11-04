# Cloud & Infrastructure — Azure (`INF-AZ`)

Load with `cloud-infra/_common.md`.

---

### INF-AZ-001 — Key Vault accessed on every operation

- **Dimension:** scalability
- **Layer:** Infrastructure
- **Applies to:** Azure
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `SecretClient.GetSecret` / `get_secret` called inside a request handler, per connection, or
per database call rather than once at startup.

**Why it matters:** Key Vault is network-bound and rate-limited; at load these calls dominate latency
and then start throttling, taking the application down with them.

**Impact:** Reduces latency, avoids throttling, improves scalability, and lowers dependency on external secret fetch calls.

**Fix:** Cache secrets during application startup or preload them into configuration at boot, with a
refresh strategy that serves the cached value if refresh fails.

---

### INF-AZ-002 — Connection strings and keys instead of managed identity

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** Azure
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** SQL/Storage/Service Bus accessed with connection strings and account keys; client secrets in
app settings; shared access signatures with long or no expiry; no managed identity assigned.

**Why it matters:** Long-lived keys are copied, shared and rarely rotated, and each one is a standing
credential.

**Impact:** Replaces long-lived credentials with platform-managed identity, removing the rotation burden and the standing secret.

**Fix:** Enable system-assigned managed identity, grant scoped RBAC roles on each resource, and remove
key-based access paths.

---

### INF-AZ-003 — App Service / Functions configuration weaknesses

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** Azure App Service, Azure Functions
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** HTTPS-only disabled; minimum TLS below 1.2; FTP deployment enabled; remote debugging left
on; settings holding secrets in plaintext rather than Key Vault references; the Consumption plan used
for latency-sensitive workloads with cold-start impact unacknowledged.

**Why it matters:** These are one-toggle exposures that persist because nothing surfaces them.

**Impact:** Closes default-configuration exposures on the hosting platform with no application code change.

**Fix:** Enforce HTTPS-only and TLS 1.2+, disable FTP and remote debugging, use Key Vault references in
settings, and choose the hosting plan against the workload's latency requirements.

---

### INF-AZ-004 — Data Factory / pipeline activities without failure handling

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** Azure Data Factory, Synapse, Logic Apps
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 2–4

**Detect:** Pipeline activities with no failure path, no retry policy, no timeout and no alert; failures
visible only in the run history; no notification when a scheduled trigger stops firing.

**Why it matters:** A failed nightly pipeline silently corrupts downstream reporting for days.

**Impact:** Improves pipeline reliability, enables proper error tracking and alerting, and ensures failed executions are handled gracefully without impacting downstream processes.

**Fix:** Add failure dependencies with a notification activity, configure retry and timeout per
activity, and alert on both failed runs and missed schedules.

---

### INF-AZ-005 — Azure SQL connection configuration

- **Dimension:** security
- **Layer:** Database
- **Applies to:** Azure SQL
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** `TrustServerCertificate=True` or `Encrypt=False` in connection strings; `Max Pool Size`
unset; no `Connection Timeout`; firewall rule allowing all Azure services or all addresses; no retry
policy for transient faults.

**Why it matters:** Certificate bypass makes TLS decorative, and Azure SQL's transient faults become
user-visible errors without retry.

**Impact:** Improves transport security by enforcing proper certificate validation, and adds the connection resilience the platform's transient faults require.

**Fix:** Set `Encrypt=True` with certificate validation, size the pool explicitly, restrict the
firewall to private endpoints or known ranges, and enable transient-fault retry.

---

### INF-AZ-006 — No Azure Monitor / Application Insights instrumentation

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** Azure
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** No Application Insights connection; diagnostic settings not sending logs to a workspace; no
alert rules; no availability test; sampling misconfigured so failures are dropped.

**Why it matters:** The platform's diagnostics are free to enable and absent by default, so nothing is
recorded until someone turns them on.

**Impact:** Provides request, dependency and failure telemetry across the platform, making production behaviour visible without building custom tooling.

**Fix:** Enable Application Insights with dependency tracking, route diagnostic settings to a Log
Analytics workspace, and create alerts on failure rate, latency and availability.
