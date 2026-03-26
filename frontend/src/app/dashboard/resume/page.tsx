"use client"

import { useState } from 'react';
import { saveResumeAnalysis } from '@/app/actions';
import { UploadCloud, FileText, Target, CheckCircle2, ChevronRight, Download, RefreshCcw, LayoutPanelLeft, Lock } from 'lucide-react';

export default function ResumeHub() {
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<null | any>(null);
  const [extractedText, setExtractedText] = useState('');
  const [activeTab, setActiveTab] = useState<'SIDE_BY_SIDE' | 'JD' | 'RESUME' | 'CHANGES'>('JD');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResults(null);
    setExtractedText("");
    
    try {
      const formData = new FormData();
      formData.append("target_job", jobDescription);
      if (file) {
        formData.append("resume_file", file);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/analyze-resume`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend AI Error");
      
      const data = await res.json();
      setResults(data);
      if (data.extracted_text) {
        setExtractedText(data.extracted_text);
      }

      // Save real-time ATS score to SQLite database
      if (data.ats_score) {
        await saveResumeAnalysis({
          atsScore: data.ats_score,
          content: data.extracted_text || "",
          gaps: JSON.stringify(data.keyword_gaps || [])
        });
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to AI backend. Ensure FastAPI is running.");
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (original: string, improved: string) => {
    setExtractedText((prev) => {
      if (prev.includes(original)) {
        return prev.replace(original, improved);
      } else {
        return prev + "\n\n--- AI Enhancement ---\n" + improved + "\n";
      }
    });
  };

  const downloadOptimizedText = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Targeted_Resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderHighlightedJD = () => {
    if (!jobDescription) return null;
    
    const words = jobDescription.split(/(\s+)/);
    const targetKeywords = ['Stack', 'Developer', 'mobile', 'applications', 'stacks', 'front-end', 'languages', 'CSS', 'JavaScript', 'XML', 'jQuery', 'back-end', 'Java', 'Python', 'frameworks', 'Angular', 'React', 'Node.js', 'databases', 'MySQL', 'MongoDB', 'web', 'servers', 'Apache', 'UI/UX', 'design'];
    const gapsLower = results?.keyword_gaps?.map((g: string) => g.toLowerCase()) || [];

    return (
      <div className="text-white/80 leading-relaxed text-[15px] whitespace-pre-wrap">
        {words.map((word, i) => {
          const cleanWord = word.replace(/[.,()]/g, '').trim();
          const isMissing = gapsLower.includes(cleanWord.toLowerCase());
          
          if (isMissing) {
            return <span key={i} className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-sm font-medium border border-red-500/30 shadow-sm">{word}</span>;
          } else if (targetKeywords.includes(cleanWord)) {
            return <span key={i} className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-medium border border-emerald-500/30 shadow-sm">{word}</span>;
          }
          return <span key={i}>{word}</span>;
        })}
      </div>
    );
  };

  if (!results) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-4xl glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row border border-white/10">
          <div className="w-full md:w-5/12 bg-black/40 p-10 flex flex-col justify-center relative overflow-hidden text-white border-r border-white/5">
            <h1 className="text-3xl font-outfit font-bold mb-4">Targeted Resume</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">Upload your existing resume and paste the job description you are aiming for. Our neural matching engine will extract the core requirements and identify exact keyword gaps.</p>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Identifies ATS missing skills</div>
              <div className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Provides exact sentence rewrites</div>
              <div className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Visual side-by-side verification</div>
            </div>
          </div>
          <div className="w-full md:w-7/12 p-10 flex flex-col justify-center">
            
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Job Description</label>
              <textarea 
                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none text-sm transition-all"
                placeholder="Paste the target role description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="mb-8 border-2 border-dashed border-white/20 hover:border-primary/50 bg-black/20 rounded-xl transition-colors flex flex-col items-center justify-center relative py-10 cursor-pointer">
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <UploadCloud className="w-10 h-10 text-primary mb-3" />
              {file ? (
                <p className="text-white font-bold">{file.name}</p>
              ) : (
                <div className="text-center">
                  <p className="text-white font-bold">Upload Resume PDF</p>
                  <p className="text-muted-foreground text-sm mt-1">Drag & Drop or Click to Browse</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!file || !jobDescription || isAnalyzing}
              className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              {isAnalyzing ? "Executing Neural Match..." : "Score My Resume"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row -mx-8 -my-8 px-0 pt-0">
      
      {/* Left Scoring / Summary Sidebar */}
      <div className="w-full lg:w-[400px] border-r border-white/5 bg-black/20 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex border-b border-white/5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <button className="flex-1 py-4 border-b-2 border-primary text-primary bg-primary/5 flex justify-center gap-2 items-center">
            <Target className="w-4 h-4" /> Relevancy Score
          </button>
          <button className="flex-1 py-4 hover:bg-white/5 transition-colors flex justify-center gap-2 items-center">
            <FileText className="w-4 h-4" /> Overall Score
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <span className="text-emerald-400">Great.</span> Your resume contains targeted impact.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10">This means your resume is generally well targeted and relevant. Read below for what to do next to push perfection.</p>

          <div className="flex justify-center mb-12 relative pointer-events-none">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeLinecap="round" strokeWidth="8" fill="transparent" 
                  strokeDasharray={276} strokeDashoffset={276 - (276 * results.ats_score) / 100} 
                  className={results.ats_score > 80 ? "text-emerald-500" : "text-yellow-400"} 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-6xl font-black font-outfit text-white tracking-tighter shadow-sm">{results.ats_score}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 text-blue-300 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded mb-6">What should you do next?</div>
          
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-1 font-bold text-white text-sm mb-2 hover:text-primary cursor-pointer">
                <ChevronRight className="w-4 h-4 text-primary" /> Download optimized TXT
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">Grab the plain text dump of your AI-improved resume and drop it into LaTeX or Word.</p>
              <button 
                onClick={downloadOptimizedText}
                className="bg-primary hover:bg-primary/90 transition-colors text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded flex items-center gap-2 shadow-sm"
              >
                Download Plain Text <Download className="w-3 h-3" />
              </button>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <h3 className="flex items-center gap-1 font-bold text-white text-sm mb-2 hover:text-primary cursor-pointer">
                <ChevronRight className="w-4 h-4 text-primary" /> Target another job
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">To maximize your chances for an interview, target your resume to each job you apply to. Re-upload another job description.</p>
              <button 
                onClick={() => setResults(null)}
                className="bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded shadow-sm border border-white/10"
              >
                Upload Another Target
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Main Panel: Tabbed View */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="glass-card border-b border-white/5 px-8 flex items-end h-[72px] shrink-0">
          <div className="flex gap-2">
            {[
              { id: 'SIDE_BY_SIDE', label: 'SIDE BY SIDE', icon: <LayoutPanelLeft className="w-4 h-4" /> },
              { id: 'JD', label: 'JOB DESCRIPTION', icon: <FileText className="w-4 h-4" /> },
              { id: 'RESUME', label: 'YOUR RESUME', icon: <Target className="w-4 h-4" /> },
              { id: 'CHANGES', label: 'CHANGES', icon: <RefreshCcw className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id ? 'text-primary border-b-[3px] border-primary bg-primary/5' : 'text-muted-foreground border-b-[3px] border-transparent hover:bg-white/5 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          
          {(activeTab === 'JD' || activeTab === 'SIDE_BY_SIDE') && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-widest mb-4">Job Description</h3>
                <div className="glass-card border border-white/10 shadow-sm rounded-xl p-8 bg-black/20">
                  {renderHighlightedJD()}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'RESUME' || activeTab === 'SIDE_BY_SIDE') && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 mt-12">
              <div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-widest mb-4">Your Resume Extraction</h3>
                <div className="glass-card border border-white/10 shadow-sm rounded-xl overflow-hidden relative">
                  
                  <div className="bg-black/40 border-b border-white/5 p-6 flex items-start gap-4">
                    <div className="bg-primary/20 p-2 text-primary rounded-lg shrink-0 mt-0.5"><Lock className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm text-white leading-relaxed mb-3">With Pro, you can edit your resume directly here and we'll score it in real-time. A serious timesaver when tailoring your assets.</p>
                      <button className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)]">Unlock Editor</button>
                    </div>
                  </div>

                  <textarea 
                    className="w-full h-96 p-8 text-white/70 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm leading-relaxed"
                    value={extractedText}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CHANGES' && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-widest mb-4">AI Magic Rewrite Suggestions</h3>
              <div className="space-y-4">
                {results.enhancement_suggestions?.map((suggestion: any, i: number) => (
                  <div key={i} className="glass-card border border-white/10 shadow-sm rounded-xl p-6 hover:border-primary/40 transition-colors bg-black/20">
                    <div className="mb-4">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Original Detected</span>
                      <p className="line-through bg-red-500/10 text-red-400 text-sm p-3 rounded-lg border border-red-500/20">{suggestion.original}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-2 block">AI Optimized Pitch</span>
                      <p className="text-emerald-100 font-bold bg-emerald-500/10 text-sm p-3 rounded-lg border border-emerald-500/20 shadow-sm">{suggestion.improved}</p>
                    </div>
                    <div className="text-sm text-muted-foreground pt-4 border-t border-white/5 mt-2 flex justify-between items-center">
                      <span><span className="font-bold text-white">Why:</span> {suggestion.reason}</span>
                      <button 
                        onClick={() => applySuggestion(suggestion.original, suggestion.improved)}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest py-2 px-4 rounded transition-colors border border-white/10"
                      >
                        Apply Text
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
