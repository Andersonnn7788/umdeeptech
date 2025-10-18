import { createAdminClient } from '@/lib/supabase/admin'
import type { Doctor, DatabaseResponse, DatabaseListResponse } from '@/lib/types/database'

const supabase = createAdminClient()

export async function getDoctors(): Promise<DatabaseListResponse<Doctor>> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('available', true)
      .order('name')
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Doctor[], error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch doctors' }
  }
}

export async function getDoctorById(id: string): Promise<DatabaseResponse<Doctor>> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Doctor, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch doctor' }
  }
}

export async function getDoctorsByCategory(category: string): Promise<DatabaseListResponse<Doctor>> {
  try {
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('available', true)
    
    if (category !== 'All') {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query.order('name')
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Doctor[], error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch doctors' }
  }
}

export interface CreateDoctorData {
  id: string
  name: string
  specialty: string
  title: string
  experience: string
  category: 'Medical' | 'Surgical' | 'Pediatric' | 'Allergy' | 'Dermatology'
  location?: string
  avatar?: string
  rating?: number
  available?: boolean
}

export async function createDoctor(doctorData: CreateDoctorData): Promise<DatabaseResponse<Doctor>> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .insert([{
        id: doctorData.id,
        name: doctorData.name,
        specialty: doctorData.specialty,
        title: doctorData.title,
        experience: doctorData.experience,
        category: doctorData.category,
        location: doctorData.location,
        avatar: doctorData.avatar,
        rating: doctorData.rating || 5.0,
        available: doctorData.available ?? true
      }])
      .select()
      .single()
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Doctor, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to create doctor profile' }
  }
}

export async function updateDoctor(id: string, doctorData: Partial<CreateDoctorData>): Promise<DatabaseResponse<Doctor>> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .update(doctorData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as Doctor, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to update doctor profile' }
  }
}