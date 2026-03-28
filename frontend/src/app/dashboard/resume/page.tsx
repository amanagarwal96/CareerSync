"use client"

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, FileText, Target, CheckCircle2, ChevronRight, 
  Download, RefreshCcw, LayoutPanelLeft, Lock, AlertCircle, 
  ChevronDown, ChevronUp, Copy, Check, Info, FileSearch, Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
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

interface AnalysisResults {
  ats_score: number;
  score_breakdown: ScoreBreakdown;
  detailed_checks: AnalysisCheck[];
  critical_issues: string[];
  improvements: Improvement[];
  missing_keywords: string[];
  strong_points: string[];
  rewritten_bullets: RewrittenBullet[];
  overall_verdict: string;
  segmented_resume: ResumeSegment[];
}

// --- Components ---

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
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            fill="transparent"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-black font-outfit text-white tracking-tighter"
          >
            {score}
          </motion.span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-[-8px]">ATS Score</span>
        </div>
      </div>
    </div>
  );
};

const ScoreBreakdownChart = ({ data }: { data: ScoreBreakdown }) => {
  const chartData = [
    { name: 'Keywords', value: data.keyword_match, max: 25 },
    { name: 'Formatting', value: data.formatting, max: 20 },
    { name: 'Achievements', value: data.quantified_achievements, max: 20 },
    { name: 'Sections', value: data.section_completeness, max: 20 },
    { name: 'Verbs', value: data.action_verbs, max: 15 },
  ];

  return (
    <div className="w-full space-y-4">
      {chartData.map((item) => (
        <div key={item.name} className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="text-white">{item.value} / {item.max}</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / item.max) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                item.value / item.max >= 0.8 ? "bg-emerald-500" : 
                item.value / item.max >= 0.6 ? "bg-amber-500" : "bg-red-500"
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ImprovementCard = ({ improvement }: { improvement: Improvement }) => {
  const [isOpen, setIsOpen] = useState(false);

  const priorityColors = {
    High: "bg-red-500/20 text-red-400 border-red-500/30",
    Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className={cn(
      "glass-card border border-white/10 rounded-xl overflow-hidden transition-all duration-300",
      isOpen ? "bg-white/[0.04] border-white/20" : "hover:bg-white/[0.02]"
    )}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
            priorityColors[improvement.priority]
          )}>
            {improvement.priority}
          </span>
          <div>
            <h4 className="text-sm font-bold text-white mb-0.5">{improvement.category}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{improvement.issue}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-white/5 mt-2">
              <div className="mt-4">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Actionable Fix
                </p>
                <p className="text-sm text-white/80 leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
                  {improvement.suggestion}
                </p>
              </div>
              
              {improvement.example && (
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 italic">Context / Example</p>
                   <p className="text-xs text-muted-foreground italic leading-relaxed">
                     {improvement.example}
                   </p>
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
    <div className="glass-card border border-white/10 rounded-xl overflow-hidden bg-black/20">
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5">
        <div className="flex-1 p-5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Original Detected</span>
          <p className="text-sm text-white/50 line-through italic leading-relaxed">{bullet.original}</p>
        </div>
        <div className="flex-1 p-5 bg-emerald-500/[0.03]">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Improved
            </span>
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-muted-foreground hover:text-white"
              title="Copy Improved Bullet"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{bullet.improved}</p>
        </div>
      </div>
    </div>
  );
};
const DetailedAnalysis = ({ checks }: { checks: AnalysisCheck[] }) => {
  return (
    <div className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40 h-full backdrop-blur-xl relative overflow-hidden group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 italic">
          <FileSearch className="w-4 h-4 text-primary" /> Precision Checks
        </h3>
        <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded-full text-muted-foreground uppercase tracking-tighter">
          Industry Standard
        </span>
      </div>
      
      <div className="space-y-6 relative z-10">
        {checks.map((check, idx) => (
          <div key={idx} className="group/check relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-shadow duration-500",
                  check.status === 'pass' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                  check.status === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" :
                  "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                )} />
                <span className="text-xs font-semibold text-white/80 group-hover/check:text-white transition-colors">
                  {check.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${check.score * 10}%` }}
                    className={cn(
                      "h-full",
                      check.status === 'pass' ? "bg-emerald-500" :
                      check.status === 'warning' ? "bg-amber-500" :
                      "bg-rose-500"
                    )}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-mono font-bold w-6 text-right",
                  check.status === 'pass' ? "text-emerald-400" :
                  check.status === 'warning' ? "text-amber-400" :
                  "text-rose-400"
                )}>
                  {check.score}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground ml-4.5 group-hover/check:text-white/60 transition-colors italic leading-relaxed">
              {check.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnnotatedResume = ({ segments = [] }: { segments: ResumeSegment[] }) => {
  if (!segments || segments.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40 h-full flex flex-col items-center justify-center text-muted-foreground italic text-xs min-h-[400px]">
        <FileText className="w-8 h-8 mb-4 opacity-20" />
        Visual analysis data not available for this scan.
      </div>
    );
  }

  const getLabelStyles = (label: ResumeSegment['label']) => {
    switch (label) {
      case 'impactful': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'weak': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'irrelevant': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="glass-card border border-white/10 rounded-2xl bg-black/40 p-8 font-mono text-sm leading-relaxed overflow-hidden relative">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 italic">
          <FileText className="w-4 h-4 text-primary" /> Annotated Visual Analysis
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400" /> Impactful
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> Weak
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-400" /> Irrelevant
          </div>
        </div>
      </div>

      <div className="space-y-1 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
        {segments.map((segment, i) => (
          <TooltipProvider key={i}>
            <TooltipUI>
              <TooltipTrigger asChild>
                <span 
                  className={cn(
                    "inline-block px-1 rounded transition-colors cursor-help mb-1 mr-1 border",
                    getLabelStyles(segment.label)
                  )}
                >
                  {segment.text}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border border-white/10 text-white p-3 rounded-lg shadow-xl backdrop-blur-md max-w-xs">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">AI Feedback</p>
                 <p className="text-xs leading-relaxed">{segment.comment}</p>
              </TooltipContent>
            </TooltipUI>
          </TooltipProvider>
        ))}
      </div>
      
      {/* Legend Overlay */}
      <div className="mt-8 pt-4 border-t border-white/5 flex gap-6 text-[10px] text-muted-foreground italic">
        <p>* Hover over highlighted segments for AI feedback.</p>
        <p>* 'Irrelevant' sections typically decrease ATS readability or focus.</p>
      </div>
    </div>
  );
};

// Tooltip primitives (simplified for this component)
const TooltipProvider = ({ children }: { children: React.ReactNode }) => children;
const TooltipUI = ({ children }: { children: React.ReactNode }) => <div className="relative group/tooltip inline-block">{children}</div>;
const TooltipTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
  return <div className="inline">{children}</div>;
};
const TooltipContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={cn(
      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50",
      className
    )}>
      {children}
    </div>
  );
};

// --- Main Page Component ---

export default function ResumeHub() {
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const loadingMessages = [
    "Parsing resume PDF...",
    "Extracting technical core...",
    "Analyzing ATS compatibility...",
    "Evaluating against industry standards...",
    "Generating AI-powered rewrites..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const response = await fetch('/api/resume-score', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!results) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 17, 23);
    doc.text('ATS Resume Analysis Report', margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by CareerSync Pro • ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    // ATS Score
    doc.setFontSize(14);
    doc.setTextColor(15, 17, 23);
    doc.text(`Overall ATS Score: ${results.ats_score}/100`, margin, y);
    y += 10;

    // Breakdown
    doc.setFontSize(12);
    doc.text('Score Breakdown:', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(`- Keyword Match: ${results.score_breakdown.keyword_match}/25`, margin + 5, y); y += 5;
    doc.text(`- Formatting: ${results.score_breakdown.formatting}/20`, margin + 5, y); y += 5;
    doc.text(`- Quantified Achievements: ${results.score_breakdown.quantified_achievements}/20`, margin + 5, y); y += 5;
    doc.text(`- Section Completeness: ${results.score_breakdown.section_completeness}/20`, margin + 5, y); y += 5;
    doc.text(`- Action Verbs: ${results.score_breakdown.action_verbs}/15`, margin + 5, y); y += 10;

    // Critical Issues
    doc.setFontSize(12);
    doc.text('Critical Issues:', margin, y);
    y += 7;
    doc.setFontSize(10);
    results.critical_issues.forEach(issue => {
      doc.text(`• ${issue}`, margin + 5, y);
      y += 5;
    });
    y += 5;

    // Improvements
    doc.setFontSize(12);
    doc.text('Key Improvements:', margin, y);
    y += 7;
    doc.setFontSize(10);
    results.improvements.slice(0, 5).forEach(imp => {
      doc.text(`[${imp.priority}] ${imp.category}: ${imp.issue}`, margin + 5, y);
      y += 5;
      doc.setFontSize(9);
      doc.text(`Fix: ${imp.suggestion}`, margin + 10, y);
      y += 7;
      doc.setFontSize(10);
    });

    doc.save(`CareerSync_ATS_Report_${results.ats_score}.pdf`);
  };

  if (!results && !isAnalyzing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0f1117]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 shadow-2xl"
        >
          {/* Left Hero */}
          <div className="w-full md:w-5/12 bg-black/40 p-10 flex flex-col justify-center relative overflow-hidden border-r border-white/5">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                <FileSearch className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-outfit font-bold mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">ATS Resume Hub</h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Upload your resume for a professional-grade ATS analysis. Get real scores, keyword gap reports, and AI-powered sentence optimizations.
              </p>
              <div className="space-y-4">
                {[
                  "15+ Years Recruiting Logic",
                  "Action-Oriented Rewrites",
                  "Keyword Gap Detection",
                  "Formatting Sanity Checks"
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center text-sm font-medium text-white/90">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Ambient Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          </div>

          {/* Right Form */}
          <div className="w-full md:w-7/12 p-10 flex flex-col justify-center">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <div className="mb-6">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 italic">
                Target Job Description <span className="text-white/20">(Optional)</span>
              </label>
              <div className="relative group">
                <textarea 
                  className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none text-sm transition-all group-hover:bg-white/[0.05]"
                  placeholder="Paste the job requirements here for targeted keyword matching..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-muted-foreground border border-white/10">
                    Targeted Mode
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 p-1 group">
               <div className="relative h-44 border-2 border-dashed border-white/10 hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                    file ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  )}>
                    {file ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                  </div>
                  {file ? (
                    <div className="text-center">
                      <p className="text-white font-bold text-sm mb-1">{file.name}</p>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Ready to go</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">Upload Resume PDF</p>
                      <p className="text-muted-foreground text-xs mt-1">Drag & Drop or Click to Browse</p>
                    </div>
                  )}
                </div>
                {/* Progress-like decorative line */}
                <div className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-300" style={{ width: file ? '100%' : '0%' }} />
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className={cn(
                "w-full py-4 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]",
                !file || isAnalyzing 
                  ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" 
                  : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 border border-primary/50"
              )}
            >
              {isAnalyzing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              {isAnalyzing ? "Executing AI Analysis..." : "Score My Resume"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0f1117]">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="relative inline-block">
             <div className="w-24 h-24 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Target className="w-10 h-10 text-primary animate-pulse" />
             </div>
          </div>
          
          <div className="space-y-3">
             <h2 className="text-2xl font-bold text-white font-outfit">Analyzing Your Profile</h2>
             <motion.p 
               key={loadingStep}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-muted-foreground text-sm font-medium italic"
             >
               {loadingMessages[loadingStep]}
             </motion.p>
          </div>

          <div className="flex justify-center gap-2">
            {loadingMessages.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i <= loadingStep ? "w-8 bg-primary" : "w-4 bg-white/10"
                )} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 md:p-10 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded">Analysis Complete</span>
              {jobDescription && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-emerald-500/20">
                  Targeted JD Match
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black font-outfit tracking-tight">Intelligence Report</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setResults(null)}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg border border-white/10 transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Analyze Again
            </button>
            <button 
              onClick={handleDownloadReport}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg border border-primary/50 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </div>

        {/* Top Grid: Score & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Score Card */}
          <div className="lg:col-span-4 glass-card p-10 rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden group">
            <ScoreMeter score={results!.ats_score} />
            <div className="mt-8 text-center space-y-2">
              <p className="text-sm font-bold text-white/90">Overall ATS Score</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {results!.ats_score >= 85 ? "Exceptional! Your resume is highly likely to pass through almost any ATS." : 
                 results!.ats_score >= 70 ? "Good foundation. A few strategic tweaks could push you into the top 1%." :
                 "Significant gaps detected. Follow the improvements below to avoid being filtered out."}
              </p>
            </div>
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity" />
          </div>

          {/* Score Breakdown & Verdict */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2 italic">
                <Target className="w-4 h-4 text-primary" /> Dimension Breakdown
              </h3>
              <ScoreBreakdownChart data={results!.score_breakdown} />
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/[0.08] to-emerald-500/[0.08]">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2 italic">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Executive Verdict
              </h3>
              <p className="text-lg font-medium text-white/90 leading-relaxed italic">
                "{results!.overall_verdict}"
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {results!.strong_points.slice(0, 3).map((point, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold py-1 px-3 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Analysis & Precision Checks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8">
            <AnnotatedResume segments={results!.segmented_resume} />
          </div>
          <div className="lg:col-span-4">
            <DetailedAnalysis checks={results!.detailed_checks || []} />
          </div>
        </div>

        {/* Critical Issues - Urgent Banner */}
        {results!.critical_issues.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-red-500/10 border-l-4 border-red-500 rounded-r-2xl flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Critical Issues Detected</h3>
                <p className="text-xs text-white/60">Top {results!.critical_issues.length} most urgent fixes required for ATS parsing reliability.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {results!.critical_issues.map((issue, i) => (
                <span key={i} className="bg-black/40 text-white/90 text-xs py-2 px-4 rounded-lg border border-red-500/20 font-medium">
                  {issue}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Improvements & Missing Keywords */}
          <div className="lg:col-span-5 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 italic">
                  <ArrowRight className="w-4 h-4 text-primary" /> Suggested Improvements
                </h3>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{results!.improvements.length} Total</span>
              </div>
              <div className="space-y-4">
                {results!.improvements.map((imp, i) => (
                  <ImprovementCard key={i} improvement={imp} />
                ))}
              </div>
            </section>

            <section className="glass-card p-8 rounded-2xl border border-white/10 bg-black/40">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2 italic">
                <Info className="w-4 h-4 text-amber-400" /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {results!.missing_keywords.map((keyword, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigator.clipboard.writeText(keyword);
                      // Could add a toast here
                    }}
                    className="group bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/40 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                  >
                    {keyword} <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-6 italic">Click any keyword to copy. High-weight keywords found missing from your profile.</p>
            </section>
          </div>

          {/* Right Column: AI Rewrites & Strong Points */}
          <div className="lg:col-span-7 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 italic">
                  <Sparkles className="w-4 h-4 text-primary" /> AI-Enhanced Pitching
                </h3>
                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Real-Time Refinement</span>
              </div>
              <div className="space-y-6">
                {results!.rewritten_bullets.map((bullet, i) => (
                  <RewrittenBulletItem key={i} bullet={bullet} />
                ))}
              </div>
              <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-4">
                 <div className="p-2 bg-primary/20 rounded-lg text-primary"><Lock className="w-5 h-5" /></div>
                 <div>
                   <h4 className="text-sm font-bold text-white mb-1">Unlock Real-Time Resume Editor</h4>
                   <p className="text-xs text-muted-foreground leading-relaxed">Modify your resume text directly and see your ATS score update live. A CareerSync Pro exclusive feature.</p>
                   <Link href="/dashboard/pricing" className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-primary hover:underline flex items-center gap-1 group/pro">Upgrade to Pro <ArrowRight className="inline w-3 h-3 group-hover/pro:translate-x-1 transition-transform" /></Link>
                 </div>
              </div>
            </section>

            <section className="glass-card p-8 rounded-2xl border border-white/10 bg-emerald-500/[0.02]">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2 italic">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strong Points Found
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results!.strong_points.map((point, i) => (
                  <div key={i} className="flex gap-3 items-start text-sm text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>

        {/* Global Action Footer */}
        <div className="pt-10 flex justify-center">
           <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
             className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-colors"
           >
             Back to Top
           </button>
        </div>
      </div>
    </div>
  );
}
