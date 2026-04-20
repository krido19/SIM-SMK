---
description: Panduan atau SOP setup Autentikasi Login, Sign Up, dan Lupa Password via Supabase beserta URL Redirect.
---

# Supabase Auth Setup

Panduan ini digunakan untuk mempersiapkan konfigurasi dan fungsi dasar halaman Login, Sign Up, dan Lupa Password menggunakan Supabase. Sesuai instruksi, fokus berada pada implementasi logika dan redirect URL (tanpa membangun/merubah struktur kode HTML halamannya secara langsung).

## 1. Konfigurasi Redirect URL (Supabase Dashboard)
Untuk memastikan *flow* berjalan lancar (khususnya verifikasi email dan reset password), Anda wajib menyesuaikan URL Redirect Auth di Supabase.

1. Buka dashboard proyek Supabase.
2. Akses menu **Authentication** -> **URL Configuration**.
3. Atur **Site URL** ke domain utama (contoh: `http://localhost:3000`).
4. Pada daftar **Redirect URLs**, tambahkan endpoint yang diperlukan, contohnya:
   - `http://localhost:3000/reset-password` (untuk dituju dari email lupa password)
   - `http://localhost:3000/auth/callback` (untuk callback autentikasi lainnya)

*(Catatan: Jangan merubah template struktur HTML pada email Lupa Password dan Sign Up, cukup pastikan parameter redirect URL mengarah ke URL aplikasi yang sesuai).*

## 2. Persiapan Logika Autentikasi (Fungsi Client)

Berikut adalah *boilerplate* logika yang harus disiapkan untuk masing-masing fungsi, tanpa membuat kerangka HTML-nya.

### A. Fungsi Login (Sign In)
Digunakan di halaman masuk utama.
```javascript
const handleLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error login:', error.message);
    return null;
  }
  return data;
};
```

### B. Fungsi Sign Up (Daftar)
Fungsi mendaftarkan pengguna baru dengan email konfirmasi yang dikirimkan Supabase.
```javascript
const handleSignUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Mengarahkan ke URL ini setelah user klik link konfirmasi di email
      emailRedirectTo: `${window.location.origin}/auth/callback`, 
    },
  });

  if (error) {
    console.error('Error sign up:', error.message);
    return null;
  }
  return data;
};
```

### C. Fungsi Lupa Password (Kirim Email Reset)
Memicu email dari Supabase yang mengikutsertakan link menuju form pembaharuan password di aplikasi.
```javascript
const handleForgotPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    // URL halaman UI Anda tempat user bisa memasukkan password barunya
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('Error reset password:', error.message);
    return false;
  }
  return true;
};
```

### D. Fungsi Update Password (Halaman Reset)
Dieksekusi dari dalam halaman `/reset-password` setelah pengguna berhasil dialihkan *dari* kotak masuk email mereka.
```javascript
const handleUpdatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('Error update password:', error.message);
    return false;
  }
  return true;
};
```

## 3. Instruksi Ekstra
- **Hindari HTML**: Fokus pada penyediaan fungsi/skrip, file instruksi ini secara sengaja tidak mendefinisikan UI/HTML untuk Sign Up dan Ganti Password.
- Konfirmasi *state* autentikasi harus ditangani di level klien jika *flow* mewajibkan pemantauan status login (*onAuthStateChange*).
