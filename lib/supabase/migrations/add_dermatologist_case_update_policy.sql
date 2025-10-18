-- Migration: Add UPDATE policy for dermatologists on cases table
-- This allows dermatologists/doctors to update case status to 'done' for follow-up completion
-- Also updates the SELECT policy to include 'doctor' role

-- Drop and recreate the SELECT policy to include 'doctor' role
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cases' AND policyname = 'Dermatologists can view submitted cases'
  ) THEN
    DROP POLICY "Dermatologists can view submitted cases" ON cases;
  END IF;
END $$;

CREATE POLICY "Dermatologists can view submitted cases"
  ON cases FOR SELECT
  USING (
    status IN ('submitted_for_review', 'under_review', 'approved', 'completed', 'analyzed')
    AND (auth.jwt() ->> 'role') IN ('dermatologist', 'doctor')
  );

-- Drop existing UPDATE policy if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cases' AND policyname = 'Dermatologists can update cases they review'
  ) THEN
    DROP POLICY "Dermatologists can update cases they review" ON cases;
  END IF;
END $$;

-- Create new UPDATE policy that allows both 'dermatologist' and 'doctor' roles
CREATE POLICY "Dermatologists can update cases they review" ON cases
  FOR UPDATE
  USING (
    status IN ('submitted_for_review', 'under_review', 'approved', 'completed')
    AND (auth.jwt() ->> 'role') IN ('dermatologist', 'doctor')
  );