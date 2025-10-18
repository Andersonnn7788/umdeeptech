import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('Schedule API called')
  
  try {
    console.log('Creating Supabase client...')
    const supabase = await createClient()
    console.log('Supabase client created')
    
    // Get the current user
    console.log('Getting user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('User result:', user ? 'found' : 'not found', 'Error:', authError)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 })
    }



    // Get user's cases with schedules and medication images
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select(`
        id,
        status,
        dermatologist_reviews (
          id,
          schedule,
          medication_images
        )
      `)
      .eq('user_id', user.id)

    if (casesError) {
      console.error('Error fetching cases:', casesError)
      return NextResponse.json({ error: 'Failed to fetch schedule', details: casesError }, { status: 500 })
    }



    // Flatten all schedule items from all cases
    const allScheduleItems: any[] = []
    
    if (cases && Array.isArray(cases)) {
      cases.forEach((caseItem: any) => {
        console.log('Processing case:', caseItem.id, 'Reviews:', caseItem.dermatologist_reviews?.length || 0)
        
        if (caseItem.dermatologist_reviews && caseItem.dermatologist_reviews.length > 0) {
          const review = caseItem.dermatologist_reviews[0]
          console.log('Review schedule:', review.schedule ? 'exists' : 'null')

          if (review.schedule && Array.isArray(review.schedule)) {
            // Get all medication images for this case (simple array of URLs)
            const medicationImages = review.medication_images || []
       
            review.schedule.forEach((item: any, index: number) => {
              const scheduleItemId = `${caseItem.id}-${item.date}-${item.time}-${item.medicine}`

              
              allScheduleItems.push({
                ...item,
                id: scheduleItemId,
                caseId: caseItem.id,  // Include the actual case ID
                reviewId: review.id,   // Include the review ID
                caseStatus: caseItem.status,
                medicationImages: medicationImages, // All images for the case
                imageCount: medicationImages.length // Total images for the case
              })
            })
          }
        }
      })
    }

    // Sort by date and time
    allScheduleItems.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })

    console.log('Returning schedule items:', allScheduleItems.length)

    return NextResponse.json({ schedule: allScheduleItems })
  } catch (error) {
    console.error('Error in schedule API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}