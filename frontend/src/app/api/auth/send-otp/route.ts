import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clear any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Save strictly to DB
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    // If no email variables exist, fallback to dev console log gracefully
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`\n\n[MOCK EMAIL] OTP for ${email} is: ${otp}\n\n`);
      return NextResponse.json({ message: "MOCK_OTP", otp: otp }, { status: 200 });
    }

    // Using Nodemailer to send actual email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CareerSync Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your CareerSync Registration OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Welcome to CareerSync Pro!</h2>
          <p>You recently requested to create a new account. Use the following OTP to verify your email address:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #0f172a; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return NextResponse.json({ message: "Failed to send OTP email. Have you set EMAIL_USER and EMAIL_PASS?" }, { status: 500 });
  }
}
