# CLAUDE.md — Architecture Review

This repo is a **code assessment rule library + report generator**. It is not an application.
When someone asks you to "assess", "review", or "audit" a codebase from here, you are the reviewer.

## The one rule that matters

**`assessment.json` is the only contract.** The review produces it; the generator consumes it.
Never hand-edit a generated report. Never invent a report section outside the schema. If the report
needs to say something new, add it to `schema/assessment.schema.json` and to `tools/` — in that order.

## Output format

**HTML is the deliverable format for this repo.** Three self-contained HTML files with inline SVG
charts, print-to-PDF friendly. A DOCX renderer exists behind `--docx` for the rare case someone needs
Word — do not produce it unless explicitly asked.

## Where output goes

**The report ships with the code it describes.** Set `meta.repoPath` to the absolute path of the
assessed repository and the generator writes to `<repoPath>/architecture-review/` — the HTML, its
`charts/`, and a copy of the assessment JSON, so the repo carries the whole record.

- `assessments/<slug>.assessment.json` stays here and remains **canonical** — it is what
  the client dashboard reads. The copy in the repo is a convenience, not the contract.
- **`Review-dashboard.html` is per client and ships beside the report.** `npm run report` builds it
  automatically from every assessment whose `meta.client` matches, writes it into the same
  `architecture-review/` folder, and never includes another client's applications. `meta.client`
  is therefore the scoping key — spell it identically across a client's assessments.
- `npm run portfolio -- --client "<name>"` rebuilds a client's dashboard into every repo that
  client's assessments name. `--all` exists for an internal cross-client view in `output/` and
  must never be shipped.
- An assessment with no `repoPath` falls back to `output/`. `--out` overrides both.
- **`REMEDIATION-<app>.md`** is the hand-off for fixing: `npm run remediation -- --input <file>`
  writes a Markdown work order (per-phase items, evidence file:line, fix, done-when checklist,
  strengths to protect, invariant acceptance) into the same folder. It is what you point Claude
  (or an engineer) at inside the assessed repo. Generated from the JSON like everything else.
- Decisions taken **after** the review that change how findings are executed (a platform
  migration, a descoped module) go in `executionNotes` in the assessment JSON. They render at the
  top of the remediation plan only; the report stays a record of what was found. Regenerate both
  after adding one.
- Two applications from one repo (e.g. `novello-server` and `novello-database`) land in the same
  `architecture-review/` folder. That is correct — both describe that repo.

## Workflow

1. **Detect** the stack (see `rules/README.md` → "Stack detection").
2. **Load** `rules/universal/*` (always) + the matching stack packs.
3. **Review** the code against those rules. Every finding must cite a real file/line.
4. **Score** using `scoring/` — dimensions, maturity, criticality, priority, phase, effort.
5. **Write** `assessments/<slug>.assessment.json` validated against `schema/assessment.schema.json`.
6. **Generate** with `npm run report -- --input assessments/<slug>.assessment.json`.

The full procedure lives in `.claude/skills/codebase-assessment/SKILL.md`. Read it before
starting an assessment — do not improvise the flow.

## Hard constraints on findings

- **No invented findings.** Every finding needs `evidence` with a real path and, where possible, a
  line number. If you cannot point at the code, it is not a finding — it may be a *suggestion*.
- **No copied findings from `examples/`.** That example describes a different client's system. It is
  a format reference only.
- **Criticality/priority come from `scoring/criticality-priority.md`**, not from vibes. A rule's
  default priority can be overridden, but the override must be justified in `rationale`.
- **Effort estimates are man-days**, using `scoring/effort-estimation.md`. Use `null` when genuinely
  unknown — the report renders that as `—`. Do not guess a number to fill the column.
- **Dimension scores must be defensible.** Each scorecard row needs a `keyGap` that names the
  specific findings driving the score down.

## Tooling notes

- Node only. **Python is not installed on this machine** (only a Microsoft Store stub) — do not
  write Python tooling here.
- The default HTML path has **no dependencies**. Keep it that way: `sharp` and `docx` are optional
  and lazily imported only when `--docx` is passed.
- Charts are hand-built SVG in `tools/charts.mjs`, inlined directly into the HTML. Colours come from
  `tools/theme.mjs` — never hardcode a hex in a chart or builder.
- `npm run validate -- --input <file>` checks schema *and* cross-consistency (phase totals, finding
  counts, priority tallies) before you generate.

## Adding rules

New rules go in the right pack under `rules/`, follow the block format in `rules/README.md`
exactly, and get appended to `rules/INDEX.md`. IDs are permanent — never renumber or reuse one.
