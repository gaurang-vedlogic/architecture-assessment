# Effort Estimation

All estimates are **man-days** for one competent engineer already familiar with the stack, and
include implementation, self-test and code review. They do **not** include QA cycles, deployment
windows, or client sign-off.

Use halves (`0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `8`, `10`). Do not produce `2.75`.

## Base estimates by fix shape

| Fix shape | Typical | Notes |
| --- | --- | --- |
| Config / flag change, one place | **0.5** | Enable a timeout, set a pool size, flip a certificate flag |
| Delete dead code, remove unused state | **0.5 – 1** | Scale with number of call sites to verify |
| Move a hardcoded value to config/env/vault | **1** | Add ~0.5 if it needs pipeline + environment plumbing |
| Add validation to an endpoint or form | **1 – 2** | Per endpoint cluster, not per field |
| Add error handling / error boundary to a surface | **1 – 3** | 1 for a single boundary, 3 for app-wide with fallback UI + reporting |
| Extract a shared utility / service layer from duplication | **2 – 4** | Scale with call sites |
| Fix an N+1 or query performance defect | **1 – 3** | Includes index work and verification |
| Introduce caching / request deduplication library (e.g. React Query) | **3 – 5** | Includes migrating existing call sites |
| Parameterise SQL across a codebase | **3 – 8** | ~0.25/query, floor of 3 for the review sweep |
| Split a monolithic file into layers | **5 – 10** | ≈1 day per 300–400 lines of tangled logic |
| Replace a synchronous path with real async / job queue | **5 – 10** | Includes worker, retry and visibility |
| Introduce a test suite where none exists | **5 – 15** | Scope to critical paths, not full coverage |
| Set up CI/CD pipeline from scratch | **5 – 10** | Per repo, per environment set |
| Introduce IaC for existing infrastructure | **8 – 15** | Scale with resource count |

## Multipliers

Apply to the base, then round to the nearest half-day.

| Condition | × |
| --- | --- |
| No tests exist around the code being changed | 1.5 |
| The change touches a public API contract (clients must migrate) | 1.5 |
| Systemic — same fix repeated across many files | 1.5 – 3 (by count) |
| The team is unfamiliar with the technology involved | 1.5 |
| Change requires a data migration | 2 |
| Legacy code with no documentation and no original author available | 1.5 |
| Fix is well-isolated with existing tests covering it | 0.75 |

## Rules

- **A finding with no estimate uses `null`**, which renders as `—`. This is honest and acceptable
  for items that need a spike first. Do not invent a number.
- **Cap any single finding at 10 man-days.** Anything larger is not one finding — split it into
  its constituent work items, each with its own rule ID and estimate.
- **Phase totals are the sum of their findings' estimates**, treating `null` as 0. The generator
  recomputes and warns if the declared total disagrees.
- **Sanity-check the total.** Roughly: a small app assessment lands at 30–60 man-days, a mid-size
  platform at 80–150, a large multi-service estate at 200+. A total far outside that range for the
  system's size means individual estimates drifted.

## Suggested role

Each finding names the role that would do the work. Use the vocabulary the client's team actually
uses; the defaults are:

`Frontend Engineer`, `Backend Engineer`, `Mobile Engineer`, `Full-Stack Engineer`,
`Database Engineer`, `DevOps Engineer`, `Security Engineer`, `QA Engineer`, `Solution Architect`

Prefer the most specific role that can complete the work end to end. Use `Solution Architect` only
for design-level items that produce a decision rather than a code change.
