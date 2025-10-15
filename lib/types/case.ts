// TypeScript types for the skin analysis feature

export type CaseStatus =
  | 'uploaded'
  | 'analyzing'
  | 'analyzed'
  | 'submitted_for_review'
  | 'under_review'
  | 'approved'
  | 'requires_resubmission'
  | 'completed'

export type SeverityLevel = 'low' | 'moderate' | 'high' | 'urgent'

export interface DetectedCondition {
  name: string
  confidence: number
  description: string
}

export interface Case {
  id: string
  user_id: string
  status: CaseStatus
  image_url: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
  submitted_for_review_at?: string
  completed_at?: string
}

export interface AnalysisResult {
  id: string
  case_id: string
  ai_confidence_score: number
  detected_conditions: DetectedCondition[]
  severity: SeverityLevel
  recommendations: string
  analysis_metadata: Record<string, any>
  created_at: string
}

export interface DermatologistReview {
  id: string
  case_id: string
  dermatologist_id: string
  status: CaseStatus
  professional_diagnosis: string
  treatment_recommendations: string
  agrees_with_ai: boolean
  notes?: string
  urgency_level: SeverityLevel
  reviewed_at: string
}

export interface UserReport {
  id: string
  case_id: string
  report_data: {
    case_summary: string
    ai_analysis: AnalysisResult
    dermatologist_review?: DermatologistReview
    recommendations: string[]
    next_steps: string[]
    disclaimer: string
  }
  created_at: string
}

