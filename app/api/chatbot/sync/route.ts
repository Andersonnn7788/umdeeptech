import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'

// Visible case statuses for doctor review context
const VISIBLE_STATUSES = [
  'submitted_for_review',
  'under_review',
  'requires_resubmission',
  'approved',
  'completed',
] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Optional: verify role via patients table metadata like other APIs
    const { data: doctorRecord } = await admin
      .from('patients')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (doctorRecord && doctorRecord.role !== 'doctor') {
      return NextResponse.json({ error: 'Access denied. Doctor role required.' }, { status: 403 })
    }

    // Fetch the doctor's review cases with analysis results
    const { data: cases, error: casesError } = await admin
      .from('cases')
      .select(`
        id, user_id, assigned_doctor_id, status, patient_description, created_at,
        analysis_results (ai_confidence_score, detected_conditions, severity, recommendations)
      `)
      .eq('assigned_doctor_id', user.id)
      .in('status', VISIBLE_STATUSES as unknown as string[])

    if (casesError) {
      console.error('RAG sync cases error:', casesError)
      return NextResponse.json({ error: 'Failed to load cases' }, { status: 500 })
    }

    const userIds = Array.from(new Set((cases ?? []).map(c => c.user_id).filter(Boolean)))
    let patientMap = new Map<string, { id: string; name: string | null }>()
    if (userIds.length) {
      const { data: patients } = await admin
        .from('patients')
        .select('id, name')
        .in('id', userIds)
      if (patients) {
        for (const p of patients) {
          if (p?.id) patientMap.set(p.id, { id: p.id, name: p.name ?? null })
        }
      }
    }

    // Build documents for embeddings
    const texts: string[] = []
    const metadatas: Array<Record<string, any>> = []
    for (const c of cases ?? []) {
      const patient = c.user_id ? patientMap.get(c.user_id) ?? null : null
      const ar = Array.isArray(c.analysis_results) && c.analysis_results.length
        ? c.analysis_results[0]
        : null
      const detected = ar?.detected_conditions ? JSON.stringify(ar.detected_conditions) : '[]'
      const text = [
        `Case ${c.id}`,
        patient?.name ? `Patient Name: ${patient.name}` : '',
        `Status: ${c.status}`,
        c.patient_description ? `Patient Description: ${c.patient_description}` : '',
        ar?.severity ? `AI Severity: ${ar.severity}` : '',
        ar?.ai_confidence_score ? `AI Confidence: ${ar.ai_confidence_score}` : '',
        detected !== '[]' ? `Detected Conditions: ${detected}` : '',
        ar?.recommendations ? `AI Recommendations: ${ar.recommendations}` : '',
        c.created_at ? `Created At: ${c.created_at}` : '',
      ].filter(Boolean).join('\n')

      texts.push(text)
      metadatas.push({
        type: 'case',
        case_id: c.id,
        patient_id: c.user_id,
        doctor_id: c.assigned_doctor_id,
        status: c.status,
      })
    }

    // Clear old docs for this doctor to avoid duplication
    await admin
      .from('documents')
      .delete()
      .contains('metadata', { doctor_id: user.id, type: 'case' })

    if (texts.length) {
      const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'text-embedding-3-small',
      })

      await SupabaseVectorStore.fromTexts(
        texts,
        metadatas,
        embeddings,
        {
          client: admin,
          tableName: 'documents',
          queryName: 'match_documents',
        }
      )
    }

    return NextResponse.json({ success: true, count: texts.length })
  } catch (error) {
    console.error('RAG sync error:', error)
    return NextResponse.json({ error: 'Failed to sync documents' }, { status: 500 })
  }
}



