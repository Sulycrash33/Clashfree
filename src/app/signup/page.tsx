'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, CheckCircle2, Loader2, Mail, Phone, Globe, MapPin } from 'lucide-react'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara'
]

const INST_TYPES = [
  { value: 'FEDERAL_UNI', label: 'Federal University' },
  { value: 'STATE_UNI', label: 'State University' },
  { value: 'PRIVATE_UNI', label: 'Private University' },
  { value: 'POLYTECHNIC', label: 'Polytechnic' },
  { value: 'MONOTECHNIC', label: 'Monotechnic' },
  { value: 'COLLEGE_OF_EDUCATION', label: 'College of Education' },
  { value: 'SCHOOL_OF_NURSING', label: 'School of Nursing' },
  { value: 'HEALTH_TECH', label: 'School of Health Technology' },
]

export default function SignupPage() {
  const [form, setForm] = useState({
    institutionName: '', shortName: '', type: '', city: '', state: '',
    website: '', emailDomain: '', contactName: '', contactEmail: '',
    contactPhone: '', message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Application Submitted!</h1>
            <p className="text-slate-400">
              We've received your application for <strong className="text-white">{form.institutionName}</strong>.
              Check <strong className="text-cyan-400">{form.contactEmail}</strong> for a confirmation email.
              We'll review and respond within 48 hours.
            </p>
          </div>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Animated blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Logo + heading */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xl">
            CF
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ClashFree</h1>
            <p className="text-xs text-slate-400">Academic Scheduling Platform</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Register Your Institution</h2>
          <p className="text-slate-400">Fill in the details below. Our team will review and set up your account within 48 hours.</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">Free to apply</Badge>
            <Badge variant="outline" className="border-slate-500/30 text-slate-400 text-xs">48hr review</Badge>
            <Badge variant="outline" className="border-slate-500/30 text-slate-400 text-xs">Nigerian institutions only</Badge>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 text-red-400 mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institution Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" /> Institution Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-slate-300">Full Institution Name *</Label>
                  <Input
                    value={form.institutionName}
                    onChange={e => set('institutionName', e.target.value)}
                    placeholder="e.g. Federal University of Technology Minna"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Short Code / Acronym *</Label>
                  <Input
                    value={form.shortName}
                    onChange={e => set('shortName', e.target.value.toUpperCase())}
                    placeholder="e.g. FUTMINNA"
                    maxLength={20}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Institution Type *</Label>
                  <Select value={form.type} onValueChange={v => set('type', v)} required>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-cyan-500">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {INST_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-white focus:bg-white/10">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">City *</Label>
                  <Input
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="e.g. Minna"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">State *</Label>
                  <Select value={form.state} onValueChange={v => set('state', v)} required>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-cyan-500">
                      <SelectValue placeholder="Select state..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 max-h-60 overflow-y-auto">
                      {NIGERIAN_STATES.map(s => (
                        <SelectItem key={s} value={s} className="text-white focus:bg-white/10">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Website
                    <span className="text-slate-500 text-xs">(optional)</span>
                  </Label>
                  <Input
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://yourschool.edu.ng"
                    type="url"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Email Domain <span className="text-slate-500 text-xs">(optional)</span>
                  </Label>
                  <Input
                    value={form.emailDomain}
                    onChange={e => set('emailDomain', e.target.value)}
                    placeholder="e.g. futminna.edu.ng"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" /> Contact Person
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                This person will become the Institution Admin (IA) on approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Full Name *</Label>
                  <Input
                    value={form.contactName}
                    onChange={e => set('contactName', e.target.value)}
                    placeholder="e.g. Dr. Amina Bello"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={form.contactEmail}
                      onChange={e => set('contactEmail', e.target.value)}
                      type="email"
                      placeholder="admin@yourschool.edu.ng"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                    <span className="text-slate-500 text-xs">(optional)</span>
                  </Label>
                  <Input
                    value={form.contactPhone}
                    onChange={e => set('contactPhone', e.target.value)}
                    placeholder="+234 803 000 0000"
                    type="tel"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Why do you want ClashFree? <span className="text-slate-500 text-xs">(optional)</span>
                </Label>
                <Textarea
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Tell us about your current scheduling challenges..."
                  rows={3}
                  maxLength={1000}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 resize-none"
                />
                <p className="text-slate-500 text-xs text-right">{form.message.length}/1000</p>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-base"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              'Submit Application →'
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
