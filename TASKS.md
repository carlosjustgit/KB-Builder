# KB Builder - Ordered Task List

This document provides a detailed, actionable task breakdown for the KB Builder project. Each task includes a Definition of Done (DoD) to ensure quality and completeness.

---

## Phase 0: Bootstrap ✅ COMPLETE

### Task 0.1: Environment Setup
**Status:** ✅ Complete
**DoD:**
- [x] pnpm installed globally
- [x] Git initialized in project directory
- [x] GitHub remote configured
- [x] Branch `chore/bootstrap` created

### Task 0.2: Project Structure
**Status:** ✅ Complete
**DoD:**
- [x] Folder structure created (`client/`, `server/`, `supabase/`)
- [x] Subfolder structure for routes, components, services
- [x] `.gitignore` configured

### Task 0.3: Dependencies
**Status:** ✅ Complete
**DoD:**
- [x] `package.json` with all required dependencies
- [x] Scripts configured: `dev`, `dev:client`, `dev:server`, `build`, `lint`, `typecheck`
- [x] All dependencies installed via `pnpm install`

### Task 0.4: Configuration Files
**Status:** ✅ Complete
**DoD:**
- [x] `tsconfig.json` and `tsconfig.node.json`
- [x] `vite.config.ts` with path aliases
- [x] `tailwind.config.ts` with Witfy theme
- [x] `postcss.config.js`
- [x] `.eslintrc.cjs` and `.prettierrc`
- [x] `.env.example` and `.env.local.example`

### Task 0.5: Initial Commit
**Status:** ✅ Complete
**DoD:**
- [x] All bootstrap files committed
- [x] Commit message follows Conventional Commits
- [x] `README.md` with setup instructions

### Task 0.6: Create PR-000
**Status:** ⏳ Pending (manual SSH push required)
**DoD:**
- [ ] Branch pushed to GitHub
- [ ] PR-000 created: `chore/bootstrap` → `main`
- [ ] PR description includes setup verification steps

---

## Phase 1: Planning Documents

### Task 1.1: Create Planning Branch
**Status:** ✅ Complete
**DoD:**
- [x] Branch `docs/plan` created from `chore/bootstrap`
- [x] Switched to `docs/plan` branch

### Task 1.2: PLAN.md
**Status:** ✅ Complete
**DoD:**
- [x] Executive summary with key deliverables
- [x] Architecture overview (tech stack, flow)
- [x] All 7 steps detailed with routes, components, AI usage
- [x] UI/UX implementation plan
- [x] i18n strategy with file structure
- [x] Complete Supabase schema reference
- [x] All API endpoints documented with request/response types
- [x] AI prompt strategy explained
- [x] Error handling approach
- [x] Development phases table
- [x] Success criteria checklist
- [x] References to all spec files

### Task 1.3: TASKS.md
**Status:** 🔄 In Progress
**DoD:**
- [x] All phases listed (0-10)
- [x] Tasks ordered sequentially
- [x] Each task has clear DoD checklist
- [x] Dependencies between tasks noted
- [ ] Estimated effort per task (optional)

### Task 1.4: RISKS.md
**Status:** ⏳ Pending
**DoD:**
- [ ] Technical risks identified
- [ ] Business/UX risks identified
- [ ] Dependency risks (APIs, services)
- [ ] Mitigation strategy for each risk
- [ ] Rollback procedures documented
- [ ] Assumptions explicitly stated

### Task 1.5: ARCH_NOTES.md
**Status:** ⏳ Pending
**DoD:**
- [ ] Client/server split rationale
- [ ] Routing strategy explained
- [ ] Component architecture diagram/description
- [ ] State management approach
- [ ] Error handling patterns
- [ ] File upload flow
- [ ] AI integration patterns
- [ ] Security considerations

### Task 1.6: Commit & Create PR-001
**Status:** ⏳ Pending
**DoD:**
- [ ] All planning docs committed
- [ ] Branch pushed to GitHub
- [ ] PR-001 created: `docs/plan` → `main`
- [ ] PR approved before proceeding to Phase 2

---

## Phase 2: Supabase Audit

### Task 2.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/supabase-audit` created
- [ ] Based on latest `main` (after PR-001 merged)

### Task 2.2: Connect to Supabase Project
**Status:** ⏳ Pending
**DoD:**
- [ ] Supabase CLI installed locally
- [ ] Project linked via `supabase link`
- [ ] Can introspect existing schema
- [ ] `.env` and `.env.local` updated with Supabase credentials

### Task 2.3: Introspect Existing Schema
**Status:** ⏳ Pending
**DoD:**
- [ ] Document any existing KB-related tables
- [ ] Identify conflicts or naming collisions
- [ ] Plan non-breaking alignment strategy

### Task 2.4: Create Migration 001 - Core Tables
**Status:** ⏳ Pending
**DoD:**
- [ ] Migration file: `supabase/migrations/001_create_kb_tables.sql`
- [ ] Creates: `kb_sessions`, `kb_documents`, `kb_sources`, `kb_images`, `kb_visual_guides`, `kb_exports`
- [ ] Includes indexes as per spec
- [ ] Uses `IF NOT EXISTS` for safety

### Task 2.5: Create Migration 002 - Enable RLS
**Status:** ⏳ Pending
**DoD:**
- [ ] Migration file: `supabase/migrations/002_enable_rls.sql`
- [ ] RLS enabled on all KB tables
- [ ] Owner-only policies implemented
- [ ] Policies tested with `auth.uid()`

### Task 2.6: Configure Storage Bucket
**Status:** ⏳ Pending
**DoD:**
- [ ] Bucket `kb-builder` created
- [ ] Folders: `/images/user/`, `/images/generated/`, `/exports/`
- [ ] Storage policies: owner-only read/write
- [ ] Signed URL configuration verified

### Task 2.7: Create Seed Script
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `scripts/seed-local.mjs`
- [ ] Creates 1-2 sample sessions
- [ ] No hardcoded secrets
- [ ] Can run locally for smoke testing

### Task 2.8: Documentation
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `SUPABASE_README.md`
- [ ] Migration run instructions
- [ ] RLS policies summary
- [ ] Storage bucket structure
- [ ] Testing approach

### Task 2.9: Commit & Create PR-002
**Status:** ⏳ Pending
**DoD:**
- [ ] All Supabase files committed
- [ ] Migrations tested locally
- [ ] PR-002 created
- [ ] PR approved before Phase 3

---

## Phase 3: Project Scaffold

### Task 3.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/scaffold` created
- [ ] Based on latest `main`

### Task 3.2: Shared Types
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/types/index.ts` or `server/types/index.ts`
- [ ] Types for: Session, Document, Source, Image, VisualGuide, Export
- [ ] API request/response types
- [ ] No duplication between client/server

### Task 3.3: Server Route Stubs
**Status:** ⏳ Pending (partially done in bootstrap)
**DoD:**
- [ ] `server/routes/research.ts` - POST `/api/research`
- [ ] `server/routes/vision.ts` - POST `/api/vision/analyse`, POST `/api/visual/test-image`
- [ ] `server/routes/export.ts` - POST `/api/export/json`, POST `/api/export/zip`
- [ ] All routes return 501 with "Not implemented" initially
- [ ] All routes registered in `server/index.ts`

### Task 3.4: Supabase Service Layer
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/supabase/client.ts`
- [ ] Exports Supabase client with service role key
- [ ] Helper functions: `createSession`, `getSession`, `updateSession`
- [ ] Helper functions for documents, sources, images
- [ ] Error handling for DB operations

### Task 3.5: Client Supabase Setup
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/lib/supabase.ts`
- [ ] Supabase client with anon key
- [ ] Auth helper (anonymous session if needed)
- [ ] Storage upload helpers

### Task 3.6: i18n Skeleton
**Status:** ⏳ Pending
**DoD:**
- [ ] Directory structure: `client/src/i18n/{locale}/kb-builder/`
- [ ] Files for each step: `step-welcome.json` through `step-export.json`
- [ ] Common strings: `common.json`
- [ ] All 4 locales scaffolded (minimal placeholder content)
- [ ] i18n initialization in `client/src/lib/i18n.ts`
- [ ] Lazy loading configured

### Task 3.7: Commit & Create PR-003
**Status:** ⏳ Pending
**DoD:**
- [ ] All scaffold files committed
- [ ] Can run `pnpm dev` without errors
- [ ] Health check endpoint responds
- [ ] PR-003 created

---

## Phase 4: UI Shell

### Task 4.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/ui-shell` created

### Task 4.2: Install Shadcn Components
**Status:** ⏳ Pending
**DoD:**
- [ ] `npx shadcn-ui@latest init` (non-interactive mode)
- [ ] Components added: Button, Input, Textarea, Label, Tabs, Toast, Dialog, Card, Select, Switch
- [ ] All components in `client/src/components/ui/`

### Task 4.3: Layout Component
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/components/Layout.tsx`
- [ ] Two-pane layout: 70% left, 30% right
- [ ] Side panel with tabs: Summary, Sources, Documents, Visual, Export
- [ ] Fixed footer with locale selector and action buttons
- [ ] Responsive: mobile stacks vertically

### Task 4.4: ChatBubble Component
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/components/ChatBubble.tsx`
- [ ] Variants: user, assistant
- [ ] Action buttons: Search, Regenerate, Edit, Approve, Next
- [ ] TypeScript props interface

### Task 4.5: MarkdownEditor Component
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/components/MarkdownEditor.tsx`
- [ ] Textarea input
- [ ] Preview toggle
- [ ] Minimal toolbar: bold, list, link
- [ ] Character counter (optional)

### Task 4.6: ImageDropzone Component
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/components/ImageDropzone.tsx`
- [ ] Drag & drop support
- [ ] Paste from clipboard
- [ ] Import by URL input
- [ ] File validation (format, size)
- [ ] Error display

### Task 4.7: ImageGrid Component
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/components/ImageGrid.tsx`
- [ ] Grid layout with image cards
- [ ] Thumbnail, filename, size, status badge
- [ ] Remove button per image

### Task 4.8: Toast & Modal Setup
**Status:** ⏳ Pending
**DoD:**
- [ ] Toast provider in `client/src/main.tsx`
- [ ] Modal component with confirm/cancel
- [ ] Accessible keyboard navigation

### Task 4.9: Route Components (Stubs)
**Status:** ⏳ Pending
**DoD:**
- [ ] Files: `client/src/routes/Welcome.tsx`, `Research.tsx`, `Brand.tsx`, `Services.tsx`, `Market.tsx`, `Competitors.tsx`, `Visual.tsx`, `Export.tsx`
- [ ] Each renders placeholder content with correct layout
- [ ] Router configured (React Router or Vite routing)

### Task 4.10: Accessibility Audit
**Status:** ⏳ Pending
**DoD:**
- [ ] Focus rings visible on all interactive elements
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation works
- [ ] Contrast ratios checked (4.5:1 minimum)

### Task 4.11: Commit & Create PR-004
**Status:** ⏳ Pending
**DoD:**
- [ ] All UI components committed
- [ ] Visual parity with spec screenshots (if available)
- [ ] PR-004 created

---

## Phase 5: i18n Content

### Task 5.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/i18n-copy` created

### Task 5.2: Translate Step Content (en-US)
**Status:** ⏳ Pending
**DoD:**
- [ ] All 8 step files populated with English (US) strings
- [ ] Keys match component usage
- [ ] Validation messages included
- [ ] Button labels, tooltips, placeholders

### Task 5.3: Translate Step Content (en-GB)
**Status:** ⏳ Pending
**DoD:**
- [ ] All strings translated with UK spelling ("colour", "organise")
- [ ] Punctuation differences respected

### Task 5.4: Translate Step Content (pt-BR)
**Status:** ⏳ Pending
**DoD:**
- [ ] All strings translated to Brazilian Portuguese
- [ ] Informal "você" form where appropriate

### Task 5.5: Translate Step Content (pt-PT)
**Status:** ⏳ Pending
**DoD:**
- [ ] All strings translated to European Portuguese
- [ ] Formal tone differences from pt-BR
- [ ] No em dashes

### Task 5.6: Locale Switcher Functionality
**Status:** ⏳ Pending
**DoD:**
- [ ] Locale selector in footer
- [ ] Switching updates UI strings immediately
- [ ] State/content NOT reset on switch
- [ ] Preference saved to localStorage

### Task 5.7: Language Detection
**Status:** ⏳ Pending
**DoD:**
- [ ] `i18next-browser-languagedetector` configured
- [ ] Detects browser locale
- [ ] Falls back to `en-US`
- [ ] User override persists

### Task 5.8: Commit & Create PR-005
**Status:** ⏳ Pending
**DoD:**
- [ ] All translation files committed
- [ ] No missing keys (test with all locales)
- [ ] PR-005 created

---

## Phase 6: Supabase Integration

### Task 6.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/supabase-integration` created

### Task 6.2: Session Management
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useSession.ts`
- [ ] Create session on Welcome step
- [ ] Update session step as user progresses
- [ ] Retrieve session on reload (via URL param or localStorage)

### Task 6.3: Document Persistence
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useDocument.ts`
- [ ] Save document (markdown + JSON)
- [ ] Update document
- [ ] Retrieve documents by session_id and doc_type
- [ ] Status management (draft, approved)

### Task 6.4: Source Management
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useSources.ts`
- [ ] Save sources batch
- [ ] Retrieve sources by session_id
- [ ] Display in Sources tab

### Task 6.5: Image Upload
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useImageUpload.ts`
- [ ] Upload to `kb-builder/images/user/`
- [ ] Compute SHA256 hash client-side
- [ ] Check for duplicates before upload
- [ ] Insert record in `kb_images`
- [ ] Return signed URL for preview

### Task 6.6: React Query Setup
**Status:** ⏳ Pending
**DoD:**
- [ ] QueryClient configured in `client/src/main.tsx`
- [ ] Mutations for create/update operations
- [ ] Queries for fetching data
- [ ] Optimistic updates where appropriate

### Task 6.7: Commit & Create PR-006
**Status:** ⏳ Pending
**DoD:**
- [ ] All integration hooks committed
- [ ] Can create session and persist documents
- [ ] PR-006 created

---

## Phase 7: Research Engine (Perplexity)

### Task 7.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/research-engine` created

### Task 7.2: Perplexity Service
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/perplexity/client.ts`
- [ ] Fetch wrapper for Perplexity API
- [ ] Error handling and retries
- [ ] Response parsing

### Task 7.3: Prompt Templates
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/perplexity/prompts.ts`
- [ ] Templates for: brand, market, services, competitors, tone
- [ ] Variable interpolation: {company_url}, {locale}, {max_words}
- [ ] Follows `KBBuilder_Prompt_Playbook.md`

### Task 7.4: Research Route Implementation
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/routes/research.ts` (full implementation)
- [ ] Validates request with Zod
- [ ] Calls Perplexity with correct prompt
- [ ] Parses sources from response
- [ ] Returns structured output
- [ ] Rate limited

### Task 7.5: Client Research Hook
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useResearch.ts`
- [ ] Mutation to call `/api/research`
- [ ] Loading state
- [ ] Error handling with retry

### Task 7.6: Wire Research Step
**Status:** ⏳ Pending
**DoD:**
- [ ] Update `client/src/routes/Research.tsx`
- [ ] Trigger research on URL submit
- [ ] Display draft with sources
- [ ] Approve/edit flow
- [ ] Save to Supabase on approve

### Task 7.7: Wire Other Text Steps
**Status:** ⏳ Pending
**DoD:**
- [ ] Brand & Tone step uses research engine
- [ ] Services step uses research engine
- [ ] Market step uses research engine
- [ ] Competitors step uses research engine
- [ ] All save correctly to `kb_documents`

### Task 7.8: Commit & Create PR-007
**Status:** ⏳ Pending
**DoD:**
- [ ] All research features committed
- [ ] Can complete text steps end-to-end
- [ ] Sources appear in Sources tab
- [ ] PR-007 created

---

## Phase 8: Visual Guide (OpenAI Vision)

### Task 8.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/visual-guide` created

### Task 8.2: OpenAI Vision Service
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/openai/vision.ts`
- [ ] Call OpenAI Vision API with image URLs
- [ ] Parse response into structured visual guide
- [ ] Error handling

### Task 8.3: Visual Analysis Prompt
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/openai/prompts.ts`
- [ ] Prompt extracts: palette, lighting, composition, textures, mood, dos/donts, base prompts, negatives
- [ ] Returns JSON + Markdown
- [ ] Locale-aware
- [ ] Follows `KBBuilder_Prompt_Playbook.md`

### Task 8.4: Vision Route Implementation
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/routes/vision.ts`
- [ ] POST `/api/vision/analyse`
- [ ] Validates request with Zod
- [ ] Fetches signed URLs for uploaded images
- [ ] Calls OpenAI Vision
- [ ] Merges brand context if available
- [ ] Returns visual guide JSON + Markdown
- [ ] Rate limited

### Task 8.5: Test Image Generation (Optional)
**Status:** ⏳ Pending (Optional)
**DoD:**
- [ ] POST `/api/visual/test-image`
- [ ] Uses OpenAI Images API (or Flux)
- [ ] Stores generated images in `kb-builder/images/generated/`
- [ ] Inserts `kb_images` row with role='generated'

### Task 8.6: Client Visual Hook
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useVisual.ts`
- [ ] Mutation to analyse images
- [ ] Mutation to generate test images (optional)
- [ ] Loading states
- [ ] Error handling

### Task 8.7: Wire Visual Step
**Status:** ⏳ Pending
**DoD:**
- [ ] Update `client/src/routes/Visual.tsx`
- [ ] Image upload via dropzone
- [ ] Display uploaded images in grid
- [ ] "Analyse Images" button triggers analysis
- [ ] Display visual guide output
- [ ] "Generate Test Images" button (optional)
- [ ] Save visual guide to `kb_visual_guides`

### Task 8.8: Commit & Create PR-008
**Status:** ⏳ Pending
**DoD:**
- [ ] All visual features committed
- [ ] Can upload images and get visual guide
- [ ] PR-008 created

---

## Phase 9: Exporters (JSON + ZIP)

### Task 9.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `feat/exporters` created

### Task 9.2: JSON Export Service
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/export/json.ts`
- [ ] Fetches all session data (documents, sources, visual guide, images)
- [ ] Assembles into `witfy-kb.json` structure
- [ ] Fields: brand_story, services[], market, competitors[], tone, visual_guide, sources[], version, language
- [ ] Uploads to `kb-builder/exports/`
- [ ] Returns signed URL

### Task 9.3: ZIP Export Service
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/services/zipper/index.ts`
- [ ] Uses `archiver` package
- [ ] Creates ZIP with folder structure:
  - `/kb/*.md` (markdown versions of each doc)
  - `/visual/visual-brand-guideline.md`
  - `/visual/presets.json`
  - `/sources/citations.json`
  - `/images/samples/*` (generated images if any)
- [ ] Streams ZIP to response
- [ ] Also uploads to `kb-builder/exports/`
- [ ] Returns signed URL

### Task 9.4: Export Routes Implementation
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `server/routes/export.ts`
- [ ] POST `/api/export/json`
- [ ] POST `/api/export/zip`
- [ ] Both validate session_id
- [ ] Both insert into `kb_exports` table
- [ ] Rate limited

### Task 9.5: Client Export Hooks
**Status:** ⏳ Pending
**DoD:**
- [ ] File: `client/src/hooks/useExport.ts`
- [ ] Mutation for JSON export
- [ ] Mutation for ZIP export
- [ ] Download handling (open signed URL)

### Task 9.6: Wire Export Step
**Status:** ⏳ Pending
**DoD:**
- [ ] Update `client/src/routes/Export.tsx`
- [ ] "Export JSON" button
- [ ] "Download ZIP" button
- [ ] Preview of export contents
- [ ] Import instructions displayed

### Task 9.7: Commit & Create PR-009
**Status:** ⏳ Pending
**DoD:**
- [ ] All export features committed
- [ ] Can download JSON and ZIP
- [ ] Files have correct structure
- [ ] PR-009 created

---

## Phase 10: QA & Hardening

### Task 10.1: Create Feature Branch
**Status:** ⏳ Pending
**DoD:**
- [ ] Branch `chore/qa-hardening` created

### Task 10.2: Input Validation Audit
**Status:** ⏳ Pending
**DoD:**
- [ ] All API endpoints use Zod validation
- [ ] Client-side validation matches server-side
- [ ] Clear error messages for validation failures

### Task 10.3: Rate Limiting Audit
**Status:** ⏳ Pending
**DoD:**
- [ ] All API endpoints rate-limited
- [ ] Appropriate limits per endpoint type
- [ ] Rate limit headers returned

### Task 10.4: Error Handling Audit
**Status:** ⏳ Pending
**DoD:**
- [ ] All API routes have try/catch
- [ ] Errors logged server-side
- [ ] Client shows toast on error
- [ ] Retry buttons functional

### Task 10.5: Smoke Tests
**Status:** ⏳ Pending
**DoD:**
- [ ] Full 7-step happy path completed manually
- [ ] Locale switch mid-flow tested
- [ ] Large image rejection tested
- [ ] Invalid URL tested
- [ ] Network error recovery tested

### Task 10.6: RLS Policy Testing
**Status:** ⏳ Pending
**DoD:**
- [ ] Attempt to access other user's session (should fail)
- [ ] Attempt to modify other user's documents (should fail)
- [ ] Verify all tables have policies

### Task 10.7: Documentation Updates
**Status:** ⏳ Pending
**DoD:**
- [ ] README.md updated with final instructions
- [ ] Environment variables documented
- [ ] Local development guide complete
- [ ] Deployment considerations noted

### Task 10.8: Linting & Type Checking
**Status:** ⏳ Pending
**DoD:**
- [ ] `pnpm lint` passes with 0 warnings
- [ ] `pnpm typecheck` passes
- [ ] Prettier formatting applied

### Task 10.9: Commit & Create PR-010
**Status:** ⏳ Pending
**DoD:**
- [ ] All QA improvements committed
- [ ] PR-010 created
- [ ] Ready for final review

---

## Final Deliverables Checklist

- [ ] All 11 PRs merged
- [ ] Application deployed and accessible
- [ ] All 4 locales tested
- [ ] Export files validated with Witfy team
- [ ] Performance: initial load < 2.5s
- [ ] Accessibility: keyboard navigation works, ARIA labels present
- [ ] Security: RLS policies enforced, no API key leaks
- [ ] Documentation: complete and accurate

---

**Legend:**
- ✅ Complete
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked

**Last Updated:** Phase 1 in progress

