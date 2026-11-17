import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Clock, Sparkles, X, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateAIAgenda, type AgendaItem } from '@/lib/api'

interface AIAgendaModalProps {
  eventTitle: string
  eventCategory: string
  startTime?: string
  endTime?: string
  open: boolean
  onClose: () => void
}

export function AIAgendaModal({
  eventTitle,
  eventCategory,
  startTime = '18:00',
  endTime = '22:00',
  open,
  onClose,
}: AIAgendaModalProps) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      generateAIAgenda({
        title: eventTitle,
        category: eventCategory,
        start_time: startTime,
        end_time: endTime,
      }),
    onSuccess: (data) => {
      setAgenda(data.agenda)
    },
  })

  useEffect(() => {
    if (open && agenda.length === 0) {
      mutation.mutate()
    }
  }, [open])

  if (!open) return null

  const handleCopy = () => {
    const text = agenda
      .map((item) => `${item.time} — ${item.title}: ${item.description}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                AI Run-of-Show Agenda
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Suggested schedule for "{eventTitle}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-8 w-8 text-indigo-600 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Synthesizing event flow and timing...
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[hsl(var(--border))]">
              {agenda.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white text-[9px] font-bold">
                    {idx + 1}
                  </span>

                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[hsl(var(--primary))]">
                        {item.time}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-semibold">
                        Milestone
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[hsl(var(--foreground))]">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] p-6 pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            size="sm"
            onClick={handleCopy}
            disabled={mutation.isPending || agenda.length === 0}
            className="gap-2 text-xs font-semibold"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Agenda Copied!' : 'Copy Agenda Text'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
