import { describe, expect, it } from "vitest";

const BASE_URL = process.env["TEST_BASE_URL"] ?? "http://localhost:3100";
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
        email: "adumtechpoint@campusmarket.gh",
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
        email: "adumtechpoint@campusmarket.gh",
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

describe.skipIf(!reachable)("airtime and digital delivery", () => {
  it("exposes bundles with digital delivery and external purchase links", async () => {
    const bundle = await fetch(`${BASE_URL}/api/v1/products/mtn-data-bundle-5gb`);
    expect(bundle.status).toBe(200);
    const bundlePayload = (await bundle.json()) as {
      data: {
        product: { purchaseMode: string; deliveryOptions: string[]; digitalDetails: unknown };
      };
    };
    expect(bundlePayload.data.product.purchaseMode).toBe("INTERNAL");
    expect(bundlePayload.data.product.deliveryOptions).toContain("DIGITAL");
    expect(bundlePayload.data.product.digitalDetails).toBeTruthy();

    const external = await fetch(`${BASE_URL}/api/v1/products/vodafone-20gb-calls`);
    const externalPayload = (await external.json()) as {
      data: { product: { purchaseMode: string; externalUrl: string | null } };
    };
    expect(externalPayload.data.product.purchaseMode).toBe("EXTERNAL");
    expect(externalPayload.data.product.externalUrl).toMatch(/^https?:\/\//);
  });

  it("blocks unverified buyers from checking out", async () => {
    const session = new Session();
    const email = `smoke.unverified.${Date.now()}@ktu.edu.gh`;
    const created = await session.fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Smoke Unverified", email, password: "Password123" }),
    });
    expect(created.status).toBe(201);

    const detail = await fetch(`${BASE_URL}/api/v1/products/mtn-data-bundle-5gb`);
    const productId = ((await detail.json()) as { data: { product: { id: string } } }).data.product
      .id;

    const added = await session.fetch("/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    expect(added.status).toBe(201);

    const order = await session.fetch("/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryMethod: "DIGITAL",
        msisdn: "0241234567",
        idempotencyKey: `smoke-unverified-${Date.now()}`,
      }),
    });
    expect(order.status).toBe(403);
    const payload = (await order.json()) as { error: { code: string } };
    expect(payload.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("requires a phone number for a digital order and creates it with one", async () => {
    const demoPassword = process.env["SEED_SAMPLE_PASSWORD"] ?? "";
    if (!demoPassword) return;
    const session = new Session();
    const login = await session.fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "adumtechpoint@campusmarket.gh",
        password: demoPassword,
      }),
    });
    expect(login.status).toBe(200);

    const detail = await fetch(`${BASE_URL}/api/v1/products/mtn-data-bundle-5gb`);
    const productId = ((await detail.json()) as { data: { product: { id: string } } }).data.product
      .id;

    const added = await session.fetch("/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    expect(added.status).toBe(201);

    const withoutNumber = await session.fetch("/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryMethod: "DIGITAL",
        idempotencyKey: `smoke-digital-${Date.now()}`,
      }),
    });
    expect(withoutNumber.status).toBe(422);

    const withNumber = await session.fetch("/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryMethod: "DIGITAL",
        msisdn: "0241234567",
        idempotencyKey: `smoke-digital-${Date.now()}`,
      }),
    });
    expect(withNumber.status).toBe(201);
    const order = (await withNumber.json()) as { data: { order: { orderNumber: string } } };
    expect(order.data.order.orderNumber).toMatch(/^CM-\d{8}-\d{5}$/);
  });
});

describe.skipIf(!reachable)("JUMART support messaging", () => {
  it("lets a student message the JUMART team", async () => {
    const session = new Session();
    const email = `smoke.support.${Date.now()}@ktu.edu.gh`;
    const created = await session.fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Smoke Support", email, password: "Password123" }),
    });
    expect(created.status).toBe(201);

    const sent = await session.fetch("/api/v1/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "SUPPORT",
        subject: "Order not delivered",
        body: "My order has not arrived after three days.",
      }),
    });
    expect(sent.status).toBe(201);
    const payload = (await sent.json()) as { data: { conversationId: string } };
    expect(payload.data.conversationId).toBeTruthy();

    const list = await session.fetch("/api/v1/conversations");
    const listPayload = (await list.json()) as {
      data: { conversations: { kind: string; peerName: string }[] };
    };
    const support = listPayload.data.conversations.find((item) => item.kind === "SUPPORT");
    expect(support?.peerName).toBe("JUMART Support");
  });
});

describe.skipIf(!reachable)("free learning materials", () => {
  it("exposes the public materials library", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/resources`);
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { data: { materials: unknown[] } };
    expect(Array.isArray(payload.data.materials)).toBe(true);
  });
});

describe.skipIf(!reachable)("vendor link approval gate", () => {
  it("keeps unapproved external links hidden and exposes approved ones", async () => {
    const pending = await fetch(`${BASE_URL}/api/v1/products/airteltigo-20gb-monthly`);
    expect(pending.status).toBe(404);

    const approved = await fetch(`${BASE_URL}/api/v1/products/mtn-10gb-weekly`);
    expect(approved.status).toBe(200);
    const payload = (await approved.json()) as {
      data: { product: { purchaseMode: string; externalStatus: string; externalUrl: string } };
    };
    expect(payload.data.product.purchaseMode).toBe("EXTERNAL");
    expect(payload.data.product.externalStatus).toBe("APPROVED");
    expect(payload.data.product.externalUrl).toMatch(/^https?:\/\//);
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
