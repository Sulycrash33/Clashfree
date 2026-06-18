'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, XCircle, Clock, Building2, Mail, Phone, Globe, MapPin, RefreshCw, Loader2 } from 'lucide-react'

type Signup = {
  id: string
  institutionName: string
  shortName: string
  type: string
  city: string
  state: string
  website?: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  message?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  rejectionReason?: string
}

const TYPE_LABELS: Record<string, string> = {
  FEDERAL_UNI: 'Federal University', STATE_UNI: 'State University',
  PRIVATE_UNI: 'Private University', POLYTECHNIC: 'Polytechnic',
  MONOTECHNIC: 'Monotechnic', COLLEGE_OF_EDUCATION: 'College of Education',
  SCHOOL_OF_NURSING: 'School of Nursing', HEALTH_TECH: 'School of Health Technology',
}

const STATUS_CONFIG = {
  PENDING: { color: 'bg-accent-gold/20 text-accent-gold border-accent-gold/20', icon: Clock, label: 'Pending' },
  APPROVED: { color: 'bg-success/20 text-success border-success/20', icon: CheckCircle2, label: 'Approved' },
  REJECTED: { color: 'bg-clash/20 text-clash border-clash/20', icon: XCircle, label: 'Rejected' },
}

export default function SignupsPage() {
  const [signups, setSignups] = useState<Signup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/signup?status=${filter}`)
      const data = await res.json()
      setSignups(Array.isArray(data) ? data : [])
    } catch { setSignups([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleApprove = async (id: string) => {
    setProcessing(id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/signup/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFeedback({ type: 'success', msg: 'Institution approved. Login credentials sent.' })
      load()
    } catch (err: unknown) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Failed' })
    } finally { setProcessing(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setProcessing(rejectModal.id)
    try {
      const res = await fetch(`/api/signup/${rejectModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFeedback({ type: 'success', msg: 'Application rejected. Email sent.' })
      setRejectModal(null)
      setRejectReason('')
      load()
    } catch (err: unknown) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Failed' })
    } finally { setProcessing(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Institution Signups</h1>
          <p className="text-muted text-sm">Review and approve institution registration requests</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-foreground/5 border-foreground/10 text-white w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-muted border-foreground/10">
              <SelectItem value="PENDING" className="text-white focus:bg-foreground/10">Pending</SelectItem>
              <SelectItem value="APPROVED" className="text-white focus:bg-foreground/10">Approved</SelectItem>
              <SelectItem value="REJECTED" className="text-white focus:bg-foreground/10">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} className="border-foreground/20 text-white hover:bg-foreground/10 gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert className={feedback.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-clash/10 border-clash/20 text-clash'}>
          <AlertDescription>{feedback.msg}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
      ) : signups.length === 0 ? (
        <Card className="bg-foreground/5 border-foreground/10">
          <CardContent className="py-16 text-center">
            <Building2 className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted">No {filter.toLowerCase()} applications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {signups.map(s => {
            const sc = STATUS_CONFIG[s.status]
            return (
              <Card key={s.id} className="bg-foreground/5 border-foreground/10 hover:border-foreground/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        {s.institutionName}
                        <span className="text-muted font-mono text-sm">({s.shortName})</span>
                      </CardTitle>
                      <p className="text-muted text-sm mt-1">{TYPE_LABELS[s.type] || s.type}</p>
                    </div>
                    <Badge className={`${sc.color} shrink-0`}>{sc.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{s.city}, {s.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.contactEmail}</span>
                    </div>
                    {s.contactPhone && (
                      <div className="flex items-center gap-1.5 text-muted">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{s.contactPhone}</span>
                      </div>
                    )}
                    {s.website && (
                      <div className="flex items-center gap-1.5 text-muted">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <a href={s.website} target="_blank" rel="noreferrer" className="text-secondary hover:underline truncate">{s.website}</a>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-muted">Contact: </span>
                    <span className="text-white">{s.contactName}</span>
                  </div>

                  {s.message && (
                    <div className="bg-muted/50 border border-foreground/5 rounded-lg px-3 py-2 text-sm text-muted italic">
                      "{s.message}"
                    </div>
                  )}

                  {s.rejectionReason && (
                    <div className="bg-clash/10 border border-clash/20 rounded-lg px-3 py-2 text-sm text-clash">
                      <span className="font-medium">Rejection reason: </span>{s.rejectionReason}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">
                      Applied {new Date(s.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {s.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectModal({ id: s.id, name: s.institutionName })}
                          className="border-clash/30 text-clash hover:bg-clash/10 h-8"
                          disabled={processing === s.id}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(s.id)}
                          className="bg-success/20 hover:bg-success/30 text-success border border-success/20 h-8"
                          disabled={processing === s.id}
                        >
                          {processing === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => { setRejectModal(null); setRejectReason('') }}>
        <DialogContent className="bg-muted border-foreground/10 text-white">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted text-sm">Rejecting <strong className="text-white">{rejectModal?.name}</strong>. This will send a rejection email to the applicant.</p>
            <div className="space-y-2">
              <Label className="text-muted">Reason (sent in email)</Label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete information provided. Please reapply with full institution details."
                rows={3}
                className="bg-foreground/5 border-foreground/10 text-white placeholder:text-muted resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)} className="border-foreground/20 text-white hover:bg-foreground/10">Cancel</Button>
            <Button onClick={handleReject} className="bg-clash/20 hover:bg-clash/30 text-clash border border-clash/20" disabled={!!processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
