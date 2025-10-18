# Doctor Review System - Complete Guide

## Overview

This document explains how the doctor review system works, from submission to display.

## System Flow

```
Patient submits case → AI Analysis → Case submitted for review
                                              ↓
                                     Assigned to doctor
                                              ↓
                                   Doctor reviews case
                                              ↓
                              Review stored in database
                                              ↓
                                Patient views review
```

## Database Schema

### dermatologist_reviews Table

```sql
CREATE TABLE dermatologist_reviews (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL,
  dermatologist_id UUID NOT NULL,  -- References doctors(id)
  status case_status NOT NULL,      -- 'approved' or 'requires_resubmission'
  professional_diagnosis TEXT,
  treatment_recommendations TEXT,
  agrees_with_ai BOOLEAN,
  notes TEXT,
  urgency_level severity_level,    -- 'low', 'moderate', 'high', 'urgent'
  reviewed_at TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (dermatologist_id) REFERENCES doctors(id)
);
```

## 1. Doctor Submits Review

### Endpoint: `POST /api/dermatologist/review`

**Request Body:**
```json
{
  "caseId": "uuid",
  "status": "approved",
  "professionalDiagnosis": "Patient has moderate acne vulgaris...",
  "treatmentRecommendations": "1. Use benzoyl peroxide cleanser...",
  "agreesWithAi": true,
  "notes": "Follow-up in 4 weeks",
  "urgencyLevel": "moderate"
}
```

**What Happens:**
1. ✅ Validates authentication (must be a logged-in doctor)
2. ✅ Validates required fields
3. ✅ Creates review record in `dermatologist_reviews` table
4. ✅ Updates case status
5. ✅ If status is 'approved':
   - Creates user report
   - Marks case as 'completed'
   - Sets completed_at timestamp

**Response:**
```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "case_id": "uuid",
    "dermatologist_id": "uuid",
    "status": "approved",
    "professional_diagnosis": "...",
    "treatment_recommendations": "...",
    "agrees_with_ai": true,
    "notes": "...",
    "urgency_level": "moderate",
    "reviewed_at": "2025-01-18T10:30:00Z"
  }
}
```

## 2. Fetching Case with Review

### Endpoint: `GET /api/cases/[caseId]`

**Query Structure:**
```sql
SELECT 
  cases.*,
  analysis_results.*,
  dermatologist_reviews.*,
  dermatologist:doctors!dermatologist_id (
    id,
    name,
    specialty,
    title
  ),
  user_reports.*,
  assigned_doctor:doctors!assigned_doctor_id (
    id,
    name,
    specialty,
    title,
    experience
  )
FROM cases
WHERE id = ? AND user_id = ?
```

**Response:**
```json
{
  "success": true,
  "case": {
    "id": "uuid",
    "status": "completed",
    "image_url": "https://...",
    "analysis_results": [...],
    "dermatologist_reviews": [{
      "id": "uuid",
      "professional_diagnosis": "...",
      "treatment_recommendations": "...",
      "urgency_level": "moderate",
      "agrees_with_ai": true,
      "notes": "...",
      "reviewed_at": "2025-01-18T10:30:00Z",
      "dermatologist": {
        "id": "uuid",
        "name": "Dr. Sarah Johnson",
        "specialty": "Acne, Eczema, Rosacea",
        "title": "Senior Dermatologist"
      }
    }],
    "assigned_doctor": [{...}]
  }
}
```

## 3. Displaying Review in Patient View

### Location: `app/cases/[caseId]/page.tsx`

**UI Components:**

1. **Doctor Information Header**
   - Doctor avatar (gradient circle)
   - Doctor name and title
   - Specialty
   - "Reviewed" badge

2. **Professional Review Section**
   - Review timestamp
   - Urgency level badge
   
3. **Review Content**
   - **Professional Diagnosis** - Doctor's assessment
   - **Treatment Recommendations** - Step-by-step treatment plan
   - **AI Agreement Indicator** - Shows if doctor agrees with AI
   - **Additional Notes** (if provided) - Extra comments

### Visual Features

- ✅ Green-themed cards for approved reviews
- ✅ Icons for each section
- ✅ Urgency level color coding
- ✅ AI agreement badge (blue if agrees, orange if different)
- ✅ Responsive design
- ✅ Dark mode support

## Migration Required

If you have an existing database, run this migration:

```sql
-- File: lib/supabase/migrations/update_dermatologist_reviews_fk.sql

ALTER TABLE dermatologist_reviews 
DROP CONSTRAINT IF EXISTS fk_dermatologist;

ALTER TABLE dermatologist_reviews 
ADD CONSTRAINT fk_dermatologist 
FOREIGN KEY (dermatologist_id) 
REFERENCES doctors(id) 
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_dermatologist_reviews_dermatologist_id 
ON dermatologist_reviews(dermatologist_id);
```

## Testing the Flow

### Step 1: Doctor Reviews a Case
1. Go to `/dermatologist/cases`
2. Click on a case
3. Fill in the review form:
   - Professional Diagnosis
   - Treatment Recommendations
   - Select urgency level
   - Check if you agree with AI
   - Add optional notes
4. Click "Submit Review"

### Step 2: Patient Views Review
1. Patient goes to their case list
2. Clicks "View Case Details"
3. Sees complete review with:
   - Doctor who reviewed it
   - Professional diagnosis
   - Treatment recommendations
   - All additional information

## Data Storage

All review fields are stored in Supabase:
- ✅ `professional_diagnosis` → TEXT
- ✅ `treatment_recommendations` → TEXT
- ✅ `agrees_with_ai` → BOOLEAN
- ✅ `notes` → TEXT (optional)
- ✅ `urgency_level` → ENUM ('low', 'moderate', 'high', 'urgent')
- ✅ `reviewed_at` → TIMESTAMP (auto-generated)
- ✅ `dermatologist_id` → UUID (links to doctor)

## Case Status Flow

1. **uploaded** → Initial upload
2. **analyzing** → AI processing
3. **analyzed** → AI complete
4. **submitted_for_review** → Awaiting doctor
5. **approved** / **requires_resubmission** → Doctor reviewed
6. **completed** → Final state (if approved)

## Important Notes

1. **Doctor ID Requirement**: The `dermatologist_id` must match a valid entry in the `doctors` table
2. **Foreign Key**: Changed from `auth.users(id)` to `doctors(id)` for proper joining
3. **Status Updates**: Case status is automatically updated when review is submitted
4. **User Reports**: Auto-created for approved cases
5. **Timestamps**: Review timestamp is auto-generated

## Troubleshooting

### Review Not Showing
- Check if `dermatologist_reviews` record was created
- Verify foreign key relationship is correct
- Ensure doctor profile exists in `doctors` table
- Check if join query is returning doctor info

### Can't Submit Review
- Verify doctor is authenticated
- Check all required fields are filled
- Ensure case exists and is in correct status
- Review database logs for errors

## Future Enhancements

Possible additions:
- Review editing capability
- Multiple reviews per case
- Review notifications
- Review rating system
- Review templates
- Image annotations in reviews

