"use client"

import { useState, useEffect, useRef } from 'react';
import { Mic, Video, PhoneOff, Play, AlertCircle, Loader2 } from 'lucide-react';

export default function MockInterview() {
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "Hello! Welcome to your mock technical interview. Let's start with a brief introduction. Can you tell me about yourself and your background?" }
  ]);
  
  const [liveAnalysis, setLiveAnalysis] = useState<{
    filler_words: string, speaking_pace: string, confidence_score: number, tip: string
  } | null>(null);

  const [targetRole, setTargetRole] = useState("");

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

  const startInterview = () => {
    setIsActive(true);
    setTimer(0);
    // Speak first question
    speak(messages[0].content);
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
          history: messages,
          target_role: targetRole || "software engineering"
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
                  {isSynthesizing ? "AI is analyzing..." : isListening ? "Listening to you..." : "GPT-4o Interviewer"}
                </h3>
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
            ) : (
              <div className="text-center p-8 flex flex-col items-center">
                <Video className="w-16 h-16 text-white/20 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Camera & Mic Check</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Ensure your environment is quiet. Provide your target role for the AI to dynamically adapt the context.</p>
                
                <div className="w-full max-w-sm space-y-2 mb-8 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Job Role</label>
                  <input 
                    type="text" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <button 
                  onClick={startInterview}
                  className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" fill="currentColor" /> Start Interview Session
                </button>
              </div>
            )}
            
            {/* Control Bar (Absolute Bottom) */}
            {isActive && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                <button 
                  onClick={isListening ? stopListening : startListening} 
                  className={`p-3 rounded-full transition-colors ${isListening ? 'bg-secondary/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={submitAnswer}
                  disabled={!transcript.trim() || isSynthesizing}
                  className="px-4 py-2 bg-primary/80 hover:bg-primary disabled:opacity-50 text-white rounded-full transition-colors text-sm font-bold"
                >
                  Send Answer
                </button>
                <button 
                  onClick={endInterview}
                  className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]"
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
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Speaking Pace</span>
                    <span className="text-secondary">{liveAnalysis.speaking_pace}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[85%]" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Filler Word Usage</span>
                    <span className="text-yellow-400">{liveAnalysis.filler_words}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full bg-yellow-400 ${liveAnalysis.filler_words === 'Low' ? 'w-1/4' : liveAnalysis.filler_words === 'Medium' ? 'w-2/4' : 'w-4/5'}`} />
                  </div>
                </div>

                {/* Metric 3 */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Confidence Score</span>
                    <span className="text-primary">{liveAnalysis.confidence_score}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{width: `${liveAnalysis.confidence_score}%`}} />
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl p-4 bg-white/5 mt-8">
                  <h4 className="text-sm font-bold text-white mb-2">AI Tip</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{liveAnalysis.tip}</p>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
