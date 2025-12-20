# ⚡ Performance Optimization Guide

Dokumen ini menjelaskan strategi optimasi performa yang telah diterapkan pada project ini untuk mencapai skor Lighthouse yang tinggi dan pengalaman pengguna (UX) yang responsif, khususnya sesuai dengan stack **Vercel + Vite + React + Supabase**.

## 1. Asset Caching (Pengganti Nginx)
Karena aplikasi dideploy di **Vercel** (Serverless), kita tidak menggunakan konfigurasi Nginx manual. Sebagai gantinya, caching diatur di `vercel.json`.

*   **Implementasi**: `vercel.json` headers.
*   **Fungsi**: Menginstruksikan browser untuk menyimpan file statis (gambar, font, chunk JS/CSS) di cache browser selama **1 tahun** (`max-age=31536000`).
*   **Hasil**: User yang berkunjung kembali tidak perlu mendownload ulang asset yang sama.

## 2. Database & Query Optimization
Optimasi pengambilan data dari **Supabase** untuk meminimalkan beban network dan rendering.

*   **Implementasi**: Selecting fields (`select('*')`) dengan filter spesifik (`eq()`) di `Home.jsx`.
*   **Strategi**: Data hanya diambil saat komponen `Home` dimount. Struktur database yang sederhana membuat query join yang kompleks tidak diperlukan, menjaga respon time tetap cepat.

## 3. Kompresi (Brotli)
Vercel secara default melayani semua aset statis dan respon serverless function menggunakan kompresi **Brotli** atau **Gzip**.

*   **Status**: ✅ Aktif secara default di Vercel Edge Network.
*   **Manfaat**: Ukuran file CSS/JS berkurang hingga 15-20% dibandingkan Gzip biasa, mempercepat waktu download.

## 4. Optimasi Gambar (WebP & LCP)
Strategi pemuatan gambar dibagi menjadi dua: **Critical** (LCP) dan **Non-Critical** (Lazy Load).

*   **LCP (Largest Contentful Paint)**:
    *   **Target**: Foto profil utama di halaman Home.
    *   **Teknik**: Ditambahkan atribut `fetchPriority="high"`.
    *   **Tujuan**: Memastikan gambar ini didownload paling awal sebelum aset, supaya user langsung melihat konten utama.
*   **Lazy Loading**:
    *   **Target**: Gambar Portfolio dan Aktivitas (yang berada di bawah lipatan layar/below the fold).
    *   **Teknik**: Ditambahkan atribut `loading="lazy"` dan `decoding="async"`.
    *   **Tujuan**: Gambar baru didownload saat user melakukan scroll mendekati gambar tersebut, menghemat bandwidth awal.
*   **Format**: Disarankan mengupload gambar dalam format `.webp` ke Supabase Storage untuk ukuran file minimal.

## 5. JavaScript Minimization (Code Splitting)
Aplikasi React Single Page Application (SPA) seringkali memiliki bundle JS awal yang sangat besar. Kita mengatasinya dengan **Code Splitting**.

*   **Implementasi**: Menggunakan `React.lazy()` dan `Suspense` di `App.jsx`.
*   **Cara Kerja**:
    *   Saat user membuka halaman utama (`/`), browser **hanya** mendownload kode `Home.jsx`.
    *   Kode untuk halaman lain (hal `Login`, `Dashboard`, dll) **tidak** didownload sampai user mengklik menu tersebut.
*   **Hasil**: *First Load* menjadi jauh lebih cepat.

## 6. Struktur HTML & SEO
Memastikan kode HTML semantik agar mudah dibaca oleh Google Bot (SEO) dan screen reader (Aksesibilitas).

*   **Heading Structure**: Memastikan hanya ada satu tag `<h1>` per halaman (Judul Hero), diikuti dengan `<h2>` untuk seksi (Projects, Activities).
*   **Alt Text**: Semua gambar dinamis dari database memiliki atribut `alt` yang deskriptif.
*   **Meta Tags**: Komponen `SEO.jsx` memastikan setiap halaman memiliki title dan description yang unik.

## 7. Preload & Fetch Priority
Mengatur prioritas download resource browser.

*   **Preload**: Font dan CSS utama (otomatis dihandle oleh Vite build).
*   **Fetch Priority**: Seperti dijelaskan di poin 4, digunakan untuk gambar LCP.

---

### Cara Verifikasi
Untuk mengecek optimasi ini berjalan:
1.  Buka DevTools (F12) -> Tab **Network**.
2.  Refresh halaman.
3.  Perhatikan:
    *   File JS diload secara bertahap (banyak file kecil vs 1 file raksasa).
    *   Header `Cache-Control` pada file gambar/CSS mununjukkan `max-age=31536000`.
    *   Gambar bawah hanya muncul di Network tab saat Anda scroll ke bawah.
