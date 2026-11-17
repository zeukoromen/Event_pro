import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Users,
  CheckSquare,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EventCard } from '@/components/events/EventCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCardSkeleton, EventCardSkeleton } from '@/components/shared/LoadingState'
import { checkApiHealth, fetchDashboardStats, fetchEvents, type EventItem } from '@/lib/api'

// ── Stat Card Component ───────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ label, value, subtext, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            {label}
          </p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.08)]">
            <Icon className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          {value}
        </p>
        {subtext && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{subtext}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Health Badge Component (Dev Helper) ───────────────────────────────────

function ApiHealthBadge() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    retry: 1,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--muted-foreground))]" />
        Connecting…
      </span>
    )
  }

  if (isError) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--destructive)/0.1)] px-2.5 py-1 text-xs font-medium text-[hsl(var(--destructive))]">
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--destructive))]" />
        Backend offline
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(142_72%_29%/0.1)] px-2.5 py-1 text-xs font-medium text-[hsl(142_72%_29%)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(142_72%_29%)]" />
      API v{data?.version} · {data?.environment}
    </span>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, profile } = useAuth()
  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'

  // Fetch real KPI statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  // Fetch upcoming events
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<EventItem[]>({
    queryKey: ['events', 'upcoming'],
    queryFn: () => fetchEvents('upcoming'),
  })

  return (
    <PageShell title="Dashboard">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
            Good morning, {firstName}. 👋
          </h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            Here's what's happening with your upcoming events and guest responses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ApiHealthBadge />
          <Button size="sm" asChild>
            <Link to="/events/new">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New event
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Real-Time KPI Stats Row ── */}
      <section aria-label="Overview statistics" className="mb-8">
        {isLoadingStats ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Upcoming Events"
              value={stats?.upcoming_events ?? 0}
              subtext={`Total: ${stats?.total_events ?? 0} events`}
              icon={CalendarDays}
            />
            <StatCard
              label="Confirmed Guests"
              value={stats?.confirmed_guests ?? 0}
              subtext="Across all events"
              icon={Users}
            />
            <StatCard
              label="Pending RSVPs"
              value={stats?.pending_rsvps ?? 0}
              subtext="Awaiting responses"
              icon={Clock}
            />
            <StatCard
              label="Tasks Due"
              value={stats?.tasks_due ?? 0}
              subtext="Incomplete tasks"
              icon={CheckSquare}
            />
          </div>
        )}
      </section>

      {/* ── Two-column grid (events + task readiness) ── */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* ── Upcoming Events List ── */}
        <section aria-label="Upcoming events" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Upcoming Events
            </h2>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
              <Link to="/events">
                View all ({stats?.total_events ?? events.length})
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {isLoadingEvents ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events scheduled"
                description="Ready to plan your next event? Create an event to publish a digital invitation and track guest RSVPs."
                action={{
                  label: 'Create an event',
                  onClick: () => (window.location.href = '/events/new'),
                }}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* ── Right Column: Task Readiness & Quick Actions ── */}
        <div className="space-y-6">
          {/* Task Progress per Event */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Preparation Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {events.length === 0 ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))] py-4 text-center">
                  Create an event to begin tracking preparation tasks.
                </p>
              ) : (
                events.slice(0, 3).map((ev) => {
                  const pct =
                    ev.task_count > 0
                      ? Math.round((ev.completed_task_count / ev.task_count) * 100)
                      : 0
                  return (
                    <div key={ev.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          to={`/events/${ev.id}`}
                          className="font-semibold text-[hsl(var(--foreground))] hover:underline truncate max-w-[180px]"
                        >
                          {ev.title}
                        </Link>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {ev.completed_task_count}/{ev.task_count} done
                        </span>
                      </div>
                      <Progress value={pct} aria-label={`${pct}% complete`} />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Shortcuts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <Link to="/events/new">
                  <Plus className="h-4 w-4 text-[hsl(var(--primary))]" />
                  Create New Event
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <Link to="/events">
                  <CalendarDays className="h-4 w-4 text-[hsl(var(--primary))]" />
                  View All Events
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <Link to="/tasks">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  View Tasks Board
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
