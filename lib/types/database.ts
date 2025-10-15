// TypeScript types for the appointment feature

export interface Doctor {
  id: string
  name: string
  specialty: string
  title?: string
  location?: string
  experience?: string
  rating?: number
  avatar?: string
  category: 'Medical' | 'Surgical' | 'Pediatric' | 'Allergy' | 'Dermatology'
  available: boolean
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  name: string
  email: string
  phone?: string
  date_of_birth?: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending'
  notes?: string
  created_at: string
  updated_at: string
  
  // Relations
  doctor?: Doctor
  patient?: Patient
}

export interface CreateAppointmentData {
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  notes?: string
}

export interface UpdateAppointmentData {
  appointment_date?: string
  appointment_time?: string
  status?: 'confirmed' | 'completed' | 'cancelled' | 'pending'
  notes?: string
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null
  error: string | null
}

export interface DatabaseListResponse<T> {
  data: T[] | null
  error: string | null
}