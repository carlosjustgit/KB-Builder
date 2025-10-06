# KBBuilder_Specify_User_Journey

### 0) Global guardrails (read first)

- Do **not** modify or delete any working elements of the main Witfy app.
- Read and respect: **`.env`**, **`.env.local`**, and **`spec-visual-guideline.md`** at repo root.
- No hard-coding. No fallbacks. Follow the user journey and UI as specified here.
- All persistence must use **Supabase** (DB + Storage). **RLS is mandatory**.

### 1) Objective

Build a **guided Knowledge Base Builder** as a standalone app (accessible from website and from the main app later) that:

1. Collects the company URL and runs **web research**.
2. Guides the user through a **conversational wizard**.
3. Generates KB documents + a **Visual Brand Guideline** (from user-provided images).
4. Exports **JSON** and **ZIP** for manual onboarding into Witfy.
5. Supports locales: **en-US, en-GB, pt-BR, pt-PT**.

### 2) Personas & success criteria

- **Non-technical founder/marketer**. Needs fast, reliable outputs with minimal typing.
- Success = user completes 7 steps, downloads **witfy-kb.json** and **witfy-kb-package.zip**, feeling the outputs match their brand.

### 3) Supported languages (i18n scope)

- Locales: **en-US, en-GB, pt-BR, pt-PT**.
- Each **step** has its own translation file. No giant single file.
- UX copies must follow locale rules (e.g., “colour” vs “color”; Portuguese EU vs BR spelling/punctuation).

### 4) High-level flow (7 steps)

1. **Welcome & Locale**
    - User chooses locale; explains process time and data usage.
    - Input: company **URL**.
    - System: validate URL, create **kb_session** row.
2. **Automated Research (text)**
    - Engine: **Perplexity** (Search + Chat) with step-scoped prompts.
    - Output: brand overview + initial sources list for user to confirm.
    - User can **approve/refine** before moving on.
3. **Brand & Tone**
    - Draft **brand story**, **audience**, **tone/voice** with brief bullets.
    - User edits inline (markdown editor). Save to **kb_documents**.
4. **Services & Proof**
    - Generate structured services (one paragraph each) + 2 short proof points.
    - User reviews/edits; accept → persist.
5. **Market & Competitors**
    - Trends (2–3), 3 competitors, differentiators.
    - User approves; persist + sources.
6. **Visual Brand Guideline (images)**
    - User **pastes**, **uploads**, or **imports by URL** images from website/social.
    - Engine: **OpenAI Vision** analyses imagery; merges with brand context.
    - Output: Visual Guide (palette, lighting, composition, mood, avoid, prompts, negatives).
    - Optional: **test images** (GPT-Image or Flux). Store generated samples.
7. **Export & Download**
    - Export **`witfy-kb.json`** (all docs + visual_guide + sources).
    - Download **`witfy-kb-package.zip`** (markdown docs, presets, sources, optional samples).
    - Show “How to import into Witfy onboarding”.

### 5) Key user stories

- As a user, I can paste a URL and get a trustworthy, short brand summary with sources.
- As a user, I can upload/paste images and obtain a visual guide driven by real assets.
- As a user, I can download JSON and ZIP without creating a Witfy account.

### 6) Edge cases

- **No public info**: prompt the user to add basic details manually; mark low-confidence areas.
- **Images too large/unsupported**: clear error, accept PNG/JPG/WebP up to 10 MB; show compression hint.
- **Locale switch mid-flow**: don’t lose content; re-render UI labels only.

### 7) Done criteria (per step)

- Text output passes **lint**: short, structured, non-generic; sources present for research steps.
- Save to Supabase (row updated) with timestamp; RLS respected.
- i18n keys resolved; no missing strings.