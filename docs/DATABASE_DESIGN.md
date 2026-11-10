# Campus Market — Database Design

**Database:** PostgreSQL  
**ORM:** Prisma  
**Currency:** integer pesewas (GHS 1 = 100 pesewas)

---

## 1. Conventions

- Primary keys: UUID (`id`).
- Timestamps: `created_at`, `updated_at` (UTC).
- Soft deletion: `deleted_at` where retention is required.
- Money: `*_pesewas` integer columns.
- Enums: PostgreSQL enums for statuses and roles.
- Case-insensitive email: `citext` or a lowercased unique index.
- Slugs: unique, URL-safe, stable.
- All foreign keys are explicit; financial records use restrictive deletion.
- JSONB only for snapshots, raw provider payloads, and flexible settings — not for core relational data.

---

## 2. Entity map

### 2.1 Tenancy and identity

| Table | Key fields | Relationships |
|---|---|---|
| `universities` | id, name, code (unique), country, status | 1:N campuses |
| `campuses` | id, university_id, name, address, city, region, active | N:1 university; 1:N users, vendors, products, pickup locations |
| `users` | id, email (unique ci), phone, password_hash, full_name, avatar_url, university_id, campus_id, status, email_verified_at, phone_verified_at, personalization_opt_out, created_at, deleted_at | N:1 university/campus; 1:N roles, sessions, orders |
| `roles` | id, name (unique), description | N:M users; N:M permissions |
| `permissions` | id, code (unique), description | N:M roles |
| `user_roles` | user_id, role_id, granted_by, granted_at | Join table |
| `role_permissions` | role_id, permission_id | Join table |
| `sessions` | id, user_id, token_hash, expires_at, ip, user_agent, created_at | N:1 user |
| `email_verification_tokens` | id, user_id, token_hash, expires_at, used_at | N:1 user |
| `password_reset_tokens` | id, user_id, token_hash, expires_at, used_at | N:1 user |
| `student_verifications` | id, user_id, method, institution_email, document_url, status, reviewed_by, reviewed_at, notes | N:1 user/reviewer |
| `user_preferences` | user_id (PK/FK), personalization_enabled, notification_prefs_json, locale, currency | 1:1 user |

### 2.2 Vendors and catalog

| Table | Key fields | Relationships |
|---|---|---|
| `vendor_profiles` | id, user_id (unique), store_name, slug (unique), description, logo_url, campus_id, business_category, verification_status, status, rating_avg, rating_count, created_at | 1:1 user; N:1 campus; 1:N products |
| `categories` | id, parent_id, name, slug (unique), type (product/service), sort_order, is_active | Self-referencing hierarchy |
| `products` | id, vendor_id, category_id, name, slug (unique), description, price_pesewas, original_price_pesewas, condition, quantity, reserved_quantity, status, campus_id, delivery_options, pickup_available, tags[], views_count, rating_avg, rating_count, published_at, deleted_at | N:1 vendor/category/campus; 1:N images, variants, order items |
| `product_images` | id, product_id, url, storage_public_id, alt_text, sort_order, width, height | N:1 product |
| `product_variants` | id, product_id, name, sku, price_delta_pesewas, stock, attributes_json, active | N:1 product |
| `inventory_reservations` | id, order_id, product_id, variant_id, quantity, expires_at, status | N:1 order/product/variant |
| `featured_listings` | id, product_id, starts_at, ends_at, position, active | N:1 product |

### 2.3 Commerce

| Table | Key fields | Relationships |
|---|---|---|
| `carts` | id, user_id (nullable), guest_token (nullable), updated_at | N:1 user; 1:N items |
| `cart_items` | id, cart_id, product_id, variant_id, quantity, vendor_id, added_at | N:1 cart/product/variant/vendor |
| `wishlists` | id, user_id (unique) | 1:N items |
| `wishlist_items` | id, wishlist_id, product_id, created_at | N:1 wishlist/product |
| `orders` | id, order_number (unique), buyer_id, status, subtotal_pesewas, delivery_total_pesewas, total_pesewas, currency, delivery_method, delivery_address, campus_id, notes, idempotency_key (unique), placed_at | N:1 buyer/campus; 1:N vendor orders, payments, disputes |
| `vendor_orders` | id, order_id, vendor_id, status, subtotal_pesewas, delivery_fee_pesewas, total_pesewas, fulfilment_type, pickup_location_id, tracking_code | N:1 order/vendor/pickup location |
| `order_items` | id, vendor_order_id, product_id, variant_id, title_snapshot, unit_price_pesewas, quantity, line_total_pesewas, product_snapshot_json | N:1 vendor order/product/variant |
| `order_status_history` | id, order_id, vendor_order_id, from_status, to_status, actor_id, reason, created_at | N:1 order/vendor order/user |

### 2.4 Payments and fulfilment

| Table | Key fields | Relationships |
|---|---|---|
| `payments` | id, order_id, provider, provider_reference (unique), amount_pesewas, currency, status, channel, paid_at, raw_payload_json, idempotency_key | N:1 order |
| `refunds` | id, payment_id, amount_pesewas, status, reason, provider_reference, requested_by, processed_by, processed_at | N:1 payment/user |
| `ledger_entries` | id, vendor_id, vendor_order_id, type, gross_pesewas, fee_pesewas, net_pesewas, status, created_at | N:1 vendor/vendor order |
| `payouts` | id, vendor_id, period_start, period_end, amount_pesewas, status, provider_reference, processed_at | N:1 vendor |
| `deliveries` | id, vendor_order_id, courier_type, courier_user_id, status, tracking_code, delivered_at, proof_url | N:1 vendor order/user |
| `pickup_locations` | id, campus_id, name, address, instructions, active | N:1 campus |

### 2.5 Trust, communication, administration

| Table | Key fields | Relationships |
|---|---|---|
| `reviews` | id, order_item_id (unique), product_id, buyer_id, vendor_id, rating (1–5), comment, status, verified_purchase, created_at | N:1 order item/product/buyer/vendor |
| `conversations` | id, buyer_id, vendor_id, product_id, last_message_at | N:1 buyer/vendor/product |
| `messages` | id, conversation_id, sender_id, body, read_at, flagged, created_at | N:1 conversation/sender |
| `notifications` | id, user_id, type, title, body, link, read_at, created_at | N:1 user |
| `reports` | id, reporter_id, target_type, target_id, reason, details, status, assigned_to, resolution, created_at | N:1 reporter/assignee |
| `disputes` | id, order_id, raised_by, against_user_id, category, description, status, resolution, assigned_to, created_at | N:1 order/user/assignee |
| `dispute_evidence` | id, dispute_id, uploader_id, file_url, note, created_at | N:1 dispute/user |
| `audit_logs` | id, actor_id, action, entity_type, entity_id, before_json, after_json, ip, user_agent, created_at | N:1 actor; append-only |
| `platform_settings` | id, key (unique), value_json, updated_by, updated_at | N:1 admin |
| `announcements` | id, title, body, audience, status, published_at, created_by | N:1 admin |
| `support_tickets` | id, user_id, subject, body, status, assigned_to, created_at | N:1 user/assignee |
| `search_history` | id, user_id, query, filters_json, created_at | N:1 user |
| `webhook_events` | id, provider, event_id, payload_json, status, processed_at | Unique `(provider, event_id)` |

---

## 3. Relationships summary

```text
University 1─N Campus
Campus     1─N User, VendorProfile, Product, PickupLocation

User 1─1 VendorProfile
User 1─N Session, Order, Review, Notification, Report
User N─M Role
Role N─M Permission

VendorProfile 1─N Product
Category 1─N Product
Product  1─N ProductImage, ProductVariant, OrderItem

Order 1─N VendorOrder
VendorOrder 1─N OrderItem
Order 1─N Payment, Dispute

OrderItem 1─1 Review (eligible completed purchase)

Conversation 1─N Message
User 1─N Message
```

---

## 4. Constraints

### Unique constraints

- `users.email`
- `vendor_profiles.user_id`, `vendor_profiles.slug`
- `products.slug`
- `orders.order_number`, `orders.idempotency_key`
- `payments.provider_reference`
- `reviews.order_item_id`
- `webhook_events(provider, event_id)`
- `user_roles(user_id, role_id)`
- `role_permissions(role_id, permission_id)`

### Check constraints

- `price_pesewas >= 0`, `original_price_pesewas >= 0`
- `quantity >= 0`, `reserved_quantity >= 0`
- `reserved_quantity <= quantity`
- `rating BETWEEN 1 AND 5`
- `refund.amount_pesewas <= payment.amount_pesewas`
- Valid enum values only.

### Business constraints

- A product must belong to an active vendor and a valid category.
- A vendor order must belong to the parent order’s buyer and campus.
- Review creation requires a completed, paid, non-refunded order item belonging to the reviewer.
- A payment may not be marked paid without a provider reference and verification timestamp.
- An inventory reservation cannot exceed available stock.

---

## 5. Indexes

| Table | Index |
|---|---|
| `users` | unique lower(email); (campus_id, status); (status, created_at) |
| `products` | (status, campus_id, category_id, created_at); (status, price_pesewas); GIN full-text on name/description/tags; unique slug |
| `product_images` | (product_id, sort_order) |
| `orders` | (buyer_id, created_at); (status, created_at); unique order_number; unique idempotency_key |
| `vendor_orders` | (vendor_id, status, created_at); (order_id) |
| `order_items` | (vendor_order_id); (product_id) |
| `payments` | unique provider_reference; (order_id, status); (status, created_at) |
| `ledger_entries` | (vendor_id, created_at); (vendor_order_id) |
| `reviews` | unique order_item_id; (product_id, status, created_at); (vendor_id, status) |
| `messages` | (conversation_id, created_at) |
| `notifications` | (user_id, read_at, created_at) |
| `reports` | (status, created_at); (target_type, target_id) |
| `disputes` | (status, created_at); (order_id) |
| `audit_logs` | (actor_id, created_at); (entity_type, entity_id) |

Search uses PostgreSQL full-text search plus trigram similarity for partial matches. Avoid leading-wildcard `LIKE` scans on large tables.

---

## 6. Deletion and retention policy

| Data | Policy |
|---|---|
| Users | Soft delete; anonymize PII after retention period; retain financial and audit records |
| Vendors | Soft delete/deactivate; unpublish products; preserve order history |
| Products | Soft delete; preserve order item snapshots |
| Orders/payments/refunds/ledger | Never cascade-delete; retain per financial policy |
| Reviews | Soft delete/moderate; retain for audit where required |
| Verification documents | Delete or anonymize after verification retention period |
| Audit logs | Append-only; retained per policy |
| Sessions/tokens | Delete after expiry or revocation |
| Guest carts | Expire after inactivity |

---

## 7. Transaction boundaries

The following operations must run in a single database transaction:

- Checkout: order, vendor orders, order items, status history, inventory reservations.
- Payment confirmation: payment update, order status, stock confirmation, ledger entry.
- Refund: refund record, payment update, order status, ledger adjustment.
- Order status transition: status update plus history record.
- Dispute decision: dispute update, order/refund changes, audit log.
- Role change: role assignment plus audit log.

Use row-level locks or conditional updates for inventory. Use unique constraints plus retry handling for idempotency.

---

## 8. Seed data

Development seed includes:

- KTU university and main campus records.
- Roles and permissions.
- Categories and subcategories from the product specification.
- Clearly labeled sample vendors and products.
- Sample pickup locations.
- An administrator account created from environment variables.

Sample listings must be visibly labeled and must never be confused with real vendor listings in production.

---

## 9. Migration policy

- Every schema change uses a Prisma migration.
- Migrations are reviewed and run in CI against a fresh database.
- Destructive changes require a backup and rollback plan.
- Production migrations run before application deployment and are verified with a smoke test.
- No manual production schema edits.
