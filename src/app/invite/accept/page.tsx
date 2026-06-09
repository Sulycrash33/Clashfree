'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, Lock, User, AlertTriangle, Building2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  IA: 'Institution Admin', TO: 'Timetable Officer', LC: 'Lecturer', ST: 'Student',
}

type InviteInfo = {
  valid: boolean
  email?: string
  role?: string
  institutionName?: string | null
  expiresAt?: string
  error?: string
}

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' })

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`/api/invites/accept?token=${token}`)
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setInfo({ valid: false, error: 'Failed to validate token' }))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!token || !info?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold">Invalid or Expired Link</h2>
          <p className="text-slate-400">{info?.error || 'This invite link is no longer valid. Contact your administrator for a new invite.'}</p>
          <Link href="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold">Account Created!</h2>
          <p className="text-slate-400">Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xl">CF</div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ClashFree</h1>
            <p className="text-xs text-slate-400">Academic Scheduling Platform</p>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
            <CardDescription className="text-slate-400">
              Set up your account to join ClashFree.
            </CardDescription>
            {info.institutionName && (
              <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Institution</p>
                  <p className="text-sm text-white font-medium">{info.institutionName}</p>
                </div>
                <Badge className="ml-auto bg-cyan-500/20 text-cyan-300 border-cyan-500/20 text-xs">
                  {ROLE_LABELS[info.role!] || info.role}
                </Badge>
              </div>
            )}
            <div className="text-sm text-slate-400">
              Email: <span className="text-white font-medium">{info.email}</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Your Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Dr. Amina Bello"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    type="password"
                    placeholder="Min 8 characters"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    type="password"
                    placeholder="Repeat password"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white h-11"
                disabled={submitting}
              >
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : 'Create My Account →'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>}><AcceptInviteForm /></Suspense>
}
