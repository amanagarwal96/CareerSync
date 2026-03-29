"use client"

import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileText, Target, CheckCircle2, ChevronRight, 
  Download, RefreshCcw, LayoutPanelLeft, Lock, AlertCircle, 
  ChevronDown, ChevronUp, Copy, Check, Info, FileSearch, Sparkles,
  ArrowRight, BookText, Crown, Zap, RotateCcw, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import jsPDF from 'jspdf';
import { useSession } from "next-auth/react";
import { saveResumeAnalysis } from "@/app/actions";
import { cn } from '@/lib/utils';

// --- Types ---

interface ScoreBreakdown {
  keyword_match: number;
  formatting: number;
  quantified_achievements: number;
  section_completeness: number;
  action_verbs: number;
}

interface Improvement {
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  issue: string;
  suggestion: string;
  example?: string;
}

interface RewrittenBullet {
  original: string;
  improved: string;
}

interface ResumeSegment {
  text: string;
  label: 'impactful' | 'weak' | 'irrelevant' | 'neutral';
  comment: string;
}

interface AnalysisCheck {
  name: string;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  feedback: string;
}

interface ResumeResults {
  ats_score: number;
  score_breakdown: ScoreBreakdown;
  hiring_probability: number;
  detailed_checks: AnalysisCheck[];
  critical_issues: string[];
  improvements: Improvement[];
  missing_keywords: string[];
  strong_points: string[];
  rewritten_bullets: RewrittenBullet[];
  overall_verdict: string;
  full_resume_text?: string;
  segmented_resume: ResumeSegment[];
}

// --- Logic & Helper Components ---

const ScoreMeter = ({ score }: { score: number }) => {
  const getScoreColor = (s: number) => {
    if (s >= 85) return '#22c55e'; // Green
    if (s >= 70) return '#3b82f6'; // Blue
    if (s >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const color = getScoreColor(score);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            fill="transparent"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-black font-outfit italic tracking-tighter"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">ATS Index</span>
        </div>
      </div>
    </div>
  );
};

const ScoreBreakdownChart = ({ data }: { data: ScoreBreakdown }) => {
  const chartData = [
    { subject: 'Keywords', value: data.keyword_match, fullMark: 25 },
    { subject: 'Formatting', value: data.formatting, fullMark: 20 },
    { subject: 'Impact', value: data.quantified_achievements, fullMark: 20 },
    { subject: 'Sections', value: data.section_completeness, fullMark: 20 },
    { subject: 'Verbs', value: data.action_verbs, fullMark: 15 },
  ];

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.6}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1d25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
            itemStyle={{ color: 'var(--primary)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ImprovementCard = ({ improvement }: { improvement: Improvement }) => {
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

const RewrittenBulletItem = ({ bullet }: { bullet: RewrittenBullet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bullet.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-0 relative">
      {/* Intro Banner */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-primary/5 border border-primary/15 rounded-xl">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-[11px] text-white/60 leading-snug">
          The engine found a <span className="text-rose-400 font-bold">weak bullet</span> in your resume and rewrote it using <span className="text-primary font-bold">FAANG-grade language</span>. Copy the improved version below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        {/* LEFT: Original Weak Bullet */}
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

        {/* RIGHT: Improved Bullet */}
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

const StrategicRoadmap = ({ criticalIssues, improvements }: { criticalIssues: string[], improvements: Improvement[] }) => {
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
        {/* Connection Line */}
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

const DetailedAnalysis = ({ checks = [] }: { checks: AnalysisCheck[] }) => {
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

const ForensicLoader = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const steps = [
    "Initializing Forensic Engine V25...",
    "Deep Document Topology Scan...",
    "Isolating Metadata & Contact Vectors...",
    "Identifying Core Career Sections...",
    "Parsing Technical & Framework Matrix...",
    "Auditing Quantifiable Impact ($, %)...",
    "Extracting Soft-Skill Intelligence...",
    "Mapping Resume vs JD Vector...",
    "Heuristic Accuracy Calculation...",
    "Finalizing Performance Architecture..."
  ];

  useEffect(() => {
    let interval: any;
    let progressInterval: any;
    
    if (active) {
      interval = setInterval(() => {
        setStep((s) => (s < steps.length - 1 ? s + 1 : s));
      }, 800);
      
      progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 99) return 99;
          const increment = Math.random() * 5 + 1;
          return Math.min(99, p + increment);
        });
      }, 400);
      
      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    } else {
      setStep(0);
      setProgress(0);
    }
  }, [active, steps.length]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f1117]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Laser Scan Animation */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
         <div className="w-full h-[2px] bg-primary shadow-[0_0_15px_#6366f1] absolute top-0 left-0 animate-[scan_4s_ease-in-out_infinite]" />
      </div>

      <div className="max-w-md w-full space-y-12 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
             <div className="w-32 h-32 border-[6px] border-primary/10 rounded-full animate-spin border-t-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]" />
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-outfit text-white leading-none">{Math.floor(progress)}%</span>
                <span className="text-[8px] font-black uppercase text-primary tracking-widest mt-1">Syncing</span>
             </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-outfit tracking-tight text-white flex items-center justify-center gap-3">
               <Shield className="w-6 h-6 text-primary" /> Forensic Audit
            </h2>
            <p className="text-xs text-white/40 font-bold uppercase tracking-[0.3em] font-sans">Deployment Status: Active</p>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-8 space-y-5 shadow-2xl">
          {steps.map((text, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: step >= idx ? 1 : 0.1, 
                x: step >= idx ? 0 : -10,
                color: step === idx ? "#6366f1" : (step > idx ? "#22c55e" : "#ffffff")
              }}
              className="flex items-center gap-4"
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                step > idx ? "bg-emerald-500/10 border-emerald-500" : 
                step === idx ? "bg-primary/10 border-primary animate-pulse" : "border-white/5"
              )}>
                {step > idx ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                step === idx ? "translate-x-1" : ""
              )}>
                {text}
              </span>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center pt-4">
           <p className="text-[10px] text-muted-foreground animate-pulse font-medium">Please do not refresh. Engine is communicating with LLM cluster...</p>
        </div>
      </div>
    </div>
  );
};

const AuditMetricSidebar = ({ results }: { results: ResumeResults }) => {
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

const AnnotatedResume = ({ segments = [], fullText }: { segments: ResumeSegment[], fullText?: string }) => {
  if ((!segments || segments.length === 0) && !fullText) return null;

  return (
    <div id="annotated-analysis" className="glass-card border border-white/10 rounded-2xl bg-black/40 p-8 font-mono text-sm leading-relaxed overflow-hidden relative group h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10 shrink-0">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 italic">
          <BookText className="w-4 h-4 text-primary" /> Annotated Visual Analysis
        </h3>
        <div className="flex gap-4">
           {['impactful', 'weak', 'irrelevant'].map(label => (
             <div key={label} className="flex items-center gap-2">
               <div className={cn(
                 "w-2 h-2 rounded-full",
                 label === 'impactful' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" :
                 label === 'weak' ? "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" :
                 "bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"
               )} />
               <span className="text-[9px] font-black uppercase text-white/40">{label}</span>
             </div>
           ))}
        </div>
      </div>
      
      <div className="font-mono text-[13px] leading-[2.2] p-8 bg-black/60 rounded-xl border border-white/5 focus-within:border-primary/30 transition-all min-h-[500px] max-h-[1000px] overflow-y-auto relative z-10 shadow-2xl overflow-x-hidden whitespace-pre-wrap selection:bg-primary/30 flex-grow scrollbar-thin scrollbar-thumb-primary/20">
        {/* Forensic Scanner Beam Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:100%_40px] animate-[scan_8s_linear_infinite]" />
        
        {segments && segments.length > 0 ? (
          <div className="relative z-10">
            {segments.map((segment, i) => (
              <div key={i} className="relative group/tooltip inline mb-1 mr-1">
                <span className={cn(
                   "px-1 py-1 rounded cursor-help transition-all duration-500",
                   segment.label === 'impactful' ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border-b-2 border-emerald-500/40" :
                   segment.label === 'weak' ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border-b-2 border-amber-500/40" :
                   segment.label === 'irrelevant' ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 border-b-2 border-rose-500/40" :
                   "text-white/80 hover:text-white"
                )}>
                  {segment.text}
                </span>
                {segment.comment && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-72 p-5 bg-black/95 border border-white/20 rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 backdrop-blur-3xl scale-95 group-hover/tooltip:scale-100 pointer-events-none ring-1 ring-white/20">
                    <p className="text-[12px] font-bold text-white/90 leading-relaxed font-sans">{segment.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/80 select-text selection:bg-primary/30 relative z-10">
            {fullText}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Analysis View (Dashboard) ---

interface AnalysisViewProps {
  results: ResumeResults;
  onReset: () => void;
  jobDescription: string;
}

const ResumeAnalysisDashboard = ({ results, onReset, jobDescription }: AnalysisViewProps) => {
  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFontSize(22); doc.setTextColor(15, 17, 23); doc.text('ATS Resume Analysis Report', margin, y); y += 10;
    doc.text(`Generated by CareerSync Pro • ${new Date().toLocaleDateString()}`, margin, y); y += 15;
    doc.text(`Overall ATS Score: ${results.ats_score}/100`, margin, y); y += 10;
    doc.save(`CareerSync_ATS_Report_${results.ats_score}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 md:p-10 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded">Analysis Complete</span>
              {jobDescription && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-emerald-500/20">Targeted JD Match</span>
              )}
            </div>
            <h1 className="text-4xl font-black font-outfit tracking-tight">Intelligence Report</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={onReset} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-white/10 transition-all flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" /> Analyze Again
            </button>
            <button onClick={handleDownloadReport} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg border border-primary/50 shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </div>

        {results.critical_issues.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-50 mb-10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center shrink-0 border border-rose-500/20 shadow-inner">
                <AlertCircle className="w-7 h-7 text-rose-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-400">Strategic Audit Red Flags</h3>
                <p className="text-[10px] text-white/40 font-bold italic">Forensic detection of immediate hiring-risk factors.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 relative z-10">
              {results.critical_issues.map((issue, i) => (
                <div key={i} className="bg-black/40 text-rose-100 text-[10px] font-black uppercase tracking-widest py-2.5 px-5 rounded-lg border border-rose-500/30 shadow-lg">{issue}</div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-3">
             <AuditMetricSidebar results={results} />
          </div>
          <div className="lg:col-span-9 space-y-16 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-4">
              <div className="lg:col-span-4 glass-card p-10 rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden group min-h-[450px]">
                <ScoreMeter score={results.ats_score} />
                <p className="text-sm font-bold text-white/90 mt-6 tracking-widest">OVERALL ATS INDEX</p>
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity" />
              </div>
              <div className="lg:col-span-8 glass-card p-10 rounded-2xl border border-white/10 bg-black/40 flex flex-col min-h-[450px]">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2 italic">
                   <Target className="w-4 h-4 text-primary" /> Forensic Dimension Matrix
                 </h3>
                 <div className="h-full min-h-[350px] w-full flex items-center justify-center relative z-10">
                   <ScoreBreakdownChart data={results.score_breakdown} />
                 </div>
              </div>
            </div>

            <div className="relative z-10">
              <AnnotatedResume segments={results.segmented_resume} fullText={results.full_resume_text} />
            </div>
            
            <div className="relative z-10 pt-8 border-t border-white/5">
              <DetailedAnalysis checks={results.detailed_checks || []} />
            </div>
            
            <div className="relative z-10 pt-12 border-t border-white/5">
              <StrategicRoadmap criticalIssues={results.critical_issues} improvements={results.improvements} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-10">
                <section>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2 italic">
                    <ArrowRight className="w-4 h-4 text-primary" /> Suggested Improvements
                  </h3>
                  <div className="space-y-4">
                    {results.improvements.map((imp: Improvement, i: number) => <ImprovementCard key={i} improvement={imp} />)}
                  </div>
                </section>
                <section className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2 italic">
                    <Info className="w-4 h-4 text-amber-400" /> Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.missing_keywords.map((keyword: string, i: number) => (
                      <span key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium">{keyword}</span>
                    ))}
                  </div>
                </section>
              </div>
              <div className="lg:col-span-7 space-y-10">
                <section className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/90 mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Bullet Rewrite Engine
                    </h3>
                    <p className="text-[11px] text-white/40">Paste the improved line directly into your resume to boost ATS signal.</p>
                  </div>
                  <div className="space-y-6">
                    {results.rewritten_bullets.map((bullet: RewrittenBullet, i: number) => <RewrittenBulletItem key={i} bullet={bullet} />)}
                  </div>
                </section>
                <section className="glass-card p-8 rounded-2xl border border-white/10 bg-emerald-500/[0.02]">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2 italic">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strong Points Found
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.strong_points.map((point: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start text-sm text-white/80"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /><span>{point}</span></div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component (State Manager) ---

export default function ResumeHub() {
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ResumeResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription) formData.append('jobDescription', jobDescription);
      const response = await fetch('/api/resume/score', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        // Correctly handle FastAPI's 'detail' or custom 'error'
        const errorMessage = data.detail || data.error || 'Failed to perform forensic analysis';
        throw new Error(errorMessage);
      }
      setResults(data);

      // Save to Database for History
      await saveResumeAnalysis({
        atsScore: data.ats_score,
        content: data.full_resume_text || "",
        gaps: JSON.stringify(data.missing_keywords || []),
        fileName: file.name,
        jdSimilarity: data.jd_match_accuracy,
        jdGaps: JSON.stringify(data.jd_keyword_gaps || [])
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (results) {
    return <ResumeAnalysisDashboard results={results} onReset={() => setResults(null)} jobDescription={jobDescription} />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0f1117]">
      <ForensicLoader active={isAnalyzing} />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row border border-white/10 shadow-2xl relative z-10">
        <div className="w-full md:w-5/12 p-10 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
               <FileSearch className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black font-outfit tracking-tight mb-4 text-white">Forensic Resume Scanner</h1>
            <p className="text-white/60 text-sm leading-relaxed mb-8">Deploy our recruiter-trained AI decision engine to audit your career vectors against FAANG standards.</p>
            <div className="space-y-4">
              {["15+ Years Recruiting Logic", "Action-Oriented Rewrites", "Keyword Gap Detection", "Formatting Sanity Checks"].map((item, i) => (
                <div key={i} className="flex gap-3 items-center text-sm font-medium text-white/90"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> {item}</div>
              ))}
            </div>
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="w-full md:w-7/12 p-10 bg-[#0a0c10]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p>
            </div>
          )}
          
          <div className="space-y-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Target Job Description</label>
               <textarea 
                 value={jobDescription}
                 onChange={(e) => setJobDescription(e.target.value)}
                 placeholder="Paste the target JD here to calibrate the engine..."
                 className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none placeholder:text-white/10"
               />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Source Material</label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); }}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden",
                  file ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-primary/40 hover:bg-white/5",
                  dragActive && "border-primary bg-primary/5"
                )}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input id="file-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                {file ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <Check className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-bold text-white">{file.name}</p>
                    <p className="text-[10px] text-emerald-500/60 font-black uppercase mt-1">PDF Format Secured</p>
                  </div>
                ) : (
                  <div className="text-center group-hover:scale-105 transition-transform duration-500">
                    <UploadCloud className="w-10 h-10 text-white/20 mb-4 mx-auto group-hover:text-primary transition-colors" />
                    <p className="text-sm font-bold text-white/60">Drop resume here or click to browse</p>
                    <p className="text-[10px] text-white/20 font-black uppercase mt-1 tracking-widest">PDF format only (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-white/5 disabled:text-white/10 text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group"
            >
              <Target className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              Score My Resume
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
