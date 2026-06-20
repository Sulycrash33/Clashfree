"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck, Building2, CalendarClock, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, Menu, X, AlertTriangle, Sparkles,
  Moon, Sun, LogOut,
} from "lucide-react";
import { ThemeProvider, useTheme } from "./ThemeContext";

const NAV = [
  { href: "/demo/super-admin",       label: "Super Admin",       icon: ShieldCheck,   color: "text-[#8C7FD8]",  activeBg: "bg-[#4A3D8F]/15 border-[#4A3D8F]/30" },
  { href: "/demo/institution-admin", label: "Institution Admin", icon: Building2,     color: "text-[#E08A52]",     activeBg: "bg-[#BD5B2C]/15 border-[#BD5B2C]/30" },
  { href: "/demo/timetable-officer", label: "Timetable Officer", icon: CalendarClock, color: "text-[#D7A33B]",   activeBg: "bg-[#D7A33B]/15 border-[#D7A33B]/30" },
  { href: "/demo/lecturer",          label: "Lecturer",          icon: GraduationCap, color: "text-[#6F9A6A]", activeBg: "bg-[#4F7A4B]/15 border-[#4F7A4B]/30" },
  { href: "/demo/student",           label: "Student",           icon: BookOpen,      color: "text-[#B98777]",    activeBg: "bg-[#8B5A4D]/15 border-[#8B5A4D]/30" },
];

interface DemoLayoutProps {
  children: ReactNode;
  activeRole?: string;
  roleName?: string;
  roleSubtitle?: string;
  conflictCount?: number;
}

function DemoLayoutInner({ children, activeRole, roleName, roleSubtitle, conflictCount = 0 }: DemoLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { darkMode, toggleDark } = useTheme();

  const bg      = darkMode ? "bg-[#110B27]"    : "bg-[#FAF8FF]";
  const sidebar  = darkMode ? "bg-[#1C1638]"    : "bg-white";
  const border   = darkMode ? "border-[#3A3163]" : "border-[#E4DEF5]";
  const text     = darkMode ? "text-[#F5F3FA]"       : "text-[#1C1638]";
  const sub      = darkMode ? "text-[#9089B8]"    : "text-[#6B6190]";
  const topbar   = darkMode ? "bg-[#1C1638]/80" : "bg-white/90";
  const navHover = darkMode ? "hover:bg-[#241D45]": "hover:bg-[#F0EDFB]";
  const navInactiveText = darkMode ? "text-[#9089B8]" : "text-[#6B6190]";

  return (
    <div className={`min-h-screen ${bg} ${text} flex ${darkMode ? "dark" : "light-override"}`}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col border-r ${border} ${sidebar} transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${sidebarCollapsed ? "w-[68px]" : "w-[240px]"}`}>
        <div className={`h-16 flex items-center px-4 border-b ${border} flex-shrink-0`}>
          <Link href="/demo" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4A3D8F] to-[#BD5B2C] flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-3.5 h-3.5 text-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${text} truncate`}>ScheduleFlex</div>
                <div className={`text-[10px] ${sub} truncate`}>FEDKO Demo</div>
              </div>
            )}
          </Link>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`hidden md:flex ml-auto ${sub} transition-colors`}>
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setSidebarOpen(false)} className={`md:hidden ml-auto ${sub}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className={`px-4 py-3 border-b ${border}`}>
            <p className={`text-[10px] font-semibold ${sub} uppercase tracking-widest`}>Switch Role</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-sm ${isActive ? `${item.activeBg} ${item.color} border-opacity-100` : `border-transparent ${navInactiveText} ${navHover}`} ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? item.color : ""}`} />
                {!sidebarCollapsed && <span className="truncate font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className={`p-3 border-t ${border} space-y-2`}>
            <button onClick={toggleDark}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${darkMode ? "bg-[#4A3D8F]/10 border-[#4A3D8F]/20 text-[#A89BE0]" : "bg-[#FDF6E8] border-[#D7A33B]/30 text-[#8A6618]"} hover:brightness-110`}>
              {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span className="text-xs font-medium">{darkMode ? "Dark Mode" : "Light Mode"}</span>
              <div className={`ml-auto w-8 h-4 rounded-full relative transition-colors ${darkMode ? "bg-[#4A3D8F]" : "bg-[#D7A33B]"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
            <div className={`rounded-xl ${darkMode ? "bg-[#D7A33B]/10 border-[#D7A33B]/20" : "bg-[#FDF6E8] border-[#D7A33B]/30"} border p-3 space-y-1`}>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D7A33B]" />
                <span className="text-xs font-semibold text-[#D7A33B]">Demo Mode</span>
              </div>
              <p className={`text-[11px] ${darkMode ? "text-[#9089B8]" : "text-[#6B6190]"} leading-relaxed`}>
                FEDKO — fictional institution for presentation use only.
              </p>
              <Link href="/demo" className="text-[11px] text-[#D7A33B] hover:text-[#BD5B2C] underline transition-colors">
                ← Back to role picker
              </Link>
            </div>
          </div>
        )}
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${darkMode ? "" : "bg-[#FAF8FF]"} ${sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"}`}>
        <header className={`h-16 border-b ${border} ${topbar} backdrop-blur-md sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-4`}>
          <button onClick={() => setSidebarOpen(true)} className={`md:hidden ${sub} transition-colors`}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            {roleName && (
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${text} text-sm truncate`}>{roleName}</span>
                {roleSubtitle && (
                  <>
                    <span className={`${sub} text-sm`}>·</span>
                    <span className={`${sub} text-sm truncate hidden sm:block`}>{roleSubtitle}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {conflictCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#9C3B30]/15 border border-[#9C3B30]/30">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E8857A]" />
              <span className="text-xs font-semibold text-[#E8857A]">{conflictCount} Conflict{conflictCount > 1 ? "s" : ""}</span>
            </div>
          )}

          <button onClick={toggleDark}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${darkMode ? "bg-[#4A3D8F]/10 border-[#4A3D8F]/20 text-[#A89BE0]" : "bg-[#FDF6E8] border-[#D7A33B]/30 text-[#8A6618]"} hover:brightness-110`}>
            {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium hidden sm:block">{darkMode ? "Dark" : "Light"}</span>
          </button>

          <Link href="/demo"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${darkMode ? "bg-[#9C3B30]/10 border-[#9C3B30]/20 text-[#E8857A]" : "bg-[#FBEAE7] border-[#9C3B30]/30 text-[#9C3B30]"} hover:brightness-110`}>
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:block">Exit Demo</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4F7A4B]/10 border border-[#4F7A4B]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6F9A6A] animate-pulse" />
            <span className="text-[11px] text-[#6F9A6A] font-medium">FEDKO Live Demo</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DemoLayout(props: DemoLayoutProps) {
  return (
    <ThemeProvider>
      <DemoLayoutInner {...props} />
    </ThemeProvider>
  );
}
