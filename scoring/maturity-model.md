# Maturity Model — 0 to 5

Every dimension is scored `0.0`–`5.0` in `0.5` steps, with a maturity label. The label is derived
from the score, never chosen independently:

| Score | Label | Meaning |
| --- | --- | --- |
| 0.0 – 0.9 | **Absent** | The practice does not exist. Nothing to build on. |
| 1.0 – 1.9 | **Initial** | Ad-hoc and inconsistent. Works by individual effort, not by design. Active risk present. |
| 2.0 – 2.9 | **Developing** | Patterns exist but are applied unevenly. Known gaps, no systemic enforcement. |
| 3.0 – 3.9 | **Defined** | Documented, consistently applied across most of the codebase. Gaps are edge cases. |
| 4.0 – 4.9 | **Managed** | Enforced automatically (gates, tooling, tests). Measured and reviewed. |
| 5.0 | **Optimising** | Continuously improved with feedback loops and data. Industry-leading. |

`0.0` is a legitimate score and means *we found no evidence of this practice at all* — e.g. no CI
pipeline of any kind gives DevOps Maturity `0.0`. Do not use `0.0` to mean "not assessed"; if a
dimension truly could not be assessed, score your best estimate and say so in `keyGap`.

## Scoring procedure

Start every dimension at **3.0** and move from there. Do not average finding counts — judge the
dimension, then sanity-check against the findings.

**Subtract:**

| Condition | Adjustment |
| --- | --- |
| Each P0 finding in this dimension | −0.5 (max −2.0 from P0s) |
| Each P1 finding in this dimension | −0.25 (max −1.5 from P1s) |
| P2 findings only, ≥5 of them | −0.5 |
| The gap is *systemic* (same defect repeated across most files/modules) | −0.5 extra, once |
| No enforcement mechanism exists (no linter/test/gate that would catch it) | −0.5 |

**Add:**

| Condition | Adjustment |
| --- | --- |
| Practice is consistently applied and visibly deliberate | +0.5 |
| Automated enforcement exists and passes (CI gate, test suite, scanner) | +0.5 |
| Measured in production (dashboards, SLOs, alert coverage) | +0.5 |

Clamp to `[0, 5]`, round to the nearest `0.5`.

## Per-dimension rubrics

Use these to sanity-check the number you landed on.

### Architecture Quality

| Score | Looks like |
| --- | --- |
| 1 | One file does everything. Business logic inside route handlers/controllers/components. Copy-paste across modules. |
| 2 | Some folders suggest layers but boundaries leak. Shared logic duplicated rather than extracted. Magic values inline. |
| 3 | Clear layering (handler → service → repository, or equivalent). Shared code lives in shared modules. Occasional leaks. |
| 4 | Boundaries enforced (module rules, dependency lint, package structure). Domain model distinct from transport and storage. |
| 5 | Architecture documented, tested against (fitness functions/ArchUnit-style), and evolves deliberately. |

### Security Posture

| Score | Looks like |
| --- | --- |
| 1 | Secrets in source. Injection reachable. No input validation. Tokens in `localStorage`. Certificate validation disabled. |
| 2 | Auth exists but authorisation is inconsistent. Some validation. Secrets partly externalised. Known unpatched CVEs. |
| 3 | Secrets in a vault/env. Parameterised queries throughout. Validation at the boundary. HTTPS enforced. |
| 4 | Automated scanning in CI (SAST/dependency/secret). Least privilege applied. Security tests exist. |
| 5 | Threat-modelled, pen-tested, with a patch SLA and audited access paths. |

### Scalability Readiness

| Score | Looks like |
| --- | --- |
| 1 | Blocking calls on the request path. Per-request resource creation. Full-table reads. No timeouts. Global mutable state. |
| 2 | Some pooling/caching but applied ad hoc. N+1 queries present. No load testing. |
| 3 | Stateless services, connection pooling configured, pagination in place, timeouts set. |
| 4 | Load-tested with known limits. Caching strategy deliberate. Horizontal scaling proven. Backpressure handled. |
| 5 | Capacity modelled, autoscaling tuned to real signals, degradation is graceful and rehearsed. |

### Code Maintainability

| Score | Looks like |
| --- | --- |
| 1 | 400+ line functions, dead code, no tests, inconsistent naming, no linter. |
| 2 | Linter present but not enforced. Sparse tests. Large files. Duplication tolerated. |
| 3 | Consistent style enforced, functions bounded, meaningful test coverage on core paths. |
| 4 | Coverage gates, complexity limits in CI, reviewed conventions, low duplication. |
| 5 | Refactoring is routine and safe. New engineers ship in days. |

### Observability & Monitoring

| Score | Looks like |
| --- | --- |
| 1 | `print`/`console.log` or nothing. No error reporting. Failures found by users. |
| 2 | Logging exists but unstructured, missing identifiers/context, no correlation across services. |
| 3 | Structured logs with levels and request IDs. Error tracking wired up. Basic dashboards. |
| 4 | Metrics + traces + logs correlated. Alerts tied to user-facing symptoms. On-call runbooks. |
| 5 | SLOs with error budgets driving decisions. |

### DevOps Maturity

| Score | Looks like |
| --- | --- |
| 1 | Manual deploys. No pipeline. Config edited on the server. No repeatable environments. |
| 2 | A build pipeline exists but deploys are partly manual. Environments drift. No IaC. |
| 3 | Automated build + deploy per environment. Config externalised. Rollback possible. |
| 4 | IaC for all environments. Quality gates block bad builds. Deploys are boring and frequent. |
| 5 | Progressive delivery, automated rollback on signal, full traceability from commit to production. |

### Data Integrity & DB Health

| Score | Looks like |
| --- | --- |
| 1 | No constraints or FKs. Delete-then-insert without a transaction. No migrations. No verified backup. |
| 2 | Some constraints. Migrations exist but are hand-run. Indexing reactive. Backups untested. |
| 3 | Constraints + FKs modelled. Versioned migrations in the pipeline. Indexes match query patterns. |
| 4 | Transaction boundaries deliberate, restore drills performed, retention and PII handling defined. |
| 5 | Data contracts enforced, lineage tracked, integrity monitored continuously. |

## Target scores

Every assessment also sets a `target` per dimension — the realistic 6–12 month goal, drawn on the
radar as the outer dashed ring. Guidance:

- Target **4.0** for `security` and `data` on any system holding customer or financial data.
- Target **4.0** for the dimensions the client's stated goals depend on.
- Target **3.5** as the default elsewhere.
- Never target `5.0` — it is not a realistic one-cycle goal and reads as padding.
- Target must be **≥ current**. A target below current is a scoring error.
