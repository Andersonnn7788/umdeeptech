import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assignDoctorToCase } from '@/lib/services/doctorMatcher'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await request.json()

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    // Get the case with analysis results
    const admin = createAdminClient()
    const { data: caseData, error: caseError } = await admin
      .from('cases')
      .select(`
        *,
        analysis_results (
          detected_conditions,
          severity,
          ai_confidence_score
        )
      `)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Check if case has been analyzed
    if (caseData.status !== 'analyzed') {
      return NextResponse.json(
        { error: 'Case must be analyzed before submitting for review' },
        { status: 400 }
      )
    }

    // AI-based doctor matching (non-blocking, optional feature)
    let assignedDoctorId = caseData.assigned_doctor_id ?? null
    try {
      const analysisResults = Array.isArray(caseData.analysis_results)
        ? caseData.analysis_results
        : caseData.analysis_results
          ? [caseData.analysis_results]
          : []

      let detectedConditions = analysisResults[0]?.detected_conditions ?? []

      // Fallback: fetch analysis results directly if relation was not hydrated
      if (!detectedConditions.length) {
        const { data: fallbackAnalysis, error: fallbackError } = await admin
          .from('analysis_results')
          .select('detected_conditions')
          .eq('case_id', caseId)
          .maybeSingle()

        if (fallbackError) {
          console.warn('Failed to load analysis results for doctor matching:', fallbackError)
        } else if (fallbackAnalysis?.detected_conditions) {
          detectedConditions = fallbackAnalysis.detected_conditions
        }
      }

      if (!assignedDoctorId && detectedConditions.length) {
        console.log('Matching doctor for conditions:', detectedConditions)

        const matchResult = await assignDoctorToCase(caseId, detectedConditions)

        if (matchResult.success && matchResult.doctorId) {
          assignedDoctorId = matchResult.doctorId
          console.log(`AI matched and assigned doctor: ${assignedDoctorId}`)
        } else {
          console.warn('Doctor matching failed:', matchResult.error)
        }
      }
    } catch (matchError) {
      // Don't fail the submission if doctor matching fails
      console.warn('Doctor matching error (non-blocking):', matchError)
    }

    // Update case status
    const updateData: any = {
      status: 'submitted_for_review',
      submitted_for_review_at: new Date().toISOString(),
    }
    
    // Only add assigned_doctor_id if we have one
    if (assignedDoctorId) {
      updateData.assigned_doctor_id = assignedDoctorId
    }

    const { data: updatedCase, error: updateError } = await admin
      .from('cases')
      .update(updateData)
      .eq('id', caseId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to submit case', 
        details: updateError.message 
      }, { status: 500 })
    }

    // Try to get assigned doctor info if available
    let assignedDoctorInfo = null
    if (updatedCase?.assigned_doctor_id) {
      try {
        const { data: doctorData } = await admin
          .from('doctors')
          .select('id, name, specialty, title, experience')
          .eq('id', updatedCase.assigned_doctor_id)
          .single()
        
        assignedDoctorInfo = doctorData
      } catch (error) {
        console.warn('Failed to fetch doctor info:', error)
      }
    }

    // In a production environment, you might want to:
    // - Send notification to the assigned dermatologist
    // - Add to a review queue
    // - Send email confirmation to user

    return NextResponse.json({
      success: true,
      case: updatedCase,
      assignedDoctor: assignedDoctorInfo,
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




