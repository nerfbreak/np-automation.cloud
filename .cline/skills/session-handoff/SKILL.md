---
name: session-handoff
description: Delivers verified session handoff at completion
---
# Skill: session-handoff

**Purpose**: Rewrite handoff, update Spec Kit state, update shared memory, and append session log.
**Triggers**: Task completes, session ending, branch change, or significant validation completed.
**Procedure**:
1. Review Git diff and run `git status`.
2. Ensure no secrets are exposed.
3. Update `.agents/SESSION_LOG.md` (append only).
4. Update relevant memory files (ROADMAP, DECISIONS).
5. Rewrite `.agents/CURRENT_HANDOFF.md` using the verified structure (Session Metadata, Active Context, Exact Next Action, Validation, Tooling Status).
