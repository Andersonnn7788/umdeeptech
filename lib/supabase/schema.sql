-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for case status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
    CREATE TYPE case_status AS ENUM (
  'uploaded',
  'analyzing',
  'analyzed',
  'submitted_for_review',
  'under_review',
  'approved',
  'requires_resubmission',
  'completed'
    );
  END IF;
END $$;

-- Create enum for severity levels
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM (
  'low',
  'moderate',
  'high',
  'urgent'
    );
  END IF;
END $$;

-- If an old "cases" table exists with a non-UUID id, rename it to preserve data
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cases'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.cases RENAME TO cases_legacy;
  END IF;
END $$;

-- Cases table - stores each skin analysis case
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  status case_status DEFAULT 'uploaded',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  patient_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_for_review_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- AI Analysis Results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL,
  ai_confidence_score DECIMAL(5,2),
  detected_conditions JSONB DEFAULT '[]'::jsonb,
  severity severity_level,
  recommendations TEXT,
  analysis_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT unique_case_analysis UNIQUE (case_id)
);

-- Dermatologist Reviews table
CREATE TABLE IF NOT EXISTS dermatologist_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL,
  dermatologist_id UUID NOT NULL,
  status case_status NOT NULL,
  professional_diagnosis TEXT,
  treatment_recommendations TEXT,
  agrees_with_ai BOOLEAN,
  notes TEXT,
  urgency_level severity_level,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_case_review FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_dermatologist FOREIGN KEY (dermatologist_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User Reports table - final reports delivered to users
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_case_report FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT unique_case_report UNIQUE (case_id)
);

-- Indexes for better query performance
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_analysis_results_case_id ON analysis_results(case_id);
CREATE INDEX idx_dermatologist_reviews_case_id ON dermatologist_reviews(case_id);
CREATE INDEX idx_dermatologist_reviews_dermatologist_id ON dermatologist_reviews(dermatologist_id);
CREATE INDEX idx_user_reports_case_id ON user_reports(case_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dermatologist_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Cases policies
CREATE POLICY "Users can view their own cases"
  ON cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases"
  ON cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON cases FOR UPDATE
  USING (auth.uid() = user_id);

-- Re-create dermatologist SELECT policy without referencing auth.users
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
    status IN ('submitted_for_review', 'under_review', 'approved', 'completed')
    AND (auth.jwt() ->> 'role') = 'dermatologist'
  );

-- Analysis results policies
CREATE POLICY "Users can view analysis for their cases"
  ON analysis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = analysis_results.case_id
      AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert analysis results"
  ON analysis_results FOR INSERT
  WITH CHECK (true);

-- Re-create dermatologist analysis SELECT policy using JWT claim
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analysis_results' AND policyname = 'Dermatologists can view analysis results'
  ) THEN
    DROP POLICY "Dermatologists can view analysis results" ON analysis_results;
  END IF;
END $$;

CREATE POLICY "Dermatologists can view analysis results"
  ON analysis_results FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'dermatologist');

-- Dermatologist reviews policies
CREATE POLICY "Dermatologists can insert reviews"
  ON dermatologist_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = dermatologist_id
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'dermatologist'
    )
  );

CREATE POLICY "Dermatologists can view their reviews"
  ON dermatologist_reviews FOR SELECT
  USING (auth.uid() = dermatologist_id);

CREATE POLICY "Users can view reviews for their cases"
  ON dermatologist_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = dermatologist_reviews.case_id
      AND cases.user_id = auth.uid()
    )
  );

-- User reports policies
CREATE POLICY "Users can view their own reports"
  ON user_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = user_reports.case_id
      AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert reports"
  ON user_reports FOR INSERT
  WITH CHECK (true);

-- Storage bucket for skin images (public so images can be rendered by the browser)
INSERT INTO storage.buckets (id, name, public)
VALUES ('skin-images', 'skin-images', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Storage policies
-- Idempotent: Users can upload their own images
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own images'
  ) THEN
    DROP POLICY "Users can upload their own images" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'skin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Idempotent: Users can view their own images
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own images'
  ) THEN
    DROP POLICY "Users can view their own images" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Users can view their own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'skin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Re-create dermatologist storage SELECT policy using JWT claim
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Dermatologists can view all images'
  ) THEN
    DROP POLICY "Dermatologists can view all images" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Dermatologists can view all images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'skin-images'
    AND (auth.jwt() ->> 'role') = 'dermatologist'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- APPOINTMENT SYSTEM TABLES
-- ==========================================

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    location VARCHAR(255),
    experience TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    avatar TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Medical', 'Surgical', 'Pediatric', 'Allergy', 'Dermatology')),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    avatar TEXT,
    role VARCHAR(50) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'pending')),
    notes TEXT,
    calendar_event_id TEXT, -- Google Calendar event ID for integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no double booking for same doctor at same time
    UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Add calendar_event_id column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' 
                   AND column_name = 'calendar_event_id') THEN
        ALTER TABLE appointments ADD COLUMN calendar_event_id TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_doctors_category ON doctors(category);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(available);

-- Create triggers for updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample doctors
INSERT INTO doctors (name, specialty, title, location, experience, rating, avatar, category) VALUES
('Dr. Rodger Struck', 'General Dentist', 'Senior Dentist', 'City Medical Center', '10+ years experience', 4.8, '/caring-doctor.png', 'Medical'),
('Dr. Kathy Pacheco', 'Heart Surgeon', 'Senior Cardiologist and Surgeon', 'London Heart Hospital', '15+ years experience', 4.8, '/caring-doctor.png', 'Surgical'),
('Dr. Lorri Worf', 'General Dentist', 'General Practitioner', 'Downtown Clinic', '8+ years experience', 4.8, '/caring-doctor.png', 'Medical'),
('Dr. Chris Glasser', 'Heart Surgeon', 'Cardiovascular Surgeon', 'London Heart Hospital', '12+ years experience', 4.8, '/caring-doctor.png', 'Surgical'),
('Dr. Kenneth Allen', 'Pediatrician', 'Child Specialist', 'Children''s Medical Center', '15+ years experience', 4.8, '/caring-doctor.png', 'Pediatric'),
('Dr. Sarah Mitchell', 'Allergy Specialist', 'Immunologist', 'Allergy Care Center', '10+ years experience', 4.9, '/caring-doctor.png', 'Allergy'),
('Dr. Ali Uzair', 'Cardiologist', 'Senior Cardiologist and Surgeon', 'Majeed Memorial Hospital, Karachi', '15+ years experience in cardiovascular surgery', 4.9, '/caring-doctor.png', 'Medical'),
('Dr. Padma Jignesh', 'Orthopedic Surgeon', 'Orthopedic Specialist', 'Bone & Joint Hospital', '12+ years experience', 4.7, '/caring-doctor.png', 'Surgical'),
('Dr. Aaron Leigh', 'Dermatologist', 'Skin Specialist', 'Skin Care Clinic', '8+ years experience', 4.8, '/caring-doctor.png', 'Dermatology');

-- Insert sample patient (you can modify this)
INSERT INTO patients (id, name, email, phone) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'John Doe', 'john.doe@example.com', '+1234567890')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) for appointment tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow read access to doctors for all users
CREATE POLICY "Doctors are viewable by everyone" ON doctors
    FOR SELECT USING (true);

-- Allow doctors to insert their own profile
CREATE POLICY "Doctors can create own profile" ON doctors
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow doctors to update their own profile
CREATE POLICY "Doctors can update own profile" ON doctors
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow patients to see their own data
CREATE POLICY "Patients can view own data" ON patients
    FOR SELECT USING (auth.uid()::text = id::text OR id::text = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

-- Allow users to update their own patient data
CREATE POLICY "Users can update own patient data" ON patients
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow patients to see their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = patient_id::text);

-- Allow users to create appointments for themselves
CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = patient_id::text);

-- Allow users to update their own appointments
CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE USING (auth.uid()::text = patient_id::text);

-- Allow users to delete their own appointments
CREATE POLICY "Users can delete own appointments" ON appointments
    FOR DELETE USING (auth.uid()::text = patient_id::text);

-- For development: Allow anonymous users to create appointments with the sample patient
CREATE POLICY "Anonymous users can create sample appointments" ON appointments
    FOR INSERT WITH CHECK (
        patient_id::text = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
        OR auth.uid() IS NOT NULL
    );

-- Add role column to existing patients table if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE patients ADD COLUMN role VARCHAR(50) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor'));
    END IF;
END $$;

