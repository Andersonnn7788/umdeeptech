import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
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


    // First check if the case exists and its current status (using admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { data: caseDataDebug, error: selectErrorDebug } = await adminClient
      .from('cases')
      .select('id, status, user_id, assigned_doctor_id')
      .eq('id', caseId)
      .single()

    // Now try with RLS using regular client
    const { data: caseData, error: selectError } = await supabase
      .from('cases')
      .select('id, status, user_id, assigned_doctor_id')
      .eq('id', caseId)
      .single()

    console.log('Case data (with RLS):', caseData)

    if (selectError || !caseData) {
      console.error('Case not found:', selectError)
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Update the case status to 'analyzed'
    const { data: updateData, error: updateError } = await supabase
      .from('cases')
      .update({ status: 'analyzed' })
      .eq('id', caseId)
      .select('id, status')

    console.log('Update result:', { updateData, updateError })

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: `Database error: ${updateError.message}` }, { status: 500 })
    }

    if (!updateData || updateData.length === 0) {
      console.error('No rows updated - case not found or no permission')
      return NextResponse.json({ error: 'Case not found or no permission to update' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Case marked as complete',
      case: updateData[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}