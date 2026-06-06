export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      const loginUrl = new URL("/login?error=InvalidToken", url.origin);
      return NextResponse.redirect(loginUrl);
    }

    // Find the user with this token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      const loginUrl = new URL("/login?error=TokenExpiredOrInvalid", url.origin);
      return NextResponse.redirect(loginUrl);
    }

    // Activate the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
      },
    });

    // Redirect back to login with success flag
    const successUrl = new URL("/login?verified=true", url.origin);
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Verification endpoint error:", error);
    const url = new URL(request.url);
    const errorUrl = new URL("/login?error=InternalServerError", url.origin);
    return NextResponse.redirect(errorUrl);
  }
}
