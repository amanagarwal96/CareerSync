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
  jdGaps?: string
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
