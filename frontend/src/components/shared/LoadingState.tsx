/**
 * LoadingState — skeleton components for loading screens.
 *
 * Rule: skeletons match the shape of the content they replace.
 * Use skeletons for initial page loads and full section loads.
 * Use inline spinners for button actions.
 *
 * Components:
 *   Skeleton        → base animated placeholder block
 *   StatCardSkeleton → matches StatCard shape
 *   EventCardSkeleton → matches EventCard shape
 */

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[hsl(var(--muted))]', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mb-1 h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="mb-3 flex gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}
