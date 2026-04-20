---
description: Otomatis merangkum, menyimpan solusi, dan mencatat memori dari obrolan saat ini untuk dipelajari di masa depan.
---
# Workflow /slash-command: /save-memory

Ketika *user* mengetik perintah `/save-memory` di akhir percakapan, Anda sebagai AI Agent DIWAJIBKAN untuk menjalankan langkah-langkah *post-mortem* berikut:

## Langkah-langkah Eksekusi (Harus Dijalankan Secara Berurutan)

1. **Analisis Konteks Percakapan:** 
   Pindai obrolan terakhir untuk memahami inti masalah, keputusan struktur yang dibuat, dan kode solusi yang berhasil (hindari mencatat percobaan yang gagal).

2. **Buat Ringkasan SOP / File md:**
   Gunakan alat `write_to_file` untuk membuat file *markdown* (.md) baru di folder `.agent/rules/`. 
   Nama file harus deskriptif (contoh: `konfigurasi_tailwind_custom.md`).
   Isi file tersebut harus sangat terstruktur dan ringkas:
   - **Tujuan:** Apa masalah utamanya.
   - **Solusi Utama:** *Snippet array/function* yang paling penting.
   - **Cara Pasang / Standar Baru:** Standar prosedur untuk agen di masa depan.

3. **Perbarui `INDEX.md`:** 
   Segera manipulasi file `.agent/rules/INDEX.md` menggunakan `multi_replace_file_content` atau edit secara manual. Tambahkan baris baru untuk mendeskripsikan *skill file* yang baru saja Anda buat di atas ke daftar `Available Rules`. Pastikan *link* dan nama *file*-nya tepat.

4. **Kirim Konfirmasi:**
   Beri tahu *user* bahwa "Memori berhasil diukir di dalam sistem 🧠" dan *rule* spesifik tersebut sekarang telah menjadi insting bawaan untuk AI yang akan membahas hal serupa.
