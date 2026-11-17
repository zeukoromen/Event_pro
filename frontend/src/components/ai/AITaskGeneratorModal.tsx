import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles,
  X,
  Clock,
  Loader2,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  generateAITasks,
  batchCreateTasks,
  type SuggestedTask,
} from '@/lib/api'

interface AITaskGeneratorModalProps {
  eventId: string
  eventTitle: string
  eventCategory: string
  eventDescription?: string
  eventDate?: string
  open: boolean
  onClose: () => void
}

const PRIORITY_BADGES: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300',
  low: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-300',
}

export function AITaskGeneratorModal({
  eventId,
  eventTitle,
  eventCategory,
  eventDescription,
  eventDate,
  open,
  onClose,
}: AITaskGeneratorModalProps) {
  const queryClient = useQueryClient()

  const [count, setCount] = useState<number>(6)
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [isGenerated, setIsGenerated] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: () =>
      generateAITasks({
        event_id: eventId,
        title: eventTitle,
        category: eventCategory,
        description: eventDescription,
        event_date: eventDate,
        count,
      }),
    onSuccess: (data) => {
      setSuggestedTasks(data.tasks)
      setSelectedIndices(new Set(data.tasks.map((_, i) => i)))
      setIsGenerated(true)
      setErrorMsg(null)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to generate AI tasks.')
    },
  })

  // Batch Create Mutation
  const batchCreateMutation = useMutation({
    mutationFn: (tasksToCreate: SuggestedTask[]) =>
      batchCreateTasks(eventId, tasksToCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] })
      queryClient.invalidateQueries({ queryKey: ['tasks-stats', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to add tasks to board.')
    },
  })

  useEffect(() => {
    if (open && !isGenerated) {
      generateMutation.mutate()
    }
  }, [open])

  if (!open) return null

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setSelectedIndices(next)
  }

  const toggleSelectAll = () => {
    if (selectedIndices.size === suggestedTasks.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(suggestedTasks.map((_, i) => i)))
    }
  }

  const handleAddTasks = () => {
    const tasksToAdd = suggestedTasks.filter((_, i) => selectedIndices.has(i))
    if (tasksToAdd.length === 0) return
    batchCreateMutation.mutate(tasksToAdd)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <span>AI Preparation Copilot</span>
                <span className="rounded-full bg-[hsl(var(--primary)/0.08)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]">
                  {eventCategory}
                </span>
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Tailored task milestones generated for "{eventTitle}"
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                Analyzing event category & timeline...
              </p>
              <p className="mt-1 max-w-sm text-xs text-[hsl(var(--muted-foreground))]">
                Our event planning copilot is crafting essential deliverables, vendor deadlines, and checklists.
              </p>
            </div>
          ) : (
            <>
              {/* Task Options Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[hsl(var(--foreground))]">
                    Suggested Tasks ({suggestedTasks.length}):
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[hsl(var(--primary))] hover:underline font-semibold"
                  >
                    {selectedIndices.size === suggestedTasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[hsl(var(--muted-foreground))]">Generate:</span>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 py-1 text-xs"
                  >
                    <option value={5}>5 Tasks</option>
                    <option value={8}>8 Tasks</option>
                    <option value={10}>10 Tasks</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="h-7 text-xs"
                  >
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30">
                  {errorMsg}
                </div>
              )}

              {/* Tasks Checklist */}
              <div className="space-y-2.5">
                {suggestedTasks.map((task, idx) => {
                  const isChecked = selectedIndices.has(idx)
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                        isChecked
                          ? 'border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.03)] shadow-xs'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(idx)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            {task.title}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                          {task.description}
                        </p>

                        {task.days_before !== null && task.days_before !== undefined && (
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[hsl(var(--primary))] font-medium">
                            <Clock className="h-3 w-3" />
                            <span>
                              {task.days_before > 0
                                ? `Suggested deadline: ${task.days_before} days before event`
                                : task.days_before === 0
                                ? 'Day of the event'
                                : `${Math.abs(task.days_before)} day after event`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] p-6 pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleAddTasks}
            disabled={
              batchCreateMutation.isPending ||
              selectedIndices.size === 0 ||
              generateMutation.isPending
            }
            className="gap-2 font-semibold shadow-xs"
          >
            {batchCreateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding to Board...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add {selectedIndices.size} Tasks to Kanban</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
