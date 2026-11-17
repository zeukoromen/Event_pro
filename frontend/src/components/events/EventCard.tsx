import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, CheckSquare, Copy, Check, ArrowRight, Trash2 } from 'lucide-react'
import type { EventItem } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EventCardProps {
  event: EventItem
  onDelete?: (id: string) => void
}

export function EventCard({ event, onDelete }: EventCardProps) {
  const [copied, setCopied] = useState(false)

  // Parse event date components
  let month = 'TBD'
  let day = '--'
  if (event.event_date) {
    const d = new Date(event.event_date + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      day = d.getDate().toString()
    }
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const inviteUrl = `${window.location.origin}/e/${event.public_token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-[hsl(var(--primary)/0.4)] hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* ── 1. Date Tile ── */}
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-center shadow-xs">
            <span className="text-[10px] font-bold tracking-wider text-[hsl(var(--primary))]">
              {month}
            </span>
            <span className="text-lg font-extrabold leading-tight text-[hsl(var(--foreground))]">
              {day}
            </span>
          </div>

          {/* ── 2. Event Body ── */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[hsl(var(--primary)/0.08)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]">
                {event.category}
              </span>
              {event.start_time && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {event.start_time}
                  {event.end_time ? ` - ${event.end_time}` : ''}
                </span>
              )}
            </div>

            <Link to={`/events/${event.id}`} className="mt-1 block">
              <h3 className="truncate text-base font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                {event.title}
              </h3>
            </Link>

            {/* Location */}
            {event.location && (
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[hsl(var(--muted-foreground))]">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            )}

            {/* Metrics Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                <span>
                  <strong>{event.confirmed_count}</strong> confirmed ({event.attendee_count} total)
                </span>
              </div>

              {event.task_count > 0 && (
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    {event.completed_task_count}/{event.task_count} tasks
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Bottom Action Bar ── */}
        <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
          {/* Copy Public Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
            title="Copy public invitation link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Link copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(event.id)}
                className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                aria-label="Delete event"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button size="sm" variant="outline" asChild className="h-8 gap-1.5 text-xs">
              <Link to={`/events/${event.id}`}>
                <span>Manage</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
