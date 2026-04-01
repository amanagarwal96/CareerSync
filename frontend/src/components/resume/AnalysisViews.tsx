"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, AlertCircle, Copy, Check, 
  CheckCircle2, Sparkles, RotateCcw, LayoutPanelLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- ImprovementCard ---
interface Improvement {
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  issue: string;
  suggestion: string;
  example?: string;
}

export const ImprovementCard = ({ improvement }: { improvement: Improvement }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-card mb-4 overflow-hidden border border-white/10 rounded-xl bg-white/[0.02] shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-2 h-2 rounded-full",
            improvement.priority === 'High' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" :
            improvement.priority === 'Medium' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
            "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
          )} />
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{improvement.category}</span>
            <p className="text-sm font-bold text-white/90 leading-tight mt-0.5">{improvement.issue}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-white/5 bg-black/20"
          >
            <div className="pt-4 space-y-4">
               <div>
                 <p className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">Recommended Fix</p>
                 <p className="text-xs text-white/70 leading-relaxed font-medium">{improvement.suggestion}</p>
               </div>
               {improvement.example && (
                 <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                   <p className="text-[9px] font-black uppercase text-emerald-400 mb-2 tracking-widest italic">Forensic Example</p>
                   <p className="text-xs font-mono text-emerald-300/80 leading-relaxed italic">{improvement.example}</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- RewrittenBulletItem ---
interface RewrittenBullet {
  original: string;
  improved: string;
}

export const RewrittenBulletItem = ({ bullet }: { bullet: RewrittenBullet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bullet.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-0 relative">
      <div className="flex items-center gap-3 mb-5 p-3 bg-primary/5 border border-primary/15 rounded-xl">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-[11px] text-white/60 leading-snug">
          The engine found a <span className="text-rose-400 font-bold">weak bullet</span> in your resume and rewrote it using <span className="text-primary font-bold">FAANG-grade language</span>. Copy the improved version below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="p-6 bg-rose-500/5 border-r border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-rose-400">1</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Weak Line Detected</span>
          </div>
          <div className="flex-1 p-4 bg-black/30 rounded-xl border border-rose-500/10">
            <p className="text-xs text-white/40 leading-relaxed italic line-through decoration-rose-500/50">{bullet.original}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-rose-400/70 font-bold uppercase tracking-widest">
            <AlertCircle className="w-3 h-3" /> Passive · No Metrics · Generic
          </div>
        </div>

        <div className="p-6 bg-emerald-500/5 flex flex-col gap-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-emerald-400">2</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Elite Rewrite</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
          <div className="flex-1 p-4 bg-black/30 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-white/90 leading-relaxed font-semibold">{bullet.improved}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" /> STAR Method · Quantified · Action-Led
          </div>
        </div>
      </div>
    </div>
  );
};

// --- StrategicRoadmap ---
export const StrategicRoadmap = ({ criticalIssues, improvements }: { criticalIssues: string[], improvements: Improvement[] }) => {
  const roadmapSteps = [
    { id: 1, title: 'CRITICAL FIXES', icon: '🔥', count: criticalIssues.length, items: criticalIssues.slice(0, 2) },
    { id: 2, title: 'IMPACT INJECTION', icon: '💎', count: improvements.filter(i => i.category === 'Impact').length, items: improvements.filter(i => i.category === 'Impact').slice(0, 1).map(i => i.issue) },
    { id: 3, title: 'VERB POLISHING', icon: '✍️', count: improvements.filter(i => i.category === 'Verbs').length, items: ['Replace Passive Project Syntax'] }
  ];

  return (
    <div id="strategic-roadmap" className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40 overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-3">
           <RotateCcw className="w-4 h-4 text-primary animate-reverse-spin" /> Strategic Growth Roadmap
         </h3>
         <div className="px-3 py-1 bg-primary/20 rounded-full border border-primary/30 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">Action Plan Active</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-[28%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
        
        {roadmapSteps.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center text-center group min-h-[160px]">
            <div className="w-14 h-14 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:border-primary/40 transition-all shadow-xl group-hover:shadow-primary/10">
              {step.icon}
            </div>
            <h4 className="text-[10px] font-black tracking-[0.2em] text-white/60 mb-3 uppercase italic group-hover:text-primary transition-colors">{step.id}. {step.title}</h4>
            <div className="space-y-1.5 w-full">
               {step.items.map((item, idx) => (
                 <p key={idx} className="text-[11px] font-bold text-white/80 leading-snug line-clamp-2 px-4 transition-all group-hover:text-white">
                   <span className="text-emerald-500 mr-2">✔</span> {item}
                 </p>
               ))}
               {!step.items.length && <p className="text-[10px] text-white/20 italic">No actions needed in this vector.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DetailedAnalysis ---
interface AnalysisCheck {
  name: string;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  feedback: string;
}

export const DetailedAnalysis = ({ checks = [] }: { checks: AnalysisCheck[] }) => {
  const standardChecks = [
    { name: "Readability", icon: "📖" },
    { name: "Dates", icon: "🗓️" },
    { name: "Growth signals", icon: "📈" },
    { name: "Job fit", icon: "🎯" },
    { name: "Weak verbs", icon: "✍️" },
    { name: "Buzzwords", icon: "🐝" },
    { name: "Contact Info", icon: "👤" },
    { name: "Repetition", icon: "🔁" }
  ];

  const fullChecks = standardChecks.map(sc => {
    const existing = checks.find(c => c.name.toLowerCase().includes(sc.name.toLowerCase()) || sc.name.toLowerCase().includes(c.name.toLowerCase()));
    return existing || { 
      name: sc.name, 
      score: 0, 
      status: 'fail' as const, 
      feedback: `Analysis for ${sc.name} pending. Syncing with AI forensic matrix...` 
    };
  });

  return (
    <div id="forensic-matrix" className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 italic">
           <LayoutPanelLeft className="w-4 h-4 text-primary" /> Forensic Precision Matrix
         </h3>
         <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-mono italic">Sync Status: Optimal</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {fullChecks.map((check, i) => (
          <div key={i} className="p-5 bg-white/[0.03] border border-white/5 rounded-xl hover:border-white/20 hover:bg-white/[0.05] transition-all group/card">
            <div className="flex items-start justify-between mb-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover/card:text-primary transition-colors">{check.name}</span>
               <div className={cn(
                 "w-1.5 h-1.5 rounded-full",
                 check.score >= 8 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                 check.score >= 5 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                 "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
               )} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black font-outfit italic tracking-tighter text-white/90">{check.score}<span className="text-[10px] text-white/20 font-mono italic ml-1">/10</span></span>
              <div className="p-1 px-2 bg-black/40 rounded text-[8px] font-black uppercase tracking-tighter text-white/40">Status: {check.status}</div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-4 line-clamp-3 group-hover/card:line-clamp-none transition-all cursor-help italic">
              {check.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
