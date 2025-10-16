import { useState, useEffect } from 'react'
import type { Doctor, Appointment } from '@/lib/types/database'

// Hook for fetching doctors
export function useDoctors(category?: string) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const url = category ? `/api/doctors?category=${category}` : '/api/doctors'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctors')
      }
      
      const data = await response.json()
      setDoctors(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [category])

  return { doctors, loading, error, refetch: fetchDoctors }
}

// Hook for fetching appointments
export function useAppointments(type?: 'upcoming' | 'past', patientId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (patientId) params.set('patient_id', patientId)
      
      const url = `/api/appointments?${params.toString()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      
      const data = await response.json()
      setAppointments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [type, patientId])

  return { appointments, loading, error, refetch: fetchAppointments }
}

// Hook for fetching a single doctor by ID
export function useDoctor(id: string) {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDoctor = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/doctors/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctor')
      }
      
      const data = await response.json()
      setDoctor(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctor()
  }, [id])

  return { doctor, loading, error, refetch: fetchDoctor }
}

// Hook for creating appointments
export function useCreateAppointment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAppointment = async (appointmentData: {
    patient_id?: string // Optional - API will use current user's patient record if not provided
    doctor_id: string
    appointment_date: string
    appointment_time: string
    notes?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create appointment')
      }
      
      const data = await response.json()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createAppointment, loading, error }
}

// Hook for fetching doctor appointments by date (to check availability)
export function useDoctorAppointmentsByDate(doctorId: string, date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = async () => {
    if (!doctorId || !date) {
      setAppointments([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/appointments?doctor_id=${doctorId}&date=${date}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctor appointments')
      }
      
      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [doctorId, date])

  return { appointments, loading, error, refetch: fetchAppointments }
}