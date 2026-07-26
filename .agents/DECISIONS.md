# Architecture Decision Records (ADRs) — epic-mendeleev

This file contains **append-only** architecture decision records for the NP Automation project. Never delete historical ADRs; mark them as superseded when decisions change.

---

## ADR Format

Each ADR must include:
- **Date**: When the decision was made
- **Status**: `proposed` | `accepted` | `superseded` | `rejected`
- **Context**: Why this decision is needed
- **Decision**: What was decided
- **Alternatives considered**: Other options that were evaluated
- **Consequences**: Positive and negative impacts
- **Security impact**: Any security implications
- **Migration impact**: How existing systems are affected
- **Rollback**: How to reverse the decision if needed
- **Related specification**: Link to relevant specs (if any)
- **Related files**: Affected source files
- **Related commits**: Git commits implementing the decision

---

## ADR-0001: Repository-Based Shared Memory for AI Agents

**Date**: 2026-07-26  
**Status**: `accepted`

### Context
Multiple AI agents work on this project across different sessions. Without persistent shared memory:
- Agents rely on chat history (unreliable, not portable)
- Same context is re-explained every session (inefficient)
- Architecture decisions are lost between sessions
- Critical bugs get reintroduced
- Production-verified code gets "improved" and breaks

### Decision
Establish `.agents/` directory as the authoritative shared memory system containing:
- `MEMORY.md` — project context, architecture, core knowledge
- `CURRENT_HANDOFF.md` — latest session state and next actions
- `DECISIONS.md` — this file (ADRs)
- `KNOWN_ISSUES.md` — active bugs and blockers
- `ROADMAP.md` — planned work priorities
- `SESSION_LOG.md` — recent work history
- `VPS_DEPLOY_GUIDE.md` — deployment procedures
- `README.md` — memory system documentation

### Alternatives Considered
1. **Chat history only** — Rejected: not persistent, agent-specific, lost on context refresh
2. **Git commit messages** — Rejected: too fragmented, no structured state tracking
3. **External wiki/docs** — Rejected: separate from code, harder to keep in sync
4. **Code comments only** — Rejected: doesn't capture cross-cutting decisions or state

### Consequences

**Positive:**
- Every AI agent reads same authoritative context
- Decisions persist across sessions
- Reduces repeated explanations
- Prevents reintroduction of fixed bugs
- Supports multiple AI agents (Claude, GPT, Cline, etc.)
- Git-tracked, versioned with code

**Negative:**
- Requires discipline to update after sessions
- Can become stale if not maintained
- Adds file management overhead

### Security Impact
- Memory files must never contain credentials, tokens, or secrets
- Only environment variable names referenced
- Locked logic protects production-verified code

### Migration Impact
- No breaking changes (new system, no migration needed)
- Existing code unaffected
- VPS deployment unchanged

### Rollback
- Delete `.agents/` directory
- Return to chat-based context only
- No code changes required

### Related Specification
- None (infrastructure decision)

### Related Files
- All files in `.agents/` directory
- `.locked-logic.md` (existing, integrated)
- `.ai-context.md` (existing, integrated)

### Related Commits
- Initial memory system setup (this session)

---

## ADR-0002: Enhance Existing .agents/ System (Not Create .ai-memory/)

**Date**: 2026-07-26  
**Status**: `accepted`

### Context
Repository already has `.agents/` directory with:
- `MEMORY.md` (77 lines - context, architecture, changelog)
- `CURRENT_HANDOFF.md` (44 lines - latest handoff dated 2026-07-21)
- `VPS_DEPLOY_GUIDE.md` (307 lines - deployment procedures)
- `skills/` directory (54+ agent skills)

New mandate requires structured memory system with specific files:
- README.md, PROJECT_CONTEXT.md, CURRENT_STATE.md, ARCHITECTURE.md
- DECISIONS.md, KNOWN_ISSUES.md, ROADMAP.md, SESSION_LOG.md, HANDOFF.md

Mandate explicitly states: "Do not create duplicate memory systems if an equivalent repository system already exists. Merge carefully and document compatibility."

### Decision
**ENHANCE** existing `.agents/` system instead of creating duplicate `.ai-memory/`:

1. Keep existing files:
   - `MEMORY.md` (already covers context, state, architecture)
   - `CURRENT_HANDOFF.md` (equivalent to HANDOFF.md)
   - `VPS_DEPLOY_GUIDE.md` (operational documentation)
   - `skills/` (agent skills infrastructure)

2. Add missing mandate-required files:
   - `README.md` (memory system documentation) ✅ CREATED
   - `DECISIONS.md` (this file - ADR format) ✅ CREATING
   - `KNOWN_ISSUES.md` (structured issue tracking)
   - `ROADMAP.md` (NOW/NEXT/LATER format)
   - `SESSION_LOG.md` (append-only session history)

3. Use `.agents/` as the canonical location (not `.ai-memory/`)

### Alternatives Considered

1. **Create .ai-memory/ and duplicate everything**
   - Rejected: violates mandate rule against duplication
   - Would create confusion about which is authoritative
   - Wastes effort duplicating existing content

2. **Move .agents/ to .ai-memory/**
   - Rejected: breaks existing skills paths
   - Would require updating existing references
   - `.agents/` name is clear and established

3. **Create .ai-memory/ and symlink to .agents/**
   - Rejected: unnecessary complexity
   - Symlinks can cause issues on Windows
   - Doesn't add value over direct enhancement

### Consequences

**Positive:**
- Respects existing work (no destructive changes)
- Single source of truth (`.agents/` only)
- Maintains compatibility with existing skills
- Minimizes file churn
- Team familiar with existing structure

**Negative:**
- Directory name `.agents/` instead of mandated `.ai-memory/`
- Requires documenting naming difference

### Security Impact
- None (structure change only, security rules unchanged)

### Migration Impact
- Existing `.agents/MEMORY.md` remains unchanged
- Existing `.agents/CURRENT_HANDOFF.md` remains unchanged
- New files added to existing directory
- No breaking changes to code or deployment

### Rollback
- Remove newly created files (README.md, DECISIONS.md, etc.)
- Keep original files (MEMORY.md, CURRENT_HANDOFF.md, VPS_DEPLOY_GUIDE.md)
- System returns to pre-enhancement state

### Related Specification
- Mandate document requiring memory system establishment
- Mandate rule: "Do not create duplicate memory systems"

### Related Files
- `.agents/README.md` (created)
- `.agents/DECISIONS.md` (this file)
- `.agents/MEMORY.md` (existing, preserved)
- `.agents/CURRENT_HANDOFF.md` (existing, preserved)

### Related Commits
- Memory system enhancement (this session)

---

## Future ADRs

## ADR-0003: Hybrid AI Memory Architecture (Bootstrap vs Context)

**Date**: 2026-07-26  
**Status**: `accepted`

### Context
A new mandate required the creation of `.ai-memory/BOOTSTRAP.md`, `.ai-memory/HANDOFF.md`, and `.ai-memory/AGENT_INTEGRATIONS.md`. However, ADR-0002 previously decided to enhance the existing `.agents/` directory for shared memory instead of creating a duplicate `.ai-memory/` directory.

### Decision
Implement a hybrid approach:
1. Create `.ai-memory/` strictly for active session mechanics (BOOTSTRAP.md, HANDOFF.md, AGENT_INTEGRATIONS.md) to satisfy the mandate's explicit path requirements.
2. The BOOTSTRAP.md protocol explicitly loads the project context from the `.agents/` directory (`.agents/README.md`, `.agents/MEMORY.md`, etc.).
3. Standardize on `.ai-memory/HANDOFF.md` as the canonical verified handoff artifact for future sessions, superseding `.agents/CURRENT_HANDOFF.md`.

### Alternatives Considered
1. **Put BOOTSTRAP.md in .agents/** — Rejected: violates the mandate's hardcoded path requirements for the entrypoint.
2. **Move all .agents/ to .ai-memory/** — Rejected: violates ADR-0002 and breaks existing skill paths.

### Consequences
**Positive:**
- Full compliance with the new mandate's automated entrypoint.
- Respects ADR-0002 by preserving `.agents/` as the single source of truth for long-term project knowledge.
- Clean separation between "how an agent starts" (`.ai-memory/`) and "what the agent knows" (`.agents/`).

**Negative:**
- Two memory-related directories exist in the root, requiring clear documentation of their boundaries.

### Security Impact
None.

### Migration Impact
Agents will transition to reading `.ai-memory/BOOTSTRAP.md` first, which then directs them to the `.agents/` files. `.agents/CURRENT_HANDOFF.md` will be phased out in favor of `.ai-memory/HANDOFF.md`.

### Rollback
Delete `.ai-memory/` and revert `AGENTS.md` bootstrap instructions.

### Related Files
- `.ai-memory/BOOTSTRAP.md`
- `.ai-memory/HANDOFF.md`
- `AGENTS.md`


Add new ADRs below using the same format. Never delete historical records.

