import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * MobileNav — bottom tab bar for small screens (< lg breakpoint).
 *
 * Replaces the sidebar on mobile.
 * Fixed to the bottom of the viewport so content can scroll behind it.
 * Shows 4 icon + label tabs.
 */

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Events', href: '/events', icon: CalendarDays },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

export function MobileNav() {
  const location = useLocation()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'flex items-center justify-around',
        'h-16 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]',
        'lg:hidden', // Hidden on desktop — sidebar takes over
        'safe-area-pb', // Respect iOS home indicator
      )}
      aria-label="Main navigation"
    >
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
              'flex flex-1 flex-col items-center justify-center gap-1 py-2',
              'text-xs font-medium transition-colors',
              isActive
                ? 'text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))]',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon
              className={cn(
                'h-5 w-5 transition-colors',
                isActive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]',
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
