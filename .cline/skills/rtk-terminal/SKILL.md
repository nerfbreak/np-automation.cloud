---
name: rtk-terminal
description: Applies RTK compression for shell commands
---
# Skill: rtk-terminal

**Purpose**: Enforce RTK first for supported terminal commands to save context tokens.
**Constraints**: 
- Preserve exit codes.
- Use targeted raw fallback if RTK hides critical error details.
- No false validation claims based on compressed output.
**Procedure**: Prefix supported commands with `rtk` (e.g., `rtk git status`, `rtk npm test`). If ambiguous, fallback to raw command.