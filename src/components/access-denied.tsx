import { Alert, AlertDescription } from '@/components/ui/alert'

interface AccessDeniedProps {
  message?: string
}

export function AccessDenied({ message = 'Access denied.' }: AccessDeniedProps) {
  return (
    <Alert className="bg-clash/10 border-clash/20">
      <AlertDescription className="text-clash">{message}</AlertDescription>
    </Alert>
  )
}
