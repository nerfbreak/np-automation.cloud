---
name: developing-with-nextjs-playwright
description: >
  Use for ALL development tasks in epic-mendeleev: creating pages, API routes, bot selectors,
  BullMQ worker tasks, Supabase queries, Tailwind/shadcn styling, debugging, or deploying.
  Also use when adding new features, fixing bot failures, or diagnosing worker crashes.
  Triggers: Next.js, React, TypeScript, Playwright, BullMQ, Supabase, shadcn, Tailwind,
  page.tsx, route.ts, newspage-bot, worker, deploy, VPS, PM2.
---

# Developing with epic-mendeleev

## Before Starting ANY Task

1. Read `.agents/MEMORY.md` — architecture, locked rules, changelog
2. Read `.agents/AGENTS.md` — quick rules reference

## Project Structure

```
src/
├── app/                        # Next.js App Router pages + API routes
│   ├── (pages)/                # Feature pages
│   ├── api/                    # API routes (enqueue only, no Playwright!)
│   └── layout.tsx
├── components/                 # shadcn/ui + custom React components
├── lib/
│   ├── newspage-bot.ts         # ALL Playwright automation logic (FROZEN)
│   ├── queue.ts                # BullMQ queue + Redis connection
│   ├── worker-setup.ts         # Embedded worker (dev only)
│   ├── crypto.ts               # AES-256 encryption
│   ├── supabase.ts             # Supabase client (anon + admin)
│   └── audit.ts                # Audit log helper
├── store/                      # Zustand state stores
├── worker.ts                   # STANDALONE worker entry point
└── mocks/                      # Mock data for development
ecosystem.config.js             # PM2 config (two processes)
deploy.sh                       # Safe deploy script
```

## Two-Process Architecture

**CRITICAL**: Always remember this app runs as two separate processes:
- **np-web** (port 3000): Next.js UI + API routes — only ENQUEUES jobs
- **np-worker**: BullMQ worker — EXECUTES jobs via Playwright

API routes should NEVER directly call Playwright functions. They should:
1. Validate input
2. Call `inventoryQueue.add(...)`
3. Return `{ jobId }`

The ONLY exception is `extract/route.ts` which calls Playwright directly for SSE streaming — this is intentional but risky.

## Creating a New API Route

```typescript
// src/app/api/<feature>/route.ts
import { NextRequest, NextResponse } from "next/server"

// Required for routes that use Node.js features (not Edge-compatible)
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.json()
  // ... validate, enqueue, return
  return NextResponse.json({ success: true })
}
```

## Creating a New Page

```typescript
// src/app/<feature>/page.tsx
"use client"

import { AppShell } from "@/components/layout/app-shell"

export default function FeaturePage() {
  return (
    <AppShell breadcrumbs={[{ label: "Feature Name" }]}>
      {/* content */}
    </AppShell>
  )
}
```

## Adding to Navigation

Check `src/components/layout/app-shell.tsx` for the nav config.

## Bot Rules (newspage-bot.ts)

- Login: ALWAYS `waitUntil: "networkidle"` — WebForms needs full page load
- Interface ID: fill `INTF_ID_Value` directly + press Tab (SelectButton popup removed 2026-07-12)
- Warehouse input: `frame.locator("[id$='...']")` — no `#` prefix for CSS selectors
- Wait pattern: `waitForElement()` → interact → `smartWait()` → repeat
- Never assume DOM is ready — always poll explicitly

## Supabase Patterns

```typescript
// Admin client (server-side only)
import { supabaseAdmin } from "@/lib/supabase"
const { data, error } = await supabaseAdmin.from('jobs').select('*')

// Public client (client-side)
import { supabase } from "@/lib/supabase"
```

## Environment Variables

All secrets in `.env.local` (never commit this). See `.env.example` for required keys.

## Deploy

```bash
# Development
npm run dev          # Next.js (port 3000)
npm run worker       # BullMQ worker (separate terminal)

# Production (VPS)
bash deploy.sh       # git pull + build + pm2 restart
pm2 status           # Check both np-web and np-worker are online
pm2 logs np-worker   # Check bot execution logs
```

## Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Worker keeps restarting | Missing env var or Redis down | `pm2 logs np-worker --err` |
| Bot times out at login | `networkidle` timeout | Increase `PLAYWRIGHT_TIMEOUT_MS` |
| INTF_ID step hangs | Using old SelectButton selector | Use direct fill on `INTF_ID_Value` |
| 502 from Nginx | np-web crashed | `pm2 restart np-web` |
| Jobs enqueue but never run | np-worker not running | `pm2 start ecosystem.config.js` |
