-- Tambah kolom pangkat/golongan ke tabel teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS pangkat TEXT DEFAULT '';
