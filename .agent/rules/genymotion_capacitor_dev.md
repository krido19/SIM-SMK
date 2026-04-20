---
description: Capacitor Android Live Reload workflow using Genymotion
---
# Genymotion + Capacitor Live Reload Workflow

This workflow sets up hot-reloading for Capacitor Android apps using Genymotion emulator, avoiding the need to rebuild the APK manually on every change.

## 1. Persiapan Emulator Genymotion
1. Buka aplikasi Genymotion.
2. Jika belum ada device, tambahkan virtual device baru (ikon **+** / Add).
3. Jalankan virtual device (tekan tombol **Play/Start**).
4. Pastikan emulator Android sudah menyala dan masuk ke layar utama.
5. Verifikasi koneksi adb dari Genymotion dengan melihat judul jendela Genymotion (Biasanya memiliki IP target seperti: `192.168.56.101:5555`).

## 2. Server Dev Vite (Host Mode)
Agar emulator bisa membaca file dari komputer host, jalankan dev server dalam mode host.
1. Cek IPv4 komputer Anda lewat terminal (menjalankan perintah `ipconfig`). 
   (Contoh IP: `192.168.101.169`)
2. Jalankan perintah ini:
   ```bash
   npm run dev -- --host
   ```
   *(Biarkan terminal ini berjalan di latar belakang)*

## 3. Konfigurasi `capacitor.config.json`
Modifikasi file konfigurasi Capacitor untuk "menembak" dev server Vite secara langsung.

```json
{
  "appId": "io.dailytask.app",
  "appName": "Catat",
  "webDir": "dist",
  "server": {
    "url": "http://<IP_KOMPUTER_ANDA>:5173",
    "cleartext": true
  }
}
```

> [!WARNING]
> **Penting Saat Production:** Saat Anda mau melakukan build "Production / Rilis PlayStore" di masa depan, jangan lupa **hapus** blok `server` tersebut!

## 4. Install & Jalankan di Emulator
Lakukan sinkronisasi Capacitor satu kali untuk menerapkan config server baru:
```bash
npx cap sync android
```

Gunakan terminal PowerShell baru, pastikan variable `JAVA_HOME` sudah didefinisikan dengan benar lalu jalankan instalasinya ke device Genymotion.

```powershell
# Set JAVA_HOME jika belum ada (gunakan JBR bawaan/JDK 17 lokal Anda)
$env:JAVA_HOME="$(Get-Location)\jbr_local"

# Eksekusi Aplikasi
npx cap run android
```

Setelah aplikasi berjalan di Genymotion, **Anda tak perlu lagi mengulangi langkah-langkah di atas**. 
Setiap kali Anda menekan `Ctrl+S` untuk menyimpan file (misal file React `.jsx`), perubahannya akan otomatis berubah seketika (Hot Reload) tanpa mem-build ulang APK!
