'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, CheckCircle, Info, AlertCircle, X, Loader2 } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SCHEDULE_CHANGE' | 'CONFLICT_DETECTED' | 'APPROVAL_REQUIRED'
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

interface NotificationBadgeProps {
  count?: number
  maxDisplay?: number
}

const typeConfig = {
  INFO: { icon: Info, color: 'text-secondary', bg: 'bg-secondary/20' },
  WARNING: { icon: AlertTriangle, color: 'text-accent-gold', bg: 'bg-accent-gold/20' },
  ERROR: { icon: AlertCircle, color: 'text-clash', bg: 'bg-clash/20' },
  SUCCESS: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/20' },
  SCHEDULE_CHANGE: { icon: Bell, color: 'text-primary', bg: 'bg-primary/20' },
  CONFLICT_DETECTED: { icon: AlertTriangle, color: 'text-clash', bg: 'bg-clash/20' },
  APPROVAL_REQUIRED: { icon: AlertCircle, color: 'text-accent-gold', bg: 'bg-accent-gold/20' },
}

export function NotificationBadge({ count = 0, maxDisplay = 5 }: NotificationBadgeProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length || count

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted hover:text-white"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-clash text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 bg-muted border-foreground/10 text-white p-0"
      >
        <div className="flex items-center justify-between p-4 border-b border-foreground/10">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-secondary hover:text-secondary"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-muted">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.slice(0, maxDisplay).map((notification) => {
                const config = typeConfig[notification.type]
                const Icon = config.icon
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-foreground/5 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-foreground/[0.03]' : ''
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? 'text-white' : 'text-muted'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {notifications.length > maxDisplay && (
          <div className="p-3 border-t border-foreground/10">
            <button className="w-full text-center text-sm text-secondary hover:text-secondary">
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Conflict count badge
interface ConflictBadgeProps {
  count: number
  critical?: number
  warnings?: number
  onClick?: () => void
}

export function ConflictBadge({ count, critical = 0, warnings = 0, onClick }: ConflictBadgeProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-clash/10 border border-clash/20 text-clash hover:bg-clash/20 transition-colors"
    >
      <AlertTriangle className="w-4 h-4" />
      <span className="font-medium">{count} Conflict{count !== 1 ? 's' : ''}</span>
      {critical > 0 && (
        <Badge className="bg-clash text-white text-xs ml-1">{critical} Critical</Badge>
      )}
    </button>
  )
}
