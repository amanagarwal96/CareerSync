"use client"

import { useState } from "react"
import { Check, Star, Zap, Building2, Loader2, Crown } from "lucide-react";
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function DashboardPricingPage() {
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
    <div className="flex flex-col h-full animate-in fade-in duration-700 overflow-y-auto px-4 md:px-12 pt-12 pb-24 max-w-7xl mx-auto w-full">
      <div className="z-10 relative mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 italic">
          <Crown className="w-3 h-3" /> CareerSync Pro
        </div>
        <h1 className="text-4xl lg:text-5xl font-outfit font-bold text-white mb-2 italic">
          Invest in Your Future.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Unlock the Billion-Dollar AI Suite. Match with high-paying roles, ace the interview, and negotiate like an executive.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-8">
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
            "Detailed Analysis Reports"
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
  );
}

function PricingCard({ name, price, period, description, features, icon, buttonText, isPopular, tierId, isLoading, onCheckout }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative glass-card p-8 flex flex-col transition-all h-full group",
        isPopular ? 'border-primary shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-primary/[0.03]' : 'border-white/10 hover:border-white/20'
      )}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 rounded-full shadow-lg shadow-primary/20 italic">
          Most Popular
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-primary/50 transition-colors">{icon}</div>
        <h3 className="text-xl font-bold text-white font-outfit italic">{name}</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-8 leading-relaxed h-12">{description}</p>
      
      <div className="mb-10">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-white font-outfit italic">{price}</span>
          <span className="text-muted-foreground font-medium text-sm">{period}</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-10 flex-1">
        {features.map((feature: string, i: number) => (
          <div key={i} className="flex items-start gap-4">
            <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Check className="w-2.5 h-2.5 text-emerald-400" />
            </div>
            <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors leading-snug">{feature}</span>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => tierId && onCheckout(tierId)}
        disabled={isLoading || !tierId}
        className={cn(
          "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all relative overflow-hidden italic",
          isPopular 
            ? "bg-primary hover:bg-primary/90 disabled:opacity-50 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
            : "bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white border border-white/10"
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>
            {buttonText}
          </>
        )}
      </button>
    </motion.div>
  )
}
