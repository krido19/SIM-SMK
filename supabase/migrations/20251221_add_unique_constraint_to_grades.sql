-- Idempotent script to set the correct unique constraint for grades
-- This allows upsert based on (student, subject, semester)
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_id_subject_id_key;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_subject_semester_unique;
ALTER TABLE public.grades ADD CONSTRAINT grades_student_subject_semester_unique UNIQUE (student_id, subject_id, semester);


