import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'
import OpenAI from 'npm:openai'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const STORAGE_BUCKET = 'cases_reports'
const REPORT_MODEL = 'gpt-4o-mini'
const SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7 days

type ReviewRecord = {
  id: string
  case_id: string
  dermatologist_id: string
  status: string
  professional_diagnosis: string | null
  treatment_recommendations: string | null
  agrees_with_ai: boolean | null
  notes: string | null
  urgency_level: string | null
  reviewed_at: string | null
}

type CaseRecord = {
  id: string
  status: string
  patient_description: string | null
  created_at: string | null
  submitted_for_review_at: string | null
  completed_at: string | null
}

type DoctorRecord = {
  id: string
  name: string | null
  title: string | null
  specialty: string | null
}

type AnalysisRecord = {
  severity: string | null
  recommendations: string | null
  ai_confidence_score: number | null
  detected_conditions: Array<{
    name: string | null
    confidence: number | null
    description: string | null
  }> | null
}

type ReportPayload = {
  title: string
  caseInfo: string
  diagnosis: string
  urgency: string
  treatmentPlan: string[]
  counselingPoints: string[]
  redFlags: string[]
  disclaimers: string[]
}

async function ensureBucketExists(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET)
  if (data && !error) {
    return
  }

  if (error && !error.message?.toLowerCase().includes('not exist')) {
    // Unexpected error, surface it
    throw error
  }

  const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: false,
  })

  if (createError && !createError.message?.toLowerCase().includes('already exists')) {
    throw createError
  }
}

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    ...init,
  })
}

function normalizeList(list: unknown): string[] {
  if (!Array.isArray(list)) {
    return []
  }
  return list
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }
      if (item && typeof item === 'object') {
        return JSON.stringify(item)
      }
      return String(item ?? '')
    })
    .filter((item) => item.length > 0)
}

function formatDateLabel(label: string, value: string | null | undefined) {
  if (!value) return null
  try {
    const formatted = new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    return `${label}: ${formatted}`
  } catch {
    return `${label}: ${value}`
  }
}

async function generateReportSections(
  openaiKey: string,
  review: ReviewRecord,
  caseData: CaseRecord | null,
  analysis: AnalysisRecord | null,
  doctor: DoctorRecord | null
) {
  const openai = new OpenAI({ apiKey: openaiKey })

  const prompt = {
    review,
    case: caseData,
    analysis,
    doctor,
  }

  const response = await openai.responses.create({
    model: REPORT_MODEL,
    input: [
      {
        role: 'system',
        content: 'You are a board-certified dermatologist generating concise, empathetic reports.',
      },
      {
        role: 'user',
        content: `Generate a structured dermatology report for the following data. Use professional but reassuring language.\n${JSON.stringify(
          prompt
        )}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'DermatologyReport',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: [
            'title',
            'caseInfo',
            'diagnosis',
            'urgency',
            'treatmentPlan',
            'counselingPoints',
            'redFlags',
            'disclaimers',
          ],
          properties: {
            title: { type: 'string' },
            caseInfo: { type: 'string' },
            diagnosis: { type: 'string' },
            urgency: { type: 'string' },
            treatmentPlan: {
              type: 'array',
              items: { type: 'string' },
            },
            counselingPoints: {
              type: 'array',
              items: { type: 'string' },
            },
            redFlags: {
              type: 'array',
              items: { type: 'string' },
            },
            disclaimers: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  })

  const inlineOutput = typeof response.output_text === 'string' ? response.output_text : null
  const jsonText =
    (inlineOutput && inlineOutput.trim().length > 0
      ? inlineOutput
      : response.output?.find((item) => item.type === 'output_text' && item.text)?.text) ?? null

  if (!jsonText) {
    throw new Error('Failed to generate structured report')
  }

  const parsed = JSON.parse(jsonText) as ReportPayload
  return {
    title: parsed.title?.trim() || 'Dermatology Review Summary',
    caseInfo: parsed.caseInfo?.trim() || 'No additional case information provided.',
    diagnosis: parsed.diagnosis?.trim() || 'Diagnosis pending.',
    urgency: parsed.urgency?.trim() || (review.urgency_level ? `Urgency level: ${review.urgency_level}` : 'Urgency not specified.'),
    treatmentPlan: normalizeList(parsed.treatmentPlan),
    counselingPoints: normalizeList(parsed.counselingPoints),
    redFlags: normalizeList(parsed.redFlags),
    disclaimers: normalizeList(parsed.disclaimers).length
      ? normalizeList(parsed.disclaimers)
      : ['This assessment does not replace an in-person dermatology evaluation. Seek urgent care for worsening symptoms.'],
  } satisfies ReportPayload
}

async function buildPdf(report: ReportPayload, review: ReviewRecord, doctor: DoctorRecord | null) {
  const pdfDoc = await PDFDocument.create()
  const pageSize: [number, number] = [595.28, 841.89] // A4 in points
  let page = pdfDoc.addPage(pageSize)
  const margin = 48
  const contentWidth = page.getWidth() - margin * 2
  const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const accentColor = rgb(0.1, 0.3, 0.6)
  const textColor = rgb(0.1, 0.1, 0.1)
  const subtleColor = rgb(0.4, 0.4, 0.4)
  const lineHeight = 16
  let cursor = page.getHeight() - margin

  const ensureSpace = (heightNeeded: number) => {
    if (cursor - heightNeeded <= margin) {
      page = pdfDoc.addPage(pageSize)
      cursor = page.getHeight() - margin
    }
  }

  const drawTitle = (text: string) => {
    ensureSpace(32)
    page.drawText(text, {
      x: margin,
      y: cursor,
      font: headingFont,
      size: 20,
      color: accentColor,
    })
    cursor -= 30
  }

  const addLabel = (label: string, value: string | null | undefined) => {
    if (!value) return
    const display = `${label}: ${value}`
    ensureSpace(lineHeight)
    page.drawText(display, {
      x: margin,
      y: cursor,
      font: bodyFont,
      size: 10,
      color: subtleColor,
    })
    cursor -= lineHeight
  }

  const addHeading = (text: string) => {
    ensureSpace(26)
    cursor -= 6
    page.drawText(text, {
      x: margin,
      y: cursor,
      font: headingFont,
      size: 14,
      color: accentColor,
    })
    cursor -= 20
  }

  const addParagraph = (text: string, options?: { fontSize?: number; color?: ReturnType<typeof rgb> }) => {
    const trimmed = text?.trim()
    if (!trimmed) return

    const blocks = trimmed.split(/\n+/).map((block) => block.trim()).filter(Boolean)
    const fontSize = options?.fontSize ?? 11
    const color = options?.color ?? textColor

    for (const block of blocks) {
      const words = block.split(/\s+/)
      let line = ''

      const flushLine = () => {
        if (!line) return
        ensureSpace(lineHeight)
        page.drawText(line, {
          x: margin,
          y: cursor,
          font: bodyFont,
          size: fontSize,
          color,
        })
        cursor -= lineHeight
        line = ''
      }

      for (const word of words) {
        const attempt = line ? `${line} ${word}` : word
        const width = bodyFont.widthOfTextAtSize(attempt, fontSize)
        if (width > contentWidth && line) {
          flushLine()
          line = word
        } else {
          line = attempt
        }
      }

      flushLine()
      cursor -= 4
    }
  }

  const addList = (items: string[]) => {
    if (!items.length) return
    for (const item of items) {
      const formatted = `• ${item.replace(/\s+/g, ' ').trim()}`
      addParagraph(formatted)
    }
  }

  drawTitle(report.title)
  addLabel('Review ID', review.id)
  addLabel('Case ID', review.case_id)
  addLabel('Dermatologist', doctor?.name ? `${doctor.name}${doctor.title ? `, ${doctor.title}` : ''}` : null)
  addLabel('Urgency Level', review.urgency_level ?? null)
  addLabel('Reviewed At', formatDateLabel('Reviewed At', review.reviewed_at) ?? null)
  cursor -= 10

  addHeading('Case Information')
  addParagraph(report.caseInfo)

  addHeading('Diagnosis')
  addParagraph(report.diagnosis)

  addHeading('Urgency')
  addParagraph(report.urgency)

  addHeading('Treatment Plan')
  addList(report.treatmentPlan)

  addHeading('Counseling Points')
  addList(report.counselingPoints)

  addHeading('Red Flags')
  if (report.redFlags.length) {
    addList(report.redFlags)
  } else {
    addParagraph('No critical red flags identified.')
  }

  addHeading('Disclaimers')
  if (report.disclaimers.length) {
    addList(report.disclaimers)
  } else {
    addParagraph('This report is informational and does not substitute an in-person consultation.')
  }

  addHeading('Review Notes')
  addParagraph(review.notes ?? 'No additional notes provided.')

  addHeading('Agreement With AI Analysis')
  addParagraph(
    typeof review.agrees_with_ai === 'boolean'
      ? review.agrees_with_ai
        ? 'Dermatologist agrees with the AI assessment.'
        : 'Dermatologist does not fully agree with the AI assessment.'
      : 'Agreement with AI analysis not recorded.'
  )

  addHeading('Professional Diagnosis')
  addParagraph(review.professional_diagnosis ?? 'No diagnosis recorded.')

  addHeading('Treatment Recommendations')
  addParagraph(review.treatment_recommendations ?? 'No treatment recommendations recorded.')

  return await pdfDoc.save()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase credentials not configured' }, { status: 500 })
  }

  if (!openaiKey) {
    return jsonResponse({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const reviewId = (payload as Record<string, unknown>)?.review_id
  if (!reviewId || typeof reviewId !== 'string') {
    return jsonResponse({ error: 'review_id is required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: review, error: reviewError } = await supabase
    .from('dermatologist_reviews')
    .select(
      `id, case_id, dermatologist_id, status, professional_diagnosis, treatment_recommendations, agrees_with_ai, notes, urgency_level, reviewed_at`
    )
    .eq('id', reviewId)
    .maybeSingle()

  if (reviewError) {
    console.error('Failed to fetch review:', reviewError)
    return jsonResponse({ error: 'Failed to fetch review' }, { status: 500 })
  }

  if (!review) {
    return jsonResponse({ error: 'Review not found' }, { status: 404 })
  }

  const [{ data: caseData }, { data: doctor }, { data: analysis }] = await Promise.all([
    supabase
      .from('cases')
      .select('id, status, patient_description, created_at, submitted_for_review_at, completed_at')
      .eq('id', review.case_id)
      .maybeSingle(),
    supabase
      .from('doctors')
      .select('id, name, title, specialty')
      .eq('id', review.dermatologist_id)
      .maybeSingle(),
    supabase
      .from('analysis_results')
      .select('severity, recommendations, ai_confidence_score, detected_conditions')
      .eq('case_id', review.case_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  try {
    const report = await generateReportSections(openaiKey, review as ReviewRecord, caseData as CaseRecord | null, analysis as AnalysisRecord | null, doctor as DoctorRecord | null)
    const pdfBytes = await buildPdf(report, review as ReviewRecord, doctor as DoctorRecord | null)
    const storagePath = `${review.case_id}/${review.id}.pdf`

    await ensureBucketExists(supabase)

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, pdfBytes, {
        cacheControl: '3600',
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Failed to upload PDF:', uploadError)
      return jsonResponse({ error: 'Failed to store PDF' }, { status: 500 })
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL)

    if (signedError || !signed?.signedUrl) {
      console.error('Failed to create signed URL:', signedError)
      return jsonResponse({ error: 'Failed to create signed URL' }, { status: 500 })
    }

    return jsonResponse({
      path: storagePath,
      signed_url: signed.signedUrl,
    })
  } catch (error) {
    console.error('Report generation failed:', error)
    return jsonResponse({ error: 'Failed to generate report' }, { status: 500 })
  }
})
