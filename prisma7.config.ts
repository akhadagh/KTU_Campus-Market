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
    url: process.env["DATABASE_URL"],
  },
});
