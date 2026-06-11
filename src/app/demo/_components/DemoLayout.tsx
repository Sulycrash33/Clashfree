"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  CalendarClock,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────
// Nav items
// ─────────────────────────────────────────────
const NAV = [
  {
    href: "/demo/super-admin",
    label: "Super Admin",
    icon: ShieldCheck,
    color: "text-violet-400",
    activeBg: "bg-violet-500/15 border-violet-400/30",
  },
  {
    href: "/demo/institution-admin",
    label: "Institution Admin",
    icon: Building2,
    color: "text-sky-400",
    activeBg: "bg-sky-500/15 border-sky-400/30",
  },
  {
    href: "/demo/timetable-officer",
    label: "Timetable Officer",
    icon: CalendarClock,
    color: "text-amber-400",
    activeBg: "bg-amber-500/15 border-amber-400/30",
  },
  {
    href: "/demo/lecturer",
    label: "Lecturer",
    icon: GraduationCap,
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/15 border-emerald-400/30",
  },
  {
    href: "/demo/student",
    label: "Student",
    icon: BookOpen,
    color: "text-rose-400",
    activeBg: "bg-rose-500/15 border-rose-400/30",
  },
];

// ─────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────
interface DemoLayoutProps {
  children: ReactNode;
  activeRole?: string;
  roleName?: string;
  roleSubtitle?: string;
  conflictCount?: number;
}

export function DemoLayout({
  children,
  activeRole,
  roleName,
  roleSubtitle,
  conflictCount = 0,
}: DemoLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">

      {/* ── Mobile overlay ─────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          border-r border-white/10 bg-[#0d0d14]
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarCollapsed ? "w-[68px]" : "w-[240px]"}
        `}
      >
        {/* Logo row */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 flex-shrink-0">
          <Link href="/demo" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-3.5 h-3.5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">ClashFree</div>
                <div className="text-[10px] text-white/40 truncate">FEDKO Demo</div>
              </div>
            )}
          </Link>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex ml-auto text-white/30 hover:text-white/70 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto text-white/30 hover:text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role label */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
              Switch Role
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-sm
                  ${isActive
                    ? `${item.activeBg} ${item.color} border-opacity-100`
                    : "border-transparent text-white/50 hover:text-white/80 hover:bg-white/5"
                  }
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? item.color : ""}`} />
                {!sidebarCollapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Demo badge */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/10">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">Demo Mode</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                FEDKO — fictional institution for presentation use only.
              </p>
              <Link
                href="/demo"
                className="text-[11px] text-amber-400/70 hover:text-amber-400 underline transition-colors"
              >
                ← Back to role picker
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area ──────────────────────────── */}
      <div
        className={`
          flex-1 flex flex-col min-h-screen transition-all duration-300
          ${sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"}
        `}
      >
        {/* Topbar */}
        <header className="h-16 border-b border-white/10 bg-[#0d0d14]/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-white/50 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Role info */}
          <div className="flex-1 min-w-0">
            {roleName && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">{roleName}</span>
                {roleSubtitle && (
                  <>
                    <span className="text-white/20 text-sm">·</span>
                    <span className="text-white/40 text-sm truncate hidden sm:block">{roleSubtitle}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Conflict badge */}
          {conflictCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400">
                {conflictCount} Conflict{conflictCount > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Demo pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium">FEDKO Live Demo</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
