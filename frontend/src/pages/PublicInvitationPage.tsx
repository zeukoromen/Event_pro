import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  XCircle,
  CalendarPlus,
  ArrowRight,
  Send,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvitationMediaShowcase } from '@/components/events/InvitationMediaShowcase'
import {
  fetchPublicEvent,
  submitPublicRSVP,
  type PublicRSVPData,
  type PublicRSVPResponse,
} from '@/lib/api'

export function PublicInvitationPage() {
  const { token } = useParams<{ token: string }>()

  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'maybe' | 'declined'>('attending')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dietary, setDietary] = useState('')
  const [notes, setNotes] = useState('')
  const [submittedResponse, setSubmittedResponse] = useState<PublicRSVPResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['public-event', token],
    queryFn: () => fetchPublicEvent(token!),
    enabled: Boolean(token),
  })

  const rsvpMutation = useMutation({
    mutationFn: (data: PublicRSVPData) => submitPublicRSVP(token!, data),
    onSuccess: (res) => {
      setSubmittedResponse(res)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to submit RSVP. Please check your information and try again.',
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please provide both your name and email address.')
      return
    }
    setErrorMessage(null)
    rsvpMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      rsvp_status: rsvpStatus,
      dietary_preferences: dietary.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  const getGoogleCalendarUrl = () => {
    if (!event) return '#'
    const title = encodeURIComponent(event.title)
    const details = encodeURIComponent(
      `Invitation: ${event.title}\n${event.description || ''}\nRSVP link: ${window.location.href}`,
    )
    const location = encodeURIComponent(event.location || '')

    let dates = ''
    if (event.event_date) {
      const cleanDate = event.event_date.replace(/-/g, '')
      const start = event.start_time
        ? `${cleanDate}T${event.start_time.replace(/:/g, '')}00`
        : `${cleanDate}T090000`
      const end = event.end_time
        ? `${cleanDate}T${event.end_time.replace(/:/g, '')}00`
        : `${cleanDate}T120000`
      dates = `&dates=${start}/${end}`
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${dates}`
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-r-transparent" />
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading invitation...</p>
        </div>
      </div>
    )
  }

  // Not Found or Error State
  if (isError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
        <div className="max-w-md w-full rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center p-8 shadow-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[hsl(var(--foreground))]">
            Invitation Not Found
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            This invitation link may be invalid, expired, or the host has unpublished this event.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formattedDate = event.event_date
    ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date to be announced'

  return (
    <div className="min-h-screen bg-stone-100/60 text-[hsl(var(--foreground))] dark:bg-stone-950">
      {/* ── Top Brand Bar ── */}
      <header className="border-b border-stone-200/80 bg-[hsl(var(--card))] px-4 py-3 sm:px-8 dark:border-stone-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white font-bold text-sm shadow-xs">
              EP
            </div>
            <span className="text-base font-bold tracking-tight text-[hsl(var(--foreground))]">
              Event Pro
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link to="/login" className="flex items-center gap-1.5">
              <span>Host your own event</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Main Unified Invitation Suite Stage ── */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* ONE Seamless Luxury Invitation Card Suite */}
        <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-[hsl(var(--card))] shadow-xl dark:border-stone-800">

          {/* ── Top Section: The Invitation Artwork (Auto-fitted, Zero Black Sidebars) ── */}
          {(event.invitation_media_url || event.cover_image_url) && (
            <div className="p-3 sm:p-5 pb-0">
              <InvitationMediaShowcase
                mediaUrl={event.invitation_media_url || event.cover_image_url}
                mediaType={event.invitation_media_type || 'image'}
                title={event.title}
                variant="guest"
              />
            </div>
          )}

          {/* ── Middle Section: Ceremony & Event Details ── */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary)/0.08)] px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
                <Sparkles className="h-3 w-3" />
                {event.category || 'Special Event'}
              </span>

              <h1 className="font-serif text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                {event.title}
              </h1>
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                You're cordially invited
              </p>
            </div>

            {/* Host Personal Message (if present) */}
            {event.invitation_message && (
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:p-5 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Note from Host
                </p>
                <p className="mt-1 font-serif italic text-sm sm:text-base text-[hsl(var(--foreground))] leading-relaxed">
                  "{event.invitation_message}"
                </p>
              </div>
            )}

            {/* Logistics Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Date & Time */}
              <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--primary))] shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Date & Time
                  </p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] mt-0.5">
                    {formattedDate}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    {event.start_time
                      ? event.end_time
                        ? `${event.start_time} - ${event.end_time}`
                        : `Starts at ${event.start_time}`
                      : 'Time to be announced'}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--primary))] shadow-xs">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Location
                  </p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] mt-0.5">
                    {event.location || 'Location details will follow'}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    In-person venue or link
                  </p>
                </div>
              </div>
            </div>

            {/* Description (if present) */}
            {event.description && (
              <div className="border-t border-stone-200/60 dark:border-stone-800 pt-4 text-center">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Bottom Section: Integrated RSVP Response Slip ── */}
          <div className="border-t border-stone-200/80 bg-stone-50/80 p-6 sm:p-8 dark:border-stone-800 dark:bg-stone-900/40">
            {submittedResponse ? (
              /* Success Confirmation State (Integrated inside the card) */
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="mt-3 font-serif text-2xl font-bold text-[hsl(var(--foreground))]">
                  You're on the list!
                </h2>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  {submittedResponse.message}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Button size="sm" asChild className="gap-2">
                    <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                      <CalendarPlus className="h-4 w-4" />
                      <span>Add to Google Calendar</span>
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubmittedResponse(null)}
                  >
                    Change RSVP
                  </Button>
                </div>
              </div>
            ) : (
              /* RSVP Response Form */
              <div className="space-y-6">
                <div className="text-center border-b border-stone-200/70 dark:border-stone-800 pb-4">
                  <h2 className="font-serif text-2xl font-bold text-[hsl(var(--foreground))]">
                    Will you be attending?
                  </h2>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Kindly respond to help the host finalize arrangements.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Status Pills */}
                  <div>
                    <label className="block text-center text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2.5">
                      Your Response *
                    </label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {/* Attending */}
                      <button
                        type="button"
                        onClick={() => setRsvpStatus('attending')}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                          rsvpStatus === 'attending'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Attending</span>
                      </button>

                      {/* Maybe (only if enabled by event) */}
                      {event.allow_maybe_rsvp && (
                        <button
                          type="button"
                          onClick={() => setRsvpStatus('maybe')}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                            rsvpStatus === 'maybe'
                              ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-amber-300'
                          }`}
                        >
                          <HelpCircle className="h-4 w-4 text-amber-600" />
                          <span>Maybe</span>
                        </button>
                      )}

                      {/* Declined */}
                      <button
                        type="button"
                        onClick={() => setRsvpStatus('declined')}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                          rsvpStatus === 'declined'
                            ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-rose-300'
                        }`}
                      >
                        <XCircle className="h-4 w-4 text-rose-600" />
                        <span>Can't Make It</span>
                      </button>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="guest-name"
                        className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        id="guest-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jordan Smith"
                        className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="guest-email"
                        className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1"
                      >
                        Email Address *
                      </label>
                      <input
                        id="guest-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                      />
                    </div>
                  </div>

                  {/* Dietary Requirements (if configured) */}
                  {event.collect_dietary_preferences && (
                    <div>
                      <label
                        htmlFor="guest-dietary"
                        className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1"
                      >
                        Dietary Preferences / Allergies (Optional)
                      </label>
                      <input
                        id="guest-dietary"
                        type="text"
                        value={dietary}
                        onChange={(e) => setDietary(e.target.value)}
                        placeholder="e.g. Vegetarian, Jain, Nut Allergy"
                        className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                      />
                    </div>
                  )}

                  {/* Personal Note to Host */}
                  <div>
                    <label
                      htmlFor="guest-note"
                      className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1"
                    >
                      Personal Note for Host (Optional)
                    </label>
                    <textarea
                      id="guest-note"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Hearty congratulations! Looking forward to celebrating with you."
                      className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3.5 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                    />
                  </div>

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                      {errorMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={rsvpMutation.isPending || !name.trim() || !email.trim()}
                    className="w-full h-11 text-sm font-semibold shadow-sm gap-2"
                  >
                    {rsvpMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting RSVP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Response</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 border-t border-stone-200/60 py-6 text-center text-xs text-[hsl(var(--muted-foreground))] dark:border-stone-800">
        <p>Created with Event Pro — Seamless event management & invitations</p>
      </footer>
    </div>
  )
}
