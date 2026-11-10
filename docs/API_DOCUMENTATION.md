# Campus Market — API Documentation

**Base path:** `/api/v1`  
**Format:** JSON  
**Authentication:** Secure session cookie

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

```text
?page=1&limit=20&sort=newest
```

Response meta:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

### Idempotency

Checkout and payment initiation accept:

```text
Idempotency-Key: <uuid>
```

The server stores the key with a unique constraint and returns the original result for retries.

### Authorization

- Public endpoints allow guest browsing.
- Authenticated endpoints require a valid session.
- Vendor endpoints require vendor capability plus resource ownership.
- Admin endpoints require explicit administrative capability.

---

## 2. Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Revoke session |
| GET | `/auth/session` | Current session and user |
| POST | `/auth/verify-email` | Verify email with token |
| POST | `/auth/resend-verification` | Resend verification |
| POST | `/auth/forgot-password` | Request reset |
| POST | `/auth/reset-password` | Reset with token |

Example registration body:

```json
{
  "fullName": "Ama Mensah",
  "email": "ama@example.com",
  "phone": "+233200000000",
  "password": "strong-password",
  "universityId": "uuid",
  "campusId": "uuid"
}
```

---

## 3. Users and preferences

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Current profile |
| PATCH | `/users/me` | Update profile |
| PATCH | `/users/me/preferences` | Update preferences |
| POST | `/users/me/verification` | Submit student verification |
| GET | `/users/me/verification` | Verification status |

Public user data is limited to display-safe fields. Email and phone are private by default.

---

## 4. Vendors

| Method | Path | Description |
|---|---|---|
| POST | `/vendors/apply` | Apply to become a vendor |
| GET | `/vendors/me` | Own vendor profile |
| PATCH | `/vendors/me` | Update store settings |
| GET | `/vendors/:slug` | Public storefront |
| GET | `/vendors/me/analytics` | Store analytics |

---

## 5. Categories

| Method | Path | Description |
|---|---|---|
| GET | `/categories` | Active category tree |
| GET | `/categories/:slug` | Category and children |
| POST | `/admin/categories` | Create category (admin) |
| PATCH | `/admin/categories/:id` | Update category (admin) |
| DELETE | `/admin/categories/:id` | Deactivate category (admin) |

---

## 6. Products

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List/filter products |
| GET | `/products/:slug` | Product details |
| POST | `/products` | Create product (vendor) |
| PATCH | `/products/:id` | Update own product |
| DELETE | `/products/:id` | Soft-delete own product |
| POST | `/products/:id/images` | Upload image |
| DELETE | `/products/:id/images/:imageId` | Remove image |
| POST | `/products/:id/variants` | Create variant |
| PATCH | `/products/:id/variants/:variantId` | Update variant |

Product query parameters:

`q`, `category`, `subcategory`, `campus`, `condition`, `minPrice`, `maxPrice`, `rating`, `available`, `vendor`, `sort`, `page`, `limit`.

Sort values: `newest`, `price_asc`, `price_desc`, `popular`, `relevance`.

Uploads use server-authorized multipart or signed upload requests. Clients do not receive storage secrets.

---

## 7. Search

| Method | Path | Description |
|---|---|---|
| GET | `/search` | Unified product search |
| GET | `/search/suggestions` | Query suggestions |

The search endpoint uses the same filters as `/products` and supports relevance ranking with PostgreSQL full-text and trigram matching.

---

## 8. Cart and wishlist

| Method | Path | Description |
|---|---|---|
| GET | `/cart` | Current cart |
| POST | `/cart/items` | Add item |
| PATCH | `/cart/items/:id` | Update quantity |
| DELETE | `/cart/items/:id` | Remove item |
| POST | `/cart/merge` | Merge guest cart |
| GET | `/wishlist` | Wishlist |
| POST | `/wishlist/items` | Add item |
| DELETE | `/wishlist/items/:id` | Remove item |

The server recalculates prices and stock on every cart response. Cart responses include unavailable-item warnings.

---

## 9. Checkout and orders

| Method | Path | Description |
|---|---|---|
| POST | `/checkout` | Create order(s) and initiate checkout |
| GET | `/orders` | Buyer orders |
| GET | `/orders/:id` | Buyer order detail |
| POST | `/orders/:id/cancel` | Request cancellation |
| GET | `/vendor/orders` | Vendor orders |
| POST | `/vendor/orders/:id/accept` | Accept vendor order |
| POST | `/vendor/orders/:id/status` | Advance fulfilment status |

Checkout body:

```json
{
  "cartId": "uuid",
  "campusId": "uuid",
  "deliveryMethod": "pickup",
  "pickupLocationId": "uuid",
  "deliveryAddress": null,
  "instructions": "",
  "paymentMethod": "mobile_money",
  "paymentProvider": "paystack",
  "idempotencyKey": "uuid"
}
```

The server returns order IDs, vendor order IDs, totals, and payment initiation data. It never accepts client-supplied prices or totals.

---

## 10. Payments and refunds

| Method | Path | Description |
|---|---|---|
| POST | `/payments/initiate` | Initiate payment for an order |
| GET | `/payments/:reference/verify` | Verify payment status |
| POST | `/webhooks/paystack` | Paystack webhook |
| POST | `/admin/payments/:id/refund` | Refund (admin) |

Webhook requirements:

- Read the raw body.
- Verify the provider signature.
- Store the event idempotently.
- Re-fetch the transaction from the provider.
- Match reference, amount, and currency.
- Apply changes transactionally.

---

## 11. Delivery and pickup

| Method | Path | Description |
|---|---|---|
| GET | `/pickup-locations` | Active pickup locations |
| POST | `/vendor/orders/:id/delivery` | Record delivery/tracking |
| POST | `/vendor/orders/:id/confirm-delivery` | Confirm delivery |
| GET | `/orders/:id/tracking` | Buyer tracking view |

---

## 12. Reviews

| Method | Path | Description |
|---|---|---|
| POST | `/reviews` | Create review for eligible purchase |
| GET | `/products/:id/reviews` | Product reviews |
| GET | `/vendors/:slug/reviews` | Vendor reviews |
| PATCH | `/admin/reviews/:id` | Moderate review |

Review creation is rejected unless the reviewer has a completed, paid, non-refunded order item for that product and no existing review for the item.

---

## 13. Messaging and notifications

| Method | Path | Description |
|---|---|---|
| GET | `/conversations` | User conversations |
| POST | `/conversations` | Start conversation |
| GET | `/conversations/:id/messages` | Messages |
| POST | `/conversations/:id/messages` | Send message |
| GET | `/notifications` | Notifications |
| PATCH | `/notifications/:id/read` | Mark read |
| POST | `/notifications/read-all` | Mark all read |

Only conversation participants may read or send messages.

---

## 14. Reports and disputes

| Method | Path | Description |
|---|---|---|
| POST | `/reports` | Report product/vendor/user/review/transaction |
| GET | `/reports/me` | Own reports |
| POST | `/disputes` | Open dispute |
| GET | `/disputes/:id` | Dispute detail |
| POST | `/disputes/:id/evidence` | Upload evidence |
| GET | `/admin/reports` | Moderation queue |
| PATCH | `/admin/reports/:id` | Resolve report |
| GET | `/admin/disputes` | Dispute queue |
| PATCH | `/admin/disputes/:id` | Resolve dispute |

Access is restricted to the involved parties and authorized staff.

---

## 15. AI

| Method | Path | Description |
|---|---|---|
| POST | `/ai/assistant` | Conversational marketplace search |
| GET | `/ai/recommendations` | Personalized recommendations |
| POST | `/ai/description` | Vendor description draft |

Assistant request:

```json
{
  "message": "I need a laptop under GH₵3,000 for programming",
  "campusId": "uuid"
}
```

Assistant response:

```json
{
  "data": {
    "message": "Here are three laptops under GH₵3,000...",
    "products": [
      { "id": "uuid", "slug": "hp-elitebook-840", "name": "HP EliteBook 840" }
    ],
    "fallbackUsed": false
  }
}
```

All product facts must come from the search tool. If AI is unavailable, `fallbackUsed` is `true` and deterministic results are returned.

---

## 16. Administration

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | List users |
| PATCH | `/admin/users/:id/status` | Suspend/restore |
| GET | `/admin/vendors` | Vendor applications |
| POST | `/admin/vendors/:id/approve` | Approve vendor |
| POST | `/admin/vendors/:id/reject` | Reject vendor |
| GET | `/admin/verifications` | Student/vendor verifications |
| PATCH | `/admin/verifications/:id` | Review verification |
| GET | `/admin/products` | Moderate listings |
| GET | `/admin/orders` | Orders |
| GET | `/admin/payments` | Payments |
| GET | `/admin/analytics` | Platform metrics |
| GET | `/admin/audit-logs` | Audit history |
| GET/PATCH | `/admin/settings` | Platform settings |
| POST | `/admin/announcements` | Publish announcement |
| GET/PATCH | `/admin/support` | Support tickets |
| POST/PATCH | `/admin/campuses` | Campus management |
| POST/PATCH | `/admin/pickup-locations` | Pickup locations |

Every admin mutation writes an audit log entry.

---

## 17. Health and metadata

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Database and service health |
| GET | `/version` | Build version and environment |

Health responses must not expose secrets or detailed internal errors.

---

## 18. Rate limits

Suggested initial limits:

| Endpoint group | Limit |
|---|---|
| Login/register/reset | 10 per 15 minutes per IP |
| Email resend | 3 per 15 minutes per account |
| Search | 60 per minute per user/IP |
| AI assistant | 20 per hour per user |
| Uploads | 20 per hour per vendor |
| Messaging | 30 per minute per user |
| Reports | 10 per day per user |

Limits are configurable and enforced server-side.
