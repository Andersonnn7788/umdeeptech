"use client"

import { useState, useEffect } from 'react'
import { GoogleCalendarService, createAppointmentEvent, CalendarEvent } from '@/lib/google-calendar'

export function useGoogleCalendar() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calendarService = GoogleCalendarService.getInstance()

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        const initialized = await calendarService.initialize()
        setIsInitialized(initialized)
        if (initialized) {
          setIsSignedIn(calendarService.isSignedIn())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Google Calendar')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  const signIn = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const success = await calendarService.signIn()
      setIsSignedIn(success)
      if (success) {
        setError(null)
      }
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    calendarService.signOut()
    setIsSignedIn(false)
    setError(null)
  }

  const addAppointmentToCalendar = async (appointment: {
    doctor: { name: string; specialty: string; location?: string }
    patient: { name: string; email: string }
    appointment_date: string
    appointment_time: string
    notes?: string
  }): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      if (!isSignedIn) {
        const signedIn = await signIn()
        if (!signedIn) {
          return { success: false, error: 'Please sign in to Google Calendar first' }
        }
      }

      const event = createAppointmentEvent(appointment)
      const result = await calendarService.createEvent(event)
      
      if (!result.success) {
        setError(result.error || 'Failed to add event to calendar')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add appointment to calendar'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const updateCalendarEvent = async (eventId: string, event: Partial<CalendarEvent>): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await calendarService.updateEvent(eventId, event)
      if (!result.success) {
        setError(result.error || 'Failed to update calendar event')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update calendar event'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCalendarEvent = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await calendarService.deleteEvent(eventId)
      if (!result.success) {
        setError(result.error || 'Failed to delete calendar event')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete calendar event'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isInitialized,
    isSignedIn,
    isLoading,
    error,
    signIn,
    signOut,
    addAppointmentToCalendar,
    updateCalendarEvent,
    deleteCalendarEvent
  }
}