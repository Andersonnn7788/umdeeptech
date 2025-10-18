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
          // User is authenticated, check role and redirect appropriately
          setStatus('Authentication successful!')
          
          try {
            // Get user role for redirection
            const response = await fetch('/api/users')
            const result = await response.json()
            
            if (result.success && result.data?.role) {
              const role = result.data.role
              
              // Check if user was auto-created with default patient role
              // If created and updated at same time with patient role, assume it's auto-created
              const createdAt = new Date(result.data.created_at)
              const updatedAt = new Date(result.data.updated_at) 
              const timeDiff = Math.abs(updatedAt.getTime() - createdAt.getTime()) / 1000 // seconds
              
              // If role is patient and record was created within 5 seconds, redirect to role selection
              if (role === 'patient' && timeDiff < 5) {
                console.log('Auto-created patient detected, redirecting to role selection')
                setTimeout(() => router.push('/auth/role-selection'), 1000)
              } else {
                // User has a properly set role, redirect to appropriate dashboard
                const dashboardUrl = role === 'doctor' ? '/dermatologist' : '/appointments'
                setTimeout(() => router.push(dashboardUrl), 1000)
              }
            } else {
              // User record not found, might be first OAuth login - redirect to role selection
              setTimeout(() => router.push('/auth/role-selection'), 1000)
            }
          } catch (error) {
            console.error('Error checking user role:', error)
            // Fallback to role selection to be safe
            setTimeout(() => router.push('/auth/role-selection'), 1000)
          }
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