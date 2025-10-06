# KB Builder - Risk Register

This document identifies risks, assumptions, and mitigation strategies for the KB Builder project.

---

## Risk Categories

- **Technical** - Implementation, integration, performance
- **Business/UX** - User experience, adoption, expectations
- **Dependency** - Third-party APIs, services
- **Security** - Data protection, access control
- **Operational** - Deployment, maintenance

---

## 1. Technical Risks

### 1.1 Supabase RLS Policy Complexity

**Risk:** Row Level Security policies may not correctly prevent unauthorized access, leading to data leaks.

**Likelihood:** Medium  
**Impact:** Critical  
**Severity:** HIGH

**Mitigation:**
- Test RLS policies with multiple user scenarios
- Create test suite that attempts unauthorized access
- Code review all policies before deployment
- Use Supabase's built-in RLS testing tools
- Document policy logic in `SUPABASE_README.md`

**Rollback:**
- If RLS breach discovered post-launch: immediately disable affected endpoints
- Audit access logs
- Notify affected users
- Apply corrective policies and re-test

---

### 1.2 Image Upload Performance

**Risk:** Large image uploads (approaching 10 MB limit) may cause timeouts or poor UX, especially on slow connections.

**Likelihood:** High  
**Impact:** Medium  
**Severity:** MEDIUM

**Mitigation:**
- Client-side image compression before upload (reduce quality if > 5 MB)
- Progress indicator during upload
- Chunked upload for large files (if Supabase supports)
- Clear messaging: "Uploading large image may take time"
- Set reasonable timeout (30s) with retry option

**Rollback:**
- Reduce max file size to 5 MB if 10 MB proves problematic
- Add server-side compression step

**Assumptions:**
- Users will primarily upload web-optimized images (< 2 MB)
- Network conditions are reasonably stable

---

### 1.3 AI API Rate Limits

**Risk:** Perplexity or OpenAI may rate-limit requests, causing user-facing failures during peak usage.

**Likelihood:** Medium  
**Impact:** High  
**Severity:** HIGH

**Mitigation:**
- Implement exponential backoff retry logic
- Queue system for AI requests (server-side)
- Clear error messaging: "AI service is busy, retrying..."
- Monitor API usage dashboards
- Alert on approaching rate limits
- Consider caching common research queries (e.g., same company URL)

**Rollback:**
- Implement request queue with estimated wait time
- Upgrade API tier if needed
- Gracefully degrade: allow manual input if AI fails

**Assumptions:**
- Free/basic tier limits are sufficient for MVP
- Users won't spam regeneration buttons

---

### 1.4 TypeScript Strict Mode Compliance

**Risk:** Strict TypeScript may surface complex type errors, slowing development.

**Likelihood:** Medium  
**Impact:** Low  
**Severity:** LOW

**Mitigation:**
- Start with strict mode from Day 1 (already configured)
- Define clear type interfaces early (Phase 3)
- Use `unknown` instead of `any` where needed
- Regular `pnpm typecheck` during development

**Rollback:**
- Temporarily disable `strict` if blocking critical path (not recommended)

**Assumptions:**
- Team has TypeScript experience
- Type complexity is manageable for this project scope

---

### 1.5 i18n Key Mismatches

**Risk:** Missing or mismatched translation keys cause blank UI strings or app crashes.

**Likelihood:** High  
**Impact:** Medium  
**Severity:** MEDIUM

**Mitigation:**
- Automated script to validate all keys exist in all locales
- Run validation in CI/CD pipeline
- Default to English fallback with console warning
- i18next configured with `fallbackLng: 'en-US'`
- Regular QA in all 4 locales

**Rollback:**
- If production keys missing: hotfix with English strings
- Long-term: improve validation tooling

**Assumptions:**
- Translation files are maintained consistently
- i18next handles missing keys gracefully

---

### 1.6 Concurrent Editing Conflicts

**Risk:** User opens KB Builder in multiple tabs, causing race conditions on save.

**Likelihood:** Low  
**Impact:** Medium  
**Severity:** LOW

**Mitigation:**
- Optimistic UI updates with React Query
- Last-write-wins strategy (acceptable for MVP)
- Optional: add `updated_at` timestamp checks
- Display warning if session opened elsewhere (future enhancement)

**Rollback:**
- Lock session to single browser tab (future)
- Auto-reload stale data

**Assumptions:**
- Single-user sessions (no collaboration)
- Conflicts are rare in typical use case

---

## 2. Business/UX Risks

### 2.1 AI Output Quality

**Risk:** Perplexity or OpenAI returns generic, low-quality, or inaccurate content, disappointing users.

**Likelihood:** High  
**Impact:** High  
**Severity:** HIGH

**Mitigation:**
- Carefully craft prompts per `KBBuilder_Prompt_Playbook.md`
- Iterate on prompts based on user feedback
- Always allow user editing before save
- Provide "Regenerate" button
- Set clear expectations: "Review and edit AI-generated content"
- Include sources for verification

**Rollback:**
- Refine prompts post-launch based on feedback
- Add manual input mode if AI consistently fails

**Assumptions:**
- Users understand AI is a starting point, not final output
- Prompts will need tuning over time

---

### 2.2 No Public Information Available

**Risk:** Company URL has minimal public info, Perplexity returns sparse results.

**Likelihood:** Medium  
**Impact:** Medium  
**Severity:** MEDIUM

**Mitigation:**
- Detect low-confidence responses (e.g., < 2 sources)
- Prompt user to add details manually
- Provide template content as fallback
- Clear messaging: "Limited public info found. Please add details."

**Rollback:**
- Skip research step entirely for such companies
- Offer manual entry wizard instead

**Assumptions:**
- Most companies have some web presence
- Users willing to supplement AI output

---

### 2.3 User Drops Off Mid-Flow

**Risk:** 7 steps feel too long; users abandon before completing.

**Likelihood:** Medium  
**Impact:** Medium  
**Severity:** MEDIUM

**Mitigation:**
- Save progress at each step (auto-save)
- Allow resuming session via unique link or localStorage
- Progress indicator (e.g., "Step 3 of 7")
- Estimate time: "~15 minutes to complete"
- Skip option for optional steps (if applicable)

**Rollback:**
- Shorten wizard to 5 steps (merge some)
- Offer "Quick Mode" with fewer fields

**Assumptions:**
- Users are motivated to complete (high intent)
- 15-20 minutes is acceptable for this task

---

### 2.4 Locale-Specific UX Issues

**Risk:** Translations feel unnatural, or cultural nuances missed (e.g., pt-PT vs pt-BR).

**Likelihood:** Medium  
**Impact:** Low  
**Severity:** LOW

**Mitigation:**
- Native speaker review for pt-BR and pt-PT
- User testing in each locale
- Avoid idioms or slang in source strings
- Keep tone professional and neutral

**Rollback:**
- Hotfix translation files based on feedback
- Crowdsource improvements from users

**Assumptions:**
- Initial translations are "good enough" for MVP
- Community can help refine over time

---

## 3. Dependency Risks

### 3.1 Perplexity API Changes

**Risk:** Perplexity API changes request/response format, breaking integration.

**Likelihood:** Low  
**Impact:** High  
**Severity:** MEDIUM

**Mitigation:**
- Pin API version in requests (if supported)
- Monitor Perplexity changelog/announcements
- Abstract API calls in service layer (easy to swap)
- Implement health check for Perplexity endpoint

**Rollback:**
- Switch to alternative research API (e.g., Brave Search, Google Custom Search)
- Fallback to manual research input

**Assumptions:**
- Perplexity API is stable
- Breaking changes are announced in advance

---

### 3.2 OpenAI API Changes or Quota Limits

**Risk:** OpenAI Vision API changes, or account hits quota limits.

**Likelihood:** Low  
**Impact:** High  
**Severity:** MEDIUM

**Mitigation:**
- Use stable API version (e.g., `gpt-4-vision-preview`)
- Monitor usage dashboards
- Set up billing alerts
- Abstract Vision calls in service layer
- Plan B: use Claude Vision or similar

**Rollback:**
- Upgrade OpenAI tier if quota hit
- Switch to alternative vision API (Anthropic Claude, Google Gemini)

**Assumptions:**
- OpenAI maintains backward compatibility
- Quota sufficient for expected traffic

---

### 3.3 Supabase Downtime

**Risk:** Supabase experiences outage, making app unusable.

**Likelihood:** Low  
**Impact:** Critical  
**Severity:** MEDIUM

**Mitigation:**
- Supabase has 99.9% SLA
- Implement retry logic with exponential backoff
- Display friendly error: "Service temporarily unavailable"
- Monitor Supabase status page
- Local development uses self-hosted Supabase (optional)

**Rollback:**
- Wait for Supabase recovery (no immediate alternative)
- Long-term: multi-region setup or backup DB

**Assumptions:**
- Supabase is reliable for MVP
- Downtime is rare and short-lived

---

### 3.4 Shadcn/UI Component Bugs

**Risk:** Shadcn components have accessibility or browser compatibility issues.

**Likelihood:** Low  
**Impact:** Low  
**Severity:** LOW

**Mitigation:**
- Use latest stable Shadcn components
- Test in major browsers (Chrome, Firefox, Safari, Edge)
- Accessibility audit with tools (axe, Lighthouse)
- File issues upstream if bugs found

**Rollback:**
- Patch components locally if needed
- Switch to alternative UI library (Radix UI directly, Headless UI)

**Assumptions:**
- Shadcn/UI is production-ready
- Community support is active

---

## 4. Security Risks

### 4.1 API Key Exposure

**Risk:** OpenAI or Perplexity API keys accidentally exposed in client code or logs.

**Likelihood:** Low  
**Impact:** Critical  
**Severity:** HIGH

**Mitigation:**
- Store keys in `.env.local` (server-side only)
- Never import server env vars in client code
- Add `.env.local` to `.gitignore` (already done)
- Code review for accidental logging
- Use secret scanning tools (GitHub, GitGuardian)

**Rollback:**
- Immediately rotate exposed keys
- Audit usage for unauthorized requests
- Refund/dispute charges if needed

**Assumptions:**
- Team follows security best practices
- CI/CD does not log secrets

---

### 4.2 Image Upload Malware/Exploits

**Risk:** User uploads malicious image file attempting server or client exploit.

**Likelihood:** Low  
**Impact:** High  
**Severity:** MEDIUM

**Mitigation:**
- Validate MIME type and file extension
- Supabase Storage has built-in virus scanning (verify)
- Do not execute or parse image metadata on server
- Isolate image processing in sandboxed environment
- Set restrictive CORS and CSP headers

**Rollback:**
- Disable image upload temporarily
- Scan uploaded files with external service (VirusTotal API)

**Assumptions:**
- Supabase handles file validation
- Image libraries (OpenAI Vision) are secure

---

### 4.3 XSS via User-Generated Content

**Risk:** User inputs malicious script in markdown/text fields, causing XSS.

**Likelihood:** Low  
**Impact:** High  
**Severity:** MEDIUM

**Mitigation:**
- Sanitize all user input before rendering
- Use React's built-in XSS protection (escapes by default)
- For markdown rendering, use DOMPurify or similar
- Set CSP headers to block inline scripts

**Rollback:**
- Disable markdown preview if vulnerability found
- Escape all user content as plain text temporarily

**Assumptions:**
- React escapes content by default
- Markdown renderer is secure

---

## 5. Operational Risks

### 5.1 Deployment Complexity

**Risk:** Deployment process is manual or error-prone, causing downtime.

**Likelihood:** Medium  
**Impact:** Medium  
**Severity:** MEDIUM

**Mitigation:**
- Document deployment steps clearly in README
- Use CI/CD pipeline (GitHub Actions)
- Automate build, test, deploy
- Blue-green deployment or canary releases
- Rollback plan ready

**Rollback:**
- Revert to previous Git tag/commit
- Keep previous build artifacts for quick rollback

**Assumptions:**
- Deployment platform supports automation
- Team has CI/CD experience

---

### 5.2 Environment Variable Misconfiguration

**Risk:** Production deployed with wrong `.env` values, causing outages or data corruption.

**Likelihood:** Medium  
**Impact:** High  
**Severity:** HIGH

**Mitigation:**
- Separate `.env` files per environment (dev, staging, prod)
- Validate required env vars on startup (throw error if missing)
- Use deployment platform's secret management (Vercel, Render, etc.)
- Never commit `.env` files

**Rollback:**
- Quickly update env vars and redeploy
- Have staging environment to catch issues

**Assumptions:**
- Deployment platform has robust secret management
- Team follows env var best practices

---

### 5.3 Database Migration Failures

**Risk:** Supabase migration fails mid-execution, leaving DB in inconsistent state.

**Likelihood:** Low  
**Impact:** High  
**Severity:** MEDIUM

**Mitigation:**
- Test migrations locally before production
- Use transactions where possible
- Supabase CLI supports rollback migrations
- Take DB snapshot before major migrations
- Run migrations during low-traffic windows

**Rollback:**
- Restore from Supabase snapshot
- Apply rollback migration if available

**Assumptions:**
- Migrations are idempotent (`IF NOT EXISTS`)
- Supabase supports snapshots/backups

---

## 6. Assumptions

### General Assumptions

1. **User Intent:** Users accessing KB Builder have clear intent to create a knowledge base (not casual browsing).
2. **Technical Literacy:** Users are comfortable with web forms and basic editing (markdown not required to master).
3. **Browser Support:** Users on modern browsers (Chrome, Firefox, Safari, Edge; last 2 versions).
4. **Network:** Users have reasonably stable internet (not optimized for offline).
5. **Single User:** Sessions are not collaborative (one user per session).

### Technical Assumptions

1. **Supabase:** Reliable, scales to expected traffic, has good SLA.
2. **AI APIs:** Perplexity and OpenAI are available and responsive (< 10s response time).
3. **Node.js:** LTS version is stable for production use.
4. **React 18:** No breaking changes expected during development.

### Business Assumptions

1. **Use Case:** KB Builder is for initial onboarding; users can later edit KB in main Witfy app.
2. **Free Tier:** AI API costs are acceptable for MVP (monitored closely).
3. **Feedback Loop:** Users will provide feedback for iteration.

---

## 7. Mitigation Summary Table

| Risk | Severity | Primary Mitigation | Rollback Plan |
|------|----------|-------------------|---------------|
| RLS Policy Breach | HIGH | Test suite, code review | Disable endpoints, audit |
| AI Rate Limits | HIGH | Retry logic, queue | Upgrade tier, manual input |
| AI Output Quality | HIGH | Prompt tuning, user editing | Refine prompts, manual mode |
| API Key Exposure | HIGH | Env vars, secret scanning | Rotate keys immediately |
| Image Upload Perf | MEDIUM | Compression, progress bar | Reduce max size |
| Perplexity API Changes | MEDIUM | Service layer abstraction | Switch to alternative API |
| OpenAI API Changes | MEDIUM | Version pinning | Switch to Claude/Gemini |
| Env Misconfiguration | HIGH | Validation on startup | Quick redeploy |

---

## 8. Monitoring & Alerts

### Key Metrics to Monitor

- API response times (Perplexity, OpenAI)
- API error rates
- Database query performance
- Image upload success/failure rates
- User drop-off points in wizard
- Locale distribution

### Alerts to Set Up

- API quota approaching limit (80%)
- Error rate > 5% for any endpoint
- Database CPU/memory > 80%
- Supabase downtime detected
- Unusually high image upload failures

---

## 9. Continuous Risk Management

- **Weekly:** Review error logs and user feedback
- **Monthly:** Re-assess risk severity based on actual usage
- **Quarterly:** Update risk register with new risks
- **Post-Incident:** Conduct retrospective and update mitigations

---

**Risk Owner:** Development Team  
**Review Frequency:** Weekly during development, monthly post-launch  
**Last Updated:** Phase 1 (Planning)

