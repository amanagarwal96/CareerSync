"use client"

import Link from "next/link";
import { Sparkles, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-outfit text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            CareerSync Pro
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>
        
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:block bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                {session.user?.email || "Authenticated"}
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
      </div>
    </nav>
  );
}
