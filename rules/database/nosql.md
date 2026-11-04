# Database — NoSQL & Document Stores (`DB-NOSQL`)

MongoDB, DynamoDB, Cosmos DB, Firestore, Redis. Load with `universal/data-integrity.md`.

---

### DB-NOSQL-001 — Query injection through object operators

- **Dimension:** security
- **Layer:** Database
- **Applies to:** MongoDB and similar document stores
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Request bodies spread directly into a filter (`find(req.body)`); values reaching a query
without type checking, allowing `{"$ne": null}` or `{"$gt": ""}` to be submitted as a field value;
`$where` or `mapReduce` with request-derived JavaScript.

**Why it matters:** An attacker submits an operator object instead of a scalar and turns an equality
check — including a login check — into a match-anything query.

**Impact:** Prevents query-operator injection by ensuring request values are validated as scalars before reaching the datastore.

**Fix:** Validate every query input against a schema that requires a scalar type, construct filters
field by field, and never pass `$where` request content.

---

### DB-NOSQL-002 — Access patterns not modelled

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** DynamoDB, Cosmos DB, Firestore
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 3–8

**Detect:** Table scans used for common reads; a partition key with low cardinality or heavy skew;
relational-style normalisation with client-side joins; queries filtering on non-indexed attributes.

**Why it matters:** These stores are fast only along their key structure; anything else is a full scan
priced per item read.

**Impact:** Aligns the data model with the application's real access patterns, cutting both latency and per-request cost substantially.

**Fix:** Enumerate the access patterns first and design keys and indexes to serve them, denormalising
where reads dominate. Add secondary indexes only for patterns that genuinely need them.

---

### DB-NOSQL-003 — No schema validation on writes

- **Dimension:** data
- **Layer:** Database
- **Applies to:** document stores
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** No collection-level schema validation; documents of the same type with differing shapes
across eras; fields with mixed types; readers defensively handling every historic variant.

**Why it matters:** Schemaless becomes shape-chaotic, and every reader must handle every shape the
system has ever written.

**Impact:** Establishes a consistent document shape so readers can rely on structure instead of defending against every historic variant.

**Fix:** Apply schema validation at the collection level and in the application, version documents, and
migrate old shapes in a controlled backfill.

---

### DB-NOSQL-004 — Consistency model not understood

- **Dimension:** data
- **Layer:** Database
- **Applies to:** distributed stores
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Solution Architect
- **Effort:** 2–5

**Detect:** Read-after-write assumed on an eventually-consistent read; multi-document updates assumed
atomic without a transaction; conflict resolution undefined for concurrent writers; consistency level
left at the default without a decision.

**Why it matters:** Data appears correct in testing and diverges under real concurrency and replication
lag.

**Impact:** Makes consistency behaviour deliberate rather than accidental, preventing data divergence under real-world concurrency.

**Fix:** Choose the consistency level per operation, use the store's transaction support where
atomicity is required, and define conflict resolution explicitly.

---

### DB-NOSQL-005 — Unbounded documents or collections

- **Dimension:** scalability
- **Layer:** Database
- **Applies to:** document stores
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Database Engineer
- **Effort:** 2–4

**Detect:** Arrays appended to indefinitely inside a document; documents approaching the size limit; a
single partition growing without bound; no TTL on ephemeral data.

**Why it matters:** Every read and write of the document carries its entire history, and hard size
limits eventually cause outright write failures.

**Impact:** Keeps document and partition sizes bounded so read and write cost stays flat as the system ages.

**Fix:** Move growing collections into their own documents keyed by parent, cap embedded arrays, and
apply TTL to ephemeral data.

---

### DB-NOSQL-006 — Cache used as a system of record

- **Dimension:** data
- **Layer:** Database
- **Applies to:** Redis and similar caches
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** Business data stored only in the cache; no persistence configured; sessions or job state
with no durable backing; no defined behaviour when the cache is empty.

**Why it matters:** A cache restart or eviction is normal operation — and it silently destroys data
that exists nowhere else.

**Impact:** Ensures a cache restart or eviction is a performance event rather than a data-loss event.

**Fix:** Keep the durable copy in a persistent store and treat the cache as reconstructible. Where the
cache must hold state, enable persistence and replication deliberately.
