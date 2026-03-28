"use client"

import { useState, useEffect, useRef } from 'react';
import { Mic, Video, PhoneOff, Play, AlertCircle, Loader2, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LiveAnalysis {
  filler_words: string;
  speaking_pace: string;
  confidence_score: number;
  hiring_signal?: string;
  current_phase?: string;
  tip: string;
}

export default function MockInterview() {
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "Hello! Welcome to your mock technical interview. Let's start with a brief introduction. Can you tell me about yourself and your background?" }
  ]);
  
  const [liveAnalysis, setLiveAnalysis] = useState<LiveAnalysis | null>(null);

  const [targetRole, setTargetRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [webContext, setWebContext] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalVerdict, setFinalVerdict] = useState<{decision: string, justification: string} | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // clear queue
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSynthesizing(false);
    utterance.onend = () => {
      // Auto-start listening after AI speaks!
      startListening();
    };
    
    synth.speak(utterance);
  }

  const startInterview = async () => {
    if (!resumeFile || !targetRole) {
      alert("Please provide at least your Target Role and Resume PDF.");
      return;
    }

    setIsInitializing(true);
    try {
      const formData = new FormData();
      formData.append("target_role", targetRole);
      formData.append("company_name", companyName);
      formData.append("resume_pdf", resumeFile);
      if (jdFile) formData.append("jd_pdf", jdFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/interview/start`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Failed to initialize interview session");

      const data = await res.json();
      setResumeText(data.resume_text);
      setJdText(data.jd_text);
      setWebContext(data.web_context);
      
      setIsActive(true);
      setTimer(0);
      
      // Personalized first question after research
      const introText = `Hello! I've analyzed your background and the requirements for ${targetRole} at ${companyName || 'this firm'}. Based on recent interview trends from GeeksforGeeks and Medium, let's dive in. Can you tell me about yourself and your most relevant technical experience?`;
      
      const newMessages = [{ role: "assistant", content: introText }];
      setMessages(newMessages);
      speak(introText);
      
    } catch (error) {
      console.error(error);
      alert("Error starting interview. Please check your connection and try again.");
    } finally {
      setIsInitializing(false);
    }
  }

  const endInterview = () => {
    setIsActive(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();
    setTranscript("");
    setMessages([{ role: "assistant", content: "Hello! Welcome to your mock technical interview. Let's start with a brief introduction. Can you tell me about yourself and your background?" }]);
    setLiveAnalysis(null);
    setIsCompleted(false);
    setFinalVerdict(null);
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Web Speech API. Please use Chrome.");
      return;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    // When the user stops speaking naturally, it fires onend.
    recognition.onend = () => {
      setIsListening(false);
      // We only send to API if there's actual transcript built up.
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }

  const submitAnswer = async () => {
    if (!transcript) return;
    stopListening();
    setIsSynthesizing(true);
    
    const newMessages = [...messages, { role: "user", content: transcript }];
    setMessages(newMessages);
    setTranscript("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/interview/chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: transcript,
          history: newMessages,
          target_role: targetRole || "software engineering",
          company_name: companyName,
          jd_text: jdText,
          resume_text: resumeText,
          web_context: webContext
        })
      });
      const data = await res.json();
      
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      if (data.analysis) {
        setLiveAnalysis(data.analysis);
      }
      
      speak(data.reply);
    } catch (error) {
      console.error(error);
      setIsSynthesizing(false);
      speak("Pardon me, my server connection was interrupted. Please try saying that again.");
    }
  }

  const finishInterview = async () => {
    setIsFinalizing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/interview/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          target_role: targetRole,
          company_name: companyName,
          jd_text: jdText,
          resume_text: resumeText,
          web_context: webContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFinalVerdict(data.verdict);
        
        // Handle PDF blob separately or combined? Let's just assume the user wants to download.
        // I'll make a second call to get the blob or modify backend to return JSON + Blob.
        // Actually, easiest is to have a second button "Download PDF" in the success screen.
      }
    } catch (error) {
      console.error("Failed to finalize interview:", error);
    } finally {
      setIsFinalizing(false);
      setIsActive(false);
      setIsCompleted(true);
    }
  }

  const downloadPDF = async () => {
    console.log("Triggering PDF Download...");
    setIsFinalizing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/interview/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          target_role: targetRole,
          company_name: companyName,
          jd_text: jdText,
          resume_text: resumeText,
          web_context: webContext
        })
      });
      if (res.ok) {
        console.log("PDF received, processing blob...");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Master_Guide_${companyName || 'Pro'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        alert("Success! Your Master Guide PDF has been generated and downloaded.");
      } else {
        const err = await res.text();
        console.error("PDF Download Failed:", err);
        alert("Failed to generate PDF: " + err);
      }
    } catch (e: any) { 
      console.error("PDF Download Exception:", e);
      alert("Connection Error. Please ensure the backend is running.");
    }
    finally { setIsFinalizing(false); }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLatestAiMessage = () => {
    const aiMsgs = messages.filter(m => m.role === "assistant");
    return aiMsgs[aiMsgs.length - 1]?.content || "";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative z-10 pt-4 h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-outfit font-bold text-white mb-2">Interview Mastery</h1>
        <p className="text-muted-foreground">Real-time AI voice simulation with interactive speech models.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        
        {/* Main Video Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 glass-card border-white/10 relative overflow-hidden flex flex-col items-center justify-center bg-black/40">
            {isActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                
                {/* Simulated AI Avatar / Audio Wave */}
                <div className="w-48 h-48 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center relative mb-8">
                  {(!isListening && !isSynthesizing) && (
                    <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-75" />
                  )}
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isListening ? 'bg-secondary/20' : 'bg-primary/20'}`}>
                    {isSynthesizing ? (
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    ) : (
                      <Mic className={`w-12 h-12 ${isListening ? 'text-secondary animate-pulse' : 'text-primary'}`} />
                    )}
                  </div>
                </div>
                
                <h3 className="text-2xl font-outfit text-white mb-2">
                  {isSynthesizing ? "AI is analyzing..." : isListening ? "Listening to you..." : `${companyName || 'AI'} Interviewer`}
                </h3>
                {liveAnalysis?.current_phase && (
                  <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                    Phase: {liveAnalysis.current_phase}
                  </div>
                )}
                <p className="text-primary font-mono text-xl">{formatTime(timer)}</p>

                {/* Subtitles Stub */}
                <div className="absolute bottom-32 left-8 right-8 text-center text-white/80 bg-black/60 p-4 rounded-xl backdrop-blur-md">
                  <span className="text-primary font-bold">AI:</span> "{getLatestAiMessage()}"
                </div>

                {/* User Transcript Display */}
                {transcript && (
                  <div className="absolute bottom-48 left-8 right-8 text-center text-white/60 bg-white/5 p-4 rounded-xl backdrop-blur-md">
                    <span className="text-secondary font-bold">You:</span> "{transcript}"
                  </div>
                )}

              </div>
            ) : isCompleted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-white">Session Matrix Complete</h2>
                
                {finalVerdict ? (
                  <div className="max-w-md bg-white/5 border border-white/10 p-6 rounded-2xl mb-4 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase font-black text-primary tracking-widest">Hiring Verdict</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${finalVerdict.decision.includes('Hire') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {finalVerdict.decision}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed italic">"{finalVerdict.justification}"</p>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-white/40 italic text-sm">Analyzing full-session metrics...</div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={downloadPDF}
                    disabled={isFinalizing}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    {isFinalizing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Download Master Guide PDF"}
                  </button>
                  <button 
                    onClick={endInterview}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold"
                  >
                    New Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 flex flex-col items-center">
                <Video className="w-16 h-16 text-white/20 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Camera & Mic Check</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Ensure your environment is quiet. Provide your target role for the AI to dynamically adapt the context.</p>
                
                <div className="w-full max-w-sm space-y-4 mb-8 text-left">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Target Job Role</label>
                    <input 
                      type="text" 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Company Name (Optional)</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google, Stripe, Netflix"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Resume PDF</label>
                      <div className="relative group/file">
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed ${resumeFile ? 'border-primary bg-primary/5' : 'border-white/10 bg-black/40'} rounded-xl p-4 flex flex-col items-center justify-center transition-all group-hover/file:border-primary/50`}>
                          {resumeFile ? <CheckCircle2 className="w-6 h-6 text-primary mb-1" /> : <Upload className="w-6 h-6 text-white/20 mb-1" />}
                          <span className="text-[10px] text-white/60 truncate max-w-full">{resumeFile ? resumeFile.name : "Upload Resume"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">JD PDF (Opt)</label>
                      <div className="relative group/file">
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed ${jdFile ? 'border-secondary bg-secondary/5' : 'border-white/10 bg-black/40'} rounded-xl p-4 flex flex-col items-center justify-center transition-all group-hover/file:border-secondary/50`}>
                          {jdFile ? <CheckCircle2 className="w-6 h-6 text-secondary mb-1" /> : <Upload className="w-6 h-6 text-white/20 mb-1" />}
                          <span className="text-[10px] text-white/60 truncate max-w-full">{jdFile ? jdFile.name : "Upload JD"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startInterview}
                  disabled={isInitializing || !targetRole || !resumeFile}
                  className="w-full max-w-sm px-8 py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Researching Latest Industry Trends...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" fill="currentColor" /> Start Interview Session
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Control Bar (Absolute Bottom) */}
            {isActive && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                <button 
                  onClick={isListening ? stopListening : startListening} 
                  className={`p-3 rounded-full transition-all ${isListening ? 'bg-secondary text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  title={isListening ? "Stop Listening" : "Start Listening"}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={submitAnswer}
                  disabled={!transcript.trim() || isSynthesizing}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-full transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  Send Answer
                </button>
                <button 
                  onClick={finishInterview}
                  disabled={isFinalizing}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-full transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  {isFinalizing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Finish & Get PDF"}
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button 
                  onClick={endInterview}
                  className="p-3 bg-rose-500 rounded-full hover:bg-rose-600 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                  title="Quit Interview"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Feedback Sidebar */}
        <div className="glass-card flex flex-col border-white/10 h-full">
          <div className="p-4 border-b border-white/5 bg-white/5 font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" /> Live Analysis
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {!liveAnalysis ? (
              <p className="text-muted-foreground text-sm text-center mt-20">Answer a question to see real-time biometric and semantic feedback.</p>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                
                {/* Metric 1 */}
                <div className="group/metric">
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wider">
                    <span className="text-white/60">Speaking Pace</span>
                    <span className="text-emerald-400">{liveAnalysis.speaking_pace}</span>
                  </div>
                  {liveAnalysis.hiring_signal && (
                    <div className="mb-4 bg-white/5 rounded-lg p-3 border border-white/10">
                      <span className="text-[10px] font-black text-primary uppercase block mb-1">Hiring Signal</span>
                      <span className={`text-sm font-bold ${liveAnalysis.hiring_signal.includes('No Hire') ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {liveAnalysis.hiring_signal}
                      </span>
                    </div>
                  )}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      className="h-full bg-secondary shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all" 
                    />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="group/metric">
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wider">
                    <span className="text-white/60">Filler Word Usage</span>
                    <span className="text-amber-400">{liveAnalysis.filler_words}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: liveAnalysis.filler_words === 'Low' ? '25%' : liveAnalysis.filler_words === 'Medium' ? '50%' : '85%' }}
                      className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all"
                    />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="group/metric">
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wider">
                    <span className="text-white/60">Confidence Score</span>
                    <span className="text-primary">{liveAnalysis.confidence_score}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${liveAnalysis.confidence_score}%` }}
                      className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
                    />
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl p-5 bg-primary/5 mt-8 relative overflow-hidden group/tip">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">AI Strategic Tip</h4>
                  <p className="text-[11px] text-white/70 leading-relaxed italic">"{liveAnalysis.tip}"</p>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
