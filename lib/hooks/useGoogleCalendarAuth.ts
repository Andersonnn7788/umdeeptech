"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useGoogleCalendarAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          
          // Check if user signed in with Google OAuth
          const provider = session.user.app_metadata?.provider
          const providers = session.user.app_metadata?.providers || []
          const identities = session.user.identities || []
          
          // Check multiple ways to detect Google OAuth
          const isGoogle = provider === 'google' || 
                          providers.includes('google') ||
                          identities.some((identity: any) => identity.provider === 'google')
          
          // Debug logging
          console.log('Auth Debug:', {
            provider,
            providers,
            identities,
            isGoogle,
            userMetadata: session.user.user_metadata,
            appMetadata: session.user.app_metadata
          })
          
          setIsGoogleUser(isGoogle)
          
          // If user signed in with Google OAuth, they have calendar access
          // since we request calendar scope in the OAuth flow
          setHasCalendarAccess(isGoogle)
        } else {
          setUser(null)
          setIsGoogleUser(false)
          setHasCalendarAccess(false)
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        setUser(null)
        setIsGoogleUser(false)
        setHasCalendarAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAuthStatus()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsGoogleUser(false)
          setHasCalendarAccess(false)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    isGoogleUser,
    hasCalendarAccess,
    loading
  }
}