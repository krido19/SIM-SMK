# Spesifikasi Desain & Strategi Pengembangan: Sistem Informasi Pengolahan Nilai Siswa

**Dokumen ini merinci arsitektur teknis, alur aplikasi, dan saran pengembangan strategis untuk membangun sistem pengolahan nilai yang modern, aman, dan user-friendly.**

---

## 1. Teknologi (Tech Stack)
* **Frontend:** React.js (Vite)
* **Backend & Database:** Supabase (PostgreSQL + Auth + Edge Functions)
* **Styling:** Tailwind CSS
* **State Management:** React Context API & TanStack Query (React Query)
* **Routing:** React Router DOM
* **Icons:** Lucide React / Heroicons

---

## 2. Arsitektur Database (Supabase Schema)

Sistem menggunakan **Role-Based Access Control (RBAC)**. Autentikasi ditangani oleh Supabase Auth, sedangkan data profil disimpan di tabel public.

### A. Tabel Utama
1.  **`profiles`** (Public Table)
    * Menghubungkan `auth.users` dengan peran aplikasi.
    * **Kolom:** `id` (UUID, FK), `full_name`, `role` (enum: 'admin', 'guru', 'siswa', 'orang_tua'), `avatar_url`, `created_at`.

2.  **`academic_data` (Data Induk)**
    * **`students`**: `id`, `profile_id` (FK), `nis`, `class_id`, `parent_id`.
    * **`teachers`**: `id`, `profile_id` (FK), `nip`, `subject_specialty`.
    * **`classes`**: `id`, `name` (contoh: "X-IPA-1"), `homeroom_teacher_id`.
    * **`subjects`**: `id`, `name` (contoh: "Matematika"), `kkm`.

3.  **`operations` (Operasional)**
    * **`schedules`**: `id`, `class_id`, `subject_id`, `teacher_id`, `day`, `start_time`, `end_time`.
    * **`announcements`**: `id`, `title`, `content`, `author_id`, `target_role`, `created_at`.

4.  **`records` (Pencatatan)**
    * **`grades`**: `id`, `student_id`, `subject_id`, `semester`, `type` (Tugas/UTS/UAS), `score`.
    * **`attendance`**: `id`, `student_id`, `date`, `status` (Hadir/Sakit/Izin/Alpa), `notes`.

### B. Keamanan Data (Row Level Security - RLS)
* **Siswa/Ortu:** Kebijakan `SELECT` hanya untuk `id` yang cocok dengan `auth.uid()` atau `parent_id`.
* **Guru:** Kebijakan `SELECT` & `UPDATE` hanya untuk siswa yang berada di kelas yang diajar.
* **Admin:** Kebijakan `ALL` (Full Access).

---

## 3. Alur Aplikasi (User Flow)

Aplikasi menggunakan *Protected Routes* untuk memisahkan akses antar role.

### A. Autentikasi
* **Route:** `/login`
* **Logic:** User Login -> Cek Tabel `profiles` -> Redirect ke Dashboard sesuai Role.

### B. Dashboard Admin (`/admin/*`)
* **Fokus:** Manajemen Master Data.
* **Fitur:** CRUD Siswa, Guru, Mapel, Kelas, dan Jadwal. Membuat Pengumuman Sekolah.

### C. Dashboard Guru (`/guru/*`)
* **Fokus:** Input Data (Write Heavy).
* **Fitur:**
    * **Input Nilai:** Mode tabel untuk input nilai banyak siswa sekaligus.
    * **Input Absensi:** Checklist kehadiran harian.
    * **Jadwal Mengajar:** Melihat jadwal pribadi.

### D. Dashboard Siswa (`/siswa/*`)
* **Fokus:** Monitoring (Read Only).
* **Fitur:**
    * **Lihat Nilai:** Rapor digital per semester.
    * **Lihat Jadwal:** Jadwal pelajaran mingguan.
    * **Lihat Absensi:** Rekap kehadiran diri sendiri.

### E. Dashboard Orang Tua (`/parent/*`)
* **Fokus:** Pemantauan Anak.
* **Fitur:** Mirip dashboard siswa, namun menampilkan data anak mereka.

---

## 4. Implementasi UI (Tailwind CSS)

### Layout Structure
Menggunakan pola **Dashboard Layout** (Sidebar + Header + Content).

```jsx
<div className="flex h-screen bg-gray-50">
  {/* Sidebar: Menu berubah sesuai Role */}
  <Sidebar /> 
  <div className="flex-1 flex flex-col overflow-hidden">
    <Header />
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <Outlet />
    </main>
  </div>
</div>