import net from "node:net";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// High-RTT networks need more than Node's default 250ms happy-eyeballs attempt
// window or fresh pool connections fail with sporadic ETIMEDOUT.
net.setDefaultAutoSelectFamily(true);
net.setDefaultAutoSelectFamilyAttemptTimeout(3_000);

function resolveConnectionString(): string {
  const configured = process.env["DATABASE_URL"];
  if (configured) {
    return configured;
  }

  try {
    process.loadEnvFile(".env");
  } catch {
    // Standalone scripts may run without a .env file.
  }

  const loaded = process.env["DATABASE_URL"];
  if (loaded) {
    return loaded;
  }

  throw new Error(
    "DATABASE_URL is not configured. Copy .env.example to .env and set DATABASE_URL.",
  );
}

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(resolveConnectionString()),
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient() as unknown as Record<PropertyKey, unknown>;
    const value = client[property];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
  has(_target, property) {
    return property in (getClient() as unknown as object);
  },
});
