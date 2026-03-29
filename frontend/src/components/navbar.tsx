"use client"

import { useState } from "react";
import Link from "next/link";
import { Sparkles, LogOut, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide global navbar on dashboard pages as they have their own navigation
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-outfit text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            CareerSync Pro
          </span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors font-bold text-primary/80">Dashboard</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                    {session.user?.email?.[0]}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {session.user?.email}
                  </span>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="text-sm font-medium text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-2 group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="text-sm font-medium bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full transition-all hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:scale-105">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors z-[60]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[45] md:hidden animate-in fade-in duration-500"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0a0a0b]/95 backdrop-blur-2xl border-b border-white/10 z-[50] animate-in slide-in-from-top-4 duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col p-8 gap-8">
            <div className="flex flex-col gap-6">
              <Link href="/features" className="text-2xl font-bold text-white hover:text-primary transition-all flex items-center justify-between group" onClick={() => setIsMenuOpen(false)}>
                Features <Sparkles className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/pricing" className="text-2xl font-bold text-white hover:text-primary transition-all" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-primary transition-all" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
            </div>
            
            <div className="h-px bg-white/10 w-full" />
            
            {session ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center font-black text-primary text-xl shadow-inner uppercase">
                    {session.user?.email?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Account</span>
                    <span className="text-sm text-white truncate max-w-[180px] font-medium">
                      {session.user?.email}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Link 
                  href="/login" 
                  className="w-full py-4 text-center border border-white/10 rounded-2xl text-white font-bold hover:bg-white/5 transition-all active:scale-95" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="w-full py-4 text-center bg-primary rounded-2xl text-white font-bold shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-primary/50 transition-all active:scale-95" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started for Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
