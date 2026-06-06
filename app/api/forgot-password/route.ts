import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account exists with this email address." },
        { status: 404 }
      );
    }

    // Generate secure password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save resetToken to user in the database
    const resetTokenExpiry = String(Date.now() + 3600000); // 1 hour expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Generate dynamic reset URL
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    const loadEnvIfNeeded = () => {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        try {
          const envPath = path.join(process.cwd(), ".env");
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf8");
            const lines = content.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith("#")) continue;
              const eqIdx = trimmed.indexOf("=");
              if (eqIdx !== -1) {
                const key = trimmed.substring(0, eqIdx).trim();
                let val = trimmed.substring(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                  val = val.substring(1, val.length - 1);
                }
                process.env[key] = val;
              }
            }
          }
        } catch (e) {
          console.error("Failed to manually load .env file:", e);
        }
      }
    }

    // Attempt to send a real email using SMTP if configured
    let emailSent = false;
    loadEnvIfNeeded();
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: `"Top Sales Webnova" <${smtpUser}>`,
          to: email,
          subject: "Reset Your Webnova Account Password",
          html: `
            <div style="font-family: sans-serif; padding: 25px; color: #0F172A; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #2563EB, #06B6D4); color: white; display: inline-block; padding: 12px 20px; font-weight: bold; border-radius: 12px; font-size: 20px;">TS</div>
                 <h2 style="color: #0F172A; font-size: 22px; margin-top: 15px; margin-bottom: 5px;">Webnova password recovery</h2>
                <p style="color: #64748B; font-size: 14px; margin: 0;">Top Sales Enterprise Platform</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin-bottom: 25px;" />
              <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello ${user.name || "Administrator"},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #334155;">We received a request to reset your Top Sales Webnova account password. Please click the button below to set a new secure password:</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #64748B; line-height: 1.6;">If the button doesn't work, copy and paste this link into your browser address bar:</p>
              <p style="font-size: 13px; color: #2563EB; word-break: break-all; margin-bottom: 30px;"><a href="${resetUrl}" style="color: #2563EB; text-decoration: underline;">${resetUrl}</a></p>
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin-bottom: 20px;" />
              <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">This email was sent to ${email} as part of a requested password recovery. If you did not make this request, you can safely ignore this message.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`Password reset email successfully sent to ${email}`);
      } catch (mailError) {
        console.error("Nodemailer failed to send email:", mailError);
      }
    } else {
      console.warn("SMTP is not fully configured in environment variables. Real email was not sent.");
      console.log(`[Developer Preview] Reset password link: ${resetUrl}`);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      resetUrl, // Send back as fallback / console logs
      user: {
        name: user.name,
        email: user.email,
      }
    });
  } catch (error: any) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to initiate password reset." },
      { status: 500 }
    );
  }
}
