'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { ColumnDef } from '@tanstack/react-table'
import { MapPin, MoreHorizontal, Pencil, Trash2, Loader2, Users, Monitor, Snowflake } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

interface Room {
  id: string
  code: string
  name: string
  building?: string
  capacity: number
  type: string
  hasProjector: boolean
  hasAC: boolean
  hasComputers: boolean
  isAccessible: boolean
  isActive: boolean
  institutionId: string
  facultyId?: string
  faculty?: { name: string; code: string }
  createdAt: string
}

interface Faculty {
  id: string
  name: string
  code: string
}

const roomTypes: Record<string, string> = {
  LECTURE_HALL: 'Lecture Hall',
  AUDITORIUM: 'Auditorium',
  CLASSROOM: 'Classroom',
  LABORATORY: 'Laboratory',
  COMPUTER_LAB: 'Computer Lab',
  EXAM_HALL: 'Exam Hall',
  OUTDOOR: 'Outdoor',
}

export default function RoomsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    building: '',
    capacity: '100',
    type: 'CLASSROOM',
    hasProjector: false,
    hasAC: false,
    hasComputers: false,
    isAccessible: true,
    facultyId: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [roomRes, facRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/faculties'),
      ])
      if (roomRes.ok) setRooms(await roomRes.json())
      if (facRes.ok) setFaculties(await facRes.json())
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room)
      setFormData({
        code: room.code,
        name: room.name,
        building: room.building || '',
        capacity: room.capacity.toString(),
        type: room.type,
        hasProjector: room.hasProjector,
        hasAC: room.hasAC,
        hasComputers: room.hasComputers,
        isAccessible: room.isAccessible,
        facultyId: room.facultyId || '',
      })
    } else {
      setEditingRoom(null)
      setFormData({
        code: '',
        name: '',
        building: '',
        capacity: '100',
        type: 'CLASSROOM',
        hasProjector: false,
        hasAC: false,
        hasComputers: false,
        isAccessible: true,
        facultyId: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
          facultyId: formData.facultyId || null,
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `Room ${editingRoom ? 'updated' : 'created'} successfully` })
        setDialogOpen(false)
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Room deleted' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-clash/20 text-clash font-mono">
          {row.getValue('code')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Room Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-clash/20 to-clash/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-clash" />
          </div>
          <div>
            <div className="font-medium text-white">{row.getValue('name')}</div>
            <div className="text-xs text-muted">
              {row.original.building || 'No building'} • {row.original.faculty?.code || 'Central'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-foreground/10 text-muted">
          {roomTypes[row.getValue('type') as string] || row.getValue('type')}
        </Badge>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted">
          <Users className="w-4 h-4" />
          <span>{row.getValue('capacity')}</span>
        </div>
      ),
    },
    {
      id: 'features',
      header: 'Features',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.hasProjector && (
            <div className="w-6 h-6 rounded bg-secondary/10 flex items-center justify-center" title="Projector">
              <Monitor className="w-3 h-3 text-secondary" />
            </div>
          )}
          {row.original.hasAC && (
            <div className="w-6 h-6 rounded bg-secondary/10 flex items-center justify-center" title="AC">
              <Snowflake className="w-3 h-3 text-secondary" />
            </div>
          )}
          {row.original.hasComputers && (
            <Badge className="bg-primary/10 text-primary text-xs">Lab</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={row.getValue('isActive') ? 'bg-success/10 text-success' : 'bg-clash/10 text-clash'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-muted border-foreground/10">
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)} className="text-muted">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-clash">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (!['SA', 'IA', 'TO', 'LC'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-clash/10 border-clash/20">
        <AlertDescription className="text-clash">Access denied.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Venues"
        description="Manage lecture halls, labs, and exam venues"
        actionLabel="Add Room"
        onAction={() => handleOpenDialog()}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-clash" />
            </div>
          ) : (
            <DataTable columns={columns} data={rooms} searchKey="name" searchPlaceholder="Search rooms..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            <DialogDescription className="text-muted">
              {editingRoom ? 'Update room details' : 'Add a new venue'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted">Room Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-white font-mono"
                  placeholder="e.g., MPH, LT1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted">Room Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {Object.entries(roomTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted">Room Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-white"
                placeholder="e.g., Multi-Purpose Hall"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted">Building</Label>
                <Input
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-white"
                  placeholder="e.g., Block A"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted">Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-white"
                  placeholder="e.g., 500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted">Faculty (Optional - leave empty for central)</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v })}>
                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-white">
                  <SelectValue placeholder="Central / All Faculties" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10">
                  <SelectItem value="" className="text-white">Central / All Faculties</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-white">{f.name} ({f.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted">Projector</Label>
                <Switch checked={formData.hasProjector} onCheckedChange={(v) => setFormData({ ...formData, hasProjector: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted">AC</Label>
                <Switch checked={formData.hasAC} onCheckedChange={(v) => setFormData({ ...formData, hasAC: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted">Computers</Label>
                <Switch checked={formData.hasComputers} onCheckedChange={(v) => setFormData({ ...formData, hasComputers: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted">Accessible</Label>
                <Switch checked={formData.isAccessible} onCheckedChange={(v) => setFormData({ ...formData, isAccessible: v })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-clash to-clash">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingRoom ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
