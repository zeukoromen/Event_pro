import { Bell, Search, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const { user, profile, signOut } = useAuth()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-[var(--topbar-height)] items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 lg:left-[var(--sidebar-width)] lg:px-6"
    >
      {/* Left: page title (visible on mobile only — desktop uses sidebar) */}
      {title && (
        <h1 className="mr-auto text-sm font-semibold text-[hsl(var(--foreground))] lg:hidden">
          {title}
        </h1>
      )}

      {/* Spacer on desktop */}
      <div className="hidden flex-1 lg:block" />

      {/* Right: actions & User profile */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]"
            aria-hidden="true"
          />
        </Button>

        {/* User Identity Chip */}
        <div className="ml-2 flex items-center gap-2.5 rounded-full border border-[hsl(var(--border))] py-1 pl-1 pr-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate text-xs font-medium text-[hsl(var(--foreground))]">
            {displayName}
          </span>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          title="Sign Out"
          aria-label="Sign Out"
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}
