# 🏫 SIM-SMK: Sistem Informasi Manajemen SMK Modern

**SIM-SMK** adalah platform manajemen sekolah terintegrasi yang dirancang khusus untuk memenuhi kebutuhan kompleks Sekolah Menengah Kejuruan (SMK). Dibangun dengan estetika premium, performa tinggi, dan fokus pada kemudahan penggunaan bagi Admin, Guru, Siswa, hingga Orang Tua.

---

## 🚀 Latar Belakang & Masalah

Vocational School (SMK) seringkali menghadapi tantangan operasional yang unik:
1. **Manajemen Jadwal yang Rumit**: Mengelola 60+ kelas dengan sistem minggu bergantian (Ganjil/Genap) sering menyebabkan tabrakan jadwal (*collision*).
2. **Absensi & Nilai Terfragmentasi**: Data kehadiran harian dan riwayat nilai seringkali sulit diakses secara transparan dan real-time.
3. **Manajemen Semester**: Kesulitan dalam mengelola data akademik yang berbeda antar semester dalam satu tahun ajaran.
4. **Respon Sistem yang Lambat**: Banyak sistem warisan (*legacy*) yang memiliki UI kuno dan performa lambat, menurunkan produktivitas tenaga pengajar.

---

## ✨ Fitur Utama (Berdasarkan Peran)

### 🛡️ Administrator (Super Control)
- **General Settings Customization**: Ubah Nama Sekolah dan Logo aplikasi langsung dari dashboard. Perubahan akan langsung tercermin di Sidebar dan Halaman Login.
- **Full Database Backup**: Ekspor seluruh skema dan data database ke dalam file `.sql` dalam satu klik.
- **Smart Scheduling Matrix**: Tampilan grid mingguan interaktif dengan deteksi tabrakan jadwal otomatis.
- **Batch Data Management**: 
  - **Excel Import Siswa**: Daftarkan ribuan siswa sekaligus.
  - **Excel Import Guru**: Daftarkan seluruh tenaga pengajar dengan cepat melalui file Excel.
- **Real-time Attendance Analytics**: Grafik mingguan yang menghitung otomatis persentase kehadiran siswa dari Senin hingga Sabtu.

### 📝 Portal Guru (Manajemen Kelas)
- **Digital Attendance**: Checklist kehadiran harian yang terintegrasi dengan WhatsApp (via Fonnte).
- **Multi-Semester Grade Entry**: Input nilai (Tugas, UTS, UAS) dengan filter semester yang akurat.
- **Assignment System**: Buat tugas dengan lampiran file dan pantau status pengumpulan siswa.

### 📊 Portal Siswa & Orang Tua
- **Interactive Attendance History**: Visualisasi riwayat kehadiran dalam format Kalender Interaktif (Heatmap style).
- **Academic Performance**: Monitoring nilai rata-rata dan detail per mata pelajaran.
- **Schedule & Task Alerts**: Notifikasi kelas yang sedang berlangsung serta hitungan tugas yang menunggu.

---

## 🛠️ Teknologi (Tech Stack)

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS (Premium Glassmorphism UI)
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL)
- **Data Export/Import**: XLSX (Excel Handling)
- **Third Party**: Fonnte API (WhatsApp Gateway)

---

## ⚙️ Persiapan & Instalasi

### 1. Prasyarat
- Node.js (v18+)
- Proyek Supabase aktif

### 2. Instalasi Lokal
```bash
git clone https://github.com/krido19/SIM-SMK.git
cd SIM-SMK
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root folder:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Database (Penting)
1. 📖 **Baca panduan lengkap struktur database dan data percobaan (seed) di [README_SQL.md](./README_SQL.md). PENTING: Jika ada perubahan skema SQL, harap perbarui file referensi ini juga.**
2. Jalankan perintah SQL yang ada di file **`supabase/full_setup.sql`** langsung di tab **SQL Editor** pada Supabase untuk mengimpor schema & dummy data secara berurutan. (Menggunakan `seed.sql` saja akan error jika tabel belum dibuat).
3. Pastikan Storage Bucket di Supabase sudah dibuat:
   - `announcements` (Public) - Untuk foto pengumuman dan logo.
   - `assignments` (Public) - Untuk file tugas.
4. Aktifkan RLS (Row Level Security) pada semua tabel (Sudah diaktifkan di file SQL setup).

### 5. Jalankan Aplikasi
```bash
npm run dev
```

---

## 📖 Akun Demo Default

| Peran | Login (Email/ID) | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@school.id` | `admin123` |
| **Guru** | `04019618` (NIP) | `guru123` |
| **Siswa** | `2324077` (NIS) | `siswa123` |
| **Orang Tua** | `OT2324077` | `parent123` |

---

## 📸 Pratinjau Dashboard

### Fitur Kustomisasi Logo & Nama
Dashboard sekarang mendukung identitas sekolah yang dinamis. Cukup unggah logo Anda di menu Pengaturan Umum.

### Analytics Absensi Real-time
Grafik di dashboard Admin kini menunjukkan persentase kehadiran asli yang dihitung dari database setiap minggunya.

---

## 📄 Lisensi
Copyright © 2025. **SIM-SMK Modern Framework**.
Dioptimalkan untuk produktivitas pendidikan Indonesia.