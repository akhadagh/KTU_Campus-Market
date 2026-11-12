# Campus Market — Deployment Guide

**Target:** Vercel + managed PostgreSQL, with Cloudinary/Supabase Storage, Paystack (or Hubtel), and optional AI/email/SMS providers.

---

## 1. Prerequisites

- Node.js 22 LTS and pnpm.
- Git repository access.
- A Vercel account (or equivalent Next.js host).
- A managed PostgreSQL database (Neon, Supabase, Railway, or similar).
- An image storage account (Cloudinary or Supabase Storage).
- A Paystack or Hubtel merchant/sandbox account.
- An email provider (optional but required for self-service verification).
- A domain and DNS access.
- Production environment secrets stored securely.

---

## 2. Environment variables

Copy `.env.example` and configure per environment. Never commit real values.

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection for the application |
| `DIRECT_URL` | Direct database connection for migrations (if required by provider) |
| `AUTH_SECRET` | Session/token signing secret |
| `NEXT_PUBLIC_APP_URL` | Public application origin |
| `AUTH_URL` | Authentication base URL |

### Optional integrations

| Variable group | Effect when missing |
|---|---|
| `RESEND_API_KEY` / SMTP | Email verification/notifications disabled; admin-assisted verification required |
| `CLOUDINARY_*` / `SUPABASE_*` | Uploads disabled or local-only; production launch requires storage |
| `PAYSTACK_*` | Checkout cannot take payment; show clear configuration notice |
| `HUBTEL_*` | Hubtel adapter unavailable |
| `AI_*` | AI assistant disabled; deterministic search remains |
| `UPSTASH_*` | In-memory rate limiting in development; production should use distributed limiting |
| `SENTRY_DSN` | Local logs only |
| `SMS_*` | Phone verification disabled |

---

## 3. Database setup (Neon)

1. Create a Neon project and database (`campus_market`).
2. Copy both connection strings from the Neon console:
   - **Pooled** endpoint → `DATABASE_URL` (application runtime).
   - **Direct** endpoint → `DIRECT_URL` (migrations).
   - Both must include `sslmode=require`.
3. Run migrations against the direct URL:

```bash
DIRECT_URL=... pnpm db:deploy
```

4. Seed reference data (universities, campuses, roles, permissions, categories) using a production-safe seed command.
5. Do not seed sample vendors/products in production unless explicitly labeled and approved.
6. Recommended: connect Neon to Vercel with the Neon Vercel integration so each preview branch gets an isolated database.

### Backups

- Enable automated daily backups.
- Verify point-in-time recovery where available.
- Test a restore into a staging database before launch.
- Document retention and restoration steps.

---

## 4. Image storage

### Cloudinary

1. Create a Cloudinary account and upload preset/proxy configuration.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Use server-side signed uploads; never expose the API secret.
4. Configure allowed formats, size limits, and transformations.

### Supabase Storage

1. Create a public bucket for product images and a private bucket for verification documents.
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
3. Use short-lived signed URLs for private documents.

---

## 5. Payments

### Paystack

1. Create a Paystack account and complete the required business verification.
2. Use test keys in staging.
3. Set `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, and `PAYSTACK_WEBHOOK_SECRET`.
4. Configure the webhook URL: `https://<domain>/api/webhooks/paystack`.
5. Verify webhook signatures and re-fetch transactions server-side.
6. Test success, failure, pending, duplicate, and amount-mismatch cases.
7. Do not enable live payments until refunds, settlement, and payout processes are reviewed.

### Hubtel (optional)

1. Obtain client ID, secret, and merchant account.
2. Configure callback URLs.
3. Add the adapter only after the provider interface and tests exist.

---

## 6. Email and SMS

### Email

- Configure Resend or SMTP.
- Set `EMAIL_FROM` to a verified sender.
- Test verification, password reset, and order notifications.
- If email is unavailable, disable self-service verification and use an administrator-assisted path with clear messaging.

### SMS

- Optional. Configure the provider and sender ID.
- Never block core registration if SMS is unconfigured.

---

## 7. AI configuration

- Set `AI_ENABLED=true` only when a provider is configured.
- Set `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`.
- Keep the AI feature flag off until grounding and fallback tests pass.
- AI failures must degrade to normal search, not block the marketplace.
- No AI keys in client-side variables.

---

## 8. Build and deploy (Vercel)

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Deploy to Vercel:

1. Import the GitHub repository (Vercel auto-detects Next.js and pnpm from `package.json`).
2. Node version: 22 (from `engines`); install command `pnpm install --frozen-lockfile`;
   build command `pnpm build`.
3. Set environment variables for Preview and Production (`DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, plus optional integrations).
4. Deploy to a preview environment first.
5. Run `pnpm db:deploy` against the preview database (direct URL).
6. Verify critical journeys.
7. Promote to production.

Notes:

- The Prisma client is generated during `postinstall` (`pnpm install`), so no extra
  build step is required on Vercel.
- Migrations are never run automatically at build time; run them from CI or locally
  with `pnpm db:deploy`.

---

## 9. Production verification

- [ ] Home, marketplace, category, and product pages load.
- [ ] Registration and email verification work.
- [ ] Login/logout and password reset work.
- [ ] Vendor onboarding and product creation work.
- [ ] Search and filters return database-backed results.
- [ ] Cart and checkout calculate correct totals.
- [ ] Payment initiation and webhook verification work in sandbox.
- [ ] Duplicate webhook does not double-process.
- [ ] Orders are visible only to authorized users.
- [ ] Reviews require eligible purchases.
- [ ] Admin routes reject non-admin users.
- [ ] Uploads work and invalid files are rejected.
- [ ] AI assistant works or is clearly disabled.
- [ ] Error tracking receives a test event.
- [ ] Backups are configured.
- [ ] Security headers are present.
- [ ] No secrets appear in the client bundle.

---

## 10. Migrations and rollback

### Deploying a migration

1. Back up the database.
2. Run migrations in a staging environment.
3. Run smoke tests.
4. Run production migrations before deploying the new application version.
5. Monitor errors and database health.

### Rollback

- Keep the previous deployment available.
- Revert the application deployment first.
- For destructive schema changes, restore from backup or run a reviewed down migration.
- Never run destructive migrations without a tested recovery plan.

---

## 11. Monitoring and operations

- Uptime monitoring on `/api/health`.
- Error tracking (Sentry or equivalent).
- Structured logs with request IDs.
- Alerts for payment webhook failures, elevated error rates, and database saturation.
- Admin audit log review for sensitive actions.
- Scheduled jobs for reservation expiry, abandoned orders, and payment reconciliation.

---

## 12. Launch checklist

- [ ] Architecture and SRS approved.
- [ ] Required credentials configured.
- [ ] Legal, privacy, terms, refund, and prohibited-items policies reviewed.
- [ ] Student verification policy approved.
- [ ] Admin accounts created securely.
- [ ] Sample data removed or clearly labeled.
- [ ] Backups and restore tested.
- [ ] Critical journeys A–F pass.
- [ ] Security checklist complete.
- [ ] Accessibility and performance targets met.
- [ ] Support and incident contacts documented.


---

## Production readiness additions (2026-11-11)

### Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Yes | The runtime prefers the unpooled URL, keeps sockets alive and retries transient connection failures |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin, used for payment callbacks and cross-origin checks |
| `AUTH_SECRET` | Yes | Session secret |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `PAYSTACK_CALLBACK_URL` | Yes for payments | Sandbox or live credentials |
| `BLOB_READ_WRITE_TOKEN` | Yes for uploads | Vercel Blob store token |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_ENABLED` | Optional | Server-side assistant |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional | Without it, mail is written to the server log in development |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Recommended | Distributed rate limiting |
| `CRON_SECRET` | Recommended | Protects the order-expiry endpoint |

### Scheduled jobs

Schedule `GET /api/v1/cron/expire-orders` every 15 minutes with the header `Authorization: Bearer $CRON_SECRET`. The route is idempotent and cancels unpaid orders, releases inventory holds and fails their pending payments.

### Storage

- Vercel Blob store `campus-market-media` (public). Product images are re-encoded and stored under random names; learning materials are stored under random names as well.
- The orphan sweep in `lib/uploads.ts` removes stored objects that no database row references.

### Deploying a schema change

1. Edit `prisma/schema.prisma`.
2. `pnpm db:generate`.
3. Create the migration (never edit an applied migration).
4. Apply it to a Neon branch first, then to production: `pnpm db:deploy`.
5. Deploy the application.

### Verifying a release

```bash
curl -s https://<domain>/api/health
```

The health endpoint reports the database, payment and AI configuration state and returns `degraded` when the database is unavailable. It never returns `ok` with an unreachable database.

### Rollback

Vercel keeps previous deployments: promote the previous deployment from the dashboard or with `vercel redeploy`. Database rollbacks must be forward-only — restore a Neon branch clone and repoint the connection strings, because destructive down-migrations are not permitted.
