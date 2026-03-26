import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    try {
      console.log(`[SEND_OTP] Starting DB check for ${email}...`);
      const existingUser = await db.user.findUnique({
        where: { email },
      });
      console.log(`[SEND_OTP] DB check complete. User exists: ${!!existingUser}`);

      if (existingUser) {
        return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      console.log(`[SEND_OTP] Clearing old tokens...`);
      await db.verificationToken.deleteMany({
        where: { identifier: email },
      });

      console.log(`[SEND_OTP] Saving new OTP to DB...`);
      await db.verificationToken.create({
        data: {
          identifier: email,
          token: otp,
          expires,
        },
      });

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[SEND_OTP] WARNING: Email credentials missing. MOCK mode.`);
        return NextResponse.json({ message: "MOCK_OTP", otp }, { status: 200 });
      }

      console.log(`[SEND_OTP] Initializing Nodemailer...`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      console.log(`[SEND_OTP] Attempting to send mail via SMTP...`);
      await transporter.sendMail({
        from: `"CareerSync Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your CareerSync Registration OTP",
        html: `<h1>Welcome to CareerSync!</h1><p>Your OTP is: <strong>${otp}</strong></p>`,
      });

      console.log(`[SEND_OTP] OTP successfully delivered to ${email}`);
      return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
    } catch (db_error: any) {
      console.error("[SEND_OTP] CORE ERROR:", db_error);
      return NextResponse.json({ 
        message: "Production Error", 
        debug: db_error.message || "Unknown",
        stack: process.env.NODE_ENV === "development" ? db_error.stack : undefined
      }, { status: 500 });
    }
}
