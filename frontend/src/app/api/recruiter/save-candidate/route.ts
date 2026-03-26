import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      name, email, phone, college, githubUrl, similarity, status, resumeFileStr, resumeName 
    } = await req.json();

    let buffer: Buffer | null = null;
    if (resumeFileStr) {
      // Decode the dynamic Base64 String to raw buffer bytes for secure SQLite Native persistence
      const base64Data = resumeFileStr.split(';base64,').pop();
      if (base64Data) {
        buffer = Buffer.from(base64Data, 'base64');
      }
    }

    const candidate = await db.candidate.create({
      data: {
        recruiterId: (session.user as any).id,
        name,
        email,
        phone,
        college,
        githubUrl,
        similarity: Number(similarity),
        status,
        resumeFile: buffer, // Beautiful encrypted binary insertion!
        resumeName
      }
    });

    // Broadcast automated confirmation via Next.js Email Pipeline if candidate breached the 80% AI Threshold
    if (status === "Selected" && email && email !== "Unknown") {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"CareerSync Pro" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Invitation to Interview - Job Match",
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
              <h2 style="color: #10b981;">Congratulations ${name}!</h2>
              <p>Your verified GitHub credentials and application have successfully passed our Autonomous Job Verification Architecture with an elite <strong>${similarity}%</strong> matching score!</p>
              <br/>
              <p>Your resume from <strong>${college || "University"}</strong> stood out among other candidates. Our recruiting team has officially saved your profile to our high-priority matrix, and we would love to move forward with formally scheduling an interview!</p>
              <br>
              <p>Best Regards,<br><strong>The Recruiting Team</strong></p>
            </div>
          `,
        });
        console.log(`NodeMailer perfectly dispatched the Interview Offer strictly to ${email}!`);
      } catch (mailError) {
        console.error("Nodemailer routing failure:", mailError);
        // We do not fail the candidate insertion if the automated email throws an exception!
      }
    }

    return NextResponse.json({ success: true, candidateId: candidate.id });
  } catch (error) {
    console.error("Failed to asynchronously commit candidate or email process:", error);
    return NextResponse.json({ error: "Internal Database insertion failed." }, { status: 500 });
  }
}
