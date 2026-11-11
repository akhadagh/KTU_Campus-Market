import net from "node:net";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// High-RTT networks need more than Node's default 250ms happy-eyeballs attempt
// window or fresh pool connections fail with sporadic ETIMEDOUT.
net.setDefaultAutoSelectFamily(true);
net.setDefaultAutoSelectFamilyAttemptTimeout(3_000);

function resolveConnectionString(): { url: string; pooled: boolean } {
  const unpooled = process.env["DATABASE_URL_UNPOOLED"];
  const pooled = process.env["DATABASE_URL"];

  if (unpooled) {
    return { url: unpooled, pooled: false };
  }

  if (pooled) {
    return { url: pooled, pooled: true };
  }

  try {
    process.loadEnvFile(".env");
  } catch {
    // Standalone scripts may run without a .env file.
  }

  const loadedUnpooled = process.env["DATABASE_URL_UNPOOLED"];
  if (loadedUnpooled) return { url: loadedUnpooled, pooled: false };

  const loadedPooled = process.env["DATABASE_URL"];
  if (loadedPooled) return { url: loadedPooled, pooled: true };

  throw new Error(
    "DATABASE_URL is not configured. Copy .env.example to .env and set DATABASE_URL.",
  );
}

function createClient(): PrismaClient {
  const { url, pooled } = resolveConnectionString();
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      keepAlive: true,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
      max: pooled ? 5 : 10,
    }),
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

const TRANSIENT_CODES = new Set(["P1017", "P1001", "P1008", "P2024"]);
const TRANSIENT_PATTERNS = [
  "server has closed the connection",
  "connection terminated",
  "econnreset",
  "etimedout",
  "socket hang up",
  "timeout exceeded when trying to connect",
];

function isTransient(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; message?: unknown };
  if (typeof candidate.code === "string" && TRANSIENT_CODES.has(candidate.code)) return true;
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return TRANSIENT_PATTERNS.some((pattern) => message.includes(pattern));
}

async function withRetry<T>(operation: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (attempt < 3 && isTransient(error)) {
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      if (attempt === 1) {
        try {
          // The provider recycled the socket. Rebuild the pool before the next attempt.
          await getClient().$disconnect();
          await getClient().$connect();
        } catch {
          // Ignore reconnect failures and let the retry decide.
        }
      }
      return withRetry(operation, attempt + 1);
    }
    throw error;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient() as unknown as Record<PropertyKey, unknown>;
    const value = client[property];
    if (typeof value === "function") {
      const bound = (value as (...args: unknown[]) => unknown).bind(client);
      if (property === "$connect" || property === "$disconnect" || property === "$on") {
        return bound;
      }
      return (...args: unknown[]) =>
        withRetry(() => Promise.resolve(bound(...args)) as Promise<unknown>);
    }
    return value;
  },
  has(_target, property) {
    return property in (getClient() as unknown as object);
  },
});
