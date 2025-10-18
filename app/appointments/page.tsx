"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Clock, ChevronLeft, Camera, CheckCircle } from "lucide-react"
import Link from "next/link"
import BottomNavigation from '@/components/BottomNavigation'
import { WithAuth } from '@/components/WithAuth'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'


interface ScheduleItem {
  id: string
  date: string
  time: string
  medicine: string
  tips: string
  caseId: string
  reviewId: string
  caseStatus: string
  medicationImages: string[] // Array of image URLs
  imageCount: number
}

interface Case {
  id: string
  status: string
  schedule: ScheduleItem[]
}

export default function MedicationSchedulePage() {
  const { user } = useAuth()
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Fetch user's medication schedule
  const fetchSchedule = async () => {
    if (!user) {
      console.log('No user found, skipping schedule fetch')
      return
    }

    try {
      console.log('Fetching schedule for user:', user.id)
      setLoading(true)
      const response = await fetch('/api/users/schedule')
      console.log('Schedule response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Schedule API error:', errorData)
        throw new Error(`Failed to fetch schedule: ${response.status} ${errorData}`)
      }
      
      const data = await response.json()
      console.log('Schedule data received:', data)
      console.log('Number of schedule items:', data.schedule?.length || 0)
      setScheduleItems(data.schedule || [])
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [user])

  // Get unique dates and sort them
  const uniqueDates = [...new Set(scheduleItems.map(item => item.date))].sort()
  
  // Filter items based on selected date
  const filteredItems = selectedDate 
    ? scheduleItems.filter(item => item.date === selectedDate)
    : scheduleItems

  // Group filtered items by date
  const groupedItems = filteredItems.reduce((groups, item) => {
    const date = item.date
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
    return groups
  }, {} as Record<string, ScheduleItem[]>)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedItem) {
      console.log('No file or selectedItem:', { file: !!file, selectedItem: !!selectedItem })
      return
    }

    console.log('Starting image upload for case:', {
      caseId: selectedItem.caseId,
      medicine: selectedItem.medicine
    })
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('caseId', selectedItem.caseId)

      console.log('Sending upload request...')
      const response = await fetch('/api/users/schedule/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', errorText)
        throw new Error(`Failed to upload image: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Upload successful:', data)
      
      // Refresh the schedule data to get updated medication images
      await fetchSchedule()
      
      setSelectedItem(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <WithAuth redirectTo="/profile">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading schedule..." />
        </div>
      </WithAuth>
    )
  }

  return (
    <WithAuth redirectTo="/profile">
      <div className="min-h-screen bg-blue-50 dark:from-gray-900 dark:to-gray-800 pb-20">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-sans text-xl font-bold text-foreground">My Medication Schedule</h1>
            </div>
            </div>
        </header>

        <div className="p-4 max-w-4xl mx-auto">
          {/* Date Filter */}
          {uniqueDates.length > 0 && (
            <div className="mb-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueDates.map((date) => {
                  const dateObj = new Date(date)
                  const isToday = date === new Date().toISOString().split('T')[0]
                  const isSelected = selectedDate === date
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                  const dayNumber = dateObj.getDate()
                  
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(isSelected ? null : date)}
                      className={`flex-shrink-0 w-16 h-20 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105"
                          : isToday
                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-xs font-medium mb-1">{dayName}</div>
                        <div className="text-lg font-bold">{dayNumber}</div>
                        {isToday && !isSelected && (
                          <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Schedule Items */}
          <div className="space-y-6">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500">Error: {error}</p>
              </div>
            ) : Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No medication schedule found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit a dermatologist to get your personalized medication schedule.
                </p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([date, items]) => (
                <div key={date} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  {/* Schedule Items for this date */}
                  <div className="space-y-3 ml-4">
                    {items.map((item) => (
                      <Card 
                        key={item.id} 
                        className={`relative overflow-hidden shadow-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow ${
                          item.imageCount > 0 ? 'opacity-75' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Image indicator */}
                        {item.imageCount > 0 && (
                          <div className="absolute left-0 top-0 h-full w-1.5 bg-green-500" />
                        )}

                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Time and Status */}
                            <div className="flex-shrink-0 text-center min-w-[60px]">
                              <div className="text-sm font-semibold text-foreground">{item.time}</div>
                              {item.imageCount > 0 ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-1" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto mt-1" />
                              )}
                            </div>

                            {/* Medicine Info */}
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">{item.medicine}</h3>
                              {item.tips && (
                                <p className="text-sm text-muted-foreground">{item.tips}</p>
                              )}
                              {item.imageCount > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-green-600 font-medium">✓ {item.imageCount} image{item.imageCount > 1 ? 's' : ''} uploaded</span>
                                </div>
                              )}
                            </div>

                            {/* Camera Icon */}
                            {item.imageCount === 0 && (
                              <div className="flex-shrink-0">
                                <Camera className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{selectedItem.medicine}</h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm text-muted-foreground">Time: </span>
                    <span className="font-medium">{selectedItem.time}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date: </span>
                    <span className="font-medium">
                      {new Date(selectedItem.date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedItem.tips && (
                    <div>
                      <span className="text-sm text-muted-foreground">Instructions: </span>
                      <p className="text-sm mt-1">{selectedItem.tips}</p>
                    </div>
                  )}
                </div>

                {selectedItem.imageCount > 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">{selectedItem.imageCount} image{selectedItem.imageCount > 1 ? 's' : ''} uploaded!</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 max-w-xs mx-auto">
                      {selectedItem.medicationImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={imageUrl} 
                            alt={`Medication proof ${index + 1}`} 
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            Image {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                          <Camera className="h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Add Another Photo'}
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Upload an image to document this medication
                    </p>
                    <div className="flex justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                          <Camera className="h-5 w-5" />
                          {uploading ? 'Uploading...' : 'Take Photo'}
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedItem(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        <BottomNavigation />
      </div>
    </WithAuth>
  )
}