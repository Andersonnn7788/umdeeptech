import { supabase } from '@/lib/supabase/client'
import type { Appointment, CreateAppointmentData, UpdateAppointmentData, DatabaseResponse, DatabaseListResponse } from '@/lib/types/database'

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
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .gte('appointment_date', today)
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
    
    return { data: data as Appointment[], error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch upcoming appointments' }
  }
}

export async function getPastAppointments(patientId?: string): Promise<DatabaseListResponse<Appointment>> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*)
      `)
      .or(`appointment_date.lt.${today},status.eq.completed,status.eq.cancelled`)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
    
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Appointment[], error: null }
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