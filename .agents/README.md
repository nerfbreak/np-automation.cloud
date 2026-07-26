# AI Shared Memory System — epic-mendeleev

This directory contains the **authoritative shared memory** for all AI agents working on the NP Automation project. Every AI session must read these files before making changes.

---

## Purpose

This shared memory system ensures:
- **Consistency** across different AI agents and sessions
- **No reliance** on chat history for project context
- **Persistent knowledge** of architecture, decisions, and state
- **Safe handoffs** between agents and sessions
- **Production safety** through locked logic and documented constraints

---

## Required Reading Order

Every AI agent must read files in this exact order at session start:

1. **This file** (`.agents/README.md`) — understand the memory system
2. **`MEMORY.md`** — project context, architecture, and core knowledge
3. **`CURRENT_HANDOFF.md`** — latest state and immediate next actions
4. **`DECISIONS.md`** — architecture decision records (ADRs)
5. **`KNOWN_ISSUES.md`** — active bugs and blockers
6. **`ROADMAP.md`** — planned work and priorities
7. **`SESSION_LOG.md`** — recent session history
8. **`VPS_DEPLOY_GUIDE.md`** — deployment procedures
9. **Root repository files** (`README.md`, `.locked-logic.md`, `.ai-context.md`)
10. **Relevant source code** and tests for the current task

---

## Authoritative Sources

Information precedence (highest to lowest):

1. **Current explicit user requirement** (in active conversation)
2. **Security, privacy, compliance constraints** (never violate)
3. **Locked logic** (`.locked-logic.md` — production-verified code)
4. **Architecture decisions** (`DECISIONS.md` ADRs)
5. **Repository-level instructions** (root `AGENTS.md` when created)
6. **Source code and automated tests** (verified implementation)
7. **Shared memory files** (this directory)
8. **Session log** (recent history reference)
9. **Chat history** (temporary communication only — never authoritative)

**RULE**: Chat history is never the source of truth. Only verified repository state is authoritative.

---

## Update Rules

### When to Update Memory Files

**After every meaningful work session:**
- Update `CURRENT_HANDOFF.md` (rewrite with latest state)
- Append to `SESSION_LOG.md` (one entry per session)
- Update `MEMORY.md` if architecture or core knowledge changed
- Append to `DECISIONS.md` if architectural decision was made
- Update `KNOWN_ISSUES.md` if bugs were found or fixed
- Update `ROADMAP.md` if priorities changed

**Never update memory with:**
- Unverified assumptions
- Planned work presented as completed
- Chat-based speculation
- Unexecuted validation claims

### How to Update

- **MEMORY.md**: Surgical edits to specific sections
- **CURRENT_HANDOFF.md**: Complete rewrite each session (it's a snapshot)
- **DECISIONS.md**: Append-only (never delete historical ADRs)
- **KNOWN_ISSUES.md**: Update status, add/remove issues
- **ROADMAP.md**: Move items between NOW/NEXT/LATER/COMPLETED
- **SESSION_LOG.md**: Append-only (never edit previous entries)

---

## Status Vocabulary

Use these terms consistently:

**Implementation Status:**
- `VERIFIED` — Confirmed through execution, tests, or source code inspection
- `INFERRED` — Reasonable conclusion from indirect evidence
- `PLANNED` — Intended but not yet implemented
- `UNKNOWN` — Information gap requiring investigation

**Work Status:**
- `NOW` — Current focus, active work
- `NEXT` — Queued for immediate follow-up
- `LATER` — Backlog, future consideration
- `BLOCKED` — Cannot proceed without external dependency
- `COMPLETED` — Done and verified

**Issue Status:**
- `open` — Confirmed, needs work
- `investigating` — Root cause analysis in progress
- `blocked` — Cannot fix due to external dependency
- `resolved` — Fixed and verified

---

## Stale Memory Correction

If memory conflicts with verified source code:

1. **Investigate** — Check git history, tests, deployment logs
2. **Verify** — Run actual validation commands
3. **Update memory** — Correct stale information
4. **Document** — Note what was wrong and why in session log

**Never silently "fix" memory to match assumptions.**

---

## Relationship with Other Systems

### Locked Logic (`.locked-logic.md`)
- Contains production-verified code sections
- Marked with `🔒 LOCKED LOGIC` markers in source
- **MUST NOT** be modified without explicit owner approval
- Overrides any "improvements" or "cleanup" suggestions

### Context Buffer (`.ai-context.md`)
- Short-term working notes for immediate tasks
- Updated more frequently than formal memory files
- Can be rewritten freely during active work
- Not authoritative for long-term decisions

### Spec Kit (when initialized)
- Formal specifications for non-trivial features
- Mandatory workflow: specify → clarify → plan → implement
- Stored in `.specify/` or `specs/` directory
- Links to relevant memory sections

### RTK (Rust Token Killer)
- Terminal output optimization layer
- Does not change command behavior
- Fallback to raw output when needed
- Documented in session log when used

---

## Security Restrictions

**NEVER expose in memory files:**
- Passwords or credentials
- API keys or tokens
- Private keys or certificates
- Session cookies or auth headers
- Database credentials
- Production customer data
- Confidential internal data

**Use placeholders:**
- `ENCRYPTION_KEY=<64-char-hex>`
- `TELEGRAM_BOT_TOKEN=<token>`
- Reference environment variable names, not values

---

## Session Start Procedure

Required steps at the beginning of every AI session:

1. Read all memory files in documented order
2. Run `git status` to check working tree state
3. Inspect recent commits (`git log --oneline -5`)
4. Identify current branch
5. Check for merge conflicts
6. Detect unrelated user changes that must be preserved
7. Review latest handoff for context
8. Verify understanding of current objective
9. Check for blockers or warnings

---

## Session End Procedure

Required steps at the end of every work session:

1. Run final validation (tests, build, linting)
2. Review `git diff` for unintended changes
3. Scan for accidentally committed secrets
4. Update relevant memory files
5. Append session log entry
6. Rewrite `CURRENT_HANDOFF.md` with latest state
7. Commit with descriptive message (if authorized)
8. Document any blockers or follow-up items

---

## Archive and Compaction Rules

To prevent memory bloat:

- **SESSION_LOG.md**: Keep last 20-30 entries, archive older to separate file
- **KNOWN_ISSUES.md**: Move resolved issues to archive section after 30 days
- **ROADMAP.md**: Move completed items to `COMPLETED RECENTLY` section, archive after version release
- **MEMORY.md**: Keep concise, avoid duplicating information from other files
- **DECISIONS.md**: Never delete ADRs, but mark as superseded when replaced

Archive format: `.agents/archive/YYYY-MM/`

---

## File Summaries

| File | Purpose | Update Frequency | Format |
|------|---------|------------------|--------|
| `README.md` | This file - memory system documentation | Rarely (system changes only) | Markdown guide |
| `MEMORY.md` | Core project knowledge | Per session if architecture changed | Structured markdown |
| `CURRENT_HANDOFF.md` | Latest continuation point | Every session (rewrite) | Snapshot format |
| `DECISIONS.md` | Architecture decision records | When decisions made | Append-only ADRs |
| `KNOWN_ISSUES.md` | Active bugs and blockers | When issues change | Structured list |
| `ROADMAP.md` | Planned work priorities | When priorities change | NOW/NEXT/LATER |
| `SESSION_LOG.md` | Recent work history | Every session (append) | Chronological log |
| `VPS_DEPLOY_GUIDE.md` | Deployment procedures | When deploy process changes | Step-by-step guide |

---

## Integration with Root AGENTS.md

When root `AGENTS.md` exists:
- Root file contains high-level rules and workflow
- `.agents/` memory provides project-specific state
- Root rules take precedence for process and safety
- Memory files provide context for implementation decisions

---

## Compatibility Notes

This memory system is compatible with:
- **GitHub Spec Kit** — specifications stored in `.specify/` or `specs/`
- **RTK** — terminal optimization layer, documented in session logs
- **Caveman Full** — terse communication style, does not affect memory completeness
- **Multiple AI agents** — Claude, GPT, Cline, Copilot, Gemini, etc.

---

## Questions and Issues

If memory is incomplete, contradictory, or unclear:
1. **Do not guess** — mark as `UNKNOWN` and investigate
2. **Check source code** — tests and implementation are authoritative
3. **Ask user** — request clarification for ambiguous requirements
4. **Document** — record the resolution in session log and relevant file

---

**Last Updated**: 2026-07-26 (Initial creation during memory system enhancement)

