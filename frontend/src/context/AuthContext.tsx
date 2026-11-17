import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { fetchCurrentProfile, type UserProfile } from '@/lib/api'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isSupabaseConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  devLogin: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load and synchronize user profile from backend
  const syncProfile = async () => {
    try {
      const p = await fetchCurrentProfile()
      setProfile(p)
    } catch (err) {
      console.warn('Backend profile sync deferred:', err)
    }
  }

  useEffect(() => {
    // Check if dev bypass session is active
    const devUserJson = localStorage.getItem('event_pro_dev_user')
    if (devUserJson) {
      try {
        const devUser = JSON.parse(devUserJson)
        setUser(devUser as User)
        setProfile({
          id: devUser.id,
          email: devUser.email || 'developer@eventpro.local',
          full_name: devUser.user_metadata?.full_name || 'Alex Morgan',
          avatar_url: devUser.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        setIsLoading(false)
        return
      } catch {
        localStorage.removeItem('event_pro_dev_user')
        localStorage.removeItem('event_pro_dev_token')
      }
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    // Initialize Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        syncProfile()
      }
      setIsLoading(false)
    })

    // Listen for auth state transitions (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await syncProfile()
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ── Authentication Actions ────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      devLogin()
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      devLogin()
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) {
      devLogin()
      return { error: null }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    localStorage.removeItem('event_pro_dev_user')
    localStorage.removeItem('event_pro_dev_token')
    setUser(null)
    setSession(null)
    setProfile(null)
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
  }

  // Developer bypass login for local testing without Supabase setup
  const devLogin = () => {
    const mockUser: Partial<User> = {
      id: 'usr_dev_01j7890abcdef12345678',
      email: 'alex.organizer@eventpro.local',
      user_metadata: {
        full_name: 'Alex Morgan',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    }
    // Simple base64 payload JWT for local mock decoding
    const mockToken = `dev_jwt_${mockUser.id}`
    localStorage.setItem('event_pro_dev_user', JSON.stringify(mockUser))
    localStorage.setItem('event_pro_dev_token', mockToken)
    setUser(mockUser as User)
    setProfile({
      id: mockUser.id as string,
      email: mockUser.email as string,
      full_name: 'Alex Morgan',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setIsLoading(false)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isSupabaseConfigured,
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      devLogin,
    }),
    [user, session, profile, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
