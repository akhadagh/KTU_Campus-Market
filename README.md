# Campus Market

**Everything You Need. Right Around Campus.**

Campus Market is a mobile-first, multi-vendor marketplace for university communities, launching at Koforidua Technical University (KTU), Ghana. Students can discover products, buy from verified campus vendors, open their own stores, manage orders, and get help from an AI shopping assistant grounded in real marketplace listings.

> **Project status:** Milestone 0 — environment and foundation. The repository currently contains documentation only. No production features are implemented yet. This README will be updated as milestones complete.

---

## Product principles

1. One account supports both buying and selling.
2. Eligible students can become vendors.
3. Marketplace data comes from real database records.
4. Payments are verified server-side — never trusted from the browser.
5. AI recommendations are grounded in real listings and never invented.
6. Trust, safety, and transparency are core features.
7. The experience is mobile-first and accessible.
8. Development and operating costs stay affordable.

---

## Planned stack

| Layer      | Technology                                                 |
| ---------- | ---------------------------------------------------------- |
| Language   | TypeScript                                                 |
| Framework  | Next.js (App Router)                                       |
| UI         | React, Tailwind CSS, Radix/shadcn-style primitives, Lucide |
| Database   | PostgreSQL                                                 |
| ORM        | Prisma                                                     |
| Auth       | Auth.js v5 with database sessions (or opaque DB sessions)  |
| Validation | Zod, React Hook Form                                       |
| Storage    | Cloudinary or Supabase Storage                             |
| Payments   | Paystack first, Hubtel adapter interface                   |
| AI         | Provider-agnostic server-side LLM, feature-flagged         |
| Email      | Resend or SMTP                                             |
| Testing    | Vitest, React Testing Library, Playwright                  |
| Deployment | Vercel + managed PostgreSQL                                |

---

## Quick start

```bash
# Requires Node.js 22+ and pnpm 10+
pnpm install            # installs dependencies and generates the Prisma client
cp .env.example .env    # fill in DATABASE_URL and AUTH_SECRET at minimum
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

### Current status

- Working: full marketing/shop/auth UI, 26 routes, health endpoint, lint/typecheck/build green.
- Database: Prisma schema (46 tables), initial migration SQL, and seed script are committed; migrations have **not** been applied because no PostgreSQL database is reachable in this environment.
- Not yet implemented: real authentication, payments, messaging, AI, admin. Auth screens validate input but do not create accounts.

### Required environment

See [`.env.example`](./.env.example). At minimum:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

External integrations (payments, storage, AI, email, SMS) are optional during development and must fail visibly when unconfigured. The platform must never fake a successful payment or AI response.

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
├── lib/                      # Auth, db, validation, services, AI
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
- AI API keys never reach the browser.
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
