-- Migration: Add RLS policies for doctor profile management
-- Run this script if you already have an existing database

-- Check and create policy for doctors to insert their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctors' AND policyname = 'Doctors can create own profile'
  ) THEN
    CREATE POLICY "Doctors can create own profile" ON doctors
      FOR INSERT WITH CHECK (auth.uid()::text = id::text);
  END IF;
END $$;

-- Check and create policy for doctors to update their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'doctors' AND policyname = 'Doctors can update own profile'
  ) THEN
    CREATE POLICY "Doctors can update own profile" ON doctors
      FOR UPDATE USING (auth.uid()::text = id::text);
  END IF;
END $$;

