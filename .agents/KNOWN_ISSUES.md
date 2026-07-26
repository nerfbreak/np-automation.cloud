# Known Issues — epic-mendeleev

Active bugs, blockers, and technical debt requiring attention. Update this file as issues are discovered, investigated, or resolved.

---

## Format

Each issue should include:
- **ID**: Unique identifier (ISSUE-NNNN)
- **Status**: `open` | `investigating` | `blocked` | `resolved`
- **Severity**: `critical` | `high` | `medium` | `low`
- **Discovered**: Date when issue was found
- **Component**: Affected system/module
- **Description**: Clear explanation of the problem
- **Impact**: How it affects users/system
- **Reproduction**: Steps to reproduce (if applicable)
- **Workaround**: Temporary solution (if available)
- **Root cause**: Analysis (if known)
- **Related files**: Affected source code
- **Related commits**: Git commits related to issue
- **Assigned to**: Who is investigating/fixing

---

## Active Issues

### ISSUE-0001: GitHub Actions VPS Deploy Manual Env Update Required

**Status**: `open`  
**Severity**: `medium`  
**Discovered**: 2026-07-26  
**Component**: CI/CD, VPS Deployment

**Description**:
When deploying code changes that require new environment variables (e.g., `NINEROUTER_API_KEY`), the automated GitHub Actions deploy workflow successfully pushes code to VPS and restarts services, but does NOT automatically update `.env.local` on the VPS.

**Impact**:
- New features requiring new env vars fail silently after deployment
- Manual SSH intervention required to add missing env vars
- Creates deployment friction and potential for human error

**Reproduction**:
1. Add new env var to `.env.example` and code
2. Commit and push to master (triggers GitHub Actions)
3. Deploy completes successfully
4. New feature fails on VPS due to missing env var
5. Must manually SSH and update `.env.local`

**Workaround**:
After deploy completes:
```bash
ssh rizki@vps-ip
cd /home/rizki/np-automation
nano .env.local
# Add missing env var
pm2 restart np-worker
```

**Root Cause**:
- GitHub Actions workflow runs `git pull`, `npm install`, `npm run build`, `pm2 restart`
- `.env.local` is gitignored (correctly, for security)
- No mechanism to sync env vars from local dev to VPS
- Deploy script assumes all env vars already exist on VPS

**Related Files**:
- `.github/workflows/deploy.yml`
- `deploy.sh`
- `.env.example`
- `.env.local` (VPS)

**Related Commits**:
- `bb48ccf` - Added NINEROUTER_API_KEY (highlighted this issue)

**Assigned to**: Unassigned

**Potential Solutions**:
1. Create GitHub Secrets for all env vars, inject during deploy
2. Add env var validation script that fails deploy if mismatch detected
3. Create VPS env var sync script that prompts for missing vars
4. Document env var changes in PR/commit messages more prominently

---

## Resolved Issues (Archive)

Move resolved issues here after 30 days. Keep for historical reference.

### Template for Resolved Issues

```markdown
### ISSUE-NNNN: Brief Description

**Status**: `resolved`  
**Resolved**: YYYY-MM-DD  
**Original severity**: X  
**Resolution**: Brief explanation of fix
**Resolved by**: Commit hash or reference
```

---

## Issue Tracking Guidelines

### When to Add an Issue
- Bug confirmed in production or development
- Technical debt that causes recurring problems
- Blocked feature that needs external dependency
- Performance degradation detected
- Security vulnerability discovered

### When to Update Status
- `open` → `investigating`: Root cause analysis started
- `investigating` → `blocked`: External dependency identified
- `investigating` → `open`: Need more information
- `open` → `resolved`: Fix verified in production
- `blocked` → `open`: Blocker removed

### When to Archive
- 30 days after resolution
- Issue has not recurred
- Related code is stable

### Security Issues
- Mark as `critical` severity
- Do NOT include exploit details in this public file
- Document in separate secure channel
- Include only sanitized description and affected components

---

**Last Updated**: 2026-07-26 (Initial creation during memory system enhancement)
