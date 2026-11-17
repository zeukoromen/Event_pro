import { useState } from 'react'
import {
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type TaskItem } from '@/lib/api'

interface TaskCardProps {
  task: TaskItem
  onStatusChange: (taskId: string, newStatus: 'to_do' | 'in_progress' | 'done') => void
  onEdit: (task: TaskItem) => void
  onDelete: (taskId: string) => void
}

const PRIORITY_BADGES = {
  high: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300',
  low: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-300',
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Deadline formatting & overdue detection
  const isOverdue =
    task.deadline && task.status !== 'done' && new Date(task.deadline) < new Date()

  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  const getInitials = (name?: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleDelete = () => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      setIsDeleting(true)
      onDelete(task.id)
    }
  }

  return (
    <Card className="group relative border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs transition hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        {/* Header: Priority & Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
              PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium
            }`}
          >
            {task.priority}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={() => onEdit(task)}
              title="Edit task"
              className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete task"
              className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4
            className={`text-sm font-semibold text-[hsl(var(--foreground))] leading-snug ${
              task.status === 'done' ? 'line-through opacity-70' : ''
            }`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Assignee & Deadline Row */}
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-xs">
          {/* Assignee */}
          <div className="flex items-center gap-1.5">
            {task.assignee_name ? (
              <>
                <Avatar className="h-5 w-5 text-[9px] font-bold">
                  <AvatarFallback className="bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                    {getInitials(task.assignee_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[100px] font-medium text-[hsl(var(--foreground))]">
                  {task.assignee_name}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                <User className="h-3.5 w-3.5" />
                <span>Unassigned</span>
              </span>
            )}
          </div>

          {/* Deadline */}
          {formattedDeadline && (
            <div
              className={`flex items-center gap-1 font-medium ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-[hsl(var(--muted-foreground))]'
              }`}
              title={isOverdue ? 'Overdue!' : 'Due date'}
            >
              {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              <span>{formattedDeadline}</span>
            </div>
          )}
        </div>

        {/* ── Status Movement Bar ── */}
        <div className="flex items-center justify-between gap-1 border-t border-[hsl(var(--border))] pt-2.5">
          {task.status === 'to_do' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="w-full h-7 text-xs text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.08)] justify-center gap-1.5 font-semibold"
            >
              <span>Start Task</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}

          {task.status === 'in_progress' && (
            <div className="flex w-full items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(task.id, 'to_do')}
                title="Move back to To Do"
                className="h-7 px-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))]"
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(task.id, 'done')}
                className="flex-1 h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 justify-center gap-1 font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Done</span>
              </Button>
            </div>
          )}

          {task.status === 'done' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="w-full h-7 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))] justify-center gap-1"
            >
              <span>Reopen Task</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
