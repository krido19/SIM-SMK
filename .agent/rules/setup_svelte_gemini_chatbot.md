---
description: Scaffold and Setup a SvelteKit Gemini Chatbot with Premium UI, Store Management, and Function Calling
---

# Setup SvelteKit Gemini Chatbot Workflow

This workflow automatically scaffolds a full-stack SvelteKit application integrated with Google Gemini API, featuring a premium Glassmorphism Chat UI, mock human handoff logic, and function-calling capabilities (Receipt UI).

## Prerequisites
- The target directory should be specified by the user.

## Steps to Execute

// turbo
1. Initialize the SvelteKit minimal project in the target directory:
`npx -y sv create <target-directory> --template minimal --no-types --no-add-ons --no-dir-check --no-download-check --install npm`
Make sure to `cd` into the `<target-directory>` for all subsequent steps.

// turbo
2. Install the Google Generative AI SDK:
`npm install @google/generative-ai`

3. **Create Environment Variables**:
Create `.env.example` and `.env` in the root. The `.env` should contain:
`GEMINI_API_KEY=your_api_key_here`

4. **Global CSS & Styling**:
Create `src/app.css` containing premium CSS Variables (Indigo & Emerald), resets, scrollbar styling, and a `.glass-panel` class for backdrop-filter blur.

5. **State Management**:
Create `src/lib/stores/uiStore.js`:
- Manages `isWidgetOpen`, `isHumanHandoff` (boolean), and `theme` (light/dark).
Create `src/lib/stores/chatStore.js`:
- Manages an array of `messages` objects `{ id, role, content, type, data, timestamp }` and an `isTyping` boolean.

6. **UI Components (`src/lib/components/`)**:
Create the following Svelte components:
- `ChatHeader.svelte`: Top bar of the widget showing Avatar and AI/Human status.
- `MessageBubble.svelte`: Left (bot) and Right (user) chat bubbles.
- `ReceiptCard.svelte`: Special visual card to render receipt/invoice data returned from Gemini's Function Calling.
- `ChatInput.svelte`: Textarea with a send button. It MUST import and connect via fetch to `/api/chat` and update `chatStore.js` and `uiStore.js`.
- `MessageList.svelte`: Scrolls automatically to the bottom. Loops over `chatStore` messages and renders either `MessageBubble` or `ReceiptCard` based on `message.type`.
- `ChatWidget.svelte`: The main container that toggles visibility via a floating action button (FAB). Uses Svelte transitions (`fly`, `scale`).

7. **Backend API Route (`src/routes/api/chat/+server.js`)**:
Implement a `POST` handler utilizing `@google/generative-ai`.
- System Instruction should instruct the model to act as a Customer Service Agent.
- Implement Function Calling definitions (Tools) for `calculate_receipt` with arguments like `items` array, `subtotal`, `discount`, and `total`.
- Format the frontend message history to map into Gemini's `user` and `model` role structure. Deduplicate consecutive roles to avoid API 500 errors.
- Target `gemini-2.5-flash` for the best model compatibility.
- Return the exact function arguments (JSON) if the model decides to trigger `calculate_receipt`, or return raw text.

8. **Application Assembly**:
- Override `src/routes/+layout.svelte` to import `../app.css`.
- Override `src/routes/+page.svelte` to build a landing page that mounts `<ChatWidget />`. Includes a Theme Switcher button.

9. Report Completion: Notify the user that the Chatbot infrastructure is successfully laid out and remind them to populate the `.env` file with a real API key.

## Future Expansion Suggestions
When running this skill, if the user asks for advanced features, you can extend this boilerplate with:
- **Streaming Mode**: Change `generateContent` to `generateContentStream` and implement Server-Sent Events (SSE) to display responses character-by-character.
- **Data Persistence**: Integrate Supabase or Firebase local stores to save the `chatStore` array, allowing chat histories to survive page reloads.
- **RAG Integration**: Before hitting Gemini, implement a vector search query to fetch real-world shop products to inject into the AI's prompt for factual pricing.

---

## ⚠️ Catatan Khusus: Integrasi Gemini di Catat! (React + Vite + Capacitor)

Bagian ini mendokumentasikan masalah nyata yang ditemui saat mengintegrasikan Gemini AI ke dalam aplikasi **Catat!** (`C:\Antigravity\Catat\Catat`). Bacalah ini sebelum mengubah apapun yang berhubungan dengan `GeminiService.js` atau `AIChat.jsx`.

### ❌ Masalah #1: Model Tidak Ditemukan (404)

**Pesan error:** `models/gemini-1.5-flash is not found for API version v1beta`

**Penyebab:** Model `gemini-1.5-flash` sudah tidak didukung di API v1beta.

**Solusi:** Selalu gunakan **`gemini-2.5-flash`** (bukan `gemini-1.5-flash` atau `gemini-2.0-flash`). Update di **dua** tempat di `GeminiService.js`:
```js
// generateResponse()
model: 'gemini-2.5-flash'

// analyzeData()
model: 'gemini-2.5-flash'
```

---

### ❌ Masalah #2: Error Kuota (429) — "Quota Exceeded"

**Pesan error:** `Error: Batas limit AI (Quota) tercapai.`

**Penyebab utama:** AI Insight di Home page otomatis memanggil Gemini setiap kali halaman dimuat — sangat boros kuota.

**Solusi yang diterapkan:**
1. **AI Insight di Home.jsx dibuat opt-in** (harus klik tombol "Analisis" — tidak auto-load).
2. **Caching dengan hash data** — key cache berisi `user.id + tanggal + hash(data)`. Jika data tidak berubah, tidak ada API call baru.
3. **API Key per-user** — tersimpan di `localStorage` dengan key `gemini_api_key`. User memasukkannya sendiri di halaman Profile. `GeminiService.js` membaca dari `localStorage` terlebih dahulu, baru fallback ke `.env`.

```js
// GeminiService.js — cara baca API key:
const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY
```

---

### ❌ Masalah #3: Error "First content should be with role 'user'"

**Penyebab:** Riwayat chat yang dikirim ke Gemini dimulai dengan pesan dari role `model`, atau ada dua pesan berurutan dari role yang sama.

**Solusi di `AIChat.jsx`:**
- Filter history sehingga pesan pertama selalu role `user`.
- Hapus duplikat pesan berurutan dari role yang sama sebelum dikirim ke API.

```js
// Deduplicate consecutive roles
const cleanHistory = history.filter((msg, i) =>
  i === 0 || msg.role !== history[i - 1].role
)
// Ensure first message is always 'user'
const safeHistory = cleanHistory[0]?.role === 'model'
  ? cleanHistory.slice(1)
  : cleanHistory
```

---

### ✅ Fitur yang Sudah Bekerja dengan Baik

- **System Instruction** di `GeminiService.js` sudah menyertakan konteks aplikasi Catat! sehingga AI tahu ia adalah asisten untuk mencatat, tugas, dan keuangan.
- **Context Injection** di `AIChat.jsx` — setiap request menyertakan data user (jumlah catatan, tugas aktif, dll.) secara otomatis.
- **AI Key Input di Profile** — user bisa memasukkan API key sendiri tanpa perlu ubah `.env`.

---

### 📁 File Kunci

| File | Fungsi |
|---|---|
| `src/repositories/GeminiService.js` | Service utama Gemini (model, system instruction, caching, vision scanner) |
| `src/pages/AIChat.jsx` | Chat UI + context injection + history formatting |
| `src/pages/Home.jsx` | AI Insight opt-in + caching |
| `src/pages/Profile.jsx` | Input & simpan API key ke localStorage |
| `src/pages/Expenses.jsx` | Trigger `scanReceipt`, ambil foto Capacitor, regex extractor JSON |

---

### 🤖 Fitur AI Receipt Scanner (Vision API)

Aplikasi Catat! menggunakan kapabilitas vision dari `gemini-2.5-flash` untuk memindai struk fisik dan mengubahnya menjadi transaksi yang terstruktur.

**Tips Implementasi:**
1. **Pengiriman Foto (Base64):**
   Gunakan properti `inlineData` dengan tepat tanpa prefix tambahan.
   ```javascript
   const imageParts = [{
      inlineData: { data: base64Data, mimeType: "image/jpeg" }
   }];
   const result = await model.generateContent([prompt, ...imageParts]);
   ```

2. **Prompt JSON yang Ketat (Strict Formatting):**
   Wajibkan AI mengembalikan HANYA format JSON tanpa awalan/akhiran obrolan. Berikan contoh field eksplisit yang wajib diisi seperti `amount`, `category`, dan multiline `description`.

3. **Fallback Regex Extractor:**
   Meski diinstruksikan hanya JSON, Gemini seringkali membocorkan string seperti ` ```json `. Gunakan *regex* `aiText.match(/\\{[\\s\\S]*\\}/)` untuk memanen murni *object*-nya sebelum melakukan `JSON.parse()`.
