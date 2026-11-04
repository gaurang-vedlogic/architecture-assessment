# Universal — Dependencies & Supply Chain (`DEP`)

Applies to every codebase. Load always. Complements `DVO-011`–`DVO-013`, which cover the *pipeline*
controls; these cover the *dependency set itself*.

---

### DEP-001 — Known vulnerable dependencies in the build

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Security Engineer
- **Effort:** 1–5

**Detect:** Audit output reporting high or critical advisories; direct dependencies several major
versions behind; transitive packages with published CVEs and no override.

**Why it matters:** These are publicly documented, tool-discoverable exploits — the lowest-effort
attack path into the system.

**Impact:** Removes publicly known, tool-discoverable attack paths from the application's dependency set.

**Fix:** Upgrade or override the affected packages, starting with those reachable from request
handling. Record an accepted-risk entry with an owner and date for anything that cannot be upgraded.

---

### DEP-002 — Unapproved or ungoverned dependencies

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** organisations with a dependency catalog or approval process
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Solution Architect
- **Effort:** 0.5–2

**Detect:** Packages in `dependencies` that are absent from the organisation's approved catalog, or
marked backlog/pending review, or explicitly revoked. Check runtime and build dependencies separately.

**Why it matters:** Governance exists to keep the estate on a supportable, vetted set; unapproved
packages accumulate into unmanaged risk and block release.

**Impact:** Clears the supply-chain governance gate and keeps the application on a vetted, supportable dependency set.

**Fix:** Submit the package for approval with a justification, or replace it with an approved
equivalent. Batch build-tooling submissions to reduce review overhead.

---

### DEP-003 — Abandoned or deprecated packages

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–8

**Detect:** Packages marked deprecated by the registry, with no release in several years, archived
repositories, or a single maintainer and no successor. Check publish dates and deprecation notices.

**Why it matters:** No security fixes will ever arrive, so today's clean audit is temporary and the
eventual migration is unplanned.

**Impact:** Removes dependencies that will never receive security fixes, converting an unplanned future migration into a controlled one.

**Fix:** Identify the maintained successor and migrate on a planned schedule. Where none exists,
isolate the package behind an interface to contain the future replacement.

---

### DEP-004 — Dependency scope errors

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** Build-time tooling (bundlers, plugins, generators, test libraries) listed under runtime
dependencies; unused packages still declared; the same library present at two versions.

**Why it matters:** Runtime images and attack surface grow with packages the application never
executes, and audit noise obscures real findings.

**Impact:** Reduces production image size and attack surface by shipping only the packages the application actually runs.

**Fix:** Move build-only packages to dev dependencies, remove unused declarations, and deduplicate
conflicting versions.

---

### DEP-005 — Unpinned or floating dependency versions

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** Wildcard or `latest` version ranges; no lockfile committed; install performed without the
frozen/CI flag so the lockfile is regenerated during the build.

**Why it matters:** The build's dependency set changes without a code change, so a green build today
proves nothing about tomorrow.

**Impact:** Makes builds deterministic so the dependency set changes only through a reviewed, deliberate update.

**Fix:** Commit the lockfile, install with the frozen flag in CI, and let the automated update process
propose version changes as reviewable PRs.

---

### DEP-006 — Licence compliance not assessed

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** commercial and distributed software
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Solution Architect
- **Effort:** 1–3

**Detect:** No licence inventory; copyleft licences present in a proprietary product; packages with no
declared licence; no policy defining acceptable licences.

**Why it matters:** Licence obligations can require source disclosure or block a commercial
distribution model, and the discovery usually happens during due diligence.

**Impact:** Establishes what the product's dependencies legally require, preventing licence conflicts from surfacing during due diligence or distribution.

**Fix:** Generate a licence inventory in CI, define an allowed-licence policy, and review exceptions
explicitly.

---

### DEP-007 — Vendored or forked dependencies without a maintenance path

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Copied third-party source in the repository, a private fork with local patches, or an
internal package with no owner, no changelog and no release process.

**Why it matters:** Upstream fixes never arrive and nobody knows how far the local copy has diverged.

**Impact:** Restores a maintenance path for locally-modified dependencies so upstream security fixes can actually be adopted.

**Fix:** Upstream the patches where possible, otherwise document the divergence, assign an owner, and
schedule periodic rebases onto upstream.

---

### DEP-008 — Excessive or overlapping dependencies

- **Dimension:** maintainability
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Multiple libraries solving the same problem (two date libraries, two HTTP clients, two
state managers); heavyweight packages used for a single trivial function.

**Why it matters:** Bundle size, audit surface and cognitive load all grow, and inconsistent usage
follows.

**Impact:** Reduces bundle size, upgrade burden and audit surface by consolidating on one library per concern.

**Fix:** Choose one library per concern and migrate; replace single-function heavyweight packages
with platform APIs.
