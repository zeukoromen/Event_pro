import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * NotFoundPage — 404 for any unmatched route.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--surface))] px-4 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]">
        <Sparkles className="h-7 w-7 text-white" aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
        404
      </h1>
      <p className="mb-1 text-lg font-semibold text-[hsl(var(--foreground))]">
        Page not found
      </p>
      <p className="mb-8 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
