# NP Automation

> Platform otomasi internal IT untuk manajemen stok, distribusi, dan pelaporan — dibangun di atas Next.js + Playwright + Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)
![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?logo=playwright)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis)

---

## 📋 Tentang Proyek

**NP Automation** adalah platform internal berbasis web yang dirancang untuk mengotomasi proses operasional IT, khususnya pada alur kerja penyesuaian stok distributor melalui portal Newspage. Sistem ini menggantikan proses manual yang memakan waktu dengan pipeline otomatis berbasis antrian yang berjalan di background.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🤖 **Bot Stok Adjustment** | Otomasi input stok via Playwright Chromium ke portal Newspage |
| 📋 **Task Management** | Manajemen task dengan status real-time dan queue berbasis Redis/BullMQ |
| 📊 **Report & Audit Log** | Laporan eksekusi lengkap dengan riwayat audit |
| 📱 **Notifikasi Telegram** | Auto-kirim screenshot + summary ke bot Telegram setelah task selesai |
| 🔐 **Autentikasi Aman** | Login berbasis Supabase Auth + proteksi brute-force (5 attempt = lock 10 menit) |
| 👥 **Multi-user** | Support multiple user dengan role management |
| 🗂️ **Master Data** | Manajemen SKU exceptions, multipliers, dan kredensial distributor |
| ⏰ **Scheduler** | Penjadwalan task otomatis |
| 🌙 **Dark Mode** | Full dark/light mode support |

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16.2, React 19, TypeScript 5 |
| **UI Components** | shadcn/ui, Radix UI, Tailwind CSS 4 |
| **Database & Auth** | Supabase (PostgreSQL + Auth) |
| **Automation** | Playwright Chromium (headless) |
| **Queue / Worker** | BullMQ + Redis |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Process Manager** | PM2 (production) |
| **Reverse Proxy** | Nginx |
| **CDN / DDoS Shield** | Cloudflare |

---

## 🚀 Cara Menjalankan (Development)

### Prerequisites
- Node.js 20+
- Redis (running di `localhost:6379`)
- Supabase project
- File `.env.local` terisi lengkap

### Setup
```bash
# Clone repository
git clone https://github.com/nerfbreak/np-automation.cloud.git
cd np-automation.cloud

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Copy contoh env dan isi nilainya
cp .env.example .env.local

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Environment Variables
Buat file `.env.local` dengan variabel berikut:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Newspage credentials (untuk bot)
NEWSPAGE_URL=
```

---

## 🏭 Deployment (Production)

Lihat panduan lengkap deployment ke VPS Ubuntu 22.04 di dokumentasi internal.

**Stack produksi:** Ubuntu 22.04 · Nginx · PM2 · Redis · Cloudflare · Certbot SSL

---

## 📁 Struktur Proyek

```
src/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/                # API endpoints
│   │   ├── auth/           # Login / Logout
│   │   ├── inventory/      # Eksekusi & ekstraksi stok
│   │   └── ...
│   ├── tasks/              # Halaman daftar task
│   ├── report/             # Halaman laporan
│   ├── master-data/        # Manajemen master data
│   └── login/              # Halaman autentikasi
├── components/             # Komponen React
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout (Sidebar, Header, Shell)
│   └── data-display/       # DataTable, dll
├── lib/                    # Utilities & core logic
│   ├── newspage-bot.ts     # Playwright automation bot
│   ├── worker-setup.ts     # BullMQ worker
│   ├── queue.ts            # Redis queue setup
│   └── supabase.ts         # Supabase client
└── proxy.ts                # Next.js route protection middleware
```

---

## 👥 Tim

Dikembangkan oleh tim IT Internal — untuk keperluan operasional internal.  
**Tidak untuk distribusi publik.**

---

## 📄 Lisensi

Proprietary — Internal Use Only. All rights reserved.
