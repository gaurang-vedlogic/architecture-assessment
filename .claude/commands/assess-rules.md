---
description: Look up or extend the assessment rule catalog
argument-hint: <topic, rule id, or stack>
---

Search the rule catalog for: **$1**

1. Check `rules/INDEX.md` first — it lists every rule with its dimension, layer, default
   criticality/priority/phase and effort range.
2. Grep `rules/**/*.md` for the topic if the index does not resolve it.
3. Report the matching rules with their IDs, what they detect, and their defaults.

**If the user is adding a rule**, follow `rules/README.md` exactly:

- Put it in the right pack. If it applies to more than one stack, it belongs in `rules/universal/`.
- Take the next free ID in that pack. **IDs are permanent — never renumber or reuse one.**
- Fill every field. The `Impact` sentence must be usable in a client report verbatim: benefit-led
  and present tense ("Improves database security by…"), not defect-led.
- Make `Detect` concrete and greppable — "search for X near Y", not "check whether the code is good".
- Regenerate the index and confirm no duplicate IDs were introduced:

```bash
npm run index-rules
```
