import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a dermatologist (optional for development)
    // In production, you may want to enforce role checking:
    // const userRole = user?.user_metadata?.role
    // if (userRole !== 'dermatologist') {
    //   return NextResponse.json({ error: 'Access denied. Dermatologist role required.' }, { status: 403 })
    // }

    const visibleStatuses = [
      'submitted_for_review',
      'under_review',
      'requires_resubmission',
      'approved',
      'completed',
    ]

    const admin = createAdminClient()

    // Verify user has doctor role (optional but adds clarity)
    const { data: doctorRecord, error: doctorRecordError } = await admin
      .from('patients')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (doctorRecordError) {
      console.warn('Failed to load doctor record during case fetch:', doctorRecordError)
    }

    if (doctorRecord && doctorRecord.role !== 'doctor') {
      return NextResponse.json({ error: 'Access denied. Doctor role required.' }, { status: 403 })
    }

    // Get cases assigned to this dermatologist using service role (bypasses RLS but enforced by filter above)
    const { data: cases, error: casesError } = await admin
      .from('cases')
      .select(`
        *,
        analysis_results (*)
      `)
      .eq('assigned_doctor_id', user.id)
      .in('status', visibleStatuses)
      .order('submitted_for_review_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (casesError) {
      console.error('Cases fetch error:', casesError)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    let casesWithPatient = cases ?? []

    if (casesWithPatient.length) {
      const userIds = Array.from(
        new Set(
          casesWithPatient
            .map(caseItem => caseItem.user_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      )

      if (userIds.length) {
        const { data: patientsData, error: patientsError } = await admin
          .from('patients')
          .select('id, name')
          .in('id', userIds)

        if (patientsError) {
          console.warn('Failed to fetch patient names for cases:', patientsError)
        } else if (patientsData) {
          const patientMap = new Map<string, { id: string; name: string | null }>()
          for (const patient of patientsData) {
            if (patient?.id) {
              patientMap.set(patient.id, {
                id: patient.id,
                name: patient.name ?? null,
              })
            }
          }

          casesWithPatient = casesWithPatient.map(caseItem => ({
            ...caseItem,
            patient: patientMap.get(caseItem.user_id) ?? null,
          }))
        }
      }
    }

    return NextResponse.json({
      success: true,
      cases: casesWithPatient,
    })
  } catch (error) {
    console.error('Get cases error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


