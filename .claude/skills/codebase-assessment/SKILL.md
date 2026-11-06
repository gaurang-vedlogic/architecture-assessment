---
name: codebase-assessment
description: Assess any codebase — frontend, backend, mobile, data or infrastructure, any language — against the rule catalog in rules/, and produce client-ready HTML assessment reports (deep architecture review, executive decision brief, portfolio dashboard). Use when asked to assess, review, audit, or produce an assessment report for a codebase, or to regenerate a report from an existing assessment JSON.
---

# Codebase Assessment

You are the reviewer. This skill takes you from a codebase to a client-ready report.

The output is **one JSON file** (`assessments/<slug>.assessment.json`) which the generator renders
into every report format. Nothing else you write is a deliverable.

---

## Before you start

Read these, in this order. Do not skip them — they contain the discipline that separates a
defensible report from a list of guesses.

1. **`METHODOLOGY.md`** — the four-step candidate→finding process, invariants, confidence levels,
   coverage discipline, and what not to do. This is the most important file.
2. **`scoring/dimensions.md`**, **`scoring/maturity-model.md`**, **`scoring/criticality-priority.md`**,
   **`scoring/effort-estimation.md`** — how observations become numbers.
3. **`rules/README.md`** — rule format and stack detection.
4. **`schema/assessment.schema.json`** — the exact output contract.
5. **`examples/industrifinans.assessment.json`** — a complete worked example. Read it for *shape and
   depth*, never for content. Those findings belong to a different system.

---

## Procedure

### Step 1 — Establish the system model

**Before hunting for defects.** Write down, in `systemModel`:

- **Purpose & domain.** What the system is for and what data it holds. This sets the blast radius of
  everything you find — the same defect is critical in a financial platform and minor in a scratch tool.
- **Actors & trust boundaries.** Who can reach what. Then name the *realistic attacker* — usually an
  authenticated low-privilege user, not an anonymous internet attacker.
- **Key data flows.** The request path from entry to storage, and the authentication path.
- **8–15 invariants** — positive statements of what must always be true, mixing generic ones with
  ones specific to this domain. Mark each `HOLDS`, `VIOLATED` or `CHECK` as you verify them.

Skipping this makes every later severity call arbitrary.

### Step 2 — Detect the stack and load rules

Use the marker table in `rules/README.md` § Stack detection. Load **every file in
`rules/universal/`** plus the matching stack packs. In a monorepo, detect per package and load the
union. Consult `rules/INDEX.md` for the full catalog listing.

### Step 3 — Read the code

Read in **execution order**: entry point → middleware → router → handler → service → data access.
Defects live in the gaps between layers, which file-by-file reading skips.

Beyond category greps, use the techniques in `METHODOLOGY.md` § Discovery — sibling comparison,
identity tracing, control-to-consequence on error paths, boundary inventory. They find what greps
cannot.

Record what you read as you go; you need it for `coverage`.

### Step 4 — Refute before you report

Every candidate goes through the four steps in `METHODOLOGY.md`. Most die at step 2 or 3.

- **Report the survivors** as findings, each with `confidence`.
- **Record the deaths** in `refutedCandidates`, with the step that killed them. This is not filler —
  it is the evidence the review was rigorous, and it goes in the report.
- **Downgrade rather than delete** when something is real but less severe than first claimed.

Every finding needs `evidence` with a real `file` and, where you opened it, a `line`. **If you cannot
point at the code, it is not a finding** — it may belong in `suggestions` instead.

Consolidate repeated instances into one systemic finding with 2–3 representative references and an
`instances` count. One systemic finding beats eight duplicates.

### Step 5 — Score

- **Dimensions.** The default seven are in `scoring/dimensions.md`. The set is configurable — swap
  one in if the engagement calls for it (e.g. "Quality Assurance / Testing"), but keep 5–8 and keep
  them consistent across a portfolio.
- **Maturity.** Start at 3.0 and apply the adjustments in `scoring/maturity-model.md`. Every
  dimension needs a `keyGap` naming the specific findings that drove the score down.
- **Targets.** Realistic 6–12 month goals. Never 5.0. Never below current.
- **Criticality / priority / phase.** Derive them from `scoring/criticality-priority.md` — do not
  copy the rule default blindly. Any deviation goes in `rationale`.
- **Effort.** Man-days from `scoring/effort-estimation.md`. Use `null` when genuinely unknown; never
  invent a number to fill the column.

### Step 6 — Record what is good

Fill `positivePosture` with **verified** strengths, held to the same evidence standard. A report of
pure negatives reads as an attack and gets dismissed; it also fails to tell the team what to protect
during remediation. "No SQL injection found" is a coverage statement, not a strength.

### Step 7 — Coverage and verdict

- **`coverage`** — method, size (and how you counted), what you deep-read, what you grep-swept, what
  you did not read, and the caveats. Be specific. This is what makes the findings falsifiable.
- **`verdict` and `releaseGates`** — only when the engagement carries a deployment decision. State the
  verdict per environment; blocking production while approving dev/test is the normal outcome.
  Severity is not the same as gate — justify each.

Omit `verdict` and `releaseGates` entirely for advisory assessments. The report adapts.

### Step 8 — Write, validate, generate

Set **`meta.repoPath`** to the absolute path of the repository you reviewed. That is what sends the
report to `<repoPath>/architecture-review/` instead of this tool's `output/` — the deliverable
belongs with the code it describes. Omit it only when the assessed code is not on disk.

Write `assessments/<slug>.assessment.json`, then:

```bash
npm run validate -- --input assessments/<slug>.assessment.json
npm run report   -- --input assessments/<slug>.assessment.json
```

`npm run report` also writes the **client-scoped** `Review-dashboard.html` beside the report,
built from every assessment sharing this one's `meta.client`. Spell `meta.client` exactly as in
that client's other assessments, or the dashboard will split. Never run `npm run portfolio --all`
for a client deliverable — it spans clients and is internal only.

**Resolve every error.** Read every warning and either fix the underlying issue or be able to justify
it — the warnings encode the rules above (P0 outside phase 1, P0 inflation, missing evidence,
phase-1 effort dominance, targets at 5.0).

---

## Output files

All output is **HTML** — self-contained single files with inline SVG charts, print-to-PDF friendly.

| File | Written to | Audience |
| --- | --- | --- |
| `ARCHITECTURE-REVIEW-<app>.html` | `<repoPath>/architecture-review/` | Everyone. One report per application, covering executive material *and* full technical evidence. |
| `<slug>.assessment.json` | `<repoPath>/architecture-review/` | A copy beside the report so the repo carries the whole record. `assessments/` stays canonical. |
| `Review-dashboard.html` | `<repoPath>/architecture-review/` | Roll-up of **this client's** applications only, generated automatically with every report. Contains nothing from other clients. |

**One report per application.** The architecture review opens with verdict, objective, executive
summary and scorecard for decision-makers, then continues into system model, coverage, evidence and
roadmap for engineers.

Two optional outputs exist — a condensed `DECISION-BRIEF` behind `--brief` and a Word version behind
`--docx`. Both are strict subsets. **Do not generate either unless the user explicitly asks.**

---

## Hard rules

- **Never hand-edit generated HTML.** Change the JSON and regenerate. If the report needs to say
  something new, extend `schema/assessment.schema.json` and `tools/` first.
- **Never copy findings from `examples/`.** It describes a different client's system.
- **Never fabricate a file path or line number.** If you did not open it, you have no evidence.
- **Never report a rule as a finding.** "Should use dependency injection" is not a finding.
  "`OrderService` constructs its own `DbContext` at `order.service.ts:31`, so it cannot be tested
  without a live database" is.
- **Do not pad the roadmap.** Every man-day must trace to a finding.
- **Keep descriptions short.** Each finding, suggestion and strength gets a one-line title and a
  description of 1–2 sentences: what is wrong, where, and why it matters. Detail belongs in
  `evidence`, not in long prose.
- Node only — **Python is not installed on this machine.**

## Scale

A small application typically yields 10–20 findings and 30–60 man-days. A mid-size platform,
25–40 findings and 80–150 man-days. If your numbers are far outside that for the system's size,
something drifted — usually severity inflation or unconsolidated duplicates.
