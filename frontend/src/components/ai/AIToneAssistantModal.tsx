import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateAIInvitation } from '@/lib/api'

interface AIToneAssistantModalProps {
  eventTitle: string
  eventCategory: string
  hostName?: string
  open: boolean
  onClose: () => void
  onApply: (message: string) => void
}

const TONES = [
  { id: 'warm', label: 'Warm & Heartfelt', desc: 'Personal, celebratory, and welcoming' },
  { id: 'formal', label: 'Elegant & Formal', desc: 'Dignified, courteous, and polite' },
  { id: 'casual', label: 'Friendly & Casual', desc: 'Relaxed, fun, and easygoing' },
  { id: 'festive', label: 'Festive & Energetic', desc: 'Exciting, upbeat, and party-ready' },
  { id: 'poetic', label: 'Poetic & Romantic', desc: 'Literary, sentimental, and milestone-focused' },
]

export function AIToneAssistantModal({
  eventTitle,
  eventCategory,
  hostName,
  open,
  onClose,
  onApply,
}: AIToneAssistantModalProps) {
  const [selectedTone, setSelectedTone] = useState<string>('warm')
  const [customHint, setCustomHint] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      generateAIInvitation({
        title: eventTitle || 'Special Event',
        category: eventCategory,
        tone: selectedTone,
        host_name: hostName,
        custom_prompt: customHint.trim() || undefined,
      }),
    onSuccess: (data) => {
      setGeneratedMessage(data.invitation_message)
    },
  })

  if (!open) return null

  const handleGenerate = () => {
    mutation.mutate()
  }

  const handleApply = () => {
    if (!generatedMessage.trim()) return
    onApply(generatedMessage)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                AI Invitation Copywriter
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Select a tone to craft the perfect personal host note
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

        {/* Tone Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Choose Tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTone(t.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                  selectedTone === t.id
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)]'
                }`}
              >
                <span className="text-xs font-bold text-[hsl(var(--foreground))]">{t.label}</span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] line-clamp-1">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Hint */}
        <div>
          <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1">
            Specific details or personal request (Optional)
          </label>
          <input
            type="text"
            value={customHint}
            onChange={(e) => setCustomHint(e.target.value)}
            placeholder="e.g. Please bring an appetite and dancing shoes! Kids welcome."
            className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:border-[hsl(var(--primary))] focus:outline-none"
          />
        </div>

        {/* Generate Button */}
        <div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="w-full gap-2 text-xs font-semibold h-10"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Crafting Note...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{generatedMessage ? 'Regenerate Invitation' : 'Generate Note'}</span>
              </>
            )}
          </Button>
        </div>

        {/* Generated Result Preview */}
        {generatedMessage && (
          <div className="space-y-3 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-400">
              <span>Suggested Invitation Note</span>
              <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60">
                {selectedTone} tone
              </span>
            </div>

            <textarea
              rows={3}
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              className="w-full font-serif italic text-sm text-[hsl(var(--foreground))] bg-transparent border-0 focus:outline-none resize-none leading-relaxed"
            />

            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="w-full gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Check className="h-4 w-4" />
              <span>Apply to Event Invitation</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
