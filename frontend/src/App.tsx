import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { PublicInvitationPage } from '@/pages/PublicInvitationPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EventsPage } from '@/pages/EventsPage'
import { CreateEventPage } from '@/pages/CreateEventPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { TasksPage } from '@/pages/TasksPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * App — Root Application Router with Authentication Guard
 *
 * Route Hierarchy:
 *   /login             → Public authentication page (Google OAuth + Email)
 *   /e/:token          → Public unauthenticated invitation & RSVP page (Phase 5)
 *   
 *   Protected Organizer Workspace:
 *     /dashboard       → Organizer command center
 *     /events          → Events catalog
 *     /events/new      → Create new event with live preview
 *     /events/:id      → Event detail overview
 *     /events/:id/edit → Edit event
 *     /tasks           → Task tracking board
 *     /settings        → Organizer settings
 */

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/e/:token" element={<PublicInvitationPage />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Organizer Workspace */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<CreateEventPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
