import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { FileText, Target, ShieldCheck, CheckCircle2, ChevronRight, UploadCloud, Star } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any;
  const userName = user?.name || "Aman kumar"

  // Fetch true historic states from DB
  const resumes = await db.resume.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const latestResume = resumes[0];
  const atsScore = latestResume?.atsScore || "?";
  const hasResume = !!latestResume;

  if (user?.role === "RECRUITER") {
    // Phase 2.2: Talent Pipeline Fetch
    const candidates = await db.candidate.findMany({
      where: { recruiterId: user?.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto px-4 md:px-12 pt-12 pb-24 max-w-7xl mx-auto w-full">
        <div className="z-10 relative mb-12">
          <h1 className="text-4xl lg:text-5xl font-outfit font-bold text-white mb-2">
            Recruiter Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Welcome back, {userName}. Manage your candidate verifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link href="/dashboard/recruiter" className="group p-8 glass-card border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Recruiter Verification Engine</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Verify candidate GitHub skills and JD matching in one click.</p>
            <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm">
              Launch Engine <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <div className="p-8 glass-card border-white/10 flex flex-col items-center text-center justify-center bg-white/5 overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Talent Pipeline</h3>
            {candidates.length > 0 ? (
              <div className="w-full mt-4 space-y-2">
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 text-left">
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.githubUrl?.split('/').pop()}</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{c.similarity}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground max-w-xs">Your saved candidate verifications will appear here.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto px-4 md:px-12 pt-12 pb-24 max-w-7xl mx-auto w-full">
      
      <div className="z-10 relative mb-12">
        <h1 className="text-4xl lg:text-5xl font-outfit font-bold text-white mb-2">
          Good morning, {userName.split(" ")[0]}.
        </h1>
        <p className="text-muted-foreground text-lg">Welcome back to your career toolkit.</p>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Quick Links</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <Link href="/dashboard/resume" className="group p-6 glass-card border-white/10 hover:border-purple-500/50 transition-all hover:bg-white/5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-bold text-white mb-1">Score My Resume</h3>
          <p className="text-xs text-muted-foreground mt-2">Get expert feedback and ATS extraction instantly.</p>
        </Link>

        <Link href="/dashboard/cover-letter" className="group p-6 glass-card border-white/10 hover:border-emerald-500/50 transition-all hover:bg-white/5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-bold text-white mb-1">Targeted Cover Letter</h3>
          <p className="text-xs text-muted-foreground mt-2">Tailor to a specific job description.</p>
        </Link>

        <Link href="/dashboard/settings" className="group p-6 glass-card border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-bold text-white mb-1">Manage Profile</h3>
          <p className="text-xs text-muted-foreground mt-2">Update preferences and viewing modes.</p>
        </Link>
      </div>

      <div className="glass-card border-primary/30 rounded-xl p-5 mb-10 shadow-sm flex items-start gap-4 bg-primary/10">
        <div className="bg-primary p-2 rounded-lg mt-0.5"><Star className="w-5 h-5 text-white" /></div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Offer: Get 75% Off Pro</h4>
          <p className="text-sm text-blue-200 mb-3">Unlock AI-powered resume writing, unlimited reviews, ATS optimization, and expert tools.</p>
          <Link href="/dashboard/pricing" className="inline-block bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">Upgrade to Pro</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <h2 className="text-2xl font-bold font-outfit text-white mb-2">Track your progress</h2>
          
          <div className={`glass-card border-l-[6px] ${hasResume ? 'border-l-emerald-500' : 'border-l-yellow-500'} rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-white/20 transition-all gap-10 bg-black/20`}>
            <div className="flex-1">
              <h3 className={`text-sm font-bold uppercase ${hasResume ? 'text-emerald-400' : 'text-yellow-400'} tracking-wider mb-4`}>Current ATS Standing</h3>
              <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                {hasResume 
                  ? `Your latest forensic audit of "${latestResume.fileName || 'Untitled'}" scored an official ${latestResume.atsScore}/100.`
                  : "Establishing a baseline is the first step. Upload your current CV to start the forensic sync process."}
              </p>
              <Link href="/dashboard/resume" className={`inline-flex items-center gap-2 ${hasResume ? 'bg-emerald-500 text-white hover:bg-emerald-500/90' : 'bg-yellow-500 text-black hover:bg-yellow-500/90'} py-3 px-6 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg`}>
                <UploadCloud className="w-4 h-4" /> {hasResume ? "New Deep Audit" : "Initialize Engine"}
              </Link>
            </div>
            <div className="text-right flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-6xl font-black font-outfit text-white leading-none">{atsScore}</span>
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2">ATS Index</span>
            </div>
          </div>

          <div className="glass-card border border-white/10 rounded-xl p-8 bg-black/40">
            <h3 className="text-sm font-bold uppercase text-white tracking-widest mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Resume Version History
            </h3>
            {resumes.length > 0 ? (
              <div className="space-y-4">
                {resumes.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                        {resumes.length - i}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{r.fileName || "Scanned Resume"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()} at {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {r.jdSimilarity !== null && (
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black uppercase tracking-tighter text-emerald-400/70">JD Match</p>
                          <p className="text-xs font-bold text-emerald-400">{r.jdSimilarity}%</p>
                        </div>
                      )}
                      <div className="text-right w-12">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Score</p>
                        <p className="text-sm font-black text-white">{r.atsScore}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-sm text-muted-foreground">No analysis history found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card border border-white/10 rounded-xl p-6 bg-gradient-to-br from-primary/10 to-transparent">
             <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Pro Insight</h3>
             <p className="text-sm text-white/80 leading-relaxed mb-4">Candidates with a 90+ score and verified GitHub skills are 4x more likely to secure interviews at tier-1 tech firms.</p>
             <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%]" />
             </div>
          </div>

          <div className="glass-card border border-white/10 rounded-xl p-6 bg-black/40">
             <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Career Metrics</h3>
             <div className="space-y-4">
               {[
                 { label: "Analyses This Week", value: resumes.length },
                 { label: "Profile Completion", value: "85%" },
                 { label: "Market Match", value: hasResume ? "High" : "N/A" }
               ].map((m, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                   <span className="text-xs text-white/40">{m.label}</span>
                   <span className="text-xs font-bold text-white">{m.value}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

    </div>
  )
}
