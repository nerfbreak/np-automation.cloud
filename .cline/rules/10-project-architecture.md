# Project Architecture
- **Web App**: Next.js 16.2 App Router, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui.
- **Worker**: Standalone BullMQ worker (TypeScript) run via PM2. Never import worker logic into Next.js API routes.
- **Database**: Supabase (PostgreSQL)
- **Automation**: Playwright Chromium (strictly headless, max 2 concurrent browsers on VPS).
- **Boundaries**: API routes enqueue jobs only. Worker consumes jobs, runs Playwright, updates Supabase, and sends Telegram notifications.