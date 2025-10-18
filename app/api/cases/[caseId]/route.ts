import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the case with related data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        analysis_results (*),
        dermatologist_reviews (
          *,
          dermatologist:doctors!dermatologist_id (
            id,
            name,
            specialty,
            title
          )
        ),
        user_reports (*),
        assigned_doctor:doctors!assigned_doctor_id (
          id,
          name,
          specialty,
          title,
          experience
        )
      `)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const admin = createAdminClient()

    if (Array.isArray(caseData.user_reports) && caseData.user_reports.length > 0) {
      for (const report of caseData.user_reports) {
        try {
          const pdfPath = report?.report_data?.pdf_path
          if (pdfPath) {
            const { data: signed } = await admin
              .storage
              .from('case-reports')
              .createSignedUrl(pdfPath, 60 * 60 * 24 * 7) // 7 days

            if (signed?.signedUrl) {
              report.report_data.pdf_url = signed.signedUrl
            }
          }
        } catch (storageError) {
          console.warn('Failed to create signed URL for report PDF:', storageError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      case: caseData,
    })
  } catch (error) {
    console.error('Get case error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



