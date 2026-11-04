# Database — Relational (`DB`)

SQL Server, PostgreSQL, MySQL, Oracle. Load with `universal/data-integrity.md`.

---

### DB-001 — Dynamic SQL identifiers not allow-listed

- **Dimension:** security
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `ORDER BY`, column names, table names or `IN` lists built from request values. Note that
parameters cannot bind identifiers — this needs an allow-list, not a bind.

**Why it matters:** Sort and filter parameters are the most commonly overlooked injection vector
precisely because the developer knows values are bound elsewhere.

**Impact:** Removes injection risk from the dynamic parts of queries that parameter binding cannot cover.

**Fix:** Map the request value through a fixed enum onto a hardcoded column list. Build `IN` lists as
numbered bind placeholders, never by concatenating values.

---

### DB-002 — Missing or wrong indexes

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 1–3

**Detect:** Foreign keys without indexes; filter and sort columns unindexed; composite indexes whose
column order does not match the query; leading wildcards in `LIKE`; functions applied to indexed
columns in the `WHERE` clause; many unused indexes slowing writes.

**Why it matters:** Query cost tracks table size rather than result size, so performance degrades
continuously as data accumulates.

**Impact:** Improves query response times and reduces database load by matching indexes to the access patterns the application actually uses.

**Fix:** Derive indexes from real query plans, order composite columns by equality-then-range, avoid
wrapping indexed columns in functions, and drop indexes nothing uses.

---

### DB-003 — Long-running or wide transactions

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Transactions spanning external HTTP calls, file I/O or user think-time; bulk updates in one
statement against a large table; escalating lock scope; `SERIALIZABLE` used by default.

**Why it matters:** Locks are held for the duration, blocking other work and causing timeouts and
deadlocks that appear unrelated.

**Impact:** Reduces lock contention and deadlocks by keeping transactions short and scoped to the write itself.

**Fix:** Keep external calls outside transactions, batch large writes into chunks with commits between,
and use the lowest isolation level that meets the correctness requirement.

---

### DB-004 — No query performance visibility

- **Dimension:** observability
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 1–3

**Detect:** No slow query log; no plan review process; query timings not captured in application
telemetry; performance problems diagnosed by guesswork.

**Why it matters:** The slowest queries are usually not the ones the team suspects.

**Impact:** Makes the actual worst queries visible so optimisation effort is spent where it pays.

**Fix:** Enable slow query logging with a sensible threshold, review the top offenders by total time
rather than per-execution time, and record query duration in application telemetry.

---

### DB-005 — Schema design problems

- **Dimension:** data
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 3–8

**Detect:** Comma-separated values in a single column; entity-attribute-value tables used for core
domain data; wide tables with dozens of nullable columns; no natural or surrogate key; duplicated data
with no defined source of truth; JSON columns holding data that is queried and filtered.

**Why it matters:** The database cannot enforce, index or join on data it cannot see, so correctness
and performance both move into application code.

**Impact:** Lets the database enforce, index and join the data properly, improving both correctness and query performance.

**Fix:** Normalise multi-valued columns into related tables, model core entities explicitly, and
reserve JSON columns for genuinely schemaless payloads that are never filtered on.

---

### DB-006 — Stored procedure and trigger logic unmanaged

- **Dimension:** maintainability
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 3
- **Role:** Database Engineer
- **Effort:** 2–5

**Detect:** Business logic in stored procedures or triggers that are not in version control; triggers
performing cascading writes invisible to the application; procedures with no tests; logic split
unpredictably between application and database.

**Why it matters:** Behaviour changes with no code review and no deployment record, and debugging
requires knowing to look in the database.

**Impact:** Brings database-resident logic under the same version control, review and deployment discipline as application code.

**Fix:** Put procedures and triggers in migrations under version control, prefer explicit application
writes over trigger side effects, and document where logic deliberately lives in the database.

---

### DB-007 — Connection and permission hygiene

- **Dimension:** security
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Database Engineer
- **Effort:** 1–3

**Detect:** The application connecting as a database owner or `sa`; one shared account across
environments; DDL rights granted to the runtime account; firewall open to all addresses; no separation
between migration and runtime credentials.

**Why it matters:** A SQL injection or credential leak escalates from data access to full schema
control.

**Impact:** Limits the damage of any database credential compromise by granting the runtime only the rights it needs.

**Fix:** Give the runtime account DML rights only on the objects it uses, run migrations under a
separate elevated account, and restrict network access to known sources.

---

### DB-008 — Bulk operations performed row by row

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** all relational stores
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Imports and syncs looping over records issuing one insert or update each; ORM `save()`
inside a loop; no batching or bulk-copy path.

**Why it matters:** Per-row round trips dominate the runtime, turning a minute of work into hours.

**Impact:** Reduces bulk operation runtime by orders of magnitude through batched statements instead of per-row round trips.

**Fix:** Use multi-row inserts, bulk copy or the ORM's bulk API, batched at a size that keeps
transactions short.
