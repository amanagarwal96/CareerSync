"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { updateProfile, deleteAccount } from "@/app/actions"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Code2, 
  Trash2, 
  Download, 
  RefreshCcw, 
  Key,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Monitor
} from "lucide-react"
import Link from "next/link"

type TabType = "account" | "privacy" | "developer"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const [name, setName] = useState(session?.user?.name || "")
  const [isSaving, setIsSaving] = useState(false)
  const [apiKey, setApiKey] = useState("cs_live_4920...8d12")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (session?.user?.name && !name) {
      setName(session.user.name)
    }
  }, [session, name])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const res = await updateProfile({ name })
    if (res.success) {
      await update({ name })
      alert("Profile updated successfully!")
    } else {
      alert("Error saving profile")
    }
    setIsSaving(false)
  }

  const handleRegenerateKey = () => {
    const newKey = `cs_live_${Math.random().toString(36).substring(2, 12)}...${Math.random().toString(36).substring(2, 6)}`
    setApiKey(newKey)
    alert("New API Key generated successfully!")
  }

  const handleExportData = () => {
    const data = {
      user: session?.user,
      settings: {
        theme: "system",
        notifications: true
      },
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `careersync-data-${session?.user?.email}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    
    setIsDeleting(true)
    const res = await deleteAccount()
    if (res.success) {
      alert("Account deleted successfully. We're sorry to see you go.")
      signOut({ callbackUrl: '/' })
    } else {
      alert("Error deleting account: " + res.error)
      setConfirmDelete(false)
    }
    setIsDeleting(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black font-outfit tracking-tight">Advanced Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg">Manage your CareerSync Pro experience and developer ecosystem.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-2">
            <button 
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                activeTab === "account" 
                ? "bg-primary text-white shadow-xl shadow-primary/20 font-bold" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span>Account</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === "account" ? "rotate-90" : "group-hover:translate-x-1"}`} />
            </button>

            <button 
              onClick={() => setActiveTab("privacy")}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                activeTab === "privacy" 
                ? "bg-primary text-white shadow-xl shadow-primary/20 font-bold" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span>Privacy & Security</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === "privacy" ? "rotate-90" : "group-hover:translate-x-1"}`} />
            </button>

            <button 
              onClick={() => setActiveTab("developer")}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                activeTab === "developer" 
                ? "bg-primary text-white shadow-xl shadow-primary/20 font-bold" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5" />
                <span>Developer Tools</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === "developer" ? "rotate-90" : "group-hover:translate-x-1"}`} />
            </button>

            <div className="pt-6 mt-6 border-t border-border">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Level</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-tight">{session?.user?.role || "STUDENT"}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Tab Content */}
          <main className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "account" && (
              <div className="space-y-8">
                {/* System Appearance */}
                <section className="glass-card p-8 border-border relative overflow-hidden group bg-muted/20">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3 font-outfit">
                    <Monitor className="w-6 h-6 text-primary" /> Appearance
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 block">Visual Theme</label>
                      <ThemeToggle />
                      <p className="mt-4 text-sm text-muted-foreground italic">Switch between light, dark, or sync with your system preferences instantly.</p>
                    </div>
                  </div>
                </section>

                {/* Profile Details */}
                <section className="glass-card p-8 border-border bg-muted/20">
                  <h2 className="text-2xl font-black mb-6 font-outfit">Profile Details</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Display Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all font-medium" 
                        placeholder="Your Name" 
                      />
                    </div>
                    <div className="space-y-2 opacity-60">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Email (Login ID)</label>
                      <input 
                        type="email" 
                        readOnly 
                        className="w-full bg-muted border border-border rounded-xl p-4 text-muted-foreground cursor-not-allowed font-medium" 
                        value={session?.user?.email || ""} 
                      />
                    </div>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center gap-2 active:scale-95"
                    >
                      {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <section className="glass-card p-8 border-border bg-muted/20">
                  <h2 className="text-2xl font-black mb-6 font-outfit flex items-center gap-3">
                    <Shield className="w-6 h-6 text-secondary" /> Data Protection
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-background border border-border rounded-2xl">
                      <div>
                        <h3 className="font-bold text-lg">Public Resume Profile</h3>
                        <p className="text-sm text-muted-foreground">Allow recruiters to discover your profile talent pool.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-background border border-border rounded-2xl">
                      <div>
                        <h3 className="font-bold text-lg">Marketing Communications</h3>
                        <p className="text-sm text-muted-foreground">Receive weekly job alerts and career growth tips.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="p-8 border-[3px] border-red-500/20 bg-red-500/5 rounded-[32px] relative overflow-hidden">
                  <AlertTriangle className="absolute top-4 right-4 w-12 h-12 text-red-500 opacity-10" />
                  <h2 className="text-2xl font-black text-red-500 mb-2 uppercase font-outfit tracking-wider">Danger Zone</h2>
                  <p className="text-red-400/70 text-sm mb-6 max-w-lg font-medium">Permanently delete your account. This action cannot be undone. All resume scores, interview recordings, and candidate matches will be lost.</p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        confirmDelete 
                        ? "bg-red-600 text-white shadow-2xl shadow-red-600/40 scale-105" 
                        : "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                      }`}
                    >
                      {isDeleting ? "Processing..." : confirmDelete ? "Yes, Delete Everything" : "Delete Account Forever"}
                    </button>
                    {confirmDelete && (
                      <button 
                        onClick={() => setConfirmDelete(false)}
                        className="text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "developer" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <section className="glass-card p-8 border-border bg-muted/20 overflow-hidden relative group">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3 font-outfit">
                      <Code2 className="w-6 h-6 text-primary" /> API Ecosystem
                    </h2>
                    <div className="px-4 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-black text-secondary uppercase">v1.4.0 Engine Ready</div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-background border border-border rounded-2xl shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Application Secret Key</label>
                        <button 
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          {showApiKey ? "Hide Secret" : "Reveal Secret"}
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 font-mono text-sm bg-muted border border-border p-4 rounded-xl overflow-hidden truncate select-all">
                          {showApiKey ? apiKey : "••••••••••••••••••••••••••••••••••••••••"}
                        </div>
                        <button 
                          onClick={handleRegenerateKey}
                          className="p-4 bg-muted border border-border rounded-xl hover:bg-border transition-all group"
                          title="Generate New Key"
                        >
                          <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={handleExportData}
                        className="p-5 bg-background border border-border rounded-2xl hover:border-primary/50 transition-all flex items-center justify-between group"
                      >
                        <div className="text-left">
                          <h4 className="font-bold text-foreground">Data Export</h4>
                          <p className="text-xs text-muted-foreground">Download account .JSON</p>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                      <button className="p-5 bg-background border border-border rounded-2xl hover:border-primary/50 transition-all flex items-center justify-between group">
                        <div className="text-left">
                          <h4 className="font-bold text-foreground">Webhooks</h4>
                          <p className="text-xs text-muted-foreground">Manage endpoints</p>
                        </div>
                        <Key className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Developer Mode Note */}
                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 text-sm">Developer Mode Advisory</h4>
                    <p className="text-xs text-blue-300/60 mt-1 leading-relaxed">By regenerating keys, existing integrations will be dissociated. Ensure you update your environment variables in your connected applications immediately after regeneration.</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
