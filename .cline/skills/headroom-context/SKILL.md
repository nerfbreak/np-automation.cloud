---
name: headroom-context
description: Manages Headroom context optimization
---
# Skill: headroom-context

**Purpose**: Verify Headroom, optimize large context, and manage interactions with RTK.
**Constraints**: 
- Preserve exact evidence when diagnosing failures.
- Headroom memory does not override repository truth.
- Do not capture `.env` or sensitive output.
**Procedure**: Verify via `headroom --version` and `headroom wrap cline --help`. Use Headroom wrapper for agent sessions. Report degraded behavior if missing.