-- ============================================================
-- MIGRATION: Tambah tabel ruangan & kolom ruangan di schedules
-- SIM SMK HAFIDZ — Jalankan di Supabase SQL Editor
-- ============================================================

-- ── 0. Jadikan start_time & end_time nullable ─────────────────
--    Import dari PDF tidak membawa info jam → kolom tidak boleh NOT NULL
ALTER TABLE public.schedules
    ALTER COLUMN start_time DROP NOT NULL,
    ALTER COLUMN end_time   DROP NOT NULL;

-- ── 1. Buat tabel rooms (Ruangan) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,          -- Contoh: "R.01", "Lab RPL 1", "Bengkel TKR"
    type        TEXT DEFAULT 'Kelas',          -- 'Kelas' | 'Lab' | 'Bengkel' | 'Aula' | 'Lainnya'
    capacity    INTEGER,                        -- Kapasitas siswa (opsional)
    floor       TEXT,                           -- Lantai / Gedung (opsional), contoh: "Lantai 1", "Gedung B"
    description TEXT,                           -- Keterangan tambahan
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2. Enable RLS ─────────────────────────────────────────────
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- ── 3. Policy: semua user bisa baca & admin bisa kelola ───────
CREATE POLICY "Enable all for everyone" ON public.rooms
    FOR ALL USING (true) WITH CHECK (true);

-- ── 4. Tambah kolom ruangan (TEXT) di tabel schedules ─────────
--    Disimpan sebagai teks (misal "R.01") untuk fleksibilitas
--    sehingga import PDF tidak perlu lookup room_id dulu.
ALTER TABLE public.schedules
    ADD COLUMN IF NOT EXISTS ruangan TEXT DEFAULT '';

-- ── 5. Seed data ruangan awal (sesuaikan dengan kondisi sekolah) ──
INSERT INTO public.rooms (name, type, capacity, floor) VALUES
    ('R.01',          'Kelas',   36, 'Lantai 1'),
    ('R.02',          'Kelas',   36, 'Lantai 1'),
    ('R.03',          'Kelas',   36, 'Lantai 1'),
    ('R.04',          'Kelas',   36, 'Lantai 1'),
    ('R.05',          'Kelas',   36, 'Lantai 2'),
    ('R.06',          'Kelas',   36, 'Lantai 2'),
    ('R.07',          'Kelas',   36, 'Lantai 2'),
    ('R.08',          'Kelas',   36, 'Lantai 2'),
    ('R.09',          'Kelas',   36, 'Lantai 3'),
    ('R.10',          'Kelas',   36, 'Lantai 3'),
    ('R.11',          'Kelas',   36, 'Lantai 3'),
    ('R.12',          'Kelas',   36, 'Lantai 3'),
    ('Lab RPL 1',     'Lab',     32, 'Lantai 1'),
    ('Lab RPL 2',     'Lab',     32, 'Lantai 1'),
    ('Lab TKJ',       'Lab',     32, 'Lantai 2'),
    ('Lab Bahasa',    'Lab',     30, 'Lantai 2'),
    ('Bengkel TKR',   'Bengkel', 24, 'Lantai 1'),
    ('Bengkel TSM',   'Bengkel', 24, 'Lantai 1'),
    ('Aula',          'Aula',   200, 'Lantai 1'),
    ('Perpustakaan',  'Lainnya', 50, 'Lantai 2')
ON CONFLICT (name) DO NOTHING;

-- ── 6. Verifikasi ─────────────────────────────────────────────
-- Cek tabel rooms berhasil dibuat:
-- SELECT * FROM public.rooms ORDER BY name;
--
-- Cek kolom ruangan ada di schedules:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'schedules' AND column_name = 'ruangan';
