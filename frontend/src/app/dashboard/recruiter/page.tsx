"use client"

import { useState } from 'react';
import { Search, Terminal, ShieldCheck, ShieldAlert, UploadCloud, Bot, Loader2 } from 'lucide-react';

export default function RecruiterVerification() {
  const [handle, setHandle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleVerify = async () => {
    if (!handle || !file) return;
    
    setIsVerifying(true);
    setResults(null);
    
    try {
      const formData = new FormData();
      formData.append("github_handle", handle);
      formData.append("resume_file", file);
      if (jdFile) formData.append("jd_file", jdFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/recruiter-verify`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      
      // Autonomous Database Storage & SMTP Email Trigger
      if (data.selection_status === "Selected" && data.jd_match_score >= 70) {
        try {
          const resumeFileStr = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          await fetch("/api/recruiter/save-candidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.candidate_name || file.name.split('.')[0],
              email: data.contact_info?.email,
              phone: data.contact_info?.phone,
              college: data.contact_info?.college,
              githubUrl: handle,
              similarity: data.jd_match_score,
              status: "Selected",
              resumeFileStr,
              resumeName: file.name
            })
          });
        } catch (saveErr) {
          console.error("Save Candidate error:", saveErr);
        }
      }
      
      setResults(data);
    } catch (e) {
      console.error(e);
      alert("Error generating verification score. Ensure backend is running.");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto pt-4 h-full flex flex-col">
      <header className="mb-6">
        <h1 className="text-3xl font-outfit font-bold text-white flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" /> Recruiter Verification Engine
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Upload a candidate's resume and link their GitHub. Our engine will map extracted skills directly to public repositories to generate a comprehensive Confidence Score.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Input Form */}
        <div className="glass-card p-6 border-white/10 flex flex-col gap-6">
          <div className="space-y-2" suppressHydrationWarning>
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider" suppressHydrationWarning>
              GITHUB URL
            </label>
            <div className="relative" suppressHydrationWarning>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" suppressHydrationWarning>
                <span className="text-slate-500 font-mono text-sm" suppressHydrationWarning>{'>_'}</span>
              </div>
              <input 
                type="text" 
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="https://github.com/amanagarwal96"
              />
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Candidate Resume (PDF)</label>
            <div className="flex-1 border-2 border-dashed border-white/10 hover:border-primary/50 rounded-xl transition-colors flex flex-col items-center justify-center relative bg-black/20 p-4">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <UploadCloud className="w-8 h-8 text-white/20 mb-2" />
              {file ? (
                <p className="text-white font-medium text-sm truncate max-w-[200px]">{file.name}</p>
              ) : (
                <p className="text-white font-medium text-sm text-center">Upload Resume</p>
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col mt-[-8px]">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Job Description (PDF) <span className="text-primary/70 lowercase text-[10px] ml-1 font-normal opacity-80">(optional)</span></label>
            <div className="flex-1 border-2 border-dashed border-white/10 hover:border-primary/50 rounded-xl transition-colors flex flex-col items-center justify-center relative bg-black/20 p-4">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <UploadCloud className="w-8 h-8 text-white/20 mb-2" />
              {jdFile ? (
                <p className="text-white font-medium text-sm truncate max-w-[200px]">{jdFile.name}</p>
              ) : (
                <p className="text-white font-medium text-sm text-center">Upload Job Description</p>
              )}
            </div>
          </div>

          <button 
            onClick={handleVerify}
            disabled={!handle || !file || isVerifying}
            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
          >
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {isVerifying ? "Scraping GitHub Data & Extracting Skills..." : "Run Skill Verification Check"}
          </button>
        </div>

        {/* Results Panel */}
        <div className="glass-card p-6 border-white/10 bg-gradient-to-br from-white/[0.02] to-primary/[0.02] overflow-y-auto">
          {!results && !isVerifying && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="w-16 h-16 text-white/10 mb-4" />
              <p>Awaiting inputs. Provide a GitHub handle and resume PDF.</p>
            </div>
          )}

          {isVerifying && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <h3 className="text-white font-medium mb-1">Authenticating Skills</h3>
              <p className="text-muted-foreground text-sm">Cross-referencing resume buzzwords with repository languages...</p>
            </div>
          )}

          {results && !isVerifying && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 rounded-full mb-6">
                  <Terminal className="w-4 h-4" /> <span className="font-semibold">{results.github_handle}</span>
                </div>
                
                <h3 className="text-6xl font-outfit font-bold text-white mb-2">{results.verification_score}%</h3>
                <p className="text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">Confidence Score</p>
                <p className="text-sm text-gray-400">{results.message}</p>
                {results.identity_warning && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start gap-3 text-left animate-in zoom-in-95">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 font-medium">{results.identity_warning}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border border-white/10 bg-black/20 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Granular Skill Evidence
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm table-auto">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground whitespace-nowrap">
                          <th className="pb-3 px-2 font-medium w-[20%]">Skill</th>
                          <th className="pb-3 px-2 font-medium w-[30%]">Status</th>
                          <th className="pb-3 px-2 font-medium w-[35%]">Evidence Repo</th>
                          <th className="pb-3 px-2 font-medium text-right w-[15%]">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.skills_analysis?.length > 0 ? [...results.skills_analysis].sort((a: any, b: any) => b.confidence - a.confidence).map((s: any, i: number) => (
                          <tr key={i} className="group hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${s.verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {s.skill}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs font-mono text-muted-foreground">
                              {s.verified ? "Verified via Repositories" : "Unverified Claim"}
                            </td>
                            <td className="py-3 px-2 text-xs text-gray-400 break-words">
                              {s.verified ? <span className="text-white font-medium">{s.evidence}</span> : "No public repositories found."}
                            </td>
                            <td className={`py-3 px-2 text-right font-bold font-mono ${s.confidence > 0 ? 'text-primary' : 'text-red-400'}`}>
                              {s.confidence}%
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">No specific technical skills extracted.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {results.jd_match_score !== null && results.jd_match_score !== undefined && (
                <div className="border border-white/10 bg-black/20 rounded-xl p-6 relative overflow-hidden mt-6 animate-in slide-in-from-bottom-4">
                  <div className="absolute top-0 right-0 p-6">
                      <span className={`px-4 py-1.5 text-sm font-bold tracking-widest uppercase rounded-full ${results.selection_status === 'Selected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                        [{results.selection_status}]
                      </span>
                  </div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-2 uppercase tracking-wider text-muted-foreground">
                      JD Similarity Match
                  </h4>
                  <p className="text-6xl font-outfit font-bold text-white mb-6">{results.jd_match_score}%</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {results.jd_analysis?.map((jd: any, idx: number) => (
                      <div key={idx} className={`border p-3 rounded-lg flex items-center justify-between ${jd.met ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20 opacity-60'}`}>
                        <span className={`text-sm font-semibold text-white tracking-wide`}>{jd.skill}</span>
                        <span className="text-xs font-mono">{jd.met ? '✅' : '❌'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  )
}
