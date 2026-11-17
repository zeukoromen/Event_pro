import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'

/**
 * PageShell — the authenticated organizer layout wrapper.
 *
 * Structure:
 *   ┌────────────┬───────────────────────────────┐
 *   │  Sidebar   │  TopBar                        │
 *   │  (desktop) ├───────────────────────────────┤
 *   │            │  <children> (scrollable)       │
 *   │            │                                │
 *   └────────────┴───────────────────────────────┘
 *   └── MobileNav (mobile, bottom) ──────────────┘
 *
 * Usage:
 *   <PageShell title="Dashboard">
 *     <YourPageContent />
 *   </PageShell>
 */

interface PageShellProps {
  children: React.ReactNode
  /** Page title shown in the mobile top bar */
  title?: string
}

export function PageShell({ children, title }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* Left sidebar — desktop only */}
      <Sidebar />

      {/* Top bar — fixed, offset from sidebar on desktop */}
      <TopBar title={title} />

      {/* Main content area */}
      <main
        className={[
          // Top padding = topbar height so content doesn't hide behind it
          'pt-[var(--topbar-height)]',
          // Left margin = sidebar width on desktop
          'lg:pl-[var(--sidebar-width)]',
          // Bottom padding for mobile nav
          'pb-20 lg:pb-0',
          // Content padding
          'px-4 py-6 sm:px-6 lg:px-8',
        ].join(' ')}
      >
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  )
}
