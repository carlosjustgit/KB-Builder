-- Supabase Storage Bucket Setup for KB Builder
-- Run this manually in Supabase SQL Editor after migrations

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-builder', 'kb-builder', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES: Owner-only access
-- =====================================================

-- Policy: Users can upload files to their own session folders
CREATE POLICY "Users can upload to own sessions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kb-builder' AND
    (storage.foldername(name))[1] = 'images' AND
    auth.uid()::text = (storage.foldername(name))[3]
  );

-- Policy: Users can view files from their own sessions
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kb-builder' AND
    auth.uid()::text = (storage.foldername(name))[3]
  );

-- Policy: Users can update files in their own sessions
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kb-builder' AND
    auth.uid()::text = (storage.foldername(name))[3]
  )
  WITH CHECK (
    bucket_id = 'kb-builder' AND
    auth.uid()::text = (storage.foldername(name))[3]
  );

-- Policy: Users can delete files from their own sessions
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kb-builder' AND
    auth.uid()::text = (storage.foldername(name))[3]
  );

-- =====================================================
-- FOLDER STRUCTURE
-- =====================================================
-- Expected folder structure:
-- kb-builder/
--   images/
--     user/
--       {session_id}/
--         image1.jpg
--         image2.png
--     generated/
--       {session_id}/
--         sample1.jpg
--   exports/
--     {session_id}/
--       witfy-kb.json
--       witfy-kb-package.zip

COMMENT ON TABLE storage.objects IS 'KB Builder uses session-based folder structure for file isolation';

