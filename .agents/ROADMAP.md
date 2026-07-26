# Roadmap — epic-mendeleev

Work priorities organized by time horizon: NOW (current focus), NEXT (queued), LATER (backlog), and recently completed items.

---

## NOW (Current Focus)

Active work in progress. Should contain 1-3 items maximum.

### Memory System Enhancement
**Status**: In Progress  
**Started**: 2026-07-26  
**Owner**: AI Agent (Cline)

Enhancing existing `.agents/` memory system to meet mandate requirements:
- ✅ Created `.agents/README.md` (memory system documentation)
- ✅ Created `.agents/DECISIONS.md` (ADR format)
- ✅ Created `.agents/KNOWN_ISSUES.md` (issue tracking)
- 🔄 Creating `.agents/ROADMAP.md` (this file)
- ⏳ Create `.agents/SESSION_LOG.md` (session history)
- ⏳ Create root `AGENTS.md` (high-level rules)
- ⏳ Initialize Spec Kit integration
- ⏳ Verify/install RTK
- ⏳ Create constitution

**Blockers**: None

---

## NEXT (Queued)

Ready to start after NOW items complete. Ordered by priority.

### Test AI Auto-Fix Feature Post-Migration
**Priority**: High  
**Owner**: Unassigned

Validate 9Router cloud gateway integration:
- Wait for GitHub Actions deploy to complete
- SSH to VPS and add `NINEROUTER_API_KEY` to `.env.local`
- Restart worker: `pm2 restart np-worker`
- Trigger build error in Telegram
- Click "🔮 AI Auto-Fix" button
- Verify AI response from 9Router
- Monitor logs for errors

**Dependencies**: 
- Deploy completion
- VPS env var manual update (see ISSUE-0001)

**Related**:
- Commit `bb48ccf` (9Router migration)
- `.agents/KNOWN_ISSUES.md` ISSUE-0001

### Test `/code` Command Post-Migration
**Priority**: High  
**Owner**: Unassigned

Validate `/code` Telegram command with 9Router:
- Send `/code <query>` in Telegram
- Verify AI response
- Check response quality vs previous OmniRoute
- Monitor performance/latency

**Dependencies**: Same as AI Auto-Fix testing

### Monitor VPS Stability
**Priority**: Medium  
**Owner**: Unassigned

Ongoing production monitoring:
- Check cron job/worker stability
- Verify `/public/screenshots` permissions
- Monitor RAM usage (Chromium instances)
- Review PM2 logs for errors
- Check Redis queue depth

**Related**:
- `.agents/VPS_DEPLOY_GUIDE.md` (troubleshooting section)
- `.agents/MEMORY.md` (architecture constraints)

---

## LATER (Backlog)

Future work, not yet prioritized. No specific order.

### Automate VPS Environment Variable Sync
**Priority**: Medium  
**Related**: ISSUE-0001

Potential solutions:
1. GitHub Secrets + deploy script injection
2. Pre-deploy env var validation check
3. Interactive VPS sync script
4. Encrypted env var file in repo

Needs investigation and design before implementation.

### Improve Telegram Bot Error Handling
**Priority**: Low

Current bot error messages could be more user-friendly:
- Generic errors don't indicate root cause
- No retry mechanism for transient failures
- Screenshot on error is good, but needs better context

### Add Rate Limiting to AI Features
**Priority**: Low

Prevent abuse of AI Auto-Fix and `/code` command:
- Per-user rate limiting
- Cost tracking for 9Router API usage
- Monthly budget alerts

### Performance Optimization
**Priority**: Low

Areas for potential improvement:
- Playwright bot execution time
- BullMQ queue processing speed
- Next.js page load performance
- Database query optimization

---

## COMPLETED RECENTLY

Items completed in last 30 days. Archive older items to prevent bloat.

### Migrate Telegram AI from localhost OmniRoute to 9Router Cloud
**Completed**: 2026-07-26  
**Commit**: `bb48ccf`

Migrated AI Auto-Fix and `/code` command from localhost to 9Router cloud gateway. Status: Deployed, awaiting VPS env update and validation.

### Fix Telegram AI Auto-Fix SSE Parsing
**Completed**: 2026-07-20  
**Commit**: `78ef1ff`

Fixed SSE parsing, proxy auth, added restart_worker button.

### Fix Invalid UTF-8 in Report Page
**Completed**: 2026-07-21  
**Commit**: `1c53223`

Replaced invalid UTF-8 byte 0x85 in `report/page.tsx`.

### Fix Worker Duration Tracking
**Completed**: 2026-07-24  
**Commits**: `1f015c8`, `fae30d9`

Fixed job duration showing as "0s" by updating `updated_at` timestamp. Restored screenshot and Telegram notification logic.

### Initialize AI Shared Memory System
**Completed**: 2026-07-20

Created initial `.agents/` structure with MEMORY.md, CURRENT_HANDOFF.md, VPS_DEPLOY_GUIDE.md, and 54+ agent skills.

---

## Roadmap Management Guidelines

### Adding Items
- Add to appropriate section based on priority and timeline
- Include priority, owner, dependencies, blockers
- Link to related issues, commits, or specifications

### Moving Items
- NOW → COMPLETED when verified done
- NEXT → NOW when starting work
- LATER → NEXT when prioritized
- Any section → Blocked (with blocker reason) when stuck

### Archiving
- Move COMPLETED items older than 30 days to archive
- Keep archive in `.agents/archive/YYYY-MM/ROADMAP_archive.md`
- Maintain link to archived items for reference

### Status Updates
- Review roadmap weekly or after major milestones
- Update status, blockers, progress
- Reorder NEXT items based on changing priorities

---

**Last Updated**: 2026-07-26 (Initial creation during memory system enhancement)

