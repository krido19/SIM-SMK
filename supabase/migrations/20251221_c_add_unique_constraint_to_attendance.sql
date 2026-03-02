ALTER TABLE attendance ADD CONSTRAINT unique_attendance_student_date UNIQUE (student_id, date);
