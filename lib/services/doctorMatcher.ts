/**
 * AI-based Doctor Matching Service
 * Automatically matches patients to doctors based on detected skin conditions
 */

import { DetectedCondition } from '@/lib/types/case'
import { createAdminClient } from '@/lib/supabase/admin'

interface DoctorMatch {
  doctorId: string
  matchScore: number
  matchedConditions: string[]
}

/**
 * Calculate similarity between two strings using a simple keyword matching approach
 * Returns a score between 0 and 1
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim()
  const s1 = normalize(str1)
  const s2 = normalize(str2)

  // Exact match
  if (s1 === s2) return 1.0

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Word-level matching
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  
  let matchCount = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++
        break
      }
    }
  }

  const maxWords = Math.max(words1.length, words2.length)
  return matchCount / maxWords
}

/**
 * Extract condition keywords for matching
 */
function extractConditionKeywords(condition: string): string[] {
  const normalized = condition.toLowerCase()
  const keywords: string[] = [normalized]

  // Common condition mappings
  const conditionMap: Record<string, string[]> = {
    'acne': ['acne', 'pimple', 'breakout', 'comedone'],
    'eczema': ['eczema', 'dermatitis', 'atopic'],
    'psoriasis': ['psoriasis', 'plaque', 'scaling'],
    'rosacea': ['rosacea', 'redness', 'flushing'],
    'melanoma': ['melanoma', 'mole', 'skin cancer', 'pigmentation'],
    'fungal': ['fungal', 'tinea', 'ringworm', 'candida'],
    'allergy': ['allergy', 'allergic', 'hives', 'urticaria', 'contact dermatitis'],
    'vitiligo': ['vitiligo', 'depigmentation'],
    'wart': ['wart', 'verruca', 'hpv'],
    'bacterial': ['bacterial', 'infection', 'cellulitis', 'impetigo'],
  }

  // Add related keywords
  for (const [key, values] of Object.entries(conditionMap)) {
    if (values.some(v => normalized.includes(v))) {
      keywords.push(...values)
    }
  }

  return [...new Set(keywords)]
}

/**
 * Calculate match score between detected conditions and doctor specialty
 */
function calculateMatchScore(
  detectedConditions: DetectedCondition[],
  doctorSpecialty: string
): { score: number; matchedConditions: string[] } {
  if (!detectedConditions.length) {
    return { score: 0, matchedConditions: [] }
  }

  const specialtyKeywords = extractConditionKeywords(doctorSpecialty)
  let totalScore = 0
  const matchedConditions: string[] = []

  for (const condition of detectedConditions) {
    const conditionKeywords = extractConditionKeywords(condition.name)
    let maxSimilarity = 0

    // Check similarity with each specialty keyword
    for (const condKeyword of conditionKeywords) {
      for (const specKeyword of specialtyKeywords) {
        const similarity = calculateStringSimilarity(condKeyword, specKeyword)
        maxSimilarity = Math.max(maxSimilarity, similarity)
      }
    }

    // Weight by AI confidence
    const weightedScore = maxSimilarity * (condition.confidence / 100)
    totalScore += weightedScore

    if (maxSimilarity > 0.5) {
      matchedConditions.push(condition.name)
    }
  }

  // Normalize score
  const normalizedScore = totalScore / detectedConditions.length

  return { score: normalizedScore, matchedConditions }
}

/**
 * Find the best matching doctor for detected conditions
 */
export async function findBestMatchingDoctor(
  detectedConditions: DetectedCondition[]
): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    // Get all available doctors
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, name, specialty, experience, rating, category')
      .eq('available', true)

    if (error || !doctors || doctors.length === 0) {
      console.error('Failed to fetch doctors:', error)
      return null
    }

    // Calculate match scores for each doctor
    const matches: DoctorMatch[] = []

    for (const doctor of doctors) {
      const { score, matchedConditions } = calculateMatchScore(
        detectedConditions,
        doctor.specialty
      )

      // Boost score based on doctor rating (up to 10% boost)
      const ratingBoost = ((doctor.rating || 5.0) - 4.0) * 0.1
      const finalScore = score + (score * ratingBoost)

      matches.push({
        doctorId: doctor.id,
        matchScore: finalScore,
        matchedConditions,
      })
    }

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore)

    // Log matching results for debugging
    console.log('Doctor Matching Results:', {
      detectedConditions: detectedConditions.map(c => c.name),
      topMatches: matches.slice(0, 3).map(m => ({
        doctorId: m.doctorId,
        score: m.matchScore.toFixed(3),
        matched: m.matchedConditions,
      })),
    })

    // Return the best match if score is above threshold
    const bestMatch = matches[0]
    if (bestMatch && bestMatch.matchScore > 0.3) {
      return bestMatch.doctorId
    }

    // If no good match, return a general dermatologist or the highest-rated doctor
    const generalDerm = doctors.find(d => 
      d.category === 'Dermatology' || 
      d.specialty.toLowerCase().includes('general') ||
      d.specialty.toLowerCase().includes('dermatology')
    )
    
    if (generalDerm) {
      console.log('No specific match found, assigning general dermatologist')
      return generalDerm.id
    }

    // Last resort: highest-rated available doctor
    const highestRated = doctors.reduce((prev, current) => 
      (current.rating || 0) > (prev.rating || 0) ? current : prev
    )
    
    console.log('Assigning highest-rated doctor as fallback')
    return highestRated.id
  } catch (error) {
    console.error('Error in doctor matching:', error)
    return null
  }
}

/**
 * Assign a doctor to a case based on detected conditions
 */
export async function assignDoctorToCase(
  caseId: string,
  detectedConditions: DetectedCondition[]
): Promise<{ success: boolean; doctorId: string | null; error?: string }> {
  try {
    // Find best matching doctor
    const doctorId = await findBestMatchingDoctor(detectedConditions)

    if (!doctorId) {
      return {
        success: false,
        doctorId: null,
        error: 'No suitable doctor found',
      }
    }

    // Update case with assigned doctor
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('cases')
      .update({ assigned_doctor_id: doctorId })
      .eq('id', caseId)

    if (error) {
      console.error('Failed to assign doctor to case:', error)
      return {
        success: false,
        doctorId: null,
        error: 'Failed to update case',
      }
    }

    console.log(`Successfully assigned doctor ${doctorId} to case ${caseId}`)

    return {
      success: true,
      doctorId,
    }
  } catch (error) {
    console.error('Error assigning doctor to case:', error)
    return {
      success: false,
      doctorId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

