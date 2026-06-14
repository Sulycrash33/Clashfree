import type { ReactNode } from "react";

// This layout wraps ALL /demo/* pages.
// The DemoLayout shell (sidebar+topbar) is applied per-page
// so each dashboard can pass its own role metadata.
// This file just sets the base bg so there's no flash.

export const metadata = {
  title: "ScheduleFlex — FEDKO Live Demo",
  description:
    "Federal University of Konoha demo environment — for investor and stakeholder presentations. Not linked to production data.",
};

export default function DemoRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      {children}
    </div>
  );
}
