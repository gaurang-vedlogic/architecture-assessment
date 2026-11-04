# Scored Dimensions

Every assessment scores the same **seven dimensions**. They are fixed: the radar chart, the gauge
row and the scorecard table all assume these seven, in this order. Do not add, rename or drop one
for a particular engagement — if a dimension does not apply, score it and say why in `keyGap`.

| # | Dimension | `id` | What it measures |
| - | --- | --- | --- |
| 1 | Architecture Quality | `architecture` | Separation of concerns, layering, module boundaries, coupling, reuse, duplication, dependency direction |
| 2 | Security Posture | `security` | Authn/authz, secret handling, injection, transport security, input validation, dependency CVEs, data exposure |
| 3 | Scalability Readiness | `scalability` | Behaviour under concurrency and growth: blocking work, connection handling, N+1s, caching, statelessness, resource limits |
| 4 | Code Maintainability | `maintainability` | Readability, function/file size, naming, dead code, test coverage, consistency, onboarding cost |
| 5 | Observability & Monitoring | `observability` | Structured logging, correlation IDs, metrics, tracing, alerting, error reporting, audit trails |
| 6 | DevOps Maturity | `devops` | Build/release automation, environments, IaC, config management, rollback, branch strategy, quality gates |
| 7 | Data Integrity & DB Health | `data` | Schema design, constraints, transactions, migrations, indexing, backup/restore, retention, data races |

## Choosing the dimension for a finding

Each rule declares its primary dimension. A finding gets **exactly one** dimension — the one whose
score it should pull down. When a finding plausibly belongs to two, use this precedence:

```
security  >  data  >  scalability  >  architecture  >  observability  >  devops  >  maintainability
```

Rationale: a SQL-injection-shaped problem is a *security* finding even though it is also an
architecture smell. Maintainability is the fallback, not the catch-all first choice.

## Risk heatmap axes

The heatmap is a separate view over the same findings: **layers × risk dimensions**.

- **Layers** (rows, use only those present in the system): `Frontend`, `Backend`, `Mobile`,
  `Database`, `Infrastructure`, `Integrations`
- **Risk dimensions** (columns, fixed): `Security`, `Performance`, `Scalability`, `Reliability`,
  `Maintainability`

Each cell gets `Critical` | `High` | `Medium` | `Low` | `n/a`. Derive it from the findings that land
in that layer:

| Cell rating | Rule |
| --- | --- |
| `Critical` | ≥1 P0 finding in that layer touching that risk dimension |
| `High` | ≥2 P1 findings, or 1 P1 with systemic reach (repeated across files) |
| `Medium` | ≥1 P1, or ≥3 P2 findings |
| `Low` | ≤2 P2 findings, nothing higher |
| `n/a` | Layer genuinely does not expose that risk dimension |

## Layers

`layer` on a finding must be one of: `Frontend`, `Backend`, `Mobile`, `Database`,
`Infrastructure`, `Integrations`. Use the layer where the *fix* lands, not where the symptom shows.
A UI freeze caused by an unbounded API response is a `Backend` finding if the fix is server-side
pagination, and `Frontend` if the fix is virtualised rendering.
