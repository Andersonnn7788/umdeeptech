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