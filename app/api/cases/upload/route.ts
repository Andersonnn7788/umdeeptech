import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the image from form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use content hash for idempotent filenames to avoid duplicates on retries
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32)

    // Process image with sharp - create optimized version and thumbnail
    const imageBuffer = await sharp(buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Deterministic filenames derived from image content
    const imagePath = `${user.id}/${hash}-image.jpg`
    const thumbnailPath = `${user.id}/${hash}-thumbnail.jpg`

    // Upload to Supabase Storage
    const { error: imageUploadError } = await supabase.storage
      .from('skin-images')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true, // overwrite if same content uploaded again
      })

    if (imageUploadError) {
      console.error('Image upload error:', imageUploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { error: thumbnailUploadError } = await supabase.storage
      .from('skin-images')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (thumbnailUploadError) {
      console.error('Thumbnail upload error:', thumbnailUploadError)
    }

    // Get public URLs
    const { data: imageUrlData } = supabase.storage
      .from('skin-images')
      .getPublicUrl(imagePath)

    const { data: thumbnailUrlData } = supabase.storage
      .from('skin-images')
      .getPublicUrl(thumbnailPath)

    // If a case already exists for this exact image, return it (idempotent)
    const { data: existingCase } = await admin
      .from('cases')
      .select('*')
      .eq('user_id', user.id)
      .eq('image_url', imageUrlData.publicUrl)
      .maybeSingle()

    if (existingCase) {
      return NextResponse.json({ success: true, case: existingCase })
    }

    // Create case record
    const { data: caseData, error: caseError } = await admin
      .from('cases')
      .insert({
        user_id: user.id,
        status: 'uploaded',
        image_url: imageUrlData.publicUrl,
        thumbnail_url: thumbnailUrlData.publicUrl,
      })
      .select()
      .single()

    if (caseError) {
      console.error('Case creation error:', caseError)
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      case: caseData,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

