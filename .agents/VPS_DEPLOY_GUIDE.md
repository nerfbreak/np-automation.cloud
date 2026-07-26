# VPS Deployment Guide — epic-mendeleev (NP Automation)

> Dokumen ini mencakup: first-time setup, cara jalanin, update/deploy ulang, monitoring, dan troubleshooting.

---

## Prerequisites di VPS

Pastikan semua ini sudah terinstall di VPS sebelum lanjut:

```bash
# Check Node.js (butuh v18+)
node --version

# Check npm
npm --version

# Check PM2
pm2 --version

# Check Redis (wajib untuk BullMQ)
redis-cli ping   # Harus jawab PONG

# Check Git
git --version
```

Kalau Redis belum jalan:
```bash
sudo systemctl start redis
sudo systemctl enable redis   # auto-start saat reboot
```

---

## First-Time Setup di VPS

### 1. Clone Repository
```bash
cd /home/rizki
git clone <your-repo-url> np-automation
cd np-automation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Playwright Browsers
```bash
# Wajib dijalankan sekali — download Chromium binary
npx playwright install chromium

# Kalau ada error dependency system:
npx playwright install-deps chromium
```

### 4. Buat File `.env.local`
```bash
cp .env.example .env.local
nano .env.local
```

Isi semua nilai yang dibutuhkan:
```env
# Newspage Portal
NEWSPAGE_URL=https://rb-id.np.accenture.com/RB_ID/Logon.aspx

# Bot settings — di VPS HARUS true
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT_MS=60000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=sb_secret_...

# Encryption (64 hex chars = 32 bytes untuk AES-256)
ENCRYPTION_KEY=ce15b3de...

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Telegram Notifications
TELEGRAM_BOT_TOKEN=8269241555:AAHuPl...
TELEGRAM_CHAT_ID=8686752536
```

### 5. Build Next.js
```bash
npm run build
```

### 6. Buat Log Directory
```bash
mkdir -p /home/rizki/logs
```

### 7. Start dengan PM2
```bash
# Start semua apps dari ecosystem config
pm2 start ecosystem.config.js

# Save PM2 config agar auto-start setelah reboot VPS
pm2 save
pm2 startup   # ikuti instruksi yang muncul
```

---

## Cara Jalankan (Setelah Setup)

PM2 mengelola **dua proses** yang harus jalan bersamaan:

| PM2 App | Perintah | Fungsi |
|---|---|---|
| `np-web` | `npm start` | Next.js UI + API Routes (port 3000) |
| `np-worker` | `npm run worker` | BullMQ worker — eksekusi Playwright bot |

```bash
# Cek status kedua proses
pm2 status

# Output yang diharapkan:
# ┌─────┬────────────┬─────────┬──────┬────────┐
# │ id  │ name       │ status  │ cpu  │ memory │
# ├─────┼────────────┼─────────┼──────┼────────┤
# │ 0   │ np-web     │ online  │ 0%   │ 120MB  │
# │ 1   │ np-worker  │ online  │ 0%   │ 80MB   │
# └─────┴────────────┴─────────┴──────┴────────┘
```

**PENTING**: Kalau salah satu `status` bukan `online`, bot tidak akan jalan.

---

## Deploy Update (Setelah Ada Perubahan Code)

Gunakan script `deploy.sh` yang sudah ada:

```bash
cd /home/rizki/np-automation
bash deploy.sh
```

Script ini akan:
1. `git pull origin master` — ambil kode terbaru
2. `npm install` — update dependencies kalau ada yang baru
3. `npm run build` — build Next.js
4. `pm2 restart np-web np-worker` — restart **hanya jika build berhasil**

> ⚠️ Jangan pernah jalankan `pm2 restart` manual tanpa `npm run build` dulu — bisa-bisa deploy code rusak dan bot mati.

---

## Monitoring & Logs

### Cek Status Real-time
```bash
pm2 status          # Overview semua proses
pm2 monit           # Dashboard RAM/CPU real-time
```

### Lihat Logs
```bash
# Log Next.js (UI + API errors)
pm2 logs np-web --lines 100

# Log Worker (bot execution logs)
pm2 logs np-worker --lines 100

# Atau baca file log langsung:
tail -f /home/rizki/logs/worker-out.log
tail -f /home/rizki/logs/worker-error.log
```

### Cek Redis Queue
```bash
# Lihat berapa job pending di queue
redis-cli LLEN bull:inventory-adjustment-queue:wait

# Lihat job yang sedang berjalan
redis-cli LLEN bull:inventory-adjustment-queue:active
```

---

## Troubleshooting

### ❌ `np-worker` status `errored` / terus restart

```bash
# Lihat error terakhir
pm2 logs np-worker --err --lines 50
```

Penyebab umum:
- **`ENCRYPTION_KEY environment variable is not set`** → Cek `.env.local`, pastikan key ada
- **`Cannot connect to Redis`** → Jalankan `redis-cli ping`, pastikan Redis running
- **`Playwright: browser not found`** → Jalankan `npx playwright install chromium` ulang

### ❌ Bot timeout / gagal login Newspage

```bash
# Cek log worker untuk detail error
pm2 logs np-worker --lines 200
```

Penyebab umum:
- `waitUntil: networkidle` timeout → VPS network lambat, naikkan `PLAYWRIGHT_TIMEOUT_MS=120000`
- `INTF_ID_Value` tidak ditemukan → Newspage mungkin update UI lagi, cek selector
- Screenshot dikirim ke Telegram saat error — cek chat Telegram untuk screenshot debug

### ❌ Job masuk queue tapi tidak dieksekusi

```bash
# Pastikan np-worker running
pm2 status

# Pastikan Redis bisa diakses
redis-cli ping

# Lihat apakah ada job stuck
redis-cli LRANGE bull:inventory-adjustment-queue:active 0 -1
```

### ❌ `502 Bad Gateway` dari Nginx

```bash
# Cek apakah np-web masih running
pm2 status np-web

# Restart kalau mati
pm2 restart np-web

# Cek apakah port 3000 listening
ss -tlnp | grep 3000
```

### ❌ OOM / VPS kehabisan RAM

```bash
# Cek RAM usage
free -h

# Cek proses yang makan RAM
pm2 monit

# Force kill semua browser yang mungkin stuck
pkill -f "chromium"

# Restart worker (browser pool akan reset)
pm2 restart np-worker
```

---

## Nginx Config (Kalau Pakai Nginx Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Disable buffering untuk SSE (Server-Sent Events)
    # Tanpa ini, log streaming di UI tidak akan real-time
    location /api/inventory/extract {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve screenshot files langsung dari Nginx (lebih efisien)
    location /screenshots/ {
        alias /home/rizki/np-automation/public/screenshots/;
        expires 1h;
    }
}
```

---

## Summary: Quick Commands

```bash
pm2 status                    # Cek status semua proses
pm2 logs np-worker --lines 50 # Lihat log bot terbaru
pm2 restart np-worker          # Restart worker (reset browser pool)
pm2 restart np-web             # Restart Next.js
bash deploy.sh                 # Deploy update dari git
redis-cli ping                 # Cek Redis running
npx playwright install chromium # Reinstall Chromium kalau hilang
```
