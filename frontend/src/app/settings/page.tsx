"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateProfile } from "@/app/actions"
import Link from "next/link"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session])

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateProfile({ name })
    if (res.success) {
      await update({ name })
    } else {
      alert("Error saving profile")
    }
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pt-24 pb-12">
      <div className="max-w-4xl mx-auto w-full px-6 flex-1">
        <header className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-outfit font-bold shadow-sm">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your CareerSync Pro preferences, billing, and system alerts.</p>
        </header>

        <div className="space-y-6">
          <section className="glass-card p-6 border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">👤</span> Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" 
                  placeholder="Your Name" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Email Address (Locked)</label>
                <input 
                  type="email" 
                  readOnly 
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white/50 cursor-not-allowed" 
                  value={session?.user?.email || ""} 
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>

          <section className="glass-card p-6 border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">🛡️</span> Privacy & Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border border-white/5 bg-black/20 p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-white text-sm">Make Resume Public</h3>
                  <p className="text-xs text-muted-foreground mt-1">Allow verified recruiters to search and view your optimized CV.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between border border-white/5 bg-black/20 p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-white text-sm">Two-Factor Authentication (2FA)</h3>
                  <p className="text-xs text-muted-foreground mt-1">Require an OTP sent to your email during login.</p>
                </div>
                <button className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors">Setup 2FA</button>
              </div>
            </div>
          </section>

          <section className="glass-card p-6 border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">🔔</span> Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border border-white/5 bg-black/20 p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-white text-sm">Job Match Alerts</h3>
                  <p className="text-xs text-muted-foreground mt-1">Receive weekly digests of jobs matching your ATS score.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          <section className="glass-card p-6 border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">💳</span> Subscription
            </h2>
            <div className="flex items-center justify-between border border-purple-500/30 bg-purple-500/10 p-5 rounded-xl">
              <div>
                <h3 className="font-bold text-purple-400">Manage Plan</h3>
                <p className="text-sm text-purple-200/60 mt-0.5">Upgrade or downgrade your CareerSync Pro benefits.</p>
              </div>
              <Link href="/pricing" className="border border-purple-500/50 bg-black/40 px-5 py-2.5 rounded-xl hover:bg-black/60 transition-colors text-sm font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]">Manage Billing</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
