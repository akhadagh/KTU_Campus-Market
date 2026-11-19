# JUMART

**Your Campus. Your Marketplace.**

JUMART is a mobile-first, multi-vendor marketplace for university communities, launching at Koforidua Technical University (KTU), Ghana. Students can discover products, buy from verified campus vendors, open their own stores, manage orders, download free past questions and lecture notes, top up airtime through approved merchants via the header **Airtime** menu, and find what they need through search and deterministic recommendations.

> **Project status:** production-readiness pass complete. The JUMART brand is live across every surface, with 8 campus stores, 129 live listings, real photography, admin-approved vendor purchase links, a free learning-materials library, support messaging, refunds, disputes, delivery tracking, student verification and vendor analytics. See [docs/PRODUCTION_READINESS_AUDIT.md](./docs/PRODUCTION_READINESS_AUDIT.md) for the evidence-backed status of every module and [docs/CLIENT_HANDOVER.md](./docs/CLIENT_HANDOVER.md) for operating the platform.

---

## Product principles

1. One account supports both buying and selling.
2. Eligible students can become vendors.
3. Marketplace data comes from real database records.
4. Payments are verified server-side — never trusted from the browser.
5. Discovery and recommendations are deterministic, computed from real database signals (views, ratings, purchases) and never invented.
6. Trust, safety, and transparency are core features.
7. The experience is mobile-first and accessible.
8. Development and operating costs stay affordable.

---

## Planned stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Language   | TypeScript                                                     |
| Framework  | Next.js (App Router)                                           |
| UI         | React, Tailwind CSS, Radix/shadcn-style primitives, Lucide     |
| Database   | PostgreSQL                                                     |
| ORM        | Prisma                                                         |
| Auth       | Opaque database sessions with hashed tokens (scrypt passwords) |
| Validation | Zod, React Hook Form                                           |
| Storage    | Vercel Blob                                                    |
| Payments   | Paystack first, Hubtel adapter interface                       |
| Email      | Resend or SMTP                                                 |
| Testing    | Vitest (unit + API integration), Playwright (E2E specs)        |
| Deployment | Vercel + managed PostgreSQL                                    |

---

## Quick start

```bash
# Requires Node.js 22+ and pnpm 10+
pnpm install            # installs dependencies and generates the Prisma client
cp .env.example .env    # fill in DATABASE_URL, then PAYSTACK_SECRET_KEY, RESEND_API_KEY
pnpm db:deploy         # apply committed migrations (requires a PostgreSQL database)
pnpm db:seed           # load development sample data (development only)
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Useful scripts

| Script                                   | Purpose                                                         |
| ---------------------------------------- | --------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Run the app                                                     |
| `pnpm lint` / `pnpm typecheck`           | Static checks (CI runs these)                                   |
| `pnpm format`                            | Format the repository                                           |
| `pnpm db:validate` / `pnpm db:format`    | Validate and format the Prisma schema                           |
| `pnpm db:migrate:dev`                    | Create and apply migrations while developing (needs a database) |
| `pnpm db:deploy`                         | Apply committed migrations (staging/production)                 |
| `pnpm db:seed`                           | Idempotent development seed (refuses to run in production)      |
| `pnpm db:studio`                         | Prisma Studio database browser                                  |
| `pnpm test`                              | Vitest unit + API integration suites                            |
| `pnpm test:e2e`                          | Playwright end-to-end journeys                                  |
| `pnpm admin:bootstrap`                   | Create/grant an admin account from `ADMIN_BOOTSTRAP_*` env vars |
| `pnpm db:verify`                         | Verify the seeded database contents                             |

### Current status

- Working: marketing + shop + admin UI, auth with email verification and password reset, vendor onboarding and approval, product CRUD with variants and moderation, real image uploads to Vercel Blob, database-backed marketplace with search/filters/pagination, cart, wishlist, multi-vendor checkout and orders, Paystack payments, seller fulfilment and delivery tracking, refunds, disputes, reports, reviews, messaging, notifications, student verification, vendor analytics, free learning materials, and an admin-approved airtime catalogue reachable from the header **Airtime** menu.
- Catalogue: 8 genuine campus stores (Adum Tech Point, Campus Book Hub, Hostel Nest Store, Adum Fresh Mart, Kente & Co. Threads, KTU Print & Graphics, TeleLink Data Point, Kwame's Data Spot), 129 live listings priced in Ghana cedis — sandals, sneakers, clothing, student beds, food, study gear, electronics and services — with real product photographs and published verified-purchase reviews.
- Database: Prisma schema, migrations `0001`–`0010`, and seed applied to Neon PostgreSQL; `pnpm db:verify` and `/api/health` prove connectivity.
- Verification: 29 Vitest tests (12 unit + 17 integration) pass against the live database, covering auth, marketplace, airtime link gating, messaging, materials, variants, cart and checkout.
- Deployed: https://campus-market-teal.vercel.app
- Known limitations: distributed rate limiting needs Upstash credentials; email delivery needs `RESEND_API_KEY`; Playwright journeys run in CI only.

### Required environment

See [`.env.example`](./.env.example). At minimum:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

External integrations (payments, storage, email) are optional during development and must fail visibly when unconfigured. The platform must never fake a successful payment.

---

## Planned repository structure

```text
KTU_Campus-Market/
├── app/                      # Next.js App Router
│   ├── (marketing)/
│   ├── (shop)/
│   ├── (auth)/
│   ├── (buyer)/
│   ├── (vendor)/
│   ├── (admin)/
│   └── api/
├── components/               # Reusable UI and domain components
├── lib/                      # Auth, db, validation, services
├── prisma/                   # Schema, migrations, seed
├── public/                   # Static assets
├── tests/                    # Unit, integration, E2E
├── docs/                     # Project documentation
├── .env.example
└── README.md
```

---

## Documentation

| Document                                            | Purpose                                       |
| --------------------------------------------------- | --------------------------------------------- |
| [PROJECT_ROADMAP.md](./docs/PROJECT_ROADMAP.md)     | Milestones, deliverables, acceptance criteria |
| [TASK_TRACKER.md](./docs/TASK_TRACKER.md)           | Task status tracking                          |
| [SRS.md](./docs/SRS.md)                             | Software requirements specification           |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)           | System architecture and key decisions         |
| [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)     | Entities, relationships, constraints, indexes |
| [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | API conventions and endpoints                 |
| [SECURITY_NOTES.md](./docs/SECURITY_NOTES.md)       | Threat model and security controls            |
| [TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)   | Test layers, journeys, quality gates          |
| [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)   | Configuration and deployment steps            |
| [PROJECT_WORKFLOW.md](./docs/PROJECT_WORKFLOW.md)   | Team branching and collaboration workflow     |

---

## Safety and security

- Passwords are hashed with Argon2id.
- Authorization is enforced server-side; hiding a button is never sufficient.
- Payment callbacks are signature-verified and idempotent.
- Uploads are validated, re-encoded where possible, and size-limited.
- Student verification documents are private.
- No live payment is simulated; unconfigured integrations fail with a clear message.

See [SECURITY_NOTES.md](./docs/SECURITY_NOTES.md) for details.

---

## Contributing

1. Create an issue before major work.
2. Branch from `develop` using `feature/*`, `fix/*`, or `chore/*`.
3. Keep pull requests focused.
4. Ensure lint, typecheck, tests, and build pass.
5. Request review before merging.

---

## License

This project is developed for educational and commercial purposes by the Campus Market team. License terms will be finalized before public release.
