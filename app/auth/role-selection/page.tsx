'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User, Stethoscope, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function RoleSelectionPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get current user info
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    }

    getCurrentUser()
  }, [router])

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if user already exists (might be auto-created)
      const checkResponse = await fetch('/api/users')
      const checkResult = await checkResponse.json()
      
      let response
      
      if (checkResult.success && checkResult.data) {
        // User exists, update their role
        console.log('Updating existing user role to:', selectedRole)
        response = await fetch('/api/users', {
          method: 'POST', // Our API uses upsert, so POST works for updates too
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            name: user.user_metadata?.name || checkResult.data.name || user.email?.split('@')[0] || 'User',
            email: user.email,
            role: selectedRole
          })
        })
      } else {
        // User doesn't exist, create new record
        console.log('Creating new user with role:', selectedRole)
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email,
            role: selectedRole
          })
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save role')
      }

      // Redirect to appropriate dashboard
      const dashboardUrl = selectedRole === 'doctor' ? '/dermatologist' : '/appointments'
      router.push(dashboardUrl)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to SkinLife!
            </h1>
            <p className="text-gray-600 text-lg">
              Please select your role to get started
            </p>
            {user.email && (
              <p className="text-sm text-gray-500 mt-2">
                Signed in as {user.email}
              </p>
            )}
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Patient Role */}
            <Card 
              className={`p-6 cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
                selectedRole === 'patient' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedRole('patient')}
            >
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  selectedRole === 'patient' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <User className={`h-8 w-8 ${
                    selectedRole === 'patient' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Patient</h3>
                <p className="text-gray-600 text-sm">
                  Book appointments, track your health, and get skin analysis reports
                </p>
              </div>
            </Card>

            {/* Doctor Role */}
            <Card 
              className={`p-6 cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
                selectedRole === 'doctor' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedRole('doctor')}
            >
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  selectedRole === 'doctor' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <Stethoscope className={`h-8 w-8 ${
                    selectedRole === 'doctor' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor</h3>
                <p className="text-gray-600 text-sm">
                  Review cases, manage appointments, and provide professional consultations
                </p>
              </div>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Setting up your account...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Continue as {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : 'User'}
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}