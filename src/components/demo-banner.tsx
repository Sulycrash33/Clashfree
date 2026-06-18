"use client";

import Link from "next/link";
import { Sparkles, ChevronRight, Building2 } from "lucide-react";

// ─────────────────────────────────────────────
// Drop this component below the login form on
// the main ClashFree landing / login page.
// Remove when FEDKO demo is no longer needed.
// ─────────────────────────────────────────────

export function DemoBanner() {
  return (
    <div className="w-full mt-6">
      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/25 font-medium">or explore the demo</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <Link
        href="/demo"
        className="
          group flex items-center justify-between gap-3 w-full
          px-4 py-3.5 rounded-2xl
          border border-dashed border-primary/30
          bg-primary/5 hover:bg-primary/10
          transition-all duration-200
        "
      >
        <div className="flex items-center gap-3">
          {/* Animated sparkle */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/40 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">FEDKO Live Demo</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 border border-primary/20 text-primary">
                PREVIEW
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/40">Federal University of Konoha · Full populated demo</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>
    </div>
  );
}
