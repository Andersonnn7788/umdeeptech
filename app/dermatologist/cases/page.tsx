'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Case {
  id: string
  status: string
  image_url: string
  thumbnail_url: string
  created_at: string
  submitted_for_review_at: string
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

export default function DermatologistCasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)

  useEffect(() => {
    fetchCases()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading cases..." />
      </div>
    )
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
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Dermatologist Review</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {cases.length} case{cases.length !== 1 ? 's' : ''} pending review
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {cases.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No Cases to Review</h2>
            <p className="text-gray-600 dark:text-gray-400">
              There are currently no cases submitted for review.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCase(caseItem)}
              >
                {/* Image */}
                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={caseItem.thumbnail_url || caseItem.image_url}
                    alt="Case image"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Case ID: {caseItem.id.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Submitted: {new Date(caseItem.submitted_for_review_at).toLocaleDateString()}
                      </p>
                    </div>
                    {caseItem.analysis_results?.[0] && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(caseItem.analysis_results[0].severity)}`}>
                        {caseItem.analysis_results[0].severity}
                      </span>
                    )}
                  </div>

                  {caseItem.analysis_results?.[0] && (
                    <>
                      <div className="mb-2">
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
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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

                  <button className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Review Case
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
            setSelectedCase(null)
            fetchCases()
          }}
        />
      )}
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const analysis = caseData.analysis_results?.[0]

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
            <h2 className="text-2xl font-bold">Review Case</h2>
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
            <div className="p-6 space-y-6">
              {/* Image */}
              <div className="relative w-full max-w-md mx-auto aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={caseData.image_url}
                  alt="Case image"
                  fill
                  className="object-cover"
                />
              </div>

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
          </div>
        </div>
      </div>
    </div>
  )
}

