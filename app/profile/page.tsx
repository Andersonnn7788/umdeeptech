'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, User, Mail, Lock, LogOut, Camera } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import BottomNavigation from '@/components/BottomNavigation'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || user.user_metadata?.display_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        dateOfBirth: user.user_metadata?.date_of_birth || ''
      })
    }
  }, [user])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      setError('Failed to sign out')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // For now, just show success message
    // In a real app, you would update the user profile in Supabase
    setTimeout(() => {
      setSuccess('Profile updated successfully!')
      setIsLoading(false)
    }, 1000)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-sans text-xl font-bold text-foreground">Profile</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 border-4 border-white/40 shadow-xl">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={profileData.name} />
                <AvatarFallback className="bg-white/20 text-white font-bold text-2xl">
                  {profileData.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-1">{profileData.name || 'User'}</h2>
            <p className="text-white/90 text-sm">{profileData.email}</p>
            <p className="text-white/70 text-xs mt-2">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold text-foreground mb-4">Personal Information</h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Full Name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                disabled
              />
            </div>

            <div className="relative">
              <Input
                type="tel"
                placeholder="Phone Number"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Input
                type="date"
                placeholder="Date of Birth"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 text-sm text-center p-2 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 bg-green-50 text-sm text-center p-2 rounded-lg">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="text-lg font-bold text-foreground mb-4">Account Settings</h3>
          
          <Link href="/auth/forgot-password">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-blue-400 flex items-center justify-center gap-2"
            >
              <Lock className="h-5 w-5" />
              Change Password
            </Button>
          </Link>

          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center justify-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}