'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, Circle, Camera, Upload, X, ArrowLeft } from 'lucide-react'
import { WithAuth } from '@/components/WithAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

interface MedicationSchedule {
  id: string
  name: string
  dosage: string
  instructions: string
  time_of_day: string
  label: string
  scheduled_date: string
  is_completed: boolean
  proof_image_url?: string
}

interface DaySchedule {
  date: string
  schedules: MedicationSchedule[]
}

function MedicationTodoPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<DaySchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<MedicationSchedule | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchMedicationSchedules()
    // Use mock medication data for multiple days as fallback
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    setSchedules([
      {
        date: yesterdayStr,
        schedules: [
          {
            id: 'y1',
            name: 'Metformin',
            dosage: '500mg',
            instructions: 'Take with meals to reduce stomach upset',
            time_of_day: '08:00:00',
            label: '8:00 AM',
            scheduled_date: yesterdayStr,
            is_completed: true
          },
          {
            id: 'y2',
            name: 'Vitamin D3',
            dosage: '1000 IU',
            instructions: 'Take with breakfast for better absorption',
            time_of_day: '08:30:00',
            label: '8:30 AM',
            scheduled_date: yesterdayStr,
            is_completed: true
          },
          {
            id: 'y3',
            name: 'Metformin',
            dosage: '500mg',
            instructions: 'Take with meals to reduce stomach upset',
            time_of_day: '18:00:00',
            label: '6:00 PM',
            scheduled_date: yesterdayStr,
            is_completed: true
          }
        ]
      },
      {
        date: today,
        schedules: [
          {
            id: '1',
            name: 'Metformin',
            dosage: '500mg',
            instructions: 'Take with meals to reduce stomach upset',
            time_of_day: '08:00:00',
            label: '8:00 AM',
            scheduled_date: today,
            is_completed: true
          },
          {
            id: '2',
            name: 'Vitamin D3',
            dosage: '1000 IU',
            instructions: 'Take with breakfast for better absorption',
            time_of_day: '08:30:00',
            label: '8:30 AM',
            scheduled_date: today,
            is_completed: false
          },
          {
            id: '3',
            name: 'Omega-3',
            dosage: '1200mg',
            instructions: 'Take with food to improve absorption',
            time_of_day: '12:00:00',
            label: '12:00 PM',
            scheduled_date: today,
            is_completed: false
          },
          {
            id: '4',
            name: 'Metformin',
            dosage: '500mg',
            instructions: 'Take with meals to reduce stomach upset',
            time_of_day: '18:00:00',
            label: '6:00 PM',
            scheduled_date: today,
            is_completed: false
          },
          {
            id: '5',
            name: 'Lisinopril',
            dosage: '10mg',
            instructions: 'Take at the same time each day',
            time_of_day: '20:00:00',
            label: '8:00 PM',
            scheduled_date: today,
            is_completed: false
          }
        ]
      },
      {
        date: tomorrowStr,
        schedules: [
          {
            id: 't1',
            name: 'Metformin',
            dosage: '500mg',
            instructions: 'Take with meals to reduce stomach upset',
            time_of_day: '08:00:00',
            label: '8:00 AM',
            scheduled_date: tomorrowStr,
            is_completed: false
          },
          {
            id: 't2',
            name: 'Vitamin D3',
            dosage: '1000 IU',
            instructions: 'Take with breakfast for better absorption',
            time_of_day: '08:30:00',
            label: '8:30 AM',
            scheduled_date: tomorrowStr,
            is_completed: false
          },
          {
            id: 't3',
            name: 'Omega-3',
            dosage: '1200mg',
            instructions: 'Take with food to improve absorption',
            time_of_day: '12:00:00',
            label: '12:00 PM',
            scheduled_date: tomorrowStr,
            is_completed: false
          }
        ]
      }
    ])
    setIsLoading(false)
  }, [])

  const fetchMedicationSchedules = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/medications/schedule')
      const result = await response.json()

      if (result.success) {
        setSchedules(result.data)
      }
    } catch (error) {
      console.error('Error fetching medication schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return days[date.getDay()]
    }
  }

  const handleTaskClick = (task: MedicationSchedule) => {
    const today = new Date().toISOString().split('T')[0]
    // Only allow interaction with today's incomplete tasks
    if (!task.is_completed && task.scheduled_date === today) {
      setSelectedTask(task)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const uploadProofImage = async (file: File, userId: string) => {
    const fileName = `${userId}/${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('medication-proofs')
      .upload(fileName, file)

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('medication-proofs')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleCompleteTask = async () => {
    if (!selectedTask || !selectedImage) return

    try {
      setIsUploading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Upload proof image
      const imageUrl = await uploadProofImage(selectedImage, user.id)

      // Mark task as complete
      const response = await fetch('/api/medications/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication_id: selectedTask.id,
          proof_image_url: imageUrl,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh schedules
        await fetchMedicationSchedules()
        // Close modal
        handleCloseModal()
      } else {
        throw new Error(result.error || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Failed to complete task. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedTask(null)
    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:bg-gray-100 p-2 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Today's Tasks</h1>
        </div>
        
        {/* Date Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {(() => {
            const dates = []
            for (let i = -3; i <= 3; i++) {
              const date = new Date()
              date.setDate(date.getDate() + i)
              const dateStr = date.toISOString().split('T')[0]
              const isToday = i === 0
              const isSelected = dateStr === selectedDate
              dates.push(
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-shrink-0 text-center p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {date.getDate()}
                  </div>
                  {isToday && !isSelected && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              )
            }
            return dates
          })()}
        </div>
      </div>

      {/* Task Timeline */}
      <div className="flex-1 p-4">
        {schedules
          .filter(daySchedule => daySchedule.date === selectedDate)
          .map((daySchedule) => (
          <div key={daySchedule.date}>

            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Timeline items */}
              <div className="space-y-6">
                {daySchedule.schedules.map((schedule, index) => (
                  <div key={schedule.id} className="relative flex items-start">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-3 h-3 rounded-full mt-6 ${
                      schedule.is_completed ? 'bg-red-500' : 'bg-gray-300'
                    }`}></div>

                    {/* Task Card */}
                    <div 
                      className={`ml-6 flex-1 rounded-xl p-4 transition-all ${
                        (() => {
                          const today = new Date().toISOString().split('T')[0]
                          const isToday = schedule.scheduled_date === today
                          const canClick = !schedule.is_completed && isToday
                          
                          if (schedule.is_completed) {
                            return 'bg-red-50 cursor-default'
                          } else if (canClick) {
                            return 'bg-white border border-gray-100 shadow-sm cursor-pointer hover:shadow-md'
                          } else {
                            return 'bg-gray-50 border border-gray-100 cursor-not-allowed opacity-75'
                          }
                        })()
                      }`}
                      onClick={() => handleTaskClick(schedule)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              (() => {
                                const today = new Date().toISOString().split('T')[0]
                                const isToday = schedule.scheduled_date === today
                                if (schedule.is_completed) return 'text-red-900'
                                if (!isToday) return 'text-gray-400'
                                return 'text-gray-900'
                              })()
                            }`}>
                              {schedule.label}
                            </span>
                            {schedule.is_completed ? (
                              <span className="text-xs text-red-600 font-medium">✓ Completed</span>
                            ) : !(() => {
                              const today = new Date().toISOString().split('T')[0]
                              return schedule.scheduled_date === today
                            })() && (
                              <span className="text-xs text-gray-400 font-medium">View Only</span>
                            )}
                          </div>
                          
                          <h3 className={`font-semibold mb-1 ${
                            (() => {
                              const today = new Date().toISOString().split('T')[0]
                              const isToday = schedule.scheduled_date === today
                              if (schedule.is_completed) return 'text-red-900'
                              if (!isToday) return 'text-gray-400'
                              return 'text-gray-900'
                            })()
                          }`}>
                            {schedule.name}
                          </h3>
                          
                          {schedule.dosage && (
                            <p className={`text-sm font-medium mb-2 ${
                              (() => {
                                const today = new Date().toISOString().split('T')[0]
                                const isToday = schedule.scheduled_date === today
                                if (schedule.is_completed) return 'text-red-700'
                                if (!isToday) return 'text-gray-400'
                                return 'text-gray-700'
                              })()
                            }`}>
                              {schedule.dosage}
                            </p>
                          )}
                          
                          <p className={`text-sm leading-relaxed ${
                            (() => {
                              const today = new Date().toISOString().split('T')[0]
                              const isToday = schedule.scheduled_date === today
                              if (schedule.is_completed) return 'text-red-600'
                              if (!isToday) return 'text-gray-400'
                              return 'text-gray-600'
                            })()
                          }`}>
                            {schedule.instructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Completion Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Complete Task</h2>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Task Info */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-1">
                  {selectedTask.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {selectedTask.dosage}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(selectedTask.time_of_day)} - {selectedTask.label}
                </p>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload proof image
                </label>
                
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Proof preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null)
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl)
                        }
                        setPreviewUrl(null)
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Take a photo to prove completion
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="proof-image"
                    />
                    <label
                      htmlFor="proof-image"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Image
                    </label>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteTask}
                  disabled={!selectedImage || isUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Completing...
                    </div>
                  ) : (
                    'Complete Task'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function TodoPage() {
  return (
    <WithAuth redirectTo="/auth/login">
      <MedicationTodoPage />
    </WithAuth>
  )
}