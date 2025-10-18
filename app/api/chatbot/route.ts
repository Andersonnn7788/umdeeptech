import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({
      message: assistantMessage,
    })
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

