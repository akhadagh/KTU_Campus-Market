import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/session";

const SESSION_COOKIE = "cm_session";
const STAFF_ROLES = new Set(["admin", "moderator"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

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
  ],
};
