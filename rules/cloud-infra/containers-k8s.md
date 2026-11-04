# Cloud & Infrastructure — Containers & Kubernetes (`INF-K8S`)

Load with `cloud-infra/_common.md`.

---

### INF-K8S-001 — No `securityContext` on workloads

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** Kubernetes
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** No `securityContext` block in any workload manifest; `privileged: true`; missing
`runAsNonRoot`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem` or capability drops. A
`USER` line in the Dockerfile is image intent, not orchestration enforcement.

**Why it matters:** The orchestrator runs the container with far more privilege than it needs,
regardless of what the image intended.

**Impact:** Enforces least-privilege container execution at the orchestration layer, limiting what a compromised workload can do to its node.

**Fix:** Set `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true` and
`capabilities.drop: [ALL]` on every workload, enforced by an admission policy.

---

### INF-K8S-002 — No liveness or readiness probes

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** Kubernetes
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** Deployments with no `livenessProbe` or `readinessProbe`; probes pointing at a static
endpoint that cannot fail; readiness identical to liveness; no `startupProbe` on a slow-starting
service.

**Why it matters:** Traffic is routed to instances that cannot serve, and instances that have hung are
never restarted.

**Impact:** Lets the platform withdraw and restart unhealthy instances automatically, making dependency outages self-healing.

**Fix:** Point liveness at a shallow process check and readiness at a dependency check, with a startup
probe for slow boots and thresholds tuned to avoid restart loops.

---

### INF-K8S-003 — Secrets stored as plain Kubernetes secrets

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** Kubernetes
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 2–4

**Detect:** Secret manifests committed to the repository (base64 is encoding, not encryption); no
external secret operator; secrets mounted as environment variables into every container; no encryption
at rest for etcd.

**Why it matters:** Repository access becomes production credential access, and there is no rotation
path.

**Impact:** Removes credentials from version control and enables auditable, rotatable secret delivery from a managed store.

**Fix:** Source secrets from a managed store via an external-secrets operator or CSI driver, mount only
where needed, and enable encryption at rest.

---

### INF-K8S-004 — No resource requests, limits or disruption budgets

- **Dimension:** scalability
- **Layer:** Infrastructure
- **Applies to:** Kubernetes
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** Containers with no `resources.requests`/`limits`; no `PodDisruptionBudget`; single-replica
deployments for user-facing services; no anti-affinity so all replicas land on one node.

**Why it matters:** The scheduler cannot place workloads sensibly, one workload starves its neighbours,
and a node drain takes the service down.

**Impact:** Ensures reliable scheduling and keeps services available through node maintenance and rescheduling.

**Fix:** Set requests and limits from observed usage, define disruption budgets, run at least two
replicas of user-facing services, and spread them across nodes.

---

### INF-K8S-005 — No network policies

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** Kubernetes
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** No `NetworkPolicy` resources, so every pod can reach every other pod and all egress
destinations.

**Why it matters:** A single compromised pod can reach the whole cluster and exfiltrate freely.

**Impact:** Contains lateral movement so a compromise of one workload does not become access to the entire cluster.

**Fix:** Default-deny ingress and egress per namespace, then allow the specific flows each workload
needs.

---

### INF-K8S-006 — Image build and supply-chain hygiene

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** containers
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Untagged or `latest` base images; `imagePullPolicy: Always` against a mutable tag; no image
scanning in the pipeline; build secrets present in image layers; images never rebuilt for base CVEs.

**Why it matters:** Deployments are not reproducible and known base-image vulnerabilities ship
indefinitely.

**Impact:** Makes deployed images reproducible and continuously patched against known base-image vulnerabilities.

**Fix:** Pin base images by digest, deploy by immutable tag or digest, scan images in the pipeline, use
build-time secret mounts, and rebuild on a schedule.
