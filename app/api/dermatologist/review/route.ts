import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface PdfSectionContent {
  caseId: string
  generatedAt: string
  patientName?: string | null
  patientEmail?: string | null
  dermatologistName?: string | null
  dermatologistTitle?: string | null
  dermatologistEmail?: string | null
  dermatologySpecialty?: string | null
  analysis: any
  review: any
  reportData: {
    case_summary: string
    recommendations: string[]
    next_steps: string[]
    disclaimer: string
  }
}

async function buildReviewPdf(content: PdfSectionContent) {
  const pdfDoc = await PDFDocument.create()
  const pageSize: [number, number] = [595.28, 841.89] // A4 dimensions in points
  let page = pdfDoc.addPage(pageSize)
  const margin = 50
  const contentWidth = page.getWidth() - margin * 2
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const accentColor = rgb(0.1, 0.3, 0.6)
  const textColor = rgb(0.1, 0.1, 0.1)
  const subtleColor = rgb(0.4, 0.4, 0.4)
  const lineHeight = 16
  const headingSpacing = 24
  let cursor = page.getHeight() - margin

  const ensureSpace = (heightNeeded: number) => {
    if (cursor - heightNeeded <= margin) {
      page = pdfDoc.addPage(pageSize)
      cursor = page.getHeight() - margin
    }
  }

  const addHeading = (text: string) => {
    ensureSpace(headingSpacing)
    page.drawText(text, {
      x: margin,
      y: cursor,
      font: headingFont,
      size: 16,
      color: accentColor,
    })
    cursor -= headingSpacing
  }

  const addSubHeading = (text: string) => {
    ensureSpace(headingSpacing - 6)
    page.drawText(text, {
      x: margin,
      y: cursor,
      font: headingFont,
      size: 13,
      color: textColor,
    })
    cursor -= headingSpacing - 6
  }

  const addParagraph = (text: string, options?: { font?: typeof bodyFont; size?: number; color?: ReturnType<typeof rgb> }) => {
    if (!text?.trim()) return
    const font = options?.font ?? bodyFont
    const size = options?.size ?? 11
    const color = options?.color ?? textColor

    const words = text.trim().split(/\s+/)
    let line = ''

    const flushLine = () => {
      if (!line) return
      ensureSpace(lineHeight)
      page.drawText(line, {
        x: margin,
        y: cursor,
        font,
        size,
        color,
      })
      cursor -= lineHeight
      line = ''
    }

    for (const word of words) {
      const attempt = line ? `${line} ${word}` : word
      const width = font.widthOfTextAtSize(attempt, size)
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

  const addKeyValue = (label: string, value?: string | null) => {
    if (!value?.toString().trim()) return

    ensureSpace(lineHeight)
    const labelText = `${label}: `
    const labelWidth = headingFont.widthOfTextAtSize(labelText, 11)

    page.drawText(labelText, {
      x: margin,
      y: cursor,
      font: headingFont,
      size: 11,
      color: textColor,
    })

    page.drawText(value, {
      x: margin + labelWidth,
      y: cursor,
      font: bodyFont,
      size: 11,
      color: textColor,
    })

    cursor -= lineHeight
  }

  const addBullets = (items: string[], title: string) => {
    if (!items?.length) return
    addSubHeading(title)
    for (const item of items) {
      if (!item?.trim()) continue
      const bullet = '\u2022 '
      const bulletWidth = bodyFont.widthOfTextAtSize(bullet, 11)
      const words = item.trim().split(/\s+/)
      let line = ''

      const flushLine = (textLine: string) => {
        if (!textLine) return
        ensureSpace(lineHeight)
        page.drawText(textLine, {
          x: margin + bulletWidth,
          y: cursor,
          font: bodyFont,
          size: 11,
          color: textColor,
        })
        cursor -= lineHeight
      }

      ensureSpace(lineHeight)
      page.drawText(bullet, {
        x: margin,
        y: cursor,
        font: bodyFont,
        size: 11,
        color: textColor,
      })

      for (const word of words) {
        const attempt = line ? `${line} ${word}` : word
        const width = bodyFont.widthOfTextAtSize(attempt, 11)
        if (width > contentWidth - bulletWidth && line) {
          flushLine(line)
          line = word
        } else {
          line = attempt
        }
      }

      flushLine(line)
      cursor -= 6
    }
    cursor -= 6
  }

  // Document content
  addHeading('Dermatology Review Report')
  addParagraph(`Generated on ${new Date(content.generatedAt).toLocaleString()}`, { color: subtleColor })
  addParagraph(`Case ID: ${content.caseId}`, { color: subtleColor })

  addSubHeading('Patient Information')
  addKeyValue('Patient Name', content.patientName ?? 'Not provided')
  if (content.patientEmail) addKeyValue('Contact Email', content.patientEmail)

  addSubHeading('Reviewed By')
  addKeyValue('Dermatologist', content.dermatologistName ?? 'Unknown')
  if (content.dermatologistTitle) addKeyValue('Title', content.dermatologistTitle)
  if (content.dermatologySpecialty) addKeyValue('Specialty', content.dermatologySpecialty)
  if (content.dermatologistEmail) addKeyValue('Email', content.dermatologistEmail)

  addSubHeading('AI Analysis Summary')
  if (content.analysis) {
    if (content.analysis.severity) addKeyValue('Severity', String(content.analysis.severity))
    if (typeof content.analysis.ai_confidence_score !== 'undefined') {
      addKeyValue('Confidence Score', `${content.analysis.ai_confidence_score}%`)
    }
    if (content.analysis.detected_conditions?.length) {
      const conditionSummary = content.analysis.detected_conditions
        .map((cond: any) => `${cond.name} (${cond.confidence}%)`)
        .join(', ')
      addParagraph(`Detected Conditions: ${conditionSummary}`)
    }
    if (content.analysis.recommendations) {
      addParagraph(`AI Recommendations: ${content.analysis.recommendations}`)
    }
  }

  addSubHeading('Dermatologist Review')
  addParagraph(`Diagnosis: ${content.review?.professional_diagnosis ?? 'Not provided'}`)
  addParagraph(`Treatment Plan: ${content.review?.treatment_recommendations ?? 'Not provided'}`)
  if (content.review?.urgency_level) addKeyValue('Urgency Level', content.review.urgency_level)
  if (typeof content.review?.agrees_with_ai === 'boolean') {
    addKeyValue('Agrees With AI', content.review.agrees_with_ai ? 'Yes' : 'No')
  }
  if (content.review?.notes) {
    addParagraph(`Additional Notes: ${content.review.notes}`)
  }

  addSubHeading('Case Summary')
  addParagraph(content.reportData.case_summary)

  addBullets(content.reportData.recommendations, 'Key Recommendations')
  addBullets(content.reportData.next_steps, 'Next Steps for Patient')

  addSubHeading('Disclaimer')
  addParagraph(content.reportData.disclaimer)

  return Buffer.from(await pdfDoc.save())
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a dermatologist (optional for development)
    // In production, you may want to enforce role checking:
    // const userRole = user?.user_metadata?.role
    // if (userRole !== 'dermatologist') {
    //   return NextResponse.json({ error: 'Access denied. Dermatologist role required.' }, { status: 403 })
    // }

    const {
      caseId,
      status,
      professionalDiagnosis,
      treatmentRecommendations,
      agreesWithAi,
      notes,
      urgencyLevel,
    } = await request.json()

    if (!caseId || !status || !professionalDiagnosis || !treatmentRecommendations) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify case exists and is assigned to this dermatologist (service role for consistency)
    const { data: targetCase, error: caseLookupError } = await adminSupabase
      .from('cases')
      .select('id, user_id, assigned_doctor_id, status')
      .eq('id', caseId)
      .single()

    if (caseLookupError || !targetCase) {
      console.error('Review submission failed - case not found:', caseLookupError)
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (targetCase.assigned_doctor_id && targetCase.assigned_doctor_id !== user.id) {
      return NextResponse.json({ error: 'You are not assigned to this case' }, { status: 403 })
    }

    // Create review using service role to avoid RLS issues (after manual checks)
    const { data: review, error: reviewError } = await adminSupabase
      .from('dermatologist_reviews')
      .insert({
        case_id: caseId,
        dermatologist_id: user.id,
        status,
        professional_diagnosis: professionalDiagnosis,
        treatment_recommendations: treatmentRecommendations,
        agrees_with_ai: agreesWithAi,
        notes,
        urgency_level: urgencyLevel,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Review creation error:', reviewError)
      return NextResponse.json({ error: 'Failed to create review', details: reviewError.message }, { status: 500 })
    }

    // Update case status (use service role to bypass RLS while enforcing via logic above)
    const { error: statusUpdateError } = await adminSupabase
      .from('cases')
      .update({ status })
      .eq('id', caseId)

    if (statusUpdateError) {
      console.error('Failed to update case status:', statusUpdateError)
      return NextResponse.json({ error: 'Failed to update case status' }, { status: 500 })
    }

    let reportSummary: {
      id: string | null
      createdAt: string | null
      pdfPath: string | null
      pdfUrl: string | null
      pdfGeneratedAt: string | null
    } | null = null

    // If approved, create user report and PDF
    if (status === 'approved') {
      // Get case data with analysis
      const { data: caseData } = await supabase
        .from('cases')
        .select(`
          *,
          analysis_results (*)
        `)
        .eq('id', caseId)
        .single()

      if (caseData) {
        const generatedAt = new Date().toISOString()
        const recommendationsArray = treatmentRecommendations
          .split('\n')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)

        const reportData: {
          case_summary: string
          ai_analysis: any
          dermatologist_review: any
          recommendations: string[]
          next_steps: string[]
          disclaimer: string
          pdf_path?: string
          pdf_generated_at?: string
        } = {
          case_summary: `Skin analysis completed on ${new Date().toLocaleDateString()}`,
          ai_analysis: caseData.analysis_results?.[0] || {},
          dermatologist_review: review,
          recommendations: recommendationsArray,
          next_steps: [
            'Follow the treatment recommendations provided',
            'Monitor the affected area for changes',
            'Schedule a follow-up if symptoms persist or worsen',
            'Contact emergency services if you experience severe symptoms'
          ],
          disclaimer: 'This report is for informational purposes. Always consult with healthcare professionals for medical advice.',
        }

        // Fetch patient and dermatologist profile information for the PDF
        const [{ data: patientData }, { data: doctorProfile }] = await Promise.all([
          adminSupabase
            .from('patients')
            .select('name, email')
            .eq('id', caseData.user_id)
            .maybeSingle(),
          adminSupabase
            .from('doctors')
            .select('name, title, specialty')
            .eq('id', user.id)
            .maybeSingle(),
        ])

        let pdfPath: string | undefined

        try {
          const pdfBuffer = await buildReviewPdf({
            caseId,
            generatedAt,
            patientName: patientData?.name,
            patientEmail: patientData?.email,
            dermatologistName: doctorProfile?.name ?? user.user_metadata?.name ?? user.email ?? undefined,
            dermatologistTitle: doctorProfile?.title ?? undefined,
            dermatologySpecialty: doctorProfile?.specialty ?? undefined,
            dermatologistEmail: user.email ?? undefined,
            analysis: reportData.ai_analysis,
            review,
            reportData,
          })

          const storagePath = `${caseData.user_id}/${caseId}/review-${Date.now()}.pdf`
          const { error: uploadError } = await adminSupabase
            .storage
            .from('case-reports')
            .upload(storagePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            })

          if (uploadError) {
            console.warn('Failed to upload review PDF:', uploadError)
          } else {
            pdfPath = storagePath
          }
        } catch (pdfError) {
          console.warn('Failed to generate review PDF:', pdfError)
        }

        if (pdfPath) {
          reportData.pdf_path = pdfPath
          reportData.pdf_generated_at = generatedAt
        }

        const { data: reportRecord, error: reportError } = await adminSupabase
          .from('user_reports')
          .upsert({
            case_id: caseId,
            report_data: reportData,
          }, {
            onConflict: 'case_id',
          })
          .select('id, report_data, created_at')
          .single()

        if (reportError) {
          console.error('Failed to store user report:', reportError)
          return NextResponse.json({ error: 'Failed to store report' }, { status: 500 })
        }

        const effectivePdfPath =
          reportRecord?.report_data?.pdf_path ??
          reportData.pdf_path ??
          pdfPath ??
          null

        let pdfSignedUrl: string | null = null

        if (effectivePdfPath) {
          try {
            const { data: signed } = await adminSupabase
              .storage
              .from('case-reports')
              .createSignedUrl(effectivePdfPath, 60 * 60)

            if (signed?.signedUrl) {
              pdfSignedUrl = signed.signedUrl
            }
          } catch (signedUrlError) {
            console.warn('Failed to create signed URL for doctor review PDF:', signedUrlError)
          }
        }

        reportSummary = {
          id: reportRecord?.id ?? null,
          createdAt: reportRecord?.created_at ?? generatedAt,
          pdfPath: effectivePdfPath,
          pdfUrl: pdfSignedUrl,
          pdfGeneratedAt:
            reportRecord?.report_data?.pdf_generated_at ??
            reportData.pdf_generated_at ??
            generatedAt,
        }

        // Mark case as completed
        const { error: completeError } = await adminSupabase
          .from('cases')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', caseId)

        if (completeError) {
          console.error('Failed to mark case as completed:', completeError)
          return NextResponse.json({ error: 'Failed to finalize case' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      review,
      report: reportSummary,
    })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




