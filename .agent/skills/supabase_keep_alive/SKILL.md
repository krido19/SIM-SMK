---
name: supabase_keep_alive
description: Panduan implementasi mekanisme Supabase Keep Alive otomatis dengan GitHub Actions dan pemantauan serta tombol manual di Admin Dashboard.
---

# Supabase Keep Alive & Admin Integration

Skill ini berfungsi sebagai panduan standar untuk mengimplementasikan, memperbaiki, atau memahami fitur **Supabase Keep Alive**. Tujuan fitur ini adalah mencegah proyek Supabase masuk ke status "Paused" karena aplikasi dianggap tidak aktif oleh Supabase pada free plan (Free Tier).

## 1. Skema Database (Supabase)

Agar mekanisme keep-alive dapat dipantau dari rekam jejaknya di Dashboard Admin, kita menggunakan tabel `keep_alives` untuk mencatat history "ping" setiap kali proses keep-alive dijalankan.

Kueri untuk membuat tabel:
```sql
CREATE TABLE IF NOT EXISTS public.keep_alives (
  id uuid default gen_random_uuid() primary key,
  check_time timestamp with time zone default timezone('utc'::text, now()) not null,
  method text not null
);
```

> **Catatan Security (RLS)**: Tabel log seperti ini umumnya aman dijalankan **Without RLS** karena hanya mencatat log akses anonim. Jika Anda mengaktifkan RLS, Anda diwajibkan untuk membuat *Policy* yang mengizinkan proses `INSERT` dan `SELECT` secara anonim (public), jika tidak proses ping dari GitHub Actions dan UI Dashboard akan gagal.

## 2. Otomatisasi dengan GitHub Actions (Cron Job)

Supabase menerima sinyal "aktif" melalui interaksi database via akses API (REST/GraphQL). Oleh karena itu, kita memanggil endpoint REST `/rest/v1/keep_alives` setiap 3 hari agar memenuhi aturan batas waktu idle Supabase (biasanya 7 hari inaktif).

**Lokasi file**: `.github/workflows/supabase-keep-alive.yml`
```yaml
name: Supabase Keep Alive

on:
  schedule:
    - cron: '0 0 */3 * *' # Berjalan otomatis setiap 3 hari
  workflow_dispatch: # Mengizinkan dieksekusi secara manual dari UI GitHub

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase REST API
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          curl -X POST "${SUPABASE_URL}/rest/v1/keep_alives" \
            -H "apikey: ${SUPABASE_ANON_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"method": "cron"}'
```

> **Sangat Penting**: Pastikan kunci autentikasi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` telah didaftarkan di halaman web **Repository Settings > Secrets and variables > Actions**. Skrip log akan gagal jika kredensial tidak ditemukan.

## 3. Integrasi UI Admin Dashboard

Menambahkan indikator dan tuas kendali pemicu Keep Alive pada interface Dashboard (misal di halaman `Dashboard.jsx`).

1. **Pengambilan Status Log Terakhir**
   Bisa dilakukan dengan memanggil *query* order-by-desc terbaru. Penggunaan metode `.maybeSingle()` aman agar tidak menyebabkan error (not found) jika tabel tersebut baru dibentuk dan masih kosong.
   ```javascript
   const { data: keepAliveData } = await supabase
       .from('keep_alives')
       .select('*')
       .order('check_time', { ascending: false })
       .limit(1)
       .maybeSingle();
   
   setKeepAlive(keepAliveData);
   ```

2. **Fungsi Trigger Tombol Manual**
   Jika pengguna menekan tombol "Ping Now" di antarmuka Admin (Dashboard), sistem akan menembak metode `'manual'`. Status terakhirnya akan muncul di layar.
   ```javascript
   const triggerManualPing = async () => {
     try {
       const { error } = await supabase.from('keep_alives').insert({ method: 'manual' });
       if (error) throw error;
       toast.success('Database berhasil di-ping!');
       // Panggil kembali block logika nomor (1) di sini untuk me-refresh data tampilan.
     } catch(err) {
       toast.error('Gagal ping database.');
     }
   }
   ```

Akhiri komponen antarmuka dengan memberikan penanda warna atau label tanggal terakhir menggunakan fungsi standar JavaScript `new Date(keepAliveData.check_time).toLocaleString()`.
