# Campus Market — Task Tracker

**Status key:** `NS` = Not Started · `IP` = In Progress · `BL` = Blocked · `T` = Testing · `D` = Completed

> A task is marked `D` only when implemented, reviewed, and verified by tests where applicable.

---

## Milestone 0 — Environment and foundation

| ID | Task | Depends on | Status |
|---|---|---|---|
| M0-01 | Install Node.js 22 LTS and pnpm | — | D |
| M0-02 | Scaffold Next.js + TypeScript + Tailwind | M0-01 | D |
| M0-03 | Configure ESLint, Prettier, strict TypeScript | M0-02 | D |
| M0-04 | Provision PostgreSQL and configure Prisma | M0-02 | IP |
| M0-05 | Create `.env.example` and environment validation | M0-02 | D |
| M0-06 | Add GitHub Actions lint/typecheck/test/build | M0-02 | D |
| M0-07 | Rewrite README to approved architecture | — | D |

## Milestone 1 — Documentation

| ID | Task | Depends on | Status |
|---|---|---|---|
| M1-01 | Write SRS | — | D |
| M1-02 | Write architecture document | — | D |
| M1-03 | Write database design | — | D |
| M1-04 | Write API documentation | — | D |
| M1-05 | Write security notes | — | D |
| M1-06 | Write testing strategy | — | D |
| M1-07 | Write deployment guide | — | D |
| M1-08 | Write roadmap and task tracker | — | D |

## Milestone 2 — Design system and UI foundation

| ID | Task | Depends on | Status |
|---|---|---|---|
| M2-01 | Define brand tokens and typography | M0-02 | D |
| M2-02 | Create logo, wordmark, favicon | M2-01 | D |
| M2-03 | Build app shell, header, mobile nav, footer | M2-01 | D |
| M2-04 | Build form, button, card, badge, modal primitives | M2-01 | D |
| M2-05 | Build loading, empty, error, and toast states | M2-04 | D |
| M2-06 | Build homepage sections | M2-03, M2-04 | D |
| M2-07 | Build auth screens visually | M2-04 | D |
| M2-08 | Accessibility baseline audit | M2-06 | IP |

## Milestone 3 — Database, auth, users

| ID | Task | Depends on | Status |
|---|---|---|---|
| M3-01 | Auth/user/role/permission schema and migrations | M0-04 | IP |
| M3-02 | Seed universities, campuses, roles, permissions | M3-01 | IP |
| M3-03 | Registration and server validation | M3-02 | NS |
| M3-04 | Email verification | M3-03 | NS |
| M3-05 | Login, logout, session management | M3-03 | NS |
| M3-06 | Password reset | M3-05 | NS |
| M3-07 | Profile, preferences, account settings | M3-05 | NS |
| M3-08 | RBAC guards and tests | M3-02 | NS |
| M3-09 | Student verification submission and review | M3-07 | NS |
| M3-10 | Secure admin bootstrap | M3-08 | NS |

## Milestone 4 — Marketplace core

| ID | Task | Depends on | Status |
|---|---|---|---|
| M4-01 | Category schema and admin CRUD | M3-01 | NS |
| M4-02 | Vendor application and approval | M3-08 | NS |
| M4-03 | Vendor storefront and settings | M4-02 | NS |
| M4-04 | Product schema, validation, CRUD | M4-02 | NS |
| M4-05 | Image upload and optimization | M4-04 | NS |
| M4-06 | Product variants and inventory | M4-04 | NS |
| M4-07 | Search, filters, sort, pagination | M4-04 | NS |
| M4-08 | Product detail and related products | M4-07 | NS |
| M4-09 | Marketplace and category pages | M4-07 | NS |
| M4-10 | Clearly labeled sample seed data | M4-04 | NS |

## Milestone 5 — Cart, checkout, orders

| ID | Task | Depends on | Status |
|---|---|---|---|
| M5-01 | Cart schema and endpoints | M4-04 | NS |
| M5-02 | Wishlist schema and endpoints | M4-04 | NS |
| M5-03 | Pricing and fee service | M5-01 | NS |
| M5-04 | Multi-vendor checkout and order creation | M5-03 | NS |
| M5-05 | Inventory reservation and concurrency control | M5-04 | NS |
| M5-06 | Order state machine and history | M5-04 | NS |
| M5-07 | Buyer order list and detail | M5-06 | NS |
| M5-08 | Vendor order accept/process/fulfil | M5-06 | NS |
| M5-09 | In-app order notifications | M5-06 | NS |

## Milestone 6 — Dashboards and messaging

| ID | Task | Depends on | Status |
|---|---|---|---|
| M6-01 | Buyer dashboard | M5-07 | NS |
| M6-02 | Vendor dashboard with real metrics | M5-08 | NS |
| M6-03 | Vendor product management UI | M4-04 | NS |
| M6-04 | Vendor analytics queries | M5-08 | NS |
| M6-05 | Messaging schema, UI, anti-spam | M5-08 | NS |

## Milestone 7 — Payments and delivery

| ID | Task | Depends on | Status |
|---|---|---|---|
| M7-01 | Payment provider interface | M5-04 | NS |
| M7-02 | Paystack sandbox initiation | M7-01 | NS |
| M7-03 | Webhook signature and idempotency | M7-02 | NS |
| M7-04 | Server-side verification and order update | M7-03 | NS |
| M7-05 | Refund workflow | M7-04 | NS |
| M7-06 | Vendor ledger and payout records | M7-04 | NS |
| M7-07 | Pickup locations and delivery records | M5-08 | NS |
| M7-08 | Order tracking and delivery confirmation | M7-07 | NS |

## Milestone 8 — Trust, safety, moderation

| ID | Task | Depends on | Status |
|---|---|---|---|
| M8-01 | Verified-purchase review eligibility and submission | M5-07 | NS |
| M8-02 | Review moderation | M8-01 | NS |
| M8-03 | Reporting and moderation queue | M3-08 | NS |
| M8-04 | Disputes and evidence upload | M5-07 | NS |
| M8-05 | Verification review workflow | M3-09, M4-02 | NS |
| M8-06 | Policy pages and configurable rules | M2-03 | NS |
| M8-07 | Append-only audit log service | M3-08 | NS |

## Milestone 9 — AI integration

| ID | Task | Depends on | Status |
|---|---|---|---|
| M9-01 | AI provider adapter and feature flag | M4-07 | NS |
| M9-02 | Structured search tool registry and grounding | M9-01 | NS |
| M9-03 | Conversational assistant endpoint and UI | M9-02 | NS |
| M9-04 | Recommendations with personalization opt-out | M9-02 | NS |
| M9-05 | Vendor description drafting with approval | M9-01 | NS |
| M9-06 | Rate limits, logging, fallback tests | M9-03 | NS |
| M9-07 | Optional image quality/duplicate checks | M4-05 | NS |

## Milestone 10 — Administration

| ID | Task | Depends on | Status |
|---|---|---|---|
| M10-01 | Admin layout and authorization | M3-08 | NS |
| M10-02 | User and vendor management | M10-01 | NS |
| M10-03 | Category and product moderation | M10-01 | NS |
| M10-04 | Order, payment, and refund oversight | M10-01, M7-05 | NS |
| M10-05 | Report and dispute management | M10-01, M8-03 | NS |
| M10-06 | Campus and pickup location management | M10-01 | NS |
| M10-07 | Platform settings and policies | M10-01 | NS |
| M10-08 | Announcements and support tickets | M10-01 | NS |
| M10-09 | Analytics and audit viewer | M10-01, M8-07 | NS |

## Milestone 11 — QA and hardening

| ID | Task | Depends on | Status |
|---|---|---|---|
| M11-01 | Unit test suite | Core services | NS |
| M11-02 | API/integration test suite | M3–M10 | NS |
| M11-03 | Playwright journeys A–F | M3–M10 | NS |
| M11-04 | Security review and fixes | M11-02 | NS |
| M11-05 | Accessibility audit and fixes | M2, M11-03 | NS |
| M11-06 | Performance and responsive audit | M11-03 | NS |
| M11-07 | Bug triage and regression pass | M11-01–M11-06 | NS |

## Milestone 12 — Deployment

| ID | Task | Depends on | Status |
|---|---|---|---|
| M12-01 | Production environment and secrets | M11-07 | NS |
| M12-02 | Production migrations and seed | M12-01 | NS |
| M12-03 | Storage, email, payment configuration | M12-01 | NS |
| M12-04 | Deploy and verify production build | M12-02, M12-03 | NS |
| M12-05 | Production smoke tests and monitoring | M12-04 | NS |
| M12-06 | Backup/restore and rollback drill | M12-04 | NS |
| M12-07 | Launch documentation and runbook | M12-04 | NS |

---

## Blockers

| Item | Impact | Resolution needed |
|---|---|---|
| GitHub remote requires credentials | Cannot push from this machine (no SSH key, token, or credential helper configured) | Provide a Personal Access Token, register an SSH key, or push manually |
| PostgreSQL not installed | Cannot run migrations locally (no sudo access, no container runtime) | Provide a database URL, install with sudo, or run a managed PostgreSQL |
| Payment/storage/AI credentials | Cannot enable external integrations | Provide keys or run with features disabled |

**Resolved:** Node.js 22.23.4 and pnpm 10.34.9 are installed; Prisma 7.10.1 is configured with schema, offline migration SQL, and seed script (not yet applied — no database).
