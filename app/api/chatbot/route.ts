import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { RunnableSequence } from '@langchain/core/runnables'
import { PromptTemplate } from '@langchain/core/prompts'

// OpenAI handled via LangChain wrappers

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      )
    }

    // System message to set the context for the AI
    const systemMessage = {
      role: 'system',
      content: `You are an AI medical assistant specializing in dermatology. You are helping dermatologists with their work by providing information about:
- Skin conditions and diseases
- Diagnosis guidelines and differential diagnoses
- Treatment protocols and recommendations
- Latest research and best practices in dermatology
- Patient care guidelines
- Medical terminology and explanations

Always provide accurate, evidence-based information. If you're unsure about something, acknowledge the uncertainty. Remind users that your information should supplement, not replace, their professional medical judgment. Keep responses concise but informative.`
    }
    // Auth: determine current doctor for filtering
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    // Build retriever over Supabase docs filtered to this doctor
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
    })

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: admin,
      tableName: 'documents',
      queryName: 'match_documents',
      // default filter is injected during similarity search
    })

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? ''

    const filter = user?.id ? { doctor_id: user.id } : undefined
    const docs = await vectorStore.similaritySearch(lastUserMsg, 5, filter as any)
    const context = (docs as any[]).map((d: any) => `---\n${d.pageContent}\nmeta: ${JSON.stringify(d.metadata)}`).join('\n\n')

    // Best-effort extract a related caseId from retrieved docs or the raw question
    const caseIdFromDocs: string | undefined = (docs as any[])?.find((d: any) => d?.metadata?.case_id)?.metadata?.case_id
    const caseIdFromQuestion: string | undefined = (() => {
      const m = (lastUserMsg || '').match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
      return m ? m[0] : undefined
    })()

    const prompt = PromptTemplate.fromTemplate(
      `You are an AI medical assistant specializing in dermatology helping a dermatologist.
Use the following patient review case context (if relevant) to answer. If the context is not relevant, answer normally using general knowledge, but prefer context when applicable.

Context:\n{context}

Conversation so far:\n{history}

User question:\n{question}

Instructions:
- Be concise, clinical, and evidence-based.
- Never reveal PII beyond what's already in context.
- If referencing a case, cite it as "Case <case_id>".
- If uncertain, say so and suggest next steps.
 - Do not say you cannot provide PDFs. If a patient report might be relevant, add a short sentence like "See the patient report link below." The application will attach links when available.
`
    )

    const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.3, apiKey: process.env.OPENAI_API_KEY })

    const chain = RunnableSequence.from([
      {
        context: async () => context,
        history: async () => messages.filter((m: any) => m.role !== 'system').map((m: any) => `${m.role}: ${m.content}`).join('\n'),
        question: async () => lastUserMsg,
      },
      prompt,
      llm,
    ])

    const result = await chain.invoke({})
    const assistantMessage = typeof result === 'string' ? result : (result as any).content

    let reportUrl: string | null = null

    const effectiveCaseId = caseIdFromDocs || caseIdFromQuestion
    // Always try to attach a report if we can identify a case
    if (effectiveCaseId) {
      try {
        // Try existing user report first
        const { data: reports } = await admin
          .from('user_reports')
          .select('report_data')
          .eq('case_id', effectiveCaseId)

        const firstReport = Array.isArray(reports) && reports.length ? reports[0] as any : null
        const pdfPath: string | null = firstReport?.report_data?.pdf_path ?? null
        const preSigned: string | null = firstReport?.report_data?.pdf_url ?? null

        if (preSigned) {
          reportUrl = preSigned
        } else if (pdfPath) {
          const { data: signed } = await admin
            .storage
            .from('case-reports')
            .createSignedUrl(pdfPath, 60 * 60 * 24 * 7)
          if (signed?.signedUrl) {
            reportUrl = signed.signedUrl
          }
        }

        // Fallback: generate from approved dermatologist review via Edge Function
        if (!reportUrl) {
          const { data: approvedReview } = await admin
            .from('dermatologist_reviews')
            .select('id, status, reviewed_at')
            .eq('case_id', effectiveCaseId)
            .eq('status', 'approved')
            .order('reviewed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const reviewId = approvedReview?.id as string | undefined
          if (reviewId) {
            try {
              const { data } = await admin.functions.invoke<{ signed_url?: string }>('export-derm-report', {
                body: { review_id: reviewId },
              })
              if (data?.signed_url) {
                reportUrl = data.signed_url
              }
            } catch {
              // ignore generation error; we'll just return without URL
            }
          }
        }
      } catch {
        // Non-blocking: if we fail to attach report URL, we still return the message
      }
    }

    return NextResponse.json({ message: assistantMessage ?? 'I apologize, but I could not generate a response.', reportUrl })
  } catch (error: any) {
    console.error('Chatbot API error:', error)
    
    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'API quota exceeded. Please check your OpenAI account.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

