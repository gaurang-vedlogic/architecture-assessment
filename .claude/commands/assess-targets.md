---
description: List every repo and assessment that /assess and /assess-report can take
---

Show what is assessable:

```bash
npm run targets
```

Present the result as three short lists:

- **Repositories** — usable as `/assess <name>`
- **Aliases** — shortcuts defined in `config/workspaces.json`
- **Existing assessments** — usable as `/assess-report <slug>`

For each existing assessment, add its verdict and overall maturity so the user can see estate status
at a glance without opening a report — read those from the JSON in `assessments/`.

If a repository has no matching assessment, note it as not yet assessed.

To add a search root or an alias, edit `config/workspaces.json`.
