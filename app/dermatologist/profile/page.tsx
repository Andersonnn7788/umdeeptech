'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Home, Calendar, MessageSquare, User, Mail, LogOut, Stethoscope, Award, Briefcase, MapPin, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DoctorChatbot from '@/components/DoctorChatbot'

interface DoctorProfile {
  id: string
  name: string
  specialty: string
  title: string
  experience: string
  category: string
  location?: string
  rating: number
}

export default function DermatologistProfile() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/dermatologist/profile')
    }
  }, [user, loading, router])

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/doctors/${user.id}`)
        if (response.ok) {
          const profile = await response.json()
          setDoctorProfile(profile)
        }
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    if (user) {
      fetchDoctorProfile()
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleEditProfile = () => {
    router.push('/auth/doctor-setup')
  }

  if (loading || profileLoading) {
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
      isActive: true,
      clickable: true,
      onClick: null
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 mt-8 shadow-xl">
              <User className="w-8 h-8 text-white" />
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
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium">{doctorProfile?.name || user.user_metadata?.name || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            {doctorProfile && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Specialty</p>
                    <p className="font-medium">{doctorProfile.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Title</p>
                    <p className="font-medium">{doctorProfile.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                    <p className="font-medium">{doctorProfile.experience}</p>
                  </div>
                </div>

                {doctorProfile.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium">{doctorProfile.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                    <p className="font-medium">{doctorProfile.rating.toFixed(1)} / 5.0</p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Badge */}
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-950 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {doctorProfile?.category || 'Dermatologist'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-3">
              <button
                onClick={handleEditProfile}
                className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-medium transition-colors flex items-center gap-3"
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
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
            {navItems.map((item) => {
              if (item.onClick) {
                return (
                  <Button
                    key={item.href}
                    onClick={item.onClick}
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 flex-1 ${
                      item.isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
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

