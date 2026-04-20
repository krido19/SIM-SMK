# Panduan Lengkap Build APK (PDF Reader App)

> [!IMPORTANT]
> **Catatan Penting (Update UI & Branding):**
> 1. **Logo APK**: Pastikan logo APK sudah sesuai dengan logo web (bukan logo default Capacitor). Ikuti langkah di **Bagian 2** untuk generasi aset visual agar branding konsisten.
> 2. **Navbar di Login**: Tombol navbar wajib ditiadakan pada halaman Login/Register. Ini penting agar UI bersih saat proses masuk aplikasi.
> 3. **Native Only Navbar**: Konfigurasi `Navbar.jsx` harus memastikan navbar hanya muncul di mode APK/Native. Di browser web biasa, navbar harus tetap tersembunyi.
> 4. **Tata Letak & Antarmuka**: Pastikan tombol atau elemen navbar tidak menutupi menu penting atau kolom input. Gunakan penyesuaian CSS responsif (seperti padding keyboard-aware) yang sudah diimplementasikan.
> 5. **Responsivitas Layar (Lebar Web vs Frame APK)**: Pastikan file `App.jsx` menggunakan kerangka `w-full min-h-screen` (LEPAS aturan `max-w-md`). Dengan trik CSS bawaan ini, aplikasi akan merenggang penuh 100% saat dibuka di Desktop PC, namun otomatis menyempit sesuai bingkai layar HP saat di-build menjadi APK tanpa saling merusak antarmuka.
> 6. **Supabase Google OAuth (Deep Linking)**: Jika menggunakan OAuth, Anda WAJIB memastikan 3 hal: Menambahkan `<intent-filter>` di `AndroidManifest.xml` dengan skema unik, mendaftarkan skema tersebut (`contoh.app://login-callback`) ke Supabase Dashboard, dan menyadap kedatangannya melalui `CapacitorApp.addListener('appUrlOpen')` di `App.jsx` (Lihat skill panduan Supabase OAuth untuk detil).
> 7. **Sinkronisasi Realtime & Offline-First (Zombie Data)**: Jika aplikasi memiliki sistem Offline (IndexedDB) bersanding dengan Supabase Realtime, selalu pastikan: (a) Nama tabel di listener WebSocket mutlak *sama* dengan Supabase (cth: `transactions`, bukan `finance`). (b) Tambahkan _Event Listener_ `focus` dan `visibilitychange` di Web agar sinkron seketika saat user bolak-balik tab. (c) `Repository` lokal WAJIB menjalankan algoritma *Deletion Reconciliation* (penyapu Zombie Data/data terhapus di server) **SEBELUM** membuka `.transaction()` IndexedDB untuk menghindari `TransactionInactiveError` yang fatal di HP.


Panduan ini dibuat khusus untuk membantu Anda mengubah source code React/Capacitor ini menjadi file APK yang bisa diinstal di HP Android.

Dokumen ini mencakup  metode:
1.  **Cara Ringan (Terminal)**: Paling cepat, hemat RAM, tidak perlu buka Android Studio.

---

## 1. Persiapan Wajib (Prerequisites)

Before starting, ensure your PC is ready:
1.  **Node.js**: Installed.
2.  **UI Check (CRITICAL)**: Sebelum proses build APK dijalankan, pastikan aplikasi web sudah memiliki komponen navigasi seluler yang sempurna: 
    *   **Bottom Navigation Bar**: Wajib ada untuk memfasilitasi pindah halaman (Home, Tools, History). Tanpa ini, pengguna Android akan terjebak di satu halaman karena back button default WebView kadang tidak dapat diandalkan.
    *   **Top Navigation Bar**: Pastikan aplikasi sudah menyiapkan ruang untuk notch/kamera HP dengan `safe-area-inset-top` di CSS. Status bar HP diatur via `styles.xml` (lihat Bagian 2B) agar warnanya menyesuaikan background aplikasi.
3.  **Android Studio (Setup Wajib)**:
    Install Android Studio, then open **Settings > Languages & Frameworks > Android SDK**.
    *   **SDK Platforms**: Check **Android 15 (UpsideDownCake) / API 35**.
    *   **SDK Tools**: Check **"Show Package Details"** (Bottom Right), then check:
        *   **Android SDK Build-Tools 34.0.0** (Must be exact version!).
        *   **Android SDK Command-line Tools (latest)**.
    *   Click **Apply** and **Accept All Licenses**.

## 2. Persiapan Aset Visual (Wajib Sebelum Build) 🎨

> [!CAUTION]
> **HENTIKAN PROSES JIKA MASIH LOGO CAPACITOR!**
> Jangan lanjutkan Build APK jika Anda belum mengatur nama dan logo kustom aplikasi. Jika aplikasi masih bernama "Daily Task App" atau berlogo Capacitor, selesaikan langkah di bawah ini terlebih dahulu secara keseluruhan.

Sebelum melakukan sinkronisasi *build* web ke Android, pastikan identitas aplikasi Anda (Ikon & Splash Screen) sudah dibuat khusus agar tidak menggunakan logo *default* bawaan Capacitor.

1.  **Ubah Nama Aplikasi (App Name)**: Pastikan Anda telah mengubah `appName` di `capacitor.config.json` dan `app_name` di `android/app/src/main/res/values/strings.xml` menjadi nama kustom Anda (misal: "Catat").
2.  **Siapkan Master Logo**: Tempatkan logo master (format PNG, ukuran 1024x1024) di folder `assets/icon-only.png`.
3.  **Injeksi ke Capacitor Assets**:
    Jalankan perintah ini di terminal untuk meng-generate berbagai ukuran resolusi ikon ke dalam Android:
    ```bash
    npx @capacitor/assets generate --android
    ```
4.  **Hapus Cache Adaptive Icon (SANGAT PENTING!)**:
    Android versi tinggi seringkali memaksakan memuat ikon XML vektor bawaan Capacitor meskipun kita sudah generate ikon PNG kustom. **Anda WAJIB menghapus folder `mipmap-anydpi-v26`** dari proyek Android:
    ```powershell
    Remove-Item -Recurse -Force "android\app\src\main\res\mipmap-anydpi-v26"
    ```
    *Tanpa penghapusan ini, logo APK saat diinstall di HP akan tetap bentuk default Capacitor.*

---

## 2B. Konfigurasi Status Bar Android (Wajib Sebelum Build) 📱

Agar status bar HP (jam, sinyal, baterai) menyatu seamless dengan background aplikasi, lakukan langkah berikut:

1. **Edit `android/app/src/main/res/values/styles.xml`**
   Tambahkan dua item ini ke dalam style `AppTheme.NoActionBar`:
   ```xml
   <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
       <item name="windowActionBar">false</item>
       <item name="windowNoTitle">true</item>
       <item name="android:background">@null</item>
       <!-- Samakan warna status bar dengan background aplikasi (#FAFAFA) -->
       <item name="android:statusBarColor">#FAFAFA</item>
       <!-- Paksa ikon (jam/sinyal/baterai) berwarna gelap agar terbaca di background terang -->
       <item name="android:windowLightStatusBar">true</item>
   </style>
   ```
   Jika warna background aplikasi berubah, sesuaikan nilai `#FAFAFA` di atas.

---

## 3. Cara Build APK 

### Metode A: Build Cepat Anti-Error via Terminal CMD 🚀
**Rekomendasi Utama.** Berdasarkan histori proyek ini, lingkungan terminal lokal seringkali memutus proses *gradle* secara acak (Java Environment Error). Gunakan tata cara mutlak ini menggunakan CMD (Command Prompt), bukan PowerShell, untuk *build* yang 100% stabil.

**Langkah-langkah Wajib:**

1.  **Siapkan Konfigurasi SDK Android:**
    Buka folder `android/` di dalam proyek, buat file bernama `local.properties` (jika belum ada), dan isi lokasi SDK Android Anda. Contoh (Sesuaikan `Administrator` atau nama user PC Anda):
    ```properties
    sdk.dir=C\:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk
    ```
2.  **Siapkan Folder Java Lokal (`jbr_local`):**
    Salin seluruh folder `jbr` bawaan instalasi Android Studio (biasanya di `C:\Program Files\Android\Android Studio\jbr`) dan _paste_ (tempelkan) ke dalam *root* direktori proyek Anda (beri nama `jbr_local`).
3.  **Build React & Sync:**
    ```powershell
    npm run build
    npx cap sync
    ```
4.  **Eksekusi Kompilasi APK (Jalankan di terminal `cmd` biasa):**
    Perintah ini menggunakan trik injeksi `JAVA_HOME` ke folder lokal untuk mengakali cacat *binding* Gradle.
    ```cmd
    cmd /c "set JAVA_HOME=%CD%\jbr_local&& cd android && gradlew.bat clean assembleDebug"
    ```

**Hasil:**
File APK akan muncul di: `android\app\build\outputs\apk\debug\app-debug.apk`

---


Gunakan ini hanya jika cara A gagal atau butuh setting visual (misal: buat tanda tangan/sign APK release).

1.  Jalankan `npx cap open android`.
2.  Tunggu loading "Gradle Sync" selesai.
3.  Menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 3. Masalah Umum & Cara Mengatasinya (Troubleshooting)

### Masalah: "Unsupported Java Version" / "Gradle requires Java X"
**Penyebab:** Terminal VS Code secara default memakai Java sistem (seringkali versi lama/1.8), padahal Gradle terbaru butuh Java 17+.
**Solusi:** Gunakan **Metode A** di atas. Perintah `$env:JAVA_HOME=...` adalah kuncinya. Jangan lupa path-nya harus mengarah ke folder `jbr` di dalam instalasi Android Studio.

### Masalah: "Gradle Sync Failed" (Merah Semua)
**Solusi:**
1.  Pastikan internet lancar (Maven butuh download).
2.  Di Android Studio: **File > Invalidate Caches / Restart**.

### Masalah: APK Tidak Bisa Diinstal
**Penyebab:** Biasanya karena ada APK lama dengan "Signature" berbeda (misal versi Play Store vs versi Debug).
**Solusi:** Uninstall dulu aplikasi lama di HP, baru instal yang baru.

---

## 4. Log Masalah & Solusi Detail (Update: 14 Des 2025)

Berikut adalah catatan detail mengenai masalah yang sering terjadi saat build dan cara mengatasinya secara tuntas.

### A. Masalah Environment Variables & Path (CRITICAL) ⚠️
**Gejala:** Error `JAVA_HOME is set to an invalid directory` atau `Value ... given for org.gradle.java.home Gradle property is invalid`.
**Penyebab:**
1.  **Hardcoded Paths:** File `android/gradlew.bat` atau `android/gradle.properties` seringkali memiliki setting path Java yang "dikunci" (hardcoded) ke direktori komputer orang lain (misal: `C:\Program Files\Microsoft\...`).
2.  **Spasi di Path:** Path seperti `C:\Program Files\...` bisa menyebabkan error di beberapa terminal.

**Solusi Tuntas:**
1.  **Cek `android/gradlew.bat`:** Cari baris yang dimulai dengan `set JAVA_HOME=...`. **Hapus atau Comment (rem)** baris tersebut agar script mengikuti environment komputer Anda, bukan script bawaan.
2.  **Cek `android/gradle.properties`:** Cari baris `org.gradle.java.home=...`. **Berikan tanda #** di depannya untuk menonaktifkannya.
3.  **Trik `jbr_local`:** Jika path `C:\Program Files\Android\Android Studio\jbr` bermasalah karena spasi:
    *   Copy folder `jbr` dari folder installasi Android Studio.
    *   Paste ke dalam folder project Anda (jadi `project/jbr_local`).
    *   Gunakan perintah ini untuk build:
        ```powershell
        $env:JAVA_HOME = (Resolve-Path ".\jbr_local").Path; cd android; .\gradlew.bat assembleDebug; cd ..
        ```

### B. Error `build.gradle` (Keystore Missing)
**Gejala:** Build gagal total dengan pesan error samar atau `path may not be null` di `build.gradle`.
**Penyebab:** Script mencoba membaca file `keystore.properties` untuk signing, tapi file tersebut belum ada (karena Anda masih di tahap Debug, bukan Release).
**Solusi:**
Pastikan blok kode `signingConfigs` di `android/app/build.gradle` di-wrap dengan pengecekan `exists()`:
```gradle
signingConfigs {
    release {
        def keystorePropertiesFile = rootProject.file("keystore.properties")
        def keystoreProperties = new Properties()
        // PENTING: Cek dulu apakah file ada sebelum load!
        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            storeFile = file(keystoreProperties['storeFile'])
            storePassword = keystoreProperties['storePassword']
            keyAlias = keystoreProperties['keyAlias']
            keyPassword = keystoreProperties['keyPassword']
        }
    }
}
```

### C. Android SDK Tidak Ditemukan
**Gejala:** Error `SDK location not found`.
**Penyebab:** Android Studio sudah diinstall, tapi **Setup Wizard** belum dijalankan sampai selesai, sehingga folder `Sdk` belum terdownload.
**Solusi:**
1.  Buka Android Studio.
2.  Jangan langsung tutup. Ikuti wizard sampai dia mendownload Components (SDK Platform, Build-Tools).
3.  Pastikan file `local.properties` di folder `android/` terisi otomatis dengan path SDK, contoh:
    `sdk.dir=C\:\\Users\\NamaUser\\AppData\\Local\\Android\\Sdk`

### D. Perintah "Sakti" untuk Build Bersih 🧹
Jika terminal VS Code terasa aneh atau errornya tidak masuk akal, gunakan **Command Prompt (CMD)** biasa (bukan PowerShell) dengan perintah absolute ini agar yakin 100% environment-nya benar:

1.  Pastikan Anda punya folder `jbr_local` di project (copy dari Android Studio).
2.  Jalankan di terminal:
    ```cmd
    cmd /c "set JAVA_HOME=%CD%\jbr_local&& cd android && gradlew.bat clean assembleDebug"
    ```
    *(Perintah `clean` penting untuk membuang cache error lama)*

### E. Masalah Lisensi (License Not Accepted) 🛑
**Gejala:** Error panjang `Failed to install ... licences have not been accepted` untuk `build-tools` atau `platforms`.
**Penyebab:** Anda belum menyetujui perjanjian lisensi (EULA) dari komponen SDK yang dibutuhkan project. Lisensi ini **tidak bisa** di-bypass lewat terminal saja jika versinya spesifik.
**Solusi:**
1.  Buka **Android Studio**.
2.  Masuk ke **SDK Manager** > **SDK Tools**.
3.  Centang **"Show Package Details"**.
4.  Cari versi yang diteriaki error (misal: `Build-Tools 34.0.0`).
5.  Centang, Apply, dan klik **Accept License**.

### F. Masalah `local.properties` (Path Error)
**Gejala:** Error `SDK location not found` padahal path sudah benar, atau error syntax.
**Penyebab:**
1.  File `android/local.properties` tidak ada (karena di-ignore git).
2.  Ada **spasi** di akhir path atau format backslash `\` salah.
**Solusi:**
Buat file `android/local.properties` manual isinya baris ini (sesuaikan user name):
```properties
sdk.dir=C\:\\Users\\NamaUser\\AppData\\Local\\Android\\Sdk
```
*(Perhatikan double backslash `\\` dan titik dua `\:` yang di-escape)*

### G. FAQ: "Kok Build-nya Lama Banget?" ⏳
**Jawab:** Wajar, apalagi di Windows. Berikut alasannya:
1.  **Download Awal:** Saat pertama kali build (atau setelah `clean`), Gradle mendownload ratusan MB dependencies dan Gradle distribution itu sendiri.
2.  **Gradle Daemon:** Proses background ini butuh waktu untuk "pemanasan". Build kedua biasanya 10x lebih cepat.
3.  **Antivirus (Windows Defender):** Ini musuh utama performa build. Defender scan setiap file `.class` yang digenerate.
    *   *Tips:* Exclude folder project ini dari Windows Defender jika ingin ngebut.
4.  **Hardware:** Android build sangat boros CPU & RAM.
