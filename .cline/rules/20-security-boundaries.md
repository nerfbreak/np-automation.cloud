# Security Boundaries
- **No Credentials in Source**: Never commit `.env` or hardcode tokens (Telegram, Supabase, AES keys).
- **Memory Files**: Do not store credentials in `.agents/` or `.ai-memory/`. Use env var keys only.
- **Context Output**: Prevent sensitive API keys, production DB data, and raw Playwright storage states from being captured by Headroom or RTK logs.
- **Mutations**: Destructive database/Redis commands and infrastructure changes require explicit owner approval.