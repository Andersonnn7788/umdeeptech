import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Testing database update for user:', user.id)

    // Find any dermatologist review for this user
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select(`
        id,
        dermatologist_reviews (
          id,
          medication_images
        )
      `)
      .eq('user_id', user.id)
      .limit(1)

    if (casesError || !cases || cases.length === 0) {
      return NextResponse.json({ error: 'No cases found' }, { status: 404 })
    }

    const review = cases[0].dermatologist_reviews[0]
    if (!review) {
      return NextResponse.json({ error: 'No review found' }, { status: 404 })
    }

    console.log('Found review to test:', review.id)
    console.log('Current medication_images:', review.medication_images)

    // Try to update the medication_images
    const testImages = ['test-image-1.jpg', 'test-image-2.jpg']
    console.log('About to update with:', testImages)
    
    const { data: updateResult, error: updateError } = await supabase
      .from('dermatologist_reviews')
      .update({ medication_images: testImages })
      .eq('id', review.id)
      .select('*')

    console.log('Full update result:', updateResult)
    console.log('Update error:', updateError)

    // Also fetch the data separately to double-check
    const { data: fetchResult, error: fetchError } = await supabase
      .from('dermatologist_reviews')
      .select('medication_images')
      .eq('id', review.id)
      .single()

    console.log('Separate fetch result:', fetchResult)
    console.log('Fetch error:', fetchError)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Database update failed', 
        details: updateError 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      reviewId: review.id,
      updateResult: updateResult,
      separateFetch: fetchResult,
      message: 'Test update with detailed results'
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}