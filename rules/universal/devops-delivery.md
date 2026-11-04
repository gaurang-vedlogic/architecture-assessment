# Universal — DevOps & Delivery (`DVO`)

Applies to every codebase. Load always.

---

### DVO-001 — No CI pipeline

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 3–5

**Detect:** No `.github/workflows/`, `.gitlab-ci.yml`, `azure-pipelines.yml`, `Jenkinsfile` or
equivalent; builds run on a developer machine.

**Why it matters:** Nothing is verified consistently, and "works on my machine" is the only test.

**Impact:** Establishes a repeatable, automated verification of every change, catching breakage before it reaches a shared environment.

**Fix:** Add a pipeline running install, build, lint, type-check and tests on every push and PR.
Start minimal; expand once it is green and trusted.

---

### DVO-002 — CI exists but does not run the tests or quality checks

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** A pipeline that only builds or only lints; test steps present but with
`continue-on-error`/`|| true`; test job excluded from required checks; only one side of a monorepo
tested.

**Why it matters:** A green pipeline signals safety that was never verified, which is worse than no
pipeline.

**Impact:** Makes the pipeline's green status meaningful by ensuring every merge has actually passed the tests and quality gates.

**Fix:** Run all suites on every PR, fail the build on failure, and mark the job as a required check.

---

### DVO-003 — Manual or partially manual deployment

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 3–8

**Detect:** Deployment documented as a runbook of manual steps; files copied to servers; config edited
in place; releases requiring a specific person.

**Why it matters:** Deployments are risky, rare and unrepeatable, and rollback is improvised under
pressure.

**Impact:** Makes releases repeatable and low-risk through automation, reducing deployment errors and enabling faster, more frequent delivery.

**Fix:** Automate build-once/deploy-many with environment promotion, an automated smoke check and a
documented, tested rollback.

---

### DVO-004 — No branch protection or review requirement

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 0.5

**Detect:** Direct pushes to the main/release branch permitted; no required approving review; no
required status checks; force-push allowed.

**Why it matters:** Unreviewed changes reach production, and the branch history can be rewritten,
destroying the audit trail.

**Impact:** Ensures every production change is reviewed and has passed automated checks, catching defects before they ship.

**Fix:** Protect the default and release branches: require at least one approving review, require
status checks to pass, and disallow force-push and deletion.

---

### DVO-005 — No Infrastructure as Code

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** cloud-hosted systems
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 8–15

**Detect:** Cloud resources created through a portal; no Terraform/Bicep/CloudFormation/Pulumi in the
repo; environments differing in ways nobody can enumerate.

**Why it matters:** Environments drift, disaster recovery is untested, and reproducing production is
impossible.

**Impact:** Makes infrastructure reproducible and reviewable, eliminating environment drift and turning disaster recovery into a routine, tested operation.

**Fix:** Codify existing infrastructure by importing current state, then apply changes only through
the pipeline.

---

### DVO-006 — Container image not hardened or not pinned

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** containerised systems
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** `FROM ubuntu` / `FROM node` with no tag or digest; container running as root; build tools
and secrets left in the final layer; no multi-stage build; image never rebuilt for base CVEs.

**Why it matters:** Builds are irreproducible and a container compromise starts with root privileges.

**Impact:** Produces reproducible, minimally-privileged images, reducing both build variance and the impact of any container compromise.

**Fix:** Pin the base image to a specific tag or digest, use multi-stage builds, run as a non-root
user, and rebuild on a schedule to absorb base image patches.

---

### DVO-007 — No orchestration-level security context

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** Kubernetes and similar orchestrators
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** No `securityContext` on workloads; privileged containers; no `runAsNonRoot`,
`allowPrivilegeEscalation: false`, `readOnlyRootFilesystem` or capability drops. A `USER` line in the
Dockerfile is not orchestration-level enforcement.

**Why it matters:** The orchestrator will happily run the container with more privilege than it needs,
regardless of image intent.

**Impact:** Enforces least-privilege container execution at the orchestration layer, limiting what a compromised workload can do to its host.

**Fix:** Set `runAsNonRoot`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true` and
drop all capabilities on every workload; enforce with an admission policy.

---

### DVO-008 — Secrets managed manually or committed to config

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 2–4

**Detect:** Secrets pasted into pipeline variables by hand with no rotation, plain Kubernetes secrets
with no external source, `.env` files distributed over chat, shared credentials across environments.

**Why it matters:** Nobody knows who holds which secret or when it last changed, and rotation is
impossible in practice.

**Impact:** Centralises secret storage and injection with auditable access and practical rotation, reducing both exposure and operational risk.

**Fix:** Source secrets from a managed store, inject at deploy/run time, separate per environment, and
establish a rotation schedule.

---

### DVO-009 — No environment separation

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 3–8

**Detect:** One environment serving both development and production; test data in the production
database; production credentials on developer machines; shared database across environments.

**Why it matters:** Experiments affect real customers and real data, and there is nowhere safe to
verify a change.

**Impact:** Provides a safe place to verify changes before customers see them, removing an entire class of avoidable production incident.

**Fix:** Stand up at least one non-production environment with its own data and credentials, and
promote builds through it.

---

### DVO-010 — No rollback path

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 2–4

**Detect:** No versioned artifacts, no way to redeploy a previous release, irreversible database
migrations applied automatically, rollback documented as "redeploy from an older commit and hope".

**Why it matters:** Recovery time during an incident is unbounded and the only option is to fix
forward under pressure.

**Impact:** Bounds incident recovery time by making the previous known-good release redeployable on demand.

**Fix:** Version and retain artifacts, make migrations backwards-compatible for one release, and
rehearse rollback so it is a known procedure rather than an improvisation.

---

### DVO-011 — No dependency update or vulnerability scanning process

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** No Dependabot/Renovate configuration, no SCA step (`npm audit`, `pip-audit`,
`dotnet list package --vulnerable`, Snyk) in CI, lockfile untouched for years.

**Why it matters:** Known, published vulnerabilities remain exploitable indefinitely and upgrades
accumulate into an unaffordable migration.

**Impact:** Ensures CVE coverage no longer depends on someone remembering to check, and keeps upgrades small and continuous rather than large and risky.

**Fix:** Enable automated update PRs and add an SCA step to CI that fails the build on high-severity
findings, with a documented triage path.

---

### DVO-012 — No supply-chain cooldown or provenance control

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** Automated dependency updates with no minimum-age/cooldown window; no lockfile committed;
install scripts allowed to run unrestricted; no integrity verification.

**Why it matters:** A compromised package release is pulled into the build within hours, before the
ecosystem has detected and yanked it.

**Impact:** Closes the day-zero supply-chain window by ensuring newly published package versions age before they can enter the build.

**Fix:** Configure an update cooldown (e.g. 7 days), commit lockfiles, enable the package manager's
minimum-age gate, and restrict lifecycle scripts.

---

### DVO-013 — Build not reproducible

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 2–4

**Detect:** No lockfile or lockfile ignored at install; floating version ranges resolved at build
time; toolchain version unpinned; the same commit producing different artifacts.

**Why it matters:** A build that succeeded yesterday can fail today with no code change, and you
cannot reproduce a shipped artifact to debug it.

**Impact:** Guarantees the same commit always produces the same artifact, making builds trustworthy and past releases reproducible for debugging.

**Fix:** Commit lockfiles, install with the frozen/CI flag, pin the toolchain version in the
repository, and pin base images.

---

### DVO-014 — No release traceability

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** Deployed version not discoverable at runtime; no tags; no changelog; no way to map a
running instance to a commit.

**Why it matters:** During an incident you cannot establish what is actually running, so you cannot
tell whether the suspect change is even deployed.

**Impact:** Makes it possible to map any running instance back to its exact commit, removing guesswork from incident response.

**Fix:** Stamp version and commit into the artifact, expose them on a version endpoint, and tag
releases in version control.
