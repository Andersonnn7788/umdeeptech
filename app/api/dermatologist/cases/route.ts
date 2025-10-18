import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get cases submitted for review
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select(`
        *,
        analysis_results (*)
      `)
      .in('status', ['submitted_for_review', 'under_review'])
      .order('submitted_for_review_at', { ascending: true })

    if (casesError) {
      console.error('Cases fetch error:', casesError)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cases: cases || [],
    })
  } catch (error) {
    console.error('Get cases error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

