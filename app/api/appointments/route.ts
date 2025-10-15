import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, createAppointment, getUpcomingAppointments, getPastAppointments, getDoctorAppointmentsByDate } from '@/lib/supabase/database/appointments'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const doctorId = searchParams.get('doctor_id')
    const date = searchParams.get('date')
    const type = searchParams.get('type') // 'upcoming' or 'past'
    
    // If doctor_id and date are provided, fetch appointments for that doctor on that date
    if (doctorId && date) {
      const result = await getDoctorAppointmentsByDate(doctorId, date)
      if (result.error) {
        return NextResponse.json(
          { error: result.error }, 
          { status: 500 }
        )
      }
      return NextResponse.json(result.data)
    }
    
    let result
    if (type === 'upcoming') {
      result = await getUpcomingAppointments(patientId || undefined)
    } else if (type === 'past') {
      result = await getPastAppointments(patientId || undefined)
    } else {
      result = await getAppointments(patientId || undefined)
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { patient_id, doctor_id, appointment_date, appointment_time } = body
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }
    
    const result = await createAppointment(body)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}