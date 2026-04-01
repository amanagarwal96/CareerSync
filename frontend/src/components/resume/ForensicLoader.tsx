"use client"

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ForensicLoader = ({ active }: { active: boolean }) => {
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
    "Projecting 3D Skill Constellation...",
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
