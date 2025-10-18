'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Home, Calendar, Heart, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DermatologistAppointments() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/dermatologist/appointments')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems = [
    {
      href: "/dermatologist",
      icon: Home,
      label: "Home",
      isActive: false,
      clickable: true
    },
    {
      href: "/dermatologist/appointments",
      icon: Calendar,
      label: "Appointments",
      isActive: true,
      clickable: true
    },
    {
      href: "#",
      icon: Heart,
      label: "Health",
      isActive: false,
      clickable: false
    },
    {
      href: "/dermatologist/profile",
      icon: User,
      label: "Profile",
      isActive: false,
      clickable: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your patient appointments
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Doctor appointment management feature is under development.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You'll be able to view and manage your patient appointments here.
            </p>
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
          <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.clickable ? item.href : "#"}
                className={`flex flex-col items-center gap-1 flex-1 ${!item.clickable ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!item.clickable}
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                    item.isActive 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

