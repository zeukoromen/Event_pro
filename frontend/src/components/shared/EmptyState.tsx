import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * EmptyState — shown when a list or section has no data.
 *
 * Design principle: an empty state is a teaching moment.
 * Always include what's missing, why it matters, and what to do next.
 *
 * Usage:
 *   <EmptyState
 *     icon={CalendarDays}
 *     title="No events yet"
 *     description="Every great event starts here. Create your first event to get started."
 *     action={{ label: 'Create event', onClick: () => navigate('/events/new') }}
 *   />
 */

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    href: string
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className ?? '',
      ].join(' ')}
    >
      {/* Icon container */}
      <div className="mb-4 rounded-full bg-[hsl(var(--primary)/0.08)] p-4">
        <Icon
          className="h-7 w-7 text-[hsl(var(--primary))]"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      </div>

      {/* Copy */}
      <h3 className="mb-1.5 text-base font-semibold text-[hsl(var(--foreground))]">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <a
          href={secondaryAction.href}
          className="mt-3 text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          {secondaryAction.label}
        </a>
      )}
    </div>
  )
}
