---
name: supabase-data
description: Enforce Supabase best practices, boundaries, and safety for Next.js and worker operations
---
# Skill: supabase-data

**Purpose**: Safely interact with and structure data for the Supabase (PostgreSQL) backend in the NP Automation project.
**Usage**: Activate when modifying database queries, RLS policies, schemas, handling durable job states, distributor data, or audit logs, or when making Supabase calls in Next.js routes or worker.

## Boundaries and Keys (CRITICAL)
- **Client vs Server**:
  - Use `export const supabase = createClient(supabaseUrl, supabaseAnonKey)` for client-side or general usage (respects RLS).
  - Use `export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)` ONLY for server-side backend operations (bypasses RLS) or the standalone worker process.
- **Service Role Key**: MUST NEVER be exposed to the client or leaked in logs.
- **Environment Variables**: Never hardcode credentials. Use `.env.local` keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Never expose `.env` values in logs or commit them.
- **Production Safety**: No direct production mutations without explicit authorization.

## Data Validation and Writing
- **Validation**: Always use Zod to strongly type and validate data BEFORE database writes.
- **Separation of State**: Supabase handles DURABLE records (`jobs`, `distributors`, `audit_logs`). Redis/BullMQ handle TRANSIENT queue state. Do not mix their responsibilities.

## Known Tables and Schema
*Note: Do not invent schemas. Only interact with verified tables.*
- **jobs**: Tracks durable job state (`job_id`, `status` (e.g. 'RUNNING'), `result_summary`, `updated_at`).
- **distributors**: Stores distributor information (`username`, `password_encrypted`, `name`).
- **audit_logs**: Records sensitive operations via `logAudit(action, actor, resource, details)`. `details` must not contain unmasked secrets.

## Query Handling
- **Typed Queries**: Strongly type query results.
- **Pagination & Limits**: Apply bounded limits and pagination for large datasets to avoid memory issues on the VPS.
- **Indexing**: Review and utilize indexes for frequently queried columns (e.g., `job_id`, `username`).

## Data Lifecycle & Transactions
- **Idempotency & Transactions**: Consider idempotency and transactions for concurrent updates, especially in the worker.
- **Schema Migrations**: Schema changes require a migration-first approach. Test migrations in a development environment first. Rollback requirements must be documented for any schema change.
- **Retention**: Implement safe retention and cleanup policies for large tables (e.g. audit logs, old jobs) if necessary, without accidental bulk deletion.
- **RLS (Row Level Security)**: Review RLS policies when creating or altering tables accessible by the `anon` key.

## Secret Masking
- **Logs**: Prohibit logging of plain text passwords, `password_encrypted` values, or API keys in query logs, application logs, or Headroom/RTK logs.

## Context Preservation
- Update canonical session log (`.agents/SESSION_LOG.md`) and rewrite handoff (`.agents/CURRENT_HANDOFF.md`) after modifying database logic. Avoid duplicate session-log entries. Follow active Spec Kit procedures.
