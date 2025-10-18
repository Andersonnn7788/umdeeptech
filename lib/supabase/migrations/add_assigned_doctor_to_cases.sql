-- Migration: Add assigned_doctor_id to cases table
-- Run this script if you already have an existing database

-- Add assigned_doctor_id column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cases' 
        AND column_name = 'assigned_doctor_id'
    ) THEN
        ALTER TABLE cases ADD COLUMN assigned_doctor_id UUID;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_assigned_doctor' 
        AND table_name = 'cases'
    ) THEN
        ALTER TABLE cases 
        ADD CONSTRAINT fk_assigned_doctor 
        FOREIGN KEY (assigned_doctor_id) 
        REFERENCES doctors(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_assigned_doctor_id ON cases(assigned_doctor_id);

