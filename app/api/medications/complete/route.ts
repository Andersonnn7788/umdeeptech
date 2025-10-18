import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Create server-side Supabase client for auth
async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const client = await createClient()
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { medication_id, proof_image_url, notes } = body

    console.log('Completing medication task:', { 
      medication_id, 
      user_id: user.id, 
      has_image: !!proof_image_url 
    })

    if (!medication_id) {
      return NextResponse.json(
        { error: 'Missing required field: medication_id' },
        { status: 400 }
      )
    }

    // Create admin client for database operations
    const supabase = createAdminClient()

    // Update the medication record to mark as completed
    const { data: medication, error: completionError } = await supabase
      .from('medications')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        proof_image_url,
        completion_notes: notes
      })
      .eq('id', medication_id)
      .eq('patient_id', user.id) // Ensure user owns this medication
      .select()
      .single()

    if (completionError) {
      console.error('Database error:', completionError)
      return NextResponse.json(
        { error: 'Failed to record completion', details: completionError.message },
        { status: 500 }
      )
    }

    if (!medication) {
      return NextResponse.json(
        { error: 'Medication not found or access denied' },
        { status: 404 }
      )
    }

    console.log('Medication task completed successfully:', medication)

    return NextResponse.json({ 
      success: true, 
      data: medication
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}