# Architecture Review

A stack-agnostic **code assessment rule library** plus a **report generator** that turns findings
into client-ready HTML deliverables — a deep architecture review, an executive decision brief, and a
per-client dashboard across that client's assessed applications.

Point it at any codebase — frontend, backend, mobile, data or infrastructure, any language — run the
review against the rule catalog, record findings in one JSON file, and generate the reports.

```
  codebase ──► rules/ ──► METHODOLOGY.md ──► assessment.json ──► npm run report ──► HTML reports
              (what to    (how to look, and    (the single          (inline SVG charts,
               look for)   how to refute)       contract)            branded, print-ready)
```

---

## Quick start

```bash
npm run example          # generates the worked example into output/
```

No `npm install` needed — the HTML generator has no dependencies.

Then open `output/ARCHITECTURE-REVIEW-industrifinans.html`.

### Assessing a real codebase with Claude Code

From this repo:

```
/assess D:\path\to\some-codebase
```

That drives the whole flow: establish the system model, detect the stack, load the matching rule
packs, read the code, refute candidates, score, write
`assessments/<slug>.assessment.json`, and generate. The procedure lives in
[.claude/skills/codebase-assessment/SKILL.md](.claude/skills/codebase-assessment/SKILL.md).

| Command | Purpose |
| --- | --- |
| `/assess <path \| name \| alias>` | Full assessment → findings → report |
| `/assess <target> --advisory` | Same, without a release-gate verdict |
| `/assess-report <slug \| name>` | Regenerate the report from an existing assessment |
| `/assess-targets` | List every repo and assessment you can pass to the above |
| `/assess-rules <topic>` | Look up or extend the rule catalog |

The target argument accepts a **path, a bare repo name, or an alias** — `/assess server`,
`/assess crm` and `/assess D:\repos\novello\server` all work. Names are resolved against the search
roots and aliases in [config/workspaces.json](config/workspaces.json); ambiguous names list their
matches rather than guessing.

### npm scripts

| Script | Does |
| --- | --- |
| `npm run validate -- --input <file>` | Schema and cross-consistency checks, no output written |
| `npm run report -- --input <file>` | Generate the per-application HTML reports |
| `npm run portfolio -- --client "<name>"` | Rebuild one client's `Review-dashboard.html` in each of that client's repos (`npm run report` already does this for the report's own folder) |
| `npm run remediation -- --input <file>` | Write `REMEDIATION-<app>.md` beside the report — a work order for fixing the findings, made for handing to an engineer or a coding agent in the assessed repo |
| `npm run index-rules` | Regenerate `rules/INDEX.md` and check for duplicate IDs |
| `npm run targets` | List assessable repos, aliases and existing assessments |
| `npm run resolve -- --target <x>` | Resolve a path/name/alias to a repo or assessment |

---

## What gets generated

| File | Audience | Contains |
| --- | --- | --- |
| `ARCHITECTURE-REVIEW-<app>.html` | Everyone — the deliverable | Verdict, objective + headline stats, executive summary, scorecard with gauges/radar/bars, capability matrix, system model & invariants, coverage, threat model, findings overview + full per-finding evidence, release gates, refuted candidates, positive posture, inventory, missing capabilities, phased roadmap, suggestions, architectural recommendation, closing |
| `Review-dashboard.html` | The client's portfolio owners | That client's applications only: readiness, maturity by dimension, capability matrix, production blockers, cross-application patterns. Written beside each report; scoped by `meta.client` |
| `charts/*.svg` | Reuse | Every chart as a standalone SVG, for slides or other documents |

One report per application. The architecture review carries both the executive-facing material
(verdict, stats, scorecard, roadmap) and the technical evidence, ordered so a decision-maker can
stop after the scorecard and an engineer can keep reading.

Every report is a **single self-contained HTML file** — inline SVG charts, inline CSS, no external
requests — so it can be emailed, hosted anywhere, or opened offline. The stylesheet includes a print
layout, so browser *Print → Save as PDF* produces a clean PDF deliverable.

### Optional extra outputs

Both are present and tested; neither runs by default:

```bash
npm run report -- --input <file> --brief   # condensed client-facing report (a subset of the review)
npm run report -- --input <file> --docx    # Word deliverable
```

`--docx` rasterises the charts, so it pulls in the optional `sharp` and `docx` packages. The default
HTML run has **no dependencies at all**.

---

## Repo layout

```
METHODOLOGY.md            How to review — the most important file in the repo
CLAUDE.md                 Instructions for Claude Code working in this repo

rules/                    The assessment rule catalog — 289 rules across 33 packs
  README.md               Rule format spec, ID prefixes, stack detection
  INDEX.md                Generated listing of every rule
  universal/              Always loaded: security, architecture, performance-scalability,
                          maintainability, observability, devops-delivery, data-integrity,
                          api-design, testing, dependencies-supply-chain, accessibility-ux
  frontend/               _common, react (+ Next.js), angular, vue (+ Nuxt)
  backend/                _common, nodejs, python, dotnet, java, php, go
  mobile/                 _common, react-native, flutter, ios-swift, android-kotlin
  database/               relational, nosql
  cloud-infra/            _common, azure, aws, containers-k8s

scoring/
  dimensions.md           The scored dimensions and the risk-heatmap axes
  maturity-model.md       0–5 scale, adjustment rules, per-dimension rubrics, target guidance
  criticality-priority.md Criticality × Priority (P0/P1/P2) × Phase, with escalation rules
  effort-estimation.md    Man-day heuristics by fix shape, plus multipliers

schema/
  assessment.schema.json  The output contract

tools/                    Generator (Node only — no Python required)
  report.mjs              Per-application CLI
  portfolio.mjs           Client dashboard builder (CLI + used by report.mjs)
  validate.mjs            Validation CLI
  derive.mjs              Everything computed from an assessment, in one place
  charts.mjs              Hand-built SVG charts
  theme.mjs               Colour, type and spacing — single source of truth
  html-shell.mjs          Shared stylesheet and HTML helpers
  architecture-review.mjs The report renderer
  dashboard.mjs           Portfolio roll-up renderer
  decision-brief.mjs      Optional condensed report, behind --brief
  docx.mjs                Optional Word output, behind --docx
  index-rules.mjs         Rule index generator

examples/                 A complete worked assessment — read for shape, never for content
assessments/              Your assessment JSONs
output/                   Generated reports
config/branding.json      Company name, document title, footer, confidentiality notice
```

---

## The three parts

### 1. Rules — what to look for

289 rules, each with a permanent ID (`SEC-001`, `FE-REACT-004`, `INF-AZ-001`, …), a dimension, a
default criticality/priority/phase, greppable detection guidance, and a pre-written benefit-led
*Impact* sentence that flows straight into the report.

Rules are Markdown so a human or an agent can read them; the IDs tie a finding back to its rule and
let the portfolio dashboard spot the same defect recurring across applications.

See [rules/README.md](rules/README.md) for the format, [rules/INDEX.md](rules/INDEX.md) for the catalog.

### 2. Methodology — how to look

A rule match is a **candidate**, never a finding. [METHODOLOGY.md](METHODOLOGY.md) defines the
four-step process that turns one into the other — and, just as importantly, what to record when a
candidate dies. It covers invariants, confidence levels, coverage honesty, the discovery techniques
that outperform grepping, and release-gate vocabulary.

The refuted candidates go **in the report**. They are what make it falsifiable.

### 3. Generator — how it becomes a deliverable

`assessment.json` is the only contract. Produce a valid one by any means — Claude, a script, by hand
— and the generator renders it. Sections adapt: omit `verdict` and the report becomes advisory; omit
`capabilities` and that section disappears.

`npm run validate` catches what a JSON Schema cannot: P0s outside phase 1, P0 inflation, findings
with no evidence, phase totals that disagree with their findings, targets below current, dangling
finding references.

---

## Configuration

- **Branding** — `config/branding.json`: company name, document title, header/footer, closing
  section, confidentiality notice.
- **Dimensions** — the default seven live in `scoring/dimensions.md`, but the set is per-assessment.
  Swap one in when the engagement calls for it; keep 5–8 and keep them consistent across a portfolio.
- **Phases** — the default three can be renamed or re-scoped per assessment via `phases`.

## Requirements

Node.js 18+ (tested on 24). The default HTML path has **zero dependencies** — no Python, no Word, no
Office install, nothing to `npm install`. Only the optional `--docx` output needs packages.
