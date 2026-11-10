# Campus Market — System Architecture

**Version:** 1.0

---

## 1. Architecture summary

Campus Market is a **modular monolith** built with Next.js. It favors a single deployable application with clear internal boundaries over premature microservices. The modules are designed so that payment, AI, notifications, or search can be extracted later if scale requires it.

```text
Browser / PWA
    |
    v
Next.js App Router
  ├── Server Components (reads)
  ├── Server Actions / Route Handlers (writes)
  ├── Middleware (security headers, auth gates, rate-limit hooks)
  └── /api/v1 surface
          |
          v
Application services
  Auth · Users · Verification · Vendors · Catalog · Search · Cart
  Checkout · Orders · Payments · Delivery · Reviews · Trust & Safety
  Messaging · Notifications · Admin · AI · Audit
          |
          v
Repositories / Prisma
          |
          v
PostgreSQL
```

External services:

- Object storage/CDN for product images.
- Payment provider for collection, verification, refunds, and payouts.
- Email provider for verification and notifications.
- Optional SMS provider.
- Optional AI provider.
- Optional Redis for distributed rate limiting.

---

## 2. Technology decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript, strict | Shared types and safer refactors |
| Framework | Next.js App Router | SSR/SEO, server components, route handlers, simple deployment |
| UI | Tailwind CSS, Radix/shadcn-style primitives, Lucide | Accessible primitives and a consistent design system |
| Database | PostgreSQL | Transactions, constraints, relational integrity, strong search |
| ORM | Prisma | Typed schema, migrations, good DX; raw SQL for specialized search |
| Auth | Auth.js v5 with database sessions, or opaque DB sessions | Revocable sessions and secure cookies |
| Validation | Zod | Shared client/server schemas |
| Storage | Cloudinary or Supabase Storage | CDN, transformations, signed uploads |
| Payments | Paystack adapter first; Hubtel adapter interface | Ghana coverage and provider flexibility |
| AI | Provider-agnostic server-side LLM | Avoid lock-in and support fallback/disablement |
| Deployment | Vercel + managed PostgreSQL | Low operational cost and fast iteration |

### Rejected alternatives

- **Native Android first:** slower iteration and no web/admin experience; a responsive PWA covers both immediately.
- **Microservices:** unnecessary operational overhead at launch.
- **MongoDB:** weaker relational and financial integrity for orders, ledgers, and refunds.
- **Client-side payment confirmation:** insecure and explicitly prohibited.

---

## 3. Module boundaries

| Module | Responsibility |
|---|---|
| Auth | Registration, login, logout, sessions, email verification, password reset |
| Users | Profiles, preferences, account lifecycle |
| Verification | Student and vendor verification states and document access |
| Vendors | Store applications, storefronts, store settings, analytics |
| Catalog | Categories, products, images, variants, inventory |
| Search | Full-text/trigram search, filters, sorting, pagination |
| Cart | Cart and wishlist management |
| Checkout | Pricing, validation, order creation, idempotency |
| Orders | Parent/vendor orders, status machine, history, fulfilment |
| Payments | Provider adapters, initiation, webhooks, verification, refunds, ledger |
| Delivery | Pickup locations, delivery records, tracking, confirmation |
| Reviews | Eligibility, submission, moderation |
| Trust & Safety | Reports, disputes, evidence, moderation actions |
| Messaging | Conversations and messages |
| Notifications | In-app notifications; optional email/SMS |
| Admin | Administrative operations and configuration |
| AI | Grounded assistant, tools, recommendations, description drafting |
| Audit | Append-only privileged action logging |

Each module exposes service functions with explicit actor context and validation. Route handlers and server actions are thin adapters; business logic lives in services.

---

## 4. Multi-university design

Tenancy is implemented by data scoping, not separate databases:

- `universities` → `campuses` → users, vendors, products, orders, pickup locations.
- Public discovery defaults to the user’s campus but can allow cross-campus browsing.
- Administrators can manage multiple campuses.
- Policies and settings can be scoped globally or per campus.

This supports expansion without a rewrite.

---

## 5. Multi-vendor order model

```text
Checkout
  └── Order (buyer-facing, payment status, overall status)
        ├── VendorOrder (vendor A, fulfilment status, delivery fee)
        │     └── OrderItems (price/title snapshots)
        ├── VendorOrder (vendor B, ...)
        └── VendorOrder (vendor C, ...)
```

Benefits:

- Independent vendor fulfilment.
- Per-vendor delivery fees and tracking.
- Partial refunds and disputes.
- One payment can cover multiple vendor orders.
- Historical price and product snapshots survive catalog changes.

---

## 6. Request flows

### 6.1 Checkout

1. Client submits cart and an idempotency key.
2. Server reloads the cart from the database.
3. Server recalcs prices, fees, stock, vendor status, and campus eligibility.
4. Transaction creates the parent order, vendor orders, order items, status history, and inventory reservations.
5. Payment is initiated server-side.
6. Provider webhook is verified and stored idempotently.
7. Provider transaction is verified server-side.
8. Transaction marks payment paid, confirms stock, advances orders, and notifies parties.

### 6.2 Payment webhook

1. Read raw body.
2. Verify signature and timestamp.
3. Insert `webhook_events(provider, event_id)` with a unique constraint.
4. If already processed, return success without side effects.
5. Re-fetch the transaction from the provider.
6. Match reference, amount, and currency to the database.
7. Apply the payment result transactionally.
8. Mark the event processed.

### 6.3 AI assistant

1. Authenticate and rate-limit the request.
2. Send the user request and tool definitions to the AI provider.
3. AI extracts filters and calls `search_products`.
4. The tool executes the same search service used by the marketplace.
5. AI summarizes only returned records and includes listing IDs.
6. On provider failure or invalid output, return deterministic search results.

---

## 7. Authentication and authorization

- Registration grants the buyer role only.
- Passwords use Argon2id.
- Sessions use opaque tokens hashed at rest, stored in secure cookies, and revocable.
- Email verification and password reset tokens are single-use and hashed.
- Authorization is capability-based and enforced in services.
- Resource ownership is checked for vendor store/product operations and buyer order access.
- Role changes and privileged actions are audit-logged.
- Student verification documents are accessible only to authorized reviewers.

Detailed controls are in `SECURITY_NOTES.md`.

---

## 8. AI architecture

```text
/api/v1/ai/assistant
  → auth + rate limit + validation
  → AI orchestrator
      → provider adapter
      → tool registry
          → search_products
          → get_product
          → get_vendor
          → compare_products
      → grounding guardrail
  → response with real listing IDs
```

Requirements:

- API keys only on the server.
- Feature-flagged; disabled by default until configured.
- Tool outputs are the only source of product facts.
- Maximum tool calls and output length.
- Fallback to normal search.
- No personalization when disabled by the user.
- Structured logging without sensitive data.

---

## 9. Payments architecture

```text
PaymentProvider interface
  initiate(order, buyer, method) -> reference/checkout URL
  verify(reference) -> normalized result
  refund(payment, amount, reason) -> normalized result
  parseWebhook(rawRequest) -> normalized event
```

Adapters:

- `PaystackProvider` (initial).
- `HubtelProvider` (optional).

Rules:

- Never trust frontend payment state.
- Never store card data.
- Verify amount, currency, and reference.
- Reject replayed or mismatched webhooks.
- Refunds require authorization and provider confirmation.
- Use a vendor ledger and admin-controlled payouts; do not claim escrow without legal approval.

---

## 10. Data and transaction strategy

- Money is stored as integer pesewas.
- Order creation, payment confirmation, refunds, and inventory changes run in database transactions.
- Inventory uses row-level locking or conditional updates to prevent overselling.
- Idempotency keys prevent duplicate orders and payments.
- Financial and audit records use restrictive deletion policies.
- Users and products use soft deletion where retention is required.
- Public queries exclude soft-deleted and inactive records.

See `DATABASE_DESIGN.md`.

---

## 11. Storage and image handling

- Server-issued signed uploads or server-proxied uploads.
- MIME sniffing, size limits, and extension allow-list.
- Re-encode images where possible; strip EXIF metadata.
- Store public product images in a CDN-backed bucket.
- Store verification documents in a private bucket with short-lived signed access.
- Enforce per-vendor quotas and rate limits.

---

## 12. Background work

MVP uses scheduled route handlers or Vercel Cron for:

- Expiring inventory reservations.
- Cancelling abandoned payment-pending orders.
- Reconciling pending payments.
- Cleaning stale uploads.
- Generating notification digests.
- Preparing payout batches.

Jobs must be idempotent and safe to retry.

---

## 13. Observability

- Structured JSON logs with request IDs.
- Error tracking via Sentry or equivalent (optional).
- Audit log for privileged actions.
- Payment and webhook event logs for reconciliation.
- Health endpoint for deployment checks.
- No secrets or unnecessary PII in logs.

---

## 14. Deployment topology

```text
Vercel (Next.js)
  ├── Static assets / CDN
  ├── Server components and route handlers
  └── Cron jobs
        |
        ├── Managed PostgreSQL (Neon/Supabase)
        ├── Cloudinary/Supabase Storage
        ├── Paystack/Hubtel
        ├── Email provider
        └── Optional AI provider
```

Environment-based configuration. No hardcoded credentials. See `DEPLOYMENT_GUIDE.md`.

---

## 15. Architecture decision records

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Modular monolith over microservices for launch | Accepted |
| ADR-002 | PostgreSQL + Prisma over MongoDB | Accepted |
| ADR-003 | Web/PWA first, native later | Accepted |
| ADR-004 | Server-side payment verification and webhook idempotency | Accepted |
| ADR-005 | Grounded AI with deterministic fallback | Accepted |
| ADR-006 | Multi-university by data scoping, not separate databases | Accepted |
| ADR-007 | Parent order + vendor orders for multi-vendor checkout | Accepted |
| ADR-008 | No escrow claims without legal/provider approval | Accepted |
