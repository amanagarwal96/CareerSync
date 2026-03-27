"use client"

import { useState, useEffect } from 'react';
import { Target, Sparkles, Building2, Map, ChevronRight, Check } from 'lucide-react';
import { saveCoverLetter } from '@/app/actions';

export default function CareerStrategist() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [careerMap, setCareerMap] = useState<any>(null);

  const [targetJob, setTargetJob] = useState("Acme Corp");
  const [resumeText, setResumeText] = useState("Senior Software Engineer with 5 years of React and Python experience.");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCoverLetter("Synthesizing...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_job: targetJob, resume_text: resumeText, only_map: false })
      });
      const data = await res.json();
      const finalLetter = data.cover_letter || "Failed to generate.";
      setCoverLetter(finalLetter);
      if (data.career_map) {
        setCareerMap(data.career_map);
      }
      
      if (data.cover_letter) {
        await saveCoverLetter({ targetJob: targetJob, content: data.cover_letter });
      }
    } catch (error) {
      setCoverLetter("Backend connection failed.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Reactive Sync for Career Mapping
  const [lastSyncedTarget, setLastSyncedTarget] = useState("");

  const syncCareerMap = async () => {
    if (!targetJob || targetJob === lastSyncedTarget) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_job: targetJob, resume_text: resumeText, only_map: true })
      });
      const data = await res.json();
      if (data.career_map) {
        setCareerMap(data.career_map);
        setLastSyncedTarget(targetJob);
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (targetJob && resumeText) {
            syncCareerMap();
        }
    }, 1500);
    return () => clearTimeout(timer);
  }, [targetJob, resumeText]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative z-10 pt-4">
      <header>
        <h1 className="text-3xl font-outfit font-bold text-white mb-2">Personal Career Strategist</h1>
        <p className="text-muted-foreground">Dynamic cover letters and predictive career mapping to guide your next big leap.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cover Letter Engine */}
        <div className="glass-card flex flex-col h-[600px] border-white/10">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-secondary" /> Cover Letter Engine</h3>
            {coverLetter && (
              <button className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-1 font-medium hover:bg-primary/30 transition-colors">
                <Check className="w-3 h-3" /> Copy
              </button>
            )}
          </div>
          
          <div className="p-6 flex flex-col h-full gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Target Role & Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" 
                  value={targetJob}
                  onChange={(e) => setTargetJob(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. Senior Frontend Engineer at Stripe"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Your Experience/Resume Text</label>
              <textarea 
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-secondary transition-colors resize-none"
                placeholder="Paste your key experiences here..."
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? "Synthesizing Profile & Job Data..." : "Generate Hyper-Personalized Cover Letter"}
            </button>

            <div className="flex-1 mt-4 relative">
              {isGenerating && (
                <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-3" />
                  <p className="text-sm font-medium text-white">Using GPT-4o context...</p>
                </div>
              )}
              <textarea 
                className="w-full h-full bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-secondary/50 font-mono text-sm leading-relaxed"
                placeholder="Your generated cover letter will appear here..."
                value={coverLetter}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Career Path Mapping */}
        <div className="glass-card flex flex-col h-[600px] border-white/10 relative overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-purple-400" /> <h3 className="font-bold text-white">Predictive Career Mapping</h3>
            </div>
            {isSyncing && <div className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest">Syncing AI Path...</div>}
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="relative border-l-2 border-white/10 ml-4 pb-4">
              
              {/* Node 1 */}
              <div className="mb-10 relative">
                <div className="absolute -left-[25px] top-1 w-12 h-12 bg-black rounded-full border-2 border-white/10 flex items-center justify-center text-muted-foreground z-10">
                  <Check className="w-5 h-5" />
                </div>
                <div className="pl-10">
                  <h4 className="text-lg font-bold text-white">{careerMap ? careerMap.current : "Current Role (Inferred)"}</h4>
                  <p className="text-sm text-muted-foreground">Baseline Level Indicator</p>
                </div>
              </div>

              {/* Node 2 */}
              <div className="mb-10 relative">
                <div className="absolute -left-[25px] top-1 w-12 h-12 bg-black rounded-full border-2 border-primary flex items-center justify-center z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="pl-10">
                  <h4 className="text-xl font-bold text-primary">{careerMap ? careerMap.next : targetJob || "Target Role"}</h4>
                  <p className="text-sm text-muted-foreground mb-3">Next logical step. Optimized match pathway.</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Missing Skills to Acquire</p>
                    <div className="flex gap-2 flex-wrap">
                      {careerMap ? careerMap.missing_skills.map((skill: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded">{skill}</span>
                      )) : (
                        <span className="text-[10px] font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded">Awaiting analysis...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Node 3 */}
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-12 h-12 bg-black rounded-full border-2 border-white/10 flex items-center justify-center text-muted-foreground z-10">
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </div>
                <div className="pl-10 opacity-50">
                  <h4 className="text-lg font-bold text-white">{careerMap ? careerMap.future : "Future Trajectory"}</h4>
                  <p className="text-sm text-muted-foreground">Estimated 2-3 years away.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
