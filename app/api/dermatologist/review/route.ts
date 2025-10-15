import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a dermatologist
    const { data: userData } = await supabase.auth.getUser()
    const userRole = userData?.user?.user_metadata?.role

    if (userRole !== 'dermatologist') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const {
      caseId,
      status,
      professionalDiagnosis,
      treatmentRecommendations,
      agreesWithAi,
      notes,
      urgencyLevel,
    } = await request.json()

    if (!caseId || !status || !professionalDiagnosis || !treatmentRecommendations) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('dermatologist_reviews')
      .insert({
        case_id: caseId,
        dermatologist_id: user.id,
        status,
        professional_diagnosis: professionalDiagnosis,
        treatment_recommendations: treatmentRecommendations,
        agrees_with_ai: agreesWithAi,
        notes,
        urgency_level: urgencyLevel,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Review creation error:', reviewError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Update case status
    await supabase
      .from('cases')
      .update({ status })
      .eq('id', caseId)

    // If approved, create user report
    if (status === 'approved') {
      // Get case data with analysis
      const { data: caseData } = await supabase
        .from('cases')
        .select(`
          *,
          analysis_results (*)
        `)
        .eq('id', caseId)
        .single()

      if (caseData) {
        const reportData = {
          case_summary: `Skin analysis completed on ${new Date().toLocaleDateString()}`,
          ai_analysis: caseData.analysis_results?.[0] || {},
          dermatologist_review: review,
          recommendations: treatmentRecommendations.split('\n').filter((r: string) => r.trim()),
          next_steps: [
            'Follow the treatment recommendations provided',
            'Monitor the affected area for changes',
            'Schedule a follow-up if symptoms persist or worsen',
            'Contact emergency services if you experience severe symptoms'
          ],
          disclaimer: 'This report is for informational purposes. Always consult with healthcare professionals for medical advice.'
        }

        await supabase
          .from('user_reports')
          .insert({
            case_id: caseId,
            report_data: reportData,
          })

        // Mark case as completed
        await supabase
          .from('cases')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', caseId)
      }
    }

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

