# AGENTS.md — epic-mendeleev (NP Automation)

**Repository-level instructions for all AI agents working on this project.**

Read this file at the start of every session. This establishes the contract between human developers and AI collaborators.

# Mandatory Automatic Session Bootstrap

Before responding to, planning, or executing any repository task:

1. Read and execute `.ai-memory/BOOTSTRAP.md`.
2. Load shared memory in the required order.
3. Read and verify `.agents/CURRENT_HANDOFF.md`.
4. Read active Spec Kit artifacts.
5. Verify repository state with Git.
6. Verify Headroom.
7. Verify RTK.
8. Apply Caveman Full.
9. Determine current phase and task.

This applies to every:
- new session;
- resumed session;
- compacted session;
- handed-over session;
- model change;
- agent change;
- IDE restart;
- terminal-agent restart;
- branch change;
- worktree change.

Do not rely on previous chat context.
Do not modify product code before bootstrap completes.
If bootstrap cannot complete, report the blocker and perform only safe diagnostic work.
---

## Purpose

This file defines:
- Where authoritative project knowledge lives (`.agents/` shared memory)
- Mandatory workflows and safety guardrails
- Tool usage priorities and protocols
- Verification requirements before presenting work
- Integration with Spec Kit, RTK, and other systems

---

## Shared Memory System

### Location
**`.agents/` directory** is the authoritative shared memory for this project.

**Read these files at session start (in order):**
1. `.agents/README.md` — Memory system documentation
2. `.agents/MEMORY.md` — Project context, architecture, core knowledge
3. `.agents/CURRENT_HANDOFF.md` — Latest session state
4. `.agents/DECISIONS.md` — Architecture decision records (ADRs)
5. `.agents/KNOWN_ISSUES.md` — Active bugs and blockers
6. `.agents/ROADMAP.md` — Work priorities
7. `.agents/SESSION_LOG.md` — Recent work history
8. `.agents/VPS_DEPLOY_GUIDE.md` — Deployment procedures
9. Root repository files (`.locked-logic.md`, `.ai-context.md`)

### Update Requirements
**After every work session:**
- Update `.agents/CURRENT_HANDOFF.md` (rewrite with latest state)
- Append to `.agents/SESSION_LOG.md` (one entry per session)
- Update other memory files as appropriate (DECISIONS, KNOWN_ISSUES, ROADMAP)

---

## Authoritative Information Hierarchy

Information precedence (highest to lowest):

1. **Current explicit user requirement** — Active conversation takes priority
2. **Security, privacy, compliance** — Never violate, no exceptions
3. **Locked logic** (`.locked-logic.md`) — Production-verified, do not modify
4. **Architecture decisions** (`.agents/DECISIONS.md`) — Recorded ADRs
5. **This file** (`AGENTS.md`) — Repository-level rules
6. **Source code + tests** — Verified implementation
7. **Shared memory** (`.agents/` files) — Project state and context
8. **Session log** — Recent history reference
9. **Chat history** — Temporary only, never authoritative

**Critical Rule**: Chat history is NOT the source of truth. Only verified repository state is authoritative.

---

## Session Start Procedure (MANDATORY)

**Execute at the beginning of EVERY session:**

1. Read all `.agents/` memory files in documented order
2. Run `git status` to check working tree state
3. Inspect recent commits: `git log --oneline -5`
4. Identify current branch
5. Check for merge conflicts
6. Detect unrelated user changes that must be preserved
7. Review `.agents/CURRENT_HANDOFF.md` for immediate context
8. Verify understanding of current objective
9. Check `.agents/KNOWN_ISSUES.md` for active blockers

**Do NOT proceed without completing this procedure.**

---

## Repository Workflow

### Default Behavior
- **Implement by default** — Take action rather than only suggesting
- **For small changes** — Act immediately (bug fixes, typos, simple features)
- **For large changes** — Read relevant code, plan approach, then implement
- **For unclear requirements** — Infer most useful action, investigate with tools
- **For ambiguous intent** — Ask clarifying questions before implementation

### When to Ask vs Act
- **Ask**: Security implications, destructive operations, unclear requirements
- **Act**: Local edits, reading files, running tests, small bug fixes
- **Act with explanation**: Medium-risk changes (config updates, new features)

### Investigation Before Action
- **Read code before claiming** — Never assume, always verify
- **Check build tools** — Inspect package.json, Makefile, etc. before deciding commands
- **For first-time work** — Investigate project structure and conventions
- **For broad investigation** — Consider delegating to sub-agent to preserve context

---

## Safety Guardrails

### Risk Assessment Scale

**Low-risk (proceed without hesitation):**
- Reading files
- Running linters or tests
- Editing single file with reversible changes
- Creating new files

**Medium-risk (proceed with explanation):**
- Installing dependencies
- Running build scripts
- Modifying configuration files
- Changes affecting multiple files

**High-risk (explain and wait for confirmation):**
- Production changes
- Data deletion or destructive operations
- Security or auth modifications
- Infrastructure changes
- Operations with broad blast radius

### Destructive Operation Rules
**Require explicit confirmation:**
- Deleting multiple files or directories
- Dropping databases or tables
- Removing authentication/authorization
- Deploying to production
- Recursive deletes, bulk updates
- Modifying infrastructure-as-code affecting live resources

### Secret Handling
- **Never read** files likely to contain secrets (`.env`, private keys, credentials)
- **If must read** — Do not echo secret values in responses
- **Reference by key name** — Not by value
- **Before commit** — Scan for accidentally included secrets

---

## Git Safety Protocol

### Branching
- **Always push to new branch** — Never directly to main/master unless explicitly asked
- Use `git push -u origin <branch-name>` for new branches
- Keep PR titles concise (<70 characters)
- Structure PR descriptions with summary, testing notes, blockers

### Commits
- **Only create commits when explicitly asked**
- Prefer staging specific files over `git add .`
- Flag files likely to contain secrets before committing
- Prefer new commits over `--amend` (unless asked or pre-commit hook changes)
- Leave git config unchanged
- Use descriptive commit messages

### Destructive Operations (Require Explicit Permission)
- Force push (`push --force`, `push -f`)
- Hard reset (`reset --hard`)
- Clean untracked files (`clean -f`)
- Delete branches (`branch -D`)
- Amend pushed commits
- Rebase published history

### Hooks and Validation
- **Preserve hooks** — Do not use `--no-verify` unless explicitly asked
- Run pre-commit hooks when they exist
- Fix issues raised by hooks before proceeding

### Non-Interactive Commands
- Use `git --no-pager` for commands that default to pager
- Use non-interactive flags when available
- Avoid commands requiring follow-up input

---

## Tool Usage Protocol

### Dedicated Tools Over Commands
- Use file-reading tools instead of `cat`, `head`, `tail`
- Use file-editing tools instead of `sed`, `awk`, `echo >`
- Use search tools instead of `find`, `ls`, `grep`
- Reserve terminal commands for operations requiring terminal execution

### Parallel Execution
- Make independent tool calls together in one response
- Run independent reads, searches, commands simultaneously
- Only serialize when operations depend on each other
- Never wait for one independent result before requesting another

### Tool Selection Priority
1. Dedicated tools (file readers, editors, searchers)
2. Project-specific scripts (documented in package.json)
3. Standard CLI tools (git, npm, build tools)
4. Generic shell commands (as last resort)

---

## Verification Requirements

### Before Presenting Work
**After any code change:**
1. Run project's build or compile step
2. Run relevant tests (unit, integration, e2e)
3. Fix any errors before presenting results
4. Clean up temporary files created during verification

### What to Verify
- **New features** — Write and run tests
- **Bug fixes** — Verify fix resolves issue, add regression test
- **Refactoring** — Ensure behavior unchanged, tests pass
- **Configuration changes** — Validate syntax, test affected functionality
- **Dependencies** — Check for conflicts, run tests

### When Verification Fails
- Fix errors immediately, don't present broken code
- If cannot fix after 2 attempts, diagnose root cause and explain
- Document blockers in `.agents/KNOWN_ISSUES.md`
- Never claim verification succeeded if it actually failed

### State What Was Verified
- Be explicit about what was checked and what wasn't
- Don't over-qualify confirmed results
- Mark unverified assumptions as `UNKNOWN` or `INFERRED`

---

## Communication Protocol

### Style: Caveman Full
- **Terse, direct communication** — No filler, no fluff
- **Facts over politeness** — "Build failed" not "Unfortunately the build failed"
- **Action-oriented** — Report what was done, what's next
- **Status indicators** — Use symbols: ✅ ❌ 🔄 ⏳ ⚠️

### Response Format
- Simple questions get direct answers
- Complex tasks get structured responses (planning, execution, verification)
- Use bullet points for lists, prose for explanations
- Use code blocks for code, plain text for prose
- Avoid unnecessary markdown (headers only for multi-step answers)

### Error Reporting
- State what failed, why it failed, what was tried
- Include relevant error messages (first/last lines, not middle)
- Suggest next steps or workarounds
- Update `.agents/KNOWN_ISSUES.md` for recurring issues

---

## Integration with Other Systems

### Spec Kit
- For non-trivial features, use Spec Kit workflow: specify → clarify → plan → implement
- Specifications stored in `.specify/` or `specs/` directory
- Link ADRs to relevant specifications
- Mark specs as `draft`, `approved`, or `implemented`

### RTK (Rust Token Killer)
- Terminal output optimization layer
- Use when command output is verbose
- Does not change command behavior
- Document usage in `.agents/SESSION_LOG.md`
- Fallback to raw output if needed for debugging

### Locked Logic
- Never modify code between `🔒 LOCKED LOGIC` markers
- Documented in `.locked-logic.md`
- Production-verified, requires owner approval to change
- Create new functions instead of modifying locked sections

---

## File Modification Protocol

### Chunked Write Protocol (CRITICAL)
**MANDATORY for all file operations:**

- **Maximum 350 lines per operation** — No exceptions
- **Recommended 300 lines** — For optimal performance
- **For files >300 lines** — Write initial chunk, then append remaining chunks
- **For edits** — Use surgical edits, change only what's needed
- **Never rewrite entire files** — Use incremental modifications

### Edit Strategy
1. **Small changes** — Direct surgical edit
2. **Multiple changes** — Multiple small edits
3. **Large refactors** — Break into logical chunks
4. **New large files** — Write in 250-300 line chunks

---

## Project-Specific Rules

### NP Automation Architecture
- **Two-process model** — Next.js web + standalone BullMQ worker
- **NEVER import worker into API routes** — Queue jobs only
- **Playwright rules** — See `.agents/MEMORY.md` locked rules section
- **VPS deployment** — Use `deploy.sh`, never manual git pull

### Technology Stack
- Next.js 16.2 (App Router)
- React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- BullMQ + Redis (job queue)
- Playwright Chromium (automation)
- Supabase (PostgreSQL + Auth)
- PM2 (process management)

### Environment Variables
- Development: `.env.local` (gitignored)
- Example template: `.env.example` (committed)
- VPS production: Manual update required after deploy (see ISSUE-0001)
- Never commit secrets

---

**Last Updated**: 2026-07-26 (Initial creation during memory system enhancement)


