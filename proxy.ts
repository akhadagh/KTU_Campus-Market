import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/session";

const SESSION_COOKIE = "cm_session";
const STAFF_ROLES = new Set(["admin", "moderator"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Rejects state-changing requests that arrive from another site. Requests
 * without an Origin header (server-to-server, for example the Paystack webhook)
 * are allowed through and are authenticated by their own signature or session.
 */
function isCrossOrigin(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const requestOrigin = new URL(request.url).origin;
  const configured = process.env["NEXT_PUBLIC_APP_URL"];
  const allowed = new Set<string>([requestOrigin]);
  if (configured) {
    try {
      allowed.add(new URL(configured).origin);
    } catch {
      // Ignore an invalid configured URL and keep the request origin only.
    }
  }
  return !allowed.has(origin);
}

async function enforceStaff(request: NextRequest, token: string | undefined) {
  if (!token) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "AUTH_REQUIRED", message: "Log in to continue." },
        meta: null,
      },
      { status: 401 },
    );
  }
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        revokedAt: true,
        expiresAt: true,
        user: {
          select: {
            roles: { select: { role: { select: { name: true } } } },
          },
        },
      },
    });

    const valid =
      session !== null && session.revokedAt === null && session.expiresAt.getTime() > Date.now();
    const isStaff = session?.user.roles.some((entry) => STAFF_ROLES.has(entry.role.name));

    if (!valid || !isStaff) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "FORBIDDEN", message: "Staff access required." },
          meta: null,
        },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Authorization check failed." },
        meta: null,
      },
      { status: 500 },
    );
  }
  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/v1/") && isCrossOrigin(request)) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FORBIDDEN", message: "Cross-origin request rejected." },
        meta: null,
      },
      { status: 403 },
    );
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const isApiRoute = pathname.startsWith("/api/v1/");

  // API routes authenticate themselves (deny by default inside each handler)
  // and some of them are intentionally public, such as guest carts and the
  // payment callback. The proxy only adds cross-origin protection there.
  if (isApiRoute) {
    if (pathname.startsWith("/api/v1/admin")) {
      return enforceStaff(request, token);
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    try {
      const session = await prisma.session.findUnique({
        where: { tokenHash: hashToken(token) },
        select: {
          revokedAt: true,
          expiresAt: true,
          user: {
            select: {
              roles: { select: { role: { select: { name: true } } } },
            },
          },
        },
      });

      const valid =
        session !== null && session.revokedAt === null && session.expiresAt.getTime() > Date.now();
      const isStaff = session?.user.roles.some((entry) => STAFF_ROLES.has(entry.role.name));

      if (!valid || !isStaff) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/orders/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/sell/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/api/v1/:path*",
  ],
};
