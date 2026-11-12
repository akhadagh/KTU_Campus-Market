# Campus Market — API Documentation

**Base path:** `/api/v1`
**Format:** JSON
**Authentication:** Secure session cookie (`cm_session`)
**Platform:** JUMART — Your Campus. Your Marketplace.

> Status legend: **Implemented** — live and verified against the database · **Planned** — specified but not built.

---

## 1. Conventions

### Response envelope

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

Error responses:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "fields": {
      "email": "Enter a valid email address"
    }
  },
  "meta": {}
}
```

### Error codes

`AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `PAYMENT_FAILED`, `PROVIDER_UNAVAILABLE`, `INTERNAL_ERROR`.

### Pagination

List endpoints accept `page` (1-based) and `pageSize`, and return:

```json
{ "data": { "items": [], "page": 1, "pageSize": 24, "total": 137, "pages": 6 } }
```

### Idempotency

`POST /orders` requires `idempotencyKey` (8–128 chars). Repeating a request with the same key returns the original order instead of creating a duplicate. Paystack webhook events are deduplicated on `(provider, eventId)`.

### Authorization

Permissions are resolved server-side from the seeded role/permission tables:

| Permission | Roles | Used by |
|---|---|---|
| `product.create`, `product.edit` | vendor, admin | Vendor product APIs |
| `product.moderate` | moderator, admin | Listing moderation, review moderation |
| `order.manage` | vendor, admin | Vendor fulfilment endpoints |
| `vendor.approve` | admin | Vendor review endpoint |
| `user.manage` | admin | Admin console |
| `report.review` | moderator, admin | Report queue |
| `settings.manage` | admin | Platform settings (planned) |

Client-side hiding is never trusted: every API re-checks the session, role and permission.

---

## 2. Authentication — Implemented

Session cookie: `cm_session` — `HttpOnly`, `SameSite=Lax`, `Secure` in production, 30-day expiry. Tokens are random 256-bit values; only their SHA-256 hash is stored in `sessions`. Passwords use scrypt with per-user salts.

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/auth/register` | Implemented | Create an account, start a session, issue a verification token |
| POST | `/auth/login` | Implemented | Log in |
| POST | `/auth/logout` | Implemented | Revoke session and clear cookie |
| GET | `/auth/session` | Implemented | Current session and user |
| POST | `/auth/verify-email` | Implemented | Verify email with a single-use token |
| POST | `/auth/resend-verification` | Implemented | Issue a fresh verification token (logged-in users) |
| POST | `/auth/forgot-password` | Implemented | Request a reset link (generic response, no enumeration) |
| POST | `/auth/reset-password` | Implemented | Set a new password and revoke all sessions |

Registration body:

```json
{
  "fullName": "Ama Mensah",
  "email": "ama@example.com",
  "phone": "+233200000000",
  "password": "strong-password"
}
```

Register response (`201`, sets cookie):

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Ama Mensah",
      "email": "ama@example.com",
      "phone": "+233200000000",
      "status": "ACTIVE",
      "emailVerifiedAt": null,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "emailVerification": "sent"
  },
  "error": null,
  "meta": null
}
```

`emailVerification` is `sent`, `provider_not_configured` or `provider_error`. Verification and reset emails are delivered through Resend when `RESEND_API_KEY` is set; otherwise they are written to the server log in development only, and the API reports that honestly.

Auth error behaviour:

| Case | Status | Code |
|---|---|---|
| Invalid input | 422 | `VALIDATION_ERROR` (with `fields`) |
| Duplicate email | 409 | `CONFLICT` |
| Wrong email/password | 401 | `AUTH_REQUIRED` (generic message) |
| Suspended/banned account | 403 | `FORBIDDEN` |
| Too many attempts (10/min/IP) | 429 | `RATE_LIMITED` |

Protected routes (`/account`, `/orders`, `/messages`, `/notifications`, `/sell`, `/wishlist`, `/checkout`, `/admin`) redirect guests to `/login?next=<path>` in `proxy.ts` and re-check the session server-side.

---

## 3. Users and preferences — Partially implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/users/me` | Planned | Current profile |
| PATCH | `/users/me` | Planned | Update profile |
| GET | `/users/me/notifications` | Planned | Notification preferences |

`GET /auth/session` currently returns the profile fields used by the account page.

---

## 4. Vendors — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/vendors/apply` | Implemented | Apply to become a vendor (status `PENDING`) |
| GET | `/vendors/me` | Implemented | Own vendor profile |
| PATCH | `/vendors/me` | Implemented | Update store settings |
| GET | `/admin/vendors` | Implemented | Vendor queue, filter by `status` |
| POST | `/admin/vendors/:id/review` | Implemented | `APPROVE`, `REJECT`, `SUSPEND`, `REACTIVATE`, `PAUSE` |
| GET | `/vendors/:slug` | Planned | JSON storefront (the storefront page is live) |
| GET | `/vendors/me/analytics` | Planned | Store analytics |

Approving a vendor sets `status=ACTIVE`, `verificationStatus=VERIFIED`, grants the `vendor` role, and notifies the applicant. Rejecting sets `status=CLOSED`, `verificationStatus=REJECTED` and allows the applicant to re-apply.

---

## 5. Categories — Partially implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/categories` | Planned | Active category tree (JSON) |
| GET | `/categories/:slug` | Planned | Category and children (JSON) |
| POST | `/admin/categories` | Planned | Create category (admin) |
| PATCH | `/admin/categories/:id` | Planned | Update category (admin) |
| DELETE | `/admin/categories/:id` | Planned | Deactivate category (admin) |

Category pages and marketplace filters already read the seeded `categories` table directly.

---

## 6. Products — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/products/:slug` | Implemented | Live product detail (public) |
| POST | `/vendor/products` | Implemented | Create product (vendor, `product.create`) |
| POST | `/vendor/products/images` | Implemented | Upload a product photo to Vercel Blob |
| PATCH | `/vendor/products/:id` | Implemented | Update own product, change status, replace images |
| DELETE | `/vendor/products/:id` | Implemented | Archive own product |
| GET | `/products` | Planned | JSON list endpoint (marketplace page filters live) |
| POST | `/products/:id/images` | Planned | Upload image (needs storage provider) |
| DELETE | `/products/:id/images/:imageId` | Planned | Remove image |
| POST | `/products/:id/variants` | Planned | Create variant |

Create body (prices in cedis; the server converts to pesewas):

```json
{
  "name": "HP EliteBook 840 G5",
  "categoryId": "uuid",
  "description": "Refurbished, 16GB RAM, 512GB SSD, charger included.",
  "priceCedis": 2850,
  "originalPriceCedis": 3200,
  "condition": "USED_GOOD",
  "quantity": 3,
  "deliveryOptions": ["PICKUP", "CAMPUS_DELIVERY"],
  "pickupAvailable": true,
  "tags": ["laptop", "dell"],
  "imageUrls": ["https://example.com/photo.jpg"],
  "status": "PENDING_REVIEW",
  "purchaseMode": "INTERNAL",
  "externalUrl": "",
  "network": "",
  "dataAmount": "",
  "validity": ""
}
```

`purchaseMode` is `INTERNAL` (sold and fulfilled on Campus Market) or `EXTERNAL` (buyers are redirected to the seller's own site or app, where `externalUrl` is required). Digital products use the `DIGITAL` delivery option and carry `digitalDetails` with `network`, `dataAmount` and `validity`. Images are uploaded through `POST /vendor/products/images` as multipart form data (`file`, JPEG/PNG/WebP/AVIF, 5MB max) and stored in Vercel Blob, so no storage secret ever reaches the browser.

Vendors can only set `DRAFT`, `PENDING_REVIEW` or `ARCHIVED`. Editing a live listing sends it back to `PENDING_REVIEW` for moderation. Marketplace query parameters (`q`, `category`, `condition`, `sort`, `page`) are supported by the marketplace page; sort values are `newest`, `price_asc`, `price_desc`, `name`, `rating`.

---

## 7. Search — Planned

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/search` | Planned | Unified product search |
| GET | `/search/suggestions` | Planned | Query suggestions |

The marketplace page already performs case-insensitive matching over name, description and tags, with category and condition filters.

---

## 8. Cart and wishlist — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/cart` | Implemented | Current cart with totals and per-vendor grouping |
| POST | `/cart` | Implemented | Add a product (body `{ "productId", "quantity" }`) |
| PATCH | `/cart/items/:id` | Implemented | Update quantity |
| DELETE | `/cart/items/:id` | Implemented | Remove item |
| POST | `/cart/merge` | Planned | Merge guest cart after login |
| GET | `/wishlist` | Implemented | Saved products |
| POST | `/wishlist` | Implemented | Toggle a product in the wishlist |
| DELETE | `/wishlist/items/:id` | Planned | Remove by item id |

Guests get a cart identified by the `cm_guest` cookie; signed-in users get one cart row. The server recalculates prices and stock on every response and hides items whose product or store is no longer active.

---

## 9. Checkout and orders — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/orders` | Implemented | Create the order (and its per-vendor sub-orders) |
| GET | `/orders` | Implemented | Buyer order list (page) |
| GET | `/orders/:id` | Implemented | Buyer order detail (page) |
| GET | `/vendor/orders` | Implemented | Vendor order list (page) |
| PATCH | `/vendor/orders/:id/status` | Implemented | Advance fulfilment status |
| GET | `/airtime` | Implemented | Airtime and data bundle catalogue (page) |
| POST | `/checkout` | Planned | Combined checkout + payment endpoint |
| POST | `/orders/:id/cancel` | Planned | Buyer cancellation request |

Checkout body:

```json
{
  "deliveryMethod": "CAMPUS_DELIVERY",
  "pickupLocationId": null,
  "deliveryAddress": {
    "fullName": "Ama Mensah",
    "phone": "+233200000000",
    "address": "Hostel B, room 12",
    "instructions": "Near the main gate"
  },
  "notes": "Please call on arrival",
  "msisdn": "0241234567",
  "idempotencyKey": "9f0c…"
}
```

`msisdn` is required when the cart contains a digital bundle (airtime or data). Digital orders are created with `deliveryMethod: "DIGITAL"`, the number is stored on the vendor order as `Credit to <number>` and on the order item snapshot, so the seller knows exactly which line to credit.

The server recalculates the subtotal, applies per-seller delivery fees (campus delivery GH₵5.00, courier GH₵15.00, pickup free), splits the order per vendor, creates `OrderItem` snapshots, holds inventory (`InventoryReservation`, 30 minutes) and writes the first `OrderStatusHistory` row. It never accepts client-supplied prices or totals.

Vendor fulfilment transitions: `PENDING → ACCEPTED → PREPARING → READY_FOR_PICKUP / OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED` available until delivery. Invalid transitions return `409`. The parent order becomes `PARTIALLY_FULFILLED` or `FULFILLED` automatically.

---

## 10. Payments and refunds — Implemented (initiation, verification)

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/payments/initialize` | Implemented | Start a Paystack transaction for an order |
| GET | `/payments/initialize?reference=` | Implemented | Verify a transaction and mark the order paid |
| GET | `/payments/callback?reference=` | Implemented | Paystack redirect target, verifies then redirects to the order |
| POST | `/payments/webhook` | Implemented | Signed webhook with event de-duplication |
| POST | `/payments/:id/refund` | Planned | Refund workflow |

`POST /payments/initialize` body: `{ "orderId": "uuid" }` →

```json
{
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/…",
    "reference": "CM-CM-20261110-12345-ABCD",
    "paymentId": "uuid"
  },
  "error": null,
  "meta": null
}
```

If Paystack is not configured the endpoint returns `503 PROVIDER_UNAVAILABLE` — the platform never fakes a payment. The webhook validates the `x-paystack-signature` HMAC-SHA512 signature against `PAYSTACK_WEBHOOK_SECRET` and de-duplicates on `(PAYSTACK, eventId)` before marking the order `PAID`, consuming reservations and decrementing stock.

---

## 10b. Airtime and data bundles — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/airtime` | Implemented | Verified merchant catalogue with their packages (page) |
| GET | `/api/v1/products/:slug` | Implemented | Bundle details including `purchaseMode`, `externalStatus` and `digitalDetails` |
| POST | `/api/v1/admin/products/:id/external-review` | Implemented | Approve or reject a vendor purchase link |

Vendors register airtime and data packages as `purchaseMode: EXTERNAL` with `externalUrl` pointing at their own site or app. Every new link starts as `externalStatus: PENDING` and is hidden from students until an administrator approves it; the public catalogue, marketplace queries and product endpoint all filter on `purchaseMode = INTERNAL` **or** `externalStatus = APPROVED`. Rejecting a link notifies the vendor and records the decision in the audit log.

---

## 11. Delivery and pickup — Partially implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/pickup-locations` | Planned | Active pickup points (JSON) |
| POST | `/vendor/orders/:id/delivery` | Planned | Delivery record and tracking code |

Pickup locations are seeded and selectable during checkout; the chosen method and address are stored on the order and vendor order.

---

## 12. Reviews — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/reviews` | Implemented | Review a delivered order item (verified purchase) |
| POST | `/admin/reviews/:id/review` | Implemented | `APPROVE`, `REJECT`, `REMOVE` a review |

Only items whose vendor order is `DELIVERED` can be reviewed, one review per order item. New reviews start as `PENDING`; publishing recomputes the product and store rating averages.

---

## 12b. Free learning materials — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/resources` | Implemented | Free materials library (page) |
| GET | `/api/v1/resources` | Implemented | Published materials, filter by `q`, `course`, `category` |
| POST | `/api/v1/resources/:id/download` | Implemented | Count the download and redirect to the file |
| GET | `/api/v1/admin/resources` | Implemented | All materials with status and download counts |
| POST | `/api/v1/admin/resources` | Implemented | Upload a file to Vercel Blob and publish it |
| PATCH | `/api/v1/admin/resources/:id` | Implemented | `DRAFT`, `PUBLISHED` or `ARCHIVED` |

Materials are uploaded by administrators as multipart form data (`file`, plus `title`, `course`, `level`, `category`, `description`). Files are stored in Vercel Blob and every published material is downloadable free by students.

---

## 13. Messaging and notifications — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/conversations` | Implemented | Buyer conversations (seller and JUMART support) with the last message |
| POST | `/conversations` | Implemented | Start (or reuse) a conversation and send a message |
| POST | `/conversations` (kind `SUPPORT`) | Implemented | Open a support thread with the JUMART team (`subject` + `body`) |
| GET | `/conversations/:id/messages` | Implemented | Message history (marks the other side read) |
| POST | `/conversations/:id/messages` | Implemented | Reply in a conversation |
| GET | `/notifications` | Implemented | Notifications with unread count |
| POST | `/notifications` | Implemented | Mark notifications as read (all or by id) |

Messages are restricted to the buyer, the store owner and staff on support threads; the other party receives a notification. Support threads have `kind = SUPPORT`, no store attached, and are answered in the admin inbox at `/admin/messages`.

---

## 14. Reports and disputes — Partially implemented

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/reports` | Implemented | Report a product, store, user, order or review |
| PATCH | `/admin/reports/:id` | Implemented | `IN_REVIEW`, `RESOLVED`, `DISMISSED` |
| POST | `/orders/:id/disputes` | Planned | Raise a dispute with evidence |

---

## 15. AI — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| POST | `/ai/assistant` | Implemented | Grounded shopping assistant |
| POST | `/ai/description` | Planned | Vendor description drafting |

Request: `{ "message": "I need a charger under GH₵100" }` →

```json
{
  "data": {
    "reply": "Two matching chargers are available on campus…",
    "products": [
      {
        "id": "uuid",
        "slug": "usb-c-fast-charger-65w",
        "name": "USB-C Fast Charger 65W",
        "pricePesewas": 8500,
        "vendorName": "KTU Test Gadgets",
        "vendorSlug": "ktu-test-gadgets",
        "categoryName": "Electronics & Gadgets",
        "condition": "NEW"
      }
    ],
    "source": "ai"
  },
  "error": null,
  "meta": null
}
```

`source` is `ai` when Gemini answered or `search` when the assistant fell back to the listing index (provider missing, unreachable, or erroring). The prompt lists only live, approved listings, so the model cannot invent products or prices. Rate limit: 30 requests per user per hour.

---

## 16. Administration — Implemented

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/admin/vendors` | Implemented | Vendor queue (`?status=PENDING\|ACTIVE\|PAUSED\|SUSPENDED\|CLOSED`) |
| POST | `/admin/vendors/:id/review` | Implemented | Vendor decision |
| GET | `/admin/products` | Implemented | Listing queue (`?status=PENDING_REVIEW\|ACTIVE\|…`) |
| POST | `/admin/products/:id/review` | Implemented | `APPROVE`, `REJECT`, `DELIST` |
| POST | `/admin/reviews/:id/review` | Implemented | Review moderation |
| PATCH | `/admin/reports/:id` | Implemented | Report decisions |
| GET | `/admin/users` | Planned | User management |
| GET | `/admin/analytics` | Planned | Platform analytics |
| GET | `/admin/messages` | Implemented | Support inbox (page) |
| GET | `/admin/airtime` | Implemented | Vendor purchase-link approval queue (page) |

Admin pages (`/admin`, `/admin/vendors`, `/admin/products`, `/admin/orders`, `/admin/reports`, `/admin/reviews`) render from the database and are permission-gated server-side.

---

## 17. Health and metadata — Implemented

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service and database health |
| GET | `/api/v1/products/:slug` | Public product detail for integrations |

---

## 18. Rate limits

| Scope | Limit | Endpoint |
|---|---|---|
| Per IP | 10/minute | `/auth/register`, `/auth/login` |
| Per IP | 5/10 minutes | `/auth/forgot-password` |
| Per IP | 10/10 minutes | `/auth/reset-password` |
| Per user | 3/10 minutes | `/auth/resend-verification` |
| Per user | 5/hour | `/vendors/apply` |
| Per IP | 60/minute | `/cart` |
| Per user | 30/hour | `/ai/assistant` |
| Per user | 20/10 minutes | `/payments/initialize` |
| Per user | 30/10 minutes | `/conversations` (messages) |
| Per user | 20/hour | `/reviews`, `/reports` |
| Per user | 60/hour | `/vendor/products` (listing creation) |
| Per user | 30/10 minutes | `/vendor/products/images` (uploads) |

Limits use the shared Upstash Redis store when it is configured. Anonymous abuse-prone endpoints (registration, password reset, uploads) fail closed while the shared store is unreachable; authenticated endpoints fall back to the per-instance bucket. See [SECURITY_NOTES.md](./SECURITY_NOTES.md).

Limits are enforced in-process, so they are per instance. A shared store (Upstash Redis) is required for multi-region deployments.
