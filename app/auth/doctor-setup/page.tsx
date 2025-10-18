'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowRight, Stethoscope } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DoctorSetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    title: '',
    experience: '',
    category: 'Dermatology' as const,
    location: ''
  })

  useEffect(() => {
    // Get current user info
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      
      // Check if user has doctor role
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (!result.success || result.data?.role !== 'doctor') {
        router.push('/auth/role-selection')
        return
      }
      
      setUser(user)
      
      // Try to fetch existing doctor profile
      try {
        const doctorResponse = await fetch(`/api/doctors/${user.id}`)
        if (doctorResponse.ok) {
          const doctorProfile = await doctorResponse.json()
          setFormData({
            name: doctorProfile.name || user.user_metadata?.name || result.data?.name || user.email?.split('@')[0] || '',
            specialty: doctorProfile.specialty || '',
            title: doctorProfile.title || '',
            experience: doctorProfile.experience || '',
            category: doctorProfile.category || 'Dermatology',
            location: doctorProfile.location || ''
          })
        } else {
          // No existing profile, use defaults
          setFormData(prev => ({
            ...prev,
            name: user.user_metadata?.name || result.data?.name || user.email?.split('@')[0] || ''
          }))
        }
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error)
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata?.name || result.data?.name || user.email?.split('@')[0] || ''
        }))
      }
    }

    getCurrentUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    // Validation
    if (!formData.specialty || !formData.title || !formData.experience) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create doctor profile
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: formData.name,
          specialty: formData.specialty,
          title: formData.title,
          experience: formData.experience,
          category: formData.category,
          location: formData.location || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create doctor profile')
      }

      // Redirect to doctor dashboard
      router.push('/dermatologist')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create doctor profile')
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
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Stethoscope className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formData.specialty ? 'Update Your Doctor Profile' : 'Complete Your Doctor Profile'}
            </h1>
            <p className="text-gray-600 text-lg">
              {formData.specialty ? 'Update your professional information' : 'Please provide your professional information'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full h-12 rounded-lg"
                placeholder="Dr. John Doe"
              />
            </div>

            {/* Specialty */}
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                Specialty <span className="text-red-500">*</span>
              </label>
              <Input
                id="specialty"
                name="specialty"
                type="text"
                required
                value={formData.specialty}
                onChange={handleInputChange}
                className="w-full h-12 rounded-lg"
                placeholder="e.g., Acne, Eczema, Allergy, Psoriasis"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter your areas of specialization (e.g., acne, eczema, allergy)
              </p>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Professional Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full h-12 rounded-lg"
                placeholder="e.g., Senior Dermatologist, Skin Specialist"
              />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Experience <span className="text-red-500">*</span>
              </label>
              <Input
                id="experience"
                name="experience"
                type="text"
                required
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full h-12 rounded-lg"
                placeholder="e.g., 10+ years experience in dermatology"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full h-12 rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Dermatology">Dermatology</option>
                <option value="Medical">Medical</option>
                <option value="Surgical">Surgical</option>
                <option value="Pediatric">Pediatric</option>
                <option value="Allergy">Allergy</option>
              </select>
            </div>

            {/* Location (optional) */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full h-12 rounded-lg"
                placeholder="e.g., City Medical Center"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving Profile...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {formData.specialty ? 'Update Profile' : 'Complete Setup'}
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

