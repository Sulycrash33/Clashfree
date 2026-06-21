import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = 'text-primary' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`w-8 h-8 animate-spin ${className}`} />
    </div>
  )
}
