# JUMART — Client Handover Guide

**Platform:** JUMART — Your Campus. Your Marketplace.
**Repository:** `akhadagh/KTU_Campus-Market` · **Production:** https://campus-market-teal.vercel.app
**Stack:** Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS v4 · Prisma 7 · Neon PostgreSQL · Vercel Blob · Paystack · Gemini (server-side) · Resend (email)

This guide is written for the people who will operate and sell on the platform. It contains no credentials — every secret lives in the deployment environment, never in the repository.

---

## 1. Product overview

JUMART is a campus-first marketplace that connects three groups on one university campus:

- **Students** buy and sell, pay with card or mobile money, track orders and review sellers.
- **Vendors** open a store, publish listings, confirm orders and fulfil them.
- **Administrators** approve vendors, moderate listings, handle refunds and disputes, and publish free study materials.

The platform launched at Koforidua Technical University and is designed so other campuses can be added without changing how students buy and sell.

## 2. Features delivered

| Area | What works today |
|---|---|
| Accounts | Registration, email verification, login, password reset, session revocation, account suspension and reactivation |
| Marketplace | Database-backed catalogue, search, category and condition filters, sorting, pagination, product detail with image gallery, related listings |
| Stores | Vendor application, administrator approval, public storefront, store analytics, message inbox |
| Listings | Create, edit, image upload (up to eight photos per listing), stock, conditions, delivery options, moderation queue |
| Commerce | Guest and account carts, wishlist, multi-vendor checkout, per-seller delivery fees, inventory reservations, order state machines |
| Payments | Paystack initialisation, verified callback, signed idempotent webhook, refunds requested by buyers and executed by staff |
| Fulfilment | Pickup, campus delivery with tracking status, digital delivery for airtime and data bundles |
| Trust | Verified-purchase reviews with moderation, community reports, disputes with evidence, audit log |
| Communication | Buyer–seller messaging, buyer–JUMART support channel, in-app notifications, email templates |
| Content | Free past questions and lecture materials uploaded by administrators and downloaded by students |
| Airtime | Vendor-registered purchase links that only appear for students after administrator approval |
| Assistant | Grounded shopping assistant answering only from live, approved listings |

## 3. User roles

| Role | Can do |
|---|---|
| Buyer | Browse, search, wishlist, cart, checkout, pay, track orders, review, report, message sellers and JUMART, request refunds |
| Vendor | Everything a buyer can do, plus manage their own store, listings, stock, orders and fulfilment, and see their own sales analytics |
| Moderator | Moderate listings and reviews, work the report queue, resolve disputes, verify students |
| Administrator | Everything moderators can do, plus approve vendors, manage accounts, categories, refunds, learning materials and vendor purchase links |

Roles are enforced on the server. Hiding a button is never the protection.

## 4. Managing vendors

1. A student applies from **Sell → Apply for a vendor store**.
2. The application appears in **Admin → Vendors** with the queue filter on *Pending*.
3. Approve or reject. Approval activates the store, marks it verified, grants the vendor role and notifies the applicant.
4. Rejection explains why and lets the applicant re-apply with corrections.
5. Suspend or pause a store from the same screen if a vendor breaks the rules. Suspension removes their vendor role immediately.

Vendors only ever see their own products, orders and messages — ownership is enforced in every API.

## 5. Managing products

1. The vendor creates a listing, adds photos, price, condition, stock and delivery options.
2. The listing is created as **Draft** or **Pending review**. It is invisible to students until approved.
3. **Admin → Listings** shows the queue. Approve to publish, reject with a note, or delist a live listing.
4. Editing a live listing sends it back for review.
5. Images uploaded through the product manager are re-encoded, stripped of metadata and stored under a random name in Vercel Blob.

## 6. Monitoring orders

- **Admin → Orders** lists every order with status, amount and payment state.
- **Seller view** (`/sell/orders`) shows a seller's own orders and the actions to accept, prepare, dispatch, deliver or cancel.
- **Buyer view** (`/orders`) shows the full status timeline, the seller for each part and the delivery state.
- Unpaid orders expire after 30 minutes; the hold on stock is released automatically. The cleanup endpoint can also be scheduled (`/api/v1/cron/expire-orders`).
- **Admin → Sales analytics** (vendor view) separates gross sales, refunds, delivery fees and the payable balance.

## 7. Payment operations

- Payments start on **Checkout → Place order and pay** and are initialised server-side with the amount taken from the order, never from the browser.
- A payment only becomes successful after Paystack's verification endpoint confirms the transaction **and** the reference, amount and currency match the stored payment.
- Webhooks are signed, de-duplicated and retry-safe; a failed event keeps its error for investigation and is retried by the provider.
- Orders with a failed payment stay unpaid and can be retried by the buyer.
- **Never** mark an order paid manually. If a payment is captured but not applied, the webhook retry or the callback will apply it; escalate to the provider with the order number if it does not.

## 8. Refund and dispute operations

**Refunds** (`Admin → Refunds`)

1. The buyer requests a refund from the order page, with an amount and a reason. Requests are limited to the amount still refundable and to a 14-day window.
2. An administrator approves or rejects with a note.
3. Approval sends the refund to Paystack and records it as *processing* with the provider reference. **Money is only returned when the provider confirms it** — the platform never claims a refund that has not happened.
4. Refunds are deducted from the vendor's gross sales in analytics.

**Disputes** (`Admin → Disputes`)

1. The buyer reports a problem from the order page with a category, a description and optional evidence links.
2. The vendor sees the case and can respond through the message channel.
3. An administrator records the decision and resolution. Both parties are notified and the decision is audit-logged.

## 9. Administrator procedures

| Task | Where |
|---|---|
| Approve or reject vendors | Admin → Vendors |
| Moderate listings | Admin → Listings |
| Publish free learning materials | Admin → Learning materials |
| Approve vendor purchase links (airtime) | Admin → Airtime links |
| Moderate reviews | Admin → Reviews (from the review moderation queue) |
| Work the report queue | Admin → Reports |
| Resolve disputes | Admin → Disputes |
| Decide refunds | Admin → Refunds |
| Manage accounts and roles | Admin → Users |
| Manage categories and ordering | Admin → Categories |
| Answer student questions | Admin → Support |

Every administrative action writes an audit entry with the actor, the before and after state, and the IP address.

## 10. Deployment architecture

```
Browser ──► Vercel (Next.js 16, Node runtime)
              ├── proxy.ts            route protection, cross-origin checks, staff gate
              ├── Route handlers      validation, authorisation, business logic
              ├── Prisma 7 ──► Neon PostgreSQL (pooled + direct URLs)
              ├── Vercel Blob         product images, learning materials
              ├── Paystack API        transaction initialisation, verification, refunds
              ├── Gemini API          grounded shopping assistant
              └── Resend API          transactional email
```

- **Database:** Neon PostgreSQL, branch `production`. `DATABASE_URL_UNPOOLED` is used at runtime for reliability; `DATABASE_URL` is kept for tooling.
- **Files:** Vercel Blob store `campus-market-media` (public bucket, randomised names, metadata-free images).
- **Cron:** the order-expiry job is exposed at `/api/v1/cron/expire-orders` and should be scheduled every 15 minutes with `CRON_SECRET` set.

## 11. Environment configuration

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Yes | Neon pooled and direct connection strings |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin, used for callbacks and CORS-style origin checks |
| `AUTH_SECRET` | Yes | Session signing secret; rotate with care |
| `PAYSTACK_SECRET_KEY` | Yes for payments | Sandbox or live key from Paystack |
| `PAYSTACK_WEBHOOK_SECRET` | Yes for payments | Used to sign webhook verification |
| `PAYSTACK_CALLBACK_URL` | Yes for payments | `https://<domain>/api/v1/payments/callback` |
| `BLOB_READ_WRITE_TOKEN` | Yes for uploads | Vercel Blob store token |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_ENABLED` | Optional | Server-side assistant configuration |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional | Without a key, emails are written to the server log in development only |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Recommended | Distributed rate limiting; without it the in-process limiter applies |
| `CRON_SECRET` | Recommended | Protects the order-expiry endpoint |
| `SEED_SAMPLE_PASSWORD` | Development only | Password for the seeded demo accounts |
| `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_NAME` | Bootstrap only | Used by `pnpm admin:bootstrap` |

Preview deployments must not receive production credentials: they use their own Neon branch and their own Blob store.

## 12. Backup and recovery

- **Database:** Neon keeps point-in-time recovery and branch copies. Restore by cloning the branch and promoting it, then repointing `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
- **Files:** Vercel Blob objects are not covered by database backups. Because every object is referenced by a database row, restore the database first and then re-upload missing objects; the orphan sweep removes unreferenced files.
- **Migrations:** `pnpm db:deploy` applies committed migrations. Never edit an applied migration — add a new one.
- **Recovery drill:** clone the Neon branch, run the migrations against it, restore a recent dump and point a preview deployment at it before promoting.

## 13. Security and privacy considerations

- Passwords are hashed with scrypt and per-user salts. Sessions are random 256-bit tokens; only their SHA-256 hash is stored.
- Commercial operations (checkout, selling, reviews) require a verified email. Unverified accounts can browse, save and message.
- Suspended accounts are rejected at session validation and their sessions revoked immediately.
- Every state-changing API request is checked for cross-origin submission; the Paystack webhook is authenticated by signature instead.
- Uploads are validated by content, re-encoded without metadata, stored under random names and deleted with their database row.
- The audit log records administrative and financial actions. Financial records use restrictive foreign keys so a paid order cannot be deleted by accident.
- **Data minimisation:** the assistant receives only public listing fields. No student, payment or authentication data is sent to the AI provider.
- **Legal review is outstanding.** The privacy notice, terms and retention behaviour have not been reviewed against Ghana's Data Protection Act, 2012 (Act 843). Obtain a legal opinion before launch, and publish a retention schedule for orders, verification requests and disputes.

## 14. Known limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Rate limiting is per instance until Upstash is provisioned | Weaker abuse protection in production | Provision Upstash; anonymous endpoints already fail closed when the store is configured but unreachable |
| Product variants are not exposed in the UI | Sellers describe sizes in the description | Variants are supported in the schema, cart, orders and payment stock handling |
| Vendor settlement is manual | Sellers are paid outside the platform | Gross sales, refunds and delivery fees are separated in analytics; refunds run through the provider |
| Refunds stay "processing" until a person confirms | Slight lag in refund status | An administrator confirms each refund against the provider reference |
| No administrator MFA | Account takeover risk for staff | Enable MFA at the identity provider, or add an enrolment flow, before handling larger volumes |
| Catalogue images are served without on-the-fly resizing | More bandwidth than necessary | Images are already normalised and compressed |
| Playwright journeys have not run in the audit environment | Browser regressions could go unnoticed | The suite runs in CI on every push |

## 15. Maintenance instructions

```bash
pnpm install            # install dependencies and generate the Prisma client
pnpm dev                # local development
pnpm lint               # ESLint
pnpm typecheck          # TypeScript
pnpm format             # Prettier (format:check in CI)
pnpm test:unit          # unit tests
pnpm test:integration   # integration tests (needs a running app; see TESTING_STRATEGY.md)
pnpm build              # production build
pnpm db:deploy         # apply migrations (never edit an applied migration)
pnpm db:generate        # regenerate the Prisma client after schema changes
pnpm db:seed            # development seed data only
pnpm admin:bootstrap    # create or grant the first administrator
```

Routine tasks:

- **New category:** Admin → Categories → New category (no deployment needed).
- **New learning material:** Admin → Learning materials → upload the file (PDF, Word, Excel or image, up to 25MB).
- **New vendor purchase link:** the vendor adds it to a listing; it stays hidden until approved in Admin → Airtime links.
- **Schema change:** edit `prisma/schema.prisma`, run `pnpm db:generate`, create the migration, run `pnpm db:deploy` against a branch first, then production.
- **Release:** push to `main`; Vercel builds and promotes automatically. The GitHub Actions pipeline runs lint, typecheck, unit and integration tests, a production build and a dependency audit on every push.
