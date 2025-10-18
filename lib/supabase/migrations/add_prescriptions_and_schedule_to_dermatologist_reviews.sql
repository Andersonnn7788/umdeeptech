-- Add prescriptions and schedule columns to dermatologist_reviews table

-- Add prescriptions column (array of text)
ALTER TABLE dermatologist_reviews 
ADD COLUMN IF NOT EXISTS prescriptions jsonb DEFAULT '[]'::jsonb;

-- Add schedule column (array of schedule objects)
ALTER TABLE dermatologist_reviews 
ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN dermatologist_reviews.prescriptions IS 'Array of prescribed medications as strings';
COMMENT ON COLUMN dermatologist_reviews.schedule IS 'Array of schedule objects with structure: {date, time, medicine, tips, image, completed}';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dermatologist_reviews_prescriptions 
ON dermatologist_reviews USING gin (prescriptions);

CREATE INDEX IF NOT EXISTS idx_dermatologist_reviews_schedule 
ON dermatologist_reviews USING gin (schedule);

-- Update RLS policies if needed (assuming existing policies cover new columns)
-- The existing RLS policies should automatically apply to the new columns

-- Example of what the data structure should look like:
/*
prescriptions: [
  "Hydrocortisone 1% cream",
  "Betamethasone cream",
  "Tretinoin gel 0.1%"
]

schedule: [
  {
    "date": "2025-10-20",
    "time": "09:00",
    "medicine": "Hydrocortisone 1% cream",
    "tips": "Apply thin layer to affected area",
    "image": null,
    "completed": false
  },
  {
    "date": "2025-10-20",
    "time": "21:00",
    "medicine": "Hydrocortisone 1% cream",
    "tips": "Apply thin layer to affected area",
    "image": null,
    "completed": false
  }
]
*/