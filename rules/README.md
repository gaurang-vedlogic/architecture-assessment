# Rule Catalog

Rules describe **what to look for** in a codebase. They are stack-agnostic where possible and
stack-specific where the defect only exists in that stack.

- Always load **every file in `universal/`**.
- Then load the packs matching the detected stack.
- A rule that does not apply to the system under review is simply not fired. Do not report
  "compliant" rules — the report lists findings, not a checklist.

---

## Rule format

Each rule is one `###` block. Copy this shape exactly — the fields are parsed by humans and agents
alike, and `/assess-report` relies on `id`, `dimension`, `criticality`, `priority`, `phase`,
`impact` and `role` flowing into the finding.

```markdown
### SEC-001 — SQL injection via string interpolation

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack issuing SQL
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 3–8 (0.25/query, floor 3)

**Detect:** Query strings built with f-strings, template literals, `+` concatenation, `String.format`,
or `%` formatting where any operand is request-derived. Search for `SELECT`/`INSERT`/`UPDATE`/`DELETE`
adjacent to interpolation syntax.

**Why it matters:** An attacker controls the query, not just the parameter. Reads, writes and schema
changes all become reachable from a public endpoint.

**Impact:** Improves database security by enforcing parameterised queries, preventing unauthorised
query manipulation, and reducing risk of data breaches or database compromise.

**Fix:** Replace interpolation with bound parameters throughout. Where dynamic identifiers (table or
column names) are genuinely required, validate against an allow-list.
```

### Field reference

| Field | Notes |
| --- | --- |
| `id` (in the heading) | Permanent. Never renumber, never reuse. New rules take the next free number in the pack. |
| `Dimension` | One of the seven in [`scoring/dimensions.md`](../scoring/dimensions.md). |
| `Layer` | Default layer for findings from this rule. Override per-finding when the fix lands elsewhere. |
| `Applies to` | Free text describing the stacks/conditions. Used to decide whether to load the rule. |
| `Criticality` / `Priority` / `Phase` | **Defaults.** Adjust per finding via [`scoring/criticality-priority.md`](../scoring/criticality-priority.md), and record the reason in `rationale`. |
| `Role` | Default suggested role. |
| `Effort` | Range in man-days, with the driver. Pick a point inside it per finding. |
| `Detect` | Concrete, greppable guidance. Prefer "search for X near Y" over "check whether the code is good". |
| `Why it matters` | The consequence, in engineering terms. This is for the reviewer, not the report. |
| `Impact` | **Goes into the report verbatim (adapted to the client's wording).** One sentence, benefit-led, present tense. |
| `Fix` | The recommended remediation. Feeds the Suggestions section. |

---

## ID prefixes

| Prefix | Pack | Prefix | Pack |
| --- | --- | --- | --- |
| `ARC` | universal/architecture | `FE` | frontend/_common |
| `SEC` | universal/security | `FE-REACT` | frontend/react |
| `PERF` | universal/performance-scalability | `FE-NG` | frontend/angular |
| `MNT` | universal/maintainability | `FE-VUE` | frontend/vue |
| `OBS` | universal/observability | `BE` | backend/_common |
| `DVO` | universal/devops-delivery | `BE-NODE` | backend/nodejs |
| `DAT` | universal/data-integrity | `BE-PY` | backend/python |
| `API` | universal/api-design | `BE-NET` | backend/dotnet |
| `TST` | universal/testing | `BE-JAVA` | backend/java |
| `DEP` | universal/dependencies-supply-chain | `BE-PHP` | backend/php |
| `AX` | universal/accessibility-ux | `BE-GO` | backend/go |
| `DB` | database/relational | `MOB` | mobile/_common |
| `DB-NOSQL` | database/nosql | `MOB-RN` | mobile/react-native |
| `INF` | cloud-infra/_common | `MOB-FLU` | mobile/flutter |
| `INF-AZ` | cloud-infra/azure | `MOB-IOS` | mobile/ios-swift |
| `INF-AWS` | cloud-infra/aws | `MOB-AND` | mobile/android-kotlin |
| `INF-K8S` | cloud-infra/containers-k8s | | |

---

## Stack detection

Detect before you load. Look for these markers at the repo root and one level down:

| Marker | Load |
| --- | --- |
| `package.json` with `react` / `react-dom` | `frontend/_common`, `frontend/react` |
| `package.json` with `next` | + `frontend/nextjs` |
| `angular.json`, `@angular/core` | `frontend/_common`, `frontend/angular` |
| `vue`, `nuxt.config.*` | `frontend/_common`, `frontend/vue` |
| `package.json` with `express`/`fastify`/`nestjs`/`koa` | `backend/_common`, `backend/nodejs` |
| `requirements.txt`, `pyproject.toml`, `*.py` | `backend/_common`, `backend/python` |
| `*.csproj`, `*.sln` | `backend/_common`, `backend/dotnet` |
| `pom.xml`, `build.gradle` | `backend/_common`, `backend/java` |
| `composer.json`, `artisan` | `backend/_common`, `backend/php` |
| `go.mod` | `backend/_common`, `backend/go` |
| `package.json` with `react-native` | `mobile/_common`, `mobile/react-native` |
| `pubspec.yaml` | `mobile/_common`, `mobile/flutter` |
| `*.xcodeproj`, `Package.swift` | `mobile/_common`, `mobile/ios-swift` |
| `build.gradle.kts` with `com.android.application` | `mobile/_common`, `mobile/android-kotlin` |
| Any SQL, ORM config, `migrations/` | `database/relational`, `database/orm-migrations` |
| MongoDB / DynamoDB / Cosmos / Firestore clients | `database/nosql` |
| `Dockerfile`, `docker-compose.*` | `cloud-infra/_common`, `cloud-infra/containers-k8s` |
| `*.bicep`, `azure-pipelines.yml`, `@azure/*`, `func.exe`/Functions host files | `cloud-infra/azure` |
| `*.tf`, `serverless.yml`, `aws-sdk` | `cloud-infra/aws` |
| `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile` | `cloud-infra/ci-cd` |

Monorepos: detect per package and load the union.

---

## Adding a rule

1. Pick the right pack. If it applies to more than one stack, it belongs in `universal/`.
2. Take the next free ID in that pack. Never reuse a retired ID.
3. Write the block in the format above — all fields, no placeholders.
4. Append a row to [`INDEX.md`](INDEX.md).
5. The `Impact` sentence must be usable in a client report as-is. Write it benefit-first, not
   defect-first: "Improves database security by…", not "Stops SQL injection which is bad".
