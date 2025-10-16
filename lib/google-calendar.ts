// Google Calendar integration utilities

// Extend the Window interface to include gapi and google
declare global {
  interface Window {
    gapi: any
    google: any
  }
}

export interface CalendarEvent {
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  reminders: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService
  private gapi: any = null
  private google: any = null
  private tokenClient: any = null
  private accessToken: string | null = null
  private isInitialized = false

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService()
    }
    return GoogleCalendarService.instance
  }

  async initialize(): Promise<boolean> {
    try {
      // Load Google API and Google Identity Services
      if (!window.gapi) {
        await this.loadGoogleAPI()
      }
      
      if (!window.google) {
        await this.loadGoogleIdentity()
      }

      // Initialize gapi client
      await new Promise<void>((resolve) => {
        window.gapi.load('client', resolve)
      })

      await window.gapi.client.init({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
      })

      // Initialize the token client for OAuth
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token
            window.gapi.client.setToken({ access_token: response.access_token })
          }
        },
      })

      this.gapi = window.gapi
      this.google = window.google
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error)
      return false
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google API'))
      document.head.appendChild(script)
    })
  }

  private async loadGoogleIdentity(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(script)
    })
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) return false
      }

      if (this.accessToken) {
        return true
      }

      // Request access token
      return new Promise((resolve) => {
        this.tokenClient.callback = (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token
            window.gapi.client.setToken({ access_token: response.access_token })
            resolve(true)
          } else {
            resolve(false)
          }
        }
        this.tokenClient.requestAccessToken({ prompt: 'consent' })
      })
    } catch (error) {
      console.error('Failed to sign in to Google:', error)
      return false
    }
  }

  async createEvent(event: CalendarEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) {
          return { success: false, error: 'Failed to initialize Google Calendar API' }
        }
      }

      if (!this.accessToken) {
        const signedIn = await this.signIn()
        if (!signedIn) {
          return { success: false, error: 'User not signed in to Google Calendar' }
        }
      }

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      })

      return {
        success: true,
        eventId: response.result.id
      }
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<{ success: boolean; error?: string }> {
    try {
      await this.gapi.client.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to update calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to delete calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  isSignedIn(): boolean {
    return this.accessToken !== null
  }

  signOut(): void {
    this.accessToken = null
    if (this.gapi && this.gapi.client) {
      this.gapi.client.setToken(null)
    }
  }
}

// Helper function to create appointment calendar event
export function createAppointmentEvent(appointment: {
  doctor: { name: string; specialty: string; location?: string }
  patient: { name: string; email: string }
  appointment_date: string
  appointment_time: string
  notes?: string
}): CalendarEvent {
  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
  const endDateTime = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000) // 1 hour duration

  return {
    summary: `Medical Appointment with ${appointment.doctor.name}`,
    description: `
Medical Appointment Details:
- Doctor: ${appointment.doctor.name}
- Specialty: ${appointment.doctor.specialty}
- Patient: ${appointment.patient.name}
${appointment.notes ? `- Notes: ${appointment.notes}` : ''}

Please arrive 15 minutes early for check-in.
    `.trim(),
    location: appointment.doctor.location || 'Medical Center',
    start: {
      dateTime: appointmentDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'email', minutes: 60 },      // 1 hour before
        { method: 'popup', minutes: 15 }       // 15 minutes before
      ]
    },
    attendees: [
      {
        email: appointment.patient.email,
        displayName: appointment.patient.name
      }
    ]
  }
}