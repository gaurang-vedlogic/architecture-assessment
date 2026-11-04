# Universal — Security Posture (`SEC`)

Applies to every codebase. Load always.

---

### SEC-001 — SQL injection via string interpolation

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack issuing SQL
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 3–8 (≈0.25/query, floor 3 for the sweep)

**Detect:** Query strings built with f-strings, template literals, `+` concatenation, `%` formatting
or `String.format` where any operand is request-derived. Grep for `SELECT|INSERT|UPDATE|DELETE`
adjacent to interpolation syntax; also check ORM `raw()` / `execute()` / `queryRaw` escapes.

**Why it matters:** The attacker controls the query, not just the value. Reads, writes and schema
changes become reachable from a public endpoint.

**Impact:** Improves database security by enforcing parameterised queries, preventing unauthorised query manipulation, and reducing risk of data breaches or database compromise.

**Fix:** Replace interpolation with bound parameters everywhere. Where a dynamic identifier (table or
column name) is genuinely required, validate it against an allow-list.

---

### SEC-002 — Hardcoded credentials or secrets in source

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 1–2 per secret cluster

**Detect:** API keys, connection strings, client secrets, private keys, passwords, SAS tokens
committed in source, `.env` files tracked in git, config files, mobile bundles or frontend code.
Grep for `password|secret|api[_-]?key|connectionstring|BEGIN PRIVATE KEY|AccountKey=`.

**Why it matters:** Anyone with repository read access — including a leaked clone or a former
contractor — holds production credentials. Frontend and mobile secrets are public by definition.

**Impact:** Reduces security risk, prevents credential leakage, improves compliance, and enables safer deployments.

**Fix:** Move secrets to a managed store (Key Vault / Secrets Manager / Parameter Store) injected at
runtime. **Rotate every exposed secret** — removing it from HEAD does not remove it from history.
Add a secret scanner to CI.

---

### SEC-003 — Auth token stored in `localStorage` / `sessionStorage`

- **Dimension:** security
- **Layer:** Frontend
- **Applies to:** web frontends
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** `localStorage.setItem` / `sessionStorage` holding tokens; auth library config with
`cacheLocation: "localStorage"`; tokens visible in browser dev tools Application tab.

**Why it matters:** Any XSS payload — including one from a third-party dependency — can read the
token silently and exfiltrate a live session.

**Impact:** Reduces account-takeover risk by keeping session tokens out of JavaScript-readable storage and limiting the blast radius of any cross-site scripting flaw.

**Fix:** Prefer `HttpOnly; Secure; SameSite` cookies. Where the SPA flow requires token access, keep
it in memory only with silent renewal, and pair with a strict CSP.

---

### SEC-004 — Missing input validation at the trust boundary

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2 per endpoint cluster

**Detect:** Handlers reading `request.body` / query / path params and using them directly without a
schema. Absence of a validation library (Zod, Pydantic, FluentValidation, Joi, Bean Validation).
Type annotations alone are not validation in dynamically-typed stacks.

**Why it matters:** Unvalidated input flows into queries, file paths, external calls and the database,
turning every downstream weakness into an exploitable one.

**Impact:** Prevents invalid data processing, reduces runtime errors, improves API reliability, and enhances type safety.

**Fix:** Define a schema per endpoint and validate at the boundary, rejecting with a structured 4xx.
Validate type, range, length, format and allowed values — not just presence.

---

### SEC-005 — Broken or missing authorisation on endpoints

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Endpoints with authentication but no ownership/role check; resource IDs taken from the
request and queried without scoping to the caller (IDOR); admin routes distinguished only by URL;
authorisation enforced in the UI but not the API.

**Why it matters:** Any authenticated user can read or modify another tenant's data by changing an ID.

**Impact:** Enforces correct access control across all resources, preventing cross-account data access and ensuring users can only reach records they own.

**Fix:** Scope every query by the caller's identity/tenant. Centralise authorisation in middleware or
a policy layer rather than repeating checks per handler.

---

### SEC-006 — Transport security disabled or weakened

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** `TrustServerCertificate=True`, `rejectUnauthorized: false`, `verify=False`,
`ServerCertificateValidationCallback` returning true, `NSAllowsArbitraryLoads`, `usesCleartextTraffic`,
plain `http://` endpoints in config.

**Why it matters:** Certificate validation is what makes TLS meaningful. Disabled, the connection is
encrypted to whoever is in the middle.

**Impact:** Improves transport security by enforcing proper certificate validation, ensuring encrypted and trusted connections, and reducing risk of intercepted or tampered communication.

**Fix:** Remove the bypass and install the correct certificate chain. If a private CA is used, trust
that CA explicitly rather than disabling validation.

---

### SEC-007 — Command / shell injection and unsafe subprocess execution

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack invoking external processes
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** `exec`, `system`, `subprocess` with `shell=True`, `Runtime.exec`, backticks, or any
process invocation with a request-derived argument. Also flags dangerous tool flags such as
`--shell-escape`, `--allow-run`, `-e` on interpreters.

**Why it matters:** Remote code execution on the application host, typically with the app's full
privileges and network access.

**Impact:** Eliminates remote code execution risk by removing shell interpretation from external process calls and constraining what the application can invoke.

**Fix:** Pass arguments as an array without a shell. Validate against an allow-list. Remove
permissive engine flags. Run the process sandboxed and with a timeout.

---

### SEC-008 — Path traversal / unrestricted file access

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack serving or writing files
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** File paths built by joining a request value onto a base directory without normalising;
download/preview endpoints taking a filename or path parameter; archive extraction without entry-path
checks (zip-slip).

**Why it matters:** `../../` reaches configuration files, keys and other tenants' uploads.

**Impact:** Prevents unauthorised file system access by constraining all file operations to their intended directory, protecting configuration, credentials and other users' data.

**Fix:** Resolve the path, assert it stays inside the base directory, and prefer opaque IDs mapped to
storage keys over user-supplied filenames.

---

### SEC-009 — No file upload restrictions

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack accepting uploads
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** Upload handlers with no size cap, no count cap per request, no content-type allow-list,
and no magic-byte verification. Client-side `accept` attributes only.

**Why it matters:** A single request can exhaust disk or memory; an executable content type stored in
a served directory becomes a web shell.

**Impact:** Improved platform stability, predictable resource consumption, reduced abuse risk, and safer handling of upload workloads.

**Fix:** Enforce size and count limits server-side, verify type by magic bytes rather than extension,
store outside the web root with generated names, and scan where the risk profile warrants it.

---

### SEC-010 — Sensitive data exposed in logs, errors or responses

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** Logging whole request/response bodies, tokens, passwords or PII; stack traces returned to
clients; verbose error handlers in production; `console.log` of auth objects.

**Why it matters:** Logs are widely readable and long-lived; stack traces hand an attacker the
internal structure of the system.

**Impact:** Protects sensitive information by removing credentials and personal data from logs and client-facing errors, improving compliance posture and reducing information disclosure.

**Fix:** Redact at the logger with a field allow/deny list. Return a generic error plus a correlation
ID to clients; keep detail server-side.

---

### SEC-011 — Missing or permissive CORS configuration

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any HTTP API
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 0.5–1

**Detect:** `Access-Control-Allow-Origin: *` combined with credentials, origin reflected from the
request header, wildcard methods/headers, or CORS middleware applied globally with defaults.

**Why it matters:** A reflected origin with credentials lets any site make authenticated requests on
behalf of a logged-in user.

**Impact:** Restricts cross-origin access to known clients, preventing untrusted sites from making authenticated requests against the API.

**Fix:** Allow-list explicit origins per environment. Never combine wildcard origin with credentials.

---

### SEC-012 — Missing security headers / Content Security Policy

- **Dimension:** security
- **Layer:** Frontend
- **Applies to:** web applications
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 1–2

**Detect:** No `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`,
`X-Frame-Options`/`frame-ancestors`, or `Referrer-Policy` on responses.

**Why it matters:** These headers are the cheapest available defence-in-depth against XSS,
clickjacking and protocol downgrade.

**Impact:** Strengthens browser-side defences against script injection, clickjacking and protocol downgrade with no application code change.

**Fix:** Set headers at the edge (CDN, reverse proxy or framework middleware). Roll CSP out in
report-only mode first, then enforce.

---

### SEC-013 — Cross-site scripting via unsanitised rendering

- **Dimension:** security
- **Layer:** Frontend
- **Applies to:** web applications
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Frontend Engineer
- **Effort:** 1–3

**Detect:** `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`, `bypassSecurityTrust*`, direct
`element.innerHTML =`, or templating with escaping disabled — where content is user- or API-derived.

**Why it matters:** Script execution in the user's session: token theft, request forgery, full
account takeover.

**Impact:** Eliminates script injection paths in the UI, protecting user sessions and preventing malicious content from executing in the browser.

**Fix:** Render as text. Where HTML is genuinely required, sanitise with a maintained library
(DOMPurify) against a strict allow-list, and back it with a CSP.

---

### SEC-014 — Weak or missing rate limiting and brute-force protection

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any public API
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–3

**Detect:** No rate limiting on login, password reset, OTP, search or export endpoints. No account
lockout or progressive delay. No throttling on expensive operations.

**Why it matters:** Credential stuffing, enumeration and scraping proceed unimpeded, and one client
can degrade service for everyone.

**Impact:** Protects authentication and expensive endpoints from abuse, improving availability and reducing credential-stuffing and scraping risk.

**Fix:** Apply per-identity and per-IP limits at the gateway, with stricter limits on auth and export
paths. Return `429` with `Retry-After`.

---

### SEC-015 — Weak password / session / token handling

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack managing its own auth
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–5

**Detect:** Passwords hashed with MD5/SHA1 or unsalted; tokens without expiry; JWTs with `alg: none`
accepted, weak/shared signing secrets, or no signature verification; no logout/refresh-token
revocation; session fixation.

**Why it matters:** A breached database becomes a plaintext credential list; a forgeable token
becomes universal access.

**Impact:** Strengthens identity security through modern password hashing, verified token signatures and enforced expiry, protecting accounts even if the datastore is exposed.

**Fix:** Use bcrypt/argon2/scrypt with per-user salts. Verify token signature *and* issuer, audience
and expiry. Support revocation.

---

### SEC-016 — Insecure direct use of randomness or cryptography

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 1–2

**Detect:** `Math.random()`, `random.random()`, `rand()` used for tokens, IDs, OTPs or password
resets. Hand-rolled encryption, ECB mode, hardcoded/static IVs, deprecated ciphers (DES, RC4).

**Why it matters:** Predictable values defeat the control entirely — a guessable reset token is a
free account takeover.

**Impact:** Ensures security-sensitive values are unpredictable and encryption follows vetted standards, closing off guessing and cryptanalysis attacks.

**Fix:** Use the platform CSPRNG (`crypto.randomBytes`, `secrets`, `SecureRandom`). Use vetted
high-level crypto APIs with authenticated modes; never roll your own.

---

### SEC-017 — Server-side request forgery (SSRF)

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** any stack fetching a URL supplied or influenced by a client
- **Criticality:** High | **Priority:** P1 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–3

**Detect:** HTTP clients, webhook registration, image/PDF fetchers or "import from URL" features
taking a client-supplied address with no allow-list.

**Why it matters:** The server becomes a proxy into the private network, including cloud metadata
endpoints that hand out instance credentials.

**Impact:** Prevents the application from being used to reach internal network services, protecting cloud credentials and private infrastructure from external probing.

**Fix:** Allow-list schemes, hosts and ports; resolve DNS and reject private/link-local ranges;
disable redirects or re-validate each hop; egress-restrict at the network level.

---

### SEC-018 — Insecure deserialisation / unsafe dynamic evaluation

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** all
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 2–4

**Detect:** `pickle.loads`, `yaml.load` without `SafeLoader`, `BinaryFormatter`, Java native
deserialisation, `eval`, `new Function`, `exec` on request-derived data.

**Why it matters:** Deserialising attacker-controlled bytes is arbitrary code execution in most
runtimes.

**Impact:** Removes arbitrary code execution paths by replacing unsafe deserialisation and dynamic evaluation with schema-bound, data-only parsing.

**Fix:** Use data-only formats (JSON) with an explicit schema. `yaml.safe_load`. Never evaluate
request content.

---

### SEC-019 — Debug mode, verbose errors or dev tooling enabled in production

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** all
- **Criticality:** Medium | **Priority:** P1 | **Phase:** 1
- **Role:** DevOps Engineer
- **Effort:** 0.5–1

**Detect:** `DEBUG = True`, developer exception pages, unauthenticated Swagger/GraphQL playground on
production, source maps published, admin panels on default credentials, directory listing enabled.

**Why it matters:** Debug surfaces leak configuration, source and sometimes an interactive console.

**Impact:** Reduces information disclosure by ensuring development-only surfaces and verbose diagnostics are disabled outside development environments.

**Fix:** Drive these from environment configuration with a secure default, and assert the production
setting in a deployment smoke test.

---

### SEC-020 — Overly permissive cloud/service identity

- **Dimension:** security
- **Layer:** Infrastructure
- **Applies to:** cloud-hosted systems
- **Criticality:** High | **Priority:** P1 | **Phase:** 2
- **Role:** DevOps Engineer
- **Effort:** 2–5

**Detect:** Wildcard IAM policies (`Action: "*"`, `Resource: "*"`), Owner/Contributor role assignments
for app identities, shared admin service accounts, storage containers set to public, database
firewall allowing `0.0.0.0/0`.

**Why it matters:** One compromised component becomes full control of the subscription or account.

**Impact:** Limits the blast radius of any single compromise by granting each workload only the permissions it actually needs.

**Fix:** Replace wildcards with scoped, per-workload managed identities. Review public network
exposure. Enable access logging on data stores.

---

### SEC-021 — Multi-tenant isolation not enforced at the data layer

- **Dimension:** security
- **Layer:** Database
- **Applies to:** multi-tenant systems
- **Criticality:** High | **Priority:** P0 | **Phase:** 1
- **Role:** Backend Engineer
- **Effort:** 3–8

**Detect:** Tenant scoping applied inconsistently — some queries filter by tenant, others do not.
No row-level security, no shared base repository enforcing the filter, tenant taken from a request
body/header rather than the verified token.

**Why it matters:** One missed `WHERE tenant_id = ?` leaks another customer's entire dataset.

**Impact:** Guarantees tenant data separation by enforcing scoping in a single place rather than relying on every query being written correctly.

**Fix:** Enforce the tenant filter centrally — row-level security, a global ORM filter, or a
repository base class. Derive tenant identity from the verified token only.

---

### SEC-022 — No audit trail for security-relevant actions

- **Dimension:** security
- **Layer:** Backend
- **Applies to:** systems handling financial, personal or regulated data
- **Criticality:** Medium | **Priority:** P2 | **Phase:** 2
- **Role:** Backend Engineer
- **Effort:** 3–5

**Detect:** No immutable record of logins, permission changes, data exports, deletions or
configuration changes; audit data stored in the same mutable table as business data.

**Why it matters:** Without an audit trail you cannot answer "what did they access?" after an
incident, and most compliance regimes require it.

**Impact:** Enables incident investigation and compliance reporting by recording who changed what, when, in a tamper-resistant trail.

**Fix:** Emit structured audit events for authentication, authorisation changes, exports and
destructive operations. Store append-only with retention aligned to policy.
