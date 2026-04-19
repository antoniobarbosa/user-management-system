import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSession = Boolean(sessionCookie?.trim());
  const { pathname } = request.nextUrl;

  /** Session for the Next.js app is carried in memory (`x-session-id`), not the backend cookie. */
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/auth"],
};
