"use client"
// HMR Force Update: JSX structure verified

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Zap, Loader2, ShieldCheck } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"STUDENT" | "RECRUITER">("STUDENT")
  const [otp, setOtp] = useState("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP")
      }
      setStep(2)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send OTP";
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtpAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) {
      setError("Please enter a valid OTP code.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp, role }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Something went wrong")
      }

      // Automatically redirect to login
      router.push("/login")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 font-outfit text-white">
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
      <div className="glass-card w-full max-w-md p-8 relative z-10 border-white/10">
        
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 border border-white/20 shadow-xl">
            {step === 1 ? <Zap className="w-6 h-6 text-white" /> : <ShieldCheck className="w-6 h-6 text-white" />}
          </div>
          <h1 className="text-2xl font-outfit font-bold text-white mb-2">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            {step === 1 ? "Join the Billion-Dollar AI Suite today." : `We sent an OTP to ${email || 'your email'}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center animate-in zoom-in-95">
            {error}
          </div>
        )}

        {step === 1 && (
          <form key="step1" onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Role Selection Matrix */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center gap-1 ${
                  role === "STUDENT" 
                    ? "bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                    : "bg-black/20 border-white/10 text-muted-foreground hover:border-white/20"
                }`}
              >
                <Zap className={`w-4 h-4 ${role === "STUDENT" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold uppercase tracking-tight">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center gap-1 ${
                  role === "RECRUITER" 
                    ? "bg-secondary/20 border-secondary text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                    : "bg-black/20 border-white/10 text-muted-foreground hover:border-white/20"
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${role === "RECRUITER" ? "text-secondary" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold uppercase tracking-tight">Recruiter</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 mt-4 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form key="step2" onSubmit={handleVerifyOtpAndSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-black/40 border border-primary/50 text-center tracking-[0.5em] text-2xl rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                placeholder="------"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Create Account"}
              </button>

              <div className="flex items-center justify-between px-1">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-white transition-colors"
                >
                  Change Email
                </button>
                <button 
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link href="/login" className="text-secondary hover:underline font-medium">Sign in</Link>
          </p>
        )}

      </div>
    </div>
  )
}
