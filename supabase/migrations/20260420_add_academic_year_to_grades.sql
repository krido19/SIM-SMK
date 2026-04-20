-- Add academic_year column to grades table
-- This allows students to filter grades by specific school year (e.g. "2023/2024")
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2023/2024';

-- Update existing records to have a default academic year
-- Semester 1 = first half, Semester 2 = second half
UPDATE public.grades SET academic_year = '2023/2024' WHERE academic_year IS NULL;
