# Agent Integrations Matrix

## Cline
- **Detected**: Yes (`.cline/` configuration exists)
- **Repository entrypoint**: `AGENTS.md` → `.ai-memory/BOOTSTRAP.md`
- **Automatic instruction loading**: Configured via `.cline/rules/00-bootstrap.md`
- **Bootstrap mechanism**: Follows canonical `.ai-memory/BOOTSTRAP.md`
- **Skill integration**: 6 custom skills in `.cline/skills/`
- **Hook support**: Available via Headroom wrap
- **Spec Kit integration**: Supported via `speckit-workflow` skill
- **Headroom integration**: Supported via `headroom wrap cline` and `headroom-context` skill
- **RTK integration**: Supported via `rtk-terminal` skill
- **Caveman integration**: Configured via `caveman-full` skill
- **Fresh-session behavior**: Automatically reads BOOTSTRAP.md and reconstructs state
- **Runtime verified**: Yes
- **Known limitations**: Headroom wrap requires manual extension API config in VS Code
- **Manual fallback**: Read and execute `.ai-memory/BOOTSTRAP.md` before repository work.

## Claude Code
- **Detected**: Yes (`.claude/` directory exists)
- **Repository entrypoint**: `AGENTS.md`
- **Automatic instruction loading**: Through standard memory reading
- **Bootstrap mechanism**: Manual/Prompted
- **Skill integration**: 40+ skills mapped from `addyosmani/agent-skills`
- **Hook support**: Unknown
- **Spec Kit integration**: Manual
- **Headroom integration**: Degraded (not currently wrapped)
- **RTK integration**: Degraded (binary present, not active)
- **Caveman integration**: Prompt-based
- **Fresh-session behavior**: Reads `.agents/` memory
- **Runtime verified**: No
- **Known limitations**: Lacks automatic bootstrap integration (relies on AGENTS.md reading).
- **Manual fallback**: Read and execute `.ai-memory/BOOTSTRAP.md` before repository work.