import { useState } from 'react'
import {
  ExternalLink,
  Download,
  Maximize2,
  X,
  FileText,
  Sparkles,
  Eye,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InvitationMediaShowcaseProps {
  mediaUrl?: string | null
  mediaType?: 'image' | 'canva' | 'pdf' | string | null
  title?: string
  variant?: 'default' | 'guest'
}

export function extractFileName(url: string): string {
  if (!url) return 'Invitation Document.pdf'
  const parts = url.split('/')
  const raw = parts[parts.length - 1] || 'Invitation Document.pdf'
  // Remove 12-char hex prefix e.g. 6d3b07f63338_Resume.pdf -> Resume.pdf
  const clean = raw.replace(/^[a-f0-9]{12}_/, '')
  try {
    return decodeURIComponent(clean) || 'Invitation Document.pdf'
  } catch {
    return clean || 'Invitation Document.pdf'
  }
}

export function formatCanvaUrl(rawUrl: string): { embedUrl: string; directUrl: string } {
  if (!rawUrl) return { embedUrl: '', directUrl: '' }
  let url = rawUrl.trim()

  // If user pasted full iframe tag from Canva embed dialog, extract src
  const matchSrc = url.match(/src=["']([^"']+)["']/)
  if (matchSrc && matchSrc[1]) {
    url = matchSrc[1]
  }

  // Handle edit links: convert /edit to /view
  if (url.includes('canva.com/design/')) {
    url = url.replace(/\/edit(\?.*)?$/, '/view')
    url = url.replace(/\/watch(\?.*)?$/, '/view')
  }

  // Direct viewer URL (never has embed parameter)
  const directUrl = url.replace('?embed', '').replace('&embed', '')

  // Embed URL (always has ?embed)
  let embedUrl = url
  if (embedUrl.includes('canva.com/design/')) {
    if (!embedUrl.includes('embed')) {
      embedUrl = embedUrl.includes('?') ? `${embedUrl}&embed` : `${embedUrl}?embed`
    }
  }

  return { embedUrl, directUrl }
}

export function InvitationMediaShowcase({
  mediaUrl,
  mediaType = 'image',
  title = 'Event Invitation',
  variant = 'default',
}: InvitationMediaShowcaseProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [canvaMode, setCanvaMode] = useState<'card' | 'player'>('card')

  if (!mediaUrl) return null

  const isCanva =
    mediaType === 'canva' ||
    mediaUrl.includes('canva.com') ||
    mediaUrl.includes('canva.me')

  const isPdf =
    mediaType === 'pdf' ||
    mediaUrl.toLowerCase().endsWith('.pdf') ||
    mediaUrl.includes('.pdf') ||
    mediaUrl.includes('/pdf')

  // ── 1. Canva Invitation Showcase ──────────────────────────────────────────
  if (isCanva) {
    const { embedUrl, directUrl } = formatCanvaUrl(mediaUrl)

    return (
      <div className={`relative overflow-hidden ${variant === 'guest' ? '' : 'rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/60 via-[hsl(var(--card))] to-[hsl(var(--card))] p-4 shadow-lg dark:border-indigo-900/50'}`}>
        {/* Canva Branded Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xs font-bold text-xs">
              C
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Canva Digital Invitation</span>
              </span>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Interactive invitation presentation
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={canvaMode === 'card' ? 'secondary' : 'outline'}
              onClick={() => setCanvaMode(canvaMode === 'card' ? 'player' : 'card')}
              className="h-8 text-xs font-medium gap-1.5"
            >
              {canvaMode === 'card' ? (
                <>
                  <Play className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Try Live Player</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Card View</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              asChild
              className="gap-1.5 h-8 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xs shrink-0"
            >
              <a href={directUrl} target="_blank" rel="noopener noreferrer">
                <span>Open in Canva</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Presentation View (Default: Never blocked by Canva X-Frame-Options) */}
        {canvaMode === 'card' ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-8 text-center text-white shadow-inner sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
            <div className="relative z-10 max-w-md mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-pink-400" />
                Special Invitation Design
              </span>

              <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl text-white">
                {title}
              </h2>

              <p className="text-xs text-indigo-200/80 leading-relaxed">
                This invitation was created with Canva. Click below to view the interactive presentation, animations, and flip effects in full resolution.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="default"
                  asChild
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold shadow-lg"
                >
                  <a href={directUrl} target="_blank" rel="noopener noreferrer">
                    <span>Open & Flip Canva Invitation</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>

                <Button
                  size="default"
                  variant="outline"
                  onClick={() => setCanvaMode('player')}
                  className="w-full sm:w-auto text-xs font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  <span>View Embedded</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Embedded Canva Player View */
          <div className="space-y-2">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl bg-stone-950 shadow-inner border border-indigo-100 dark:border-indigo-900/60">
              <iframe
                src={embedUrl}
                title={title}
                loading="lazy"
                allowFullScreen
                allow="fullscreen"
                className="absolute inset-0 h-full w-full border-0"
              />

              <div className="absolute bottom-3 right-3 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  asChild
                  className="h-7 text-[11px] gap-1 bg-black/70 text-white backdrop-blur-md hover:bg-black/90 font-medium"
                >
                  <a href={directUrl} target="_blank" rel="noopener noreferrer">
                    <Maximize2 className="h-3 w-3" />
                    <span>Full Screen</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Explanatory banner if browser security blocks the iframe */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-900 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Seeing "refused to connect"?</strong> Canva blocks iframe embedding on private design links. Click{' '}
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-amber-800"
                >
                  Open in Canva ↗
                </a>{' '}
                to view it directly, or switch back to the Card View.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── 2. PDF Invitation Viewer ──────────────────────────────────────────────
  if (isPdf) {
    const cleanFileName = extractFileName(mediaUrl)
    // view=FitH tells the PDF viewer to scale width to 100% of container, eliminating black bars
    const pdfUrl = `${mediaUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`

    // Guest Mode: Pure, seamless luxury invitation card presentation
    if (variant === 'guest') {
      return (
        <div className="relative w-full">
          {/* Floating Minimalist Action Pill */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              asChild
              className="h-7 gap-1 rounded-full bg-white/90 px-2.5 text-[11px] font-semibold text-stone-900 shadow-md backdrop-blur-md hover:bg-white dark:bg-stone-900/90 dark:text-stone-100"
            >
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                <Maximize2 className="h-3 w-3" />
                <span>Full View</span>
              </a>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              asChild
              className="h-7 w-7 rounded-full bg-white/90 p-0 text-stone-900 shadow-md backdrop-blur-md hover:bg-white dark:bg-stone-900/90 dark:text-stone-100"
              title="Download invitation"
            >
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" download={cleanFileName}>
                <Download className="h-3 w-3" />
              </a>
            </Button>
          </div>

          {/* Invitation Frame (Auto-scaled portrait proportion, zero black sidebars) */}
          <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-stone-100/80 shadow-md dark:bg-stone-900/50">
            <div className="relative w-full aspect-[1/1.38] min-h-[540px] max-h-[780px]">
              <iframe
                src={pdfUrl}
                title={title || cleanFileName}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )
    }

    // Default Mode (Organizer Detail View): Clean header + auto-fitting portrait container
    return (
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-[hsl(var(--card))] p-4 shadow-sm dark:border-stone-800">
        {/* PDF Header Bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[hsl(var(--border))] pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[hsl(var(--foreground))]">
                {cleanFileName}
              </p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Invitation Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" asChild className="gap-1.5 h-8 text-xs font-semibold">
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="h-3.5 w-3.5" />
                <span>Open in New Tab</span>
              </a>
            </Button>
            <Button
              size="sm"
              asChild
              className="gap-1.5 h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" download={cleanFileName}>
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Auto-fitting container: portrait aspect ratio eliminates empty black space */}
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-stone-100/80 shadow-inner dark:bg-stone-900/60">
          <div className="relative w-full aspect-[1/1.38] min-h-[520px] max-h-[760px]">
            <iframe
              src={pdfUrl}
              title={cleanFileName}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    )
  }

  // ── 3. High-Res Image / Wedding Card Showcase ─────────────────────────────
  return (
    <>
      <div className={`group relative overflow-hidden ${variant === 'guest' ? '' : 'rounded-3xl border border-stone-200 bg-[hsl(var(--card))] p-3.5 shadow-xl dark:border-stone-800'}`}>
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-stone-900/03 dark:border-amber-900/40">
          <img
            src={mediaUrl}
            alt={title}
            className="mx-auto max-h-[620px] w-full object-contain rounded-xl shadow-xs"
          />

          {/* Zoom Overlay Action */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsZoomOpen(true)}
              className="gap-1.5 bg-white/95 text-stone-900 hover:bg-white shadow-md font-semibold text-xs"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Click to View Full Size</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={mediaUrl}
              alt={title}
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
