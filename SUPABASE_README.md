# Supabase Setup Guide for KB Builder

This guide provides complete instructions for setting up the Supabase database, storage, and security policies for the KB Builder application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Running Migrations](#running-migrations)
4. [Storage Bucket Setup](#storage-bucket-setup)
5. [RLS Policies Summary](#rls-policies-summary)
6. [Testing](#testing)
7. [Seed Data (Local Development)](#seed-data-local-development)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Supabase account (https://supabase.com)
- [ ] A Supabase project created
- [ ] Node.js >= 18.0.0 installed
- [ ] pnpm installed globally

---

## Environment Variables

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **Keep this secret!**

### Step 2: Configure .env Files

**`.env` (client-safe variables):**
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

**`.env.local` (server-only secrets):**
```bash
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

⚠️ **Never commit `.env.local` to version control!**

---

## Running Migrations

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/001_create_kb_tables.sql`
5. Click **Run**
6. Repeat for `supabase/migrations/002_enable_rls.sql`

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Verify Migrations

After running migrations, verify tables exist:

```sql
-- Run this in the Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'kb_%';
```

You should see:
- `kb_sessions`
- `kb_documents`
- `kb_sources`
- `kb_images`
- `kb_visual_guides`
- `kb_exports`

---

## Storage Bucket Setup

### Step 1: Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name: `kb-builder`
4. **Public bucket**: No (keep private)
5. Click **Create bucket**

### Step 2: Configure Storage Policies

Run the SQL from `scripts/setup-storage.sql` in the SQL Editor to set up:
- Folder structure (`/images/user/`, `/images/generated/`, `/exports/`)
- RLS policies for storage (owner-only access)

Or manually create policies in **Storage** → **Policies**:

**Policy: "Users can upload to their folder"**
```sql
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kb-builder' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: "Users can view their own files"**
```sql
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kb-builder' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy: "Users can delete their own files"**
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kb-builder' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## RLS Policies Summary

All tables have **Row Level Security (RLS)** enabled with owner-only access patterns.

### Policy Pattern

All policies follow this pattern:
```sql
-- Users can only access data from their own sessions
session_id IN (
  SELECT id FROM kb_sessions WHERE user_id = auth.uid()
)
```

### Tables with RLS Enabled

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `kb_sessions` | ✅ Owner | ✅ Owner | ✅ Owner | ✅ Owner |
| `kb_documents` | ✅ Via session | ✅ Via session | ✅ Via session | ✅ Via session |
| `kb_sources` | ✅ Via session | ✅ Via session | ❌ | ✅ Via session |
| `kb_images` | ✅ Via session | ✅ Via session | ✅ Via session | ✅ Via session |
| `kb_visual_guides` | ✅ Via session | ✅ Via session | ✅ Via session | ✅ Via session |
| `kb_exports` | ✅ Via session | ✅ Via session | ❌ | ✅ Via session |

### Security Guarantees

✅ Users can **only** access their own sessions  
✅ Users can **only** view/edit documents from their sessions  
✅ Unauthorized access returns **empty results** (not errors)  
✅ Service role key bypasses RLS (server-side only)

---

## Testing

### Test RLS Policies

Run these tests in the SQL Editor to verify RLS is working:

```sql
-- Test 1: Try to access another user's session (should return 0 rows)
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SELECT * FROM kb_sessions WHERE user_id = '00000000-0000-0000-0000-000000000002';
-- Expected: 0 rows

-- Test 2: Access own session (should return rows)
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SELECT * FROM kb_sessions WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 1+ rows if data exists
```

### Test Storage Access

```typescript
// Try uploading a file (should succeed for own folder)
const { data, error } = await supabase.storage
  .from('kb-builder')
  .upload(`images/user/${userId}/test.jpg`, file);

// Try accessing another user's file (should fail)
const { data: url } = await supabase.storage
  .from('kb-builder')
  .createSignedUrl(`images/user/${otherUserId}/test.jpg`, 60);
// Expected: Error or empty result
```

---

## Seed Data (Local Development)

### Run Seed Script

For local testing, populate the database with sample data:

```bash
# Make sure .env and .env.local are configured
node scripts/seed-local.mjs
```

This creates:
- 1 test session (en-US locale)
- 1 brand document
- 2 sample sources

⚠️ **Do not run seed script in production!**

---

## Troubleshooting

### Issue: "relation does not exist"

**Solution:** Migrations haven't been run. Follow [Running Migrations](#running-migrations).

### Issue: "RLS policy violation"

**Symptoms:** Queries return empty results even when data exists.

**Solutions:**
1. Check that RLS is enabled: 
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename LIKE 'kb_%';
   ```
   All should show `rowsecurity = true`.

2. Verify `auth.uid()` is set correctly. If testing locally, you may need to bypass RLS temporarily:
   ```sql
   ALTER TABLE kb_sessions DISABLE ROW LEVEL SECURITY;
   -- Re-enable after testing!
   ```

### Issue: "Storage bucket not found"

**Solution:** Create the `kb-builder` bucket in **Storage** dashboard.

### Issue: "Permission denied for storage"

**Solution:** Run `scripts/setup-storage.sql` to configure storage policies.

### Issue: Seed script fails with "user_id violates foreign key"

**Solution:** The seed script uses a test user ID that doesn't exist in `auth.users`. This is expected for local testing. If you want to use real users, update the seed script with actual auth user IDs.

---

## Database Schema Reference

### Tables Overview

```
kb_sessions (tracks wizard progress)
  ├── kb_documents (markdown + JSON content)
  ├── kb_sources (research citations)
  ├── kb_images (uploaded & generated images)
  ├── kb_visual_guides (visual brand guidelines)
  └── kb_exports (JSON/ZIP export history)
```

### Cascade Deletes

⚠️ **Important:** Deleting a session will cascade delete:
- All documents
- All sources
- All images (DB records, not storage files)
- All visual guides
- All exports

Storage files must be deleted separately if needed.

---

## Next Steps

After completing Supabase setup:

1. ✅ Verify all tables exist
2. ✅ Verify RLS policies are active
3. ✅ Test storage bucket access
4. ✅ Run seed script (optional, local only)
5. ➡️ Proceed to Phase 3: Project Scaffold

---

## Support

For issues:
- Check Supabase logs: **Logs** → **Postgres Logs**
- Review RLS policies: **Authentication** → **Policies**
- Test queries in SQL Editor with different `auth.uid()` values

---

**Last Updated:** Phase 2 - Supabase Audit  
**Status:** Complete and tested

