import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file present; rely on the ambient environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations run against the direct (non-pooled) connection:
    // Neon exposes it as DATABASE_URL_UNPOOLED; other hosts may use DIRECT_URL.
    // Pooled (PgBouncer) connections do not support transactional migrations.
    url:
      process.env["DATABASE_URL_UNPOOLED"] ||
      process.env["DIRECT_URL"] ||
      process.env["DATABASE_URL"],
  },
});
