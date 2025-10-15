"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoctor, useCreateAppointment, useDoctorAppointmentsByDate } from '@/lib/hooks/useAppointments'

// Generate next 7 days
const generateWeekDays = () => {
  const days = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    days.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      fullDate: date.toISOString().split('T')[0]
    })
  }
  return days
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
]

export default function BookAppointmentPage() {
  const params = useParams()
  const router = useRouter()
  const doctorId = params.doctorId as string
  
  // Fetch doctor data
  const { doctor, loading: loadingDoctor, error: doctorError } = useDoctor(doctorId)
  const { createAppointment, loading: creatingAppointment, error: createError } = useCreateAppointment()
  
  const weekDays = generateWeekDays()
  const [selectedDay, setSelectedDay] = useState(weekDays[0]?.fullDate)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Fetch existing appointments for the selected doctor and date
  const { appointments: bookedAppointments, loading: loadingAppointments } = useDoctorAppointmentsByDate(
    doctorId, 
    selectedDay || ""
  )

  // Get list of booked time slots for the selected date
  const bookedTimeSlots = useMemo(() => {
    if (!bookedAppointments) return []
    return bookedAppointments.map(apt => apt.appointment_time.substring(0, 5)) // Convert "10:00:00" to "10:00"
  }, [bookedAppointments])

  // Get list of past time slots for today
  const pastTimeSlots = useMemo(() => {
    if (!selectedDay) return []
    
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    // If selected day is today, mark past times as unavailable
    if (selectedDay === today) {
      return timeSlots.filter(time => time <= currentTime)
    }
    
    return []
  }, [selectedDay])

  // Reset selected time if it becomes booked or past when changing dates
  const handleDateChange = (newDate: string) => {
    setSelectedDay(newDate)
    // If current selected time will be booked or past on the new date, clear selection
    const willBeBooked = bookedTimeSlots.includes(selectedTime || "")
    const willBePast = pastTimeSlots.includes(selectedTime || "")
    
    if (selectedTime && (willBeBooked || willBePast)) {
      setSelectedTime(null)
    }
  }

  const handleConfirm = async () => {
    if (selectedTime && selectedDay && doctor) {
      try {
        // For now, using a placeholder patient ID - in real app, you'd get this from auth
        const result = await createAppointment({
          patient_id: '12345678-1234-1234-1234-123456789012', // Using sample patient ID
          doctor_id: doctor.id,
          appointment_date: selectedDay,
          appointment_time: selectedTime,
          notes: `Appointment with ${doctor.name}`
        })

        if (result.data) {
          alert(`Appointment successfully booked with ${doctor.name} on ${selectedDay} at ${selectedTime}`)
          router.push("/appointments")
        } else {
          alert(`Error booking appointment: ${result.error}`)
        }
      } catch (error) {
        console.error('Booking error:', error)
        alert('Failed to book appointment. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto px-4 py-4">
          <Link href="/appointments/doctors">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-sans text-xl font-bold text-foreground">Book Appointment</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        {loadingDoctor ? (
          <Card className="mb-6 p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading doctor information...</p>
          </Card>
        ) : doctorError ? (
          <Card className="mb-6 p-6 text-center">
            <p className="text-red-500">Error: {doctorError}</p>
          </Card>
        ) : doctor ? (
          <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-xl rounded-3xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-4 h-28 w-28 border-4 border-white/40 shadow-xl">
                <AvatarImage src={doctor.avatar || "/caring-doctor.png"} alt={doctor.name} />
                <AvatarFallback className="bg-white/20 text-white font-bold text-2xl">
                  {doctor.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h2 className="mb-2 text-2xl font-bold">{doctor.name}</h2>
              <p className="mb-2 text-base opacity-95 font-medium">{doctor.title || doctor.specialty}</p>
              <p className="text-sm opacity-90">{doctor.location}</p>
              <p className="mt-4 text-sm opacity-95">{doctor.experience}</p>
            </div>
          </Card>
        ) : null}

        <div className="mb-6">
          <h3 className="mb-4 font-bold text-foreground text-lg">Appointment</h3>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {weekDays.slice(0, 7).map((day) => (
              <Button
                key={day.fullDate}
                variant={selectedDay === day.fullDate ? "default" : "outline"}
                onClick={() => handleDateChange(day.fullDate)}
                className={`flex flex-col h-auto py-3 px-4 rounded-2xl shadow-md flex-shrink-0 min-w-[70px] ${
                  selectedDay === day.fullDate ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all" : "bg-white dark:bg-gray-800 hover:bg-muted border-2 border-gray-200 dark:border-gray-700"
                }`}
              >
                <span className="text-xs font-semibold">{day.day}</span>
                <span className="text-lg font-bold mt-1">{day.date}</span>
              </Button>
            ))}
          </div>

          <h3 className="mb-4 font-bold text-foreground text-lg">Available Time</h3>
          {loadingAppointments && (
            <div className="text-center mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-1">Checking availability...</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map((time) => {
              const isBooked = bookedTimeSlots.includes(time)
              const isPast = pastTimeSlots.includes(time)
              const isUnavailable = isBooked || isPast
              const isSelected = selectedTime === time
              
              return (
                <Button
                  key={time}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => !isUnavailable && setSelectedTime(time)}
                  disabled={isUnavailable}
                  className={`text-sm font-semibold h-12 rounded-2xl shadow-md transition-all ${
                    isUnavailable 
                      ? "bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700 border border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-60"
                      : isSelected
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl"
                        : "bg-white dark:bg-gray-800 hover:bg-muted border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  {time}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-b from-blue-50/80 to-white/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto">
            {createError && (
              <p className="text-red-500 text-center mb-2 text-sm">{createError}</p>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!selectedTime || !selectedDay || creatingAppointment || loadingDoctor}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-7 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {creatingAppointment ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}