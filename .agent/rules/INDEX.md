# AI Agent Memory Index

> **MANDATORY CORE INSTRUCTION FOR AI AGENT:** 
> 1. Do not read all rule files blindly. To conserve token limits and avoid hallucinations, read ONLY the specific files below when the user's task matches the listed topic.
> 2. **MEMORY SAVING**: Always remind/offer the user to run `/save-memory` after solving a complex bug, so you can automatically write the solution to `.agent/rules/`.
> 3. **MEMORY RECALL**: If you lack context or the user asks about past sessions, execute the `/recall <topic>` workflow to search this index and the `claude-mem` database.

## 🗂️ Active Knowledge Base & SOPs (Located in `.agent/rules/`)

- **[APK_BUILD_GUIDE.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/APK_BUILD_GUIDE.md)**
  Consult when handling Android builds, compiling, APK generation, or Android release management.

- **[SEO Shield & Validator.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/SEO%20Shield%20&%20Validator.md)**
  Consult when configuring web meta tags, OpenGraph, routing SEO, or search engine indexing optimizations.

- **[SUPABASE_GOOGLE_AUTH.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/SUPABASE_GOOGLE_AUTH.md)**
  Consult when setting up or troubleshooting Supabase backend and Google OAuth integrations.

- **[advanced_architecture_guide.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/advanced_architecture_guide.md)**
  Consult for general standards regarding scalable app structure, folder layout, and advanced logic separations.

- **[claude-mem-context.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/claude-mem-context.md)**
  Consult to understand the current ongoing active context saved across recent sessions by `claude-mem`.

- **[genymotion_capacitor_dev.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/genymotion_capacitor_dev.md)**
  Consult when deploying or debugging app hybrid previews via Capacitor with Genymotion emulator.

- **[multi_theme_system.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/multi_theme_system.md)**
  Consult when adding/modifying dark mode, light mode, or thematic variables to the UI.

- **[setup_svelte_gemini_chatbot.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/setup_svelte_gemini_chatbot.md)**
  Consult when building Svelte-based AI chat interfaces that interface with Google Gemini.

- **[skill_sim_pkl.md](file:///D:/Antigravity/SIM%20SMK%20HAFIDZ/SIM-SMK/.agent/rules/skill_sim_pkl.md)**
  Consult for all core logic decisions made specifically in the SIM SMK/PKL project folder, including student import mapping, bulk delete logic, and the isolated TUGAS/UTS/UAS grade import system.

- **[vite_vercel_gemini_local_dev.md](file:///D:/Antigravity/Memeori%20chat/claude-mem/.agent/rules/vite_vercel_gemini_local_dev.md)**
  Consult when configuring Vite pipelines, deploying to Vercel, or troubleshooting local dev servers.

---
## 💡 System Commands
- To **save** a newly learned concept from this conversation, use **`/save-memory`**.
- To **retrieve** forgotten knowledge or search past sessions, use **`/recall <topic>`**.
