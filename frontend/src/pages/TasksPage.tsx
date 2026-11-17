import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  CheckCircle2,
  Clock,
  CircleDashed,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ListTodo,
} from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import {
  fetchEvents,
  fetchMyTasks,
  updateEventTask,
} from '@/lib/api'

export function TasksPage() {
  const queryClient = useQueryClient()
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  // Fetch events for dropdown
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetchEvents(),
  })

  // Fetch all tasks across organizer's events
  const { data: myTasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => fetchMyTasks(),
    enabled: selectedEventId === 'all',
  })

  // Mutation for quick status transition on all-tasks view
  const statusMutation = useMutation({
    mutationFn: ({ eventId, taskId, status }: { eventId: string; taskId: string; status: 'to_do' | 'in_progress' | 'done' }) =>
      updateEventTask(eventId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Filter cross-event tasks
  const filteredTasks = myTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.assignee_name && t.assignee_name.toLowerCase().includes(search.toLowerCase()))

    const matchesPriority =
      priorityFilter === 'all' || t.priority === priorityFilter

    return matchesSearch && matchesPriority
  })

  const todoList = filteredTasks.filter((t) => t.status === 'to_do')
  const inProgressList = filteredTasks.filter((t) => t.status === 'in_progress')
  const doneList = filteredTasks.filter((t) => t.status === 'done')

  return (
    <PageShell title="Tasks">
      {/* ── Top Header & Event Selector ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Task Collaboration
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Manage preparations, assignments, and Kanban progress across your events.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-semibold text-[hsl(var(--foreground))] shadow-xs focus:border-[hsl(var(--primary))] focus:outline-none"
          >
            <option value="all">All Events Workspace ({myTasks.length} tasks)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.task_count} tasks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── View 1: Specific Event Kanban Board ── */}
      {selectedEventId !== 'all' ? (
        <KanbanBoard eventId={selectedEventId} isOrganizer />
      ) : (
        /* ── View 2: Global Cross-Event Task View ── */
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Search across all event tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] py-2 pl-9 pr-3 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              />
            </div>

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

          {/* 3 Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
            {/* To Do */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <CircleDashed className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">To Do</h3>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                  {todoList.length}
                </span>
              </div>

              <div className="mt-4 space-y-3 min-h-[160px]">
                {isTasksLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-[hsl(var(--card))]" />
                ) : todoList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    <ListTodo className="h-6 w-6 text-[hsl(var(--muted-foreground)/0.5)] mb-1" />
                    <p>No tasks to do</p>
                  </div>
                ) : (
                  todoList.map((task) => (
                    <Card key={task.id} className="border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                            {task.priority}
                          </span>
                          {task.deadline && (
                            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-[hsl(var(--foreground))]">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2">
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            {task.assignee_name || 'Unassigned'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              statusMutation.mutate({
                                eventId: task.event_id,
                                taskId: task.id,
                                status: 'in_progress',
                              })
                            }
                            className="h-6 px-2 text-[11px] text-[hsl(var(--primary))] font-semibold"
                          >
                            <span>Start</span>
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* In Progress */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">In Progress</h3>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[11px] font-bold text-[hsl(var(--primary))]">
                  {inProgressList.length}
                </span>
              </div>

              <div className="mt-4 space-y-3 min-h-[160px]">
                {isTasksLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-[hsl(var(--card))]" />
                ) : inProgressList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    <Clock className="h-6 w-6 text-[hsl(var(--muted-foreground)/0.5)] mb-1" />
                    <p>No active tasks</p>
                  </div>
                ) : (
                  inProgressList.map((task) => (
                    <Card key={task.id} className="border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                            {task.priority}
                          </span>
                          {task.deadline && (
                            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-[hsl(var(--foreground))]">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              statusMutation.mutate({
                                eventId: task.event_id,
                                taskId: task.id,
                                status: 'to_do',
                              })
                            }
                            className="h-6 px-1.5 text-[11px] text-[hsl(var(--muted-foreground))]"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              statusMutation.mutate({
                                eventId: task.event_id,
                                taskId: task.id,
                                status: 'done',
                              })
                            }
                            className="h-6 px-2 text-[11px] text-emerald-600 font-semibold"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span>Done</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Completed */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Completed</h3>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {doneList.length}
                </span>
              </div>

              <div className="mt-4 space-y-3 min-h-[160px]">
                {isTasksLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-[hsl(var(--card))]" />
                ) : doneList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    <CheckCircle2 className="h-6 w-6 text-[hsl(var(--muted-foreground)/0.5)] mb-1" />
                    <p>No completed tasks yet</p>
                  </div>
                ) : (
                  doneList.map((task) => (
                    <Card key={task.id} className="border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs opacity-75">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            Completed
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold line-through text-[hsl(var(--foreground))]">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2">
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            {task.assignee_name || 'Unassigned'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              statusMutation.mutate({
                                eventId: task.event_id,
                                taskId: task.id,
                                status: 'in_progress',
                              })
                            }
                            className="h-6 px-2 text-[11px] text-[hsl(var(--muted-foreground))]"
                          >
                            <span>Reopen</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
