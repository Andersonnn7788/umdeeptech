import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const supabase = createAdminClient()
    
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('available', true)
      .order('name')
    
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
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
    const { id, name, specialty, title, experience, category, location } = body

    console.log('Creating doctor profile:', { id, name, specialty, title, experience, category, location })

    // Validate required fields
    if (!id || !name || !specialty || !title || !experience || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, specialty, title, experience, category' },
        { status: 400 }
      )
    }

    // Validate that the id matches the authenticated user
    if (id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot create profile for another user' },
        { status: 403 }
      )
    }

    // Validate category
    const validCategories = ['Medical', 'Surgical', 'Pediatric', 'Allergy', 'Dermatology']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Create admin client for database operations
    const supabase = createAdminClient()

    // Check if doctor profile already exists
    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single()

    let data, error
    
    if (existingDoctor) {
      // Update existing doctor profile
      const updateResult = await supabase
        .from('doctors')
        .update({
          name,
          specialty,
          title,
          experience,
          category,
          location,
          available: true,
          rating: existingDoctor.rating || 5.0
        })
        .eq('id', id)
        .select()
        
      data = updateResult.data
      error = updateResult.error
    } else {
      // Create new doctor profile
      const insertResult = await supabase
        .from('doctors')
        .insert([{
          id,
          name,
          specialty,
          title,
          experience,
          category,
          location,
          available: true,
          rating: 5.0
        }])
        .select()
        
      data = insertResult.data
      error = insertResult.error
    }

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error creating doctor profile', details: error.message },
        { status: 500 }
      )
    }

    console.log('Doctor profile created/updated successfully:', data)

    return NextResponse.json({ 
      success: true, 
      data: data?.[0] 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}