import { Calendar, MapPin, Clock, Eye } from 'lucide-react'
import { InvitationMediaShowcase } from '@/components/events/InvitationMediaShowcase'

interface InvitationPreviewProps {
  title: string
  organizerName?: string
  category: string
  eventDate?: string
  startTime?: string
  endTime?: string
  location?: string
  coverImageUrl?: string
  invitationMediaUrl?: string
  invitationMediaType?: string
  invitationMessage?: string
  allowMaybe?: boolean
}

export function InvitationPreview({
  title,
  organizerName = 'Alex Morgan',
  category,
  eventDate,
  startTime,
  endTime,
  location,
  coverImageUrl,
  invitationMediaUrl,
  invitationMediaType = 'image',
  invitationMessage,
  allowMaybe = true,
}: InvitationPreviewProps) {
  // Format formatted date
  let formattedDate = 'Date to be announced'
  if (eventDate) {
    const d = new Date(eventDate + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  const timeDisplay = startTime
    ? endTime
      ? `${startTime} – ${endTime}`
      : `${startTime}`
    : 'Time to be announced'

  return (
    <div className="sticky top-24 w-full">
      {/* Header Bar with Live Indicator */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          <Eye className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
          Live Guest Invitation Preview
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Interactive
        </span>
      </div>

      {/* ── Invitation Card (Centered, Expressive Invitation Style) ── */}
      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl transition-all">
        {/* Visual Media or Banner Cover */}
        {invitationMediaUrl ? (
          <div className="p-3">
            <InvitationMediaShowcase
              mediaUrl={invitationMediaUrl}
              mediaType={invitationMediaType}
              title={title}
              variant="guest"
            />
          </div>
        ) : (
          <div className="relative h-44 w-full bg-gradient-to-br from-indigo-900 to-slate-900 overflow-hidden">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="h-full w-full object-cover transition-opacity duration-300"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-white/80">
                <span className="text-xs uppercase tracking-widest text-indigo-300 font-semibold">
                  {category || 'Special Event'}
                </span>
                <p className="mt-1 text-sm font-medium text-white/60">
                  (Upload an invite or paste a Canva/PDF link)
                </p>
              </div>
            )}

            {/* Category Pill Tag */}
            <span className="absolute bottom-3 left-4 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
              {category || 'Event'}
            </span>
          </div>
        )}

        {/* Invitation Content Body */}
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            You're invited by {organizerName}
          </p>

          <h2 className="invitation-display mt-2 text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl leading-snug">
            {title || 'Untitled Event'}
          </h2>

          <div className="my-5 space-y-2.5 border-y border-[hsl(var(--border))] py-4 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span className="font-medium text-[hsl(var(--foreground))]">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span>{timeDisplay}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span className="truncate">{location || 'Location details to be announced'}</span>
            </div>
          </div>

          {/* Invitation Host Note */}
          {invitationMessage && (
            <div className="mb-6 rounded-xl bg-[hsl(var(--surface))] p-4 border border-[hsl(var(--border))]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
                A note from the host:
              </p>
              <p className="mt-1 text-sm italic text-[hsl(var(--foreground))] leading-relaxed">
                "{invitationMessage}"
              </p>
            </div>
          )}

          {/* Mock RSVP Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 text-center">
              Will you be attending?
            </p>
            <div className={`grid gap-2 ${allowMaybe ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-50/50 py-2.5 text-center text-xs font-bold text-emerald-700">
                <span>✓ Attending</span>
              </div>
              {allowMaybe && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-amber-500/40 bg-amber-50/50 py-2.5 text-center text-xs font-bold text-amber-700">
                  <span>? Maybe</span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/40 bg-rose-50/50 py-2.5 text-center text-xs font-bold text-rose-700">
                <span>✗ Decline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
