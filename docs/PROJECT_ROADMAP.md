# Campus Market — Project Roadmap

**Status key:** Not Started · In Progress · Blocked · Testing · Completed

This roadmap is the approved implementation plan for Campus Market. Work proceeds in controlled milestones. A milestone is complete only when its acceptance criteria and tests pass.

---

## Milestone overview

| Milestone | Name | Status |
|---|---|---|
| M0 | Environment and repository foundation | Completed |
| M1 | Documentation and architecture approval | Completed |
| M2 | Design system and UI foundation | In Progress |
| M3 | Database, authentication, and users | In Progress |
| M4 | Marketplace core | Not Started |
| M5 | Cart, checkout, and orders | Not Started |
| M6 | Dashboards and messaging | Not Started |
| M7 | Payments and delivery | Not Started |
| M8 | Trust, safety, and moderation | Not Started |
| M9 | AI integration | Not Started |
| M10 | Administration and configuration | Not Started |
| M11 | Quality assurance and hardening | Not Started |
| M12 | Deployment and launch | Not Started |

---

## Milestone 0 — Environment and repository foundation

**Objective:** make the repository buildable and safe to develop.

**Tasks**
- Install Node.js 22 LTS and pnpm.
- Scaffold Next.js with TypeScript and Tailwind CSS.
- Configure ESLint, Prettier, and strict TypeScript.
- Provision PostgreSQL and configure Prisma.
- Create `.env.example` and runtime environment validation.
- Add GitHub Actions for lint, typecheck, test, and build.
- Rewrite the README to match the approved architecture.

**Deliverables**
- Working local development server.
- Database connection and initial schema.
- CI pipeline skeleton.
- Documented setup instructions.

**Acceptance criteria**
- `pnpm dev`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` succeed.
- A health endpoint or root page renders.
- Database connection is verified.
- No secrets are committed.

**Dependencies:** approved architecture; repository write access; Node.js and PostgreSQL availability.

**Testing:** clean-install smoke test, build, CI run.

**Risks:** missing Node/PostgreSQL; repository access issues; environment restrictions.

---

## Milestone 1 — Documentation and architecture approval

**Objective:** establish a shared, approved technical plan.

**Deliverables**
- SRS, architecture, database design, API documentation, security notes, testing strategy, deployment guide, roadmap, task tracker, README, `.env.example`.
- Approved scope and technology decisions.

**Acceptance criteria**
- Documents are consistent with each other.
- The product owner approves the scope and stack.
- No implementation claims are made without evidence.

**Status:** Completed — documentation set created.

---

## Milestone 2 — Design system and UI foundation

**Status:** Completed — UI foundation and accessibility baseline in place.

**Objective:** establish a professional, consistent, accessible visual foundation.

**Tasks**
- Define brand tokens: navy primary, white secondary, green accent, neutral background, charcoal text.
- Create logo and wordmark; favicon and social card.
- Build app shell: header, mobile navigation, bottom navigation, footer.
- Build primitives: buttons, inputs, selects, textareas, file upload, cards, badges, modals, pagination.
- Build feedback states: loading skeletons, empty states, error states, toasts.
- Build homepage sections: hero, categories, featured, trending, recent, vendor CTA, how it works, trust and safety.
- Build auth screens visually.

**Acceptance criteria**
- Responsive from 320 px upward.
- Keyboard navigable and WCAG 2.2 AA baseline.
- Consistent spacing, typography, colors, and states.
- No nonfunctional buttons or placeholder links in completed areas.

**Dependencies:** M0.

**Testing:** component tests, responsive review, axe accessibility scan.

**Risks:** design inconsistency; over-decoration; accessibility regressions.

---

## Milestone 3 — Database, authentication, and users

**Status:** In progress — registration, login, logout, sessions verified end to end; email verification and password reset blocked on email provider.

**Objective:** secure account and identity foundation.

**Tasks**
- Prisma schema for users, roles, permissions, sessions, tokens, verification, preferences.
- Migrations and seed for universities, campuses, roles, and permissions.
- Registration with server validation.
- Email verification.
- Login, logout, session management.
- Password reset with single-use tokens.
- Profile editing and preferences.
- Role-based authorization guards.
- Student verification submission.
- Secure admin bootstrap.

**Acceptance criteria**
- Journey A passes end to end.
- Duplicate registration, invalid login, expired tokens, and unauthorized access are handled.
- Normal users cannot assign themselves elevated roles.
- Sessions are revocable.

**Dependencies:** M0, M2.

**Testing:** unit, integration, authorization, rate-limit tests.

**Risks:** email provider unavailable; verification policy ambiguity.

---

## Milestone 4 — Marketplace core

**Objective:** real vendor stores and product discovery.

**Tasks**
- Category and subcategory management.
- Vendor application, approval, storefront, and settings.
- Product CRUD with server validation.
- Multiple image uploads with optimization.
- Product variants and inventory.
- Search, filters, sorting, and pagination.
- Product detail page and related products.
- Marketplace and category pages.
- Clearly labeled sample seed data.

**Acceptance criteria**
- Journey B passes.
- Vendors can manage only their own stores and listings.
- Invalid uploads are rejected.
- Search results come from database records.
- Empty states are useful.

**Dependencies:** M3.

**Testing:** ownership, validation, upload, search, pagination tests.

**Risks:** image storage configuration; search relevance.

---

## Milestone 5 — Cart, checkout, and orders

**Objective:** working commerce without live payment.

**Tasks**
- Database-backed cart and guest cart merge.
- Wishlist.
- Pricing and fee service.
- Multi-vendor checkout.
- Parent order and vendor orders.
- Inventory reservations and concurrency control.
- Order state machine and status history.
- Buyer order history.
- Vendor order acceptance and fulfilment.
- In-app order notifications.

**Acceptance criteria**
- Journeys C (without payment) and D pass.
- Server recalculates all prices and totals.
- Overselling and duplicate checkout are prevented.
- Invalid state transitions are rejected.
- Buyers cannot access other buyers’ orders.

**Dependencies:** M4.

**Testing:** totals, inventory races, transitions, authorization.

**Risks:** concurrency bugs; multi-vendor complexity.

---

## Milestone 6 — Dashboards and messaging

**Objective:** database-backed buyer and vendor operations.

**Tasks**
- Buyer dashboard.
- Vendor dashboard with real metrics.
- Vendor product management UI.
- Vendor analytics queries.
- Buyer–vendor messaging with authorization and basic anti-spam.

**Acceptance criteria**
- All metrics come from database queries.
- Vendors see only their own data.
- Only conversation participants can read or send messages.

**Dependencies:** M5.

**Testing:** aggregate correctness, access control, empty states.

**Risks:** slow analytics queries; messaging abuse.

---

## Milestone 7 — Payments and delivery

**Objective:** verified sandbox payments and fulfilment.

**Tasks**
- Payment provider interface.
- Paystack sandbox adapter.
- Server-side payment initiation.
- Signed webhook verification and idempotency.
- Server-side payment verification.
- Refund workflow.
- Vendor ledger and payout records.
- Pickup locations.
- Delivery records and tracking.
- Delivery confirmation.

**Acceptance criteria**
- Journey C with sandbox payment passes.
- Duplicate webhooks do not double-process.
- Failed payments leave orders recoverable.
- No frontend-only payment success.
- No live charges during testing.

**Dependencies:** M5.

**Testing:** signature, replay, amount mismatch, refunds, delivery confirmation.

**Risks:** provider onboarding delays; legal/payout requirements.

---

## Milestone 8 — Trust, safety, and moderation

**Objective:** protect buyers and vendors.

**Tasks**
- Student and vendor verification review.
- Verified-purchase reviews.
- Reporting for products, vendors, users, reviews, and transactions.
- Moderation queue.
- Disputes with evidence.
- Marketplace policies.
- Append-only audit logs.

**Acceptance criteria**
- Journey E passes.
- Only eligible buyers can review.
- Duplicate reviews are prevented.
- Reports and disputes are access-controlled.
- Privileged actions are audited.

**Dependencies:** M3, M4, M5.

**Testing:** fake review, duplicate review, unauthorized evidence access, audit verification.

**Risks:** moderation workload; sensitive evidence handling.

---

## Milestone 9 — AI integration

**Objective:** grounded shopping assistance that never invents listings.

**Tasks**
- Provider-agnostic AI adapter and feature flag.
- Structured search tool registry.
- Conversational assistant endpoint and UI.
- Recommendations with personalization opt-out.
- Vendor description drafting with human approval.
- Rate limits, logging, and fallback.
- Optional image quality and duplicate checks.

**Acceptance criteria**
- Journey F passes.
- Every recommendation references a real database listing.
- AI outage or missing credentials do not break search.
- No API keys in the frontend.

**Dependencies:** M4, M7 (for order-aware recommendations).

**Testing:** grounding, prompt injection resistance, no-result behavior, fallback.

**Risks:** hallucination; provider cost/outage; privacy.

---

## Milestone 10 — Administration and configuration

**Objective:** operate the marketplace safely.

**Tasks**
- Admin layout and authorization.
- User and vendor management.
- Verification review.
- Category management.
- Product moderation.
- Order, payment, refund oversight.
- Report and dispute management.
- Campus and pickup location management.
- Platform settings and policies.
- Featured products and announcements.
- Support tickets.
- Analytics and audit viewer.

**Acceptance criteria**
- Every privileged action is authorized and audited.
- Ordinary users cannot access admin routes or APIs.
- Administrators can operate the marketplace without code changes.

**Dependencies:** M3–M8.

**Testing:** capability matrix, audit entries, forbidden access.

**Risks:** over-broad admin power; accidental data exposure.

---

## Milestone 11 — Quality assurance and hardening

**Objective:** prove the system works end to end.

**Tasks**
- Unit test suite.
- Integration/API test suite.
- Playwright journeys A–F.
- Security review and fixes.
- Accessibility audit and fixes.
- Performance and responsive audit.
- Bug triage and regression pass.
- Backup/restore drill.

**Acceptance criteria**
- All critical journeys pass.
- No critical security findings remain.
- Lighthouse and accessibility targets are met.
- No fake or hardcoded production statistics.

**Dependencies:** M2–M10.

**Testing:** full regression, negative paths, load smoke test.

**Risks:** late-discovered architecture issues; time pressure.

---

## Milestone 12 — Deployment and launch

**Objective:** production deployment and verified operation.

**Tasks**
- Production database and migrations.
- Storage, email, and payment configuration.
- Environment variables and secrets.
- Domain and TLS.
- Error tracking and monitoring.
- Production smoke tests.
- Backup and rollback plan.
- Launch documentation and runbook.

**Acceptance criteria**
- Production build verified.
- Critical journeys verified in production.
- Payment webhook delivery verified.
- No unconfigured integration is presented as working.
- Backup restore tested.

**Dependencies:** M11; external credentials and approvals.

**Testing:** production smoke, webhook, restore, rollback.

**Risks:** credential delays; DNS/domain issues; live payment risk.

---

## Post-launch backlog

- Additional universities and cross-campus discovery.
- Native mobile wrapper or PWA enhancements.
- Vendor subscriptions and optional paid promotions.
- Student discounts, loyalty, and group purchasing.
- Price-drop and restock notifications.
- Product comparisons and AI image search.
- Advanced analytics and fraud scoring.
- Multilingual support.
