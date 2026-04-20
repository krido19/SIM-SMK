# SOP & Skill Khusus: Proyek SIM SMK / PKL

File *skill* ini merangkum seluruh rekayasa logika dan standar pengembangan mutlak yang telah diterapkan *khusus* pada repositori/proyek SIM SMK. Segala penanganan fitur di dalam folder ini **harus** mengacu ke prosedur berikut untuk mencegah regresi (*bug* terulang):

## 1. Modul Manajemen Siswa (Import & Delete)
- **Logika Tambah/Import Excel:** Jangan gunakan Insert sederhana karena sangat rentan duplikasi `NIS`. Selalu operasikan `Upsert` pada `student` berbasis unik `nis`.
- **Pencocokan Nama Kelas (Relasional):** Karena spasi dari file *Excel* atau kelalaian *User* seringkali tidak konsisten (contoh `"X TKP"` vs `"X TKP "`), sistem *harus* membersihkan dengan aturan kaku: `.replace(/\s+/g, '').toLowerCase()`. Ini mencegah siswa terdaftar tanpa wali kelas / *unsigned*.
- **Hapus Massal (Bulk Delete):** Fitur Select-All (`isCheckedAll`) harus menargetkan **seluruh data memori (*students*)**, BUKAN HANYA yang tampil di tabel paginasi (halaman aktif).

## 2. Modul Buku Nilai (Grade Entry Dinamis)
- **Kalkulasi Final Terpadu:** Sistem web yang menentukan rata-rata Nilai **(Tugas + UTS + UAS) / 3** secara internal (*state calculation*). Jangan mengubah nilai akhir dari UI.
- **Upload Excel per Komponen (Smart Mapping):** 
  - Alih-alih membuat satu matrix besar untuk semua pelajaran, Web ini menggunakan pendekatan terisolasi: Mengisi per Mata Pelajaran Aktif. 
  - Template Excel selalu diturunkan dinamis, memuat nama siswa di kelas yang sama, beserta 3 kolom tambahan `TUGAS`, `UTS`, dan `UAS` *kosong*.
  - Pemetaan *(Mapping)* mengharuskan *User* mencocokkan mana kolom `tugas` dkk sebelum di-*batch upsert*.
- **Proteksi Data (onConflict):** Eksekusi Upsert pada *Buku Nilai* (`grades`) diproteksi utuh oleh parameter konflik: `onConflict: 'student_id, subject_id, semester'`. Jangan memanggil `UPDATE` atau `INSERT` secara mentah.

## 3. Filosofi Desain Antarmuka (UI/UX)
- Tetap patuhi pedoman estetika Brutalist ringan standar yang sudah dipakai di aplikasi:
  - Kotak tajam (border-2, *solid*), warna solid (`ink`, `paper`, `newsprint-red`).
  - Animasi statik dan huruf tebal / *uppercase*.
