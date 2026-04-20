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

## 3. Sistem Jurusan & Pewarnaan Dinamis (Classes & Students)
- **Identitas Visual (Color Coding):** 
  - Sistem menggunakan warna unik per jurusan untuk mempermudah identifikasi data di grid Kelas dan tabel Siswa.
  - **getJurusan() Logic:** Menggunakan pencocokan nama jurusan dari `JURUSAN_LIST`. Jika jurusan diketik manual dan tidak ada di daftar, sistem menggunakan **Hash Color Deterministik** (nama yang sama selalu menghasilkan warna yang sama) agar visual tetap konsisten tanpa duplikasi warna abu-abu.
- **Input Fleksibel:** Form Tambah Kelas menggunakan kombinasi `input` + `datalist` untuk field `jurusan`. Ini memungkinkan Admin memilih dari daftar standar (TKP, RPL, dll) ATAU mengetik jurusan baru secara bebas.
- **Perhitungan Siswa (Real-time Count):** Data jumlah siswa di kartu kelas tidak di-hardcode, melainkan dihitung langsung dari database menggunakan query Supabase: `.select('*, students(count)')`.

## 4. Manajemen Guru & Pangkat
- **Atribut Pangkat/Golongan:** Menambahkan field `pangkat` ke seluruh alur data guru (Form, Template Excel, Import/Export, dan UI Card).
- **Subject-Based Coloring:** Kartu guru memiliki header berwarna otomatis berdasarkan Nama Mata Pelajaran. Pembangkitan warna menggunakan fungsi hash khusus agar Guru dengan mapel yang sama memiliki tema warna yang identik secara otomatis.

## 5. Standar Database & Migrasi
- **SQL Migrations:** Setiap penambahan kolom baru (misal `jurusan` di `classes`, `pangkat` di `teachers`) harus disertai file `.sql` di folder `supabase/migrations/` dan diinstruksikan kepada User untuk dijalankan di SQL Editor Supabase Dashboard.
- **Default Values:** Selalu gunakan `DEFAULT ''` atau nilai aman lainnya untuk kolom baru guna mencegah error pada data lama.

## 6. Filosofi Desain Antarmuka (UI/UX)
- Tetap patuhi pedoman estetika Brutalist ringan standar yang sudah dipakai di aplikasi:
  - Kotak tajam (border-2, *solid*), warna solid (`ink`, `paper`, `newsprint-red`).
  - Animasi statik dan huruf tebal / *uppercase*.
  - Penggunaan badge warna kontras untuk kategori (Jurusan, Pangkat, Status).

## 7. Executive Dashboard (Analitik)
- **File:** `src/pages/admin/AnalyticsDashboard.jsx`
- **Library:** `recharts` (`AreaChart`, `BarChart`, `LineChart`).
- **Data Source:** Query langsung ke tabel `attendance`, `grades`, dan `assignments` di Supabase — tidak ada data statis / dummy.
- **Aggregasi Kehadiran:** Dikelompokkan per bulan menggunakan key format `"Apr 2026"` agar grafik tren terbaca rapi.
- **Aggregasi Nilai:** Rata-rata per mata pelajaran dihitung on-the-fly dengan `reduce` di sisi *client*, bukan stored procedure.
- **Aktivitas Guru:** Diproxy dari jumlah `assignments` yang dibuat per `teacher_id` — sorted descending untuk *leaderboard*.

## 8. Document Generator (Cetak PDF)
- **File:** `src/pages/admin/DocumentGenerator.jsx`
- **Library:** `react-to-print` (cetak via browser print dialog).
- **Tipe Dokumen:** `rapor`, `sp` (Surat Peringatan), `custom` (Surat Bebas).
- **Kop Surat:** Menggunakan dua logo (`/logo-jateng.png` dan `/logo-smk.png`) dalam layout flex. Jika file `.png` tidak ditemukan, fallback ke `.jpg` dengan *cache busting* `?v=2`.
- **Nama Kepala Sekolah:** Dikelola via `state` lokal (`headmasterName`, `headmasterNip`), bukan hardcoded. Ada panel input "Atur Tanda Tangan" di sidebar generator yang bisa diubah sebelum cetak.
- **Pencarian Siswa:** Siswa dicari berdasarkan nama / NIS menggunakan state `searchQuery`. Data nilai diambil dari tabel `grades` dengan join ke `subjects`.
- **PENTING — Pola Render:** Gunakan `React.forwardRef` pada komponen template A4 (`ReportDocumentRef`) agar `react-to-print` bisa mengakses DOM node-nya.

## 9. Jadwal Pelajaran — Import Massal Excel
- **File:** `src/pages/admin/Schedule.jsx`
- **Tombol Import/Export:** Tombol Download Template (📥) dan Upload Excel (📤) sudah ada dan terpasang di *header* halaman Jadwal, di sebelah kiri tombol "TAMBAH".
- **Template Excel** memiliki kolom: `Hari`, `Jam Ke`, `Waktu Mulai`, `Waktu Selesai`, `Kelas`, `Mata Pelajaran`, `Guru`, `Minggu`.
- **Matching Kelas:** Sistem mencocokkan kolom `Kelas` dari Excel ke `dbClasses` menggunakan `.toLowerCase()` untuk toleransi spasi.
- **Validasi Konflik:** Import tidak melewati validasi konflik — sistem hanya insert batch tanpa cek. Konflik hanya dicegah saat tambah manual 1-per-1. Ini adalah *known behavior* yang sengaja.
- **Input File:** Menggunakan `<input type="file">` transparan yang di-overlay di atas tombol visual, dengan `ref={fileInputRef}` untuk reset setelah upload selesai.

## 10. StatCard — onClick Handler
- **File:** `src/components/dashboard/StatCard.jsx`
- **Masalah Lama:** Props `onClick` diterima di `AdminDashboard.jsx` tapi tidak diteruskan ke komponen `StatCard`, sehingga kartu tidak bisa diklik.
- **Solusi:** Tambahkan `onClick` ke destrukturisasi props dan render sebagai `<button>` jika tidak ada prop `to`. Jika ada `to="#"`, cegah navigasi dengan `e.preventDefault()` agar tetap bisa memanggil `onClick`.
- **Efek Samping Positif:** Ikon ChevronRight di sudut kartu sekarang muncul jika ada `onClick` maupun `to`.

## 11. Debugging Login — Sesi Lama (localStorage)
- **Masalah Umum:** Setelah import siswa baru, nama siswa yang tampil di dashboard bisa saja nama siswa dari sesi login sebelumnya karena `localStorage` tidak dibersihkan.
- **Root Cause:** Nilai `userName`, `userId`, `userRole`, `userClass` disimpan di `localStorage`. Jika user lama belum logout, nilai tersebut tidak akan ter-*overwrite* otomatis.
- **Solusi User:** Klik "Keluar Sistem" terlebih dahulu sebelum login dengan akun siswa baru. Atau bersihkan manual di DevTools → Application → Local Storage.
- **Solusi Developer:** Fungsi `handleLogin` sudah memanggil `localStorage.removeItem(...)` untuk semua key di awal proses, TAPI hanya jika form login disubmit — tidak ada pengecekan saat app pertama kali dimuat.
- **Standar Password Siswa:** `siswa123` ATAU NIS siswa itu sendiri (keduanya diterima di `handleLogin`).
- **Standar Password Guru:** `guru123` ATAU prefix email sebelum `@` ATAU NIP guru.
