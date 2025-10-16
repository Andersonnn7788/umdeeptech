import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const doctorId = searchParams.get('doctor_id')
    const date = searchParams.get('date')
    const type = searchParams.get('type') // 'upcoming' or 'past'
    
    console.log('API Request:', { patientId, doctorId, date, type })
    
    // Get current user from session
    const serverSupabase = await createClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Current user:', user.id, user.email)
    
    const supabase = createAdminClient()
    console.log('Admin client created successfully')
    
    // If doctor_id and date are provided, fetch appointments for that doctor on that date
    if (doctorId && date) {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors(*),
          patients(*)
        `)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .order('appointment_time', { ascending: true })
        
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    }
    
    // First, find the patient record for the current user by email
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (patientError || !patient) {
      console.log('No patient record found for user:', user.email)
      // Return empty array if no patient record exists for this user
      return NextResponse.json([])
    }
    
    console.log('Found patient:', patient.id)
    
    // Build base query filtered by the current user's patient record
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctors(*),
        patients(*)
      `)
      .eq('patient_id', patient.id)
    
    // Override with specific patientId if provided (for admin purposes)
    if (patientId && patientId !== patient.id) {
      console.log('Using specific patient ID:', patientId)
      query = query.eq('patient_id', patientId)
    }
    
    // Apply filters based on type
    if (type === 'upcoming') {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`
      
      console.log('Upcoming query params:', { today, currentTime })
      
      query = query
        .in('status', ['confirmed', 'pending'])
        .or(`appointment_date.gt.${today},and(appointment_date.eq.${today},appointment_time.gt.${currentTime})`)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        
    } else if (type === 'past') {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`
      
      console.log('Past query params:', { today, currentTime })
      
      query = query
        .or(`appointment_date.lt.${today},and(appointment_date.eq.${today},appointment_time.lt.${currentTime}),status.eq.completed,status.eq.cancelled`)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
    } else {
      query = query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
    }
    
    console.log('About to execute query...')
    const { data, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    
    // Transform data to ensure doctor information is properly structured
    const transformedData = data?.map(appointment => {
      const doctor = appointment.doctors || null
      const patient = appointment.patients || null
      
      return {
        ...appointment,
        // Frontend expects 'doctor' (singular), API returns 'doctors' (plural)
        doctor: doctor ? {
          ...doctor,
          name: doctor.name || 'Unknown Doctor',
          specialty: doctor.specialty || 'Unknown Specialty'
        } : {
          name: 'Unknown Doctor',
          specialty: 'Unknown Specialty',
          id: appointment.doctor_id
        },
        // Frontend expects 'patient' (singular), API returns 'patients' (plural)  
        patient: patient ? {
          ...patient,
          name: patient.name || 'Unknown Patient',
          email: patient.email || 'unknown@example.com'
        } : {
          name: 'Unknown Patient',
          email: 'unknown@example.com',
          id: appointment.patient_id
        }
      }
    }) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current user from session
    const serverSupabase = await createClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createAdminClient()
    
    // Find or create patient record for the current user
    let { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (patientError || !patient) {
      // Create patient record if it doesn't exist
      const { data: newPatient, error: createPatientError } = await supabase
        .from('patients')
        .insert({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email
        })
        .select('id')
        .single()
      
      if (createPatientError || !newPatient) {
        return NextResponse.json({ error: 'Failed to create patient record' }, { status: 500 })
      }
      
      patient = newPatient
    }
    
    // Validate required fields (doctor_id, appointment_date, appointment_time)
    const { doctor_id, appointment_date, appointment_time } = body
    if (!doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields: doctor_id, appointment_date, appointment_time' }, 
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id, // Use the current user's patient ID
        doctor_id,
        appointment_date,
        appointment_time,
        notes: body.notes || null,
        status: 'confirmed'
      })
      .select(`
        *,
        doctors(*),
        patients(*)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}