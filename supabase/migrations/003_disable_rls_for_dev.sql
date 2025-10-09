-- Temporarily disable RLS for development
-- This allows the app to work without authentication
-- WARNING: In production, you should enable RLS and set up proper policies

ALTER TABLE kb_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_visual_guides DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_exports DISABLE ROW LEVEL SECURITY;

