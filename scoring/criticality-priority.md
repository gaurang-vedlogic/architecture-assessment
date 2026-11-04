# Criticality, Priority and Phase

Three separate axes. They are related but not interchangeable, and the report shows all three.

## Criticality — how bad is it?

A property of the defect itself, independent of when you fix it.

| Criticality | Definition |
| --- | --- |
| **High** | Can cause data loss, a security breach, an outage, incorrect financial/business output, or blocks a stated business goal. |
| **Medium** | Degrades performance, reliability or delivery speed. Users or engineers feel it, but nothing breaks catastrophically. |
| **Low** | Hygiene. No user-visible impact today; cost is future friction. |

## Priority — when do we fix it?

Criticality weighted by exploitability, blast radius and effort.

| Priority | Label | Meaning | Target |
| --- | --- | --- | --- |
| **P0** | Critical | Fix first. Active risk, or everything else is blocked behind it. | Immediately / current sprint |
| **P1** | High | Fix soon. Real impact, no active exploit or outage today. | Next 1–2 sprints |
| **P2** | Medium | Scheduled improvement. Do it when touching the area. | Backlog / this quarter |

### Deriving priority from criticality

Start from the rule's default, then apply the modifiers.

| | Reachable from an untrusted input / public surface | Internal only |
| --- | --- | --- |
| **High criticality** | **P0** | P1 |
| **Medium criticality** | P1 | P2 |
| **Low criticality** | P2 | P2 |

**Escalate one level** when any of these hold:

- The defect is **already causing** observed production symptoms (slow endpoints, errors, incidents).
- It is **systemic** — the same defect repeats across most of the module or codebase.
- It **blocks** other prioritised work (e.g. no connection pooling blocks every performance fix).
- It involves **credentials, tokens or secrets** in a place they can be read.
- It can cause **irreversible** data change (delete/overwrite without a transaction or backup).

**De-escalate one level** when:

- The code path is **dead or unreachable** in production.
- A **compensating control** already mitigates it (WAF rule, network isolation, feature flag off).
- The fix requires a **platform migration** that is out of scope for this roadmap.

Any escalation or de-escalation must be written into the finding's `rationale`. Unexplained
deviation from a rule's default priority is a review error.

### P0 discipline

P0 means *stop and fix*. If more than roughly a quarter of findings are P0, the label has stopped
meaning anything — re-run the derivation and be honest about what is actually reachable. A typical
healthy distribution on a struggling codebase is around 20–25% P0, 30% P1, 45–50% P2.

## Phase — which delivery block does it land in?

Phases group the fixes into a roadmap. Priority decides urgency; phase decides sequencing, and
sequencing also respects dependencies and team capacity.

| Phase | Name | Objective | Takes |
| --- | --- | --- | --- |
| **Phase 1** | Stabilisation & Risk Mitigation | Eliminate security risk, data-integrity risk, and configuration instability | All P0s; P1s that unblock later work; quick structural wins |
| **Phase 2** | Architecture & Scalability | Improve modularity, performance, maintainability and scalability | Most P1s; P2s that require the Phase 1 groundwork |
| **Phase 3** | Optimisation & Governance | Code quality, governance and operational maturity | Remaining P2s; documentation, cleanup, tooling |

Rules of thumb:

- **Every P0 is in Phase 1.** No exceptions — that is what P0 means.
- A P2 *may* sit in Phase 1 when it is cheap and unblocks a P0 fix (e.g. centralising routes before
  removing hardcoded credentials from them).
- A P1 *may* sit in Phase 3 only when it depends on Phase 2 output. Justify it in `rationale`.
- Phase 1 should be deliverable. If Phase 1 exceeds ~60% of total effort, move non-P0 work out.

## Heatmap ratings

The risk heatmap uses a fourth vocabulary — `Critical` / `High` / `Medium` / `Low` — derived from
findings per layer/risk cell. See [dimensions.md](dimensions.md#risk-heatmap-axes) for the mapping.
