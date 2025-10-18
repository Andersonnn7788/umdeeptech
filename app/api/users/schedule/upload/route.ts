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

    const formData = await request.formData()
    const image = formData.get('image') as File
    const caseId = formData.get('caseId') as string
    const scheduleId = formData.get('scheduleId') as string

    if (!image || !caseId || caseId === 'undefined' || caseId === 'null' || !scheduleId || scheduleId === 'undefined' || scheduleId === 'null') {
      return NextResponse.json({ error: 'Missing image, case ID, or schedule ID' }, { status: 400 })
    }

    // First, verify the case belongs to the user and get the review info
    const { data: caseWithReview, error: caseError } = await supabase
      .from('cases')
      .select(`
        id,
        user_id,
        dermatologist_reviews (
          id,
          medication_images
        )
      `)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseWithReview) {
      return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
    }

    if (!caseWithReview.dermatologist_reviews || caseWithReview.dermatologist_reviews.length === 0) {
      return NextResponse.json({ error: 'No dermatologist review found for this case' }, { status: 404 })
    }

    const review = caseWithReview.dermatologist_reviews[0]

    // Upload image to Supabase Storage
    const fileExt = image.name.split('.').pop()
    const fileName = `${user.id}/${caseId}/${scheduleId}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medication-images')
      .upload(fileName, image)

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('medication-images')
      .getPublicUrl(fileName)

    // Find the dermatologist review for this case
    const { data: reviewData, error: reviewError } = await supabase
      .from('dermatologist_reviews')
      .select('id, schedule, medication_images, case_id')
      .eq('case_id', caseId)
      .single()

    if (reviewError || !reviewData) {
      return NextResponse.json({ error: 'Review not found for this case' }, { status: 404 })
    }

    // Get existing images and append new one (case level)
    const existingImages = reviewData.medication_images || []
    const updatedImages = [...existingImages, publicUrl]

    // Update the schedule to mark the specific item as completed
    let updatedSchedule = [...(reviewData.schedule || [])]
    let scheduleItemFound = false
    
    updatedSchedule = updatedSchedule.map((item: any) => {
      // Handle both string and number schedule_id, and clean any extra quotes or padding
      const itemScheduleId = String(item.schedule_id).trim()
      const targetScheduleId = String(scheduleId).trim()
      
      if (itemScheduleId === targetScheduleId) {
        scheduleItemFound = true
        
        return {
          ...item,
          completed: true
        }
      }
      return item
    })

    if (!scheduleItemFound) {
      return NextResponse.json({ error: 'Schedule item not found' }, { status: 404 })
    }

    // Update both the medication_images (case level) and schedule (completion status)
    const { data: updateResult, error: updateError } = await supabase
      .from('dermatologist_reviews')
      .update({ 
        medication_images: updatedImages,
        schedule: updatedSchedule 
      })
      .eq('id', reviewData.id)
      .select('medication_images, schedule')

    if (updateError) {
      return NextResponse.json({ error: `Failed to update review: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      image_url: publicUrl,
      message: 'Medication image uploaded successfully',
      scheduleId: scheduleId,
      totalImages: updatedImages.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}