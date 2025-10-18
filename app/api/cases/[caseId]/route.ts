import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the case with related data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        analysis_results (*),
        dermatologist_reviews (*),
        user_reports (*)
      `)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      case: caseData,
    })
  } catch (error) {
    console.error('Get case error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




