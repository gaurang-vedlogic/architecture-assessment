# Universal — Data Integrity & DB Health (`DAT`)

Applies to every codebase with a datastore. Load whenever persistence exists.

---

### DAT-001 — Destructive delete-then-insert without a transaction

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `DELETE FROM table` (unfiltered or broadly filtered) followed by an insert of freshly
computed data, outside a transaction. Common in refresh/sync/import routines.

**Why it matters:** A failure between the delete and the insert leaves the table empty, and there is
no automatic recovery.

**Impact:** Prevents accidental data loss, improves transactional integrity, and ensures rollback safety.

**Fix:** Wrap the operation in a transaction, or use an upsert/merge. For large refreshes, build into
a staging table and swap atomically.

---

### DAT-002 — Missing transaction boundaries on multi-step writes

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** A business operation writing to multiple tables through separate calls with no shared
transaction; partial-failure paths that leave related records inconsistent; a commit per statement.

**Why it matters:** Half-completed operations corrupt business state — an order without its lines, a
payment without its ledger entry.

**Impact:** Guarantees that multi-step business operations either complete fully or leave no trace, eliminating partially-written records.

**Fix:** Define the transaction at the service/use-case boundary so every write in one business
operation shares it, and let the framework roll back on exception.

---

### DAT-003 — No database constraints or referential integrity

- **Dimension:** data
- **Layer:** Database
- **Applies to:** relational stores
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 2–5

**Detect:** Nullable columns that are logically required, no foreign keys, no unique constraints on
natural keys, no check constraints, enums held as free text. Validation only in application code.

**Why it matters:** Every application path — plus scripts, imports and manual fixes — can write
invalid data, and eventually one does.

**Impact:** Enforces data correctness at the storage layer so invalid records cannot be written by any code path, script or manual operation.

**Fix:** Add NOT NULL, foreign keys, unique and check constraints to match the real business rules,
after cleaning the existing violations.

---

### DAT-004 — No versioned migrations

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Database Engineer
- **Effort:** 3–5

**Detect:** Schema changes applied by hand or via ad-hoc scripts; no migration tool; schema files
edited in place with no history; `CREATE TABLE IF NOT EXISTS` at application startup as the schema
mechanism.

**Why it matters:** Environments diverge silently and there is no reliable way to bring a fresh
environment to the current schema.

**Impact:** Makes schema changes versioned, reviewable and repeatable across every environment, eliminating drift and manual deployment steps.

**Fix:** Adopt a migration tool, baseline the current schema, and apply migrations through the
pipeline. Keep migrations forward-only and backwards-compatible for one release.

---

### DAT-005 — Schema created or mutated at application startup

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** `create_all()`, `EnsureCreated()`, `synchronize: true`, or DDL executed on boot in
production code paths.

**Why it matters:** Multiple instances racing to alter the schema, unreviewed structural changes, and
no rollback — schema evolution becomes a side effect of a deploy.

**Impact:** Separates schema evolution from application startup so structural changes are deliberate, reviewed and safely rolled back.

**Fix:** Remove startup DDL and move all schema changes into migrations run as an explicit deployment
step.

---

### DAT-006 — No backup or unverified restore

- **Dimension:** data
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** No documented backup schedule; backups configured but never restored; no defined RPO/RTO;
backups stored in the same account or region as the primary.

**Why it matters:** An untested backup is a hypothesis. Many organisations discover theirs was
incomplete only during a real recovery.

**Impact:** Turns data recovery from an assumption into a verified capability with known recovery time and data-loss bounds.

**Fix:** Define RPO/RTO, automate backups with off-account/off-region copies, and perform a scheduled
restore drill to prove the process end to end.

---

### DAT-007 — Data races on concurrent updates

- **Dimension:** data
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Read-modify-write sequences without optimistic concurrency (version/rowversion/ETag) or
row locking; counters incremented in application code; "last write wins" on shared records.

**Why it matters:** Concurrent edits silently discard one user's changes, and counters drift from
reality — with no error anywhere.

**Impact:** Prevents concurrent updates from silently overwriting each other, protecting the correctness of shared records and counters.

**Fix:** Add a version column with optimistic concurrency checks, or perform the update atomically in
the database rather than in application code.

---

### DAT-008 — Inappropriate data types or precision

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 2–5

**Detect:** Money stored as float/double; dates as strings; booleans as varchar; everything as
`nvarchar(max)`; timestamps without timezone; identifiers as text where a typed key exists.

**Why it matters:** Floating-point money produces rounding errors in financial output, and untyped
columns defeat both constraints and indexing.

**Impact:** Guarantees numeric and temporal correctness — particularly for financial values — and restores the database's ability to validate and index effectively.

**Fix:** Use decimal/numeric with explicit precision for money, native date/time types with timezone
awareness, and native boolean types. Migrate with a data-conversion step.

---

### DAT-009 — Timezone handling inconsistent

- **Dimension:** data
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Full-Stack Engineer
- **Effort:** 2–4

**Detect:** Mixed naive and aware datetimes; server local time used for storage; local dates produced
via `toISOString().split('T')[0]`; timezone conversion applied inconsistently between client and
server.

**Why it matters:** Off-by-one-day errors on dates near midnight, which corrupt validity periods,
reporting boundaries and audit records.

**Impact:** Eliminates off-by-one date errors by handling instants and calendar dates distinctly and consistently across the stack.

**Fix:** Store instants in UTC with timezone-aware types; store calendar dates as date types; convert
for display only, using a local-date helper rather than UTC serialisation.

---

### DAT-010 — Uncontrolled data growth and no retention policy

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Database Engineer
- **Effort:** 2–5

**Detect:** Log, event, audit or soft-deleted rows accumulating forever; no archival or partitioning;
tables growing without a purge strategy; personal data retained past its lawful basis.

**Why it matters:** Query performance degrades continuously, storage cost grows, and retaining
personal data indefinitely creates regulatory exposure.

**Impact:** Keeps query performance and storage cost stable as the system ages, and aligns personal-data retention with policy.

**Fix:** Define retention per data class, implement archival or partition-drop, and schedule purges
with an audit record of what was removed.

---

### DAT-011 — Soft-delete implemented inconsistently

- **Dimension:** data
- **Layer:** Backend
- **Applies to:** systems using soft deletes
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** An `is_deleted`/`deleted_at` column filtered by some queries and not others; unique
constraints that ignore deleted rows; reports including deleted records; cascade behaviour undefined.

**Why it matters:** Deleted records reappear in some views and not others, producing inconsistent
numbers that nobody can explain.

**Impact:** Makes deletion behave consistently everywhere, removing a common source of contradictory reports and reappearing records.

**Fix:** Enforce the filter centrally with a global query filter or view, and define cascade
behaviour for related records explicitly.

---

### DAT-012 — Sensitive data stored without protection

- **Dimension:** data
- **Layer:** Database
- **Applies to:** systems holding personal, financial or health data
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Security Engineer
- **Effort:** 3–8

**Detect:** National identifiers, payment details, health data or credentials stored in plaintext; no
encryption at rest; non-production environments seeded with real production data; no column-level
protection for the most sensitive fields.

**Why it matters:** A single database exposure becomes a reportable breach with regulatory
consequences.

**Impact:** Limits breach impact and supports regulatory compliance by protecting the most sensitive fields at rest and keeping real personal data out of non-production environments.

**Fix:** Enable encryption at rest, apply column-level encryption or tokenisation to the most
sensitive fields, and mask or synthesise data used in non-production environments.

---

### DAT-013 — Unbounded or unfiltered reads of full tables

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Queries loading a whole table per request to filter in application code; a `limit`
parameter accepted by the API but never applied to the query; reference data re-read on every call.

**Why it matters:** Database load and response time scale with total data volume instead of the
result the user asked for.

**Impact:** Bounds each query's cost to the data actually requested, keeping response times stable as the dataset grows.

**Fix:** Push filtering, sorting and limiting into the query; verify that API paging parameters
actually reach the SQL; cache stable reference data.
