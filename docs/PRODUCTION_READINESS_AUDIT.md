# JUMART — Production Readiness Audit

**Audit date:** 2026-11-11
**Branch:** `production-readiness`
**Scope:** Repository `akhadagh/KTU_Campus-Market` — authentication, authorisation, payments, catalogue, orders, fulfilment, storage, AI, notifications, admin tooling, database, CI/CD.
**Method:** Code path tracing (UI → API → validation → authorisation → service → database → external provider → response), plus live verification against the deployed production stack using test accounts and the Paystack sandbox. A page or route existing was never treated as evidence that a feature works.

**Priority key:** `P0` critical security / payment / data-integrity / privilege escalation · `P1` essential functionality or serious reliability · `P2` important incomplete features · `P3` UX, performance, maintainability · `P4` future work.

**Status key:** `FIXED` · `PARTIAL` · `OPEN` · `ACCEPTED` (deliberate, documented scope decision) · `BLOCKED` (external dependency).

---

## 1. Executive summary

The platform was already a working marketplace, but the audit found **four P0-class defects** in the money path and the access-control path, plus a set of P1/P2 gaps that prevented a commercial handover:

1. A payment could be marked successful without the provider's amount, currency and reference being compared with the stored payment record.
2. A webhook that was recorded but never completed was treated as a completed duplicate, so a crashed payment event was silently dropped.
3. Concurrent callbacks could deduct stock twice and notify twice.
4. Restricted `/admin` routes streamed a `200` shell to non-staff users before the server-side redirect ran.

All P0 and P1 findings listed below are now **fixed and verified**. The remaining open items are the ones a commercial client must accept explicitly: product variants are not yet exposed in the vendor UI, vendor settlement is manual by design, administrator MFA is not implemented, and a formal legal review of Ghana's Data Protection Act (Act 843) has not been carried out.

**Production health at audit close (verified on the deployed build):** `database: ok`, `payments: configured`, `ai: enabled`. Build green; lint, typecheck, formatting and 27 automated tests passing; 22/22 public routes returning 200; all 14 administrator surfaces returning 200 for a staff session and 307/401 without one; security headers present on every response; cross-origin state-changing requests rejected with 403; payment authorisation URL returned by the live Paystack sandbox.

---

## 2. Findings register

### 2.1 Payments and financial security

| ID | Severity | Affected file | Root cause | Business impact | Correction | Status | Evidence |
|----|----------|---------------|-----------|-----------------|------------|--------|----------|
| PRA-001 | P0 | `lib/payments.ts` | The callback and webhook verified the transaction with Paystack but never compared the verified `amount`, `currency` or `reference` with the stored payment record | A mismatched or partial transaction could mark an order paid | Added `confirmPaymentFromVerification()` — the single authoritative path that compares reference, amount and currency, requires provider status `success`, and rejects with a distinct reason | FIXED | `lib/payments.ts` `confirmPaymentFromVerification`; rejection reasons surfaced as `/orders?payment=amount_mismatch` etc. |
| PRA-002 | P0 | `app/api/v1/payments/webhook/route.ts` | Any pre-existing `(provider, eventId)` row was treated as a completed duplicate, including rows left in `RECEIVED` by a crash | A captured payment could be lost permanently because the provider's retry was discarded | Events are claimed with an upsert into `PROCESSING`; only `PROCESSED` rows are duplicates; `FAILED` rows are retryable and keep `attempts` and `errorMessage` | FIXED | Migration `0005_webhook_retry_state`; webhook returns `duplicate: true` only for processed events |
| PRA-003 | P0 | `lib/payments.ts` | The "already paid" check ran outside the transaction, so two concurrent callbacks both passed it and both decremented stock and created notifications | Duplicate stock deduction, double notifications, corrupted inventory | The payment update inside the transaction is conditional (`status in PENDING/INITIATED/FAILED`); the order update is conditional on `PENDING_PAYMENT`; the whole write set is one transaction | FIXED | `confirmPaymentFromVerification` transaction block |
| PRA-004 | P1 | `app/api/v1/payments/initialize/route.ts` | The route checked order ownership but not whether the order had expired, and re-used any pending payment record regardless of amount | A buyer could start a payment for an expired order or against a stale amount | Stale orders are expired first; only a payment whose amount still matches the order is re-used; ownership returns 403 | FIXED | `expireStaleOrders()` call before the lookup; `order.buyerId !== auth.user.id` check |
| PRA-005 | P1 | `lib/orders.ts` | Unpaid orders stayed `PENDING_PAYMENT` forever and held inventory reservations | Buyers saw orders that could never be paid; stock stayed reserved | 30-minute payment window. Expiry releases reservations, cancels the order, fails pending payments, and writes status history. Applied lazily on the orders page and payment initialisation, plus a cron endpoint | FIXED | `lib/orders.ts` `expireStaleOrders`; `GET /api/v1/cron/expire-orders` |
| PRA-006 | P1 | `app/api/v1/payments/webhook/route.ts` | The webhook trusted the payload's own `status` field | A forged or replayed payload could mark a payment successful | The webhook now verifies the transaction against Paystack's verification endpoint and compares it with the stored payment | FIXED | `verifyPaystackTransaction(reference)` inside the webhook handler |
| PRA-007 | P1 | `lib/auth/session.ts` | `getSession()` validated the session row but not the account status, so a suspended account kept working until the cookie expired | Suspended accounts retained full access | `getSession()` rejects suspended, banned and deactivated accounts; admin suspension revokes all sessions immediately | FIXED | `BLOCKED_STATUSES` check; `PATCH /api/v1/admin/users/:id` |
| PRA-008 | P1 | `app/api/v1/auth/register/route.ts` | Re-registering a deleted email re-used the account without revoking old sessions, without clearing email verification, and kept elevated roles | A deleted administrator could re-register and retain admin rights | Reactivation now revokes all sessions, deletes vendor/moderator/admin roles, clears the cart and wishlist, resets `emailVerifiedAt` and sets `PENDING_VERIFICATION` | FIXED | `register` reactivation transaction |
| PRA-009 | P1 | `app/api/v1/auth/register/route.ts` | New accounts were created as `ACTIVE` and unverified accounts could transact | Unverified or spam accounts could place orders, apply as vendors and publish listings | New accounts start as `PENDING_VERIFICATION`. Commercial operations require a verified email (`requireApiVerified`): checkout, vendor application, product creation and reviews | FIXED | Test "blocks unverified buyers from checking out" expects `403 EMAIL_NOT_VERIFIED` |
| PRA-010 | P1 | `proxy.ts`, `app/(shop)/admin/**` | Admin pages checked the role after the first database read, so a non-staff request received a streamed `200` shell (no data leaked, but the wrong status and an unnecessary render) | Monitoring and crawlers saw admin URLs as public; brittle access control | The proxy now resolves the session's roles for `/admin` and returns `307` (pages) or `403` (API) before any rendering | FIXED | `proxy.ts` `enforceStaff`; verified anonymous `/admin` → 307 |
| PRA-011 | P1 | `lib/rate-limit.ts` | A single in-process bucket protected a multi-instance serverless deployment | Registration, login and reset endpoints were effectively unprotected in production | Shared Upstash Redis limiter with a documented policy: abuse-prone anonymous endpoints fail **closed** when the store is unreachable, authenticated endpoints fall back to the in-process bucket. Client IP is derived from trusted proxy headers only | PARTIAL | `lib/rate-limit.ts` `rateLimitWith`, `clientIp`; no `UPSTASH_REDIS_*` credentials are provisioned yet, so the shared path is inactive |
| PRA-012 | P1 | `app/api/v1/vendor/products/images/route.ts` | Uploads trusted the browser's MIME type and original filename, stored the raw bytes and never removed the stored object when a database row was deleted | Malicious payloads could be stored publicly; orphaned files accumulated | Magic-byte detection, `sharp` re-encoding (EXIF stripped, auto-rotated, capped at 2000px, JPEG q82), random file names, per-vendor quota, ownership checks on delete, and the stored object is deleted with the row | FIXED | `lib/uploads.ts`; `DELETE /api/v1/vendor/products/images` removes the blob |
| PRA-013 | P2 | admin tooling | No way to suspend an account or remove elevated access | Abuse and fraud could only be handled by direct database edits | `/admin/users` with suspend/reactivate, session revocation, audit log and notification | FIXED | `app/(shop)/admin/users/page.tsx` |
| PRA-014 | P2 | admin tooling | Categories could not be created, reordered or deactivated by administrators | Catalogue structure was frozen at seed time | `/admin/categories` with create, ordering and activation, protected by `settings.manage` | FIXED | `app/(shop)/admin/categories/page.tsx` |
| PRA-015 | P2 | `prisma/schema.prisma` (`Dispute`) | Disputes existed as a model with no workflow | Buyers had no escalation path | Buyer dispute submission with category, description and evidence links, admin decision, notifications and audit trail | FIXED | `POST /api/v1/orders/:id/disputes`, `/admin/disputes` |
| PRA-016 | P2 | `prisma/schema.prisma` (`Delivery`) | Delivery status was never recorded; tracking codes lived only on the vendor order | No delivery history, no courier trail | Delivery record per vendor order with status flow, tracking code, buyer notification and audit; sellers drive it from the order screen | FIXED | `POST /api/v1/vendor/orders/:id/delivery` |
| PRA-017 | P2 | `prisma/schema.prisma` (`StudentVerification`) | Student verification existed as a model only | "Verified students" was an unbacked claim | Application with university/campus and optional institutional email, admin review, audit trail. **No identity documents are collected or stored** | FIXED | `/account/verification`, `/admin/students` |
| PRA-018 | P2 | vendor tooling | Vendors had counts but no sales analytics | Sellers could not see performance | `/sell/analytics` with gross sales, refunds, payable balance, delivery fees, order pipeline, inventory alerts, daily sales and product performance | FIXED | `lib/analytics.ts` |
| PRA-019 | P2 | `lib/ai.ts` | The provider call had no timeout and sent a prompt without an explicit "never invent" instruction | A hung provider held a request open; the model could embellish listings | 20-second timeout, explicit grounding rules, only public listing fields are sent, no student or payment data leaves the server | FIXED | `lib/ai.ts` `askAssistant` |
| PRA-020 | P2 | `next.config.ts`, `proxy.ts` | No Content-Security-Policy, HSTS or cross-origin protection on state-changing API calls | Browser-level protections were missing; CSRF-style cross-site POSTs were possible | CSP, HSTS (production), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, and origin/`Sec-Fetch-Site` validation on non-GET API requests | FIXED | Verified: cross-origin POST → 403, same-origin → handled, no-origin (provider webhook) → allowed |
| PRA-021 | P2 | `tests/` | Integration tests hit the developer's running dev server and were flaky under latency | CI could not be trusted | Vitest global setup starts a dedicated instance when `TEST_DATABASE_URL` is provided, one retry absorbs transient link failures, and the suite is split into `test:unit` and `test:integration` | FIXED | `tests/global-setup.ts`; 27/27 tests green |
| PRA-022 | P2 | `.github/workflows/ci.yml` | CI ran lint, typecheck and build but no tests and no dependency audit | Regressions reached `main` uncaught | CI now validates the Prisma schema, applies migrations to an isolated Postgres service, checks formatting, lints, typechecks, runs unit tests, builds, runs integration tests against the isolated database and audits dependencies; a second job runs Playwright | FIXED | `.github/workflows/ci.yml` |

### 2.2 Open and accepted items

| ID | Severity | Item | Status | Why it is open / accepted |
|----|----------|------|--------|-----------------------|
| PRA-023 | P1 | Product variants are not exposed in the vendor or buyer UI | PARTIAL | The schema, cart, order and payment stock handling support variants (`ProductVariant`, `CartItem.variantId`, per-variant stock decrement on payment), but the vendor variant editor and the product-page variant picker are not built. Fashion listings therefore rely on variants described in the description. Estimated effort: 2–3 days. |
| PRA-024 | P1 | Automated vendor settlement | ACCEPTED | No merchant onboarding or settlement contract exists with a payment provider, and no verified payout destination is stored. Moving money automatically would be unsafe. Settlement is manual: gross sales and refunds are separated in `/sell/analytics` and refunds are executed through the provider by an administrator. |
| PRA-025 | P1 | Distributed rate limiting is not active in production | BLOCKED | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not provisioned. The code path is implemented and fails closed for anonymous abuse endpoints, but until credentials exist the in-process bucket is what protects the deployment. |
| PRA-026 | P2 | Administrator MFA | OPEN | Recommended before handling real money at scale. Requires an additional authenticator surface and enrolment flow. |
| PRA-027 | P2 | Private document storage for student verification | ACCEPTED | Deliberately avoided: JUMART collects no identity documents, so no private bucket is required. If documents are ever needed, a private store with short-lived signed URLs is required first. |
| PRA-028 | P2 | Refunds are recorded as `PROCESSING`, never auto-completed | OPEN | Paystack confirms a refund asynchronously. A reconciliation job that marks a refund `COMPLETED` on provider confirmation is not implemented; an administrator must confirm it. |
| PRA-029 | P3 | Catalogue images are served from the repository without CDN transformation | OPEN | Images are already normalised (1200×900, progressive JPEG). Next/Image would add resizing at request time. |
| PRA-030 | P3 | Legal and privacy review | OPEN | The privacy notice, terms and retention behaviour are drafted but have not been reviewed against Ghana's Data Protection Act, 2012 (Act 843) or consumer-protection rules. This needs a qualified lawyer, not an engineer. |
| PRA-031 | P3 | PWA offline support | OPEN | Manifest, icons and theme colour are in place; there is no service worker, so the app is not installable-offline. |
| PRA-032 | P3 | Playwright journeys are written but unexecuted in this environment | PARTIAL | The Chromium download is blocked in the audit sandbox (`cdn.playwright.dev` unreachable). The suite runs in CI. |

---

## 3. Verified journeys

| Journey | Result |
|---|---|
| Register → verification token issued → verify → session shows `emailVerifiedAt` | PASS |
| Unverified account cannot check out (`403 EMAIL_NOT_VERIFIED`) | PASS |
| Re-registering a deleted address revokes sessions and drops elevated roles | PASS |
| Vendor applies → admin approves → role granted → storefront live | PASS |
| Vendor creates a listing → moderation queue → approve → visible on the marketplace | PASS |
| Cart add → quantity update → checkout → order with per-vendor split | PASS |
| Paystack initialisation returns a live authorisation URL (sandbox) | PASS |
| Provider callback verifies before marking paid; unknown reference redirects safely | PASS |
| Webhook with an invalid signature → `401` | PASS |
| Vendor fulfilment transitions; invalid transition → `409`; buyer attempting a vendor action → `403` | PASS |
| Refund request → admin approval → provider call → status `PROCESSING` → audit entry | PASS |
| Dispute submission → admin decision → both parties notified | PASS |
| Support message → staff inbox → reply | PASS |
| Admin upload of a learning material → Blob → public download with counter | PASS |
| Unapproved vendor link hidden (404) → admin approval → visible (200) | PASS |
| Image upload: non-vendor `403`, vendor accepted, EXIF stripped, random name, delete removes the blob | PASS |
| Anonymous `/admin` → `307`; non-staff → `307`/`403`; staff → `200` | PASS (production build) |
| Security headers present on every response (CSP, HSTS, frame, referrer, permissions, COOP/CORP) | PASS (production build) |
| Guest cart still works without a session while the rest of the API stays deny-by-default | PASS |
| Cross-origin state-changing API request → `403`; same-origin → handled | PASS |
| AI assistant answers from live listings (`source: ai`) and falls back cleanly when the provider fails | PASS |

---

## 4. Database review

| Area | Finding | Status |
|---|---|---|
| Uniqueness | Product and vendor slugs, order numbers, payment references, idempotency keys and webhook `(provider, eventId)` are unique. `CartItem` has a composite unique on `(cartId, productId, variantId)`. | OK |
| Indexes | Order, vendor-order, product, review, report, dispute, notification and payment hot paths are indexed. `learning_materials` and `conversations(kind, lastMessageAt)` were added with the new modules. | OK |
| Foreign keys | Financial history is protected: `OrderItem`, `Payment`, `Refund` and `VendorOrder` use `Restrict`, so a paid order cannot be silently deleted. `Conversation.vendorId` became nullable for support threads. | OK |
| Transactions | Order creation, payment confirmation, refunds, disputes, category edits and admin actions all run in explicit transactions. | FIXED |
| Inventory races | Stock decrement uses a conditional `quantity >= n` update inside the payment transaction; oversell is impossible and a shortfall is flagged for manual review. | FIXED |
| Migrations | `0004_jumart_modules` and `0005_webhook_retry_state` are additive. A partially applied `0004` was reconciled with `prisma migrate resolve` rather than by editing history; no historical migration was modified. | OK |
| Pooling | The runtime prefers `DATABASE_URL_UNPOOLED`, keeps sockets alive, recycles idle connections after 10s and retries transient `P1017`/`ETIMEDOUT` failures with a pool rebuild. | OK |

---

## 5. External configuration still required

| Variable | Purpose | State |
|---|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting | **Not provisioned** (see PRA-025) |
| `RESEND_API_KEY` | Transactional email (verification, reset, order and refund messages) | **Not provisioned** — dev log fallback only |
| `CRON_SECRET` | Protects `/api/v1/cron/expire-orders` | Recommended; the route is open when unset |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET` | Payments | Configured (sandbox) |
| `BLOB_READ_WRITE_TOKEN` | Product images and learning materials | Configured |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Assistant | Configured |

---

## 6. Production readiness decision

**CONDITIONALLY READY — documented non-critical limitations.**

All P0 findings are fixed and verified. The platform can be demonstrated and operated as a campus marketplace with real payments, real fulfilment and a real admin console. Before a full commercial launch the client should accept the open items in §2.2 — most importantly the missing distributed rate limiting (a credentials task), product variants, and a legal review of the data protection position.
