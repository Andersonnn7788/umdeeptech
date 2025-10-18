'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Home, Calendar, Heart, User, Mail, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DermatologistProfile() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/dermatologist/profile')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

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
      isActive: false,
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
      isActive: true,
      clickable: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Doctor Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* User Info */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              {user.user_metadata?.name && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium">{user.user_metadata.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Role Badge */}
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-950 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Dermatologist
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-3">
              <button
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors text-left flex items-center gap-3 opacity-50 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit Profile
                <span className="ml-auto text-xs text-gray-500">Coming Soon</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors flex items-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
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

