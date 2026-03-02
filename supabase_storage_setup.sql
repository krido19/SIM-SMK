-- ============================================
-- SUPABASE SETUP LENGKAP - SIM SMK HAFIDZ
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query > Run
-- ============================================


-- ============================================
-- BAGIAN 1: BUAT TABEL ANNOUNCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    date TEXT,
    image_url TEXT,
    author_id UUID,
    target_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for everyone" ON public.announcements;
CREATE POLICY "Enable all for everyone" ON public.announcements
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- BAGIAN 2: BUAT TABEL ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID,
    class_id UUID,
    subject_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for everyone" ON public.assignments;
CREATE POLICY "Enable all for everyone" ON public.assignments
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- BAGIAN 3: BUAT STORAGE BUCKET
-- ============================================

-- Bucket announcements (foto pengumuman & logo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcements',
  'announcements',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket assignments (lampiran tugas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignments',
  'assignments',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- BAGIAN 4: STORAGE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public read announcements" ON storage.objects;
CREATE POLICY "Public read announcements" ON storage.objects
  FOR SELECT USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Allow upload announcements" ON storage.objects;
CREATE POLICY "Allow upload announcements" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Allow delete announcements" ON storage.objects;
CREATE POLICY "Allow delete announcements" ON storage.objects
  FOR DELETE USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Public read assignments" ON storage.objects;
CREATE POLICY "Public read assignments" ON storage.objects
  FOR SELECT USING (bucket_id = 'assignments');

DROP POLICY IF EXISTS "Allow upload assignments" ON storage.objects;
CREATE POLICY "Allow upload assignments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assignments');

DROP POLICY IF EXISTS "Allow delete assignments" ON storage.objects;
CREATE POLICY "Allow delete assignments" ON storage.objects
  FOR DELETE USING (bucket_id = 'assignments');


-- ============================================
-- SELESAI! Refresh halaman dan coba lagi.
-- ============================================
