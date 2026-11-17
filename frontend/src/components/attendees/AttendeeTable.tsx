import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Upload,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  Mail,
  Utensils,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AddAttendeeModal } from '@/components/attendees/AddAttendeeModal'
import { ImportCsvModal } from '@/components/attendees/ImportCsvModal'
import {
  fetchAttendees,
  deleteAttendee,
  updateAttendee,
  type AttendeeItem,
} from '@/lib/api'

interface AttendeeTableProps {
  eventId: string
  isOrganizer?: boolean
}

// Color schemes for roles
const ROLE_BADGES: Record<string, string> = {
  Organizer: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
  'Co-host': 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20',
  Speaker: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  Volunteer: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
  Vendor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  Guest: 'bg-stone-100 text-stone-700 ring-1 ring-stone-600/20',
}

// Color schemes for RSVP statuses
const STATUS_BADGES: Record<string, string> = {
  attending: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  maybe: 'bg-amber-50 text-amber-700 border-amber-300',
  declined: 'bg-rose-50 text-rose-700 border-rose-300',
  pending: 'bg-stone-100 text-stone-600 border-stone-200',
}

export function AttendeeTable({ eventId }: AttendeeTableProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [editingAttendee, setEditingAttendee] = useState<AttendeeItem | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  // Fetch attendees
  const { data: attendees = [], isLoading } = useQuery<AttendeeItem[]>({
    queryKey: ['attendees', eventId, statusFilter, roleFilter, search],
    queryFn: () =>
      fetchAttendees(eventId, {
        rsvp_status: statusFilter === 'all' ? undefined : statusFilter,
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: search.trim() || undefined,
      }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (attendeeId: string) => deleteAttendee(eventId, attendeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Quick inline RSVP status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAttendee(eventId, id, { rsvp_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const handleDelete = (attendee: AttendeeItem) => {
    if (window.confirm(`Remove ${attendee.name} from this event?`)) {
      deleteMutation.mutate(attendee.id)
    }
  }

  const handleEdit = (attendee: AttendeeItem) => {
    setEditingAttendee(attendee)
    setIsAddModalOpen(true)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['attendees', eventId] })
    queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar: Search & Action Buttons ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-8 pr-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs font-medium focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          >
            <option value="all">All RSVP Statuses</option>
            <option value="attending">✓ Attending</option>
            <option value="maybe">? Maybe</option>
            <option value="declined">✗ Declined</option>
            <option value="pending">○ Pending</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs font-medium focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          >
            <option value="all">All Roles</option>
            <option value="Organizer">Organizer</option>
            <option value="Co-host">Co-host</option>
            <option value="Speaker">Speaker</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Guest">Guest</option>
            <option value="Vendor">Vendor</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCsvModalOpen(true)}
            className="gap-1.5 text-xs h-9"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingAttendee(null)
              setIsAddModalOpen(true)
            }}
            className="gap-1.5 text-xs h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Guest</span>
          </Button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                <th className="py-3 px-4">Attendee</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">RSVP Status</th>
                <th className="py-3 px-4">Dietary Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-32 bg-stone-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-40 bg-stone-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-stone-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-stone-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-24 bg-stone-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 w-12 bg-stone-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                    <p className="mt-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                      No attendees found
                    </p>
                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                      {search || statusFilter !== 'all' || roleFilter !== 'all'
                        ? 'Try clearing your filters or search keywords.'
                        : 'Add attendees manually or import your guest roster from CSV.'}
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingAttendee(null)
                          setIsAddModalOpen(true)
                        }}
                        className="text-xs"
                      >
                        Add First Guest
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsCsvModalOpen(true)}
                        className="text-xs"
                      >
                        Import CSV
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                attendees.map((attendee) => {
                  const initial = attendee.name.charAt(0).toUpperCase()
                  const roleBadgeClass = ROLE_BADGES[attendee.role] || ROLE_BADGES.Guest
                  const statusBadgeClass = STATUS_BADGES[attendee.rsvp_status] || STATUS_BADGES.pending

                  return (
                    <tr
                      key={attendee.id}
                      className="transition-colors hover:bg-[hsl(var(--surface)/0.6)]"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 text-[11px]">
                            <AvatarFallback>{initial}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-[hsl(var(--foreground))]">
                              {attendee.name}
                            </span>
                            {attendee.notes && (
                              <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate max-w-[200px]">
                                {attendee.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 group">
                          <Mail className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                          <span className="font-mono text-[11px] text-[hsl(var(--foreground))]">
                            {attendee.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(attendee.email)}
                            title="Copy email address"
                            className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-[hsl(var(--accent))]"
                          >
                            {copiedEmail === attendee.email ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${roleBadgeClass}`}
                        >
                          {attendee.role}
                        </span>
                      </td>

                      {/* RSVP Status Inline Select */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <select
                            value={attendee.rsvp_status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({
                                id: attendee.id,
                                status: e.target.value,
                              })
                            }
                            className={`appearance-none rounded-md border py-0.5 pl-2 pr-6 text-[10px] font-bold cursor-pointer transition ${statusBadgeClass}`}
                          >
                            <option value="attending">✓ Attending</option>
                            <option value="maybe">? Maybe</option>
                            <option value="declined">✗ Declined</option>
                            <option value="pending">○ Pending</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-2 h-2.5 w-2.5 opacity-60" />
                        </div>
                      </td>

                      {/* Dietary Preferences */}
                      <td className="py-3 px-4">
                        {attendee.dietary_preferences ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            <Utensils className="h-2.5 w-2.5" />
                            <span>{attendee.dietary_preferences}</span>
                          </span>
                        ) : (
                          <span className="text-[hsl(var(--muted-foreground))]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(attendee)}
                            className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                            title="Edit attendee"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(attendee)}
                            className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                            title="Remove from roster"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddAttendeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        eventId={eventId}
        attendeeToEdit={editingAttendee}
        onSuccess={handleRefresh}
      />

      <ImportCsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        eventId={eventId}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
