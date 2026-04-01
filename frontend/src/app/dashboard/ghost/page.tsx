"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, 
  Mail, 
  Target, 
  Globe, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react"
import { fetchAndEmailJobs } from "@/app/actions"
import { cn } from "@/lib/utils"

export default function MinimalistGhostHub() {
  const [formData, setFormData] = useState({
    jobRole: "",
    targetEmail: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.jobRole || !formData.targetEmail) {
      setStatus({ type: 'error', message: "Target Job Role and Email are required." })
      return
    }

    setIsLoading(true)
    setStatus({ type: null, message: "" })

    try {
      const res = await fetchAndEmailJobs(formData)
      if (res.status === "success") {
        setStatus({ type: 'success', message: res.message || "Mission Complete. Check your inbox!" })
        setFormData({ jobRole: "", targetEmail: "" })
      } else {
        setStatus({ type: 'error', message: res.message || "Mission Failed. Please try again." })
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || "A forensic error occurred." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-20 px-6 max-w-4xl mx-auto w-full relative">
      {/* Premium Background Blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Minimalist Protocol v4.0</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-outfit font-black text-white tracking-tight mb-6 italic">
            Ghost <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Mode</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Enter your target role and profiles. Our agent will scrape the internet and deliver elite matches directly to your inbox.
          </p>
        </div>

        <div className="glass-card p-10 md:p-12 rounded-[3.5rem] border-white/10 bg-black/40 shadow-3xl relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            {/* Primary Vector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 italic">
                  <Target className="w-3.5 h-3.5 text-primary" /> Target Job Role
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.jobRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobRole: e.target.value }))}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-[#080808] border border-white/5 rounded-2xl px-6 py-5 text-sm text-white focus:border-primary/40 focus:bg-white/[0.02] transition-all outline-none placeholder:text-white/10 font-bold italic"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 italic">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Delivery Inbox
                </label>
                <input 
                  required
                  type="email" 
                  value={formData.targetEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetEmail: e.target.value }))}
                  placeholder="your-email@gmail.com"
                  className="w-full bg-[#080808] border border-white/5 rounded-2xl px-6 py-5 text-sm text-white focus:border-primary/40 focus:bg-white/[0.02] transition-all outline-none placeholder:text-white/10 font-bold italic"
                />
              </div>
            </div>

            <AnimatePresence>
              {status.type && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "p-6 rounded-2xl flex items-center gap-4 border",
                    status.type === 'success' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                  )}
                >
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                    {status.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-[1.8rem] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_50px_rgba(59,130,246,0.3)] border border-white/20 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center justify-center gap-4 italic font-black">
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Traversing Job Matrix...</>
                ) : (
                  <>Find & Email Job Opportunities <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* --- GHOST FUSION: RESULTS GRID --- */}
        <AnimatePresence>
          {status.type === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-20 space-y-10"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-outfit font-black text-white italic tracking-tight">
                  Discovered <span className="text-primary italic">Opportunities</span>
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Persistence Layer Active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group/card">
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-widest">
                        High Priority Match
                      </div>
                      <span className="text-[10px] font-bold text-white/20">Recently Discovered</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover/card:text-primary transition-colors italic">
                      {i === 1 ? "Senior Frontend Engineer" : i === 2 ? "Full Stack AI Dev" : i === 3 ? "Next.js Specialist" : "React Architect"}
                    </h3>
                    <p className="text-sm text-white/40 mb-8 font-medium">Top Tier organization seeking expert technical vectors.</p>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => window.location.href = '/dashboard/interview'}
                        className="flex-1 py-4 bg-white/5 hover:bg-primary hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        🎙️ Instant AI Interview
                      </button>
                      <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                        <Globe className="w-4 h-4 text-white/40" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-center text-[10px] font-bold text-white/10 uppercase tracking-[0.5em] pb-20">
                Check your email for the full exhaustive fleet of matches.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
          Powered by JobSpy Scraping Engine & CareerSync SMTP-Relay
        </p>
      </motion.div>
    </div>
  )
}
