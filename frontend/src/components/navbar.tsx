"use client"

import { useState } from "react";
import Link from "next/link";
import { Sparkles, LogOut, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
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
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                <span className="text-xs text-muted-foreground hidden lg:block bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  {session.user?.email}
                </span>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="text-sm font-medium hover:text-white transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="text-sm font-medium bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass-panel border-b border-white/10 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-6 gap-6">
            <Link href="/features" className="text-lg font-medium text-white" onClick={() => setIsMenuOpen(false)}>Features</Link>
            <Link href="/pricing" className="text-lg font-medium text-white" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link href="/dashboard" className="text-lg font-medium text-white" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
            <hr className="border-white/10" />
            {session ? (
              <div className="flex flex-col gap-4">
                <span className="text-sm text-muted-foreground">{session.user?.email}</span>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-medium border border-red-500/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/login" className="w-full py-3 text-center border border-white/10 rounded-xl text-white font-medium" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/register" className="w-full py-3 text-center bg-primary rounded-xl text-white font-medium" onClick={() => setIsMenuOpen(false)}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
