# KBBuilder_UI_UX_Spec

### 0) Global guardrails

- Follow **`spec-visual-guideline.md`** for colours, spacing, components.
- Use **Shadcn/UI** + **Tailwind**. No custom design systems.
- Layout and components **must** match this spec to avoid Cursor improvisation.

### 1) Layout (desktop first, responsive)

- **Two-pane** layout:
    - **Left (70%)**: Conversational chat stream + markdown editor sections.
    - **Right (30%)**: Collapsible side panel with **Tabs**: Summary | Sources | Documents | Visual | Export.
- **Footer bar** (fixed):
    - Locale selector (en-US | en-GB | pt-BR | pt-PT)
    - “Save”, “Export JSON”, “Download ZIP”.

### 2) Components

- **Chat bubble** (assistant/user) with inline action buttons: `Search`, `Regenerate`, `Edit`, `Approve`, `Next`.
- **Markdown Editor** with preview toggle (no custom toolbar beyond bold, list, link).
- **Image intake** for Visual step:
    - Dropzone + Paste from clipboard + Import by URL.
    - Grid with cards: thumbnail, size, status (`uploaded`, `analysed`, `rejected`).
    - Buttons: `Analyse images`, `Generate test images`.
- **Toast** notifications: success, error, info.
- **Modal**: confirm destructive actions; show ZIP contents preview.

### 3) States & errors

- **Loading** spinners with contextual labels (“Analysing images…”, “Researching market…”).
- **Retry** buttons for failed external calls.
- **Form validation** hints near fields.

### 4) Accessibility

- All buttons reachable by keyboard; visible focus; ARIA labels for icons.
- Sufficient contrast; no text under 14px.

### 5) Internationalisation (translation system reference)

- Use **i18next-compatible JSON namespaces** per **step** and **locale**.
- Provide a **Translation Adapter** (thin wrapper) so the builder can:
    1. Load step-scoped JSON at runtime (lazy).
    2. Remap keys if the main app uses a customised i18n setup.
- **File structure** (rooted at `/i18n`):
    
    ```
    /i18n/
      en-US/kb-builder/
        step-welcome.json
        step-research.json
        step-brand.json
        step-services.json
        step-market.json
        step-competitors.json
        step-visual.json
        step-export.json
      en-GB/kb-builder/...
      pt-BR/kb-builder/...
      pt-PT/kb-builder/...
    
    ```
    
- **Do not** aggregate all translations into one file.
- **Locale rules**:
    - en-GB uses “colour”, “organise”; en-US uses “color”, “organize”.
    - pt-PT vs pt-BR follow spelling and punctuation preferences (no em dashes in pt-PT).

### 6) Routes (client)

- `/` → Welcome & Locale
- `/research`
- `/brand`
- `/services`
- `/market`
- `/competitors`
- `/visual`
- `/export`

### 7) Buttons copy (examples)

- `Next`, `Back`, `Approve`, `Edit`, `Regenerate`, `Analyse images`, `Generate test images`, `Export JSON`, `Download ZIP`.

### 8) Non-functional

- Initial load under 2.5 s on desktop; defer heavy libs until needed.
- No blocking network calls on render; use React Query for async.