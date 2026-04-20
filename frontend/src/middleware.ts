import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSession = Boolean(sessionCookie?.trim());
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      console.log("[middleware] /dashboard sem cookie → /auth", SESSION_COOKIE_NAME);
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    console.log("[middleware] /dashboard com cookie → next");
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    // Não redireccionar para /dashboard só porque existe cookie: o cookie pode estar
    // inválido (DB reset, sessão revogada). HttpOnly não é limpo por clearSession() no cliente.
    // O SessionProvider + página /auth validam com getMe e redireccionam quando apropriado.
    console.log("[middleware] /auth → next (sem auto-redirect por cookie)");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/auth"],
};
