import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicFileRegex = /\.(.*)$/;
const authRoutesRegex = /\/auth\/(.*)$/;

export default withAuth(
  function middleware(req) {
    const session = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isLoggedIn = !!session;
    const isProtected =
      pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
    const isAuthPage = pathname.startsWith("/auth");

    // Unauthenticated user hitting a protected route → send to login
    if (isProtected && !isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user hitting an auth page → send to dashboard
    if (isAuthPage && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req }) => {
        const { pathname } = req.nextUrl;
        const token =
          req.cookies.get("__Secure-next-auth.session-token") ||
          req.cookies.get("next-auth.session-token");

        // Allow access to public files, auth routes, Next.js internals, and the home page
        if (
          pathname.startsWith("/_next") ||
          pathname.startsWith("/api") ||
          pathname.startsWith("/static") ||
          pathname.startsWith("/sandbox") ||
          publicFileRegex.test(pathname) ||
          authRoutesRegex.test(pathname) ||
          pathname === "/" // home page
        ) {
          return true;
        }

        // For all other routes, require a token
        return !!token;
      },
    },
    // Uncomment and configure custom pages if needed
    pages: { signIn: "/auth/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/auth/:path*"],
};
