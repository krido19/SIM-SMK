---
description: Panduan arsitektur sistem Multi-Theme dinamis menggunakan teknik Global CSS Parent Override yang terpusat.
---

# Definisi & Tujuan
Panduan (*Skill / Workflow*) ini menetapkan standar arsitektur dalam pembuatan fitur ganti warna/tema jamak (Multi-Theme) atau *Design System* di dalam aplikasi.

Metode *Global CSS Parent Override* digunakan karena jauh lebih mudah di-maintain dan efisien dibanding merombak masing-masing komponen. Dengan metode ini, kita menempatkan *prefix class* khusus pada tingkat teratas (contoh: `<html class="ds-flat">`) yang seketika menimpa (*override*) wujud komponen di bawahnya seperti *border*, *shadow*, hingga pewarnaan.

---

# Prosedur Pelaksanaan untuk Agent

Jika pengguna meminta Anda untuk menerapkan "Tema", "Mode Warna", atau "Design System" pada proyek baru atau lama, ikuti langkah wajib ini:

### 1. Konfirmasi Scope & Jumlah Tema
Sebelum menulis kode inti, tanyakan ke pengguna:
> "Berapa banyak tema visual yang ingin kita siapkan sejak awal? Apa saja karakter dari tiap-tiap tema tersebut? (Misal: 1 tema minimalis flat, 1 tema geometric tebal, dsb)."

### 2. Register Data Tema via Context / State
Buat atau perluas `ThemeContext` (atau sistem Global State lainnya) yang mendistribusikan konfigurasi tema:
- Simpan ID tema ke dalam array opsi yang statis (contoh `designSystems`).
- Sediakan fungsi untuk `setDesignSystem` yang juga menyimpannya di mekanisme memori (seperti `localStorage` atau *database user*).

**Contoh Context Sederhana**:
```javascript
const designSystems = [
    { id: 'bauhaus', name: 'Bauhaus Classic' },
    { id: 'flat', name: 'Flat Design' },
    { id: 'playful', name: 'Playful Geometric' }
]
```

### 3. Injeksi Class Tingkat Root (Root-Level Injection)
Pastikan `ThemeContext` menginjeksi pergantian ID tema (*class*) ini secara langsung ke document root:
```javascript
useEffect(() => {
    const root = document.documentElement
    // Bersihkan opsi lama
    root.classList.remove('ds-bauhaus', 'ds-flat', 'ds-playful')
    // Terapkan opsi baru
    root.classList.add(`ds-${designSystem}`)
}, [designSystem])
```

### 4. Terapkan Global Override di File CSS Tertinggi (`index.css` atau `globals.css`)
Alih-alih mencari semua tombol dan menghapus properti shadow satu-per-satu di file React, gunakan fleksibilitas CSS Cascading untuk menimpa class utility secara global:
```css
/* Contoh: Tema Flat menghapuskan bayangan secara instan di mana pun komponen itu ada */
.ds-flat [class*="shadow-"] {
  box-shadow: none !important;
  border-radius: 8px !important;
}

/* Contoh: Tema Playful memodulasi bantalan shadow dan menambah kelengkungan */
.ds-playful [class*="shadow-"] {
  box-shadow: 8px 8px 0px 0px #E2E8F0 !important;
  border-radius: 20px !important;
}
```
*Pastikan selektornya generik (seperti `[class*="border"]` atau `[class*="shadow"]`) agar bisa berdampak pada elemen `<button>`, `<div>`, `<form>`, dan tag HTML lainnya secara merata.*

### 5. Bangun Fitur "TRUE Live Preview"
Saat membuat UI halaman Pengaturan Tema, implementasikan mekanisme perpindahan tema instan:
- Begitu pengguna menavigasi ke pilihan tema (seperti menekan/menyentuh di daftar/list item opsi), fitur harus MEMANGGIL state *Setter* di tingkat Global.
- Hal ini akan menghasilkan *Live Preview* skala sistem (seluruh navbar, header, button di layar akan langsung berotasi gaya bentuknya seketika).
- Jika pengguna menekan tombol "Batal / Kembali", sistem harus mengembalikan state *Setter* Global ke opsi *awal* sebelum layar tersebut dibuka.

---

Dengan mengikuti pola asitektur di atas, penambahan lebih dari sekedar sekedar *dua tema* kedepannya hanyalah soal menambahkan `<nama tema baru>` ke array konteks, lalu mendeklarasikan satu atau dua baris prefix *CSS override* global di `index.css` tanpa harus menyentuh lusinan *React Component* lagi!
