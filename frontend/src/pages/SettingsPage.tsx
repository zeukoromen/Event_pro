import { Settings } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/shared/EmptyState'

/**
 * SettingsPage — account and application settings.
 * Phase 1: scaffold.
 * Phase 2: profile settings, notification preferences.
 */
export function SettingsPage() {
  return (
    <PageShell title="Settings">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Manage your account and preferences.
        </p>
      </div>

      <EmptyState
        icon={Settings}
        title="Settings coming in Phase 2"
        description="Account settings, notification preferences, and integrations will be available after authentication is implemented."
      />
    </PageShell>
  )
}
