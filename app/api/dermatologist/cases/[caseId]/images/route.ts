import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await params

    // Fetch the dermatologist review with medication images for this case
    const { data: reviewData, error: reviewError } = await supabase
      .from('dermatologist_reviews')
      .select('medication_images')
      .eq('case_id', caseId)
      .single()

    if (reviewError || !reviewData) {
      return NextResponse.json({ error: 'Review not found for this case' }, { status: 404 })
    }

    return NextResponse.json({ 
      images: reviewData.medication_images || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}