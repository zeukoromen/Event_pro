import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, User, Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createEventTask,
  updateEventTask,
  type TaskItem,
  type TaskCreateInput,
  type AttendeeItem,
} from '@/lib/api'

interface TaskModalProps {
  eventId: string
  open: boolean
  onClose: () => void
  taskToEdit?: TaskItem | null
  attendees?: AttendeeItem[]
}

export function TaskModal({
  eventId,
  open,
  onClose,
  taskToEdit,
  attendees = [],
}: TaskModalProps) {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'to_do' | 'in_progress' | 'done'>('to_do')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setDescription(taskToEdit.description || '')
      setPriority(taskToEdit.priority)
      setStatus(taskToEdit.status)
      setAssigneeId(taskToEdit.assignee_id || '')
      setDeadline(
        taskToEdit.deadline
          ? new Date(taskToEdit.deadline).toISOString().split('T')[0]
          : '',
      )
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus('to_do')
      setAssigneeId('')
      setDeadline('')
    }
    setError(null)
  }, [taskToEdit, open])

  const mutation = useMutation({
    mutationFn: (data: TaskCreateInput) => {
      if (taskToEdit) {
        return updateEventTask(eventId, taskToEdit.id, data)
      }
      return createEventTask(eventId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] })
      queryClient.invalidateQueries({ queryKey: ['tasks-stats', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save task')
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      assignee_id: assigneeId || undefined,
      deadline: deadline ? `${deadline}T23:59:59Z` : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Confirm catering contract, Order badges"
              className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1">
              Description & Requirements (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, vendor contacts, or instructions..."
              className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
            />
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-1">
                <Flag className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1">
                Kanban Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>

          {/* Assignee & Deadline Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                <span>Assignee</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              >
                <option value="">Unassigned</option>
                {attendees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                <span>Deadline</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--border))] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !title.trim()}
              className="gap-2"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
