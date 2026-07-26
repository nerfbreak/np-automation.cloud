---
name: speckit-workflow
description: Enforces Spec Kit feature lifecycle
---
# Skill: speckit-workflow

**Purpose**: Block non-trivial implementation without an active accepted specification.
**Lifecycle**: Constitution → Specify → Clarify → Plan → Tasks → Analyze → Implement → Validate → Memory → Handoff.
**Procedure**: 
1. Create dedicated feature directory in `.specify/specs/`.
2. Write `.md` artifacts for each lifecycle stage.
3. Do not modify product code until Analysis is approved.