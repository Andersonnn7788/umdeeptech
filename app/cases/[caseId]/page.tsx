'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import { WithAuth } from '@/components/WithAuth'
import { supabase } from '@/lib/supabase/client'

interface CaseData {
  id: string
  status: string
  image_url: string
  thumbnail_url: string
  patient_description?: string
  assigned_doctor_id?: string
  created_at: string
  submitted_for_review_at?: string
  completed_at?: string
  assigned_doctor?: Array<{
    id: string
    name: string
    specialty: string
    title: string
    experience: string
  }>
  analysis_results?: Array<{
    id: string
    ai_confidence_score: number
    detected_conditions: Array<{
      name: string
      confidence: number
      description: string
    }>
    severity: string
    recommendations: string
    analysis_metadata: {
      visible_characteristics?: string
      disclaimer?: string
    }
  }>
  dermatologist_reviews?: Array<{
    id: string
    status: string
    professional_diagnosis: string
    treatment_recommendations: string
    urgency_level: string
    agrees_with_ai?: boolean
    notes?: string
    reviewed_at: string
    dermatologist?: {
      id: string
      name: string
      specialty: string
      title: string
    }
  }>
  user_reports?: Array<{
    id: string
    report_data: {
      case_summary: string
      recommendations: string[]
      next_steps: string[]
      disclaimer: string
      pdf_url?: string
      pdf_generated_at?: string
    }
  }>
}

export default function CaseDetailsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchCase()
  }, [])

  const fetchCase = async () => {
    try {
      const response = await fetch(`/api/cases/${resolvedParams.caseId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch case')
      }
      const data = await response.json()
      setCaseData(data.case)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const reviewRecord = caseData?.dermatologist_reviews?.[0] ?? null
  const reviewId = reviewRecord && reviewRecord.status === 'approved' ? reviewRecord.id : null

  const fetchReportPdf = useCallback(async () => {
    if (!isMountedRef.current) {
      return
    }

    if (!reviewId) {
      setReportUrl(null)
      setReportError(null)
      setReportLoading(false)
      return
    }

    setReportLoading(true)
    setReportError(null)

    try {
      const { data, error } = await supabase.functions.invoke<{
        signed_url?: string
        path?: string
      }>('export-derm-report', {
        body: { review_id: reviewId },
      })

      if (error) {
        throw new Error(error.message ?? 'Failed to retrieve the PDF report.')
      }

      const signedUrl =
        data && typeof data.signed_url === 'string' ? data.signed_url : null

      if (!signedUrl) {
        throw new Error('The PDF report is not ready yet. Please try again soon.')
      }

      if (!isMountedRef.current) {
        return
      }

      setReportUrl(signedUrl)
      setReportError(null)
    } catch (err) {
      if (!isMountedRef.current) {
        return
      }

      setReportUrl(null)
      setReportError(err instanceof Error ? err.message : 'Unable to load the PDF report.')
    } finally {
      if (isMountedRef.current) {
        setReportLoading(false)
      }
    }
  }, [reviewId])

  useEffect(() => {
    fetchReportPdf()
  }, [fetchReportPdf])

  const handleRefreshReport = useCallback(() => {
    fetchReportPdf().catch(() => {
      // Error state already handled inside fetchReportPdf
    })
  }, [fetchReportPdf])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'analyzing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'analyzed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'submitted_for_review': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'under_review': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'requires_resubmission': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case 'moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading case details..." />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Case Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'The requested case could not be found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const analysis = caseData.analysis_results?.[0]
  const review = reviewRecord
  const report = caseData.user_reports?.[0]
  const aiPdfUrl = report?.report_data?.pdf_url ?? null
  const resolvedReportPdfUrl = reportUrl ?? aiPdfUrl
  const resolvedReportGeneratedAt = report?.report_data?.pdf_generated_at ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Case Details</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ID: {caseData.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(caseData.status)}`}>
            {formatStatus(caseData.status)}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Image Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Submitted Image</h2>
          <div className="relative w-full max-w-md mx-auto aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={caseData.image_url}
              alt="Case image"
              fill
              className="object-cover"
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
            Submitted on {new Date(caseData.created_at).toLocaleDateString()} at{' '}
            {new Date(caseData.created_at).toLocaleTimeString()}
          </p>
        </div>

        {/* Patient Description Section */}
        {caseData.patient_description && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Patient's Description</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 p-4 bg-purple-50 dark:bg-purple-950 rounded-xl whitespace-pre-line">
              {caseData.patient_description}
            </p>
          </div>
        )}

        {/* AI Analysis Section */}
        {analysis && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Analysis</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preliminary Assessment</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getSeverityColor(analysis.severity)}`}>
                {analysis.severity.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Confidence Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Confidence Score</span>
                  <span className="font-bold">{analysis.ai_confidence_score}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${analysis.ai_confidence_score}%` }}
                  />
                </div>
              </div>

              {/* Detected Conditions */}
              {analysis.detected_conditions && analysis.detected_conditions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Possible Conditions</h3>
                  <div className="space-y-3">
                    {analysis.detected_conditions.map((condition, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{condition.name}</h4>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {condition.confidence}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {condition.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visible Characteristics */}
              {analysis.analysis_metadata?.visible_characteristics && (
                <div>
                  <h3 className="font-semibold mb-2">Observations</h3>
                  <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    {analysis.analysis_metadata.visible_characteristics}
                  </p>
                </div>
              )}

              {/* AI Recommendations */}
              <div>
                <h3 className="font-semibold mb-2">AI Recommendations</h3>
                <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  {analysis.recommendations}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dermatologist Review Section */}
        {review && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {/* Doctor Info Header */}
            {review.dermatologist && (
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{review.dermatologist.name}</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {review.dermatologist.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Specialty: {review.dermatologist.specialty}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        Reviewed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Professional Review</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reviewed on {new Date(review.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getSeverityColor(review.urgency_level)}`}>
                {review.urgency_level.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Professional Diagnosis */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Professional Diagnosis
                </h3>
                <p className="text-gray-700 dark:text-gray-300 p-4 bg-green-50 dark:bg-green-950 rounded-xl">
                  {review.professional_diagnosis}
                </p>
              </div>

              {/* Treatment Recommendations */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Treatment Recommendations
                </h3>
                <p className="text-gray-700 dark:text-gray-300 p-4 bg-green-50 dark:bg-green-950 rounded-xl whitespace-pre-line">
                  {review.treatment_recommendations}
                </p>
              </div>

              {/* AI Agreement Badge */}
              {review.agrees_with_ai !== undefined && (
                <div className={`p-3 rounded-xl border ${
                  review.agrees_with_ai 
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                    : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {review.agrees_with_ai ? (
                      <>
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Doctor agrees with AI analysis
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          Doctor has a different assessment than AI
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {review.notes && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Additional Notes
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    {review.notes}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h10a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z" />
                  </svg>
                  Dermatology PDF Report
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A downloadable copy of your dermatologist&rsquo;s findings. The link remains active for seven days.
                </p>
                <div className="mt-3 space-y-3">
                  {reportLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <LoadingSpinner size="sm" />
                      Preparing secure link...
                    </div>
                  ) : reportError ? (
                    <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl">
                      <p className="text-sm text-red-700 dark:text-red-200">
                        {reportError}
                      </p>
                      <button
                        type="button"
                        onClick={handleRefreshReport}
                        disabled={reportLoading}
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-200 hover:underline disabled:opacity-60"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 9A7 7 0 0112 5c1.933 0 3.683.784 4.95 2.05M18.364 15A7 7 0 0112 19c-1.933 0-3.683-.784-4.95-2.05" />
                        </svg>
                        Try again
                      </button>
                    </div>
                  ) : reportUrl ? (
                    <>
                      <div
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-inner"
                        style={{ aspectRatio: '8.27 / 11.69' }}
                      >
                        <iframe
                          src={`${reportUrl}#view=FitH`}
                          title="Dermatology report PDF"
                          className="w-full h-full"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                          </svg>
                          Open in new tab
                        </a>
                        <button
                          type="button"
                          onClick={handleRefreshReport}
                          disabled={reportLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors disabled:opacity-60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 9A7 7 0 0112 5c1.933 0 3.683.784 4.95 2.05M18.364 15A7 7 0 0112 19c-1.933 0-3.683-.784-4.95-2.05" />
                          </svg>
                          Refresh link
                        </button>
                      </div>
                      {aiPdfUrl && (
                        <a
                          href={aiPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Download AI Analysis PDF
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      The PDF report will appear here once your dermatologist has completed their review.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Report Section */}
        {report && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Complete Report</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Summary and Next Steps</p>
              </div>
            </div>

            <div className="space-y-4">
              {(resolvedReportPdfUrl || resolvedReportGeneratedAt) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Official Review PDF</p>
                    {resolvedReportGeneratedAt && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Generated on {new Date(resolvedReportGeneratedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {resolvedReportPdfUrl && (
                    <a
                      href={resolvedReportPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                      </svg>
                      Download PDF
                    </a>
                  )}
                </div>
              )}

              {/* Case Summary */}
              <div>
                <h3 className="font-semibold mb-2">Case Summary</h3>
                <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  {report.report_data.case_summary}
                </p>
              </div>

              {/* Recommendations */}
              {report.report_data.recommendations && report.report_data.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Recommendations</h3>
                  <ul className="space-y-2">
                    {report.report_data.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {report.report_data.next_steps && report.report_data.next_steps.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Next Steps</h3>
                  <ol className="space-y-2">
                    {report.report_data.next_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      Important
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      {report.report_data.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Review Message */}
        {!review && caseData.status === 'submitted_for_review' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Review Pending</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your case is in the queue for dermatologist review.<br />
                We'll notify you once the review is complete.
              </p>
            </div>
            
            {/* Assigned Doctor Info */}
            {caseData.assigned_doctor?.[0] && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{caseData.assigned_doctor[0].name}</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {caseData.assigned_doctor[0].title}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Assigned
                      </span>
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong>Specialty:</strong> {caseData.assigned_doctor[0].specialty}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{caseData.assigned_doctor[0].experience}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 inline mr-1 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        AI matched based on your detected conditions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
