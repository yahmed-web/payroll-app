import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (token) {
      const trialExpiresAt = token.trialExpiresAt as string | null | undefined;
      if (trialExpiresAt && new Date(trialExpiresAt) < new Date()) {
        const url = req.nextUrl.clone();
        if (url.pathname !== "/trial-expired") {
          url.pathname = "/trial-expired";
          return NextResponse.redirect(url);
        }
      }
    }
    // Allow all authenticated users to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Must have a valid JWT token
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect all routes EXCEPT login, reset-password, trial-expired, api/auth, api/register, api/verify, api/forgot-password, api/reset-password, and static files
export const config = {
  matcher: [
    "/((?!login|reset-password|trial-expired|api/auth|api/register|api/verify|api/forgot-password|api/reset-password|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
