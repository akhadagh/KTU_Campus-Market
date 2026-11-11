import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "cm_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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
