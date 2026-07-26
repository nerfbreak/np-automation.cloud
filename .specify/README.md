# Spec Kit — epic-mendeleev

GitHub Spec Kit integration for structured specification workflow.

---

## Status

**Initialized**: 2026-07-26  
**Constitution**: `.specify/CONSTITUTION.md` created  
**Specs Directory**: `.specify/specs/` ready  

---

## Workflow

For non-trivial features, follow the Spec Kit workflow:

1. **Specify** — Write specification in `.specify/specs/FEATURE-NAME.md`
2. **Clarify** — Review with user, iterate on spec
3. **Plan** — Break into implementation tasks
4. **Implement** — Build according to spec
5. **Verify** — Ensure implementation matches spec

---

## Specification Template

```markdown
# FEATURE-NAME

**Status**: draft | approved | implemented  
**Created**: YYYY-MM-DD  
**Owner**: Name  

## Problem
What problem does this solve?

## Requirements
- Functional requirements
- Non-functional requirements
- Constraints

## Design
How will this work?

## Testing
How will we verify it works?

## Rollout
How will we deploy?
```

---

## Constitution

Core project principles and constraints documented in `.specify/CONSTITUTION.md`.

All contributors and AI agents must read and follow the constitution.

---

## RTK (Rust Token Killer) Status

**Status**: Not installed (requires Rust toolchain)  
**Alternative**: Headroom v0.30.0 installed (vendors RTK binary)  
**Usage**: Use `headroom wrap cline` for token compression proxy  
**Documented**: `.agents/CURRENT_HANDOFF.md` line 38  

RTK functionality available via Headroom's `HEADROOM_CONTEXT_TOOL` - no separate installation needed.

---

**Last Updated**: 2026-07-26
