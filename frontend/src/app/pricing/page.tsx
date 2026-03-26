"use client"

import { useState } from "react"
import Link from "next/link";
import { Check, Star, Zap, Building2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleCheckout = async (tierId: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    setLoadingTier(tierId)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTier(null)
    }
  }
  return (
    <main className="min-h-screen pt-24 pb-12">
      <Navbar />
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-outfit font-bold text-white mb-4">Invest in Your Future</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get access to the Billion-Dollar AI Suite. Match with the best roles, ace the interview, and negotiate the highest salary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pro Tier */}
          <PricingCard 
            name="Pro Seeker"
            price="$2"
            period="/month"
            description="Perfect for active job seekers looking for an edge."
            features={[
              "Unlimited ATS Score Checks",
              "AI Cover Letter Generator (10/mo)",
              "Basic Career Path Mapping",
              "Community Support"
            ]}
            icon={<Zap className="w-6 h-6 text-blue-400" />}
            buttonText="Get Started"
            tierId="pro"
            isLoading={loadingTier === "pro"}
            onCheckout={handleCheckout}
          />

          {/* Executive Tier (Most Popular) */}
          <PricingCard 
            name="Executive Elite"
            price="$9"
            period="/month"
            description="Our world-class suite for high-impact professionals."
            features={[
              "Everything in Pro",
              "Unlimited AI Cover Letters",
              "Real-time Video Mock Interviews",
              "GitHub Skill Verification Engine",
              "1-on-1 AI Salary Negotiator"
            ]}
            icon={<Star className="w-6 h-6 text-primary" />}
            buttonText="Upgrade to Executive"
            isPopular
            tierId="executive"
            isLoading={loadingTier === "executive"}
            onCheckout={handleCheckout}
          />

          {/* Teams Tier */}
          <PricingCard 
            name="Recruiter Teams"
            price="$13"
            period="/seat/mo"
            description="For companies hunting the top 1% of talent."
            features={[
              "Reverse-Match AI Pipeline",
              "Automated Skill Verification",
              "Custom ATS Integration",
              "Dedicated Account Manager"
            ]}
            icon={<Building2 className="w-6 h-6 text-secondary" />}
            buttonText="Contact Sales"
          />

        </div>
      </div>
    </main>
  );
}

function PricingCard({ name, price, period, description, features, icon, buttonText, isPopular, tierId, isLoading, onCheckout }: any) {
  return (
    <div className={`relative glass-card p-8 flex flex-col ${isPopular ? 'border-primary shadow-[0_0_30px_rgba(59,130,246,0.2)] transform md:-translate-y-4' : 'border-white/10'}`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
          Most Popular
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-xl border border-white/10">{icon}</div>
        <h3 className="text-xl font-bold text-white font-outfit">{name}</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6 h-10">{description}</p>
      
      <div className="mb-8" suppressHydrationWarning>
        <span className="text-4xl font-bold text-white font-outfit" suppressHydrationWarning>{price}</span>
        <span className="text-muted-foreground" suppressHydrationWarning>{period}</span>
      </div>
      
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-secondary shrink-0" />
            <span className="text-sm text-white/80">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={() => tierId && onCheckout(tierId)}
        disabled={isLoading || !tierId}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
          isPopular 
            ? "bg-primary hover:bg-primary/90 disabled:opacity-50 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
            : "bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white border border-white/10"
        }`}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : buttonText}
      </button>
    </div>
  )
}
