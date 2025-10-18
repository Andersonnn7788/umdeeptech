import { createAdminClient } from '@/lib/supabase/admin'
import type { Appointment, CreateAppointmentData, UpdateAppointmentData, DatabaseResponse, DatabaseListResponse } from '@/lib/types/database'

const supabase = createAdminClient()

export async function getAppointments(patientId?: string): Promise<DatabaseListResponse<Appointment>> {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
    
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Appointment[], error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch appointments' }
  }
}

export async function getAppointmentById(id: string): Promise<DatabaseResponse<Appointment>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Appointment, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch appointment' }
  }
}

export async function createAppointment(appointmentData: CreateAppointmentData): Promise<DatabaseResponse<Appointment>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointmentData,
        status: 'confirmed'
      })
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .single()
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Appointment, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to create appointment' }
  }
}

export async function updateAppointment(id: string, updates: UpdateAppointmentData): Promise<DatabaseResponse<Appointment>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .single()
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Appointment, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to update appointment' }
  }
}

export async function deleteAppointment(id: string): Promise<DatabaseResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: true, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to delete appointment' }
  }
}

export async function getUpcomingAppointments(patientId?: string): Promise<DatabaseListResponse<Appointment>> {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .in('status', ['confirmed', 'pending'])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
    
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    // Filter appointments to only include future ones (considering both date and time)
    const filteredData = (data as Appointment[]).filter(appointment => {
      const appointmentDate = appointment.appointment_date
      const appointmentTime = appointment.appointment_time
      
      // If appointment is on a future date, it's upcoming
      if (appointmentDate > today) {
        return true
      }
      
      // If appointment is today, check if time hasn't passed yet
      if (appointmentDate === today) {
        return appointmentTime > currentTime
      }
      
      // If appointment is on a past date, it's not upcoming
      return false
    })
    
    return { data: filteredData, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch upcoming appointments' }
  }
}

export async function getPastAppointments(patientId?: string): Promise<DatabaseListResponse<Appointment>> {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
    
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    // Filter appointments to include past ones (considering both date and time) or completed/cancelled status
    const filteredData = (data as Appointment[]).filter(appointment => {
      const appointmentDate = appointment.appointment_date
      const appointmentTime = appointment.appointment_time
      const status = appointment.status
      
      // Include completed or cancelled appointments regardless of date/time
      if (status === 'completed' || status === 'cancelled') {
        return true
      }
      
      // If appointment is on a past date, it's past
      if (appointmentDate < today) {
        return true
      }
      
      // If appointment is today, check if time has already passed
      if (appointmentDate === today) {
        return appointmentTime <= currentTime
      }
      
      // If appointment is on a future date, it's not past
      return false
    })
    
    return { data: filteredData, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch past appointments' }
  }
}

export async function getDoctorAppointmentsByDate(doctorId: string, date: string): Promise<DatabaseListResponse<Appointment>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['confirmed', 'pending'])
      .order('appointment_time', { ascending: true })
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Appointment[], error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch doctor appointments' }
  }
}