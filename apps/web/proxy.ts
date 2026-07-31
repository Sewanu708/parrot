import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  const isLoggedIn = Boolean(token);
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/create-workspace") ||
    pathname.startsWith("/onboarding");
  const isAuthPage = pathname.startsWith("/auth");

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting an auth page → redirect to dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create-workspace/:path*",
    "/onboarding/:path*",
    "/auth/:path*",
  ],
};
