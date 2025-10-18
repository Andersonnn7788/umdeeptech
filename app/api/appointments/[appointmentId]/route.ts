import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    // Get user session for authentication
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointmentId = params.appointmentId
    const adminClient = createAdminClient()

    console.log('DELETE API - Appointment ID:', appointmentId)
    console.log('DELETE API - User email:', session.user.email)

    // First, get the appointment to verify ownership and get calendar event ID
    const { data: appointment, error: fetchError } = await adminClient
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        calendar_event_id,
        patient_id,
        patients(user_email),
        doctors(name, specialty, location)
      `)
      .eq('id', appointmentId)
      .single()

    console.log('DELETE API - Query result:', { appointment, fetchError })

    if (fetchError || !appointment) {
      console.error('DELETE API - Appointment not found:', { fetchError, appointmentId })
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Verify the appointment belongs to the current user
    const patientData = appointment.patients as any
    if (patientData?.user_email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized - appointment does not belong to you' }, { status: 403 })
    }

    // Delete the appointment from database
    const { error: deleteError } = await adminClient
      .from('appointments')
      .delete()
      .eq('id', appointmentId)

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 })
    }

    // Return success response with appointment data for calendar deletion
    return NextResponse.json({ 
      success: true, 
      message: 'Appointment deleted successfully',
      appointment: {
        id: appointment.id,
        calendar_event_id: appointment.calendar_event_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        doctor: appointment.doctors
      }
    })

  } catch (error) {
    console.error('Error in DELETE /api/appointments/[appointmentId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}