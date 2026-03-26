import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Spacer to avoid navbar overlap */}
      <div className="h-24"></div>
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <h1 className="text-6xl font-outfit font-black mb-6 relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white animate-text-glow">Platform Features</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto relative">
            Discover the complete suite of AI-powered tools designed to 10x your career trajectory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "ATS Intelligence Hub", desc: "Deep-learning engine analyzes your resume against job descriptions.", color: "from-blue-500/20" },
            { title: "Personal Strategist", desc: "Dynamic cover letter generation mapped to target roles.", color: "from-emerald-500/20" },
            { title: "Interview Mastery", desc: "Real-time AI voice simulation with biometric feedback.", color: "from-purple-500/20" },
            { title: "GitHub Recruiter Engine", desc: "True confidence verification mapping resume skills to repositories.", color: "from-orange-500/20" },
            { title: "Career Path Mapping", desc: "Predictive node-based graphing of your next logical career steps.", color: "from-pink-500/20" },
            { title: "Mock Negotiation", desc: "Roleplay salary negotiations with an advanced AI HR bot.", color: "from-cyan-500/20" },
          ].map((feature, i) => (
            <div key={i} className={`glass-card p-8 border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <h3 className="text-2xl font-bold mb-3 relative z-10">{feature.title}</h3>
              <p className="text-muted-foreground relative z-10">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Create an Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
