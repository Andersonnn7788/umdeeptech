'use client'

import { useState, useEffect } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { Home, Calendar, MessageSquare, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DoctorChatbot from '@/components/DoctorChatbot'
import { supabase } from '@/lib/supabase/client'

interface Case {
  id: string
  status: string
  image_url: string
  thumbnail_url: string
  patient_description?: string
  created_at: string
  submitted_for_review_at: string
  patient?: {
    id: string
    name: string | null
  }
  analysis_results: Array<{
    ai_confidence_score: number
    detected_conditions: Array<{
      name: string
      confidence: number
      description: string
    }>
    severity: string
    recommendations: string
  }>
}

// Common skin medications list
const SKIN_MEDICATIONS = [
  'Hydrocortisone 1% cream',
  'Betamethasone cream',
  'Triamcinolone acetonide cream',
  'Clobetasol propionate cream',
  'Tretinoin gel 0.1%',
  'Adapalene gel 0.1%',
  'Benzoyl peroxide 5% gel',
  'Clindamycin 1% solution',
  'Erythromycin 2% gel',
  'Ketoconazole 2% cream',
  'Terbinafine 1% cream',
  'Mupirocin 2% ointment',
  'Calamine lotion',
  'Zinc oxide cream',
  'Urea 10% cream',
  'Salicylic acid 2% solution',
  'Coal tar 2% shampoo',
  'Tacrolimus 0.1% ointment',
  'Pimecrolimus 1% cream',
  'Doxycycline 100mg tablets',
  'Minocycline 50mg tablets',
  'Isotretinoin 20mg capsules',
  'Metronidazole 0.75% gel',
  'Azelaic acid 20% cream',
  'Nystatin cream'
]

export default function DermatologistCasesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [selectedFollowUpCase, setSelectedFollowUpCase] = useState<Case | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Helper function to check if a case is marked as completed
  const isCaseCompleted = (caseId: string) => {
    return localStorage.getItem(`case_${caseId}_completed`) === 'true'
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dermatologist')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchCases()
    }
  }, [user])

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/dermatologist/cases')
      if (!response.ok) {
        throw new Error('Failed to fetch cases')
      }
      const data = await response.json()
      setCases(data.cases)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'moderate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dermatologist')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Review Cases</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {cases.length} matched case{cases.length !== 1 ? 's' : ''} assigned to you
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {cases.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No Cases to Review</h2>
            <p className="text-gray-600 dark:text-gray-400">
              There are no matched cases assigned to you yet. When a patient is paired with you, their case will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow ${
                  isCaseCompleted(caseItem.id) ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'
                }`}
                onClick={() => {
                  if (isCaseCompleted(caseItem.id)) {
                    return // Don't allow clicking on completed cases
                  }
                  if (caseItem.status === 'approved') {
                    setSelectedFollowUpCase(caseItem)
                  } else {
                    setSelectedCase(caseItem)
                  }
                }}
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {caseItem.patient?.name?.trim() || 'Unnamed Patient'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Case ID: {caseItem.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Submitted: {new Date(caseItem.submitted_for_review_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {caseItem.analysis_results?.[0] && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(caseItem.analysis_results[0].severity)}`}>
                        {caseItem.analysis_results[0].severity}
                      </span>
                    )}
                  </div>

                  {caseItem.analysis_results?.[0] && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${caseItem.analysis_results[0].ai_confidence_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">
                            {caseItem.analysis_results[0].ai_confidence_score}%
                          </span>
                        </div>
                      </div>

                      {caseItem.analysis_results[0].detected_conditions?.length > 0 && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Detected Conditions:
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {caseItem.analysis_results[0].detected_conditions[0].name}
                            {caseItem.analysis_results[0].detected_conditions.length > 1 &&
                              ` +${caseItem.analysis_results[0].detected_conditions.length - 1} more`}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <button 
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      isCaseCompleted(caseItem.id) 
                        ? 'bg-green-600 text-white cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={isCaseCompleted(caseItem.id)}
                  >
                    {isCaseCompleted(caseItem.id) 
                      ? 'Completed ✓' 
                      : (caseItem.status === 'approved' ? 'Follow Up' : 'Review Case')
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedCase && (
        <ReviewModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onSubmit={() => {
            fetchCases()
          }}
        />
      )}

      {/* Follow Up Modal */}
      {selectedFollowUpCase && (
        <FollowUpModal
          caseData={selectedFollowUpCase}
          onClose={() => setSelectedFollowUpCase(null)}
          onSubmit={() => {
            fetchCases()
            setSelectedFollowUpCase(null)
          }}
        />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
          <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
            {[
              { href: "/dermatologist", icon: Home, label: "Home", isActive: false, clickable: true, onClick: null },
              { href: "#", icon: MessageSquare, label: "Chatbot", isActive: false, clickable: true, onClick: () => setIsChatbotOpen(true) },
              { href: "/dermatologist/profile", icon: User, label: "Profile", isActive: false, clickable: true, onClick: null }
            ].map((item) => {
              if (item.onClick) {
                return (
                  <Button
                    key={item.href}
                    onClick={item.onClick}
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 flex-1 ${
                      item.isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                )
              }
              
              return (
                <Link 
                  key={item.href} 
                  href={item.clickable ? item.href : "#"}
                  className={`flex flex-col items-center gap-1 flex-1 ${!item.clickable ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!item.clickable}
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                      item.isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chatbot Modal */}
      <DoctorChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  )
}

interface ReviewModalProps {
  caseData: Case
  onClose: () => void
  onSubmit: () => void
}

function ReviewModal({ caseData, onClose, onSubmit }: ReviewModalProps) {
  const [status, setStatus] = useState<'approved' | 'requires_resubmission'>('approved')
  const [professionalDiagnosis, setProfessionalDiagnosis] = useState('')
  const [treatmentRecommendations, setTreatmentRecommendations] = useState('')
  const [agreesWithAi, setAgreesWithAi] = useState(false)
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'moderate' | 'high' | 'urgent'>('moderate')
  const [notes, setNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState<string[]>([])
  const [schedulePrompt, setSchedulePrompt] = useState('')
  const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([])
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{
    pdfGeneratedAt: string | null
    status: 'approved' | 'requires_resubmission'
    pdfUrl?: string | null
  } | null>(null)
  const router = useRouter()

  // Load AI analysis from Supabase directly for the selected case
  type DetectedCondition = { name: string; confidence: number; description?: string }
  interface AnalysisResult {
    ai_confidence_score?: number | string
    detected_conditions?: DetectedCondition[]
    severity?: string
    recommendations?: string
  }
  const [fetchedAnalysis, setFetchedAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadAnalysis = async () => {
      setIsAnalysisLoading(true)
      setAnalysisError(null)
      try {
        // Use server API which validates access and reads with service role
        const res = await fetch(`/api/cases/${caseData.id}`)
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.error || 'Failed to load case analysis')
        }
        const payload = await res.json()
        if (!isMounted) return

        const first = payload?.case?.analysis_results?.[0]
        if (first) {
          const normalized: AnalysisResult = {
            ai_confidence_score:
              typeof first.ai_confidence_score === 'string'
                ? parseFloat(first.ai_confidence_score as unknown as string)
                : first.ai_confidence_score,
            detected_conditions: (first.detected_conditions as any) || [],
            severity: first.severity,
            recommendations: first.recommendations,
          }
          setFetchedAnalysis(normalized)
        } else {
          setFetchedAnalysis(null)
        }
      } catch (err: any) {
        setAnalysisError(err?.message || 'Failed to load AI analysis')
      } finally {
        if (isMounted) setIsAnalysisLoading(false)
      }
    }

    loadAnalysis()
    return () => { isMounted = false }
  }, [caseData.id])

  const generateSchedule = async () => {
    if (!schedulePrompt.trim()) {
      setError('Please enter a prompt for schedule generation')
      return
    }

    setIsGeneratingSchedule(true)
    setError(null)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are a medical expert creating a comprehensive medication schedule. 

TASK: Generate a detailed, realistic medication schedule based on the following:

DOCTOR'S INSTRUCTIONS: "${schedulePrompt}"
PRESCRIBED MEDICATIONS: ${prescriptions.join(', ')}

REQUIREMENTS:
1. Create schedule entries extactly same days based on the doctor's instruction

OUTPUT FORMAT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "schedule_id": "001",
    "date": "2025-10-20",
    "time": "08:00",
    "medicine": "Hydrocortisone 1% cream",
    "tips": "Apply thin layer to affected area after cleansing",
    "completed": false
  },
  {
    "schedule_id": "002",
    "date": "2025-10-20",
    "time": "20:00", 
    "medicine": "Hydrocortisone 1% cream",
    "tips": "Apply before bedtime, avoid covering with tight clothing",
    "completed": false
  }
]

Generate multiple entries for each medication according to doctor's instruction covering the full treatment period. Start from tomorrow (${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}).`
            }
          ]
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate schedule')
      }

      const data = await response.json()
      
      // Try to parse the AI response as JSON
      try {
        let scheduleData
        let messageContent = data.message.trim()
        
        // Check if the response is wrapped in code blocks
        if (messageContent.startsWith('```json')) {
          messageContent = messageContent.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (messageContent.startsWith('```')) {
          messageContent = messageContent.replace(/```\s*/, '').replace(/```\s*$/, '')
        }
        
        // Try to find JSON array in the response
        const jsonMatch = messageContent.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          messageContent = jsonMatch[0]
        }
        
        scheduleData = JSON.parse(messageContent)
        
        if (Array.isArray(scheduleData) && scheduleData.length > 0) {
          // Validate that each item has the required fields
          const validSchedule = scheduleData.filter(item => 
            item.date && item.time && item.medicine && item.schedule_id
          ).map(item => ({
            schedule_id: item.schedule_id,
            date: item.date,
            time: item.time,
            medicine: item.medicine,
            tips: item.tips || "Follow doctor's instructions",
            completed: false
          }))
          
          if (validSchedule.length > 0) {
            setGeneratedSchedule(validSchedule)
          } else {
            throw new Error('No valid schedule items found')
          }
        } else {
          throw new Error('Invalid schedule format')
        }
      } catch (parseError) {
        console.error('Schedule parsing error:', parseError)
        console.log('Raw AI response:', data.message)
        setError('AI response could not be parsed. Please try again with a clearer prompt.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    } finally {
      setIsGeneratingSchedule(false)
    }
  }

  const handleScheduleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      generateSchedule()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!professionalDiagnosis.trim() || !treatmentRecommendations.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/dermatologist/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseData.id,
          status,
          professionalDiagnosis,
          treatmentRecommendations,
          agreesWithAi,
          notes,
          urgencyLevel,
          prescriptions,
          schedule: generatedSchedule,
        }),
      })

      let data: any = null
      try {
        data = await response.json()
      } catch {
        // Ignore JSON parse errors; handled below
      }

      if (!response.ok) {
        const message =
          (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
            ? data.error
            : 'Failed to submit review'
        throw new Error(message)
      }

        setSubmissionResult({
          pdfGeneratedAt:
            typeof data?.report?.pdfGeneratedAt === 'string'
              ? data.report.pdfGeneratedAt
              : null,
          status,
          pdfUrl: typeof data?.report?.pdfUrl === 'string' ? data.report.pdfUrl : null,
        })

        onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const analysis = caseData.analysis_results?.[0]
  const headerTitle = submissionResult ? 'Review Submitted' : 'Review Case'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">{headerTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {submissionResult ? (
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Review Submitted</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md">
                    A comprehensive PDF report has been generated and securely stored for the patient.
                  </p>
                  {submissionResult.pdfGeneratedAt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Generated on {new Date(submissionResult.pdfGeneratedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">Patient</p>
                    <p className="text-lg font-semibold">{caseData.patient?.name ?? 'Patient'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Status updated to <span className="font-semibold">{submissionResult.status.replace('_', ' ')}</span>.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-xs uppercase text-blue-700 dark:text-blue-300 font-semibold mb-2">Diagnosis Summary</p>
                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-line">
                      {professionalDiagnosis}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 px-6 py-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-xl border border-blue-200 dark:border-blue-700 text-center text-sm font-medium">
                    A secure PDF has been sent to the patient and is available in their case view.
                  </div>
                  {submissionResult.pdfUrl && (
                    <a
                      href={submissionResult.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors text-center"
                    >
                      Download PDF
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      router.refresh()
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back to Cases
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
              {(caseData.patient?.name?.trim() ?? '').length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
                      Patient
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {caseData.patient?.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Image Link */}
              <div className="w-full max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Case Image</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Click the link below to view the patient's uploaded image</p>
                  <a
                    href={caseData.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Image
                  </a>
                </div>
              </div>

              {/* Patient Description */}
              {caseData.patient_description && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Patient's Description
                  </h3>
                  <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
                    {caseData.patient_description}
                  </p>
                </div>
              )}

              {/* AI Analysis */}
              {analysis && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Analysis
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Confidence:</strong> {analysis.ai_confidence_score}%</p>
                    <p><strong>Severity:</strong> {analysis.severity}</p>
                    {analysis.detected_conditions?.length > 0 && (
                      <div>
                        <strong>Detected Conditions:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1">
                          {analysis.detected_conditions.map((condition, idx) => (
                            <li key={idx}>{condition.name} ({condition.confidence}%)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p><strong>AI Recommendations:</strong> {analysis.recommendations}</p>
                  </div>
                </div>
              )}

              {/* Review Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block font-semibold mb-2">Review Status *</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('approved')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                        status === 'approved'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('requires_resubmission')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                        status === 'requires_resubmission'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Requires Resubmission
                    </button>
                  </div>
                </div>

                {/* Professional Diagnosis */}
                <div>
                  <label className="block font-semibold mb-2">Professional Diagnosis *</label>
                  <textarea
                    value={professionalDiagnosis}
                    onChange={(e) => setProfessionalDiagnosis(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={4}
                    placeholder="Enter your professional diagnosis..."
                    required
                  />
                </div>

                {/* Treatment Recommendations */}
                <div>
                  <label className="block font-semibold mb-2">Treatment Recommendations *</label>
                  <textarea
                    value={treatmentRecommendations}
                    onChange={(e) => setTreatmentRecommendations(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={4}
                    placeholder="Enter treatment recommendations..."
                    required
                  />
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block font-semibold mb-2">Urgency Level</label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* AI Analysis (fetched) */}
                <div>
                  <label className="block font-semibold mb-2">AI Analysis</label>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800">
                    {isAnalysisLoading ? (
                      <div className="text-sm text-blue-800 dark:text-blue-200">Loading AI analysis...</div>
                    ) : analysisError ? (
                      <div className="text-sm text-red-700 dark:text-red-300">{analysisError}</div>
                    ) : fetchedAnalysis ? (
                      <div className="space-y-2 text-sm">
                        {typeof fetchedAnalysis.ai_confidence_score !== 'undefined' && (
                          <p><strong>Confidence:</strong> {Number(fetchedAnalysis.ai_confidence_score).toFixed(0)}%</p>
                        )}
                        {fetchedAnalysis.severity && (
                          <p><strong>Severity:</strong> {fetchedAnalysis.severity}</p>
                        )}
                        {fetchedAnalysis.detected_conditions && fetchedAnalysis.detected_conditions.length > 0 && (
                          <div>
                            <strong>Detected Conditions:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              {fetchedAnalysis.detected_conditions.map((condition, idx) => (
                                <li key={idx}>{condition.name} {typeof condition.confidence !== 'undefined' ? `(${condition.confidence}%)` : ''}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {fetchedAnalysis.recommendations && (
                          <p><strong>AI Recommendations:</strong> {fetchedAnalysis.recommendations}</p>
                        )}
                        {!fetchedAnalysis.ai_confidence_score && !fetchedAnalysis.severity && (!fetchedAnalysis.detected_conditions || fetchedAnalysis.detected_conditions.length === 0) && !fetchedAnalysis.recommendations && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">No AI analysis available for this case.</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-300">No AI analysis available for this case.</div>
                    )}
                  </div>
                </div>

                {/* Agrees with AI */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreesWithAi}
                      onChange={(e) => setAgreesWithAi(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">I agree with the AI analysis</span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-semibold mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Prescription Form */}
                <div>
                  <label className="block font-semibold mb-2">Add Prescriptions</label>
                  <div className="bg-white dark:bg-white rounded-xl border border-gray-300 dark:border-gray-300 p-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-black dark:text-black">
                      Select medication for this patient:
                    </label>
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !prescriptions.includes(e.target.value)) {
                            setPrescriptions([...prescriptions, e.target.value])
                          }
                        }}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-300 rounded-xl bg-white dark:bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-sm appearance-none cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                      >
                        <option value="" className="text-gray-500">
                          {SKIN_MEDICATIONS.filter(med => !prescriptions.includes(med)).length > 0 
                            ? "Choose a medication to prescribe..." 
                            : "All medications have been selected"}
                        </option>
                        {SKIN_MEDICATIONS.filter(med => !prescriptions.includes(med)).map((medication) => (
                          <option key={medication} value={medication} className="py-2">
                            {medication}
                          </option>
                        ))}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-black dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Enhanced Selected Medications Display */}
                    {prescriptions.length > 0 && (
                      <div className="mt-4 p-4 bg-white dark:bg-white rounded-xl border border-gray-300 dark:border-gray-300">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-black dark:text-black flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Selected Medications
                          </p>
                          <span className="px-2 py-1 bg-black text-white text-xs font-medium rounded-full">
                            {prescriptions.length}
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {prescriptions.map((prescription, index) => (
                            <div
                              key={prescription}
                              className="flex items-center justify-between p-3 bg-white dark:bg-white rounded-lg border border-gray-300 dark:border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-black dark:text-black font-semibold text-sm">
                                    {index + 1}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-black dark:text-black">
                                  {prescription}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPrescriptions(prescriptions.filter(p => p !== prescription))}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors group"
                                title="Remove medication"
                              >
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {prescriptions.length === 0 && (
                      <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No medications selected yet. Choose from the dropdown above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {/* Generate Schedule Form */}
                <div>
                  <label className="block font-semibold mb-2">Generate Medication Schedule</label>
                  <div className="bg-white dark:bg-white rounded-xl border border-gray-300 dark:border-gray-300 p-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-black dark:text-black">
                      Describe the treatment timeline and frequency (press Enter to generate):
                    </label>
                    <div className="relative">
                      <textarea
                        value={schedulePrompt}
                        onChange={(e) => setSchedulePrompt(e.target.value)}
                        onKeyDown={handleScheduleKeyDown}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-300 rounded-xl bg-white dark:bg-white focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                        rows={3}
                        placeholder="e.g., Apply cream twice daily for 2 weeks, then once daily for 1 week. Take oral medication with breakfast for 10 days..."
                        disabled={isGeneratingSchedule}
                      />
                      {isGeneratingSchedule && (
                        <div className="absolute inset-0 bg-white bg-opacity-50 dark:bg-white dark:bg-opacity-50 rounded-xl flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={generateSchedule}
                      disabled={!schedulePrompt.trim() || isGeneratingSchedule || prescriptions.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {isGeneratingSchedule ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Schedule
                        </>
                      )}
                    </button>
                    {prescriptions.length === 0 && (
                      <p className="text-sm text-black dark:text-black">
                        Please select at least one medication above to generate a schedule.
                      </p>
                    )}
                  </div>

                  {/* Generated Schedule Display */}
                  {generatedSchedule.length > 0 && (
                    <div className="mt-4 p-4 bg-white dark:bg-white rounded-lg border border-gray-300">
                      <h4 className="font-medium text-black dark:text-black mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Generated Schedule ({generatedSchedule.length} items)
                      </h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {Object.entries(
                          generatedSchedule.reduce((groups, item) => {
                            const date = item.date;
                            if (!groups[date]) groups[date] = [];
                            groups[date].push(item);
                            return groups;
                          }, {} as Record<string, Array<{
                            date: string;
                            time: string;
                            medicine: string;
                            tips?: string;
                            completed?: boolean;
                          }>>)
                        ).map(([date, items]) => (
                          <div key={date} className="space-y-2">
                            {/* Date header */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-black dark:text-black">
                                {new Date(date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-300"></div>
                            </div>
                            
                            {/* Timeline items for this date */}
                            <div className="space-y-2 ml-4">
                              {(items as Array<{
                                date: string;
                                time: string;
                                medicine: string;
                                tips?: string;
                                completed?: boolean;
                              }>).map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-white rounded-lg border border-gray-300 dark:border-gray-300">
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-black rounded-full"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm text-black dark:text-black font-medium">
                                        {item.time}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-black dark:text-black mb-1">
                                      {item.medicine}
                                    </p>
                                    {item.tips && (
                                      <p className="text-xs text-black dark:text-black">
                                        {item.tips}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </form>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FollowUpModalProps {
  caseData: Case
  onClose: () => void
  onSubmit: () => void
}

function FollowUpModal({ caseData, onClose, onSubmit }: FollowUpModalProps) {
  const [medicationImages, setMedicationImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch medication images for this case
  useEffect(() => {
    const fetchMedicationImages = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/dermatologist/cases/${caseData.id}/images`)
        if (!response.ok) {
          throw new Error('Failed to fetch medication images')
        }
        const data = await response.json()
        setMedicationImages(data.images || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images')
      } finally {
        setLoading(false)
      }
    }

    fetchMedicationImages()
  }, [caseData.id])

  const handleApprove = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Just mark as completed in UI without updating database status
      // You could optionally store completion in localStorage or state management
      localStorage.setItem(`case_${caseData.id}_completed`, 'true')
      
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">Follow Up - Medication Progress</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            {/* Patient Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
                  Patient
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {caseData.patient?.name || 'Patient'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Case ID: {caseData.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Medication Images */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Patient Medication Progress Images</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading images...</span>
                </div>
              ) : medicationImages.length > 0 ? (
                <div className="space-y-3">
                  {medicationImages.map((imageUrl, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Medication Progress Image {index + 1}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {imageUrl.split('/').pop()?.split('?')[0] || 'medication-image'}
                        </p>
                      </div>
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No medication images uploaded yet.</p>
                  <p className="text-sm mt-1">Patient hasn't started medication schedule.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
              >
                Rejected
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
