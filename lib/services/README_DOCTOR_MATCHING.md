# AI Doctor Matching System

## Overview

This system automatically matches patients to the most suitable doctors based on their detected skin conditions using AI-powered algorithms. When a patient submits their skin analysis case for review, the system analyzes the detected conditions and assigns the best-matching dermatologist.

## How It Works

### 1. Patient Submits Case for Review
When a patient completes their skin analysis and clicks "Submit for Review", the system:
- Retrieves the AI-detected conditions from the analysis
- Triggers the doctor matching algorithm
- Assigns the best-matched doctor to the case
- Displays the assigned doctor information to the patient

### 2. Matching Algorithm

The matching system uses a sophisticated algorithm that considers:

#### Condition Matching
- **Keyword Extraction**: Extracts keywords from both detected conditions and doctor specialties
- **Semantic Matching**: Maps related medical terms (e.g., "acne" matches with "pimple", "breakout", "comedone")
- **Similarity Scoring**: Calculates similarity between condition keywords and doctor specialties
- **Confidence Weighting**: Weights matches by the AI's confidence score for each detected condition

#### Doctor Selection Criteria
1. **Specialty Match**: Primary factor - how well the doctor's specialty aligns with detected conditions
2. **Rating Boost**: Doctors with higher ratings get a score boost (up to 10%)
3. **Fallback Logic**:
   - If no strong match found (score < 0.3), assign a general dermatologist
   - If no general dermatologist available, assign the highest-rated available doctor

### 3. Condition-Specialty Mappings

The system recognizes these common skin conditions and their variations:

| Condition | Related Keywords |
|-----------|-----------------|
| Acne | acne, pimple, breakout, comedone |
| Eczema | eczema, dermatitis, atopic |
| Psoriasis | psoriasis, plaque, scaling |
| Rosacea | rosacea, redness, flushing |
| Melanoma | melanoma, mole, skin cancer, pigmentation |
| Fungal | fungal, tinea, ringworm, candida |
| Allergy | allergy, allergic, hives, urticaria, contact dermatitis |
| Vitiligo | vitiligo, depigmentation |
| Wart | wart, verruca, hpv |
| Bacterial | bacterial, infection, cellulitis, impetigo |

## Database Schema

### Cases Table
```sql
ALTER TABLE cases ADD COLUMN assigned_doctor_id UUID;
ALTER TABLE cases ADD CONSTRAINT fk_assigned_doctor 
  FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
CREATE INDEX idx_cases_assigned_doctor_id ON cases(assigned_doctor_id);
```

## API Endpoints

### POST /api/cases/submit-for-review
Submits a case for dermatologist review and automatically assigns a doctor.

**Request:**
```json
{
  "caseId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "case": {
    "id": "uuid",
    "status": "submitted_for_review",
    "assigned_doctor_id": "doctor-uuid",
    "..."
  },
  "assignedDoctor": {
    "id": "doctor-uuid",
    "name": "Dr. John Doe",
    "specialty": "Acne, Eczema, Psoriasis",
    "title": "Senior Dermatologist",
    "experience": "15+ years experience"
  }
}
```

## Usage Example

### Programmatic Usage
```typescript
import { assignDoctorToCase, findBestMatchingDoctor } from '@/lib/services/doctorMatcher'

// Find best matching doctor for detected conditions
const detectedConditions = [
  { name: "Acne", confidence: 85, description: "..." },
  { name: "Inflammation", confidence: 70, description: "..." }
]

const doctorId = await findBestMatchingDoctor(detectedConditions)

// Or directly assign to a case
const result = await assignDoctorToCase(caseId, detectedConditions)
if (result.success) {
  console.log(`Assigned doctor: ${result.doctorId}`)
}
```

## Doctor Specialties Configuration

When creating doctor profiles, ensure specialties are clearly defined:

**Good Examples:**
- "Acne, Eczema, Rosacea"
- "Pediatric Dermatology, Atopic Dermatitis"
- "Skin Cancer, Melanoma, Mole Screening"
- "Allergy, Contact Dermatitis, Hives"

**Avoid:**
- Generic terms without specifics
- Overly broad categories
- Medical jargon without common terms

## Monitoring and Debugging

The system logs matching results to help track performance:

```typescript
// Example log output
Doctor Matching Results: {
  detectedConditions: ['Acne', 'Inflammation'],
  topMatches: [
    { doctorId: 'xxx', score: 0.87, matched: ['Acne'] },
    { doctorId: 'yyy', score: 0.65, matched: [] },
    { doctorId: 'zzz', score: 0.54, matched: [] }
  ]
}
```

## Future Enhancements

Potential improvements:
1. **Machine Learning**: Train on historical matching success data
2. **Doctor Availability**: Consider doctor workload and availability
3. **Patient Preferences**: Allow patients to specify preferences
4. **Geographic Matching**: Match based on location for in-person consultations
5. **Multilingual Support**: Match based on language preferences
6. **Condition Severity**: Prioritize urgent cases to experienced doctors

## Migration Guide

For existing databases, run the migration script:

```bash
# Execute the migration SQL
psql -d your_database < lib/supabase/migrations/add_assigned_doctor_to_cases.sql
```

Or run directly in Supabase SQL Editor:
```sql
-- See: lib/supabase/migrations/add_assigned_doctor_to_cases.sql
```

## Testing

To test the matching algorithm:

1. Create doctor profiles with specific specialties (e.g., "Acne, Eczema")
2. Submit a skin analysis case with detected conditions matching those specialties
3. Verify the correct doctor is assigned
4. Check the case details page shows the assigned doctor information

## Troubleshooting

### No Doctor Assigned
**Possible causes:**
- No doctors marked as `available: true`
- Database connection issues
- Matching algorithm returned null

**Solution:** Check logs for `Doctor matching failed` messages

### Wrong Doctor Assigned
**Possible causes:**
- Doctor specialties not well-defined
- Condition keywords not in mapping
- Low confidence scores

**Solution:** 
- Update doctor specialties to be more specific
- Add condition keywords to the mapping in `doctorMatcher.ts`
- Check the matching score in logs

### Performance Issues
If matching takes too long:
- Ensure database indexes are created (especially on `doctors.available`)
- Consider caching available doctors list
- Optimize the similarity calculation algorithm

