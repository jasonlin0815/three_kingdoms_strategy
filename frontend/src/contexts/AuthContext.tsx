import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, type Session, type User } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'
import type { Provider } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  signInWithOAuth: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true // Start with loading true
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Update API client token
      apiClient.setAuthToken(session?.access_token ?? null)

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update API client token when auth state changes
        apiClient.setAuthToken(session?.access_token ?? null)

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })

        // Process pending invitations on sign-in
        if (event === 'SIGNED_IN' && session) {
          try {
            await apiClient.processPendingInvitations()
          } catch {
            // Don't block login if this fails
          }
        }
      }
    )

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [])

  const signInWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    ...authState,
    signInWithOAuth,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
