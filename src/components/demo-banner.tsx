'use client'

import { Shield, X } from 'lucide-react'
import { useState } from 'react'

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
      <Shield className="w-4 h-4" />
      <span>DEMO MODE — This is a read-only investor showcase. Navigation between views is enabled, but all actions are locked.</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
