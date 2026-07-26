---
name: bullmq-worker
description: Enforce BullMQ worker constraints, queue safety, and Next.js separation
---
# Skill: bullmq-worker

**Purpose**: Manage BullMQ and standalone worker development safely in the NP Automation project.
**Usage**: Activate when modifying `src/worker.ts`, `src/lib/queue.ts`, or implementing new BullMQ jobs.

## Architecture Boundaries (CRITICAL)
- **Two-Process Model**: Next.js API routes ONLY enqueue jobs. The worker consumes jobs in a separate PM2 process (`npm run worker`).
- **NEVER** import worker logic, BullMQ `Worker`, or long-running Playwright functions into Next.js routes.
- Use standard validation scripts (no fake tests).

## Requirements

### Job & Queue Safety
- **Payload Validation**: Use Zod to strongly type and validate job data before `queue.add()` and upon extraction inside the worker.
- **Idempotency**: Use deterministic `jobId` during enqueueing to prevent duplicates.
- **Retry & Backoff**: Configure exponential backoff and limits (e.g. `attempts: 3`, `delay: 5000`).
- **Concurrency**: Maintain strict concurrency limit (`concurrency: 1`) in `worker.ts` due to Chromium RAM constraints (VPS max 2 browsers total).
- **Cleanup**: Define `removeOnComplete` and `removeOnFail` retention policies (e.g., keep last 100 failed). Do not let Redis leak.
- **Timeouts**: Handle stalled jobs using BullMQ built-ins (e.g. `stalledInterval`).

### Worker Execution
- **Lifecycle**: Ensure graceful shutdown for SIGTERM/SIGINT. `worker.close()` and `connection.quit()` must be handled.
- **State Tracking**: Emit job progress (`worker.updateProgress()`). Maintain durable audit records in Supabase `jobs` and `audit_logs` tables.
- **Failure Recovery**: On job failure, take a screenshot of the Playwright state and save to `public/screenshots`.
- **Notifications**: Handle Telegram notification failures gracefully without crashing the worker or losing the failure state.
- **Security**: Mask sensitive payloads (passwords, tokens) in logs and UI. Read credentials from `process.env` or encrypted database only.

### Context Preservation
- Update canonical session log (`.agents/SESSION_LOG.md`) and rewrite handoff (`.agents/CURRENT_HANDOFF.md`) after modifying queue architecture, as per project rules.
- Follow active Spec Kit procedures before massive worker refactors.
