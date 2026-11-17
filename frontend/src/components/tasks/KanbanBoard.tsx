import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  CircleDashed,
  ListTodo,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskModal } from '@/components/tasks/TaskModal'
import { AITaskGeneratorModal } from '@/components/ai/AITaskGeneratorModal'
import {
  fetchEventTasks,
  fetchAttendees,
  fetchEventTaskStats,
  updateEventTask,
  deleteEventTask,
  type TaskItem,
} from '@/lib/api'

interface KanbanBoardProps {
  eventId: string
  isOrganizer?: boolean
  eventTitle?: string
  eventCategory?: string
  eventDescription?: string
  eventDate?: string
}

export function KanbanBoard({
  eventId,
  eventTitle,
  eventCategory,
  eventDescription,
  eventDate,
}: KanbanBoardProps) {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null)

  // Queries
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', eventId],
    queryFn: () => fetchEventTasks(eventId),
  })

  const { data: attendees = [] } = useQuery({
    queryKey: ['attendees', eventId],
    queryFn: () => fetchAttendees(eventId),
  })

  const { data: stats } = useQuery({
    queryKey: ['tasks-stats', eventId],
    queryFn: () => fetchEventTaskStats(eventId),
  })

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'to_do' | 'in_progress' | 'done' }) =>
      updateEventTask(eventId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] })
      queryClient.invalidateQueries({ queryKey: ['tasks-stats', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteEventTask(eventId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] })
      queryClient.invalidateQueries({ queryKey: ['tasks-stats', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
    },
  })

  // Filter tasks based on search & priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(search.toLowerCase()))

      const matchesPriority =
        priorityFilter === 'all' || t.priority === priorityFilter

      return matchesSearch && matchesPriority
    })
  }, [tasks, search, priorityFilter])

  // Group into Kanban columns
  const todoTasks = filteredTasks.filter((t) => t.status === 'to_do')
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress')
  const doneTasks = filteredTasks.filter((t) => t.status === 'done')

  const handleEdit = (task: TaskItem) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  const handleOpenCreate = () => {
    setTaskToEdit(null)
    setIsModalOpen(true)
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* ── Top Header & Progress Row ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="space-y-1.5 flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[hsl(var(--foreground))]">Task Completion Progress</span>
            <span className="text-[hsl(var(--primary))] font-bold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            {completedTasks} of {totalTasks} tasks completed
            {stats && stats.in_progress > 0 && ` • ${stats.in_progress} in progress`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAiModalOpen(true)}
            className="gap-1.5 border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-semibold shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>AI Task Copilot</span>
          </Button>

          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, or assignees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] py-2 pl-9 pr-3 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          <span className="font-medium text-[hsl(var(--muted-foreground))]">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* ── Kanban Board Columns ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Column 1: To Do */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <CircleDashed className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">To Do</h3>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
              {todoTasks.length}
            </span>
          </div>

          <div className="mt-4 space-y-3 min-h-[160px]">
            {isTasksLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-[hsl(var(--card))]" />
            ) : todoTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                <ListTodo className="h-6 w-6 text-[hsl(var(--muted-foreground)/0.5)] mb-1" />
                <p>No tasks to do</p>
              </div>
            ) : (
              todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, st) => statusMutation.mutate({ taskId: id, status: st })}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">In Progress</h3>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[11px] font-bold text-[hsl(var(--primary))]">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="mt-4 space-y-3 min-h-[160px]">
            {isTasksLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-[hsl(var(--card))]" />
            ) : inProgressTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                <Clock className="h-6 w-6 text-[hsl(var(--muted-foreground)/0.5)] mb-1" />
                <p>No active tasks in progress</p>
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, st) => statusMutation.mutate({ taskId: id, status: st })}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Completed</h3>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {doneTasks.length}
            </span>
          </div>

          <div className="mt-4 space-y-3 min-h-[160px]">
            {isTasksLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-[hsl(var(--card))]" />
            ) : doneTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                <CheckCircle2 className="h-6 w-6 text-[hsl(var(--muted-foreground)/0.5)] mb-1" />
                <p>No completed tasks yet</p>
              </div>
            ) : (
              doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, st) => statusMutation.mutate({ taskId: id, status: st })}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Task Create/Edit Modal ── */}
      <TaskModal
        eventId={eventId}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setTaskToEdit(null)
        }}
        taskToEdit={taskToEdit}
        attendees={attendees}
      />

      {/* ── AI Task Generator Modal ── */}
      <AITaskGeneratorModal
        eventId={eventId}
        eventTitle={eventTitle || 'Event'}
        eventCategory={eventCategory || 'General'}
        eventDescription={eventDescription}
        eventDate={eventDate}
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  )
}
