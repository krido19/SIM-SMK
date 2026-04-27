 ---
name: obsidian_excalidraw_mermaid
description: Panduan dan spesifikasi ketat membuat diagram Mermaid yang kompatibel (anti-error) untuk dirender otomatis di Obsidian Excalidraw plugin.
---

# Skill: Obsidian Excalidraw Mermaid Parser Compatibility

Ketika *USER* meminta bantuan untuk membuatkan kerangka, alur, atau arsitektur sistem khusus untuk ditaruh ke dalam **Obsidian Excalidraw plugin**, **JANGAN** pernah mencoba menghasilkan kode JSON Mentah berformat `.excalidraw` karena risiko kerusakannya sangat tinggi akibat kebutuhan input titik koordinat silang (x/y).

Pendekatan paling tepat dan didukung secara resmi adalah dengan menghasilkan **Kode Mermaid**. Namun, ingatlah bahwa modul *parser* internal Excalidraw memiliki limitasi dan cukup rapuh. Ikuti hukum *styling* di bawah ini dengan ketat:

## 1. Aturan Sintaks Anti-Error (Sangat Penting)
- **Awali dengan `flowchart TD` atau `flowchart LR`.** Hindari pemakaian `graph TD` karena fitur `graph` kurang kompatibel dengan Excalidraw versi standar. Note: Excalidraw baru mendukung fitur Flowchart, Sequence, Class, dan ER.
- **DILARANG menggunakan `classDef` dan pemetaan kelas inline seperti `::: classSaya`.** Excalidraw merender komponen Mermaid menjadi balok dan garis gambar (hand-drawn) aslinya sendiri secara *native*. Adanya pengaturan CSS atau warna otomatis akan membuat modul membacanya sebagai Syntax Error.
- **Gunakan bentuk Node sederhana.** Gunakan kurung siku `["Teks Anda"]` untuk kotak standar, kurung gelombang `{"Sistem Keputusan"}` untuk belah ketupat, dan kombo `(["Awal/Akhir"])` untuk tabung elips lonjong.
- **Haram menggunakan `(("Teks"))`** untuk simpul bulat berganda, karena tanda kutip di dalam kurung bulat ganda (`(( ))`) di parser Excalidraw sering kali menyebabkan *crash*/*Syntax error*.
- Usahakan emoji/ikon dan teks bahasa Indonesia berada di dalam tanda kutip standar dan dibungkus kurung utama `["Seperti Ini"]`.

## 2. Standar Respons (Cara Menjawab USER)
Selain memberikan kode yang bersih secara sintaks, Anda Wajib melampirkan petunjuk *copy-paste* berbunyi:

1. Klik tombol **File Baru Excalidraw** di bar kiri aplikasi Obsidian.
2. Setelah kanvas papan putih / hitam merespons, tekan tombol `Ctrl + P` di (*Command Palette*).
3. Cari dan jalankan alat **"Excalidraw: Insert Mermaid"**.
4. Hapus dan timpa teks yang sudah ada dengan kode Mermaid bersih ini.
5. Tekan **Insert** untuk men-generate kotaknya seketika.
