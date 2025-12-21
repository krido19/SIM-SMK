-- Add unique constraint to grades table to enable upsert functionality
ALTER TABLE public.grades
ADD CONSTRAINT grades_student_subject_semester_unique UNIQUE (student_id, subject_id, semester);
