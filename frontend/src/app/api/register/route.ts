import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, otp, role } = body

    if (!email || !password || !otp) {
      return NextResponse.json(
        { message: "Email, password, and OTP are required" },
        { status: 400 }
      )
    }

    // Verify OTP
    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: otp
        }
      }
    })

    if (!verificationToken) {
      return NextResponse.json({ message: "Invalid OTP code" }, { status: 400 })
    }

    if (new Date() > verificationToken.expires) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 })
    }


    // check if user exists
    const existingUserByEmail = await db.user.findUnique({
      where: { email: email }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "User with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await hash(password, 10)
    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "STUDENT"
      }
    })

    // Delete the used OTP
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: otp
        }
      }
    })

    return NextResponse.json(
      { user: { id: newUser.id, email: newUser.email, name: newUser.name }, message: "User created successfully" },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("❌ REGISTER API ERROR (Forensic):", {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        message: "Something went wrong", 
        dev_note: error?.message // Temporary: helps identify missing columns in logs
      },
      { status: 500 }
    )
  }
}
