# Panduan Alur Penggunaan SIM SMK HAFIDZ

Dokumen ini menjelaskan alur (flow) perjalanan pengguna dari halaman Login hingga menggunakan fitur-fitur utama di dalam aplikasi. Terdapat tiga aktor utama dalam sistem ini: **Administrator**, **Guru (Teacher)**, dan **Siswa (Student) / Orang Tua (Parent)**. Sistem dirancang dengan gaya *Newsprint Ledger*, sehingga antarmukanya berfokus pada efisiensi membaca dan memasukkan data.

---

## 🚪 1. Alur Login (Gerbang Utama)

Halaman login (`/login`) adalah satu-satunya gerbang masuk. Sistem ini menggunakan metode **bypass autentikasi khusus** (karena tidak menggunakan sistem registrasi umum demi keamanan data sekolah).

1. Buka halaman utama aplikasi. Anda akan diarahkan otomatis ke `/login`.
2. Di sebelah kiri, Anda akan melihat "The Daily Ledger" yang berisi informasi sekolah. Di sebelah kanan adalah form Login.
3. Masukkan **ID / Email / NIP / NIS** yang sesuai dengan peran Anda pada kolom "Identification".
4. Masukkan **Password** pada kolom "Passcode".
5. Klik tombol **"Authorize Access"**.

Sistem akan mendeteksi secara otomatis apakah ID dan Password yang dimasukkan cocok dengan data di tabel `teachers`, `students`, atau `admin`. Setelah berhasil, Anda akan dialihkan ke `/dashboard` dengan tampilan yang disesuaikan (*Role-Based Dashboard*).

---

## 👑 2. Alur Penggunaan: Administrator (Admin)

Admin adalah pemegang kendali tertinggi. Tampilan dasbor Admin berfokus pada **Monitoring & Statistik (Pemantauan)**.

### A. Dashboard Admin (`/dashboard`)
Setelah login, Admin akan melihat statistik inti sekolah (Total Siswa, Total Guru, Kelas Aktif). Ini adalah pusat kendali untuk melihat *anomali* data.

### B. Menu Navigasi (Sidebar Index)
Admin memiliki akses penuh ke tiga kategori utama di navigasi kiri:
1. **[ DIRECTORY ]** (Direktori Induk)
   - **Siswa (`/admin/students`)**: Tambah, Edit, Hapus data siswa. Bisa melihat NIS dan menghubungkan ke Kelas tertentu.
   - **Guru (`/admin/teachers`)**: Mengelola data NIP, spesialisasi, dan status aktif guru.
2. **[ ACADEMICS ]** (Manajemen Akademik)
   - **Mata Pelajaran (`/admin/subjects`)**: Mengatur nama mapel dan KKM (Kriteria Ketuntasan Minimal).
   - **Kelas (`/admin/classes`)**: Mengatur Rombongan Belajar (Rombel), Tingkat (10/11/12), dan Wali Kelas.
   - **Jadwal (`/admin/schedule`)**: Membuka matriks jadwal mingguan. Admin bertugas memasukkan jadwal dari hari Senin-Jumat agar tidak bentrok.
3. **[ ADMINISTRATION ]** (Pengaturan Sistem)
   - **Berita/Pengumuman (`/admin/announcements`)**: Admin dapat menerbitkan "Headline News" yang akan muncul di *banner* atau halaman depan dasbor pengguna lain.
   - **Backup DB (`/admin/backup`)**: Mengekspor seluruh data ke file `.sql` untuk pengamanan manual.
   - **Fonnte API (`/admin/fonnte`)**: Jika sekolah berlangganan Fonnte untuk notifikasi WhatsApp, pengaturan token API dilakukan di sini.
   - **Settings (`/admin/settings`)**: Mengubah nama Sekolah dan Logo (yang akan langsung mengubah *header* dan layar login).

---

## 👨‍🏫 3. Alur Penggunaan: Guru (Teacher)

Dasbor Guru dirancang untuk **Efisiensi Tindakan (Action-Focused)**. Tujuannya agar guru tidak banyak mengklik untuk mengerjakan rutinitas harian.

### A. Dashboard Guru (`/dashboard`)
Setelah login (misalnya dengan kredensial `198001012005011001` / `guru123`), hal yang pertama dilihat adalah:
- **"Next Class" Widget**: Sistem mencocokkan jam saat ini dengan jadwal mengajar guru (`schedules`), lalu memunculkan tombol **"Isi Kehadiran"** berwarna merah agar guru langsung tahu kelas apa yang harus diajar detik itu juga.
- **Ungraded Actions**: Peringatan jika ada tugas kelas yang belum dinilai.

### B. Menu Navigasi Guru
Sidebar guru lebih ramping dan terfokus pada:
1. **[ ACADEMICS ]**
   - **Input Nilai (`/teacher/grades`)**: 
     - **Alur**: Guru memilih "Kelas", kemudian memilih "Mata Pelajaran" yang diajarkannya, lalu memilih "Semester".
     - **Input**: Muncul tabel bersaya *Ledger* (kertas pembukuan lama) dengan *font monospace*. Guru tinggal mengetik angka Nilai Tugas, UTS, dan UAS langsung di dalam kotak tebal. Data otomatis tersimpan (atau melalui tombol simpan bawah).
   - **Kehadiran (`/teacher/attendance`)**:
     - **Alur**: Guru memilih Tanggal hari ini dan Kelas yang sedang diajar.
     - **Input**: Daftar nama siswa berjejer padat ke bawah. Guru menekan status absen (`Hadir`, `Sakit`, `Izin`, `Alpa`). Tombol dibuat rapat seperti grid laporan agar eksekusinya cepat. Absensi ini otomatis menentukan status siswa di hari itu.

---

## 🧑‍🎓 4. Alur Penggunaan: Siswa & Orang Tua (Student/Parent)

Tampilan Siswa & Orang Tua difokuskan pada **Konsumsi Informasi (Consumption-Focused)**. Orang Tua melihat tampilan yang sama persis dengan siswa yang bersangkutan.

### A. Dashboard Siswa (`/dashboard`)
Setelah login (misalnya dengan NIS `23241001` / `siswa123`), siswa akan disambut oleh:
- **Today's Schedule**: Jadwal mata pelajaran hari ini secara real-time.
- **Impending Deadlines**: Daftar Tugas (Assignment) dari guru yang waktu pengumpulannya (due date) semakin dekat, diurutkan urgen.

### B. Menu Navigasi Siswa
1. **[ ACADEMICS ]**
   - **Lihat Nilai (`/student/grades`)**: Siswa membuka tabel rapor berbasis *Ledger*. Mereka bisa memfilter per semester untuk melihat nilai akhir per matpel yang bersanding ketat dengan standar KKM sekolah.
   - **Kehadiran (`/student/attendance`)**: Berisi rekapitulasi jumlah Hadir, Sakit, Izin, Alpa mereka selama bulan berjalan/semester berjalan. Jika sistem menemukan pola absen beruntun (misal 3 kali Alpa berturut-turut), notifikasi Peringatan Dini otomatis muncul.

### C. Alur Khusus Orang Tua
1. Orang Tua masuk menggunakan ID kombinasi **OT + NIS Anaknya** (Contoh: `OT23241001`).
2. Tampilan *Dashboard* akan otomatis menyesuaikan, menyajikan rapor anaknya dengan tulisan "Monitoring Akademik: Andi Pratama".
3. Orang tua hanya bisa membaca (*Read-Only*) laporan nilai, absensi, dan pengumuman sekolah, tanpa bisa melakukan input atau menghapus data.

---

## 🚨 5. Fitur Bantuan Global: "Live Bulletin" Notification

Di semua peran, jika terjadi aksi penting (misalnya pesan Error saat koneksi putus, peringatan absen terlewat, atau guru berhasil menyimpan Nilai Rapor secara masal), notifikasi tidak lagi berbentuk gelembung kecil.

Sebaliknya, notifikasi akan meletup dari sudut kanan bawah dalam format kotak kaku, tinggi kontras, bergaya telegraf berita sela (**URGENT NOTICE** / **OFFICIAL RECORD**), agar pesan sistem tidak pernah terlewatkan secara visual.

---
*Panduan di atas merupakan ringkasan fungsionalitas User Experience (UX) versi Phase 2 aplikasi.*
