import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Sidebar — fixed left navigation for the organizer dashboard.
 *
 * On desktop (lg+): always visible, 240px wide.
 * On mobile: hidden; replaced by the MobileNav bottom bar.
 *
 * Navigation items mirror the main routes. Each item shows:
 *   - Icon
 *   - Label
 *   - Active state (filled background)
 */

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Events',
    href: '/events',
    icon: CalendarDays,
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const

export function Sidebar() {
  const location = useLocation()

  return (
    <aside
      className={cn(
        // Hidden on mobile, visible on lg+
        'hidden lg:flex lg:flex-col',
        'fixed left-0 top-0 z-40 h-screen',
        'w-[var(--sidebar-width)] border-r border-[hsl(var(--border))]',
        'bg-[hsl(var(--card))]',
      )}
    >
      {/* ── Logo / Brand ── */}
      <div className="flex h-[var(--topbar-height)] items-center gap-2.5 border-b border-[hsl(var(--border))] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Event Pro
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href)

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-[calc(var(--radius)-2px)] px-3 py-2',
                'text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
                )}
                aria-hidden="true"
              />
              {item.label}
              {isActive && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-[hsl(var(--primary))]" aria-hidden="true" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Footer / AI Teaser ── */}
      <div className="border-t border-[hsl(var(--border))] px-3 py-4">
        <div className="rounded-[var(--radius)] bg-[hsl(var(--primary)/0.06)] px-3 py-3">
          <p className="text-xs font-medium text-[hsl(var(--primary))]">AI Copilot</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
            Coming in Phase 3
          </p>
        </div>
      </div>
    </aside>
  )
}
