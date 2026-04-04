"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function saveResumeAnalysis(data: { 
  atsScore: number, 
  content: string, 
  gaps: string,
  fileName?: string,
  jdSimilarity?: number,
  jdGaps?: string,
  graphData?: string,
  forensicAnalysis?: any
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Not logged in" }
  
  const userId = (session.user as any).id;
  if (!userId) return { success: false, error: "No user ID" }

  try {
    await db.resume.create({
      data: {
        userId: userId,
        atsScore: data.atsScore,
        content: data.content,
        keywordGaps: data.gaps,
        fileName: data.fileName,
        jdSimilarity: data.jdSimilarity,
        jdGaps: data.jdGaps,
        graphData: data.graphData,
        forensicAnalysis: data.forensicAnalysis
      }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    console.error("Save Resume Error:", e)
    return { success: false, error: e.message }
  }
}

export async function updateProfile(data: { name: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Not logged in" }
  
  const userId = (session.user as any).id;
  if (!userId) return { success: false, error: "No user ID" }

  try {
    await db.user.update({
      where: { id: userId },
      data: { name: data.name }
    })
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    console.error("Update Profile Error:", e)
    return { success: false, error: e.message }
  }
}

export async function saveCoverLetter(data: { targetJob: string, content: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Not logged in" }
  
  const userId = (session.user as any).id;
  if (!userId) return { success: false, error: "No user ID" }

  try {
    await db.coverLetter.create({
      data: {
        userId: userId,
        targetJob: data.targetJob,
        content: data.content,
      }
    })
    return { success: true }
  } catch (e: any) {
    console.error("Save Cover Letter Error:", e)
    return { success: false, error: e.message }
  }
}
import { redirect } from "next/navigation"

export async function deleteAccount() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Not logged in" }
  
  const userId = (session.user as any).id;
  if (!userId) return { success: false, error: "No user ID" }

  try {
    // Delete all user related data (Prisma Cascade will handle most, but we can be explicit)
    await db.user.delete({
      where: { id: userId }
    })
    return { success: true }
  } catch (e: any) {
    console.error("Delete Account Error:", e)
    return { success: false, error: e.message }
  }
}

export async function updatePreferences(data: { aiMode?: string, discovery?: boolean }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Not logged in" }
  
  const userId = (session.user as any).id;
  if (!userId) return { success: false, error: "No user ID" }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        ...(data.aiMode && { aiMode: data.aiMode }),
        ...(data.discovery !== undefined && { discovery: data.discovery }),
      }
    })
    revalidatePath('/settings')
    return { success: true }
  } catch (e: any) {
    console.error("Update Preferences Error:", e)
    return { success: false, error: e.message }
  }
}
export async function fetchAndEmailJobs(data: { 
  jobRole: string, 
  targetEmail: string 
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { status: "error", message: "Not logged in" }
  
  const BACKEND_URL = process.env.BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://careersync-backend:8000';

  try {
    const response = await fetch(`${BACKEND_URL}/api/ghost/fetch-and-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        job_role: data.jobRole,
        target_email: data.targetEmail
      })
    });

    const result = await response.json();
    if (!response.ok) {
       throw new Error(result.detail || "Ghost Fetch Mission failed.");
    }

    return result;
  } catch (e: any) {
    console.error("Ghost Fetch Action Error:", e)
    return { status: "error", message: e.message }
  }
}

export async function analyzeExternalLink(url: string, manualJd?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Not logged in" }
  const userId = (session.user as any).id;

  try {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("url", url);
    if (manualJd) formData.append("manual_jd", manualJd);

    const BACKEND_URL = process.env.BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://careersync-backend:8000';
    const response = await fetch(`${BACKEND_URL}/api/ghost/analyze-link`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    
    if (data.status === "SCRAPE_BLOCKED") {
      return { success: false, status: "SCRAPE_BLOCKED", message: data.message }
    }

    if (data.status === "SUCCESS") {
      revalidatePath('/dashboard/ghost')
      return { success: true, match: data.match }
    }

    return { success: false, error: data.message || "Forensic analysis failed." }
  } catch (e: any) {
    console.error("Analyze Link Error:", e)
    return { success: false, error: e.message }
  }
}
