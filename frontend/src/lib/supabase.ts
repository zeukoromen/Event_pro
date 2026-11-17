import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration
 *
 * Reads project credentials from Vite environment variables.
 * Includes defensive URL validation so invalid or placeholder URLs
 * (like https://[project-ref].supabase.co) never crash the app with
 * TypeError: Invalid URL.
 */

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('[project-ref]') &&
  !rawKey.includes('your-anon-key') &&
  rawUrl.startsWith('https://')
)

// Ensure URL is structurally valid according to RFC 3986
function getValidUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch {
    return 'https://placeholder.supabase.co'
  }
}

const safeUrl = isSupabaseConfigured ? getValidUrl(rawUrl) : 'https://placeholder.supabase.co'
// Valid dummy JWT structure (header.payload.signature) to satisfy Supabase client parser
const safeKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-signature'

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
})
