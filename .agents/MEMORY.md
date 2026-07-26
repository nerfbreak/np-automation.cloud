# AI Project Memory — epic-mendeleev (NP Automation Next.js)

This file is the **single source of truth** for all AI agents working on this project. Read this before making any changes.

---

## Current State Summary

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Automation Engine**: Playwright (Chromium headless) — `src/lib/newspage-bot.ts`
- **Job Queue**: BullMQ + Redis — queue defined in `src/lib/queue.ts`
- **Worker**: Standalone Node.js process — `src/worker.ts` (run via `npm run worker`)
- **Database**: Supabase (PostgreSQL) — jobs, distributors, audit_logs tables
- **Encryption**: AES-256-CBC via `src/lib/crypto.ts`
- **Notifications**: Telegram Bot API (sendPhoto with screenshot)
- **Deploy**: PM2 on Linux VPS, managed via `ecosystem.config.js` + `deploy.sh`

---

## Architecture: Two-Process Model (CRITICAL — DO NOT VIOLATE)

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  Process 1: Next.js         │     │  Process 2: Worker           │
│  npm start / npm run dev    │     │  npm run worker              │
│                             │     │                              │
│  - UI (React pages)         │     │  - Consume BullMQ queue      │
│  - API Routes (enqueue only)│────▶│  - Run Playwright bot        │
│  - SSE streaming for extract│     │  - Update Supabase jobs      │
│                             │     │  - Send Telegram screenshots │
└─────────────────────────────┘     └─────────────────────────────┘
         │ enqueue                           │
         ▼                                   │
    Redis (BullMQ)◀─────────────────────────┘
```

**RULE**: Worker logic MUST NOT be imported into Next.js API routes. `worker-setup.ts` is only used if you explicitly want embedded mode (not recommended for production).

---

## 🔒 Locked Rules

### Bot / Playwright Rules (DO NOT VIOLATE)
1. **ALWAYS** use `waitUntil: "networkidle"` for `page.goto()` — NOT `domcontentloaded`. Newspage is ASP.NET WebForms, event listeners attach after DOMContentLoaded.
2. **NEVER** use `INTF_ID_SelectButton` — this popup was **removed from Newspage on 2026-07-12**. Use direct fill on `INTF_ID_Value` + Tab press instead.
3. **ALWAYS** use explicit `waitForElement()` polling before any interaction — never assume elements are there.
4. **NEVER** use `frame.locator('#' + cssSelector)` when cssSelector is already a CSS selector like `[id$='...']`. Use `frame.locator(cssSelector)` directly.
5. **ALWAYS** fallback to JS DOM events (`mouseover`, `mouseenter`) if native Playwright `hover()` fails in headless mode.
6. **ALWAYS** poll `Sys.WebForms.PageRequestManager.get_isInAsyncPostBack()` via `smartWait()` — do not rely solely on `networkidle`.

### Security Rules
- **NEVER** hardcode credentials, tokens, or encryption keys in source code — always use `.env.local`
- Required env vars: `ENCRYPTION_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY` must be 64 hex characters (32 bytes for AES-256)

### VPS / Deployment Rules
- **ALWAYS** use `deploy.sh` — never run `git pull && npm run build && pm2 restart` manually
- PM2 manages both `np-web` (Next.js) and `np-worker` (BullMQ worker)
- `MAX_CONCURRENT_BROWSERS = 2`, `MIN_FREE_RAM_MB = 700` — do not increase without RAM upgrade
- Chromium ≈ 300-400MB per instance — VPS RAM is limited

---

## Changelog & Decisions

- **2026-07-20**: Project analyzed and 7 critical bugs fixed:
  - BUG-01: Missing closing brace in `worker-setup.ts` (Worker export was `undefined`)
  - BUG-02: Removed `import "@/lib/worker-setup"` from `execute/route.ts` — worker must be separate process
  - BUG-03/RF-03: Added `export const runtime = "nodejs"` to `extract/route.ts`
  - BUG-04: Changed `page.goto()` in login from `domcontentloaded` → `networkidle`
  - BUG-05: Replaced dead `INTF_ID_SelectButton` popup with direct fill on `INTF_ID_Value` + Tab
  - BUG-06: Moved hardcoded Telegram token/chat_id to env vars (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
  - BUG-07: Removed hardcoded fallback `ENCRYPTION_KEY` — now throws if env var missing
  - BUG-M04: Fixed invalid `frame.locator('#' + cssSelector)` for warehouse input
  - RF-02: Added `serverExternalPackages` in `next.config.ts` for Playwright/BullMQ/ioredis
  - TypeScript check: 0 errors after all fixes
- **2026-07-20**: AI Memory system initialized for epic-mendeleev project.
