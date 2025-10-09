-- Create proper storage policies for anonymous users
-- This migration creates policies that allow anonymous users to upload files

-- =====================================================
-- DROP EXISTING STORAGE POLICIES (if any)
-- =====================================================

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow uploads to kb-builder" ON storage.objects;
DROP POLICY IF EXISTS "Allow viewing kb-builder files" ON storage.objects;
DROP POLICY IF EXISTS "Allow updating kb-builder files" ON storage.objects;
DROP POLICY IF EXISTS "Allow deleting kb-builder files" ON storage.objects;

-- =====================================================
-- CREATE NEW POLICIES FOR ANONYMOUS USERS
-- =====================================================

-- Policy: Allow anonymous users to upload files to kb-builder bucket
CREATE POLICY "Anonymous users can upload to kb-builder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kb-builder' AND
    auth.role() = 'anon'
  );

-- Policy: Allow anonymous users to view files in kb-builder bucket
CREATE POLICY "Anonymous users can view kb-builder files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kb-builder' AND
    auth.role() = 'anon'
  );

-- Policy: Allow anonymous users to update files in kb-builder bucket
CREATE POLICY "Anonymous users can update kb-builder files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kb-builder' AND
    auth.role() = 'anon'
  )
  WITH CHECK (
    bucket_id = 'kb-builder' AND
    auth.role() = 'anon'
  );

-- Policy: Allow anonymous users to delete files in kb-builder bucket
CREATE POLICY "Anonymous users can delete kb-builder files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kb-builder' AND
    auth.role() = 'anon'
  );

-- =====================================================
-- VERIFY BUCKET EXISTS
-- =====================================================

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-builder', 'kb-builder', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Anonymous users can upload to kb-builder" ON storage.objects IS 
'Allows anonymous users to upload files to kb-builder bucket';

COMMENT ON POLICY "Anonymous users can view kb-builder files" ON storage.objects IS 
'Allows anonymous users to view files in kb-builder bucket';

COMMENT ON POLICY "Anonymous users can update kb-builder files" ON storage.objects IS 
'Allows anonymous users to update files in kb-builder bucket';

COMMENT ON POLICY "Anonymous users can delete kb-builder files" ON storage.objects IS 
'Allows anonymous users to delete files in kb-builder bucket';
