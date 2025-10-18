import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Upload API Called ===')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const formData = await request.formData()
    const image = formData.get('image') as File
    const caseId = formData.get('caseId') as string

    console.log('Form data received:', { 
      imageSize: image?.size, 
      imageName: image?.name, 
      caseId: caseId || 'UNDEFINED'
    })

    if (!image || !caseId || caseId === 'undefined' || caseId === 'null') {
      return NextResponse.json({ error: 'Missing image or case ID' }, { status: 400 })
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
      console.error('Case verification failed:', caseError)
      return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
    }

    if (!caseWithReview.dermatologist_reviews || caseWithReview.dermatologist_reviews.length === 0) {
      console.error('No dermatologist review found for case:', caseId)
      return NextResponse.json({ error: 'No dermatologist review found for this case' }, { status: 404 })
    }

    const review = caseWithReview.dermatologist_reviews[0]
    console.log('Found review:', review.id, 'for case:', caseId)

    // Upload image to Supabase Storage
    const fileExt = image.name.split('.').pop()
    const fileName = `${user.id}/${caseId}/${Date.now()}.${fileExt}`

    console.log('Uploading to storage:', fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medication-images')
      .upload(fileName, image)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('medication-images')
      .getPublicUrl(fileName)

    console.log('Image uploaded successfully:', publicUrl)

    // Find the dermatologist review for this case
    const { data: reviewData, error: reviewError } = await supabase
      .from('dermatologist_reviews')
      .select('id, medication_images, case_id')
      .eq('case_id', caseId)
      .single()

    if (reviewError || !reviewData) {
      console.error('Review lookup error:', reviewError)
      return NextResponse.json({ error: 'Review not found for this case' }, { status: 404 })
    }

    console.log('Found review:', reviewData.id, 'for case:', reviewData.case_id)

    // Get existing images and append new one
    const existingImages = reviewData.medication_images || []
    console.log('Existing images before upload:', existingImages)
    
    const updatedImages = [...existingImages, publicUrl]
    console.log('Updated images after adding new one:', updatedImages)

    // First, let's try a simple test update to see if we can update the review at all
    console.log('Testing database update permissions...')
    const { data: testUpdate, error: testError } = await supabase
      .from('dermatologist_reviews')
      .update({ medication_images: ['test-image-url'] })
      .eq('id', reviewData.id)
      .select('medication_images')

    console.log('Test update result:', testUpdate)
    console.log('Test update error:', testError)

    // Now do the real update
    console.log('About to update review', reviewData.id, 'with images:', updatedImages)
    const { data: updateResult, error: updateError } = await supabase
      .from('dermatologist_reviews')
      .update({ medication_images: updatedImages })
      .eq('id', reviewData.id)
      .select('medication_images')

    console.log('Update result:', updateResult)
    console.log('Update error:', updateError)

    if (updateError) {
      console.error('Error updating medication images:', updateError)
      return NextResponse.json({ error: `Failed to update medication images: ${updateError.message}` }, { status: 500 })
    }

    // Verify the update worked by fetching again
    const { data: verifyData, error: verifyError } = await supabase
      .from('dermatologist_reviews')
      .select('medication_images')
      .eq('id', reviewData.id)
      .single()
    
    console.log('Verification query error:', verifyError)
    console.log('Verification - images after update:', verifyData?.medication_images)
    console.log('Verification - image count:', verifyData?.medication_images?.length || 0)

    console.log('Upload completed successfully')
    return NextResponse.json({ 
      image_url: publicUrl,
      message: 'Medication image uploaded successfully',
      totalImages: updatedImages.length
    })
  } catch (error) {
    console.error('Error in upload API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}