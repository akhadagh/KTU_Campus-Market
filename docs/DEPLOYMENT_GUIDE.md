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

## 3. Database setup

1. Create a PostgreSQL database.
2. Set `DATABASE_URL` and `DIRECT_URL`.
3. Run migrations:

```bash
pnpm prisma migrate deploy
```

4. Seed reference data (universities, campuses, roles, permissions, categories) using a production-safe seed command.
5. Do not seed sample vendors/products in production unless explicitly labeled and approved.

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

## 8. Build and deploy

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Deploy to Vercel:

1. Import the repository.
2. Set environment variables for Preview and Production.
3. Configure the build command (`pnpm build`) and install command.
4. Deploy to a preview environment first.
5. Run database migrations against the preview database.
6. Verify critical journeys.
7. Promote to production.

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
