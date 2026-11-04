# Cloud & Infrastructure — AWS (`INF-AWS`)

Load with `cloud-infra/_common.md`.

---

### INF-AWS-001 — Over-permissive IAM policies

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** AWS
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** `"Action": "*"` or `"Resource": "*"` in role policies; managed policies such as
`AdministratorAccess` or `PowerUserAccess` attached to workload roles; long-lived IAM user access keys
in application configuration; one shared role across services.

**Why it matters:** Any single compromised component becomes account-wide control.

**Impact:** Limits the blast radius of any compromise by granting each workload only the actions and resources it needs.

**Fix:** Replace wildcards with scoped, per-workload roles derived from actual usage (via Access
Analyzer), and eliminate static access keys in favour of instance or task roles.

---

### INF-AWS-002 — S3 bucket exposure and encryption gaps

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** AWS
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Block Public Access disabled; bucket policies granting `*` principal; no default
encryption; no versioning on buckets holding important data; access logging off; presigned URLs with
long expiry.

**Why it matters:** Public buckets remain one of the most common causes of large-scale data exposure.

**Impact:** Closes the most common cloud data-exposure path and ensures stored objects are encrypted and recoverable.

**Fix:** Enable Block Public Access at account and bucket level, enforce default encryption and
versioning, enable access logging, and keep presigned URL lifetimes short.

---

### INF-AWS-003 — Lambda configuration problems

- **Dimension:** scalability
- **Layer:** Infrastructure
- **Applies to:** AWS Lambda
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** Clients and connections created inside the handler rather than outside it; no reserved or
provisioned concurrency on latency-sensitive functions; database connections opened per invocation
exhausting the pool at scale; no dead-letter queue; timeouts longer than the caller's; secrets in
environment variables in plaintext.

**Why it matters:** Cold-start cost is paid on every invocation, and concurrency scaling turns into a
connection flood against the database.

**Impact:** Reduces cold-start latency and prevents scaling events from overwhelming downstream databases.

**Fix:** Initialise clients outside the handler for reuse, front relational databases with RDS Proxy,
set concurrency limits, configure a dead-letter queue, and source secrets from Secrets Manager.

---

### INF-AWS-004 — VPC and network exposure

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** AWS
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** Security groups allowing `0.0.0.0/0` on database, SSH or RDP ports; RDS instances marked
publicly accessible; workloads in public subnets with public IPs; no VPC endpoints so traffic to AWS
services traverses the internet.

**Why it matters:** Directly reachable data services are found and attacked within hours of exposure.

**Impact:** Removes data services from the public internet and keeps service traffic on private paths.

**Fix:** Place data stores in private subnets, scope security groups to source security groups rather
than CIDR ranges, disable public accessibility on RDS, and add VPC endpoints.

---

### INF-AWS-005 — No CloudWatch alarms or centralised logging

- **Dimension:** observability
- **Layer:** Infrastructure
- **Applies to:** AWS
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–3

**Detect:** No alarms on error rate, latency, throttling or queue depth; log groups with infinite
retention (or none); no CloudTrail; no X-Ray tracing on multi-service paths.

**Why it matters:** Failures are discovered by users, and audit evidence is either missing or
accumulating cost indefinitely.

**Impact:** Provides proactive failure detection and an auditable record of platform activity with controlled retention cost.

**Fix:** Alarm on user-facing symptoms, set log retention per class, enable CloudTrail
account-wide, and add tracing to multi-service request paths.

---

### INF-AWS-006 — RDS configuration and resilience

- **Dimension:** data
- **Layer:** Database
- **Applies to:** AWS RDS/Aurora
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 2–4

**Detect:** Multi-AZ disabled on production; automated backups with a short or zero retention window;
no deletion protection; encryption at rest disabled; no Performance Insights; a single writer with no
read replica under read-heavy load.

**Why it matters:** A single instance failure or an accidental deletion becomes unrecoverable data loss.

**Impact:** Makes the database survivable through instance failure and accidental deletion, with the visibility needed to tune it.

**Fix:** Enable Multi-AZ, set backup retention to the agreed RPO, turn on deletion protection and
encryption at rest, and add read replicas where reads dominate.
