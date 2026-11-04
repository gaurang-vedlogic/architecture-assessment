---
description: Assess a codebase end to end and generate the assessment report
argument-hint: <repo path | name | alias> [--advisory]
---

Assess: **$1**

## Step 1 — resolve the target

The argument may be a path, a bare repo name, or a configured alias. Resolve it first:

```bash
npm run resolve -- --target "$1"
```

- **`repo`** → that is the codebase to review. Proceed to step 2.
- **`assessment`** → the argument named an existing assessment rather than a repo. The user probably
  wants `/assess-report` instead — say so and stop, unless they clearly meant to re-review from
  scratch.
- **`ambiguous`** → show the matches and ask which one. Do not guess.
- **`unresolved`** → run `npm run targets` and show what is available.

If the resolver notes an assessment already exists for this repo, tell the user it will be
overwritten and carry on.

## Step 2 — run the assessment

Invoke the `codebase-assessment` skill and follow its procedure exactly:

1. Establish the system model and invariants **before** hunting for defects.
2. Detect the stack, load `rules/universal/*` plus the matching stack packs.
3. Read in execution order; refute every candidate before it becomes a finding.
4. Score against `scoring/`; record positives and coverage honestly.
5. Record what is **missing** as well as what is broken — populate `gaps` for capabilities that do
   not exist at all (orchestration, IaC, DR, APM, retention). Verify absence before claiming it.
6. Write `assessments/<slug>.assessment.json`, validate, then generate.

Use the slug convention already in `assessments/` — `<org>-<repo>`, e.g. `novello-server`.

`--advisory` omits `verdict` and `releaseGates`, producing an advisory report with no deployment
decision. Otherwise include both.

## Step 3 — report back

State the verdict, finding counts by priority, count of missing capabilities, overall maturity,
total effort, and the generated file paths. Flag anything you could not verify.

The report **and the client's `Review-dashboard.html`** are written to
`<meta.repoPath>/architecture-review/`, beside the code they describe — set `repoPath` to the
directory the resolver returned in step 1. The dashboard is built by `npm run report` from every
assessment sharing this `meta.client` and contains no other client's data; do not run
`npm run portfolio --all`. If this client has other assessed repos, their copies of the dashboard
are refreshed with `npm run portfolio -- --client "<name>"`.

Also run `npm run remediation -- --input assessments/<slug>.assessment.json`. It writes
`REMEDIATION-<app>.md` into the same folder — the work order to hand to Claude or an engineer in
that repo. Tell the user the path and the one-line prompt to use it with.
