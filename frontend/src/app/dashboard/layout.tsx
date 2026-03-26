"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, FileText, Bot, Target, Settings, LogOut, Search, Repeat, Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const role = session?.user?.role || "STUDENT";

  useEffect(() => {
    // RBAC Security: Redirect if user tries to access the "wrong" portal
    if (status === "authenticated") {
      if (role === "STUDENT" && pathname.startsWith("/dashboard/recruiter")) {
        router.push("/dashboard");
      } else if (role === "RECRUITER" && (
        pathname.startsWith("/dashboard/resume") || 
        pathname.startsWith("/dashboard/cover-letter") || 
        pathname.startsWith("/dashboard/interview")
      )) {
        router.push("/dashboard/recruiter");
      }
    }
  }, [role, pathname, status, router]);

  // Close sidebar on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleRole = async () => {
    const newRole = role === "STUDENT" ? "RECRUITER" : "STUDENT";
    alert(`To permanently switch to ${newRole}, update your User role in Prisma Studio. Role switching is currently gated by your Identity Session.`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-outfit">
      {/* Mobile Header Toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 glass-panel border-b border-white/10 z-[60] flex items-center justify-between px-6">
        <h2 className="text-lg font-bold text-white">CareerSync</h2>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-primary transition-all border border-white/10"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-[55] w-72 glass-panel border-r border-white/10 flex flex-col pt-20 md:pt-20 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1 text-[10px]">Current Portal</p>
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

          <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-4 text-[10px]">Main Menu</p>
          <nav className="space-y-1">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Mission Control" active={pathname === "/dashboard"} />
            
            {role === "STUDENT" && (
              <>
                <NavItem href="/dashboard/resume" icon={<FileText className="w-4 h-4" />} label="ATS Resume Hub" active={pathname === "/dashboard/resume"} />
                <NavItem href="/dashboard/cover-letter" icon={<Target className="w-4 h-4" />} label="Career Strategist" active={pathname === "/dashboard/cover-letter"} />
                <NavItem href="/dashboard/interview" icon={<Bot className="w-4 h-4" />} label="Mock Interviews" active={pathname === "/dashboard/interview"} />
              </>
            )}

            {role === "RECRUITER" && (
              <NavItem href="/dashboard/recruiter" icon={<Search className="w-4 h-4" />} label="Recruiter Verify" active={pathname === "/dashboard/recruiter"} />
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <nav className="space-y-1">
            <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="font-medium text-xs">Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-24 md:pt-20 px-4 md:px-8 pb-12 relative w-full">
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

