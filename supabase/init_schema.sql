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
