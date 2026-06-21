import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
}

export function StatusBadge({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}: StatusBadgeProps) {
  return (
    <Badge className={isActive ? 'bg-success/10 text-success' : 'bg-clash/10 text-clash'}>
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
