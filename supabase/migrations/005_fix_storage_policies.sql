-- Fix storage policies for anonymous sessions
-- This migration disables RLS on storage.objects for development

-- =====================================================
-- DISABLE RLS ON STORAGE OBJECTS
-- =====================================================

-- Disable RLS on storage.objects table for development
-- This allows anonymous access to all storage operations
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE storage.objects IS 
'RLS disabled for development - allows anonymous access to storage';

COMMENT ON TABLE storage.buckets IS 
'KB Builder storage bucket for images and exports';
