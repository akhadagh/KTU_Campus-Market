import { spawn, type ChildProcess } from "node:child_process";

let server: ChildProcess | null = null;

const TEST_PORT = process.env["TEST_PORT"] ?? "3100";
const TEST_BASE_URL = process.env["TEST_BASE_URL"] ?? `http://localhost:${TEST_PORT}`;

async function waitForServer(url: string, timeoutMs: number): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`, { cache: "no-store" });
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return false;
}

export async function setup(): Promise<void> {
  // When an external server is provided (CI), use it as is.
  if (process.env["TEST_BASE_URL"]) {
    return;
  }

  // A dedicated instance is only started when an isolated test database is
  // supplied (the CI path). Otherwise the running development server is used.
  if (!process.env["TEST_DATABASE_URL"]) {
    process.env["TEST_BASE_URL"] = "http://localhost:3000";
    return;
  }

  const command = process.env["TEST_USE_DEV_SERVER"] === "1" ? "pnpm dev" : "pnpm start";
  server = spawn(command, {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: TEST_PORT,
      NEXT_PUBLIC_APP_URL: `http://localhost:${TEST_PORT}`,
      ...(process.env["TEST_DATABASE_URL"]
        ? {
            DATABASE_URL: process.env["TEST_DATABASE_URL"],
            DATABASE_URL_UNPOOLED: process.env["TEST_DATABASE_URL"],
          }
        : {}),
    },
  });

  const ready = await waitForServer(TEST_BASE_URL, 120_000);
  if (!ready) {
    throw new Error(`Test application did not become ready at ${TEST_BASE_URL}`);
  }
  process.env["TEST_BASE_URL"] = TEST_BASE_URL;
}

export async function teardown(): Promise<void> {
  if (server && !server.killed) {
    server.kill("SIGTERM");
  }
}
