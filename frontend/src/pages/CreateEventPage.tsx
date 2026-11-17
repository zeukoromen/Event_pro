import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Save,
  Sparkles,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Palette,
  FileText,
  Check,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InvitationPreview } from '@/components/events/InvitationPreview'
import { extractFileName } from '@/components/events/InvitationMediaShowcase'
import { AIToneAssistantModal } from '@/components/ai/AIToneAssistantModal'
import {
  createEvent,
  updateEvent,
  fetchEventById,
  uploadMediaFile,
  type EventCreateInput,
} from '@/lib/api'

const EVENT_CATEGORIES = [
  'Conference',
  'Meetup',
  'Party',
  'Wedding',
  'Workshop',
  'Dinner',
  'Fundraiser',
  'Networking',
  'Celebration',
  'Other',
]

export function CreateEventPage() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()

  const organizerName =
    profile?.full_name || user?.user_metadata?.full_name || 'Event Host'

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Conference')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [invitationMediaUrl, setInvitationMediaUrl] = useState('')
  const [invitationMediaType, setInvitationMediaType] = useState<'image' | 'canva' | 'pdf'>('image')
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [invitationMessage, setInvitationMessage] = useState('')
  const [isToneAssistantOpen, setIsToneAssistantOpen] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [allowMaybeRsvp, setAllowMaybeRsvp] = useState(true)
  const [collectDietary, setCollectDietary] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load existing event data if editing
  const { data: existingEvent, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => fetchEventById(id!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title || '')
      setDescription(existingEvent.description || '')
      setCategory(existingEvent.category || 'Other')
      setEventDate(existingEvent.event_date || '')
      setStartTime(existingEvent.start_time || '')
      setEndTime(existingEvent.end_time || '')
      setLocation(existingEvent.location || '')
      setCoverImageUrl(existingEvent.cover_image_url || '')
      const mediaUrl = existingEvent.invitation_media_url || existingEvent.cover_image_url || ''
      setInvitationMediaUrl(mediaUrl)
      if (mediaUrl.startsWith('/uploads/')) {
        setUploadedFileName(extractFileName(mediaUrl))
      }
      setInvitationMediaType((existingEvent.invitation_media_type as any) || 'image')
      setInvitationMessage(existingEvent.invitation_message || '')
      setIsPublished(existingEvent.is_published)
      setAllowMaybeRsvp(existingEvent.allow_maybe_rsvp)
      setCollectDietary(existingEvent.collect_dietary_preferences)
    }
  }, [existingEvent])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setErrorMsg(null)
    try {
      const res = await uploadMediaFile(file)
      setInvitationMediaUrl(res.url)
      setUploadedFileName(res.original_filename || file.name)
      setInvitationMediaType(res.media_type as any)
      if (res.media_type === 'image') {
        setCoverImageUrl(res.url)
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'File upload failed. Please try a valid image or PDF.')
    } finally {
      setIsUploading(false)
    }
  }

  // Save Mutation
  const mutation = useMutation({
    mutationFn: (payload: EventCreateInput) => {
      if (isEditing && id) {
        return updateEvent(id, payload)
      }
      return createEvent(payload)
    },
    onSuccess: (savedEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate(`/events/${savedEvent.id}`)
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Failed to save event. Please check inputs.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Event title is required.')
      return
    }
    setErrorMsg(null)

    const payload: EventCreateInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      event_date: eventDate || undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      location: location.trim() || undefined,
      cover_image_url: coverImageUrl.trim() || invitationMediaUrl.trim() || undefined,
      invitation_media_url: invitationMediaUrl.trim() || coverImageUrl.trim() || undefined,
      invitation_media_type: invitationMediaType,
      invitation_message: invitationMessage.trim() || undefined,
      is_published: isPublished,
      allow_maybe_rsvp: allowMaybeRsvp,
      collect_dietary_preferences: collectDietary,
    }

    mutation.mutate(payload)
  }

  if (isEditing && isLoadingEvent) {
    return (
      <PageShell title="Loading Event…">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading event details…</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title={isEditing ? 'Edit Event' : 'Create Event'}>
      {/* ── Top Header Bar ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link to={isEditing ? `/events/${id}` : '/events'} aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {isEditing
                ? 'Update your event details and invitation card.'
                : 'Enter your event info and see your invitation live preview.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/events">Cancel</Link>
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{mutation.isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Event'}</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div
          className="mb-6 flex items-center gap-2.5 rounded-lg bg-[hsl(var(--destructive)/0.08)] p-3 text-sm text-[hsl(var(--destructive))]"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 2-Column Responsive Layout ── */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column (60% on desktop): Event Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Information */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                  Basic Details
                </h3>

                <div>
                  <label htmlFor="title" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AI Founders Summit 2026"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 text-sm font-medium focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    >
                      {EVENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                      Location / Venue
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Grand Ballroom or Zoom URL"
                      className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide an overview of the event schedule, dress code, or agenda..."
                    className="mt-1.5 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Date & Scheduling */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                  Date & Schedule
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                      Event Date
                    </label>
                    <input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>

                  <div>
                    <label htmlFor="startTime" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                      Start Time
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                      End Time (Optional)
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Invitation Design Content */}
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                      Invitation Card & Visual Showcase
                    </h3>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Perfect for weddings, birthdays & galas
                  </span>
                </div>

                {/* Media Format Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-2">
                    Choose Invitation Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvitationMediaType('image')}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                        invitationMediaType === 'image'
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]'
                          : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Photo / Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvitationMediaType('canva')}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                        invitationMediaType === 'canva'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <Palette className="h-4 w-4" />
                      <span>Canva Design</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvitationMediaType('pdf')}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                        invitationMediaType === 'pdf'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span>PDF Document</span>
                    </button>
                  </div>
                </div>

                {/* 1. Image / Photo Mode */}
                {invitationMediaType === 'image' && (
                  <div className="space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                        Invitation Image (PNG, JPG, WebP)
                      </label>
                      {invitationMediaUrl && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Check className="h-3 w-3" />
                          <span>Image Attached</span>
                        </span>
                      )}
                    </div>

                    {invitationMediaUrl ? (
                      /* Attached Image Card */
                      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={invitationMediaUrl}
                            alt="Attached invitation"
                            className="h-12 w-16 shrink-0 rounded-lg object-cover border border-emerald-200 dark:border-emerald-800"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[hsl(var(--foreground))]">
                              {uploadedFileName || extractFileName(invitationMediaUrl)}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <Check className="h-3 w-3" />
                              <span>Card attached & displayed in preview</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-8 gap-1 text-xs"
                          >
                            <a href={invitationMediaUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>View</span>
                            </a>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setInvitationMediaUrl('')
                              setCoverImageUrl('')
                              setUploadedFileName('')
                            }}
                            className="h-8 text-xs text-[hsl(var(--destructive))] hover:bg-rose-100 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* File Upload Dropzone */}
                        <div className="relative">
                          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 cursor-pointer hover:border-[hsl(var(--primary))] transition text-center">
                            {isUploading ? (
                              <div className="flex items-center gap-2 text-xs text-[hsl(var(--primary))] font-semibold py-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Uploading invitation image...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-[hsl(var(--primary))]" />
                                <div>
                                  <p className="text-xs font-bold text-[hsl(var(--foreground))]">
                                    Click to select image or drag and drop
                                  </p>
                                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                                    High-res wedding cards, party invitations, or event flyers
                                  </p>
                                </div>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="relative flex items-center py-1">
                          <div className="flex-grow border-t border-[hsl(var(--border))]" />
                          <span className="shrink-0 px-2 text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                            or paste image URL
                          </span>
                          <div className="flex-grow border-t border-[hsl(var(--border))]" />
                        </div>

                        <input
                          type="url"
                          value={invitationMediaUrl}
                          onChange={(e) => {
                            setInvitationMediaUrl(e.target.value)
                            setCoverImageUrl(e.target.value)
                          }}
                          placeholder="https://images.unsplash.com/photo-... or https://..."
                          className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                )}

                {/* 2. Canva Mode */}
                {invitationMediaType === 'canva' && (
                  <div className="space-y-3 rounded-2xl border border-indigo-200/60 bg-indigo-50/30 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-indigo-950 dark:text-indigo-300">
                        Canva Public Design or View Link
                      </label>
                      {invitationMediaUrl && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          <Check className="h-3 w-3" />
                          <span>Link Connected</span>
                        </span>
                      )}
                    </div>

                    <input
                      type="url"
                      value={invitationMediaUrl}
                      onChange={(e) => setInvitationMediaUrl(e.target.value)}
                      placeholder="https://www.canva.com/design/DAG.../view or embed link"
                      className="h-10 w-full rounded-lg border border-indigo-200 bg-[hsl(var(--card))] px-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-indigo-900"
                    />

                    {/* Step-by-step guidance callout */}
                    <div className="rounded-xl bg-[hsl(var(--card))] border border-indigo-100 dark:border-indigo-900/60 p-3.5 text-[11px] text-[hsl(var(--muted-foreground))] space-y-2">
                      <p className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        <span>How to connect your Canva invitation:</span>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Open your invitation card in Canva.</li>
                        <li>Click <strong>Share</strong> (top right) → <strong>More (…)</strong> → select <strong>Public View Link</strong> or <strong>Embed</strong>.</li>
                        <li>Copy and paste that link in the box above!</li>
                      </ol>
                      <div className="mt-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 p-2 text-[11px] text-indigo-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                        💡 <strong>Pro-Tip for 100% Native Preview:</strong> If Canva blocks embedding for private links, you can also download your card as a PNG or PDF from Canva (<em>Share → Download</em>) and upload it in the <strong>Photo</strong> or <strong>PDF</strong> tab!
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PDF Mode */}
                {invitationMediaType === 'pdf' && (
                  <div className="space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                        PDF Invitation Document
                      </label>
                      {invitationMediaUrl && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Check className="h-3 w-3" />
                          <span>PDF Attached</span>
                        </span>
                      )}
                    </div>

                    {invitationMediaUrl ? (
                      /* Attached PDF Document Card */
                      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300 shadow-xs">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[hsl(var(--foreground))]">
                              {uploadedFileName || extractFileName(invitationMediaUrl)}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <Check className="h-3 w-3" />
                              <span>Official invitation PDF attached & ready</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-8 gap-1 text-xs"
                          >
                            <a href={invitationMediaUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Preview Document</span>
                            </a>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setInvitationMediaUrl('')
                              setUploadedFileName('')
                            }}
                            className="h-8 text-xs text-[hsl(var(--destructive))] hover:bg-rose-100 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* File Upload Dropzone */}
                        <div className="relative">
                          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 cursor-pointer hover:border-rose-400 transition text-center">
                            {isUploading ? (
                              <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold py-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Uploading PDF document...</span>
                              </div>
                            ) : (
                              <>
                                <FileText className="h-6 w-6 text-rose-600" />
                                <div>
                                  <p className="text-xs font-bold text-[hsl(var(--foreground))]">
                                    Click to select PDF file
                                  </p>
                                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                                    Multi-page wedding invitations, formal program schedules, or brochures
                                  </p>
                                </div>
                              </>
                            )}
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="relative flex items-center py-1">
                          <div className="flex-grow border-t border-[hsl(var(--border))]" />
                          <span className="shrink-0 px-2 text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                            or paste PDF URL
                          </span>
                          <div className="flex-grow border-t border-[hsl(var(--border))]" />
                        </div>

                        <input
                          type="url"
                          value={invitationMediaUrl}
                          onChange={(e) => setInvitationMediaUrl(e.target.value)}
                          placeholder="https://.../invitation.pdf"
                          className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs focus:border-[hsl(var(--primary))] focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="invitationMessage" className="block text-xs font-semibold text-[hsl(var(--foreground))]">
                      Host's Personal Message
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsToneAssistantOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 hover:underline"
                    >
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      <span>✨ AI Tone Assistant</span>
                    </button>
                  </div>
                  <textarea
                    id="invitationMessage"
                    rows={2}
                    value={invitationMessage}
                    onChange={(e) => setInvitationMessage(e.target.value)}
                    placeholder="We would love for you to join us to celebrate..."
                    className="mt-1 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 4: RSVP & Guest Preferences */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                  RSVP Settings
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        Publish public invitation link
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Guests can view the event and RSVP without creating an account.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMaybeRsvp}
                      onChange={(e) => setAllowMaybeRsvp(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        Allow "Maybe" response
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Let undecided guests RSVP with 'Maybe'.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectDietary}
                      onChange={(e) => setCollectDietary(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        Ask for dietary preferences
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Prompts guests for allergies or vegetarian/vegan preferences on the RSVP form.
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/events">Cancel</Link>
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                <span>{mutation.isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Event'}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column (40% on desktop): Live Sticky Preview */}
        <div className="lg:col-span-5 hidden lg:block">
          <InvitationPreview
            title={title}
            organizerName={organizerName}
            category={category}
            eventDate={eventDate}
            startTime={startTime}
            endTime={endTime}
            location={location}
            coverImageUrl={coverImageUrl}
            invitationMediaUrl={invitationMediaUrl || coverImageUrl}
            invitationMediaType={invitationMediaType}
            invitationMessage={invitationMessage}
            allowMaybe={allowMaybeRsvp}
          />
        </div>
      </div>

      {/* AI Tone Assistant Modal */}
      <AIToneAssistantModal
        eventTitle={title}
        eventCategory={category}
        hostName={organizerName}
        open={isToneAssistantOpen}
        onClose={() => setIsToneAssistantOpen(false)}
        onApply={(msg) => setInvitationMessage(msg)}
      />
    </PageShell>
  )
}
