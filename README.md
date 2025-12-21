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

## ✨ Fitur Unggulan

### 🛡️ Core Infrastructure & Optimization
- **Role-Based Architecture**: Dashboard telah direfaktorisasi menjadi komponen modular (`AdminDashboard`, `TeacherDashboard`, `StudentDashboard`) untuk performa dan maintainability tinggi.
- **Premium Feedback System**: Notifikasi Toast dan Modal Konfirmasi yang cantik (Glassmorphism), meningkatkan pengalaman interaksi pengguna.
- **Supabase Integration**: Keamanan data ketat menggunakan RLS (Row Level Security) dan penyimpanan aset via Supabase Storage.

### 📅 Manajemen Akademik (Admin)
- **Smart Scheduling Matrix**: Tampilan grid mingguan interaktif dengan deteksi tabrakan jadwal (*Collision Detection*) otomatis.
- **Alternating Weeks & Semesters**: Dukungan penuh untuk jadwal Minggu Ganjil/Genap serta pemisahan data nilai per semester.
- **Excel Batch Import**: Daftarkan ribuan siswa sekaligus melalui integrasi file Excel (.xlsx).

### 📝 Portal Guru (Manajemen Kelas)
- **Multi-Semester Grade Entry**: Input nilai (Tugas, UTS, UAS) dengan filter semester (Ganjil/Genap) yang terintegrasi.
- **Digital Attendance**: Checklist kehadiran harian dengan kalkulasi otomatis persentase kehadiran untuk dashboard.
- **Assignment System**: Buat tugas dengan lampiran file dan pantau status pengumpulan siswa secara real-time.
- **WhatsApp Integration**: Komunikasi instan ke Orang Tua/Siswa via Fonnte API.

### 📊 Portal Siswa & Orang Tua
- **Interactive Attendance History**: Visualisasi riwayat kehadiran dalam format Kalender Interaktif (Heatmap style) dan Daftar Detail.
- **Academic Performance**: Monitoring nilai rata-rata dan detail per mata pelajaran sesuai semester aktif.
- **Schedule & Task Alerts**: Notifikasi kelas yang sedang berlangsung serta hitungan tugas yang menunggu (*pending tasks*).

---

## 🛠️ Teknologi (Tech Stack)

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS (Glassmorphism UI)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Role Mapping
- **Storage**: Supabase Storage (Materials & Assignments)
- **Icons**: Lucide React
- **Data Handling**: TanStack Query & XLSX

---

## ⚙️ Persiapan & Instalasi

### 1. Prasyarat
- Node.js (v18+)
- Supabase Project

### 2. Instalasi
```bash
git clone https://github.com/krido19/SIM-SMK.git
cd SIM-SMK
npm install
```

### 3. Setup Database
Jalankan skema di folder `supabase/migrations`. Pastikan menjalankan migrasi `20251221_add_unique_constraint_to_grades.sql` untuk mendukung fitur multi-semester.

### 4. Jalankan Aplikasi
```bash
npm run dev
```

---

## 📖 Akun Demo

| Peran | Login (Email/ID) | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@school.id` | `admin123` |
| **Guru** | `04019618` (NIP) | `guru123` |
| **Siswa** | `2324077` (NIS) | `siswa123` |
| **Orang Tua** | `OT2324077` | `parent123` |

---

## 📸 Dokumentasi Fitur

### Dashboard Modular (Teacher & Student)
![Teacher Dashboard](C:/Users/Administrator/.gemini/antigravity/brain/e67d7396-497d-44ab-940e-3f2145ee51b5/teacher_dashboard_refactored_1766290449561.png)
*Tampilan dashboard yang dipersonalisasi sesuai peran pengguna.*

### Riwayat Absensi & Nilai
![Attendance History](C:/Users/Administrator/.gemini/antigravity/brain/e67d7396-497d-44ab-940e-3f2145ee51b5/attendance_calendar_1766289253612.png)
*Monitoring presensi interaktif untuk transparansi kehadiran siswa.*

---

## 📄 Lisensi
Copyright © 2025. Implementasi SIM-SMK Modern.