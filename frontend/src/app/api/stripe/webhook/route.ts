import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get("Stripe-Signature") as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as any

  if (event.type === "checkout.session.completed") {
    const userId = session.metadata?.userId
    const tierRaw = session.metadata?.tier || "PRO"
    const finalTier = tierRaw === "EXECUTIVE" ? "EXECUTIVE" : "PRO"

    if (userId) {
      await db.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: finalTier,
        }
      })
    }
  }

  return new NextResponse(null, { status: 200 })
}
