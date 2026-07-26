# Automatic Session Bootstrap, Headroom, and Verified Handoff

**Status**: approved
**Created**: 2026-07-26
**Owner**: AI Agent (Cline)

## Problem
AI coding sessions lack a standardized entry point, leading to lost context, manual resume prompting, and unverified repository state. Previous session handoffs are often trusted blindly even when repository state has changed. Tooling like Headroom and RTK are not systematically verified at startup.

## Requirements

### Automatic Session Bootstrap
- Create `.ai-memory/BOOTSTRAP.md` as canonical session-start protocol
- AGENTS.md must mandate BOOTSTRAP.md execution before product changes
- Bootstrap must verify repository root, load shared memory, read/verify handoff, discover Spec Kit, verify Git, verify Headroom, verify RTK, and apply Caveman Full
- Must handle branch changes, worktree changes, and crash recovery

### Shared Memory Loading
- Load `.agents/` memory files in required order (per ADR-0002)
- Do not create parallel `.ai-memory/` duplicate files
- Mark memory as incomplete if mandatory files are missing

### Verified Handoff
- Intake: Compare `.agents/CURRENT_HANDOFF.md` with Git state and Spec Kit
- Classify handoff as verified, stale, inconsistent, or missing
- Delivery: Rewrite handoff automatically at end of meaningful sessions
- Handoff must include exact next action and tooling status

### Tooling Integration
- Headroom: Verify installation (`headroom --version`, `headroom --help`), classify (active/degraded/unavailable)
- RTK: Verify separately (`rtk --version`), use for supported terminal commands, handle raw fallbacks
- Caveman Full: Apply terse, structured communication style

### Cline Configuration
- Create project-local `.cline/rules/` for bootstrap, architecture, security, and context optimization
- Create `.cline/skills/` for core workflows (bootstrap, handoff, headroom, speckit, rtk, caveman)

### Security Boundaries
- No secret capture in Headroom
- No arbitrary shell execution
- Production mutation requires explicit authorization

## Design
- **Path Resolution**: BOOTSTRAP.md and HANDOFF.md will live in `.ai-memory/` to satisfy the mandate, but will explicitly reference `.agents/` for all other memory files, honoring ADR-0002. (Wait, let's refine: mandate requires `.ai-memory/HANDOFF.md` but repo has `.agents/CURRENT_HANDOFF.md`. We will create `.ai-memory/HANDOFF.md` as the canonical handoff and `.ai-memory/BOOTSTRAP.md` as canonical bootstrap. The bootstrap will read `.ai-memory/HANDOFF.md` and the existing `.agents/` memory files).
- **Headroom**: Integrated via CLI wrapper (`headroom wrap cline`) and specific skills to handle context optimization safely.
- **RTK**: Integrated via specific Cline skill to enforce usage on supported commands.

## Testing
- Static validation of all created paths and references
- Simulated fresh-session test to verify instruction chain
- Manual inspection of Headroom and RTK CLI versions

## Rollout
- Direct file creation using chunked write protocol
- Git commit only upon explicit user request
