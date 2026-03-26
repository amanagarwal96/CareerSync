"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, FileText, Bot, Target, Settings, LogOut, Search, Repeat } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const role = session?.user?.role || "STUDENT";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleRole = async () => {
    const newRole = role === "STUDENT" ? "RECRUITER" : "STUDENT";
    // For a real app, this would be a DB update call
    // For this prototype, we'll suggest updating the DB and force a refresh
    alert(`To permanently switch to ${newRole}, update your User role in Prisma Studio. Role switching is currently gated by your Identity Session.`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-outfit">
      {/* Sidebar */}
      <aside className="w-72 glass-panel border-r border-white/10 hidden md:flex flex-col pt-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Current Portal</p>
              <h2 className="text-xl font-bold text-white">{role === "RECRUITER" ? "Recruiter Hub" : "Student HQ"}</h2>
            </div>
            <button 
              onClick={toggleRole}
              title="Switch Persona"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-primary transition-all border border-white/10"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4">Main Menu</p>
          <nav className="space-y-2">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Mission Control" active={pathname === "/dashboard"} />
            
            {role === "STUDENT" && (
              <>
                <NavItem href="/dashboard/resume" icon={<FileText className="w-5 h-5" />} label="ATS Resume Hub" active={pathname === "/dashboard/resume"} />
                <NavItem href="/dashboard/cover-letter" icon={<Target className="w-5 h-5" />} label="Career Strategist" active={pathname === "/dashboard/cover-letter"} />
                <NavItem href="/dashboard/interview" icon={<Bot className="w-5 h-5" />} label="Mock Interviews" active={pathname === "/dashboard/interview"} />
              </>
            )}

            {role === "RECRUITER" && (
              <NavItem href="/dashboard/recruiter" icon={<Search className="w-5 h-5" />} label="Recruiter Verify" active={pathname === "/dashboard/recruiter"} />
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <nav className="space-y-2">
            <NavItem href="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 px-4 md:px-8 pb-12 relative">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
        : "text-muted-foreground hover:bg-white/5 hover:text-white"
    }`}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  )
}

