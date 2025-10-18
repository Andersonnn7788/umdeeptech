import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all cases with their status
    const { data: allCases, error: casesError } = await supabase
      .from('cases')
      .select('id, status, created_at, submitted_for_review_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (casesError) {
      console.error('Cases fetch error:', casesError)
      return NextResponse.json({ 
        error: 'Failed to fetch cases',
        details: casesError 
      }, { status: 500 })
    }

    // Get counts by status
    const statusCounts: Record<string, number> = {}
    allCases?.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      totalCases: allCases?.length || 0,
      statusCounts,
      recentCases: allCases?.slice(0, 5),
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

