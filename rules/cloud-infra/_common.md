# Cloud & Infrastructure — Common (`INF`)

Load for any deployed system, alongside `universal/devops-delivery.md`.

---

### INF-001 — Public network exposure of internal services

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** all cloud platforms
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Databases, caches, message brokers or admin interfaces reachable from the internet;
firewall rules allowing `0.0.0.0/0`; storage containers set to public; management ports open.

**Why it matters:** Internet-reachable data services are found by automated scanners within hours and
are the most common source of mass data exposure.

**Impact:** Removes internal services from the public internet, eliminating the most commonly exploited exposure path.

**Fix:** Place data services on private networking with access via private endpoints or a bastion,
restrict management access to known ranges, and audit public storage.

---

### INF-002 — No resource limits or autoscaling

- **Dimension:** scalability
- **Layer:** Infrastructure
- **Applies to:** all cloud platforms
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Containers with no CPU/memory requests or limits; fixed instance counts with no scaling
rules; scaling driven by a metric unrelated to load; no maximum, so cost can run away.

**Why it matters:** One misbehaving workload starves its neighbours, and traffic spikes are absorbed by
failing rather than scaling.

**Impact:** Keeps workloads isolated from each other and lets capacity follow demand within a controlled cost ceiling.

**Fix:** Set requests and limits from observed usage, define scaling rules on a metric that tracks real
load, and set both floor and ceiling.

---

### INF-003 — Single points of failure

- **Dimension:** scalability
- **Layer:** Infrastructure
- **Applies to:** all cloud platforms
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 3–8

**Detect:** One instance of a stateful service; a single availability zone; no database replica or
failover; local disk holding state that must survive; a scheduler running on one node.

**Why it matters:** Routine maintenance by the cloud provider becomes an outage.

**Impact:** Removes the components whose individual failure takes the whole system down, so routine infrastructure events stop causing outages.

**Fix:** Run at least two instances of stateless services across zones, enable database replication and
tested failover, and move state off local disk.

---

### INF-004 — Infrastructure changes made outside the pipeline

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all cloud platforms
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** Portal changes that IaC does not reflect; drift between declared and actual state; no drift
detection; manual fixes applied during incidents and never codified.

**Why it matters:** The code stops describing reality, so applying it becomes dangerous — and then
nobody applies it.

**Impact:** Keeps infrastructure code an accurate description of reality, so it can be safely applied and relied upon for recovery.

**Fix:** Run drift detection on a schedule, reconcile findings back into code, and restrict portal
write access in production to break-glass accounts.

---

### INF-005 — No cost visibility or controls

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all cloud platforms
- **Criticality:** Low | **Priority:** P2 | **Phase:** 3
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** No resource tagging; no budget alerts; oversized instances left from a load test; orphaned
disks, snapshots and public IPs; non-production environments running continuously.

**Why it matters:** Spend grows silently and is discovered as an annual finance problem rather than an
engineering one.

**Impact:** Makes spend attributable and bounded, turning cloud cost into a managed engineering metric.

**Fix:** Enforce tagging by owner and environment, set budget alerts, schedule non-production shutdown,
and review orphaned resources regularly.

---

### INF-006 — Disaster recovery undefined or untested

- **Dimension:** devops
- **Layer:** Infrastructure
- **Applies to:** all cloud platforms
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 3–8

**Detect:** No documented RTO/RPO; no rebuild procedure; backups in the same account or region as the
primary; recovery never rehearsed.

**Why it matters:** Recovery capability that has never been exercised is an assumption, and account- or
region-level failures take the backups with them.

**Impact:** Converts recovery from an assumption into a rehearsed procedure with known time and data-loss bounds.

**Fix:** Define RTO/RPO with the business, keep backups in a separate account and region, document the
rebuild path, and rehearse it at least annually.
