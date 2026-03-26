"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { updateProfile, deleteAccount, updatePreferences } from "@/app/actions"
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
  Monitor,
  Zap,
  Globe,
  Database,
  History,
  Lock,
  Cpu,
  Fingerprint
} from "lucide-react"
import Link from "next/link"

type TabType = "account" | "privacy" | "developer" | "security" | "ai"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const [name, setName] = useState(session?.user?.name || "")
  const [isSaving, setIsSaving] = useState(false)
  const [apiKey, setApiKey] = useState("cs_live_4920...8d12")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [aiMode, setAiMode] = useState(session?.user?.aiMode || "pro")
  const [discovery, setDiscovery] = useState(session?.user?.discovery ?? true)

  useEffect(() => {
    if (session?.user?.name && !name) setName(session.user.name)
    if (session?.user?.aiMode) setAiMode(session.user.aiMode)
    if (session?.user?.discovery !== undefined) setDiscovery(session.user.discovery)
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

  const handleUpdatePreference = async (updates: { aiMode?: string, discovery?: boolean }) => {
    // Optimistic update
    if (updates.aiMode) setAiMode(updates.aiMode)
    if (updates.discovery !== undefined) setDiscovery(updates.discovery)

    const res = await updatePreferences(updates)
    if (res.success) {
      await update(updates)
    } else {
      alert("Error syncing preferences: " + res.error)
    }
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
        aiMode,
        discovery
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
      alert("Account deleted successfully.")
      signOut({ callbackUrl: '/' })
    } else {
      alert("Error deleting account: " + res.error)
      setConfirmDelete(false)
    }
    setIsDeleting(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black font-outfit tracking-tighter uppercase italic">Control Center</h1>
              <p className="text-muted-foreground text-sm font-medium">Enterprise Management & Personalization Engine</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Advanced Sidebar */}
          <nav className="lg:col-span-3 space-y-2">
            <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mb-4 pl-2">System Categories</div>
            
            <SidebarButton 
              active={activeTab === "account"} 
              icon={<User className="w-4 h-4" />} 
              label="Identity" 
              onClick={() => setActiveTab("account")} 
            />
            <SidebarButton 
              active={activeTab === "ai"} 
              icon={<Zap className="w-4 h-4" />} 
              label="AI Engine" 
              onClick={() => setActiveTab("ai")} 
            />
            <SidebarButton 
              active={activeTab === "developer"} 
              icon={<Code2 className="w-4 h-4" />} 
              label="Dev Hub" 
              onClick={() => setActiveTab("developer")} 
            />
            <SidebarButton 
              active={activeTab === "security"} 
              icon={<Shield className="w-4 h-4" />} 
              label="Security Audit" 
              onClick={() => setActiveTab("security")} 
            />
            <SidebarButton 
              active={activeTab === "privacy"} 
              icon={<History className="w-4 h-4" />} 
              label="Audit Logs" 
              onClick={() => setActiveTab("privacy")} 
            />

            <div className="pt-8 mt-8 border-t border-border">
              <div className="glass-card p-4 bg-muted/20 border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Plan</span>
                  <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="text-lg font-black font-outfit text-foreground uppercase italic tracking-tighter">Pro Elite</div>
                <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-bold tracking-tight">Active since Mar 2026</div>
              </div>
            </div>
          </nav>

          {/* Dynamic Content Engine */}
          <main className="lg:col-span-9 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
            {activeTab === "account" && (
              <div className="space-y-8">
                {/* Visual Architecture */}
                <section className="glass-card p-10 border-border group overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Monitor className="w-32 h-32" />
                  </div>
                  <h2 className="text-2xl font-black mb-1 group-hover:text-primary transition-colors font-outfit">Visual Architecture</h2>
                  <p className="text-muted-foreground text-sm mb-8">Override system interface directives.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 block">Engine Theme</label>
                      <ThemeToggle />
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Dynamic Transitions</div>
                        <p className="text-[10px] text-muted-foreground">Enabled Global Motion v2.4</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Profile Detail Hub */}
                <section className="glass-card p-10 border-border">
                  <h2 className="text-2xl font-black mb-8 font-outfit">Identity Hub</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Legal Identifier</label>
                       <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all font-bold tracking-tight" 
                      />
                    </div>
                    <div className="space-y-2 opacity-60">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Communication Endpoint</label>
                       <input 
                        type="email" 
                        readOnly 
                        className="w-full bg-muted border border-border rounded-xl p-4 text-muted-foreground cursor-not-allowed font-medium select-all" 
                        value={session?.user?.email || ""} 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] px-12 py-5 rounded-2xl hover:bg-primary/90 transition-all shadow-[0_20px_40px_rgba(59,130,246,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isSaving ? "Syncing..." : "Commit Profile Changes"}
                  </button>
                </section>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <section className="glass-card p-10 border-border bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-black font-outfit uppercase italic tracking-tighter">AI Core Configuration</h2>
                      <p className="text-muted-foreground text-sm mt-1">Configure neural parameters for ATS optimization.</p>
                    </div>
                    <Cpu className="w-12 h-12 text-primary opacity-20" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => handleUpdatePreference({ aiMode: "pro" })}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer select-none ${
                        aiMode === "pro" ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${aiMode === "pro" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                          <Zap className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-lg">Precision Mode</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">Deep semantic analysis. Scans for 500+ ATS markers. Best for FAANG applications.</p>
                    </div>

                    <div 
                      onClick={() => handleUpdatePreference({ aiMode: "fast" })}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer select-none ${
                        aiMode === "fast" ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${aiMode === "fast" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                          <Cpu className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-lg">Velocity Engine</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">Instant results. Optimized for speed and basic keyword matching.</p>
                    </div>
                  </div>
                </section>

                <section className="glass-card p-10 border-border">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-secondary" /> Global AI Privacy
                  </h2>
                  <div className="flex items-center justify-between p-6 bg-muted/30 border border-border rounded-2xl">
                    <div>
                      <h4 className="font-bold">Anonymize Training Data</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">Remove personal identifiers before processing. (Complies with GDPR v2.0)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={discovery} onChange={(e) => handleUpdatePreference({ discovery: e.target.checked })} />
                      <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "developer" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section className="glass-card p-10 border-border relative group">
                  <h2 className="text-2xl font-black mb-8 flex items-center justify-between font-outfit">
                    Dev Hub & API Access
                    <span className="text-[10px] px-3 py-1 rounded bg-secondary/10 border border-secondary/20 text-secondary font-black uppercase">v2.1 Production</span>
                  </h2>

                  <div className="space-y-8">
                    <div className="p-8 bg-black/40 border-2 border-border/50 rounded-3xl group-hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Secret Integration Key</label>
                        <button 
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] font-black text-primary uppercase hover:underline"
                        >
                          {showApiKey ? "Seal Key" : "Expose Key"}
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 font-mono text-xs bg-muted/50 p-4 rounded-xl border border-white/5 truncate select-all">
                          {showApiKey ? apiKey : "********************************************"}
                        </div>
                        <button 
                          onClick={handleRegenerateKey}
                          className="p-4 bg-muted border border-border rounded-xl hover:bg-border transition-all active:scale-90"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DeveloperLink label="Data Export" sub="Request full entity JSON" icon={<Download className="w-4 h-4" />} onClick={handleExportData} />
                      <DeveloperLink label="Webhook Log" sub="View real-time event sink" icon={<Database className="w-4 h-4" />} />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                <section className="glass-card p-10 border-border">
                   <h2 className="text-2xl font-black mb-8 font-outfit flex items-center gap-3">
                    <Fingerprint className="w-6 h-6 text-primary" /> Advanced Security Audit
                  </h2>
                  <div className="space-y-4">
                    <SecurityLockout 
                      title="Biometric Authentication" 
                      sub="Require fingerprint/face-ID on sensitive actions."
                      active={true}
                    />
                    <SecurityLockout 
                      title="Hardware Hardware Isolation" 
                      sub="Restrict API keys to specific device hardware IDs."
                      active={false}
                    />
                    <SecurityLockout 
                      title="IP Intelligence Guard" 
                      sub="Auto-lock account on anomalous geo-rotation."
                      active={true}
                    />
                  </div>
                </section>

                <section className="p-10 border-[3px] border-red-500/20 bg-red-500/5 rounded-[40px] relative">
                  <h2 className="text-3xl font-black text-red-500 mb-2 font-outfit uppercase italic tracking-tighter">Decommission Entity</h2>
                  <p className="text-red-300/60 text-sm mb-8 font-medium max-w-lg">Initiating decommissioning will result in permanent erasure of all semantic memories, ATS datasets, and cloud infrastructure associated with this identity.</p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className={`px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl ${
                        confirmDelete 
                        ? "bg-red-600 text-white shadow-red-600/40 translate-x-1" 
                        : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-500"
                      }`}
                    >
                      {isDeleting ? "Erasing..." : confirmDelete ? "Confirm Decommission" : "Terminate Account Entity"}
                    </button>
                    {confirmDelete && (
                      <button onClick={() => setConfirmDelete(false)} className="text-sm font-bold text-muted-foreground hover:text-white transition-all underline decoration-2 underline-offset-4">Abortion Protocol</button>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <section className="glass-card p-10 border-border">
                  <h2 className="text-2xl font-black mb-8 font-outfit flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" /> Audit Logs (Last 24h)
                  </h2>
                  <div className="space-y-1">
                    <AuditRow event="Identity Persistence Sync" time="14:02 UTC" status="SUCCESS" />
                    <AuditRow event="AI Engine Core Swap" time="11:45 UTC" status="COMPLETED" />
                    <AuditRow event="Terminal Key Generation" time="09:12 UTC" status="COMPLETED" />
                    <AuditRow event="Geo-Location Verification" time="08:02 UTC" status="SECURE" />
                    <AuditRow event="Session Token Rotation" time="00:01 UTC" status="ENCRYPTED" />
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function SidebarButton({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
        active 
        ? "bg-primary text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)] font-black" 
        : "bg-muted/30 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent hover:border-border"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className={`w-3 h-3 transition-transform ${active ? "rotate-90" : "group-hover:translate-x-1"}`} />
    </button>
  )
}

function DeveloperLink({ label, sub, icon, onClick }: { label: string, sub: string, icon: any, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="p-6 bg-background border border-border rounded-2xl hover:border-primary/40 transition-all flex items-center justify-between group active:scale-[0.98]">
      <div className="text-left">
        <h4 className="font-black text-sm uppercase tracking-tight">{label}</h4>
        <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
      </div>
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
    </button>
  )
}

function SecurityLockout({ title, sub, active }: { title: string, sub: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 bg-background border border-border rounded-2xl">
      <div>
        <h3 className="font-bold text-sm tracking-tight">{title}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div className={`w-12 h-6 rounded-full relative p-1 transition-colors ${active ? "bg-primary" : "bg-muted"}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${active ? "translate-x-6" : "translate-x-0"}`} />
      </div>
    </div>
  )
}

function AuditRow({ event, time, status }: { event: string, time: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 hover:bg-muted/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-primary/40" />
        <span className="text-sm font-bold tracking-tight">{event}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-muted-foreground font-mono">{time}</span>
        <span className="text-[10px] font-black tracking-tighter text-primary/80 uppercase">{status}</span>
      </div>
    </div>
  )
}
