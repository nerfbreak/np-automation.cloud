---
name: session-bootstrap
description: Executes canonical session bootstrap protocol
---
# Skill: session-bootstrap

**Purpose**: Execute canonical bootstrap, load shared memory, verify handoff, discover Spec Kit, inspect Git, verify Headroom/RTK, apply Caveman Full.
**Usage**: Automatically invoked at the start of every session via project rules.
**Constraints**: Must not modify product code.
**Procedure**: Read `.ai-memory/BOOTSTRAP.md` and execute exactly as specified.