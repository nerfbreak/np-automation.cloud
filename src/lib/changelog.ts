// Changelog data — update ini setiap ada rilis baru
export type ChangelogEntry = {
  version: string;
  date: string;
  isNew?: boolean; // tandai sebagai "baru" untuk notifikasi bell
  changes: {
    type: "Added" | "Changed" | "Fixed" | "Removed";
    items: string[];
  }[];
};

export const changelog: ChangelogEntry[] = [
  {
    version: "0.4.0",
    date: "20 Juli 2026",
    isNew: true,
    changes: [
      {
        type: "Added",
        items: [
          "RAM Guard System: antrean task otomatis jika sisa RAM VPS di bawah 700MB untuk mencegah OOM (Out of Memory)",
          "Tombol Cancel Task (🚫) di halaman Active Tasks untuk membatalkan job yang menyangkut (Force Cancel)",
          "Safe deployment script (deploy.sh) untuk mencegah downtime / 502 Bad Gateway jika build gagal",
        ],
      },
      {
        type: "Changed",
        items: [
          "Default batas maksimal proses (concurrent browser) diturunkan dari 3 menjadi 2 demi stabilitas VPS",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Bug 502 Bad Gateway akibat zombie process Chromium memakan habis RAM (ditambah fallback SIGKILL)",
          "Pesan status di tabel Report/Tasks kini menampilkan jumlah SKU yang benar-benar dieksekusi (bukan total input)",
          "Error render Base-UI tooltip saat menampilkan fitur Cancel Task",
          "Kompatibilitas API route dengan Next.js 15 (Promise-based params) untuk endpoint pembatalan job",
        ],
      },
    ],
  },
  {
    version: "0.3.0",
    date: "20 Juli 2026",
    changes: [
      {
        type: "Added",
        items: [
          "Sistem autentikasi penuh berbasis Supabase Auth",
          "Anti-brute force: akun dikunci 10 menit setelah 5x gagal login",
          "Halaman Login dengan countdown timer saat akun dikunci",
          "Proteksi semua route via Next.js Proxy Middleware",
          "Tombol Logout fungsional di sidebar",
          "Tampilan nama user (capitalize) + inisial di sidebar footer",
          "Halaman Settings dengan info sistem, bot config, dan Disclaimer resmi",
          "Halaman Changelog dengan notifikasi bell",
          "Menu Changelog & Settings di sidebar navigasi",
          "Copyright footer di sidebar",
        ],
      },
      {
        type: "Changed",
        items: [
          "Kolom Distributor di Tasks & Report tidak lagi terpotong",
          "Placeholder field username di login diganti menjadi generik",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Error useSearchParams() perlu Suspense di /data-tools dan /automations/new",
          "Export function middleware → proxy sesuai Next.js 16.2+",
          "Duplikat import Settings di app-sidebar.tsx",
        ],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "19 Juli 2026",
    changes: [
      {
        type: "Added",
        items: [
          "Tombol Copy Gambar (screenshot hasil eksekusi) di halaman Report",
          "Tombol Salin Teks dengan format laporan baru (nama distributor + durasi)",
          "Auto-kirim Telegram setelah eksekusi selesai (gambar + caption)",
          "Mode Headless Playwright — browser tidak muncul saat eksekusi",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "10 Juli 2026",
    changes: [
      {
        type: "Added",
        items: [
          "Initial release platform NP Automation",
          "Dashboard utama dengan statistik sistem real-time (CPU, RAM, Uptime)",
          "Halaman Tasks, Report, Inventory Adjustment",
          "Halaman Master Data (Distributor Credentials, SKU Exceptions, SKU Multipliers)",
          "Halaman Schedules, Automations, Credentials",
          "Bot Playwright untuk otomasi input stok ke portal Newspage",
          "Queue System BullMQ + Redis untuk background job",
          "Sidebar navigasi kolapsibel dengan dark/light mode",
          "Komponen UI berbasis shadcn/ui",
        ],
      },
    ],
  },
];

// Key localStorage untuk tracking versi terakhir yang dilihat user
export const CHANGELOG_SEEN_KEY = "np_changelog_seen";
export const LATEST_VERSION = changelog[0].version;
