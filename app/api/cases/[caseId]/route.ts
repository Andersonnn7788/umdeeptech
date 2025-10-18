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
    const admin = createAdminClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First fetch base case to avoid relational SELECT causing empty rows
    const { data: baseCase, error: baseError } = await admin
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (baseError || !baseCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const isOwner = baseCase.user_id === user.id
    const isAssignedDoctor = baseCase.assigned_doctor_id === user.id
    if (!isOwner && !isAssignedDoctor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Load related tables separately
    const [analysisRes, reviewsRes, reportsRes, doctorRes] = await Promise.all([
      admin.from('analysis_results').select('*').eq('case_id', caseId),
      admin
        .from('dermatologist_reviews')
        .select(`*, dermatologist:doctors!dermatologist_id (id, name, specialty, title)`) 
        .eq('case_id', caseId),
      admin.from('user_reports').select('*').eq('case_id', caseId),
      baseCase.assigned_doctor_id
        ? admin
            .from('doctors')
            .select('id, name, specialty, title, experience')
            .eq('id', baseCase.assigned_doctor_id)
        : Promise.resolve({ data: null } as any),
    ])

    const caseData: any = {
      ...baseCase,
      analysis_results: analysisRes.data ?? [],
      dermatologist_reviews: reviewsRes.data ?? [],
      user_reports: reportsRes.data ?? [],
      assigned_doctor: doctorRes?.data ?? null,
    }

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



