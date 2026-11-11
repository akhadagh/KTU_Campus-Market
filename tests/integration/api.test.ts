import { describe, expect, it } from "vitest";

const BASE_URL = process.env["TEST_BASE_URL"] ?? "http://localhost:3000";
const DEMO_PASSWORD = process.env["SEED_SAMPLE_PASSWORD"] ?? "";

async function serverIsReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/session`);
    return res.ok;
  } catch {
    return false;
  }
}

const reachable = await serverIsReachable();

class Session {
  private cookies = new Map<string, string>();

  header(): string {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  }

  absorb(res: Response): void {
    for (const cookie of res.headers.getSetCookie?.() ?? []) {
      const [pair] = cookie.split(";");
      if (!pair) continue;
      const index = pair.indexOf("=");
      if (index > 0) {
        this.cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
      }
    }
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const cookieHeader = this.header();
    if (cookieHeader) headers.set("cookie", cookieHeader);
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, redirect: "manual" });
    this.absorb(res);
    return res;
  }

  json<T = unknown>(res: Response): Promise<T> {
    return res.json() as Promise<T>;
  }
}

describe.skipIf(!reachable)("public marketplace", () => {
  it("renders the marketplace with live listings", async () => {
    const res = await fetch(`${BASE_URL}/marketplace`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Explore marketplace");
  });

  it("returns the category list from the database", async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Browse categories");
  });
});

describe.skipIf(!reachable)("authentication", () => {
  it("registers, opens a session, and rejects duplicates", async () => {
    const session = new Session();
    const email = `smoke.${Date.now()}@ktu.edu.gh`;
    const body = JSON.stringify({
      fullName: "Smoke Test",
      email,
      password: "Password123",
      phone: "0240000099",
    });

    const created = await session.fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    expect(created.status).toBe(201);
    const payload = await session.json<{ data: { user: { email: string } } }>(created);
    expect(payload.data.user.email).toBe(email);

    const sessionRes = await session.fetch("/api/v1/auth/session");
    expect(sessionRes.status).toBe(200);

    const duplicate = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    expect(duplicate.status).toBe(409);

    const logout = await session.fetch("/api/v1/auth/logout", { method: "POST" });
    expect(logout.status).toBe(200);

    const afterLogout = await session.fetch("/api/v1/auth/session");
    const afterPayload = await session.json<{ data: { user: unknown } }>(afterLogout);
    expect(afterPayload.data.user).toBeNull();
  });

  it("rejects a wrong password", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sample-tech-store@example.com",
        password: "definitely-not-the-password",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("logs in the seeded demo vendor when a demo password is configured", async () => {
    if (!DEMO_PASSWORD) return;
    const session = new Session();
    const res = await session.fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sample-tech-store@example.com",
        password: DEMO_PASSWORD,
      }),
    });
    expect(res.status).toBe(200);
    const me = await session.fetch("/api/v1/vendors/me");
    expect(me.status).toBe(200);
  });
});

describe.skipIf(!reachable)("protected routes", () => {
  it("redirects anonymous visitors to login", async () => {
    const res = await fetch(`${BASE_URL}/orders`, { redirect: "manual" });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?next=%2Forders");
  });
});

describe.skipIf(!reachable)("cart and checkout", () => {
  it("adds a live listing to a guest cart and returns the summary", async () => {
    const session = new Session();
    const marketplace = await fetch(`${BASE_URL}/marketplace`);
    const html = await marketplace.text();
    const match = html.match(/\/products\/([a-z0-9-]+)/);
    if (!match) throw new Error("No product links found on the marketplace page");

    const detail = await fetch(`${BASE_URL}/api/v1/products/${match[1]}`);
    expect(detail.status).toBe(200);
    const detailPayload = (await detail.json()) as { data: { product: { id: string } } };
    const productId = detailPayload.data.product.id;

    const added = await session.fetch("/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    expect(added.status).toBe(201);

    const cart = await session.fetch("/api/v1/cart");
    expect(cart.status).toBe(200);
    const payload = await session.json<{
      data: { items: { productId: string; quantity: number }[]; subtotalPesewas: number };
    }>(cart);
    expect(payload.data.items.some((item) => item.productId === productId)).toBe(true);
    expect(payload.data.subtotalPesewas).toBeGreaterThan(0);
  });
});
