# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.  
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.3.0] — 2026-07-20

### Added
- 🔐 Sistem autentikasi penuh berbasis **Supabase Auth**
- 🔒 **Anti-brute force protection**: akun dikunci 10 menit setelah 5x gagal login (Redis-backed)
- 👤 4 akun user awal: `rizki` (Superuser), `noval`, `fadli`, `bagus`
- 🚪 Halaman Login (`/login`) dengan UI shadcn/ui + countdown timer saat dikunci
- 🛡️ **Next.js Proxy Middleware** — proteksi semua route, redirect ke `/login` jika belum autentikasi
- 🔓 Tombol **Logout** fungsional di sidebar (hapus session cookie + redirect)
- 👁️ Tampilan nama user login (capitalize) + inisial di sidebar footer
- `POST /api/auth/login` — endpoint login dengan validasi & set HttpOnly cookie
- `POST /api/auth/logout` — endpoint logout dengan hapus cookie
- Warning variant baru di komponen `Alert` shadcn/ui

### Changed
- Kolom **Distributor** di halaman Tasks & Report tidak lagi terpotong (hapus `max-w` & truncate)
- Placeholder field username di halaman login diganti menjadi generik

### Fixed
- Error `useSearchParams()` perlu dibungkus `<Suspense>` di halaman `/data-tools` dan `/automations/new`
- Error export function `middleware` → `proxy` sesuai konvensi Next.js 16.2+
- Import `useRouter`, `useState`, `useEffect` yang hilang di `app-sidebar.tsx`

---

## [0.2.0] — 2026-07-19

### Added
- 📸 Tombol **Copy Gambar** (screenshot hasil eksekusi) di halaman Report
- 📋 Tombol **Salin Teks** dengan format laporan baru (nama distributor lengkap + durasi)
- 📱 **Auto-kirim Telegram** setelah eksekusi selesai — gambar + caption otomatis dikirim ke bot
- Format laporan Telegram: nama distributor + ID, status, durasi eksekusi
- Dukungan mode **Headless Playwright** (browser tidak muncul saat eksekusi)

### Changed
- Format teks laporan: `Stok Adjustment Report` dengan detail distributor & durasi

---

## [0.1.0] — 2026-07-10

### Added
- 🚀 Initial release platform **NP Automation**
- Dashboard utama dengan statistik sistem real-time (CPU, RAM, Uptime)
- Halaman **Tasks** — daftar task dengan DataTable (filter, sort, pagination)
- Halaman **Report** — laporan eksekusi dengan Tooltip keterangan kolom (shadcn/ui)
- Halaman **Inventory Adjustment** — form eksekusi bot stok adjustment
- Halaman **Master Data**:
  - Distributor Credentials
  - SKU Exceptions
  - SKU Multipliers
- Halaman **Schedules** — penjadwalan task
- Halaman **Automations** — builder & template automation
- Halaman **Settings** & **Audit Logs**
- Halaman **Credentials** — manajemen kredensial
- **Bot Playwright** (`newspage-bot.ts`) — otomasi input stok ke portal Newspage
- **Queue System** BullMQ + Redis untuk eksekusi background job
- Sidebar navigasi kolapsibel dengan dark/light mode
- Komponen UI berbasis shadcn/ui (Button, Card, Table, Dialog, Tooltip, dll)
- API routes: `/api/jobs`, `/api/distributors`, `/api/inventory/*`, `/api/audit-logs`

---

## Roadmap

- [ ] Role-based access control (RBAC) — halaman tertentu hanya untuk Superuser
- [ ] Notifikasi in-app (bell icon)
- [ ] Export laporan ke Excel/PDF
- [ ] Dashboard analytics eksekusi per distributor
- [ ] Session management (lihat & revoke sesi aktif)
