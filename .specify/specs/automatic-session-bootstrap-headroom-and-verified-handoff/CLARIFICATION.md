# Clarification: .ai-memory vs .agents Directory

## Conflict
The mandate explicitly requires:
- `.ai-memory/BOOTSTRAP.md`
- `.ai-memory/HANDOFF.md`
- `.ai-memory/AGENT_INTEGRATIONS.md`
- And references other files like `.ai-memory/README.md`

However, the repository currently uses `.agents/` for shared memory, and ADR-0002 explicitly decided to enhance `.agents/` rather than creating a duplicate `.ai-memory/` directory.

## Resolution
To satisfy both the strict path requirements of the mandate and the existing architectural decision (ADR-0002):

1. **Bootstrap & Integration Files**: We will create `.ai-memory/BOOTSTRAP.md`, `.ai-memory/HANDOFF.md`, and `.ai-memory/AGENT_INTEGRATIONS.md` exactly as requested.
2. **Memory Files**: BOOTSTRAP.md will be explicitly configured to load the existing `.agents/` memory files (`.agents/README.md`, `.agents/MEMORY.md`, `.agents/DECISIONS.md`, etc.).
3. **Handoff Migration**: We will create `.ai-memory/HANDOFF.md` using the new verified format and instruct future agents to use it as the canonical handoff, phasing out `.agents/CURRENT_HANDOFF.md` (or keeping it in sync if strictly necessary, but preferably standardizing on `.ai-memory/HANDOFF.md` for the handoff artifact to match the mandate).
4. **ADR Update**: A new ADR (ADR-0003) will document this hybrid structure, explaining how `.ai-memory/` holds the session mechanics while `.agents/` holds the project knowledge.

This ensures mandate compliance without violating ADR-0002's prohibition on duplicating the core memory files.