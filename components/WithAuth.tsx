'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface WithAuthProps {
  children: React.ReactNode
  redirectTo?: string
  showLoading?: boolean
}

export function WithAuth({ 
  children, 
  redirectTo = '/profile',
  showLoading = true 
}: WithAuthProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if not loading and no user
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading spinner while checking auth
  if (loading) {
    if (!showLoading) return null
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/profile'
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <WithAuth redirectTo={redirectTo}>
        <Component {...props} />
      </WithAuth>
    )
  }
}