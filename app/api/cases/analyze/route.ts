import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await request.json()

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    // Get the case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Update status to analyzing
    await supabase
      .from('cases')
      .update({ status: 'analyzing' })
      .eq('id', caseId)

    // Analyze image with OpenAI Chat Completions (gpt-5-mini)
    const systemPrompt = `You are an AI assistant helping with preliminary skin analysis. 
IMPORTANT DISCLAIMER: You are NOT a medical professional and do NOT provide medical diagnoses. 
Your role is to:
1. Describe visible characteristics of the skin condition
2. Suggest 3 possible common conditions that may match the appearance
3. Provide at most 5 general skincare recommendations
4. Strongly recommend consulting a dermatologist for professional diagnosis

Respond in JSON format with the following structure:
{
  "confidence_score": 0-100,
  "detected_conditions": [
    {
      "name": "condition name",
      "confidence": 0-100,
      "description": "brief description"
    }
  ],
  "severity": "low|moderate|high|urgent",
  "visible_characteristics": "description of what you see",
  "recommendations": "general skincare advice",
  "requires_professional_evaluation": true,
  "disclaimer": "This is not a medical diagnosis. Please consult a dermatologist."
}`

    // Build the user message content
    const userTextContent = caseData.patient_description
      ? `Please analyze this skin image and provide preliminary observations.\n\nPatient's Description of Symptoms:\n${caseData.patient_description}`
      : 'Please analyze this skin image and provide preliminary observations.'

    const baseMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: userTextContent },
          { type: 'image_url' as const, image_url: { url: caseData.image_url, detail: 'high' as const } }
        ]
      }
    ]

    const requestAnalysis = async (maxTokens: number) => {
      return openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: baseMessages,
        max_completion_tokens: maxTokens,
        response_format: { type: 'json_object' }
      })
    }

    let completion = await requestAnalysis(1100)

    if (completion.choices[0]?.finish_reason === 'length') {
      console.warn('AI response truncated at 1100 tokens, retrying with higher limit')
      completion = await requestAnalysis(2000)
    }

    const message = completion.choices[0]?.message as any
    const parsedAnalysis = message?.parsed

    let analysis: any = parsedAnalysis

    if (!analysis) {
      const toolCallContent = Array.isArray(message?.tool_calls)
        ? message.tool_calls
          .map((call: any) => call?.function?.arguments)
          .filter((args: unknown): args is string => typeof args === 'string' && args.trim().length > 0)
          .join('\n')
          .trim()
        : undefined

      const rawContent =
        toolCallContent ??
        (typeof message?.content === 'string'
          ? message.content
          : Array.isArray(message?.content)
            ? message.content
              .map((part: any) => {
                if (typeof part?.text === 'string') {
                  return part.text
                }
                if (typeof part?.content === 'string') {
                  return part.content
                }
                return ''
              })
              .join('')
              .trim()
            : undefined)

      if (!rawContent) {
        console.error('Unexpected AI response payload:', completion)
        throw new Error('No analysis returned from AI')
      }

      try {
        analysis = JSON.parse(rawContent)
      } catch (parseError) {
        console.error('Failed to parse AI analysis JSON:', parseError, rawContent)
        throw new Error('Invalid analysis format returned from AI')
      }
    }

    if (!analysis || typeof analysis !== 'object') {
      console.error('AI analysis payload missing or malformed:', analysis)
      throw new Error('Invalid analysis format returned from AI')
    }

    // Store analysis result (allow re-analysis by updating the existing row)
    const analyzedAt = new Date().toISOString()
    const analysisPayload = {
      case_id: caseId,
      ai_confidence_score: analysis.confidence_score,
      detected_conditions: analysis.detected_conditions,
      severity: analysis.severity,
      recommendations: analysis.recommendations,
      analysis_metadata: {
        visible_characteristics: analysis.visible_characteristics,
        disclaimer: analysis.disclaimer,
        model: 'gpt-5-mini',
        analyzed_at: analyzedAt,
      },
    }

    const { data: analysisResult, error: analysisError } = await adminSupabase
      .from('analysis_results')
      .upsert(analysisPayload, {
        onConflict: 'case_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Analysis storage error:', analysisError)
      return NextResponse.json({ error: 'Failed to store analysis' }, { status: 500 })
    }

    // Auto-flag severe cases for dermatologist review
    const severity: string = (analysis.severity || '').toString().toLowerCase()
    if (severity === 'high' || severity === 'urgent') {
      await supabase
        .from('cases')
        .update({
          status: 'submitted_for_review',
          submitted_for_review_at: new Date().toISOString(),
        })
        .eq('id', caseId)
    } else {
      await supabase
        .from('cases')
        .update({ status: 'analyzed' })
        .eq('id', caseId)
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}

