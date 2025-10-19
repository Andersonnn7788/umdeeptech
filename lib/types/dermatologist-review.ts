// Types for dermatologist review prescriptions and schedule

export interface ScheduleItem {
  date: string // YYYY-MM-DD format
  time: string // HH:MM format
  medicine: string
  tips: string
  image: string | null // URL to uploaded image, null by default
  completed: boolean
}

export interface DermatologistReview {
  id: string
  case_id: string
  dermatologist_id: string
  status: 'approved' | 'requires_resubmission'
  professional_diagnosis: string
  treatment_recommendations: string
  agrees_with_ai: boolean
  notes?: string
  urgency_level: 'low' | 'moderate' | 'high' | 'urgent'
  prescriptions: string[] // Array of medication names
  schedule: ScheduleItem[] // Array of schedule items
  created_at: string
  updated_at: string
}

// Helper type for the schedule generation API
export interface ScheduleGenerationRequest {
  message: string
  prescriptions: string[]
  prompt: string
}

// Helper type for the review submission
export interface ReviewSubmissionData {
  caseId: string
  status: 'approved' | 'requires_resubmission'
  professionalDiagnosis: string
  treatmentRecommendations: string
  agreesWithAi: boolean
  notes?: string
  urgencyLevel: 'low' | 'moderate' | 'high' | 'urgent'
  prescriptions: string[]
  schedule: ScheduleItem[]
}