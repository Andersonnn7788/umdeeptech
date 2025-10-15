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

