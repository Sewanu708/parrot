import { type NextRequest, NextResponse } from "next/server";

/**
 * Handles the email verification link that users click from their inbox.
 * The email contains a link pointing here: /api/auth/verify-email?token=...
 * This route calls the Express API, then redirects the user to the login page
 * with an appropriate status message — no user-facing page required.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/login?error=Missing+verification+token.", base)
    );
  }

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    const res = await fetch(
      `${apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`
    );

    if (res.ok) {
      return NextResponse.redirect(
        new URL("/auth/login?verified=true", base)
      );
    }

    const body = await res.json().catch(() => ({}));
    const message =
      body?.message ?? "Verification failed. Please try again.";

    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(message)}`, base)
    );
  } catch {
    return NextResponse.redirect(
      new URL(
        "/auth/login?error=Verification+failed.+Please+try+again.",
        base
      )
    );
  }
}
