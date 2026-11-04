---
description: Regenerate the report from an existing assessment
argument-hint: <slug | name | path to assessment.json>
---

Regenerate the report for: **$1**

## Step 1 — resolve the target

The argument may be a slug, a partial name, or a path to the JSON:

```bash
npm run resolve -- --target "$1" --prefer assessment
```

- **`assessment`** → use the reported file path.
- **`repo`** → no assessment exists for that repo yet. Tell the user, and offer `/assess` instead.
- **`ambiguous`** → show the matches and ask which one.
- **`unresolved`** → run `npm run targets` and list what exists.

With no argument, regenerate everything.

## Step 2 — validate, then generate

```bash
npm run validate -- --input <resolved file>
npm run report   -- --input <resolved file>    # also rebuilds that client's Review-dashboard.html beside it
```

The dashboard is scoped to `meta.client` and never includes other clients. To refresh it in the
client's other repos as well: `npm run portfolio -- --client "<name>"`.

Resolve every validation **error** before generating. Report every **warning** with a short
recommendation — they encode the scoring rules (P0 outside phase 1, P0 inflation, findings without
evidence, phase-1 effort dominance, targets at 5.0).

Output is a single `ARCHITECTURE-REVIEW-<slug>.html` per application, written to
`<meta.repoPath>/architecture-review/` beside the code it describes. If the assessment has no
`repoPath`, it falls back to this tool's `output/` — add the path rather than leaving it there.
Add `--brief` or `--docx` only if the user explicitly asks.

## Step 3 — never hand-edit

If the report needs to change, change the JSON. If it needs to say something the schema cannot
express, extend `schema/assessment.schema.json` and `tools/` first, then regenerate.
