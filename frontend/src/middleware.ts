import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSession = Boolean(sessionCookie?.trim());
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    // Do not auto-redirect to /dashboard just because a cookie is present: the cookie may
    // be invalid (DB reset, session revoked) and `HttpOnly` means clearSession() on the
    // client cannot clear it. The SessionProvider and the /auth page validate via getMe
    // and redirect when appropriate.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/auth"],
};
