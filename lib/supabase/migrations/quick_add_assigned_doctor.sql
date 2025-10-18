-- Quick migration: Add assigned_doctor_id column to cases table
-- Run this in your Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_cases_assigned_doctor_id ON cases(assigned_doctor_id);

-- Note: Foreign key constraint is optional and can be added later
-- Uncomment below if you want to add it:
-- ALTER TABLE cases 
-- ADD CONSTRAINT fk_assigned_doctor 
-- FOREIGN KEY (assigned_doctor_id) 
-- REFERENCES doctors(id) 
-- ON DELETE SET NULL;

