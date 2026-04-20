-- Tambah kolom jurusan ke tabel classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS jurusan TEXT DEFAULT 'Lain';

-- Update kelas yang mungkin sudah ada berdasarkan nama kelas (opsional, sesuaikan)
-- Contoh: UPDATE public.classes SET jurusan = 'TKP' WHERE name ILIKE '%TKP%';
