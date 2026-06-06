import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, or password." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExists) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate a secure verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Set trial expiration to 7 days from now
    const trialStartedAt = new Date();
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

    // Create new user in the database
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "ADMIN",
        verified: false,
        verificationToken,
        trialStartedAt,
        trialExpiresAt,
      },
    });

    // Dynamic verification URL
    const origin = request.headers.get("origin") || "http://localhost:3001";
    const verificationUrl = `${origin}/api/verify?token=${verificationToken}`;

    return NextResponse.json({
      success: true,
      verificationUrl, // Return verification URL so the UI can mock the email inbox!
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verified: false,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to create account." },
      { status: 500 }
    );
  }
}
