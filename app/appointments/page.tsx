"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Clock, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useAppointments, useCreateAppointment } from '@/lib/hooks/useAppointments'
import BottomNavigation from '@/components/BottomNavigation'
import AppointmentMenu from '@/components/AppointmentMenu'
import { WithAuth } from '@/components/WithAuth'


export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const { appointments: upcomingAppointments, loading: loadingUpcoming, error, refetch: refetchUpcoming } = useAppointments('upcoming')
  const { appointments: pastAppointments, loading: loadingPast, refetch: refetchPast } = useAppointments('past')
  const { createAppointment } = useCreateAppointment()

  // Refresh appointments every minute to automatically move past appointments
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUpcoming()
      refetchPast()
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(interval)
  }, [refetchUpcoming, refetchPast])

  // Combine appointments based on active tab
  const appointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments
  const loading = activeTab === 'upcoming' ? loadingUpcoming : loadingPast

  // Debug appointments data
  console.log('Appointments page - appointments:', appointments?.map(apt => ({ id: apt.id, date: apt.appointment_date, time: apt.appointment_time })))

  // Extract dates from appointments for calendar highlighting
  const appointmentDates = appointments.map(apt => new Date(apt.appointment_date))

  // Format appointment for display
  const formatAppointment = (apt: any) => ({
    ...apt,
    date: new Date(apt.appointment_date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: apt.appointment_time,
    doctor: apt.doctor?.name || 'Unknown Doctor',
    specialty: apt.doctor?.specialty || 'Unknown Specialty',
    avatar: apt.doctor?.avatar || '/caring-doctor.png',
    isPast: activeTab === 'past'
  })

  return (
    <WithAuth redirectTo="/profile">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-sans text-xl font-bold text-foreground">My Appointments</h1>
          </div>
          <Link href="/appointments/doctors">
            <Button size="icon" className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all">
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <Card className="mb-6 p-4 shadow-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              modifiers={{
                appointment: appointmentDates,
              }}
              modifiersStyles={{
                appointment: {
                  backgroundColor: "rgb(37, 99, 235, 0.15)",
                  color: "rgb(37, 99, 235)",
                  fontWeight: "bold",
                  borderRadius: "0.75rem",
                },
              }}
            />
          </div>
        </Card>

        <div className="mb-6 flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <Button
            variant={activeTab === "upcoming" ? "default" : "ghost"}
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 rounded-xl font-semibold ${
              activeTab === "upcoming" ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all" : "hover:bg-muted"
            }`}
          >
            Upcoming
          </Button>
          <Button
            variant={activeTab === "past" ? "default" : "ghost"}
            onClick={() => setActiveTab("past")}
            className={`flex-1 rounded-xl font-semibold ${activeTab === "past" ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all" : "hover:bg-muted"}`}
          >
            Past
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading appointments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No {activeTab} appointments found.</p>
              <Link href="/appointments/doctors">
                <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Book Your First Appointment
                </Button>
              </Link>
            </div>
          ) : (
            appointments.map((apt) => {
              const formattedApt = formatAppointment(apt)
              return (
                <Card key={apt.id} className="relative overflow-hidden shadow-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {/* Green indicator line for upcoming appointments */}
                  {!formattedApt.isPast && <div className="absolute left-0 top-0 h-full w-1.5 bg-accent" />}

                  <div className="p-5">
                    {/* Date and Time */}
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground pl-3">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">{formattedApt.date}</span>
                      <span>•</span>
                      <span>{formattedApt.time}</span>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-4 pl-3">
                      <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
                        <AvatarImage src={formattedApt.avatar} alt={formattedApt.doctor} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {formattedApt.doctor
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-base mb-1">{formattedApt.doctor}</h3>
                        <p className="text-sm text-muted-foreground">{formattedApt.specialty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.status === "confirmed" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent shadow-sm">
                            <svg
                              className="h-5 w-5 text-accent-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {/* Show menu only for upcoming appointments */}
                        {!formattedApt.isPast && (
                          <AppointmentMenu
                            appointment={{
                              id: apt.id,
                              appointment_date: apt.appointment_date,
                              appointment_time: apt.appointment_time,
                              doctor: {
                                name: formattedApt.doctor,
                                specialty: formattedApt.specialty,
                                location: apt.doctor?.location
                              }
                            }}
                            onDeleted={() => {
                              // Refresh both upcoming and past appointments
                              refetchUpcoming()
                              refetchPast()
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
      
      <BottomNavigation />
      </div>
    </WithAuth>
  )
}