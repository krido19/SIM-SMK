# 🏫 SIM-SMK: Sistem Informasi Manajemen SMK Modern

**SIM-SMK** adalah platform manajemen sekolah terintegrasi yang dirancang khusus untuk memenuhi kebutuhan kompleks Sekolah Menengah Kejuruan (SMK). Dibangun dengan estetika premium, performa tinggi, dan fokus pada kemudahan penggunaan bagi Admin, Guru, Siswa, hingga Orang Tua.

---

## 🚀 Latar Belakang & Masalah

Vocational School (SMK) seringkali menghadapi tantangan operasional yang unik:
1. **Manajemen Jadwal yang Rumit**: Mengelola 60+ kelas dengan sistem minggu bergantian (Ganjil/Genap) sering menyebabkan tabrakan jadwal (*collision*).
2. **Absensi & Nilai Terfragmentasi**: Data kehadiran dan nilai seringkali masih tersimpan dalam lembaran fisik atau spreadsheet yang sulit diakses secara real-time.
3. **Kurangnya Transparansi bagi Orang Tua**: Orang tua sering kesulitan memantau perkembangan sekolah anak mereka secara langsung.
4. **Respon Sistem yang Lambat**: Banyak sistem warisan (*legacy*) yang memiliki UI kuno dan performa lambat, menurunkan produktivitas tenaga pengajar.

---

## ✨ Fitur Unggulan

### 🛡️ Core Infrastructure
- **Premium Feedback System**: Notifikasi Toast dan Modal Konfirmasi yang cantik (Glassmorphism), menggantikan alert browser yang kaku.
- **Role-Based Access Control (RBAC)**: Keamanan data yang ketat menggunakan Supabase RLS (Row Level Security).
- **One-Click SQL Backup**: Ekspor seluruh skema dan data database ke file SQL untuk migrasi atau pencadangan instan.

### 📅 Manajemen Akademik (Admin)
- **Smart Scheduling Matrix**: Tampilan grid mingguan yang interaktif dengan deteksi tabrakan jadwal (*Collision Detection*) otomatis.
- **Alternating Weeks**: Dukungan penuh untuk jadwal Minggu Ganjil dan Minggu Genap.
- **Excel Student Import**: Daftarkan ribuan siswa sekaligus melalui file Excel (.xlsx).
- **Master Data Guru & Mapel**: Manajemen data tenaga pengajar dan mata pelajaran dengan filter canggih.

### 📝 Portal Guru
- **Rapid Grade Entry**: Input nilai (Tugas, UTS, UAS) dalam satu tabel efisien.
- **Daily Attendance**: Checklist kehadiran harian siswa dengan status (Hadir, Sakit, Izin, Alpa).
- **WhatsApp Integration**: Kirim pesan atau pengumuman ke Siswa/Orang Tua langsung via Fonnte API.

### 📊 Portal Siswa & Orang Tua
- **Monitoring Real-time**: Pantau rekap absensi, jadwal mingguan, dan laporan nilai secara digital.
- **Modern Dashboard**: Interface yang responsif dan mudah dipahami, memberikan pengalaman pengguna kelas atas.

---

## 🛠️ Teknologi (Tech Stack)

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS (Modern & Clean Design)
- **Database & Auth**: Supabase (PostgreSQL)
- **Deployment**: Vercel Ready
- **Utility**: Lucide React (Icons), TanStack Query (State Management), XLSX (Data Processing)

---

## ⚙️ Persiapan & Instalasi

### 1. Prasyarat
- Node.js (Versi 18 atau lebih baru)
- Akun Supabase (Untuk backend)

### 2. Kloning & Install
```bash
git clone https://github.com/krido19/SIM-SMK.git
cd SIM-SMK
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di direktori utama dan isi dengan kredensial Anda:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FONNTE_TOKEN=your_fonnte_token (opsional)
```

### 4. Setup Database
Jalankan file SQL yang tersedia di folder `supabase/migrations` pada SQL Editor Supabase Anda untuk membuat tabel dan kebijakan keamanan (RLS).

### 5. Jalankan Aplikasi
```bash
npm run dev
```

---

## 📖 Cara Penggunaan

### Login Default
| Peran | Email / ID | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@school.id` | `admin123` |
| **Guru** | `guru@school.id` | `guru123` |
| **Siswa** | `2023001` (Contoh NIS) | `siswa123` |
| **Orang Tua** | `OT2023001` | `parent123` |

### Alur Kerja Utama
1. **Admin**: Masuk ke menu **Kelas** untuk import siswa via Excel, lalu atur **Jadwal** menggunakan Matrix View. Pastikan tidak ada konflik guru atau kelas.
2. **Guru**: Gunakan menu **Input Nilai** setiap kali ujian berakhir dan **Input Absensi** setiap hari sebelum memulai kelas.
3. **Pengumuman**: Admin dapat menerbitkan pengumuman yang akan langsung muncul di dashboard semua pengguna.

---

## 📄 Lisensi
Proyek ini dikembangkan secara privat untuk kebutuhan digitalisasi SMK. Seluruh hak cipta dilindungi.