'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoCapture from '@/components/PhotoCapture'
import LoadingSpinner from '@/components/LoadingSpinner'
import { DetectedCondition } from '@/lib/types/case'
import { supabase } from '@/lib/supabase/client'
import BottomNavigation from '@/components/BottomNavigation'

type Step = 'upload' | 'analyzing' | 'results' | 'submitted'

interface AnalysisData {
  id: string
  ai_confidence_score: number
  detected_conditions: DetectedCondition[]
  severity: 'low' | 'moderate' | 'high' | 'urgent'
  recommendations: string
  analysis_metadata: {
    visible_characteristics: string
    disclaimer: string
  }
}

export default function SkinAnalysisPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [caseId, setCaseId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [patientDescription, setPatientDescription] = useState<string>('')

  const handlePhotoCapture = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Ensure we have an authenticated user (anonymous if needed)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        const { error: anonError } = await supabase.auth.signInAnonymously()
        if (anonError) throw anonError
      }

      // Upload image and create case
      const formData = new FormData()
      formData.append('image', file)
      formData.append('patientDescription', patientDescription)

      const uploadResponse = await fetch('/api/cases/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadData = await uploadResponse.json()
      const newCaseId = uploadData.case.id
      setCaseId(newCaseId)

      // Start analysis
      setStep('analyzing')

      const analyzeResponse = await fetch('/api/cases/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: newCaseId }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze image')
      }

      const analyzeData = await analyzeResponse.json()
      setAnalysis(analyzeData.analysis)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!caseId) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/cases/submit-for-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit for review')
      }

      setStep('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartOver = () => {
    setStep('upload')
    setCaseId(null)
    setAnalysis(null)
    setError(null)
    setPatientDescription('')
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

      return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Skin Analysis</h1>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step === 'upload' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
            }`}>
              {step === 'upload' ? '1' : '✓'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Upload</span>
          </div>

          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2">
            <div className={`h-full bg-blue-600 transition-all duration-500 ${
              ['analyzing', 'results', 'submitted'].includes(step) ? 'w-full' : 'w-0'
            }`} />
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step === 'analyzing' ? 'bg-blue-600 text-white' :
              ['results', 'submitted'].includes(step) ? 'bg-green-500 text-white' :
              'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}>
              {['results', 'submitted'].includes(step) ? '✓' : '2'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Analyze</span>
          </div>

          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2">
            <div className={`h-full bg-blue-600 transition-all duration-500 ${
              step === 'submitted' ? 'w-full' : 'w-0'
            }`} />
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step === 'submitted' ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}>
              {step === 'submitted' ? '✓' : '3'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Review</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Upload Skin Photo</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Take a clear photo of the affected skin area
              </p>
            </div>
            
            {/* Symptom Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <label htmlFor="symptom-description" className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                Describe Your Symptoms
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please describe your symptoms in detail. Include when they started, any pain or discomfort, changes you've noticed, etc.
              </p>
              <textarea
                id="symptom-description"
                value={patientDescription}
                onChange={(e) => setPatientDescription(e.target.value)}
                placeholder="Example: I noticed a red, itchy rash on my arm about 3 days ago..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                This information will be analyzed by AI and shared with the dermatologist for review.
              </p>
            </div>

            <PhotoCapture onPhotoCapture={handlePhotoCapture} disabled={isProcessing} />
          </div>
        )}

        {/* Step: Analyzing */}
        {step === 'analyzing' && (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" text="Analyzing your image..." />
            <p className="mt-6 text-gray-600 dark:text-gray-400">
              Our AI is examining the photo. This may take a moment.
            </p>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && analysis && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Analysis Results</h2>
                  <p className="text-gray-600 dark:text-gray-400">Preliminary AI Assessment</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold text-sm ${getSeverityColor(analysis.severity)}`}>
                  {analysis.severity.toUpperCase()}
                </div>
              </div>

              {/* Confidence Score */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Confidence Score</span>
                  <span className="font-bold">{analysis.ai_confidence_score}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.ai_confidence_score}%` }}
                  />
                </div>
              </div>

              {/* Detected Conditions */}
              {analysis.detected_conditions && analysis.detected_conditions.length > 0 && (
                <div className="mb-6">
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
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Observations</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {analysis.analysis_metadata.visible_characteristics}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {analysis.recommendations}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      Important Disclaimer
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      {analysis.analysis_metadata?.disclaimer || 
                       'This is not a medical diagnosis. Please consult a dermatologist for professional evaluation.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmitForReview}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit for Dermatologist Review
                  </>
                )}
              </button>
              <button
                onClick={handleStartOver}
                disabled={isProcessing}
                className="px-6 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Step: Submitted */}
        {step === 'submitted' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Submitted Successfully!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Your case has been submitted to our dermatologists for review. 
              You'll receive a detailed report once the review is complete.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => router.push(`/cases/${caseId}`)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                View Case Details
              </button>
              <button
                onClick={handleStartOver}
                className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold transition-colors"
              >
                New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  )
}

