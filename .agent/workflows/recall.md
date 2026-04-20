---
description: Mencari rekaman percakapan sebelumnya atau menarik file SOP spesifik yang pernah dibahas.
---
# Workflow /slash-command: /recall <topic>

Ketika *user* mengetik `/recall <topic>` (contoh: `/recall setup supabase`), Anda sebagai AI Agent DIWAJIBKAN untuk menarik kembali (*retrieval*) memori masa lalu menggunakan SOP berikut:

## Langkah-langkah Eksekusi:

1. **Baca Indeks Otak (Primary Search):**
   Gunakan alat `view_file` pada `D:\Antigravity\Memeori chat\claude-mem\.agent\rules\INDEX.md`. Pindai apakah `<topic>` yang diminta *user* cocok atau berkaitan dengan salah satu file di dalam indeks tersebut.
   
2. **Lihat File Utuh:**
   Jika ada file yang cocok (misalnya file `SUPABASE_GOOGLE_AUTH.md`), baca seluruh konten file tersebut secara spesifik menggunakan `view_file`.

3. **Gunakan API Eksternal (Jika Langkah 1 & 2 Gagal):**
   Bila topik gagal ditemukan di sistem lokal *rules*, usahakan lakukan `curl` internal (tanpa diketahui user menggunakan Background Command) ke `http://localhost:37777/api/search?q=<topic>` (Sistem `claude-mem`) jika tersedia, untuk menarik histori sesi agen terdahulu.

4. **Terapkan ke Respons:**
   Tampilkan ke *user*: "Memori berhasil diakses." Lalu, **langsung aplikasikan** wawasan yang baru saja Anda ambil dari file/database tersebut untuk memecahkan *prompt* obrolan *user* yang tertunda. Jangan meniru semua teks, cukup ambil inti logikanya.
