# Review Methodology

The rule catalog says *what* to look for. This says *how to look*, and — more importantly — how to
avoid reporting things that are not true.

A rule match is a **candidate**, never a finding. A candidate becomes a finding only after it
survives refutation.

---

## The four steps

Every candidate passes through four steps. Most die at step 2 or 3. Record where each one died.

### Step 1 — Pattern match

A grep, a rule scan, a smell. Cheap and high-recall. Produces candidates, nothing more.

> `${` appears inside SQL strings at 1,878 sites.

### Step 2 — Is the input actually attacker-controlled / is the condition actually present?

Trace the value back to its source. Most candidates die here.

> Of those 1,878, all but one interpolate `DB_SCHEMA`, a server-static environment value. **Refuted.**
> One interpolates the `track` query parameter. **Survives.**

### Step 3 — Is there a compensating control?

Validation, an allow-list, a middleware gate, network isolation, a framework default, an existing
guard elsewhere in the chain.

> `ORDER BY` is dynamic — but `buildOrderBy` maps a `z.enum` onto a fixed column list, so no request
> string reaches the clause. **Refuted.**

### Step 4 — Trace control to consequence

Follow the value from entry to its effect. State the concrete failure: which input, which output,
which record, which user.

> `report-token` takes `userName` from the query string and mints an Oracle Reports token for that
> user. An authenticated low-privilege staffer can mint a token as anyone. **Confirmed.**

**Report the survivors. Record the refutations.** The refuted list is not waste — it is the evidence
that the review was rigorous, and it goes in the report (`refutedCandidates`).

---

## Confidence

Every finding carries one:

| Confidence | Meaning | Allowed to block a release? |
| --- | --- | --- |
| **Confirmed** | Read the code, traced the path, can state the concrete failure. | Yes |
| **Needs-runtime-check** | The static evidence is strong but a runtime or environment fact is unverified (a platform setting, a vendored package's internals, an infrastructure control). | Yes, as a *condition* — state what must be checked |
| **Plausible** | Consistent with the evidence but the decisive path was not traced. | No |

Never present a `Plausible` finding in the same voice as a `Confirmed` one. If you cannot get past
`Plausible` and it matters, say so explicitly in the coverage caveats.

**Downgrade rather than delete** when a candidate turns out to be a lesser issue than claimed. A
manual unvalidated token decode that runs *after* the library already validated the token is not an
auth bypass — it is a Low robustness issue. Keep it, at its real severity.

---

## Invariants

Before hunting for defects, write down what must always be true of this system. Then check each one.
Invariants find the defects that no category grep would surface, because they follow *identity* and
*consequence* rather than syntax.

Each invariant gets one of three states:

| State | Meaning |
| --- | --- |
| `HOLDS` | Verified true across the paths reviewed. |
| `VIOLATED` | A finding proves it false — link the finding ID. |
| `CHECK` | Could not be fully verified; note what remains unknown. |

Write invariants as positive statements of the form *"X always Y"*:

- Every protected route requires a valid session; unauthenticated callers get 401.
- No request path reaches SQL with an unbound user-controlled value.
- An authenticated session cannot read or write another tenant's rows.
- Authentication never substitutes for authorisation.
- Every write records the real authenticated user.
- A token always represents the session user.
- A failure in an external dependency fails closed.
- Error responses never leak internals.
- Money is never computed in floating point.
- A multi-step business write either completes fully or leaves no trace.

Derive 8–15 for the specific system. Generic invariants find generic bugs; the valuable ones come
from the system's own domain — *"a Galopp app never queries Trav tables"* found a whole class.

---

## System model — write this first

Before reading for defects, establish:

**Purpose & domain.** What the system is for, and what kind of data it holds. This sets the blast
radius of everything you find. PII and money raise severity; internal tooling lowers it.

**Actors & trust boundaries.** Who can reach what: anonymous, authenticated user, elevated user,
service identity, external system. Then name **the realistic attacker** — usually an authenticated
low-privilege user or a compromised account, not an anonymous internet attacker.

**Key data flows.** The request path from entry to storage, and the authentication path. Naming the
middleware chain in order is usually enough.

Without this, severity assignment is arbitrary. "Any authorised staffer can read most registry rows"
is a critical finding in one system and the entire point of another.

---

## Coverage — say what you did and did not read

Reviews are always partial. An honest, specific coverage statement is what makes the findings
trustworthy; a vague one makes the whole report unfalsifiable.

Record:

- **Method** — static review, tooling used (or explicitly none), single-pass or iterative.
- **Size** — LOC, file count, module count, and how you counted.
- **Deep-read** — the specific files read line by line. Name them.
- **Grep-swept** — what was checked by pattern across the breadth, and for which patterns.
- **Not read** — vendored packages, generated code, areas out of scope.
- **Caveats** — what the gaps mean for confidence, and which findings they touch.

> Multi-step write transactionality and N+1 reads were sampled across the 61 feature modules, not
> exhaustively audited — residual risk noted under F7.

This is not a disclaimer. It tells the client exactly what a follow-up engagement would add.

---

## Discovery techniques that outperform grepping

Category greps find the easy half. These find the rest:

**Sibling comparison.** Two modules doing the same thing, differently. One of them is wrong. This is
how a single injected parameter surfaces among 1,878 safe interpolations — the bound sibling proves
it is a regression, not house style.

**Identity tracing.** Follow "who is this?" from request entry to every consumer — the query filter,
the audit column, the token, the log line. Impersonation and audit-integrity defects live here and
pass every surface scan.

**Control-to-consequence on error paths.** Read every `catch`. Ask what state the system is in
afterwards. Fail-soft authorisation hides in catch blocks that log and continue.

**Boundary inventory.** List every entry point — routes, jobs, queue consumers, webhooks, CLI, admin
tools — and check the guard on each. Findings cluster on the ones nobody remembers exist.

**Read in execution order.** Entry point → middleware chain → router → handler → service → data
access. Defects live in the gaps between layers, which is exactly what file-by-file reading skips.

**Configuration diff across environments.** What is enabled in production that should not be, and
what is missing that should be there.

---

## Positive findings

Record what is genuinely good, with the same evidence discipline. Three reasons:

1. It calibrates the client — a report of pure negatives reads as an attack and gets dismissed.
2. It tells the team what to protect during remediation.
3. It is the honest result. Most codebases do several things well.

Only list verified strengths, not the absence of a problem. "Fail-closed authentication — 403 on a
missing user row *and* on lookup error" is a strength. "No SQL injection found" is a coverage
statement, not a strength.

---

## Release gates

When the review carries a deployment verdict, keep gates separate from findings. A gate is a
**policy question**: *may this ship?* A finding is a **technical fact**.

Each gate: name, the finding(s) that bear on it, its status per environment, and the outcome.

| Gate | Finding | Dev/Test | Prod | Status |
| --- | --- | --- | --- | --- |
| Broken authz / injection | F10, F11 | Warning | Blocks | Open |
| Secrets in VCS/history | none found | Clear | Clear | Pass |
| Branch protection | F15 | Warning | Blocks | Needs-runtime-check |

Verdict vocabulary:

- **APPROVED** — no open blocking gates.
- **APPROVE WITH CONDITIONS** — ships once the named conditions clear; list them.
- **BLOCK RELEASE** — one or more gates block; list exactly what must change.

State the verdict **per environment**. Blocking production while approving dev/test is the normal
outcome and lets the team keep working on the fix.

Severity ≠ gate. A Medium finding can block production (unconfirmed branch protection), and a High
finding may not (it is unreachable in the deployed configuration). Justify each.

---

## What not to do

- **Do not report a rule as a finding.** "The codebase should use dependency injection" is not a
  finding. "`OrderService` constructs its own `DbContext` at `order.service.ts:31`, so it cannot be
  tested without a live database" is.
- **Do not count instead of judging.** 40 findings of which 30 are lint-level noise is a worse report
  than 12 real ones. Consolidate repeated instances into one systemic finding with representative
  evidence and a count.
- **Do not report the framework's own defaults as defects** unless you checked they are not in effect.
- **Do not assign severity by category.** "SQL injection" is not automatically P0 — trace whether the
  input is reachable first.
- **Do not pad the roadmap.** Every man-day must trace to a finding.
- **Do not fabricate line numbers.** If you did not open the file, you have no evidence.

---

## Consolidating repeated instances

When the same defect appears many times, report it once:

- Title it as systemic: *"`toISOString().split('T')[0]` local-date antipattern (~8 sites)"*.
- Give 2–3 representative `file:line` references plus the total count.
- Estimate the effort for **all** instances.
- Apply the systemic escalation from `scoring/criticality-priority.md`.

One systemic finding beats eight duplicates. It reads better and it estimates better.
