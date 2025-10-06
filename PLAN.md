# KB Builder - Master Action Plan

## Executive Summary

This plan outlines the complete implementation of the Knowledge Base Builder, a standalone application that guides users through a 7-step conversational wizard to create comprehensive brand documentation using AI-powered research (Perplexity) and visual analysis (OpenAI Vision).

**Key Deliverables:**
- Guided 7-step wizard with conversational UX
- Multilingual support (en-US, en-GB, pt-BR, pt-PT)
- AI-powered research and visual analysis
- JSON and ZIP export packages
- Fully secured Supabase backend with RLS

---

## 1. High-Level Architecture

### 1.1 Technology Stack

**Frontend (Client)**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn/UI
- TanStack Query (data fetching)
- React Hook Form + Zod (forms/validation)
- i18next (internationalization)

**Backend (Server)**
- Express + TypeScript
- Helmet (security)
- CORS (cross-origin)
- Rate limiting
- Zod (validation)

**Database & Storage**
- Supabase (PostgreSQL + Storage)
- Row Level Security (RLS) enabled on all tables
- Storage buckets for images and exports

**AI Services**
- Perplexity API (web research)
- OpenAI API (Vision for image analysis, optional image generation)

### 1.2 Application Flow

```
Welcome → Research → Brand & Tone → Services → Market → Competitors → Visual → Export
```

Each step:
1. Presents contextual UI
2. Triggers AI generation (where applicable)
3. Allows user editing/approval
4. Persists to Supabase
5. Progresses to next step

---

## 2. User Journey Breakdown (7 Steps)

### Step 1: Welcome & Locale
**Route:** `/`
**Components:** LocaleSelector, URLInput
**Actions:**
- User selects locale (en-US, en-GB, pt-BR, pt-PT)
- User inputs company URL
- System validates URL
- Creates `kb_sessions` row with `user_id`, `language`, `step='welcome'`

### Step 2: Research
**Route:** `/research`
**Components:** ChatBubble, MarkdownEditor, SourcesList
**AI:** Perplexity (brand overview prompt)
**Actions:**
- Call `/api/research` with URL and locale
- Display research output with sources
- User approves/edits content
- Save to `kb_documents` (doc_type='brand')
- Save sources to `kb_sources`

### Step 3: Brand & Tone
**Route:** `/brand`
**Components:** MarkdownEditor, ToneSelector
**AI:** Perplexity (tone/voice prompt)
**Actions:**
- Generate brand story, audience, tone traits
- User edits inline
- Persist to `kb_documents` (doc_type='tone')

### Step 4: Services & Proof
**Route:** `/services`
**Components:** ServiceCard, MarkdownEditor
**AI:** Perplexity (services prompt)
**Actions:**
- Generate structured services (1 paragraph each + 2 proof points)
- User reviews/edits
- Save to `kb_documents` (doc_type='services', content_json for structure)

### Step 5: Market & Trends
**Route:** `/market`
**Components:** TrendCards, MarkdownEditor
**AI:** Perplexity (market trends prompt)
**Actions:**
- Generate 2-3 trends + takeaways
- User approves/edits
- Save to `kb_documents` (doc_type='market')
- Save sources to `kb_sources`

### Step 6: Competitors
**Route:** `/competitors`
**Components:** CompetitorCards, DifferentiatorsList
**AI:** Perplexity (competitors prompt)
**Actions:**
- Generate 3 competitors + differentiators
- User reviews/edits
- Save to `kb_documents` (doc_type='competitors')

### Step 7: Visual Brand Guideline
**Route:** `/visual`
**Components:** ImageDropzone, ImageGrid, AnalysisDisplay
**AI:** OpenAI Vision (image analysis)
**Actions:**
- User pastes/uploads/imports images
- Store in `kb-builder/images/user/` bucket
- Compute SHA256 for dedupe
- Insert into `kb_images` (role='user')
- Call `/api/vision/analyse` on all uploaded images
- Generate visual guide (palette, lighting, composition, mood, prompts)
- Optionally call `/api/visual/test-image` for sample images
- Store generated images in `kb-builder/images/generated/`
- Save visual guide to `kb_visual_guides`

### Step 8: Export & Download
**Route:** `/export`
**Components:** ExportPreview, DownloadButtons
**Actions:**
- Call `/api/export/json` → returns `witfy-kb.json`
- Call `/api/export/zip` → streams `witfy-kb-package.zip`
- Store exports in `kb-builder/exports/` bucket
- Insert into `kb_exports` table
- Display import instructions

---

## 3. UI/UX Implementation Plan

### 3.1 Layout Structure

**Two-Pane Layout (Desktop)**
- Left: 70% - Chat stream + editor sections
- Right: 30% - Collapsible side panel with tabs:
  - Summary tab
  - Sources tab
  - Documents tab
  - Visual tab
  - Export tab

**Footer Bar (Fixed)**
- Locale selector (4 locales)
- Save button
- Export JSON button
- Download ZIP button

**Mobile:** Stack vertically, tabs become bottom sheet

### 3.2 Core Components

Component matrix:

| Component | Purpose | Radix Primitives |
|-----------|---------|------------------|
| ChatBubble | Display AI/user messages | - |
| MarkdownEditor | Edit KB content | Textarea |
| ImageDropzone | Upload/paste images | - |
| ImageGrid | Display image thumbnails | - |
| LocaleSelector | Switch language | Select |
| Toast | Notifications | Toast |
| Modal | Confirmations | Dialog |
| SourceCard | Citation display | Card |
| Tabs | Side panel sections | Tabs |

### 3.3 Accessibility Requirements

- All interactive elements keyboard accessible
- Focus rings visible (Witfy purple: `#8943FE`)
- ARIA labels for icons and actions
- Minimum contrast 4.5:1
- No text smaller than 14px
- Screen reader announcements for AI status

---

## 4. i18n Strategy

### 4.1 File Structure

```
client/src/i18n/
  en-US/kb-builder/
    step-welcome.json
    step-research.json
    step-brand.json
    step-services.json
    step-market.json
    step-competitors.json
    step-visual.json
    step-export.json
    common.json
  en-GB/kb-builder/ [same structure]
  pt-BR/kb-builder/ [same structure]
  pt-PT/kb-builder/ [same structure]
```

### 4.2 Implementation Details

- Use `i18next` + `react-i18next`
- Lazy load namespaces per route
- Browser language detection with fallback to `en-US`
- Locale switch does NOT reload state (UI strings only)
- Locale rules:
  - en-GB: "colour", "organise"
  - en-US: "color", "organize"
  - pt-PT vs pt-BR: spelling/punctuation differences

### 4.3 Translation Keys Pattern

```json
{
  "stepTitle": "Welcome to KB Builder",
  "actions": {
    "next": "Next",
    "back": "Back",
    "approve": "Approve",
    "edit": "Edit"
  },
  "validation": {
    "urlRequired": "Please enter a company URL",
    "urlInvalid": "Please enter a valid URL"
  }
}
```

---

## 5. Supabase Schema & RLS

### 5.1 Tables

**kb_sessions**
- Tracks wizard progress
- Fields: id, user_id, profile_id, language, step, created_at, updated_at
- Indexes: (user_id), (step)

**kb_documents**
- Stores all KB content
- Fields: id, session_id, doc_type, title, content_md, content_json, status, created_at, updated_at
- Indexes: (session_id, doc_type)
- doc_types: 'brand', 'services', 'market', 'competitors', 'tone', 'visual'

**kb_sources**
- Citation tracking
- Fields: id, session_id, url, provider, snippet, created_at
- Indexes: (session_id)

**kb_images**
- Image registry
- Fields: id, session_id, file_path, mime, size_bytes, sha256, role, status, created_at
- Indexes: (session_id, role, status), (sha256)
- roles: 'user', 'generated'
- status: 'uploaded', 'analysed', 'rejected'

**kb_visual_guides**
- Visual brand guidelines
- Fields: id, session_id, rules_json, derived_palettes_json, created_at
- Indexes: (session_id)

**kb_exports**
- Export history
- Fields: id, session_id, file_type, storage_path, created_at
- Indexes: (session_id, file_type)

### 5.2 RLS Policies

**Pattern:** Owner-only access via `auth.uid()`

```sql
-- Example for kb_sessions
CREATE POLICY "owner can manage own sessions"
ON kb_sessions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

Apply same pattern to all tables with session-based ownership chain.

### 5.3 Storage Buckets

**Bucket:** `kb-builder`

Folders:
- `/images/user/` - User-uploaded images
- `/images/generated/` - AI-generated samples
- `/exports/` - JSON and ZIP files

**Policy:** Owner-only read/write
**Signed URLs:** Required for all downloads

---

## 6. API Endpoints

### 6.1 Research Engine

**POST /api/research**
```typescript
Request: {
  company_url: string;
  locale: 'en-US' | 'en-GB' | 'pt-BR' | 'pt-PT';
  step: 'research' | 'brand' | 'services' | 'market' | 'competitors';
  session_id: string;
}
Response: {
  content_md: string;
  content_json?: object;
  sources: Array<{ url: string; snippet: string; provider: string }>;
}
```

Uses Perplexity API with step-scoped prompts from `KBBuilder_Prompt_Playbook.md`.

### 6.2 Visual Analysis

**POST /api/vision/analyse**
```typescript
Request: {
  image_urls: string[]; // Signed Supabase URLs
  locale: string;
  brand_context?: string; // Merged from previous steps
  session_id: string;
}
Response: {
  visual_guide: {
    palette: { primary: string[]; secondary: string[]; neutrals: string[] };
    lighting: string;
    composition: string;
    subjects: string[];
    textures: string[];
    mood: string[];
    dos: string[];
    donts: string[];
    base_prompts: string[];
    negative_prompts: string[];
  };
  guide_md: string; // Markdown version
}
```

Uses OpenAI Vision API with consolidated prompt.

### 6.3 Test Image Generation

**POST /api/visual/test-image**
```typescript
Request: {
  base_prompt: string;
  negative_prompt?: string;
  count?: number; // default 1
  session_id: string;
}
Response: {
  images: Array<{ url: string; storage_path: string }>;
}
```

Optional feature using OpenAI Images (or Flux).

### 6.4 Export JSON

**POST /api/export/json**
```typescript
Request: {
  session_id: string;
}
Response: {
  download_url: string; // Signed URL
  filename: string; // witfy-kb.json
}
```

Assembles all session data into structured JSON.

### 6.5 Export ZIP

**POST /api/export/zip**
```typescript
Request: {
  session_id: string;
}
Response: {
  download_url: string; // Signed URL
  filename: string; // witfy-kb-package.zip
}
```

Creates ZIP with:
- /kb/*.md
- /visual/visual-brand-guideline.md
- /visual/presets.json
- /sources/citations.json
- /images/samples/* (if generated)

---

## 7. AI Prompt Strategy

### 7.1 Perplexity Prompts

**Brand Overview**
- Max 4 sentences
- Include: mission, audience, positioning, 3 differentiators
- Return 3-5 sources with URLs and snippets
- Locale-aware

**Market Trends**
- 2-3 current trends
- 2 lines per trend
- 2-3 actionable takeaways
- Recent sources with dates

**Services**
- 1 paragraph per service
- Benefit + target audience
- Concrete, non-generic language

**Competitors**
- 3 relevant competitors
- What they do well
- How company differentiates (2-3 bullets)

**Tone & Voice**
- Infer from site copy
- Trait bullets (warm, expert, etc.)
- 3 example sentences

### 7.2 OpenAI Vision Prompt

**Image Analysis**
- Extract: palette (hex), lighting, composition, textures, subjects
- Mood words
- Do's and Don'ts
- 3 base prompts + negative prompts
- Output: JSON + Markdown guide
- Ground in visible patterns (minimize subjectivity)

### 7.3 Fusion Rule

Merge textual brand context (Perplexity) with visual features (Vision) into single `visual_guide` object. **Prioritize user-provided images** over web assumptions.

---

## 8. Error Handling & Quality Gates

### 8.1 Input Validation

- All API endpoints use Zod schemas
- URL validation on company URL input
- Image size limit: 10 MB
- Supported formats: PNG, JPG, WebP
- Rate limiting: 100 requests per 15 minutes per IP

### 8.2 Error Surfaces

- Toast notifications for all errors
- Retry buttons for failed AI calls
- Clear validation hints near form fields
- Loading spinners with contextual labels ("Analysing images...", "Researching market...")

### 8.3 Quality Checks

- Text output: short, structured, non-generic
- Sources present for all research steps
- i18n keys resolved (no missing strings)
- RLS policies tested (owner-only access verified)
- No hard-coded fallbacks (no `||` or `??` for IDs/keys)

---

## 9. Development Phases

| Phase | Branch | Deliverable | PR |
|-------|--------|-------------|-----|
| 0 | chore/bootstrap | Project setup, dependencies | PR-000 |
| 1 | docs/plan | Planning documents | PR-001 |
| 2 | feat/supabase-audit | DB schema, migrations, RLS | PR-002 |
| 3 | feat/scaffold | Folder structure, base routes | PR-003 |
| 4 | feat/ui-shell | UI components, layout | PR-004 |
| 5 | feat/i18n-copy | Translation files | PR-005 |
| 6 | feat/supabase-integration | Client integration | PR-006 |
| 7 | feat/research-engine | Perplexity API | PR-007 |
| 8 | feat/visual-guide | OpenAI Vision | PR-008 |
| 9 | feat/exporters | JSON + ZIP | PR-009 |
| 10 | chore/qa-hardening | QA, tests, docs | PR-010 |

---

## 10. Success Criteria

### User Experience
- [ ] Non-technical user completes 7 steps without confusion
- [ ] Download JSON and ZIP without Witfy account
- [ ] Locale switch mid-flow preserves content
- [ ] Clear error messages with retry options

### Technical
- [ ] All routes implemented and functional
- [ ] All API endpoints secured and validated
- [ ] RLS policies prevent unauthorized access
- [ ] No hard-coded values or fallbacks for IDs
- [ ] i18n complete for all 4 locales

### Output Quality
- [ ] Research outputs include sources
- [ ] Visual guide grounded in uploaded images
- [ ] Exports match Witfy onboarding format
- [ ] All content is locale-appropriate

---

## 11. Risks & Assumptions

See `RISKS.md` for detailed risk register.

---

## 12. References

- `KBBuilder_Specify_User_Journey.md` - 7-step flow, personas
- `KBBuilder_UI_UX_Spec.md` - Layout, components, a11y
- `KBBuilder_Supabase_Audit_RLS.md` - Schema, RLS, API endpoints
- `KBBuilder_Prompt_Playbook.md` - AI prompts
- `ui-kit-visual-guide.md` - Design system, brand colors

---

**Last Updated:** $(date)
**Status:** Ready for implementation

