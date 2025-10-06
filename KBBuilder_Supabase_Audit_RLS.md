# KBBuilder_Supabase_Audit_RLS

### 0) Guardrails

- Supabase is the **single source of truth**: sessions, docs, sources, images, exports.
- **RLS enabled on all tables**; policies tested before release.

### 1) Tables (create or align with previous attempt)

```sql
-- Sessions
create table if not exists kb_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profile_id uuid,
  language text not null,       -- 'en-US'|'en-GB'|'pt-BR'|'pt-PT'
  step text not null,           -- 'welcome'|'research'|'brand'|...
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table if not exists kb_documents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references kb_sessions(id) on delete cascade,
  doc_type text not null,       -- 'brand'|'services'|'market'|'competitors'|'tone'|'visual'
  title text,
  content_md text,              -- user-editable markdown
  content_json jsonb,           -- structured data when applicable
  status text default 'draft',  -- 'draft'|'approved'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sources (citations)
create table if not exists kb_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references kb_sessions(id) on delete cascade,
  url text not null,
  provider text,                -- 'perplexity'|'openai'|...
  snippet text,
  created_at timestamptz default now()
);

-- Images (user-provided and generated)
create table if not exists kb_images (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references kb_sessions(id) on delete cascade,
  file_path text not null,      -- Supabase storage path
  mime text not null,
  size_bytes int,
  sha256 text,
  role text not null,           -- 'user'|'generated'
  status text default 'uploaded', -- 'uploaded'|'analysed'|'rejected'
  created_at timestamptz default now()
);

-- Visual guide data
create table if not exists kb_visual_guides (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references kb_sessions(id) on delete cascade,
  rules_json jsonb not null,    -- visual guide object
  derived_palettes_json jsonb,  -- optional extractions
  created_at timestamptz default now()
);

-- Exports
create table if not exists kb_exports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references kb_sessions(id) on delete cascade,
  file_type text not null,      -- 'json'|'zip'
  storage_path text not null,
  created_at timestamptz default now()
);

```

### 2) Storage (buckets)

- `kb-builder` bucket with folders:
    - `/images/user/` and `/images/generated/`
    - `/exports/` (JSON/ZIP)

### 3) Indexes (performance)

```sql
create index on kb_documents (session_id, doc_type);
create index on kb_images (session_id, role, status);
create index on kb_sources (session_id);
create index on kb_exports (session_id, file_type);

```

### 4) RLS (examples)

```sql
-- Enable RLS
alter table kb_sessions enable row level security;
alter table kb_documents enable row level security;
alter table kb_sources enable row level security;
alter table kb_images enable row level security;
alter table kb_visual_guides enable row level security;
alter table kb_exports enable row level security;

-- Policy: owner-only access via auth.uid()
create policy "owner can manage own sessions"
on kb_sessions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "owner can manage own documents"
on kb_documents for all
using (session_id in (select id from kb_sessions where user_id = auth.uid()))
with check (session_id in (select id from kb_sessions where user_id = auth.uid()));

-- Repeat the same pattern for sources/images/visual_guides/exports

```

### 5) API endpoints (serverless)

- `POST /api/research` → Perplexity call for step-scoped research.
- `POST /api/vision/analyse` → OpenAI Vision on uploaded images.
- `POST /api/visual/test-image` → generate sample image(s).
- `POST /api/export/json` → returns `witfy-kb.json` (and stores to `/exports`).
- `POST /api/export/zip` → streams `witfy-kb-package.zip` (and stores to `/exports`).

### 6) Audit checklist (previous attempt)

- List existing KB tables; map to the new model.
- Ensure no PII leakage; confirm **RLS** policies exist and pass tests.
- Verify Storage bucket rules (read: owner only; signed URLs for downloads).