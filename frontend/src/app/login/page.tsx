"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { Lock, Loader2, Mail } from "lucide-react"
import { useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        throw new Error(res.error)
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 bg-[#0a0a0a]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="glass-card w-full max-w-md p-8 relative z-10 border-white/10">
        
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 border border-white/20 shadow-xl">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-outfit font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm text-center">
            Sign in to continue to your CareerSync Pro dashboard.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center animate-in zoom-in-95">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Create one now</Link>
        </p>

      </div>
    </div>
  )
}
