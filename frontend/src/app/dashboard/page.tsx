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
  const latestResume = await db.resume.findFirst({
    where: { userId: user?.id },
    orderBy: { createdAt: 'desc' }
  });

  const atsScore = latestResume?.atsScore || "?";
  const hasResume = !!latestResume;

  if (user?.role === "RECRUITER") {
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

          <div className="p-8 glass-card border-white/10 flex flex-col items-center text-center justify-center bg-white/5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Talent Pipeline</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Your saved candidate verifications will appear here in the next update.</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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

        {user?.role === "RECRUITER" && (
          <Link href="/dashboard/recruiter" className="group p-6 glass-card border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-bold text-white mb-1">GitHub Verify</h3>
            <p className="text-xs text-muted-foreground mt-2">Prove your hard skills with repository evidence.</p>
          </Link>
        )}
      </div>

      <div className="glass-card border-primary/30 rounded-xl p-5 mb-10 shadow-sm flex items-start gap-4 bg-primary/10">
        <div className="bg-primary p-2 rounded-lg mt-0.5"><Star className="w-5 h-5 text-white" /></div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Offer: Get 75% Off Pro</h4>
          <p className="text-sm text-blue-200 mb-3">Unlock AI-powered resume writing, unlimited reviews, ATS optimization, and expert tools.</p>
          <Link href="/dashboard/pricing" className="inline-block bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">Upgrade to Pro</Link>
        </div>
      </div>

      <h2 className="text-2xl font-bold font-outfit text-white mb-2">Track your progress</h2>
      <p className="text-muted-foreground mb-8">Follow the steps below to make the most out of your career assets.</p>

      <div className="space-y-4">
        {/* Dynamic Resume Score built from SQLite state */}
        <div className={`glass-card border-l-[6px] ${hasResume ? 'border-l-emerald-500' : 'border-l-yellow-500'} rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-white/20 transition-all gap-6`}>
          <div>
            <h3 className={`text-sm font-bold uppercase ${hasResume ? 'text-emerald-400' : 'text-yellow-400'} tracking-wider mb-2`}>Overall ATS Score</h3>
            <p className="text-muted-foreground font-medium mb-4">
              {hasResume 
                ? "Your baseline resume scored a structured value based on ATS parsing rules."
                : "You haven't uploaded a resume yet to establish your baseline score."}
            </p>
            <Link href="/dashboard/resume" className={`inline-flex items-center gap-2 ${hasResume ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'} border py-2 px-4 rounded-lg text-sm font-bold transition-colors shadow-sm`}>
              <UploadCloud className="w-4 h-4" /> {hasResume ? "Analyze Updated Resume" : "Upload Resume"}
            </Link>
          </div>
          <div className="text-right flex items-baseline gap-1">
            <span className="text-5xl font-black font-outfit text-white">{atsScore}</span>
            <span className="text-muted-foreground font-bold">/100</span>
          </div>
        </div>

        {/* Targeted Resume Score */}
        <div className="glass-card border-l-[6px] border-l-primary rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-white/20 transition-all gap-6">
          <div>
            <h3 className="text-sm font-bold uppercase text-primary tracking-wider mb-2">Targeted Match Score</h3>
            <p className="text-muted-foreground font-medium mb-4 max-w-[500px]">Match your resume natively against a target job description to close exact keyword gaps.</p>
            <Link href="/dashboard/resume" className="inline-flex items-center gap-2 bg-primary/20 text-blue-300 border border-primary/30 py-2 px-4 rounded-lg text-sm font-bold hover:bg-primary/30 transition-colors">
              <Target className="w-4 h-4" /> Target Your Resume
            </Link>
          </div>
          <div className="text-right flex items-baseline gap-1">
            <span className="text-5xl font-black font-outfit text-white/50">?</span>
            <span className="text-muted-foreground font-bold">/100</span>
          </div>
        </div>

        {user?.role === "RECRUITER" && (
          <div className="glass-card border-l-[6px] border-l-rose-500 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-white/20 transition-all gap-6">
            <div>
              <h3 className="text-sm font-bold uppercase text-rose-400 tracking-wider mb-2">Recruiter Confidence Link</h3>
              <p className="text-muted-foreground font-medium mb-4 max-w-[500px]">You have not mapped your GitHub repositories. Recruiters cannot verify your hard skills yet.</p>
              <Link href="/dashboard/recruiter" className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 py-2 px-4 rounded-lg text-sm font-bold hover:bg-rose-500/30 transition-colors">
                <ShieldCheck className="w-4 h-4" /> Link GitHub
              </Link>
            </div>
            <div className="text-right flex items-baseline gap-1">
              <span className="text-5xl font-black font-outfit text-white/50">?</span>
              <span className="text-muted-foreground font-bold">/100</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
