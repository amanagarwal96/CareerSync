import Link from 'next/link'
import { ArrowRight, Bot, Target, FileCheck, Zap } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-24 pb-12 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <section className="relative z-10 container mx-auto px-4 max-w-5xl text-center pt-20 flex flex-col items-center gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium text-primary border-primary/20">
          <Zap className="w-4 h-4" />
          <span>CareerSync Pro 2.0 is now live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-outfit font-bold tracking-tight text-white leading-tight">
          The Billion-Dollar <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-secondary animate-pulse-slow">
            AI Career Suite
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Outperform the competition with our ATS Intelligence Hub, tailored Cover Letter Engine, and real-time AI Mock Interviews. Land your dream job faster.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mt-6">
          <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2">
            Enter Mission Control <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/features" className="w-full sm:w-auto px-8 py-4 glass-panel text-white rounded-full font-medium hover:bg-white/10 transition-colors flex items-center justify-center">
            Explore Features
          </Link>
        </div>
      </section>

      <section className="relative z-10 container mx-auto px-4 mt-32 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<FileCheck className="w-8 h-8 text-primary" />}
            title="ATS Intelligence Hub"
            description="Deep-learning engine analyzes your resume against job descriptions to provide keyword gap analysis and AI-suggested rewrites."
          />
          <FeatureCard 
            icon={<Target className="w-8 h-8 text-secondary" />}
            title="Personal Strategist"
            description="Dynamic cover letter generation and predictive career path mapping to guide your next big leap."
          />
          <FeatureCard 
            icon={<Bot className="w-8 h-8 text-blue-400" />}
            title="Interview Mastery"
            description="Real-time voice and video mock interviews with GPT-4o context and immediate feedback on tone and technical accuracy."
          />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 flex flex-col gap-4 group hover:-translate-y-2 transition-transform duration-300">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-outfit text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
