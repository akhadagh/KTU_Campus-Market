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
    // Migrations run against the direct (non-pooled) URL when provided
    // (Neon pooled connections do not support transactional migrations).
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
