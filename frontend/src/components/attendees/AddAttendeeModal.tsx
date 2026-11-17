import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createAttendee,
  updateAttendee,
  type AttendeeItem,
  type AttendeeCreateInput,
} from '@/lib/api'

interface AddAttendeeModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  attendeeToEdit?: AttendeeItem | null
  onSuccess: () => void
}

const ROLES = ['Guest', 'Co-host', 'Speaker', 'Volunteer', 'Organizer', 'Vendor']
const RSVP_STATUSES = [
  { value: 'pending', label: 'Pending (No response yet)' },
  { value: 'attending', label: 'Attending (Confirmed)' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'declined', label: 'Declined' },
]

export function AddAttendeeModal({
  isOpen,
  onClose,
  eventId,
  attendeeToEdit,
  onSuccess,
}: AddAttendeeModalProps) {
  const isEditing = Boolean(attendeeToEdit)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Guest')
  const [dietary, setDietary] = useState('')
  const [rsvpStatus, setRsvpStatus] = useState('pending')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (attendeeToEdit) {
      setName(attendeeToEdit.name || '')
      setEmail(attendeeToEdit.email || '')
      setRole(attendeeToEdit.role || 'Guest')
      setDietary(attendeeToEdit.dietary_preferences || '')
      setRsvpStatus(attendeeToEdit.rsvp_status || 'pending')
      setNotes(attendeeToEdit.notes || '')
    } else {
      setName('')
      setEmail('')
      setRole('Guest')
      setDietary('')
      setRsvpStatus('pending')
      setNotes('')
    }
    setErrorMsg(null)
  }, [attendeeToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please enter both name and email.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    const payload: AttendeeCreateInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      dietary_preferences: dietary.trim() || undefined,
      rsvp_status: rsvpStatus,
      notes: notes.trim() || undefined,
    }

    try {
      if (isEditing && attendeeToEdit) {
        await updateAttendee(eventId, attendeeToEdit.id, payload)
      } else {
        await createAttendee(eventId, payload)
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save attendee.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
            {isEditing ? 'Edit Attendee' : 'Add Guest to Roster'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div
              className="flex items-center gap-2 rounded-lg bg-[hsl(var(--destructive)/0.08)] p-3 text-xs text-[hsl(var(--destructive))]"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="attName" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="attName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="mt-1 h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <div>
              <label htmlFor="attEmail" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="attEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-1 h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="attRole" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                Event Role
              </label>
              <select
                id="attRole"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="attStatus" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                RSVP Status
              </label>
              <select
                id="attStatus"
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              >
                {RSVP_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="attDietary" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
              Dietary Preferences / Restrictions
            </label>
            <input
              id="attDietary"
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g. Vegetarian, Gluten-free, Nut allergy"
              className="mt-1 h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div>
            <label htmlFor="attNotes" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
              Internal Notes / Responsibilities
            </label>
            <textarea
              id="attNotes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bringing presentation slides, VIP guest, etc."
              className="mt-1 w-full rounded-md border border-[hsl(var(--input))] bg-transparent p-2.5 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 border-t border-[hsl(var(--border))] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Guest'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
