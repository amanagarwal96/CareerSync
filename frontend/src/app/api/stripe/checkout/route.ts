import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

const pricingMap: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_dummy_pro",
  executive: process.env.STRIPE_EXECUTIVE_PRICE_ID || "price_dummy_executive",
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tier } = await req.json()
    const priceId = pricingMap[tier]

    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    // Get or create Stripe Customer
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id }
    })

    let customerId = user?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
      })
      customerId = customer.id
      
      await db.user.update({
        where: { id: (session.user as any).id },
        data: { stripeCustomerId: customerId }
      })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?checkout=cancelled`,
      metadata: {
        userId: (session.user as any).id,
        tier: tier.toUpperCase(),
      }
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("STRIPE_CHECKOUT_ERROR", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
