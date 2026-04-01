"use client"

import { motion } from 'framer-motion';
import { Zap, Target, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisCheck {
  name: string;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  feedback: string;
}

interface ResumeResults {
  ats_score: number;
  hiring_probability: number;
  detailed_checks: AnalysisCheck[];
}

export const AuditMetricSidebar = ({ results }: { results: ResumeResults }) => {
  const labels = ["Readability", "Dates", "Growth signals", "Job fit", "Weak verbs", "Buzzwords", "Contact Info", "Repetition"];
  const checks = results.detailed_checks || [];
  
  return (
    <div className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col gap-8 h-fit">
      {/* Pro Hiring Signal Gauge */}
      <div>
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic flex items-center gap-2">
             <Zap className="w-3 h-3 text-primary animate-pulse" /> Hiring Signal
           </h3>
           <span className="text-[10px] font-mono font-black text-white/40 tracking-tighter">EST. PROBABILITY</span>
        </div>
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${results.hiring_probability}%` }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             className={cn(
               "h-full rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]",
               results.hiring_probability >= 80 ? "bg-emerald-500 shadow-emerald-500/50" :
               results.hiring_probability >= 60 ? "bg-primary shadow-primary/50" :
               "bg-amber-500 shadow-amber-500/50"
             )}
           />
        </div>
        <div className="flex justify-between mt-2">
           <span className="text-[18px] font-black font-outfit text-white tracking-tighter italic">{results.hiring_probability}%</span>
           <span className="text-[9px] font-bold text-muted-foreground uppercase pt-1 tracking-widest">
             {results.hiring_probability >= 80 ? "Elite Target" : results.hiring_probability >= 60 ? "Strong Candidate" : "High Risk"}
           </span>
        </div>
      </div>

      <div className="space-y-5 flex-grow">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2 italic">
          <Target className="w-3.5 h-3.5 text-primary" /> Signal Breakdown
        </h3>
        {labels.map((label, i) => {
          const check = checks.find(c => c.name.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(c.name.toLowerCase()));
          const score = check ? check.score : 0;
          return (
            <div key={i} className="group/stat">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-white/50 group-hover:text-white transition-colors uppercase tracking-widest">{label}</span>
                <span className="text-[9px] font-black font-mono text-white/90">{score}/10</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${score * 10}%` }}
                   transition={{ duration: 1, delay: i * 0.1 }}
                   className={cn(
                     "h-full rounded-full transition-all duration-1000",
                     score >= 8 ? "bg-emerald-500/60" : score >= 5 ? "bg-amber-500/60" : score === 0 ? "bg-white/10" : "bg-rose-500/60"
                   )}
                 />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-6 border-t border-white/5">
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3 group/pro cursor-help">
           <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover/pro:scale-110 transition-transform">
             <Crown className="w-5 h-5 text-primary" />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-primary">Pro Status</p>
             <p className="text-[9px] text-muted-foreground font-bold">Forensic Sync Active</p>
           </div>
        </div>
      </div>
    </div>
  );
};
