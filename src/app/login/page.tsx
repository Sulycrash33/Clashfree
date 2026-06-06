'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { setDemoCookie } from '@/lib/demo'
import { Loader2, Mail, Lock, ArrowLeft, Shield, Building2, Calendar, BookOpen, GraduationCap } from 'lucide-react'

const demoAccounts = [
  {
    id: 'SA',
    title: 'Super Admin',
    subtitle: 'Platform Control',
    email: 'admin@clashfree.com',
    password: 'admin123',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    description: 'Full platform management. All institutions, users, system health, global settings.',
  },
  {
    id: 'IA',
    title: 'Institution Admin',
    subtitle: 'Institution Scope',
    email: 'admin@fedko.edu.ng',
    password: 'admin123',
    icon: Building2,
    color: 'from-blue-500 to-cyan-500',
    description: 'Full control within your institution. Setup, generation, approval, publication.',
  },
  {
    id: 'TO',
    title: 'Timetable Officer',
    subtitle: 'Faculty Scope',
    email: 'officer@fedko.edu.ng',
    password: 'admin123',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500',
    description: 'Manage scheduling data within assigned faculty. Submit for admin approval.',
  },
  {
    id: 'LC',
    title: 'Lecturer',
    subtitle: 'Personal View',
    email: 'lecturer@fedko.edu.ng',
    password: 'admin123',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    description: 'View personal schedule, set availability, see invigilation assignments.',
  },
  {
    id: 'ST',
    title: 'Student',
    subtitle: 'Personal Timetable',
    email: 'student@fedko.edu.ng',
    password: 'admin123',
    icon: GraduationCap,
    color: 'from-amber-500 to-yellow-500',
    description: 'View personal exam timetable with carry-over courses and venue assignments.',
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const initialPassword = searchParams.get('password') || ''

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoDialogOpen, setDemoDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleDemoSelect = (account: typeof demoAccounts[0]) => {
    setEmail(account.email)
    setPassword(account.password)
    setDemoDialogOpen(false)
    // Set demo mode cookie so dashboard knows to lock down
    setDemoCookie()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xl">
            CF
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ClashFree
            </h1>
            <p className="text-xs text-slate-400">Academic Scheduling Platform</p>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@clashfree.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400">
                  <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                  Remember me
                </label>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Account Button */}
            <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Demo Account (FEDKO)
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Choose Demo Access</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Select a role to explore the platform. All accounts use password: <code className="text-cyan-400">admin123</code>
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleDemoSelect(account)}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center flex-shrink-0`}>
                        <account.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{account.title}</span>
                          <span className="text-xs text-slate-500">({account.id})</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{account.email}</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-500 rotate-180 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{' '}
          <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
