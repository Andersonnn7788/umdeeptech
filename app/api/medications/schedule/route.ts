import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

interface MedicationScheduleItem {
  id: string
  name: string
  dosage: string
  instructions: string
  time_of_day: string
  label: string
  scheduled_date: string
  is_completed: boolean
  proof_image_url?: string
}

interface DaySchedule {
  date: string
  schedules: MedicationScheduleItem[]
}

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

    // Get current date and calculate date range (7 days: 2 past, today, 4 future)
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 2) // 2 days ago
    
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 4) // 4 days ahead

    console.log('Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0])

    // Get medications for the date range from unified table
    const { data: medications, error: medicationsError } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', user.id)
      .gte('scheduled_date', startDate.toISOString().split('T')[0])
      .lte('scheduled_date', endDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('time_of_day', { ascending: true })

    if (medicationsError) {
      console.error('Database error:', medicationsError)
      return NextResponse.json(
        { error: 'Failed to fetch medications', details: medicationsError.message },
        { status: 500 }
      )
    }

    console.log('Medications found:', medications?.length || 0)

    // Group medications by date
    const schedulesByDate = new Map<string, MedicationScheduleItem[]>()
    
    medications?.forEach(medication => {
      const date = medication.scheduled_date
      if (!schedulesByDate.has(date)) {
        schedulesByDate.set(date, [])
      }
      
      schedulesByDate.get(date)!.push({
        id: medication.id,
        name: medication.name,
        dosage: medication.dosage,
        instructions: medication.instructions,
        time_of_day: medication.time_of_day,
        label: medication.label,
        scheduled_date: medication.scheduled_date,
        is_completed: medication.is_completed,
        proof_image_url: medication.proof_image_url
      })
    })

    // Convert to array format
    const schedules: DaySchedule[] = Array.from(schedulesByDate.entries()).map(([date, schedules]) => ({
      date,
      schedules
    }))

    console.log('Schedules by date:', schedules.length, 'days with schedules')

    return NextResponse.json({ 
      success: true, 
      data: schedules
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}