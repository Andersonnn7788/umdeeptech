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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, email, role = 'patient' } = body

    console.log('Creating user record:', { userId, name, email, role })

    if (!userId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, email' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "patient" or "doctor"' },
        { status: 400 }
      )
    }

    console.log('Admin client created successfully')

    // Create admin client
    const supabase = createAdminClient()

    // First, check if user already exists by ID or email
    const { data: existingUser } = await supabase
      .from('patients')
      .select('*')
      .or(`id.eq.${userId},email.eq.${email}`)
      .single()

    let data, error
    
    if (existingUser) {
      // User exists, update their record (especially role if it's null or different)
      const updateData: any = { name, role }
      
      // If the existing user has a different email, update it
      if (existingUser.email !== email) {
        updateData.email = email
      }
      
      const updateResult = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', existingUser.id)
        .select()
        
      data = updateResult.data
      error = updateResult.error
    } else {
      // User doesn't exist, create new record
      const insertResult = await supabase
        .from('patients')
        .insert([{
          id: userId,
          name: name,
          email: email,
          role: role
        }])
        .select()
        
      data = insertResult.data
      error = insertResult.error
    }

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error creating user record', details: error.message },
        { status: 500 }
      )
    }

    console.log('User record created/updated successfully:', data)

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

export async function GET(request: NextRequest) {
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

    console.log('Current user:', user.id, user.email)

    // Create admin client for database queries
    const supabase = createAdminClient()

    // Get user data from patients table
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'User record not found', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}