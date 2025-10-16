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

    const { caseId } = await request.json()

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    // Get the case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
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

    // Update case status
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'submitted_for_review',
        submitted_for_review_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to submit case' }, { status: 500 })
    }

    // In a production environment, you might want to:
    // - Send notification to dermatologists
    // - Add to a review queue
    // - Send email confirmation to user

    return NextResponse.json({
      success: true,
      case: updatedCase,
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



