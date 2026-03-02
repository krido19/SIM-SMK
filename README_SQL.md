# Struktur Database & SQL Bedah (SIM SMK HAFIDZ)

Dokumen ini menjelaskan struktur database (schema), tabel, dan data awal (seed) yang digunakan dalam aplikasi SIM SMK HAFIDZ berbasis Supabase.

> **Catatan:** Jika ada perubahan struktur pada file migrasi (`supabase/migrations/`) atau perubahan pada data seed (`supabase/seed.sql`), pastikan untuk **memperbarui dokumen ini**.

---

## 🏗️ Skema Database (Tabel Utama)

Aplikasi ini menggunakan skema relasional standar di PostgreSQL (Supabase) dengan mengaktifkan pengamanan *Row Level Security* (RLS) pada setiap tabel.

### 1. `profiles`
Tabel utama pengguna yang terhubung secara otomatis (via trigger) ke sistem Autentikasi Supabase (`auth.users`).
- `id` (UUID, Primary Key)
- `full_name` (Text)
- `role` (Text) - Enumerasi: `'admin'`, `'guru'`, `'siswa'`, `'orang_tua'`
- `avatar_url` (Text)

### 2. `settings`
Menyimpan konfigurasi web yang dinamis seperti Nama Sekolah dan Logo.
- `key` (Text, Primary Key) - Contoh: `'school_name'`
- `value` (Text)

### 3. `classes`
Data Kelas (Rombongan Belajar).
- `id` (UUID, Primary Key)
- `name` (Text) - Contoh: "X RPL 1"
- `homeroom` (Text) - Nama Wali Kelas
- `level` (Text) - Tingkat (10, 11, 12)

### 4. `subjects`
Data Mata Pelajaran.
- `id` (UUID, Primary Key)
- `name` (Text)
- `kkm` (Integer) - Nilai Kriteria Ketuntasan Minimal
- `jurusan` (Text)
- `teachers` (Text) - Nama pengampu
- `color` (Text) - Warna label (opsional)

### 5. `teachers`
Data Lengkap Guru/Pendidik.
- `id` (UUID, Primary Key)
- `profile_id` (UUID, Foreign Key *opsional* menyambung ke `profiles`)
- `nip` (Text, Unique) - Nomor Induk Pegawai (Digunakan untuk Login)
- `name` (Text)
- `email` (Text)
- `specialty` (Text)
- `wa_number` (Text)
- `status` (Text)

### 6. `students`
Data Lengkap Siswa/Peserta Didik.
- `id` (UUID, Primary Key)
- `profile_id` (UUID, Foreign Key opsional)
- `nis` (Text, Unique) - Nomor Induk Siswa (Digunakan untuk Login)
- `full_name` (Text)
- `class_id` (UUID, Foreign Key menyambung ke `classes`)
- `parent_id` (UUID, Foreign Key opsional)
- `wa_student` (Text)
- `wa_parent` (Text)
- `status` (Text)

### 7. `schedules`
Data Jadwal Pelajaran Mingguan.
- `id` (UUID, Primary Key)
- `class_id` (UUID), `subject_id` (UUID), `teacher_id` (UUID) - Relasi
- `day` (Text) - Hari (Senin - Jumat)
- `jam_ke` (Integer) - Jam Pelajaran
- `start_time` (Time), `end_time` (Time)

### 8. `grades`
Data Buku Nilai Siswa per Mata Pelajaran.
- `id` (UUID, Primary Key)
- `student_id` (UUID), `subject_id` (UUID), `teacher_id` (UUID)
- `semester` (Integer)
- `tugas`, `uts`, `uas`, `score` (Integer) - Komponen dan Nilai Akhir

### 9. `attendance`
Absensi/Kehadiran Harian Siswa.
- `id` (UUID, Primary Key)
- `student_id` (UUID)
- `date` (Date)
- `status` (Text) - `'Hadir'`, `'Sakit'`, `'Izin'`, `'Alpa'`
- `notes` (Text)

### 10. `assignments`
Tugas / PR yang diberikan oleh Guru ke Kelas.
- `id` (UUID, Primary Key)
- `teacher_id` (UUID), `class_id` (UUID)
- `subject_name`, `title`, `description` (Text)
- `due_date` (Timestamp)

### 11. `announcements`
Sistem Papan Pengumuman Berita.
- `id` (UUID, Primary Key)
- `title`, `content`, `category` (Text)
- `target_role` (Text) - null (Semua), 'guru', 'siswa', dsb.

---

## 🪴 Data Seed & Full Setup

Pada folder `supabase/`, kami telah menyertakan skrip komprehensif untuk instalasi awal:

1. **`supabase/full_setup.sql`** (Sangat Disarankan)
   File ini merupakan gabungan dari seluruh struktur skema tabel (migrations) beserta data uji coba (seed).
   🚀 **Cara Pakai:** Buka SQL Editor di Supabase, lalu copy-paste seluruh isi `full_setup.sql` dan jalankan. Ini akan membuat seluruh tabel, mengaktifkan RLS, serta memasukkan seluruh data dummy di bawah ini.
   
2. **`supabase/seed.sql`**
   Jika tabel-tabel di atas sudah ada dan Anda hanya ingin me-reset isi data (menghapus dan memasukkan data dummy baru), Anda bisa menjalankan `seed.sql`. File ini otomatis akan menghapus isi tabel lama secara aman sebelum menanamkan data baru.

### Kredensial Login Bawaan (Bypass di `Login.jsx`)
Walaupun tidak ada UUID resmi di `auth.users`, file `Login.jsx` menerima kredensial "bypass" berbasis data Seed ini:

| Peran (Role) | ID / Username (Email, NIP, NIS) | Password (Kata Sandi) |
|---|---|---|
| **Admin** | `admin@school.id` | `admin123` |
| **Guru (Teacher)** | `198001012005011001` (NIP Budi) | `guru123` *(Atau kombinasi nama/NIP sesuai seed)* |
| **Guru (Teacher)** | `budi@school.id` | `guru123` |
| **Siswa (Student)**| `23241001` (NIS Andi) | `siswa123` (atau NIS `23241001`) |
| **Orang Tua (Parent)**| `OT23241001` (OT + NIS Andi) | `parent123` |

### Isi Utama Seed:
1. **Settings / Konfigurasi:** Nama Sekolah ("SIM SMK HAFIDZ").
2. **Kelas:** X, XI, XII RPL 1.
3. **Mata Pelajaran:** Pemrograman Web, Basis Data, Matematika.
4. **Guru:**
   - Budi Santoso (RPL) - NIP: `198001012005011001`
   - Siti Aminah (Basis Data) - NIP: `198202022006022002`
   - Ahmad Rizal (Matematika) - NIP: `197503032000031003`
5. **Siswa:** Andi Pratama (X RPL 1), Bunga Citra (X RPL 1), Cipto, Dewi.
6. **Data Akademis Terisi:** Terdapat contoh Jadwal (Senin-Selasa), contoh Nilai (Grades Andi & Bunga), contoh Absensi Harian, Penugasan (Assignments), serta Berita Pengumuman.

---
*Dokumen ini dibuat secara otomatis sebagai pedoman referensi SQL aplikasi SIM SMK HAFIDZ.*
