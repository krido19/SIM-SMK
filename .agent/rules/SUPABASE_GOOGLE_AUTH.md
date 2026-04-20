---
description: Panduan Lengkap Konfigurasi Google Auth dengan Supabase & Vercel / React
---

# Panduan Setup Google OAuth + Supabase

Guide ini menjelaskan langkah-langkah mutlak yang dibutuhkan untuk mengonfigurasi autentikasi Google menggunakan Supabase, khusus untuk aplikasi React/Vite yang dideploy ke Vercel atau dijalankan secara lokal (localhost).

## Bagian 1: Mendapatkan Kunci Google (Google Cloud Console)
1. Buka [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Buat atau pilih **Project** Anda (Tidak memerlukan kartu kredit jika dalam _Free Tier_ standard).
3. Jika belum pernah, pergi ke menu **OAuth consent screen** (atau **Google Auth Platform** di UI baru). 
   - Pilih **External**.
   - Isi **App name** (contoh: "React App Ku") dan **User support email**.
   - Simpan dan ikuti layar sampai selesai (Finish).
4. Kembali ke **Credentials** > Klik **Create Credentials** > Pilih **OAuth client ID**.
5. Pilih **Application type** -> `Web application`.
6. Fokus pada kotak **Authorized redirect URIs**. Tambahkan URL Callback persis dari Supabase Anda. Bentuknya selalu berakhiran `/auth/v1/callback`.
   - *Contoh:* `https://[PROJECT-REF].supabase.co/auth/v1/callback`
7. Klik **Create**. Anda akan melihat **Client ID** dan **Client Secret**. Jangan tutup layarnya dulu, *copy* dua teks tersebut.

## Bagian 2: Menghubungkan ke Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Pergi ke proyek Anda -> **Authentication** -> menu **Providers**.
3. Cari **Google** di dalam daftar, lalu jalankan *toggle* hijau menjadi aktif.
4. Di kolom **Client ID**, *paste*-kan `Client ID` dari Google Cloud tadi.
5. Di kolom **Client Secret**, *paste*-kan `Client Secret` dari Google Cloud tadi.
6. Klik **Save**.

## Bagian 3: Konfigurasi Keamanan URL Redirect (Wajib agar tidak Error 404!)
Supabase wajib tahu ke domain mana ia harus melemparkan user kembali usai login sukses di Google.
1. Masih di **Authentication**, masuk ke menu **URL Configuration**.
2. Fokus ke **Site URL**. Izinkan URL _base_ aplikasi Anda berada di sini HANYA domain utamanya.
   - PENGGUNAAN LOKAL: `http://localhost:5173`
   - PENGGUNAAN VERCEL: `https://[NAMA-APP-ANDA].vercel.app` (Contoh: `https://catat-app.vercel.app`)
   - **Penting:** Pastikan TANPA tanda bintang (`*`) dan tanda miring garis `/` di akhir Site URL!
3. Fokus ke kotak di bawahnya, yakni **Redirect URLs**. Di sinilah format URL yang dibolehkan untuk kepulangan *(return trip)* divalidasi.
   - Tambahkan: `http://localhost:5173/*`
   - Tambahkan: `https://[NAMA-APP-ANDA].vercel.app/*`
4. Tekan **Save**.

## Bagian 4: Penanganan Error React Router di Vercel (Penting!)
Jika web React/Vite dideploy di Vercel, *redirect* OAuth dengan format hash (ex: `/#access_token=...`) bisa memicu _Error 404_ jika setting server salah.
Pastikan pembuatan file bernama `vercel.json` di *root directory* (sebelah package.json) menggunakan kode sakti ini:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Lalu silakan lakukan Git Commit dan *Push* ulang agar file ini terbaca oleh Vercel. Mengimplementasikan keempat pilar panduan ini menjamin sistem Google Auth Anda akan sempurna masuk dan terdistribusi ulang oleh Router React pada perangkat / aplikasi web apa pun.

## Bagian 5: Penanganan OAuth Khusus Build APK Android (Deep Linking)
Jika aplikasi ini di-build menjadi APK menggunakan Capacitor, proses OAuth Google akan melempar pengguna ke Browser Eksternal (Chrome) dan gagal kembali ke dalam aplikasi secara default. Pastikan 3 hal ini diimplementasikan:

1. **Tambahkan Intent Filter di `AndroidManifest.xml`**
```xml
<!-- Custom URL Scheme untuk Supabase OAuth -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <!-- Ganti io.dailytask.app dengan Package ID APK/App Anda -->
    <data android:scheme="io.dailytask.app" android:host="login-callback" />
</intent-filter>
```

2. **Daftarkan Skema tersebut ke Supabase Dashboard Redirect URLs**
Pastikan URL ini ditambahkan ke kotak Redirect URLs: `io.dailytask.app://login-callback`

3. **Tangkap Token Hash dari Browser ke Capacitor WebView (`App.jsx`)**
```javascript
import { App as CapacitorApp } from '@capacitor/app'
// ...
CapacitorApp.addListener('appUrlOpen', (event) => {
    try {
        const incomingUrl = new URL(event.url);
        // Membedah Hash dari URL Intent untuk direlay ke localhost WebView
        if (incomingUrl.hash && (incomingUrl.hash.includes('access_token=') || incomingUrl.hash.includes('refresh_token='))) {
            window.location.replace(window.location.origin + '/' + incomingUrl.hash);
        }
    } catch (err) {
        console.error('Error', err)
    }
})
```
Implementasi tiga pilar ini menjamin Aplikasi APK kembali mulus membawa Authorization Hash ke dalam `AuthContext` WebView-nya.
