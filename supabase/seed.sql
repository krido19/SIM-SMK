-- Only truncate tables if they exist to prevent errors during reset/seed on fresh databases
DO $$ 
BEGIN
    -- Disable triggers/constraints for silent truncate
    SET session_replication_role = 'replica';
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings') THEN TRUNCATE TABLE public.settings CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN TRUNCATE TABLE public.announcements CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN TRUNCATE TABLE public.attendance CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grades') THEN TRUNCATE TABLE public.grades CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') THEN TRUNCATE TABLE public.schedules CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN TRUNCATE TABLE public.assignments CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN TRUNCATE TABLE public.students CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN TRUNCATE TABLE public.teachers CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subjects') THEN TRUNCATE TABLE public.subjects CASCADE; END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN TRUNCATE TABLE public.classes CASCADE; END IF;

    SET session_replication_role = 'origin';
END $$;

-- Note: We do not need to seed auth.users or profiles because the Login.jsx handles authentication
-- by checking the 'email/nip' in 'teachers' table and 'nis' in 'students' table directly.

-- 1. Insert Settings
INSERT INTO public.settings (key, value) VALUES
  ('school_name', 'SIM SMK HAFIDZ'),
  ('school_logo', '');

-- 2. Insert Classes
INSERT INTO public.classes (id, name, homeroom, level) VALUES
  ('11111111-0000-0000-0000-000000000001', 'X RPL 1', 'Budi Santoso', '10'),
  ('11111111-0000-0000-0000-000000000002', 'XI RPL 1', 'Siti Aminah', '11'),
  ('11111111-0000-0000-0000-000000000003', 'XII RPL 1', 'Ahmad Rizal', '12');

-- 3. Insert Subjects
INSERT INTO public.subjects (id, name, kkm, jurusan, teachers, color) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Pemrograman Web', 75, 'RPL', 'Budi Santoso', '#4F46E5'),
  ('22222222-0000-0000-0000-000000000002', 'Basis Data', 75, 'RPL', 'Siti Aminah', '#059669'),
  ('22222222-0000-0000-0000-000000000003', 'Matematika', 70, 'Umum', 'Ahmad Rizal', '#DC2626');

-- 4. Insert Teachers (Password via Login.jsx: 'guru123' or NIP or exactly what's before @ in email)
INSERT INTO public.teachers (id, nip, name, email, specialty, wa_number, status) VALUES
  ('33333333-0000-0000-0000-000000000001', '198001012005011001', 'Budi Santoso', 'budi@school.id', 'Rekayasa Perangkat Lunak', '081234567890', 'Aktif'),
  ('33333333-0000-0000-0000-000000000002', '198202022006022002', 'Siti Aminah', 'siti@school.id', 'Basis Data', '081234567891', 'Aktif'),
  ('33333333-0000-0000-0000-000000000003', '197503032000031003', 'Ahmad Rizal', 'ahmad@school.id', 'Matematika', '081234567892', 'Aktif');

-- 5. Insert Students (Password via Login.jsx: 'siswa123' or NIS)
INSERT INTO public.students (id, nis, full_name, email, class_id, wa_student, wa_parent, status) VALUES
  -- Class X RPL 1
  ('44444444-0000-0000-0000-000000000001', '23241001', 'Andi Pratama', 'andi@student.id', '11111111-0000-0000-0000-000000000001', '085111111111', '085222222221', 'Aktif'),
  ('44444444-0000-0000-0000-000000000002', '23241002', 'Bunga Citra', 'bunga@student.id', '11111111-0000-0000-0000-000000000001', '085111111112', '085222222222', 'Aktif'),
  -- Class XI RPL 1
  ('44444444-0000-0000-0000-000000000003', '22231001', 'Cipto Mangunkusumo', 'cipto@student.id', '11111111-0000-0000-0000-000000000002', '085111111113', '085222222223', 'Aktif'),
  ('44444444-0000-0000-0000-000000000004', '22231002', 'Dewi Sartika', 'dewi@student.id', '11111111-0000-0000-0000-000000000002', '085111111114', '085222222224', 'Aktif');

-- 6. Insert Schedules
INSERT INTO public.schedules (id, class_id, subject_id, teacher_id, subject_name, teacher_name, class_name, day, jam_ke, start_time, end_time) VALUES
  -- Monday
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Pemrograman Web', 'Budi Santoso', 'X RPL 1', 'Senin', 1, '07:00:00', '08:30:00'),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', 'Matematika', 'Ahmad Rizal', 'X RPL 1', 'Senin', 2, '08:30:00', '10:00:00'),
  -- Tuesday
  ('55555555-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'Basis Data', 'Siti Aminah', 'XI RPL 1', 'Selasa', 1, '07:00:00', '09:00:00');

-- 7. Insert Grades
INSERT INTO public.grades (student_id, subject_id, teacher_id, semester, tugas, uts, uas, score) VALUES
  -- Andi (X RPL 1)
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 1, 85, 80, 88, 84),
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', 1, 78, 85, 80, 81),
  -- Bunga (X RPL 1)
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 1, 90, 88, 92, 90);

-- 8. Insert Attendance
INSERT INTO public.attendance (student_id, date, status, notes) VALUES
  -- Andi
  ('44444444-0000-0000-0000-000000000001', CURRENT_DATE, 'Hadir', 'Tepat waktu'),
  ('44444444-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'Hadir', ''),
  -- Bunga
  ('44444444-0000-0000-0000-000000000002', CURRENT_DATE, 'Hadir', ''),
  ('44444444-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '1 day', 'Sakit', 'Surat dokter ada'),
  -- Cipto
  ('44444444-0000-0000-0000-000000000003', CURRENT_DATE, 'Alpa', 'Tanpa Keterangan');

-- 9. Insert Assignments
INSERT INTO public.assignments (teacher_id, class_id, subject_name, title, description, due_date) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Pemrograman Web', 'Tugas HTML Dasar', 'Buat halaman profil sederhana.', CURRENT_DATE + INTERVAL '2 days'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Basis Data', 'Desain ERD', 'Desain ERD untuk sistem perpustakaan.', CURRENT_DATE + INTERVAL '5 days');

-- 10. Insert Announcements
INSERT INTO public.announcements (title, content, category, date, target_role) VALUES
  ('Selamat Datang di Semester Baru', 'Mari kita mulai semester ini dengan semangat baru.', 'Akademik', to_char(CURRENT_DATE, 'YYYY-MM-DD'), NULL),
  ('Pengisian Nilai UTS', 'Diingatkan kepada seluruh guru untuk segera mengisi nilai UTS.', 'Sistem', to_char(CURRENT_DATE, 'YYYY-MM-DD'), 'guru');
