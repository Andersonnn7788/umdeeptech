'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=Authentication failed')
          return
        }

        if (data.session) {
          // User is authenticated, redirect to home
          setStatus('Authentication successful!')
          setTimeout(() => router.push('/'), 1000)
        } else {
          // No session, redirect to login
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        router.push('/auth/login?error=Something went wrong')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center text-white">
        <LoadingSpinner />
        <p className="mt-4 text-lg">{status}</p>
      </div>
    </div>
  )
}