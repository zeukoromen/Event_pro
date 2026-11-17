import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Trash2,
  ArrowLeft,
  Share2,
} from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AttendeeTable } from '@/components/attendees/AttendeeTable'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { InvitationMediaShowcase } from '@/components/events/InvitationMediaShowcase'
import { AIAgendaModal } from '@/components/ai/AIAgendaModal'
import { fetchEventById, deleteEvent } from '@/lib/api'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [isAgendaOpen, setIsAgendaOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'tasks'>('overview')

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => fetchEventById(id!),
    enabled: Boolean(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate('/events')
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  const publicUrl = event ? `${window.location.origin}/e/${event.public_token}` : ''

  const handleCopyLink = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <PageShell title="Loading Event…">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading event details…</p>
        </div>
      </PageShell>
    )
  }

  if (isError || !event) {
    return (
      <PageShell title="Event Not Found">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Event Not Found</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            This event may have been removed or you don't have access to it.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/events">Back to Events</Link>
          </Button>
        </div>
      </PageShell>
    )
  }

  // Formatting date
  let formattedDate = 'Date to be announced'
  if (event.event_date) {
    const d = new Date(event.event_date + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  const taskProgress =
    event.task_count > 0 ? Math.round((event.completed_task_count / event.task_count) * 100) : 0

  return (
    <PageShell title={event.title}>
      {/* ── Top Navigation & Action Row ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link to="/events" aria-label="Back to events list">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[hsl(var(--primary)/0.08)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]">
                {event.category}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Created {new Date(event.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to={`/events/${event.id}/edit`}>
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Event</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            title="Delete event"
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Public Invitation Share Banner ── */}
      <Card className="mb-8 border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.03)]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-white shadow-xs">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                  Public Invitation & Guest RSVP Link
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Share this secure unguessable link with guests to collect RSVPs without an account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block max-w-xs truncate rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                {publicUrl}
              </div>
              <Button size="sm" onClick={handleCopyLink} className="gap-2 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
              <Button size="sm" variant="outline" asChild className="shrink-0">
                <a href={`/e/${event.public_token}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Stat Row ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Total Roster
            </p>
            <p className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
              {event.attendee_count}
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Invited guests</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Confirmed RSVPs
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {event.confirmed_count}
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {event.attendee_count > 0
                ? `${Math.round((event.confirmed_count / event.attendee_count) * 100)}% attendance rate`
                : 'Awaiting RSVPs'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
              Event Tasks
            </p>
            <p className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
              {event.task_count}
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {event.completed_task_count} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Task Readiness
            </p>
            <p className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
              {taskProgress}%
            </p>
            <Progress value={taskProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="mb-6 flex items-center border-b border-[hsl(var(--border))] text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`border-b-2 px-4 py-2.5 transition ${
            activeTab === 'overview'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Overview & Logistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guests')}
          className={`border-b-2 px-4 py-2.5 transition ${
            activeTab === 'guests'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Guest List ({event.attendee_count})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`border-b-2 px-4 py-2.5 transition ${
            activeTab === 'tasks'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Tasks ({event.task_count})
        </button>
      </div>

      {/* ── Tab 1: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {(event.invitation_media_url || event.cover_image_url) && (
              <InvitationMediaShowcase
                mediaUrl={event.invitation_media_url || event.cover_image_url}
                mediaType={event.invitation_media_type || 'image'}
                title={event.title}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Schedule & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{formattedDate}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {event.start_time
                        ? event.end_time
                          ? `${event.start_time} to ${event.end_time}`
                          : `Starts at ${event.start_time}`
                        : 'Time not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {event.location || 'Location to be announced'}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Venue or virtual link</p>
                  </div>
                </div>

                {event.description && (
                  <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                      Description
                    </p>
                    <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {event.invitation_message && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Host's Invitation Note</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="italic text-sm text-[hsl(var(--foreground))] bg-[hsl(var(--surface))] p-4 rounded-xl border border-[hsl(var(--border))]">
                    "{event.invitation_message}"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link to={`/events/${event.id}/edit`}>
                    <Edit3 className="h-4 w-4" />
                    Edit Event Details
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                  {copied ? 'Invitation Link Copied!' : 'Copy Invitation Link'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold"
                  onClick={() => setIsAgendaOpen(true)}
                >
                  <Share2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Generate AI Run-of-Show</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Tab 2: Guests ── */}
      {activeTab === 'guests' && (
        <AttendeeTable eventId={event.id} isOrganizer />
      )}

      {/* ── Tab 3: Tasks ── */}
      {activeTab === 'tasks' && (
        <KanbanBoard
          eventId={event.id}
          isOrganizer
          eventTitle={event.title}
          eventCategory={event.category}
          eventDescription={event.description || undefined}
          eventDate={event.event_date || undefined}
        />
      )}

      {/* ── AI Agenda Modal ── */}
      <AIAgendaModal
        eventTitle={event.title}
        eventCategory={event.category}
        startTime={event.start_time || undefined}
        endTime={event.end_time || undefined}
        open={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
      />
    </PageShell>
  )
}
