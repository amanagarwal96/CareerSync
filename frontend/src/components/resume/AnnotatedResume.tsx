"use client"

import { BookText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeSegment {
  text: string;
  label: 'impactful' | 'weak' | 'irrelevant' | 'neutral';
  comment: string;
}

export const AnnotatedResume = ({ segments = [], fullText }: { segments: ResumeSegment[], fullText?: string }) => {
  if ((!segments || segments.length === 0) && !fullText) return null;

  return (
    <div id="annotated-analysis" className="glass-card border border-white/10 rounded-2xl bg-black/40 p-8 font-mono text-sm leading-relaxed overflow-hidden relative group flex flex-col h-fit">
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
      
      <div className="font-mono text-[13px] leading-[2.2] p-8 bg-black/60 rounded-xl border border-white/5 focus-within:border-primary/30 transition-all min-h-[300px] max-h-[600px] overflow-y-auto relative z-10 shadow-2xl overflow-x-hidden whitespace-pre-wrap selection:bg-primary/30 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40">
        {/* Forensic Scanner Beam Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:100%_40px] animate-[scan_8s_linear_infinite]" />
        
        {segments && segments.length > 0 ? (
          <div className="relative z-10">
            {segments.map((segment, i) => (
              <div key={i} className="relative group/tooltip mb-2 last:mb-0">
                <span className={cn(
                   "inline-block px-2 py-1 rounded cursor-help transition-all duration-500",
                   segment.label === 'impactful' ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border-l-2 border-emerald-500/40" :
                   segment.label === 'weak' ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border-l-2 border-amber-500/40" :
                   segment.label === 'irrelevant' ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 border-l-2 border-rose-500/40" :
                   "text-white/80 hover:text-white"
                )}>
                  {segment.text}
                </span>
                {segment.comment && (
                  <div className="absolute bottom-full left-0 mb-3 w-80 p-4 bg-black/95 border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 backdrop-blur-3xl scale-95 group-hover/tooltip:scale-100 pointer-events-none ring-1 ring-white/20">
                    <div className="flex items-center gap-2 mb-2 text-[8px] font-black uppercase tracking-widest text-primary">
                      <Zap className="w-3 h-3" /> Forensic Analysis
                    </div>
                    <p className="text-[11px] font-bold text-white/90 leading-relaxed font-sans">{segment.comment}</p>
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
