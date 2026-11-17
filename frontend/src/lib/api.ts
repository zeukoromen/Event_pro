/**
 * API Client — Axios instance configured for Event Pro
 *
 * All API calls go through this client:
 * - Automatically injects Supabase Auth Bearer token into Authorization header
 * - Centralizes error extraction
 * - Uses relative /api paths (proxied to FastAPI in dev)
 */

import axios from 'axios'
import { supabase } from '@/lib/supabase'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

// ---------------------------------------------------------------------------
// Request interceptor — attach Supabase Auth session token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Check for local dev bypass token
      const devToken = localStorage.getItem('event_pro_dev_token')
      if (devToken) {
        config.headers.Authorization = `Bearer ${devToken}`
      }
    }
  } catch (err) {
    console.warn('Failed to retrieve auth token for request', err)
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — normalize error messages
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred'

    return Promise.reject(new Error(message))
  },
)

// ---------------------------------------------------------------------------
// Health check helper
// ---------------------------------------------------------------------------
export async function checkApiHealth(): Promise<{
  status: string
  version: string
  environment: string
  timestamp: string
}> {
  const response = await apiClient.get('/api/v1/health')
  return response.data
}

// ---------------------------------------------------------------------------
// Profile & Auth API helpers
// ---------------------------------------------------------------------------
export interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export async function fetchCurrentProfile(): Promise<UserProfile> {
  const response = await apiClient.get('/api/v1/auth/me')
  return response.data
}

export async function updateProfile(data: { full_name?: string; avatar_url?: string }): Promise<UserProfile> {
  const response = await apiClient.patch('/api/v1/auth/me', data)
  return response.data
}

// ---------------------------------------------------------------------------
// Event API Types & Methods
// ---------------------------------------------------------------------------
export interface EventItem {
  id: string
  organizer_id: string
  public_token: string
  title: string
  description?: string | null
  category: string
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  cover_image_url?: string | null
  invitation_media_url?: string | null
  invitation_media_type?: 'image' | 'canva' | 'pdf' | null
  invitation_message?: string | null
  is_published: boolean
  allow_maybe_rsvp: boolean
  collect_dietary_preferences: boolean
  created_at: string
  updated_at: string
  attendee_count: number
  confirmed_count: number
  task_count: number
  completed_task_count: number
}

export interface EventCreateInput {
  title: string
  description?: string
  category?: string
  event_date?: string
  start_time?: string
  end_time?: string
  location?: string
  cover_image_url?: string
  invitation_media_url?: string
  invitation_media_type?: 'image' | 'canva' | 'pdf'
  invitation_message?: string
  is_published?: boolean
  allow_maybe_rsvp?: boolean
  collect_dietary_preferences?: boolean
}

export interface EventUpdateInput extends Partial<EventCreateInput> {}

export interface DashboardStatsData {
  upcoming_events: number
  total_events: number
  confirmed_guests: number
  pending_rsvps: number
  tasks_due: number
}

export async function fetchEvents(status?: string): Promise<EventItem[]> {
  const params = status ? { status } : {}
  const res = await apiClient.get('/api/v1/events', { params })
  return res.data
}

export async function fetchEventById(id: string): Promise<EventItem> {
  const res = await apiClient.get(`/api/v1/events/${id}`)
  return res.data
}

export async function createEvent(data: EventCreateInput): Promise<EventItem> {
  const res = await apiClient.post('/api/v1/events', data)
  return res.data
}

export async function updateEvent(id: string, data: EventUpdateInput): Promise<EventItem> {
  const res = await apiClient.put(`/api/v1/events/${id}`, data)
  return res.data
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/events/${id}`)
}

export async function fetchDashboardStats(): Promise<DashboardStatsData> {
  const res = await apiClient.get('/api/v1/dashboard/stats')
  return res.data
}

export async function fetchPublicEvent(token: string): Promise<EventItem> {
  const res = await apiClient.get(`/api/v1/events/public/${token}`)
  return res.data
}
// ---------------------------------------------------------------------------
// Attendee API Types & Methods
// ---------------------------------------------------------------------------
export interface AttendeeItem {
  id: string
  event_id: string
  user_id?: string | null
  name: string
  email: string
  role: string
  dietary_preferences?: string | null
  rsvp_status: 'pending' | 'attending' | 'maybe' | 'declined'
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface AttendeeCreateInput {
  name: string
  email: string
  role?: string
  dietary_preferences?: string
  rsvp_status?: string
  notes?: string
}

export interface AttendeeUpdateInput extends Partial<AttendeeCreateInput> {}

export interface AttendeeStatsData {
  total: number
  attending: number
  maybe: number
  declined: number
  pending: number
}

export interface AttendeeCSVImportResultData {
  total_processed: number
  imported: number
  skipped: number
  errors: string[]
}

export async function fetchAttendees(
  eventId: string,
  params?: { rsvp_status?: string; role?: string; search?: string },
): Promise<AttendeeItem[]> {
  const res = await apiClient.get(`/api/v1/events/${eventId}/attendees`, { params })
  return res.data
}

export async function fetchAttendeeStats(eventId: string): Promise<AttendeeStatsData> {
  const res = await apiClient.get(`/api/v1/events/${eventId}/attendees/stats`)
  return res.data
}

export async function createAttendee(
  eventId: string,
  data: AttendeeCreateInput,
): Promise<AttendeeItem> {
  const res = await apiClient.post(`/api/v1/events/${eventId}/attendees`, data)
  return res.data
}

export async function updateAttendee(
  eventId: string,
  attendeeId: string,
  data: AttendeeUpdateInput,
): Promise<AttendeeItem> {
  const res = await apiClient.put(
    `/api/v1/events/${eventId}/attendees/${attendeeId}`,
    data,
  )
  return res.data
}

export async function deleteAttendee(
  eventId: string,
  attendeeId: string,
): Promise<void> {
  await apiClient.delete(`/api/v1/events/${eventId}/attendees/${attendeeId}`)
}

export async function importAttendeesCSV(
  eventId: string,
  file: File,
): Promise<AttendeeCSVImportResultData> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiClient.post(
    `/api/v1/events/${eventId}/attendees/import-csv`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return res.data
}

// ── Public Invitation & RSVP ────────────────────────────────────────────────

export interface PublicRSVPData {
  name: string
  email: string
  rsvp_status: 'attending' | 'maybe' | 'declined'
  dietary_preferences?: string
  notes?: string
}

export interface PublicRSVPResponse {
  success: boolean
  message: string
  attendee: AttendeeItem
}

export async function submitPublicRSVP(
  token: string,
  data: PublicRSVPData,
): Promise<PublicRSVPResponse> {
  const res = await apiClient.post(`/api/v1/events/public/${token}/rsvp`, data)
  return res.data
}

// ---------------------------------------------------------------------------
// Task Collaboration API Types & Methods (Phase 6)
// ---------------------------------------------------------------------------

export interface TaskItem {
  id: string
  event_id: string
  assignee_id?: string | null
  assignee_name?: string | null
  assignee_email?: string | null
  title: string
  description?: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'to_do' | 'in_progress' | 'done'
  deadline?: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreateInput {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'to_do' | 'in_progress' | 'done'
  deadline?: string
  assignee_id?: string
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {}

export interface TaskStatsData {
  total: number
  to_do: number
  in_progress: number
  done: number
  progress_percentage: number
}

export async function fetchEventTasks(
  eventId: string,
  status?: string,
  priority?: string,
): Promise<TaskItem[]> {
  const params: Record<string, string> = {}
  if (status && status !== 'all') params.status = status
  if (priority && priority !== 'all') params.priority = priority
  const res = await apiClient.get(`/api/v1/events/${eventId}/tasks`, { params })
  return res.data
}

export async function createEventTask(
  eventId: string,
  data: TaskCreateInput,
): Promise<TaskItem> {
  const res = await apiClient.post(`/api/v1/events/${eventId}/tasks`, data)
  return res.data
}

export async function updateEventTask(
  eventId: string,
  taskId: string,
  data: TaskUpdateInput,
): Promise<TaskItem> {
  const res = await apiClient.put(
    `/api/v1/events/${eventId}/tasks/${taskId}`,
    data,
  )
  return res.data
}

export async function deleteEventTask(
  eventId: string,
  taskId: string,
): Promise<void> {
  await apiClient.delete(`/api/v1/events/${eventId}/tasks/${taskId}`)
}

export async function fetchEventTaskStats(
  eventId: string,
): Promise<TaskStatsData> {
  const res = await apiClient.get(`/api/v1/events/${eventId}/tasks/stats`)
  return res.data
}

export async function fetchMyTasks(): Promise<TaskItem[]> {
  const res = await apiClient.get('/api/v1/tasks/my')
  return res.data
}

// ---------------------------------------------------------------------------
// Media & Invitation Upload API
// ---------------------------------------------------------------------------

export interface UploadResult {
  url: string
  filename: string
  original_filename?: string
  media_type: 'image' | 'pdf'
  content_type: string
}

export async function uploadMediaFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiClient.post('/api/v1/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

// ---------------------------------------------------------------------------
// AI Event Planning Copilot API (Phase 7)
// ---------------------------------------------------------------------------

export interface SuggestedTask {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  days_before?: number | null
}

export interface GenerateTasksResponse {
  tasks: SuggestedTask[]
  category: string
  model_used: string
}

export interface GenerateInvitationResponse {
  invitation_message: string
  suggested_subject: string
  tone: string
  model_used: string
}

export interface AgendaItem {
  time: string
  title: string
  description: string
}

export interface GenerateAgendaResponse {
  agenda: AgendaItem[]
  model_used: string
}

export async function generateAITasks(data: {
  event_id?: string
  title: string
  category: string
  description?: string
  event_date?: string
  count?: number
}): Promise<GenerateTasksResponse> {
  const res = await apiClient.post('/api/v1/ai/generate-tasks', data)
  return res.data
}

export async function batchCreateTasks(
  eventId: string,
  tasks: SuggestedTask[],
): Promise<TaskItem[]> {
  const res = await apiClient.post('/api/v1/ai/batch-create-tasks', {
    event_id: eventId,
    tasks,
  })
  return res.data
}

export async function generateAIInvitation(data: {
  title: string
  category: string
  tone: string
  host_name?: string
  custom_prompt?: string
}): Promise<GenerateInvitationResponse> {
  const res = await apiClient.post('/api/v1/ai/generate-invitation', data)
  return res.data
}

export async function generateAIAgenda(data: {
  title: string
  category: string
  start_time?: string
  end_time?: string
}): Promise<GenerateAgendaResponse> {
  const res = await apiClient.post('/api/v1/ai/generate-agenda', data)
  return res.data
}




