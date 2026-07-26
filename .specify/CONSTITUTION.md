# Constitution — epic-mendeleev (NP Automation)

Core principles, values, and immutable constraints for this project and AI collaboration.

---

## Project Identity

**Name**: NP Automation (epic-mendeleev)  
**Purpose**: Internal IT automation platform for stock management via Newspage portal  
**Users**: Internal IT team (Reckitt Indonesia)  
**Classification**: Proprietary - Internal Use Only

---

## Core Principles

### 1. Production Stability Above All
- Never sacrifice production stability for speed or convenience
- Locked logic remains locked unless owner explicitly approves
- Test thoroughly before deploying to VPS
- Two-process architecture is non-negotiable (Next.js + Worker)

### 2. Security by Default
- No credentials in source code, ever
- Environment variables for all secrets
- Authentication required for all endpoints
- Audit logs for sensitive operations

### 3. Maintainability Over Cleverness
- Code clarity beats performance micro-optimization
- Document complex logic inline
- Prefer explicit over implicit
- Avoid premature abstraction

### 4. Automation Reliability
- Playwright bot stability is critical (production revenue impact)
- Retry logic for transient failures
- Comprehensive error handling and logging
- Screenshot evidence for debugging

### 5. Team Collaboration
- Shared memory system as single source of truth
- Document decisions in ADRs
- Update handoff notes after every session
- Preserve context for future work

---

## Immutable Constraints

### Architecture Constraints
**Cannot be changed without major refactor:**

1. **Two-Process Model**: Next.js web + standalone BullMQ worker must remain separate
2. **Job Queue**: BullMQ + Redis is the only queue system
3. **Automation**: Playwright Chromium is the only browser automation tool
4. **Database**: Supabase PostgreSQL (migration cost too high)
5. **Deployment**: PM2 process management on Ubuntu VPS

**Rationale**: These form the foundation. Changing them requires weeks of work and production downtime.

### Business Constraints
**Cannot be violated:**

1. **Newspage Portal**: External system we don't control; must adapt to their changes
2. **Distributor Workflow**: Defined by business process, not us
3. **Data Accuracy**: Stock adjustment errors have financial impact
4. **Uptime**: System runs 24/7, downtime affects operations
5. **Security**: Handle distributor credentials, must be encrypted

### Technical Constraints
**Limited by environment:**

1. **VPS RAM**: 2GB total (limits concurrent Chromium instances to 2)
2. **Playwright Headless**: VPS has no GUI (must run headless)
3. **Network**: VPS behind corporate firewall (affects external API access)
4. **Node.js**: v20+ required for Next.js 16
5. **Windows Dev + Linux Prod**: Must work on both platforms

---

## AI Collaboration Rules

### What AI Agents Must Do
1. Read all `.agents/` memory files at session start
2. Follow chunked write protocol (max 350 lines per operation)
3. Respect locked logic markers in code
4. Verify changes with build/tests before presenting
5. Update memory files after every session
6. Ask when security implications are unclear

### What AI Agents Must NOT Do
1. Modify locked logic without explicit permission
2. Hardcode secrets or credentials
3. Import worker setup into Next.js API routes
4. Suggest removing "unnecessary" error handling
5. Claim verification succeeded when it didn't
6. Break two-process architecture

### When to Push Back
AI agents should challenge the user when:
- Request would break production
- Security implications are severe
- Architectural violation is proposed
- Locked logic modification is casual
- Change conflicts with documented decisions

---

## Decision Authority

### User Has Final Say On:
- Feature priorities and requirements
- When to deploy to production
- Security policy and risk acceptance
- Budget and resource allocation
- Unlocking locked logic

### AI Agent Has Authority To:
- Suggest better approaches and alternatives
- Refuse operations that violate security
- Choose implementation details within constraints
- Refactor code for maintainability
- Update documentation and memory

### Requires Mutual Agreement:
- Architecture decision changes
- Technology stack additions
- Breaking changes to public APIs
- Major refactors affecting multiple systems

---

## Quality Standards

### Code Quality
- TypeScript strict mode enabled
- ESLint rules enforced
- Meaningful variable names
- Error handling on all async operations
- Comments for non-obvious logic

### Testing Requirements
- Critical paths must have tests
- Bug fixes must have regression tests
- Playwright automation has manual verification
- Build must pass before committing

### Documentation Requirements
- README.md kept current
- API changes documented
- Deployment changes in VPS_DEPLOY_GUIDE.md
- Complex features get ADR in DECISIONS.md

---

## Evolution and Amendment

### This Constitution Can Be Amended When:
1. User explicitly requests constitution change
2. Architectural constraint is removed (e.g., VPS RAM upgrade)
3. Business requirements fundamentally change
4. Better approach is discovered with user agreement

### Amendment Process:
1. Propose change in `.agents/DECISIONS.md` as new ADR
2. Document rationale and impact
3. Get explicit user approval
4. Update constitution
5. Note amendment in `.agents/SESSION_LOG.md`

### Amendment History:
- 2026-07-26: Initial constitution created

---

## In Case of Conflict

**Priority order for resolving conflicts:**

1. **Security and safety** — Always wins, no exceptions
2. **This constitution** — Overrides preferences
3. **Locked logic** — Production-verified code stays locked
4. **Architecture decisions** — Documented ADRs have precedence
5. **User explicit request** — Active conversation guidance
6. **Memory system** — Shared context and state
7. **Code and tests** — Verified implementation
8. **Agent judgment** — When no clear guidance exists

---

**Established**: 2026-07-26  
**Authority**: User (rizki) + AI Collaboration Framework  
**Binding**: All AI agents and contributors

