# Automatic Session Bootstrap Protocol

**Canonical session-start protocol.**
Read and execute this file at the start of every session before performing any repository work or product code modification.

## 1. Locate and Confirm Repository Root
- Identify the repository root directory.
- Confirm current branch: `git branch --show-current`
- Identify current commit: `git log -1 --oneline`
- Detect staged/unstaged/untracked changes: `git status`
- Detect merge conflicts.
- **Rule**: Preserve unrelated user modifications. Stop work if changes might be overwritten. Never run destructive Git commands automatically.

## 2. Read Applicable Instructions
- `AGENTS.md` (Root repository rules)
- `AGENTS_AND_SKILLS.md` (if present)
- `.specify/CONSTITUTION.md` (Project constraints)
- Agent-specific instructions (e.g., `.cline/rules/`)
*Note: Do not restart bootstrap if a document links back here. Read each once.*

## 3. Load Shared Memory
Read in this exact order:
1. `.agents/README.md`
2. `.agents/MEMORY.md`
3. `.agents/DECISIONS.md`
4. `.agents/KNOWN_ISSUES.md`
5. `.agents/ROADMAP.md`
*(Note: Using `.agents/` per ADR-0002, replacing `.ai-memory/` equivalents)*

If any mandatory file is missing, mark memory as incomplete, continue safe inspection, and reconstruct state from evidence. Do not invent history.

## 4. Read Latest Handoff
Read `.agents/CURRENT_HANDOFF.md`.

## 5. Discover Active Spec Kit Artifacts
Read active artifacts in `.specify/` or `specs/`.
- Use branch, handoff, task states, and current request to determine active specs.
- Do not determine active specs merely from file timestamps.

## 6. Verify Git State
Use RTK for Git commands if supported.
- Verify branch, commit, clean/dirty status, untracked files, conflicts.
- Documentation does not override Git evidence.

## 7. Verify Handoff
Compare the handoff against Git, Spec Kit, and source code.
Classify as:
- **verified**: Claims match repository evidence.
- **stale**: Progress advanced beyond handoff without contradiction.
- **inconsistent**: Handoff conflicts with repository evidence.
- **missing**: No usable handoff exists.
*If not verified, reconstruct state safely. Never discard repo changes based on handoff.*

## 8. Verify Headroom
Inspect installed Headroom via safe commands (`headroom --version`, `headroom wrap cline --help`).
Classify as:
- **active**: Running through verified Headroom integration.
- **degraded**: Installed but wrapper/configuration incomplete.
- **unavailable**: Not installed or fails to run.

## 9. Verify RTK
Verify separately (`rtk --version`).
Classify as:
- **active**: Installed and used.
- **degraded**: Partially functional.
- **unavailable**: Not installed.

## 10. Apply Caveman Full
Adopt terse, structured, technical communication (no filler/fluff).
Classify as:
- **full**: Active natively.
- **manual-full**: Applied via prompt rules.
- **inactive**: Not applied.

## 11. Determine Context
Identify current objective, active phase, and specific task.

## 12. Report Startup Status
Emit this exact status block:
```
MEMORY: loaded | incomplete | failed
HANDOFF: verified | stale | inconsistent | missing
SPEC KIT: active | missing | inconsistent
HEADROOM: active | degraded | unavailable
RTK: active | degraded | unavailable
CAVEMAN: full | manual-full | inactive
CLINE: configured | partial | unavailable
GIT: clean | dirty | conflicts
BRANCH: <branch>
COMMIT: <short SHA>
ACTIVE SPEC: <path or none>
PHASE: <phase>
CURRENT TASK: <task or none>
BLOCKERS: <blockers or none>
NEXT: <exact first action>
```

## 13. Process User Request
Proceed with the requested task. Do not ask for a manual resume prompt.

---

## Session Invalidation and Crash Recovery
- **Invalidation**: Bootstrap state resets on branch switch, context loss, model/agent change, or active spec change. On branch switch, reload memory and re-verify handoff.
- **Crash Recovery**: If shutdown was abnormal, reconstruct state from Git diff, active tasks, and source. Do not invent a successful shutdown. Repair handoff and log in `SESSION_LOG.md`.

## Automatic Handoff Delivery
At the end of every meaningful session, rewrite `.agents/CURRENT_HANDOFF.md` using the verified template, append `.agents/SESSION_LOG.md`, update memory/specs, and leave an exact next action.
