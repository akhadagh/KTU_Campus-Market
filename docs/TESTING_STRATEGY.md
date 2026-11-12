# Campus Market — Testing Strategy

**Goal:** prove that critical marketplace behavior works, is secure, and is accessible — not merely that the application builds.

---

## 1. Test layers

| Layer | Tooling | Purpose |
|---|---|---|
| Static analysis | TypeScript, ESLint | Type and lint errors |
| Unit | Vitest | Pure logic, money, permissions, state transitions |
| Component | React Testing Library | Forms, cards, cart controls, status UI |
| Integration/API | Vitest + test PostgreSQL | Routes, services, database, auth, payments (mocked/sandbox) |
| End-to-end | Playwright | Real user journeys in a browser |
| Security | Targeted tests + dependency audit | Authorization, uploads, webhooks, injection |
| Accessibility | axe + manual | Key pages and flows |
| Performance | Lighthouse CI | Core pages and mobile viewport |

---

## 2. Test environments

- Unit/component tests run without external services.
- Integration tests use a dedicated PostgreSQL database or Neon branch.
- Migrations run before the suite; fixtures are deterministic.
- External providers are mocked in CI. Payment tests use sandbox keys only when explicitly enabled.
- Never run live financial transactions in automated tests.

---

## 3. Required end-to-end journeys

### Journey A — Registration
1. Open the application.
2. Register.
3. Verify email.
4. Log in.
5. Complete profile.
6. Confirm session and access control.

### Journey B — Selling
1. Become a vendor.
2. Create a store.
3. Upload a product with images.
4. Publish the listing.
5. Confirm marketplace visibility.
6. Edit the listing.
7. Update stock.

### Journey C — Buying
1. Log in as another student.
2. Search for a product.
3. View product details.
4. Add to cart.
5. Checkout.
6. Complete a sandbox payment.
7. Confirm the order.
8. View order history.

### Journey D — Vendor fulfilment
1. Log in as the vendor.
2. Receive the order.
3. Accept the order.
4. Update status.
5. Confirm the buyer sees the update.
6. Complete delivery/pickup.

### Journey E — Safety
1. Report a suspicious product.
2. Log in as an administrator.
3. Review the report.
4. Take action.
5. Verify audit history.
6. Confirm the reporter sees the resolution.

### Journey F — AI shopping
1. Open the assistant.
2. Enter a natural-language request with a budget.
3. Confirm real products are returned.
4. Open a recommendation.
5. Verify product, price, and vendor match the database.
6. Test fallback with AI disabled.

---

## 4. Unit test targets

- Money and pesewas conversion.
- Cart subtotal, delivery fee, and total calculations.
- Order state transitions and invalid transitions.
- Permission and capability checks.
- Inventory availability and reservation logic.
- Review eligibility.
- Payment status normalization.
- Zod schemas and edge cases.
- AI filter parsing and fallback behavior.

---

## 5. Integration test targets

- Registration, email verification, login, logout, reset.
- Duplicate email and invalid credentials.
- Session revocation.
- Role assignment denial for ordinary users.
- Vendor application and approval.
- Product CRUD and ownership enforcement.
- Image upload validation.
- Search filters, sorting, and pagination.
- Cart merge and stock validation.
- Multi-vendor checkout and order creation.
- Inventory race conditions.
- Payment initiation and webhook idempotency.
- Refund flow.
- Review creation and duplicate prevention.
- Report, dispute, and moderation workflows.
- Messaging participant authorization.
- Notification creation.
- AI search tool grounding.

---

## 6. Negative and abuse tests

- Invalid login and account enumeration resistance.
- Duplicate registration.
- Expired/used verification and reset tokens.
- Unauthorized dashboard and order access.
- Vendor editing another vendor’s product.
- Buyer accessing another buyer’s order.
- Invalid image type, oversized upload, and unsafe SVG.
- Out-of-stock and insufficient-quantity checkout.
- Duplicate checkout idempotency key.
- Duplicate and failed payment webhooks.
- Amount mismatch in webhook.
- Fake review without a completed purchase.
- Duplicate review for the same order item.
- Self-assigned admin role attempt.
- Empty search results and provider outage.
- Rate-limit enforcement.
- XSS payloads in product descriptions, reviews, and messages.

---

## 7. Accessibility testing

- Keyboard-only navigation for header, menus, forms, galleries, and dialogs.
- Visible focus states.
- Form labels and error associations.
- Screen-reader announcements for validation and status changes.
- Color contrast checks.
- Touch target sizes.
- Reduced-motion support.
- axe scan on home, marketplace, product, cart, checkout, and auth pages.

---

## 8. Performance testing

- Lighthouse CI on home, marketplace, product, and checkout.
- Mobile viewport and throttled network.
- Image optimization and lazy loading verification.
- Query plan review for product search and dashboards.
- Bundle analysis for large client components.
- API response times under representative data volumes.

Targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms on a representative mid-range mobile profile.

---

## 9. Test data

- Deterministic seed data for local and CI.
- Clearly labeled sample vendors and products.
- Realistic GHS prices and campus locations.
- No real student documents or personal data.
- Payment fixtures for success, failure, pending, duplicate, and mismatch cases.

---

## 10. CI pipeline

On pull request:

1. Install dependencies from lockfile.
2. Lint.
3. Typecheck.
4. Run unit and component tests.
5. Start PostgreSQL service and run migrations.
6. Run integration tests.
7. Build the application.
8. Run a small Playwright smoke suite where feasible.

On merge to the integration branch:

- Run the full test suite.
- Run accessibility and Lighthouse checks.
- Produce a build artifact.

---

## 11. Quality gates

A task is complete only when:

- Implementation matches acceptance criteria.
- Lint, typecheck, and build pass.
- Relevant tests pass.
- Security-sensitive changes have negative tests.
- No fake data or fake success states are introduced.
- Documentation and task tracker are updated.

A milestone is complete only when its critical journeys pass and no critical/high security issue remains open.


---

## Production readiness additions (2026-11-11)

### Test layers

| Layer | Location | Runner | Database |
|---|---|---|---|
| Unit | `tests/unit` | Vitest | none |
| Integration | `tests/integration` | Vitest against a running app | shared database, cleaned after the run |
| End-to-end | `tests/e2e` | Playwright | application + database |

```bash
pnpm test:unit          # unit only
pnpm test:integration   # integration only
pnpm test:all           # both
pnpm test:e2e            # Playwright (needs browsers)
```

### Isolation

Set `TEST_DATABASE_URL` to point the integration suite at a disposable database and `TEST_BASE_URL` at a running instance. When `TEST_DATABASE_URL` is present and no `TEST_BASE_URL` is given, `tests/global-setup.ts` starts a dedicated application instance against that database and stops it afterwards. Without either variable the suite runs against the local development server on port 3000 and skips the integration tests when it cannot be reached.

In CI the pipeline provides a Postgres service container, applies the migrations to it, runs the unit tests, builds the application, starts it against that database and then runs the integration tests. The Playwright job repeats the pattern with its own database.

### Data hygiene

Integration tests create users with a `smoke.` / `prod.` prefix. `scripts/cleanup-test-data.ts` removes those accounts, their orders, carts and sessions. **Never run destructive cleanup against production**: point the cleanup script at a test database and confirm the target before running it.

### Coverage added in the readiness pass

- Unverified accounts cannot check out (`403 EMAIL_NOT_VERIFIED`).
- Unapproved vendor purchase links are hidden (404) while approved links are visible (200).
- Support threads are created by students and listed for staff.
- The learning-materials library endpoint responds with the published set.
- Digital orders require a phone number; the order is created with it.
- Guest carts add a live listing and return the correct totals.
- Duplicate registration, wrong password and anonymous route protection.

### Not yet automated

- Payment webhook processing against the Paystack sandbox (the provider cannot be called from a test without credentials); verified manually with sandbox transactions.
- Refund execution against the provider; the eligibility and approval logic is covered by unit-level checks only.
- Playwright journeys cannot run in the audit sandbox because the browser download is blocked; they run in CI.
