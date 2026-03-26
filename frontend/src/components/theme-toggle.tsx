"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl gap-1">
      <button
        onClick={() => setTheme("light")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
          theme === "light" 
            ? "bg-primary text-white shadow-lg shadow-primary/20" 
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        }`}
      >
        <Sun className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
          theme === "dark" 
            ? "bg-primary text-white shadow-lg shadow-primary/20" 
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        }`}
      >
        <Moon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Dark</span>
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
          theme === "system" 
            ? "bg-primary text-white shadow-lg shadow-primary/20" 
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        }`}
      >
        <Monitor className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">System</span>
      </button>
    </div>
  )
}
