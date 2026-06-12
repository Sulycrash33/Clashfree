"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, ThemeProvider } from "./ThemeContext";
import { 
  Sun, 
  Moon, 
  User, 
  GraduationCap, 
  Calendar, 
  Sliders, 
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  CalendarClock
} from "lucide-react";

interface DemoLayoutProps {
  children: React.ReactNode;
}

const NAV = [
  { href: "/demo/student", label: "Student Portal", icon: User, color: "text-indigo-500", activeBg: "bg-indigo-500/10 border-indigo-500/20" },
  { href: "/demo/lecturer", label: "Lecturer Portal", icon: GraduationCap, color: "text-emerald-500", activeBg: "bg-emerald-500/10 border-emerald-500/20" },
  { href: "/demo/officer", label: "Timetable Officer", icon: Calendar, color: "text-amber-500", activeBg: "bg-amber-500/10 border-amber-500/20" },
  { href: "/demo/admin", label: "Institution Admin", icon: Sliders, color: "text-rose-500", activeBg: "bg-rose-500/10 border-rose-500/20" },
  { href: "/demo/dashboard", label: "Global Dashboard", icon: LayoutDashboard, color: "text-sky-500", activeBg: "bg-sky-500/10 border-sky-500/20" },
];

function DemoLayoutInner({ children }: DemoLayoutProps) {
  const pathname = usePathname();
  const { isDark: darkMode, toggleDark } = useTheme();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const conflictCount = 2;
  const roleName = pathname.includes("student") ? "Student Workspace" 
                 : pathname.includes("lecturer") ? "Lecturer Workspace"
                 : pathname.includes("officer") ? "Officer Panel"
                 : pathname.includes("admin") ? "Admin Panel"
                 : "Global System Control";

  const roleSubtitle = "Harmattan Term";

  const bg = darkMode ? "bg-[#0a0a0f]" : "bg-gray-50";
  const mainBg = darkMode ? "bg-[#0a0a0f]" : "bg-gray-50";
  const text = darkMode ? "text-white" : "text-gray-900";
  const sub = darkMode ? "text-zinc-400" : "text-gray-500";
  const border = darkMode ? "border-zinc-800" : "border-gray-200";
  const sidebar = darkMode ? "bg-[#111118]" : "bg-white";
  const topbar = darkMode ? "bg-[#0a0a0f]/80" : "bg-white/80";
  const navInactiveText = darkMode ? "text-zinc-400" : "text-gray-600";
  const navHover = darkMode ? "hover:bg-zinc-800/50 hover:text-zinc-200" : "hover:bg-gray-100 hover:text-gray-900";

  return (
    <div className={`min-h-screen ${bg} ${text} flex`}>

      {/* ── Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        border-r ${border} ${sidebar}
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${sidebarCollapsed ? "w-[68px]" : "w-[240px]"}
      `}>
        {/* Logo row */}
        <div className={`h-16 flex items-center px-4 border-b ${border} flex-shrink-0`}>
          <Link href="/demo" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-3.5 h-3.5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${text} truncate`}>ClashFree</div>
                <div className={`text-[10px] ${sub} truncate`}>FEDKO Demo</div>
              </div>
            )}
          </Link>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden md:flex ml-auto ${sub} hover:${text} transition-colors`}>
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setSidebarOpen(false)}
            className={`md:hidden ml-auto ${sub} hover:${text}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role label */}
        {!sidebarCollapsed && (
          <div className={`px-4 py-3 border-b ${border}`}>
            <p className={`text-[10px] font-semibold ${sub} uppercase tracking-widest`}>Switch Role</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-sm
                  ${isActive
                    ? `${item.activeBg} ${item.color} border-opacity-100`
                    : `border-transparent ${navInactiveText} ${navHover}`
                  }
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                title={sidebarCollapsed ? item.label : undefined}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? item.color : ""}`} />
                {!sidebarCollapsed && <span className="truncate font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode toggle + demo badge */}
        {!sidebarCollapsed && (
          <div className={`p-3 border-t ${border} space-y-2`}>
            {/* Working dark mode toggle */}
            <button onClick={toggleDark}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                darkMode
                  ? "bg-violet-500/10 border-violet-400/20 text-violet-300"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              } hover:brightness-110`}>
              {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span className="text-xs font-medium">{darkMode ? "Dark Mode" : "Light Mode"}</span>
              {/* Toggle pill */}
              <div className={`ml-auto w-8 h-4 rounded-full relative transition-colors ${darkMode ? "bg-violet-600" : "bg-amber-300"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>

            {/* Demo badge */}
            <div className={`rounded-xl ${darkMode ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"} border p-3 space-y-1`}>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-500">Demo Mode</span>
              </div>
              <p className={`text-[11px] ${darkMode ? "text-white/40" : "text-gray-500"} leading-relaxed`}>
                FEDKO — fictional institution for presentation use only.
              </p>
              <Link href="/demo"
                className="text-[11px] text-amber-500 hover:text-amber-600 underline transition-colors">
                ← Back to role picker
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area */}
      <div className={`
        flex-1 flex flex-col min-h-screen transition-all duration-300 ${mainBg}
        ${sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"}
      `}>
        {/* Topbar */}
        <header className={`h-16 border-b ${border} ${topbar} backdrop-blur-md sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-4`}>
          <button onClick={() => setSidebarOpen(true)}
            className={`md:hidden ${sub} hover:${text} transition-colors`}>
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400">{conflictCount} Conflict{conflictCount > 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Dark mode quick toggle in topbar */}
          <button onClick={toggleDark}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
              darkMode
                ? "bg-violet-500/10 border-violet-400/20 text-violet-300"
                : "bg-amber-50 border-amber-200 text-amber-700"
            } hover:brightness-110`}>
            {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium hidden sm:block">{darkMode ? "Dark" : "Light"}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
