-- Migration: Update dermatologist_reviews to reference doctors table
-- This allows proper joining of doctor information with reviews

-- Drop the old constraint
ALTER TABLE dermatologist_reviews 
DROP CONSTRAINT IF EXISTS fk_dermatologist;

-- Add new constraint referencing doctors table
-- Note: doctors.id should equal the user's auth.users.id for dermatologists
ALTER TABLE dermatologist_reviews 
ADD CONSTRAINT fk_dermatologist 
FOREIGN KEY (dermatologist_id) 
REFERENCES doctors(id) 
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dermatologist_reviews_dermatologist_id 
ON dermatologist_reviews(dermatologist_id);

