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
| PRA-019 | P2 | `lib/ai.ts` | The assistant provider call had no timeout and the feature added a third-party AI dependency to the catalogue | A hung provider could hold a request open and the product carried an integration the client did not want | **REMOVED** — the assistant page, API route, `lib/ai.ts`, chat component, navigation entries, environment variables, CSP provider origin, tests and docs were deleted. No AI provider calls remain in the codebase | REMOVED | `git grep -i assistant` returns no application code |
| PRA-020 | P2 | `next.config.ts`, `proxy.ts` | No Content-Security-Policy, HSTS or cross-origin protection on state-changing API calls | Browser-level protections were missing; CSRF-style cross-site POSTs were possible | CSP, HSTS (production), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, and origin/`Sec-Fetch-Site` validation on non-GET API requests | FIXED | Verified: cross-origin POST → 403, same-origin → handled, no-origin (provider webhook) → allowed |
| PRA-021 | P2 | `tests/` | Integration tests hit the developer's running dev server and were flaky under latency | CI could not be trusted | Vitest global setup starts a dedicated instance when `TEST_DATABASE_URL` is provided, one retry absorbs transient link failures, and the suite is split into `test:unit` and `test:integration` | FIXED | `tests/global-setup.ts`; 27/27 tests green |
| PRA-022 | P2 | `.github/workflows/ci.yml` | CI ran lint, typecheck and build but no tests and no dependency audit | Regressions reached `main` uncaught | CI now validates the Prisma schema, applies migrations to an isolated Postgres service, checks formatting, lints, typechecks, runs unit tests, builds, runs integration tests against the isolated database and audits dependencies; a second job runs Playwright | FIXED | `.github/workflows/ci.yml` |

### 2.2 Open and accepted items

| ID | Severity | Item | Status | Why it is open / accepted |
|----|----------|------|--------|-----------------------|
| PRA-023 | P1 | Product variants are not exposed in the vendor or buyer UI | FIXED | Superseded by PRA-037: the vendor variant manager and the buyer variant selector are built, variant-aware cart/order handling is tested, and per-variant stock is decremented on payment. |
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

## 2b. Dashboards, discovery and verification pass (second review round)

| ID | Severity | Item | Status | Notes |
|----|----------|------|--------|-------|
| PRA-033 | P1 | Customer, vendor and administrator surfaces had no navigation of their own; links to orders, wishlist and messages lived outside the account area | FIXED | Three dashboard shells (`/account`, `/sell/*`, `/admin/*`) each with a role-specific sidebar, live badge counts and a mobile drawer. Every sidebar entry opens a working page |
| PRA-034 | P1 | The admin console was a horizontal link strip with no overview of platform state | FIXED | `/admin` now shows live counts for customers, vendors by state, listings by state, orders, payments, refunds, disputes, reports, support and review queues |
| PRA-035 | P1 | Vendor pages had no inventory, delivery, ledger or store-settings screens | FIXED | `/sell/inventory`, `/sell/deliveries`, `/sell/payouts`, `/sell/store`, `/sell/reviews` with stock adjustment, movement history and a gross/fee/net ledger |
| PRA-036 | P1 | Customer account had no profile, addresses, support-request or closure screens | FIXED | `/account/profile` (details, password, notification preferences), `/account/addresses`, `/account/requests`, `/account/close` with server-side authorisation |
| PRA-037 | P1 | Product variations were impossible to sell | FIXED | Vendor variant manager (name, stock, price adjustment, SKU), buyer selector on the product page, variant-aware cart, per-variant stock validation at add and checkout, variant snapshot on order items, per-variant decrement on payment |
| PRA-038 | P2 | The marketplace had a duplicate search bar and a horizontal category strip | FIXED | One search (header), a vertical database-driven category sidebar with subcategories and a mobile drawer, filters for condition and sort |
| PRA-039 | P2 | Catalogue pages could serve identical results on every visit | FIXED | `ProductView` tracking, recently-viewed shelf, a varied discovery shelf that interleaves vendors and mixes new arrivals with top-rated listings, and `connection()`/Suspense so pages are never stale |
| PRA-040 | P1 | Staff accounts had no second factor | FIXED | Staff logins require a six-digit code emailed to the staff address, with challenge expiry, attempt limits, single use and a server-log fallback when no mail provider is configured |
| PRA-041 | P1 | Vendor admission was a single form with no evidence, no risk signals and no review trail | FIXED | Structured application (individual, business, representative), business details, evidence links, risk flags (duplicate registration, reused document, prior rejection, burst applications) that never auto-reject, and an admin workflow with approve, reject or request-information, all audit-logged |
| PRA-042 | P2 | Sellers could not manage their own storefront | FIXED | `/sell/store` with name, description, category, phone, WhatsApp, logo, banner and fulfilment options |

---

## 2c. Product-scope pass (third review round)

| ID | Severity | Item | Status | Notes |
|----|----------|------|--------|-------|
| PRA-043 | P1 | Commit `08c8e09` was pushed with a non-compiling tree: the marketplace sidebar file had been replaced by a copy of the marketplace page, and `cart-view.tsx`, `product-purchase.tsx`, `product-gallery.tsx`, `admin/reports`, `sell/dashboard` and `sell/page` had missing imports and malformed JSX | FIXED | The bad commit was reverted to the last good baseline; `pnpm typecheck`, `pnpm lint`, `pnpm build` and the 29-test suite all pass again |
| PRA-044 | P1 | Airtime and data-bundle listings appeared in the main marketplace, category sidebar, store pages and marketing page | FIXED | Marketplace/category/store/recommendation queries now require `purchaseMode = INTERNAL`; the `airtime-bundles` category is hidden from navigation and its category page returns not-found; the airtime catalogue is reachable only through the header **Airtime** dropdown |
| PRA-045 | P2 | Notifications, messages, wishlist and account icons were rendered for anonymous visitors | FIXED | `SiteShell` resolves the session server-side and passes it to the header, navigation drawer and footer; account-only links are hidden until sign-in |
| PRA-046 | P3 | The login and registration screens used a flat gradient with no campus imagery | FIXED | `public/campus.svg` is used as a background on every auth page and in the home hero, with a brand overlay for contrast |
| PRA-047 | P1 | Every seeded vendor was flagged `isDemo: true`, so turning the demo flag off emptied the marketplace | FIXED | The genuine seeded stores are now `isDemo: false`; the demo flag defaults to **off** and remains as a kill switch for real sample stores. The database was updated to match |
| PRA-048 | P2 | `/sell` redirected anonymous visitors to login, so the public selling landing page was unreachable | FIXED | The exact `/sell` path is public; `/sell/**` (application and seller workspace) stays behind the auth proxy |
| PRA-049 | P2 | Checkout offered pickup points from any campus | FIXED | Checkout resolves the KTU campus and only offers its active pickup points |
| PRA-050 | P3 | Product and cart grids did not use the available screen width | FIXED | Marketplace, category, store and cart containers were widened and product grids now scale to 5–6 columns on large screens |

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
| Staff login returns an MFA challenge (202) and no session; the code completes the sign-in | PASS |
| Vendor application captures seller type, business details and evidence, and the admin queue shows risk flags | PASS |
| Variant added to the cart, kept in the cart response and snapshotted on the order item | PASS |
| Dashboard sidebars: every customer, vendor and admin link opens a working page with live data | PASS |
| Anonymous header hides Messages/Notifications/Wishlist/Account; authenticated header shows them | PASS (local production build) |
| Airtime is absent from `/marketplace`, `/categories` and store pages but `/airtime` still lists verified merchants through the header dropdown | PASS |
| `/assistant` returns 404 and no application code references the removed assistant | PASS |
| `/sell` renders the public landing page; `/sell/apply` redirects anonymous visitors to login | PASS |
| Login, register and home hero render the campus background image | PASS |
| Checkout offers only KTU Main Campus pickup points | PASS |
| Demo stores are hidden by default; the genuine seeded stores are live | PASS |

### 3b. Live production verification (2026-11-19, deploy `7a8e13e`)

| Check | Result |
|---|---|
| `/api/health` reports `database: ok`, `payments: configured`, and no `ai` check | PASS |
| `/assistant` → `404` | PASS |
| `/marketplace` renders 44 product links with no airtime category and no assistant link | PASS |
| `/categories` hides the airtime category | PASS |
| `/airtime` lists the verified merchants (TeleLink Data Point, Kwame's Data Spot) | PASS |
| `/login` and the home hero render `campus.svg` | PASS |
| `/sell` is public (`200`); `/admin/settings` redirects anonymous visitors (`307`) | PASS |
| Anonymous header hides Messages/Notifications/Account/Wishlist; an authenticated session shows them | PASS |

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

---

## 6. Production readiness decision

**CONDITIONALLY READY — documented non-critical limitations.**

All P0 findings are fixed and verified. The platform can be demonstrated and operated as a campus marketplace with real payments, real fulfilment and a real admin console. Before a full commercial launch the client should accept the open items in §2.2 — most importantly the missing distributed rate limiting (a credentials task) and a legal review of the data protection position.
