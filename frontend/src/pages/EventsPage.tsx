import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus, Search } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/EventCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { EventCardSkeleton } from '@/components/shared/LoadingState'
import { fetchEvents, deleteEvent, type EventItem } from '@/lib/api'

export function EventsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: events = [], isLoading } = useQuery<EventItem[]>({
    queryKey: ['events', activeTab],
    queryFn: () => fetchEvents(activeTab === 'all' ? undefined : activeTab),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  // Filter events locally by search query
  const filteredEvents = events.filter((ev) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      ev.title.toLowerCase().includes(q) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      ev.category.toLowerCase().includes(q)
    )
  })

  return (
    <PageShell title="Events">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
            My Events
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Create, manage, and track all your upcoming and past events.
          </p>
        </div>

        <Button size="sm" asChild className="gap-2">
          <Link to="/events/new">
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Link>
        </Button>
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tab Filters */}
        <div className="flex items-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === 'upcoming'
                ? 'bg-[hsl(var(--primary))] text-white shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === 'past'
                ? 'bg-[hsl(var(--primary))] text-white shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            Past
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === 'all'
                ? 'bg-[hsl(var(--primary))] text-white shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            All Events
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title or venue…"
            className="h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-9 pr-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
        </div>
      </div>

      {/* ── Event List Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={searchQuery ? 'No matching events found' : 'No events scheduled'}
          description={
            searchQuery
              ? `No events matched your search for "${searchQuery}". Try a different keyword.`
              : activeTab === 'upcoming'
              ? 'You have no upcoming events. Ready to host a party, summit, or meetup?'
              : 'You have no events in this view.'
          }
          action={{
            label: 'Create an event',
            onClick: () => (window.location.href = '/events/new'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
