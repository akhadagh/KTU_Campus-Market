# Campus Market — Security and Privacy Notes

**Principle:** security is enforced server-side. Hiding a UI control is never authorization.

---

## 1. Threat model

| # | Threat | Impact | Primary controls |
|---|---|---|---|
| 1 | Privilege escalation to admin/moderator | Critical | Server-side capabilities, role assignment restricted, audit logs |
| 2 | Payment forgery or webhook replay | Critical | Signature verification, server-side verification, idempotency, amount matching |
| 3 | Order/price tampering | High | Server recalculates totals from database |
| 4 | Inventory race and overselling | High | Transactions, row locks, reservations, constraints |
| 5 | Unauthorized order/vendor data access | High | Ownership checks on every read/write |
| 6 | Malicious file upload | High | MIME/size validation, re-encoding, private buckets, quotas |
| 7 | Account takeover | High | Argon2id, rate limits, reset protections, session revocation |
| 8 | XSS via listings/reviews/messages | High | Output encoding, sanitization, CSP |
| 9 | User/document enumeration | High | Generic errors, private storage, access control |
| 10 | Spam and harassment | Medium | Rate limits, reporting, blocking, moderation |
| 11 | Fraudulent listings/reviews | High | Verification, moderation, verified-purchase reviews |
| 12 | PII leakage via APIs/logs | High | Field-level allow-lists, redaction, minimization |

---

## 2. Authentication controls

- Argon2id password hashing with per-user salt.
- Minimum password policy; optional breached-password check.
- Generic login errors to prevent account enumeration.
- Email verification with single-use, hashed tokens and expiry.
- Password reset with single-use tokens; revoke all sessions after reset.
- Session tokens are random, hashed at rest, and stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- Sessions are revocable and expire.
- Rate limiting on login, registration, reset, and verification resend.
- Admin accounts should use MFA when supported.

---

## 3. Authorization controls

- Capability-based authorization enforced in service functions.
- Resource ownership checks:
  - Vendors only manage their own store/products/orders.
  - Buyers only access their own orders, conversations, reviews, and reports.
  - Dispute evidence is restricted to involved parties and authorized staff.
- Role assignment is administrator-only and audit-logged.
- Registration grants only the buyer role.
- Admin routes and APIs verify administrative capability independently of navigation.
- Deny-by-default for unknown capabilities.

---

## 4. Input, output, and data access

- Zod validation at every boundary: body, query, params, headers.
- Allow-list enums for statuses, conditions, roles, and sort fields.
- Prisma parameterization for all queries; raw SQL only where reviewed and parameterized.
- React escaping by default; sanitize any rich text; avoid raw HTML injection.
- Security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame restrictions.
- CSRF protection via `SameSite` cookies plus origin checks on mutations.
- Pagination and query limits to prevent resource exhaustion.
- Avoid exposing internal IDs where a slug is sufficient, but never rely on ID secrecy for authorization.

---

## 5. File upload security

- Validate MIME type by content sniffing, not only extension.
- Allow-list image types and enforce size limits.
- Re-encode images and strip EXIF metadata where supported.
- Use server-issued signed uploads or server-proxied uploads; no storage secrets in the browser.
- Public product images go to a CDN bucket.
- Student verification documents go to a private bucket with short-lived signed access.
- Enforce per-user/per-vendor quotas and rate limits.
- Reject SVG or executable content for product images unless explicitly sanitized.
- Optional image moderation for inappropriate content.

---

## 6. Payment security

- Payment initiation occurs server-side with a unique reference.
- Amount and currency are derived from the database, never from the client.
- Never trust a frontend “payment successful” message.
- Webhook signatures are verified before processing.
- Webhook events are stored with a unique `(provider, event_id)` constraint.
- The server re-fetches the transaction from the provider before marking it paid.
- Reference, amount, and currency must match the payment record.
- Duplicate callbacks are idempotent.
- Refunds require authorization and provider confirmation.
- Raw card data is never stored.
- Provider secrets are server-only environment variables.
- Payment logs exclude secrets and sensitive payload fields.

---

## 7. Privacy and data protection

- Collect only data needed for trust, transactions, and support.
- Public APIs expose display-safe fields only; email and phone are private by default.
- Verification documents are private and access-logged.
- Personalization is opt-out; recommendations must work without personal history.
- Search history is minimized and retention-limited.
- Logs must not contain passwords, tokens, full payment payloads, or verification documents.
- Account deletion anonymizes PII after the retention period while preserving financial and audit records.
- Document retention for orders, payments, reviews, verification documents, and audit logs.
- Consider Ghana’s Data Protection Act 2012 (Act 843).
- Do not claim legal compliance without legal review.

---

## 8. Administrative security

- Least privilege for moderators and support agents.
- Separate capabilities for user management, verification, finance, moderation, and settings.
- Every admin mutation writes an immutable audit entry with actor, action, entity, before/after, IP, and user agent.
- Sensitive actions (refunds, role changes, account suspension) require explicit confirmation.
- Session revocation on role or status change.
- Admin access should be MFA-protected in production.

---

## 9. Audit logging

Audit events include:

- Login failures and suspicious activity (metadata only).
- Role and permission changes.
- Vendor approval/rejection and student verification decisions.
- Product moderation decisions.
- Order status overrides.
- Payment/refund actions.
- Dispute decisions.
- Settings and policy changes.
- Announcements and featured-listing changes.

Audit logs are append-only and retained according to policy.

---

## 10. Secrets management

- All secrets in environment variables or a secret manager.
- `.env` is git-ignored; `.env.example` contains names only.
- Separate development, staging, and production secrets.
- Rotate secrets after exposure.
- Never log secrets.
- Restrict production environment access to authorized maintainers.
- CI uses masked secrets and least-privilege tokens.

---

## 11. Dependency and supply chain

- Minimal dependencies.
- Lockfile committed.
- Automated dependency audit in CI.
- Review new dependencies for maintenance and security.
- Pin GitHub Actions to trusted versions.
- No untrusted postinstall scripts where avoidable.

---

## 12. Incident response outline

1. Detect and confirm the incident.
2. Contain affected accounts/services and rotate credentials.
3. Preserve logs and evidence.
4. Assess data and financial impact.
5. Notify affected parties and authorities as required.
6. Remediate root cause and add regression tests.
7. Document the post-incident review.

---

## 13. OWASP alignment

| OWASP area | Controls |
|---|---|
| Broken access control | Server-side capability and ownership checks |
| Cryptographic failures | Argon2id, TLS, hashed tokens, no secrets in code |
| Injection | Prisma parameterization, Zod validation, output encoding |
| Insecure design | Server-authoritative pricing, state machines, approval workflows |
| Security misconfiguration | Security headers, least privilege, no default credentials |
| Vulnerable components | Lockfile, audits, minimal dependencies |
| Authentication failures | Session hardening, rate limits, reset protections |
| Data integrity failures | Transactions, constraints, idempotency, webhook verification |
| Logging/monitoring failures | Structured logs, audit trail, error tracking |
| SSRF | Validate and allow-list external URLs; do not fetch arbitrary user URLs |

---

## 14. Pre-launch security checklist

- [ ] No secrets in the repository or client bundle.
- [ ] Password hashing and session revocation verified.
- [ ] Role escalation attempts denied and tested.
- [ ] Vendor/buyer ownership checks tested.
- [ ] Payment webhook signature and replay tests pass.
- [ ] Upload validation and private document access tested.
- [ ] Rate limits active on sensitive endpoints.
- [ ] Security headers verified.
- [ ] Audit logging verified for privileged actions.
- [ ] Dependency audit clean or accepted.
- [ ] Backup and restore tested.
- [ ] Legal/privacy review completed.
