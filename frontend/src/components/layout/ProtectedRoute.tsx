import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Sparkles } from 'lucide-react'

/**
 * ProtectedRoute Guard
 *
 * Restricts organizer views to authenticated sessions.
 * Redirects unauthenticated visitors to /login while preserving the
 * requested destination route in navigation state.
 */

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--surface))]">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-[hsl(var(--primary))]">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <p className="mt-4 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          Verifying session…
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
