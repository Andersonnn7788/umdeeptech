'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Home, Calendar, MessageSquare, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DoctorChatbot from '@/components/DoctorChatbot'

export default function DermatologistDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [profileChecked, setProfileChecked] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/dermatologist')
    }
  }, [user, loading, router])

  // Check if doctor has completed their profile
  useEffect(() => {
    const checkDoctorProfile = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/doctors/${user.id}`)
        if (!response.ok) {
          // Doctor profile doesn't exist, redirect to setup
          router.push('/auth/doctor-setup')
          return
        }
        setProfileChecked(true)
      } catch (error) {
        console.error('Failed to check doctor profile:', error)
        // On error, allow them to proceed (they can fix it later via profile page)
        setProfileChecked(true)
      }
    }

    if (user) {
      checkDoctorProfile()
    }
  }, [user, router])

  if (loading || !profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null
  }

  const navItems = [
    {
      href: "/dermatologist",
      icon: Home,
      label: "Home",
      isActive: true,
      clickable: true,
      onClick: null
    },
    {
      href: "/dermatologist/appointments",
      icon: Calendar,
      label: "Appointments",
      isActive: false,
      clickable: true,
      onClick: null
    },
    {
      href: "#",
      icon: MessageSquare,
      label: "Chatbot",
      isActive: false,
      clickable: true,
      onClick: () => setIsChatbotOpen(true)
    },
    {
      href: "/dermatologist/profile",
      icon: User,
      label: "Profile",
      isActive: false,
      clickable: true,
      onClick: null
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md space-y-2 text-center">
          <div className="flex flex-col items-center justify-center">
            <Image 
              src="/skinlife-logo.png" 
              alt="SkinLife Logo" 
              width={400} 
              height={400}
              priority
              className="w-80 h-80 md:w-[28rem] md:h-[28rem] object-contain"
            />
          </div>

          {/* Doctor Action Button */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dermatologist/cases')}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Review Cases
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
          <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
            {navItems.map((item, index) => {
              if (item.onClick) {
                return (
                  <button
                    key={item.href}
                    onClick={item.onClick}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                        item.isActive 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Button>
                  </button>
                )
              }
              
              return (
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
              )
            })}
          </div>
        </div>
      </div>

      {/* Chatbot Modal */}
      <DoctorChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  )
}

