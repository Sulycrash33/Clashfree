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
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  ERROR: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  SCHEDULE_CHANGE: { icon: Bell, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  CONFLICT_DETECTED: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  APPROVAL_REQUIRED: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
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
          className="relative text-slate-400 hover:text-white"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 bg-slate-900 border-white/10 text-white p-0"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
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
                    className={`p-3 hover:bg-white/5 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-white/[0.02]' : ''
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
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
          <div className="p-3 border-t border-white/10">
            <button className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300">
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
    >
      <AlertTriangle className="w-4 h-4" />
      <span className="font-medium">{count} Conflict{count !== 1 ? 's' : ''}</span>
      {critical > 0 && (
        <Badge className="bg-red-500 text-white text-xs ml-1">{critical} Critical</Badge>
      )}
    </button>
  )
}
