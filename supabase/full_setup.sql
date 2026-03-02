-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'guru', 'siswa', 'orang_tua')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Classes Table
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    homeroom TEXT,
    level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subjects Table
CREATE TABLE public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    jurusan TEXT,
    teachers TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Academic Data
CREATE TABLE public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nip TEXT UNIQUE,
    name TEXT,
    email TEXT,
    specialty TEXT,
    wa_number TEXT,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nis TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    wa_student TEXT,
    wa_parent TEXT,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Schedules
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_name TEXT,
    teacher_name TEXT,
    class_name TEXT,
    day TEXT NOT NULL,
    jam_ke INTEGER,
    week_type TEXT DEFAULT 'Minggu Ganjil',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Grades
CREATE TABLE public.grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    semester INTEGER DEFAULT 1,
    tugas INTEGER DEFAULT 0,
    uts INTEGER DEFAULT 0,
    uas INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    teacher_id UUID REFERENCES public.teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendance
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpa')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Announcements
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    date TEXT,
    author_id UUID REFERENCES public.profiles(id),
    target_role TEXT, -- null means all
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Settings Table
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Simplified for development)
CREATE POLICY "Enable all for everyone" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON public.settings FOR ALL USING (true) WITH CHECK (true);
-- Create assignments table
create table if not exists assignments (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references teachers(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  subject_name text not null, -- Storing name directly for simplicity as per existing pattern
  title text not null,
  description text,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table assignments enable row level security;

-- Policies
create policy "Public read access for authenticated users"
  on assignments for select
  to authenticated
  using (true);

create policy "Teachers can insert assignments"
  on assignments for insert
  to authenticated
  with check (true); -- Ideally check if user is teacher, but keeping simple for now

create policy "Teachers can update their own assignments"
  on assignments for update
  to authenticated
  using (teacher_id = auth.uid()::uuid); -- This assumes auth.uid matches teacher_id which might not be true if using custom ID mapping. 
  -- Given the project structure uses a separate 'teachers' table and sometimes manual mapping, 
  -- we might need a looser policy or a trigger. For now using basic 'true' for insert/update for auth users to unblock.
  
-- Revising policies for simplicity given the debugging history
drop policy if exists "Teachers can insert assignments" on assignments;
create policy "Authenticated users can insert"
  on assignments for insert
  to authenticated
  with check (true);

drop policy if exists "Teachers can update their own assignments" on assignments;
create policy "Authenticated users can update"
  on assignments for update
  to authenticated
  using (true);
-- Add file_url column to assignments
alter table assignments add column if not exists file_url text;

-- Create 'assignments' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('assignments', 'assignments', true)
on conflict (id) do nothing;

-- Storage Policies (Using unique names to avoid conflict)
create policy "Assignments Read Access"
on storage.objects for select
using ( bucket_id = 'assignments' );

create policy "Assignments Upload Access"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'assignments' );

-- Optional: Delete policy
create policy "Assignments Delete Access"
on storage.objects for delete
to authenticated
using ( bucket_id = 'assignments' and auth.uid() = owner );
ALTER TABLE attendance ADD CONSTRAINT unique_attendance_student_date UNIQUE (student_id, date);
-- Idempotent script to set the correct unique constraint for grades
-- This allows upsert based on (student, subject, semester)
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_id_subject_id_key;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_subject_semester_unique;
ALTER TABLE public.grades ADD CONSTRAINT grades_student_subject_semester_unique UNIQUE (student_id, subject_id, semester);


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
