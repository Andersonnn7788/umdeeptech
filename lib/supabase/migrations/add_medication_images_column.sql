-- Add medication_images column to dermatologist_reviews table
-- This will store an array of image URLs for medication proof photos

ALTER TABLE public.dermatologist_reviews 
ADD COLUMN IF NOT EXISTS medication_images JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.dermatologist_reviews.medication_images IS 'Array of medication proof image URLs uploaded by patients';

-- Create an index for better performance when querying medication images
CREATE INDEX IF NOT EXISTS idx_dermatologist_reviews_medication_images 
ON public.dermatologist_reviews USING GIN (medication_images);