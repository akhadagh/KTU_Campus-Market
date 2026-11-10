# Campus Market — Software Requirements Specification (SRS)

**Version:** 1.0  
**Status:** Approved for implementation planning  
**Scope:** Initial launch at Koforidua Technical University (KTU), Ghana, with architecture ready for additional universities.

---

## 1. Purpose

Campus Market is a multi-vendor marketplace for university communities. It enables students to buy and sell products, operate storefronts, arrange campus pickup or delivery, communicate, and discover products through search and a grounded AI shopping assistant.

This SRS defines the functional and non-functional requirements for the first production release.

---

## 2. Product goals

1. One account supports buying and selling.
2. Eligible students can become vendors.
3. Every marketplace claim is backed by database records.
4. Payments are verified server-side.
5. AI recommendations never invent products, prices, sellers, or availability.
6. Trust and safety are built into the workflow.
7. The experience is mobile-first, fast, and accessible.
8. The platform can add universities and campuses without a rewrite.

---

## 3. Scope

### In scope for launch

- Buyer and vendor accounts with email verification.
- Student and vendor verification workflows.
- Vendor storefronts and product listings.
- Categories, subcategories, search, filters, sorting, pagination.
- Cart, wishlist, multi-vendor checkout.
- Parent orders and vendor-specific fulfilment.
- Campus pickup, delivery instructions, order tracking.
- Payment adapter with sandbox integration and server verification.
- Reviews, reporting, disputes, moderation.
- Buyer, vendor, moderator, support, and administrator roles.
- In-app notifications and buyer–vendor messaging.
- Grounded AI shopping assistant and optional vendor description drafting.
- Administration of users, vendors, categories, listings, orders, payments, reports, disputes, campuses, pickup locations, policies, and settings.

### Out of scope for launch

- Native Android/iOS applications.
- Cross-university settlement and multi-currency.
- Vendor subscriptions, auctions, and paid promotion auctions.
- Legally binding escrow.
- Automated fraud scoring and machine-learning risk models.
- Live courier dispatch integration.
- Advanced loyalty, group buying, and price-drop notifications.

These may be added later without re-architecting the core.

---

## 4. Users and roles

| Role | Responsibilities |
|---|---|
| Guest | Browse, search, view products and stores. Cannot checkout. |
| Buyer | Registered user who can buy, review eligible purchases, message vendors, and report content. |
| Vendor | Registered user with an approved store. Can also buy. |
| Moderator | Reviews reports, suspicious listings, reviews, and content. |
| Support Agent | Handles support tickets with limited order visibility. |
| Administrator | Manages users, verification, categories, listings, orders, payments, disputes, settings, and audit logs. |
| Super Administrator | Optional break-glass role for role assignment and critical configuration. |

A user may hold multiple roles. Registration grants the buyer role only. Elevated roles cannot be self-assigned.

---

## 5. Functional requirements

Priority: **M** = must have for launch, **S** = should have, **C** = could have.

### 5.1 Accounts and authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Register with full name, email, phone, password, university, and campus. | M |
| FR-002 | Validate email format, phone format, password strength, and duplicate email. | M |
| FR-003 | Send a single-use email verification token with expiry. | M |
| FR-004 | Require email verification before checkout and vendor onboarding. | M |
| FR-005 | Log in with email and password using secure sessions. | M |
| FR-006 | Log out and revoke the active session. | M |
| FR-007 | Recover a password with a single-use token; revoke sessions after reset. | M |
| FR-008 | View and edit profile, avatar, phone, campus, and preferences. | M |
| FR-009 | Disable personalization and manage notification preferences. | S |
| FR-010 | Submit student verification via institutional email or document review. | M |
| FR-011 | Keep student verification documents private. | M |
| FR-012 | Distinguish registered, verified student, and verified vendor statuses. | M |

### 5.2 Vendors and catalog

| ID | Requirement | Priority |
|---|---|---|
| FR-020 | Apply to become a vendor with store name, description, logo, campus, and business category. | M |
| FR-021 | Administrator approves or rejects vendor applications. | M |
| FR-022 | Vendor has a public storefront with products and ratings. | M |
| FR-023 | Vendor creates, edits, deactivates, and safely deletes own listings. | M |
| FR-024 | Product fields include name, description, category, subcategory, price, original price, condition, images, quantity, variants, campus, delivery options, pickup options, tags, and availability. | M |
| FR-025 | Support multiple images per product with validation and optimization. | M |
| FR-026 | Support product variants and stock. | M |
| FR-027 | Administrators manage categories and subcategories without code changes. | M |
| FR-028 | Vendors cannot manage another vendor’s store or listings. | M |

### 5.3 Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-030 | Browse all products and by category. | M |
| FR-031 | Search names, descriptions, and tags. | M |
| FR-032 | Filter by price, campus, condition, vendor rating, and availability. | M |
| FR-033 | Sort by newest, price, popularity, and relevance. | M |
| FR-034 | Paginate results with stable ordering. | M |
| FR-035 | Provide useful empty states and search suggestions. | S |
| FR-036 | Product details show images, title, price, condition, description, stock, variants, vendor, verification, ratings, location, delivery/pickup, reviews, and related products. | M |

### 5.4 Cart, checkout, and orders

| ID | Requirement | Priority |
|---|---|---|
| FR-040 | Add, remove, and update cart items with server validation. | M |
| FR-041 | Persist carts for authenticated users and merge guest carts on login. | M |
| FR-042 | Validate inventory and prices server-side before checkout. | M |
| FR-043 | Support multi-vendor carts and one vendor order per vendor. | M |
| FR-044 | Checkout collects customer details, campus, delivery or pickup, instructions, and payment method. | M |
| FR-045 | Show a complete cost breakdown with no hidden charges. | M |
| FR-046 | Create orders transactionally and idempotently. | M |
| FR-047 | Enforce a valid order state machine on the server. | M |
| FR-048 | Maintain auditable order status history. | M |
| FR-049 | Buyers can view only their own orders. | M |
| FR-050 | Vendors can view and fulfil only their own vendor orders. | M |

### 5.5 Payments and delivery

| ID | Requirement | Priority |
|---|---|---|
| FR-060 | Initiate payment server-side with a unique reference. | M |
| FR-061 | Verify payment server-side; never trust a frontend success message. | M |
| FR-062 | Verify webhook signatures and prevent duplicate processing. | M |
| FR-063 | Record payment status and auditable transaction history. | M |
| FR-064 | Support failed, pending, abandoned, and refunded payments. | M |
| FR-065 | Refunds require authorization and provider confirmation. | M |
| FR-066 | Support campus pickup and administrator-managed pickup locations. | M |
| FR-067 | Support vendor-arranged delivery and delivery instructions. | M |
| FR-068 | Do not mark an order delivered or paid without valid confirmation. | M |
| FR-069 | Maintain a vendor ledger for gross, fees, and net amounts. | M |

### 5.6 Trust, safety, and moderation

| ID | Requirement | Priority |
|---|---|---|
| FR-070 | Only buyers with a completed eligible purchase may review. | M |
| FR-071 | Prevent duplicate reviews for the same order item. | M |
| FR-072 | Users can report products, vendors, users, reviews, and transactions. | M |
| FR-073 | Administrators and moderators review reports in a queue. | M |
| FR-074 | Disputes support category, order reference, description, evidence, status, and resolution. | M |
| FR-075 | Only authorized parties can access dispute evidence. | M |
| FR-076 | Marketplace policies are configurable and published. | M |
| FR-077 | Privileged actions are recorded in an append-only audit log. | M |

### 5.7 Messaging and notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-080 | Buyers and vendors can exchange messages scoped to a conversation. | S |
| FR-081 | Conversation history and timestamps are persisted. | S |
| FR-082 | Only participants can access a conversation. | M |
| FR-083 | Basic anti-spam controls apply to messaging. | S |
| FR-084 | In-app notifications cover orders, payments, messages, disputes, and verification. | M |
| FR-085 | Email notifications are supported when configured. | S |
| FR-086 | SMS notifications are optional and configurable. | C |

### 5.8 AI assistant

| ID | Requirement | Priority |
|---|---|---|
| FR-090 | Accept natural-language shopping requests and extract structured filters. | S |
| FR-091 | Search only real marketplace listings through server-side tools. | S |
| FR-092 | Return listing links and explain differences from real data. | S |
| FR-093 | Never invent products, sellers, prices, ratings, or availability. | M |
| FR-094 | Fall back to deterministic search when AI is unavailable. | M |
| FR-095 | Allow users to disable personalization. | S |
| FR-096 | Generate vendor description drafts that require vendor approval. | C |
| FR-097 | Optionally check image quality, duplicates, and inappropriate content. | C |

### 5.9 Dashboards and administration

| ID | Requirement | Priority |
|---|---|---|
| FR-100 | Buyer dashboard shows orders, wishlist, reviews, messages, and notifications. | M |
| FR-101 | Vendor dashboard shows real counts, orders, revenue, views, and reviews. | M |
| FR-102 | Administrators manage users, vendors, categories, listings, orders, payments, reports, disputes, campuses, pickup locations, policies, and announcements. | M |
| FR-103 | Administrators view analytics and audit logs. | M |
| FR-104 | No dashboard statistic may be hardcoded. | M |
| FR-105 | Administrative operations are unavailable to ordinary users. | M |

---

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-001 | Passwords hashed with Argon2id; sessions stored as hashed opaque tokens or in a trusted session store. |
| NFR-002 | Authorization enforced server-side for every read and write. |
| NFR-003 | All inputs validated with shared schemas; outputs encoded to prevent XSS. |
| NFR-004 | CSRF protections and secure cookie attributes on all mutating requests. |
| NFR-005 | Rate limiting on authentication, search, AI, uploads, messaging, reporting, and checkout. |
| NFR-006 | Uploaded files validated by MIME, size, and extension; images re-encoded and EXIF stripped where supported. |
| NFR-007 | Payment webhooks signature-verified, timestamp-checked, and idempotent. |
| NFR-008 | Financial and audit records protected from cascading deletion. |
| NFR-009 | PII minimized and not exposed through public APIs. |
| NFR-010 | Verification documents stored privately with restricted access. |
| NFR-011 | Core Web Vitals targets: LCP under 2.5 s, CLS under 0.1, INP under 200 ms on representative mobile hardware. |
| NFR-012 | Responsive from 320 px upward; WCAG 2.2 AA target. |
| NFR-013 | Pagination and indexed queries for all list endpoints. |
| NFR-014 | Core marketplace works when AI, SMS, or email providers are unavailable. |
| NFR-015 | No secrets in client bundles or version control. |
| NFR-016 | Structured logging without sensitive data. |
| NFR-017 | Database backups and tested restore procedure before launch. |
| NFR-018 | Architecture supports additional universities and campuses through data scoping. |
| NFR-019 | No fake payment confirmations, fake statistics, or nonfunctional demonstration buttons. |
| NFR-020 | Ghana Data Protection Act 2012 (Act 843) considerations documented; legal review required before production launch. |

---

## 7. Key business rules

1. A user account can buy and sell; elevation to vendor requires approval.
2. A listing belongs to exactly one vendor.
3. Prices are stored in integer pesewas (GHS 1 = 100 pesewas).
4. Server calculates all totals; client-supplied totals are ignored.
5. Stock is reserved at order creation and confirmed on payment.
6. One checkout creates one parent order and one vendor order per vendor.
7. Order status transitions are restricted to the defined state machine.
8. Reviews require a completed order item and are unique per order item.
9. Verification statuses are separate and independently displayed.
10. Payment success requires provider verification, not a browser response.

---

## 8. Order status model

Parent order statuses:

`PENDING` → `PAYMENT_PENDING` → `PAID` → `PROCESSING` → `COMPLETED`

with terminal or exceptional states:

`CANCELLED`, `DISPUTED`, `REFUNDED`, `FAILED`

Vendor order statuses:

`PENDING` → `ACCEPTED` → `PROCESSING` → `READY_FOR_PICKUP` / `SHIPPED` → `DELIVERED` → `COMPLETED`

with `CANCELLED`, `DISPUTED`, `REFUNDED`.

Only server-side transition rules may change these statuses. Each transition is recorded in `order_status_history`.

---

## 9. Assumptions and dependencies

- KTU provides or approves the initial campus records.
- The team can obtain a Paystack or Hubtel merchant/sandbox account.
- PostgreSQL hosting and image storage are available.
- An email provider is available for verification; otherwise an administrator-assisted verification path is required.
- Payment terms, settlement, refunds, and payout obligations are confirmed with the provider and legal advisor.
- External credentials may be unavailable during early development; affected features must remain disabled with clear messaging.

---

## 10. Acceptance criteria for launch

- Critical journeys A–F from `TESTING_STRATEGY.md` pass.
- No critical or high severity security findings remain.
- Core pages meet accessibility and performance targets.
- All marketplace data shown to users originates from the database.
- Payment verification and webhook idempotency are demonstrated in sandbox.
- AI recommendations are grounded in real listings and fail gracefully.
- Documentation, environment template, and deployment guide are complete.

---

## 11. Research notes

Official payment documentation reviewed:

- Paystack documents Ghana mobile-money support and provider codes for MTN, ATMoney/Airtel Money, and Telecel: <https://paystack.com/docs/payments/payment-channels/>.
- Paystack support lists MTN, Airtel/Tigo, and Telecel for Ghana and a 1.95% mobile-money fee at the time of publication: <https://support.paystack.com/en/articles/2128386>.
- Hubtel documents mobile-money collection, card payments, disbursements, and related APIs: <https://developers.hubtel.com/>.

These findings are not commercial agreements. Fees, supported networks, settlement, KYC, refunds, and marketplace payout terms must be verified directly with the provider before launch. No external fraud statistics are claimed in this document; fraud controls are engineering recommendations.
